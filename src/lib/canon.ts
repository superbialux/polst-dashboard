/* ── Canon — the one vocabulary the whole dashboard speaks ─────────────
   Lifecycle statuses, decision signals, metric definitions, and shared
   formatters. Every page and kit component consumes these; nothing may
   restate a status label, signal threshold, or metric formula locally. */

/** The authored anchor: every seed date in workspace.ts is written against
 *  this model date. It is a constant of the AUTHORED data, never the clock. */
export const SEED_ANCHOR = "2026-06-15";

const pad2 = (n: number) => String(n).padStart(2, "0");
const nowAtLoad = new Date();

/** The live demo "today" — the real date at load. The whole seed model
 *  shifts by SEED_SHIFT days (workspace.shiftSeed), so every relative fact
 *  ("starts in 3 days", calendar urgency) holds on any day the prototype
 *  runs — a stale June "today" during a July demo taught the wrong product. */
export const TODAY = `${nowAtLoad.getFullYear()}-${pad2(nowAtLoad.getMonth() + 1)}-${pad2(
  nowAtLoad.getDate(),
)}`;

/** Whole days the authored model shifts to land its anchor on TODAY. */
export const SEED_SHIFT = Math.round(
  (Date.parse(TODAY) - Date.parse(SEED_ANCHOR)) / 86_400_000,
);

/** One authored ISO date, moved by the model shift. */
export const shiftSeedDate = (iso: string) =>
  SEED_SHIFT === 0
    ? iso
    : new Date(Date.parse(iso) + SEED_SHIFT * 86_400_000).toISOString().slice(0, 10);

/* ── Lifecycle status ─────────────────────────────────────────────── */

/** Where an object sits in its workflow. One set for campaigns and Polsts.
 *  Staging's vocabulary: a run that finished is "Ended" (neutral — a fact,
 *  not an achievement). "Scheduled" is the planning layer's derived state:
 *  dates confirmed, start still ahead. */
export type Status = "Draft" | "Scheduled" | "Active" | "Ended" | "Archived";

export const STATUSES: Status[] = ["Draft", "Scheduled", "Active", "Ended", "Archived"];

export type StatusTone = "neutral" | "accent" | "success" | "warning" | "danger";

/** The single status → tone mapping. Ended is neutral by design: finishing
 *  a run is a fact, not a verdict — verdictLabel carries the verdict. */
export const STATUS_TONE: Record<Status, StatusTone> = {
  Draft: "neutral",
  Scheduled: "accent",
  Active: "success",
  Ended: "neutral",
  Archived: "neutral",
};

/* ── Decision signal ──────────────────────────────────────────────── */

/** Whether the evidence can be trusted yet — separate from lifecycle. */
export type DecisionSignal =
  | "Not started"
  | "Collecting"
  | "Too close"
  | "Directional"
  | "Leading"
  | "Decisive"
  | "Inconclusive";

export type Confidence = "High" | "Medium" | "Low" | "—";

/** The one place signal thresholds live. Margin is in percentage points on
 *  the decision question; voters/target measure evidence volume. */
export function signalFor(input: {
  status: Status;
  voters: number;
  target?: number;
  marginPts: number;
}): DecisionSignal {
  const { status, voters, target, marginPts } = input;
  if (status === "Draft" || status === "Scheduled" || voters === 0) return "Not started";
  const progress = target && target > 0 ? voters / target : 1;
  if (status === "Ended") {
    return marginPts >= 8 ? "Decisive" : marginPts >= 4 ? "Directional" : "Inconclusive";
  }
  if (progress < 0.25 || voters < 100) return "Collecting";
  if (marginPts < 4) return "Too close";
  if (marginPts >= 10 && progress >= 0.7) return "Leading";
  return "Directional";
}

/** Evidence strength: volume vs target and source diversity. */
export function confidenceFor(input: {
  status: Status;
  voters: number;
  target?: number;
  sourceCount: number;
}): Confidence {
  const { status, voters, target, sourceCount } = input;
  if (voters === 0 || status === "Draft" || status === "Scheduled") return "—";
  const progress = target && target > 0 ? voters / target : 0;
  if (progress >= 1 && sourceCount >= 2) return "High";
  if (progress >= 0.7 || sourceCount >= 2) return "Medium";
  return "Low";
}

/** A campaign whose evidence supports making the call now. */
export const isReadyToDecide = (input: { status: Status; signal: DecisionSignal }) =>
  (input.status === "Active" || input.status === "Ended") &&
  (input.signal === "Leading" || input.signal === "Decisive");

/* ── Metric contract ──────────────────────────────────────────────────
   One definition per metric. Any number rendered with a definition pulls
   the words from here, so the contract can never drift between screens. */

export const METRIC_INFO = {
  views: "Times a Polst was shown, across every campaign, standalone Polst, and source in this workspace.",
  votes: "Option taps. A voter answering a three-question campaign counts as three votes.",
  voters: "Unique people who cast at least one vote in scope.",
  started: "Unique participants who answered the first question of the campaign. A view alone does not count.",
  completed: "Unique participants who answered every question in the campaign.",
  completionRate: "Voters who completed the full sequence ÷ voters who started it.",
  finishRate:
    "Completed ÷ Started — how many participants who began the campaign finished it. A participant-funnel metric; it says nothing about how much campaign time has elapsed.",
  engagementRate: "Total votes ÷ total views for the period.",
  votesPerView: "Votes ÷ views for one piece of content. Multi-question campaigns can exceed 100%.",
  interactions: "Likes, shares, and reposts of the Polst.",
  shareRate: "Voters who shared ÷ voters who completed.",
  viewWithoutVote: "Views that never became a vote: (views − voters) ÷ views.",
  votesPerVoter:
    "Total votes ÷ voters for the period. A voter answering a three-question campaign counts as three votes.",
  voteVelocity:
    "Average votes per hour over the trailing window, from this Polst's daily votes.",
  confidence:
    "Evidence volume, not statistics. High: voter target reached with 2+ sources. Medium: 70% of target, or 2+ sources. Low: below both. No significance test is run.",
  participantGoal:
    "An optional planning target set by the workspace. It never caps collection — the campaign keeps collecting until its scheduled or manual end, and may exceed the goal.",
} as const;

/* ── Formatters (the only number/date renderers) ──────────────────── */

export const fmtInt = (n: number) => n.toLocaleString("en-US");

/** 13500 → "14K"; below 10,000 stays exact. */
export const fmtCompact = (n: number) =>
  n >= 10_000 ? `${Math.round(n / 1_000)}K` : fmtInt(n);

export const fmtPct = (value: number, digits = 0) =>
  `${value.toFixed(digits)}%`;

/** Ratio → "68%" (guarded). */
export const pct = (numerator: number, denominator: number, digits = 0) =>
  denominator > 0 ? fmtPct((numerator / denominator) * 100, digits) : "—";

const monthShort = (m: number) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];

/** ISO → "Jun 3" (current year) or "Jun 3, 2025" (other years). */
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const sameYear = y === Number(TODAY.slice(0, 4));
  return `${monthShort(m)} ${d}${sameYear ? "" : `, ${y}`}`;
};

/** ISO pair → "Jun 3 – Jun 12" / "Jun 22–26" (same month collapses). */
export const fmtDateRange = (start?: string, end?: string) => {
  if (!start && !end) return "Not scheduled";
  if (start && !end) return `Starts ${fmtDate(start)}`;
  if (!start && end) return `Ends ${fmtDate(end)}`;
  if (start === end) return fmtDate(start!);
  return start!.slice(0, 7) === end!.slice(0, 7)
    ? `${fmtDate(start!)}–${Number(end!.slice(8, 10))}`
    : `${fmtDate(start!)} – ${fmtDate(end!)}`;
};

/** Whole days from `from` to `to` (ISO), negative if `to` is earlier. */
export const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/** "in 2 days" / "today" / "3 days ago" relative to TODAY. */
export const relativeToToday = (iso: string) => {
  const d = daysBetween(TODAY, iso);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
};
