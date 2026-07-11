/* Invariant checks for the workspace data model. Run: npx tsx scripts/verify-model.ts
   Every screen derives from this model, so these assertions are what make
   "the same entity is consistent everywhere" true by construction. */

import {
  STATUSES,
  TODAY,
  confidenceFor,
  isReadyToDecide,
  signalFor,
} from "../src/lib/canon";
import { addDays, hourlyVotes, sumWindow, windowBounds } from "../src/lib/engine";
import {
  ATTENTION_ITEMS,
  CAMPAIGNS,
  CALENDAR_ITEMS,
  KEY_DATES,
  READY_TO_DECIDE,
  REPORTS,
  SINGLE_POLSTS,
  SOURCES,
  browserMix,
  campaignSeries,
  countryMix,
  deviceMix,
  platformMix,
  polstSeries,
  voteVelocity,
  workspaceWindow,
} from "../src/lib/workspace";
import { ANALYTICS_DEFAULTS, analyticsRows, segmentTotal } from "../src/lib/analytics";

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`✗ ${msg}`);
};
const check = (cond: boolean, msg: string) => {
  if (!cond) fail(msg);
};

/* ── 1. Vocabulary ────────────────────────────────────────────────── */
for (const c of CAMPAIGNS) check(STATUSES.includes(c.status), `campaign ${c.id}: status "${c.status}" not canonical`);
for (const p of SINGLE_POLSTS) check(STATUSES.includes(p.status), `polst ${p.id}: status "${p.status}" not canonical`);

/* ── 2. Date coherence vs TODAY ───────────────────────────────────── */
for (const c of CAMPAIGNS) {
  if (c.startAt) check(c.createdAt <= c.startAt, `campaign ${c.id}: created after start`);
  if (c.startAt && c.endAt) check(c.startAt <= c.endAt, `campaign ${c.id}: start after end`);
  if (c.status === "Active") {
    check(!!c.startAt && c.startAt <= TODAY, `campaign ${c.id}: Active but start not in past`);
    check(!!c.endAt && c.endAt >= TODAY, `campaign ${c.id}: Active but already ended`);
  }
  if (c.status === "Scheduled") {
    check(!!c.startAt && c.startAt > TODAY, `campaign ${c.id}: Scheduled but start not in future`);
    check(c.voters === 0, `campaign ${c.id}: Scheduled with voters`);
  }
  if (c.status === "Ended") check(!!c.endAt && c.endAt <= TODAY, `campaign ${c.id}: Ended but end not in past`);
  if (c.status === "Draft" || c.status === "Archived") check(c.voters === 0, `campaign ${c.id}: ${c.status} with voters`);
}
for (const p of SINGLE_POLSTS) {
  if (p.status === "Active") check(!!p.startAt && p.startAt <= TODAY && !!p.endAt && p.endAt >= TODAY, `polst ${p.id}: Active outside its dates`);
  if (p.status === "Scheduled") check(!!p.startAt && p.startAt > TODAY && p.votes === 0, `polst ${p.id}: Scheduled incoherent`);
  if (p.status === "Ended") check(!!p.endAt && p.endAt <= TODAY, `polst ${p.id}: Ended but end not past`);
  if (p.status === "Draft" || p.status === "Archived") check(p.votes === 0, `polst ${p.id}: ${p.status} with votes`);
}

/* ── 3. Chain arithmetic ──────────────────────────────────────────── */
for (const c of CAMPAIGNS) {
  if (!c.chain.length) continue;
  const v = c.votesByQuestion;
  check(v.length === c.chain.length, `campaign ${c.id}: votesByQuestion length mismatch`);
  if (c.voters > 0) {
    check(v[0] === c.voters, `campaign ${c.id}: first question votes ≠ voters`);
    check(v[v.length - 1] === c.completed, `campaign ${c.id}: last question votes ≠ completed`);
    for (let i = 1; i < v.length; i++) check(v[i] <= v[i - 1], `campaign ${c.id}: chain votes not monotonic at Q${i + 1}`);
  }
  check(c.votes === v.reduce((a, b) => a + b, 0), `campaign ${c.id}: votes ≠ Σ question votes`);
  check(c.completed <= c.voters, `campaign ${c.id}: completed > voters`);
  check(c.voters <= c.views, `campaign ${c.id}: voters > views`);
  check(c.votes <= c.views, `campaign ${c.id}: votes > views (engagement >100%)`);
}

/* ── 4-5. Winner, signal, confidence derive from the decision question ── */
for (const c of CAMPAIGNS) {
  const q = c.chain[c.decisionIndex];
  if (c.voters > 0 && q) {
    const margin = Math.abs(2 * q.splitA - 100);
    const lead = q.splitA >= 50 ? q.optionA : q.optionB;
    check(!!c.winner && c.winner.option === lead, `campaign ${c.id}: winner ≠ decision-question leader`);
    check(!!c.winner && c.winner.marginPts === margin, `campaign ${c.id}: winner margin ${c.winner?.marginPts} ≠ ${margin}`);
  }
  const expectedSignal = signalFor({ status: c.status, voters: c.voters, target: c.target, marginPts: c.winner?.marginPts ?? 0 });
  check(c.signal === expectedSignal, `campaign ${c.id}: signal ${c.signal} ≠ signalFor ${expectedSignal}`);
  const expectedConf = confidenceFor({ status: c.status, voters: c.voters, target: c.target, sourceCount: c.sources.length });
  check(c.confidence === expectedConf, `campaign ${c.id}: confidence ${c.confidence} ≠ ${expectedConf}`);
}

/* ── 6. Source attribution sums exactly ───────────────────────────── */
for (const c of CAMPAIGNS) {
  if (!c.sources.length) {
    if (c.status === "Active" && c.voters > 0) fail(`campaign ${c.id}: Active with voters but no sources`);
    continue;
  }
  const sum = (k: "voters" | "views" | "completed") => c.sources.reduce((a, s) => a + s[k], 0);
  check(sum("voters") === c.voters, `campaign ${c.id}: Σ source voters ${sum("voters")} ≠ ${c.voters}`);
  check(sum("views") === c.views, `campaign ${c.id}: Σ source views ≠ campaign views`);
  check(sum("completed") === c.completed, `campaign ${c.id}: Σ source completed ≠ campaign completed`);
}
for (const s of SOURCES) {
  if (!s.linked) continue;
  const exists =
    s.linked.type === "campaign"
      ? CAMPAIGNS.some((c) => c.id === s.linked!.id)
      : SINGLE_POLSTS.some((p) => p.id === s.linked!.id);
  check(exists, `source ${s.id}: linked ${s.linked.type} ${s.linked.id} does not exist`);
  check(s.completed <= s.voters && s.voters <= s.views, `source ${s.id}: funnel not monotonic`);
}

/* ── 7. Window aggregates reconcile with the daily series ─────────── */
for (const range of ["7D", "30D", "90D", "All"] as const) {
  const w = workspaceWindow(range);
  const [start, end] = windowBounds(range);
  const expectViews =
    CAMPAIGNS.reduce((a, c) => a + sumWindow(campaignSeries(c, "views"), start, end), 0) +
    SINGLE_POLSTS.reduce((a, p) => a + sumWindow(polstSeries(p, "views"), start, end), 0);
  check(w.views === expectViews, `${range}: workspaceWindow views ${w.views} ≠ Σ series ${expectViews}`);
  check(w.votes <= w.views, `${range}: votes > views`);
  check(w.voters <= w.views, `${range}: voters > views`);
  check(w.completed <= w.voters, `${range}: completed > voters`);
}

/* ── 8. Analytics totals equal workspace totals for the same window ── */
for (const range of ["7D", "30D", "90D", "All"] as const) {
  const rows = analyticsRows({ ...ANALYTICS_DEFAULTS, range });
  const w = workspaceWindow(range);
  check(segmentTotal(rows, "views") === w.views, `${range}: analytics views ≠ workspace views`);
  check(segmentTotal(rows, "votes") === w.votes, `${range}: analytics votes ≠ workspace votes`);
  check(segmentTotal(rows, "voters") === w.voters, `${range}: analytics voters ≠ workspace voters`);
}

/* ── 9. Attention items reference live entities, no stale months ───── */
for (const item of ATTENTION_ITEMS) {
  check(!/Feb|Mar|Apr(?!il snack)/.test(item.reason ?? ""), `attention ${item.id}: stale month in copy`);
  check(!!item.to, `attention ${item.id}: no destination`);
}

/* ── 10. Calendar shows every dated entity ────────────────────────── */
const calendarIds = new Set(CALENDAR_ITEMS.map((i) => i.id));
for (const c of CAMPAIGNS) {
  if (c.startAt && c.status !== "Draft" && c.status !== "Archived")
    check(calendarIds.has(c.id), `calendar: missing campaign ${c.id}`);
}
for (const p of SINGLE_POLSTS) {
  if (p.startAt && p.status !== "Draft" && p.status !== "Archived")
    check(calendarIds.has(p.id), `calendar: missing polst ${p.id}`);
}
for (const k of KEY_DATES) check(calendarIds.has(k.id), `calendar: missing key date ${k.id}`);
for (const item of CALENDAR_ITEMS) {
  if (item.kind === "campaign") check(CAMPAIGNS.some((c) => c.id === item.id && c.startAt), `calendar: campaign ${item.id} has no dates`);
  if (item.kind === "polst") check(SINGLE_POLSTS.some((p) => p.id === item.id && p.startAt), `calendar: polst ${item.id} has no dates`);
}

/* ── 11. Reports post-date their subjects ─────────────────────────── */
for (const r of REPORTS) {
  if (r.linked?.type === "campaign") {
    const c = CAMPAIGNS.find((x) => x.id === r.linked!.id);
    check(!!c, `report ${r.id}: unknown campaign`);
    if (c?.startAt) check(r.createdAt >= c.startAt, `report ${r.id}: created before its campaign started`);
  }
}

/* ── 12. Unique ids everywhere ────────────────────────────────────── */
const allIds = [
  ...CAMPAIGNS.map((c) => c.id),
  ...CAMPAIGNS.flatMap((c) => c.chain.map((q) => q.id)),
  ...SINGLE_POLSTS.map((p) => p.id),
  ...SOURCES.map((s) => s.id),
];
const dupes = allIds.filter((id, i) => allIds.indexOf(id) !== i);
check(dupes.length === 0, `duplicate ids: ${[...new Set(dupes)].join(", ")}`);

/* ── 13. Ready-to-decide derives from the shared predicate ────────── */
const expectedReady = CAMPAIGNS.filter((c) => isReadyToDecide(c)).map((c) => c.id);
check(
  JSON.stringify(READY_TO_DECIDE.map((c) => c.id).sort()) === JSON.stringify(expectedReady.sort()),
  `READY_TO_DECIDE ≠ campaigns matching isReadyToDecide (${expectedReady.join(",")})`,
);

/* ── 14. Audience mixes reconcile with the window ─────────────────── */
for (const range of ["7D", "30D", "90D", "All"] as const) {
  const w = workspaceWindow(range);
  // Country mix: exact allocation of the window's voters AND completed.
  const geo = countryMix(range);
  const geoVoters = geo.reduce((a, r) => a + r.voters, 0);
  const geoCompleted = geo.reduce((a, r) => a + r.completed, 0);
  check(geoVoters === w.voters, `${range}: Σ country voters ${geoVoters} ≠ window voters ${w.voters}`);
  check(geoCompleted === w.completed, `${range}: Σ country completed ${geoCompleted} ≠ window completed ${w.completed}`);
  for (const r of geo) check(r.completed <= r.voters, `${range}: ${r.country} completed > voters`);
  // Share tables state percentages that must total 100.
  for (const [name, mix] of [
    ["device", deviceMix(range)],
    ["platform", platformMix(range)],
    ["browser", browserMix(range)],
  ] as const) {
    const total = mix.reduce((a, s) => a + s.value, 0);
    check(total === 100, `${range}: ${name} mix shares sum to ${total}, not 100`);
  }
}

/* ── 15. Hourly velocity derives from the daily series ────────────── */
for (const p of SINGLE_POLSTS) {
  const v = voteVelocity(p);
  if (p.status !== "Active" || p.votes === 0) {
    check(v === null, `polst ${p.id}: velocity reported for a non-active or zero-vote run`);
    continue;
  }
  check(v !== null, `polst ${p.id}: Active with votes but no velocity`);
  const series = polstSeries(p, "votes");
  const on = (iso: string) => {
    const i = series.dates.indexOf(iso);
    return i === -1 ? 0 : series.values[i];
  };
  const hours = hourlyVotes(p.id, on(TODAY), on(addDays(TODAY, -1)));
  check(hours.length === 24, `polst ${p.id}: hourly window is ${hours.length}h, not 24`);
  check(hours.every((h) => h >= 0), `polst ${p.id}: negative hourly votes`);
  const last24 = hours.reduce((a, b) => a + b, 0);
  check(
    last24 <= on(TODAY) + on(addDays(TODAY, -1)),
    `polst ${p.id}: trailing 24h votes exceed the two source days`,
  );
  check(
    v !== null && Math.abs(v.perHour24 - last24 / 24) < 0.06,
    `polst ${p.id}: perHour24 ${v?.perHour24} ≠ Σ trailing 24h / 24`,
  );
}

if (failures) {
  console.error(`\n${failures} invariant(s) violated.`);
  process.exit(1);
}
console.log("All model invariants hold.");
