import { sumWindow, windowBounds } from "@/lib/engine";
import { TODAY, fmtInt, isReadyToDecide } from "@/lib/canon";
import {
  answerHeat,
  campaignSeries,
  polstSeries,
  HEATMAP_BUCKETS,
  HEATMAP_DAYS,
  formatNumber,
  type Campaign,
  type CampaignReview,
  type ChainQuestion,
  type SinglePolst,
  type Source,
} from "@/lib/workspace";

/* ══════════════════════════════════════════════════════════════════
   INSIGHTS — the interpretation layer.
   Two voices, both computed from live store data (never authored):

   · Trends (Apple Fitness): one metric per row — arrow colored by
     DESIRABILITY (falling drop-off is good), the 7-day figure against
     the 30-day baseline, then one concrete suggestion the numbers
     actually support.
   · Insights (Hotjar): question-phrased cards — the headline asks,
     the evidence answers, the interpretation says what it means, and
     a drill-down closes the loop. One claim per card.

   Every sentence carries its numbers so a claim can be checked against
   the tables it summarizes. If the data can't support a row (empty
   window, zero denominator), the row is dropped — never padded.
   ══════════════════════════════════════════════════════════════════ */

export type TrendEntry = {
  metric: string;
  /** Arrow direction is the movement; tone is whether that's good. */
  arrow: "up" | "down" | "flat";
  tone: "good" | "bad" | "neutral";
  /** The 7-day figure, unit fused ("2,340 votes/week"). */
  current: string;
  /** The 30-day baseline it's compared against. */
  baseline: string;
  /** The coaching line: fact with both numbers → one concrete step. */
  coaching: string;
  to: string;
};

export type Insight = {
  id: string;
  /** Question-phrased headline — the card answers it. */
  question: string;
  /** Lowercase tinted status word ("outperforming", "leaking"). */
  status: { label: string; tone: "success" | "warning" | "danger" | "accent" | "neutral" };
  /** The stat that answers the question. */
  evidence: string;
  /** What the number means, in plain words. */
  interpretation: string;
  action: { label: string; to: string };
};

/* ── shared arithmetic ───────────────────────────────────────────── */

const pct1 = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

/** Sum a metric across every campaign and standalone Polst in a window. */
function totalWindow(
  campaigns: Campaign[],
  polsts: SinglePolst[],
  metric: "views" | "votes" | "voters" | "completed",
  start: string,
  end: string,
): number {
  let sum = 0;
  for (const c of campaigns) sum += sumWindow(campaignSeries(c, metric), start, end);
  for (const p of polsts) {
    // Standalone Polsts have no chain: voters = votes, completed = votes.
    const m = metric === "voters" || metric === "completed" ? "votes" : metric;
    sum += sumWindow(polstSeries(p, m), start, end);
  }
  return sum;
}

/** The busiest cell of the 30-day answer heatmap, as spoken words. */
function peakWindowLabel(): string | null {
  const heat = answerHeat("30D");
  let best = 0;
  let day = -1;
  let bucket = -1;
  heat.forEach((row, d) =>
    row.forEach((v, b) => {
      if (v > best) {
        best = v;
        day = d;
        bucket = b;
      }
    }),
  );
  if (day < 0) return null;
  const hour = HEATMAP_BUCKETS[bucket].replace("a", "am").replace("p", "pm");
  return `${HEATMAP_DAYS[day]} around ${hour}`;
}

/** Largest single-step voter loss across live chains. */
function biggestDrop(campaigns: Campaign[]) {
  let worst: { campaign: Campaign; question: number; lost: number; pct: number } | null = null;
  for (const c of campaigns) {
    if (c.status !== "Active" || c.votesByQuestion.length < 2) continue;
    for (let i = 1; i < c.votesByQuestion.length; i++) {
      const prev = c.votesByQuestion[i - 1];
      const lost = prev - c.votesByQuestion[i];
      if (prev > 0 && lost > 0 && (!worst || lost > worst.lost)) {
        worst = { campaign: c, question: i + 1, lost, pct: Math.round((lost / prev) * 100) };
      }
    }
  }
  return worst;
}

/* ── Trends (Apple Fitness voice) ────────────────────────────────── */

export function deriveTrends(campaigns: Campaign[], polsts: SinglePolst[]): TrendEntry[] {
  const [s7, e7] = windowBounds("7D");
  const [s30, e30] = windowBounds("30D");
  const entries: TrendEntry[] = [];
  const peak = peakWindowLabel();

  // 1 · Vote pace — this week's collection against the 30-day weekly norm.
  const votes7 = totalWindow(campaigns, polsts, "votes", s7, e7);
  const votes30 = totalWindow(campaigns, polsts, "votes", s30, e30);
  const weeklyNorm = Math.round((votes30 / 30) * 7);
  if (votes30 > 0) {
    const arrow = votes7 > weeklyNorm * 1.05 ? "up" : votes7 < weeklyNorm * 0.95 ? "down" : "flat";
    entries.push({
      metric: "Vote pace",
      arrow,
      tone: arrow === "up" ? "good" : arrow === "down" ? "bad" : "neutral",
      current: `${formatNumber(votes7)} votes/week`,
      baseline: `${formatNumber(weeklyNorm)} 30-day norm`,
      coaching:
        arrow === "down"
          ? `You collected ${formatNumber(votes7)} votes this week, below your 30-day pace of ${formatNumber(weeklyNorm)}.${peak ? ` ${peak} is your busiest window — schedule the next run to open there.` : ""}`
          : `You collected ${formatNumber(votes7)} votes this week, ${arrow === "up" ? "above" : "level with"} your 30-day pace of ${formatNumber(weeklyNorm)}.${arrow === "up" ? " Keep the current sources running." : peak ? ` ${peak} is your busiest window — lean on it.` : ""}`,
      to: "/analytics",
    });
  }

  // 2 · Completion — of everyone who starts a chain, how many finish.
  const done7 = pct1(
    totalWindow(campaigns, [], "completed", s7, e7),
    totalWindow(campaigns, [], "voters", s7, e7),
  );
  const done30 = pct1(
    totalWindow(campaigns, [], "completed", s30, e30),
    totalWindow(campaigns, [], "voters", s30, e30),
  );
  if (done7 !== null && done30 !== null) {
    const arrow = done7 > done30 + 1 ? "up" : done7 < done30 - 1 ? "down" : "flat";
    const drop = biggestDrop(campaigns);
    entries.push({
      metric: "Completion",
      arrow,
      tone: arrow === "up" ? "good" : arrow === "down" ? "bad" : "neutral",
      current: `${done7}% this week`,
      baseline: `${done30}% 30-day average`,
      coaching:
        arrow === "down" && drop
          ? `${done7}% of starters finished this week, below your 30-day average of ${done30}%. The biggest leak is question ${drop.question} of ${drop.campaign.name} (−${drop.pct}%) — tighten or reorder it.`
          : `${done7}% of starters finished this week, ${arrow === "up" ? "above" : "in line with"} your 30-day average of ${done30}%.${arrow === "up" ? " Short chains are landing — keep them under five questions." : ""}`,
      to: "/analytics",
    });
  }

  // 3 · Views → votes — how well a look converts into an answer.
  const eng7 = pct1(votes7, totalWindow(campaigns, polsts, "views", s7, e7));
  const eng30 = pct1(votes30, totalWindow(campaigns, polsts, "views", s30, e30));
  if (eng7 !== null && eng30 !== null) {
    const arrow = eng7 > eng30 + 1 ? "up" : eng7 < eng30 - 1 ? "down" : "flat";
    entries.push({
      metric: "Views that vote",
      arrow,
      tone: arrow === "up" ? "good" : arrow === "down" ? "bad" : "neutral",
      current: `${eng7}% this week`,
      baseline: `${eng30}% 30-day average`,
      coaching:
        arrow === "down"
          ? `${eng7}% of views became votes this week, under your 30-day average of ${eng30}%. Check where new views come from — a broader audience converts slower than a targeted one.`
          : `${eng7}% of views became votes this week, ${arrow === "up" ? "above" : "level with"} your 30-day average of ${eng30}%.`,
      to: "/analytics",
    });
  }

  return entries;
}

/* ── Insight cards (Hotjar voice) ────────────────────────────────── */

export function deriveInsights(
  campaigns: Campaign[],
  polsts: SinglePolst[],
  sources: Source[],
): Insight[] {
  const cards: Insight[] = [];

  // 1 · The source whose voters finish most above its object's norm.
  const standout = sources
    .filter((s) => s.linked && s.voters >= 50 && (s.completionDelta ?? 0) > 0)
    .sort((a, b) => (b.completionDelta ?? 0) - (a.completionDelta ?? 0))[0];
  const standoutHome = standout?.linked?.type === "campaign"
    ? campaigns.find((c) => c.id === standout.linked!.id)
    : undefined;
  if (standout && standout.completionRate !== null && standoutHome?.completionRate != null) {
    cards.push({
      id: "standout-source",
      question: "Which source is quietly winning?",
      status: { label: "outperforming", tone: "success" },
      evidence: `${standout.name} completes at ${Math.round(standout.completionRate)}%; ${standoutHome.name} completes at ${Math.round(standoutHome.completionRate)}%`,
      interpretation: `Voters arriving through this ${standout.kind.toLowerCase()} finish more often than the run's average — the intent is higher here. It has earned a bigger share of the next push.`,
      action: { label: "View sources", to: "/distribution" },
    });
  }

  // 2 · The single question where the most voters walk away.
  const drop = biggestDrop(campaigns);
  if (drop) {
    cards.push({
      id: "biggest-drop",
      question: "Where do voters give up?",
      status: { label: "leaking", tone: "warning" },
      evidence: `Question ${drop.question} of ${drop.campaign.name} · −${formatNumber(drop.lost)} voters (−${drop.pct}%)`,
      interpretation: `Everyone who left answered the questions before it — this one is where the ask gets too heavy. Reorder it later in the chain, or cut it.`,
      action: { label: "Open the chain", to: `/campaigns/${drop.campaign.id}` },
    });
  }

  // 3 · The standalone Polst that converts far above the middle of the pack.
  const rated = polsts
    .filter((p) => p.engagementRate !== null && p.views >= 500)
    .sort((a, b) => b.engagementRate! - a.engagementRate!);
  if (rated.length >= 3) {
    const top = rated[0];
    const median = rated[Math.floor(rated.length / 2)].engagementRate!;
    const gap = Math.round((top.engagementRate! - median) * 10) / 10;
    if (gap >= 2) {
      cards.push({
        id: "standout-polst",
        question: "Which question format earns the vote?",
        status: { label: "standout", tone: "accent" },
        evidence: `"${top.question}" · ${top.engagementRate}% of views vote; your median Polst converts ${median}%`,
        interpretation: `This framing turns lookers into voters more than anything else you're running. Reuse its shape — the concrete either/or with visible stakes — in the next brief.`,
        action: { label: "Open the Polst", to: `/polsts/${top.id}` },
      });
    }
  }

  return cards;
}

/* ══════════════════════════════════════════════════════════════════
   CAMPAIGN INSIGHTS — the audit's campaign-by-campaign layer.
   Every insight belongs to one campaign; standalone Polsts never
   generate one. Everything below is computed from the campaign's own
   record — the only human input is the marketer's review (a
   CampaignReview in the store), and its absence is itself a state.
   ══════════════════════════════════════════════════════════════════ */

/** Where a campaign sits in the review workflow. Derived, never stored:
 *  the store holds only the human review record. */
export type InsightState = "Needs review" | "Monitoring" | "Decision ready" | "Reviewed";

export const INSIGHT_STATE_TONE: Record<
  InsightState,
  "success" | "warning" | "accent" | "neutral"
> = {
  "Needs review": "warning", // findings are final and nobody has looked
  Monitoring: "neutral", // still collecting, nothing to act on yet
  "Decision ready": "success", // the evidence supports a call right now
  Reviewed: "accent", // a human recorded the resolution
};

/** Active/Ended with at least one response — the audit's bar for the
 *  Insights index. Scheduled and Draft runs have no findings yet. */
export const qualifiesForInsights = (c: Campaign) =>
  (c.status === "Active" || c.status === "Ended") && c.voters > 0;

export function insightStateFor(c: Campaign, review?: CampaignReview): InsightState {
  if (review) return "Reviewed";
  if (c.status === "Ended") return "Needs review";
  return isReadyToDecide(c) ? "Decision ready" : "Monitoring";
}

/** The date the campaign's numbers run through: an ended run's record
 *  stops at its end; a live run's record is current as of today. */
export const dataThrough = (c: Campaign): string =>
  c.status === "Ended" || c.status === "Archived" ? (c.endAt ?? c.createdAt) : TODAY;

/** Do two questions offer the same pair of options? Only then can one
 *  honestly support or contradict the other — otherwise it adds context. */
const samePair = (a: ChainQuestion, b: ChainQuestion) => {
  const pa = [a.optionA, a.optionB].sort().join(" ");
  const pb = [b.optionA, b.optionB].sort().join(" ");
  return pa === pb;
};

const qMargin = (q: ChainQuestion) => Math.abs(2 * q.splitA - 100);
const qLeader = (q: ChainQuestion) => (q.splitA >= 50 ? q.optionA : q.optionB);

export type PolstRole = {
  label: "Decision question" | "Supports the decision" | "Contradicts the decision" | "Inconclusive" | "Adds context";
  tone: "accent" | "success" | "warning" | "neutral";
};

/** Each chain question's plain-language role in the campaign's result.
 *  Support/contradiction is only claimed when the question offers the
 *  decision question's exact option pair — cross-question agreement is
 *  not computable otherwise, so everything else "adds context". Margins
 *  under 4 points are inconclusive (canon's Too-close threshold). */
export function polstRole(c: Campaign, index: number): PolstRole {
  if (index === c.decisionIndex) return { label: "Decision question", tone: "accent" };
  const q = c.chain[index];
  const decisionQ = c.chain[c.decisionIndex];
  if (c.voters === 0 || qMargin(q) < 4) return { label: "Inconclusive", tone: "neutral" };
  if (decisionQ && samePair(q, decisionQ)) {
    return qLeader(q) === qLeader(decisionQ)
      ? { label: "Supports the decision", tone: "success" }
      : { label: "Contradicts the decision", tone: "warning" };
  }
  return { label: "Adds context", tone: "neutral" };
}

/** The index row's plain-language readout — what the campaign has
 *  learned so far, percentages attached (the language contract bans a
 *  naked verdict). One sentence; contradictions get named because they
 *  change what the marketer should do next. */
export function campaignReadout(c: Campaign): string {
  const q = c.chain[c.decisionIndex];
  if (!q || c.voters === 0) return "No responses yet.";
  const lead = `${qLeader(q)} leads the decision question, ${Math.max(q.splitA, 100 - q.splitA)}% to ${Math.min(q.splitA, 100 - q.splitA)}%`;
  const contradiction = c.chain.find(
    (other, i) => i !== c.decisionIndex && polstRole(c, i).label === "Contradicts the decision",
  );
  switch (c.signal) {
    case "Decisive":
    case "Leading":
      return contradiction
        ? `${lead}, but "${contradiction.question}" favors ${qLeader(contradiction)}.`
        : `${lead}.`;
    case "Directional":
      return `${lead} — short of a decisive read.`;
    case "Too close":
      return `The decision question is too close to call at ${q.splitA}% / ${100 - q.splitA}%.`;
    case "Collecting":
      return `Still collecting — ${fmtInt(c.voters)} participants so far; the decision question sits at ${q.splitA}% / ${100 - q.splitA}%.`;
    case "Inconclusive":
      return `Ended without a clear winner: ${q.splitA}% / ${100 - q.splitA}% on the decision question.`;
    default:
      return "No responses yet.";
  }
}
