import type { PollOption } from "@/lib/poll";
import {
  METRIC_INFO,
  SEED_ANCHOR,
  TODAY,
  confidenceFor,
  daysBetween,
  fmtDate,
  fmtInt,
  fmtPct,
  isReadyToDecide,
  relativeToToday,
  shiftSeedDate,
  signalFor,
  type Confidence,
  type DecisionSignal,
  type Status,
} from "@/lib/canon";
import {
  addDays,
  allocate,
  chainVotes,
  dailySeries,
  hourlyVotes,
  sumWindow,
  timeHeat,
  windowBounds,
  windowDelta,
  windowSeries,
  type DailySeries,
  type WindowRange,
} from "@/lib/engine";

/* ══════════════════════════════════════════════════════════════════
   BRAND WORKSPACE — the one system of record for the polst dashboard
   ────────────────────────────────────────────────────────────────
   Entities (campaigns, standalone polsts, sources, key dates) are
   authored below; every aggregate, series, table, and story is DERIVED
   from them through src/lib/engine.ts at module load. Nothing here is
   fetched or persisted; scripts/verify-model.ts checks the invariants.
   ══════════════════════════════════════════════════════════════════ */

/** Canon vocabulary re-exported for pages/kit that import it from here. */
export type { Confidence, DecisionSignal, Status } from "@/lib/canon";
export type { WindowRange } from "@/lib/engine";

export type Category = "Food & drink" | "Lifestyle" | "Shopping & deals";
export type Channel = "Website" | "Email" | "Instagram" | "QR" | "Influencer";

/* ── Workspace identity ──────────────────────────────────────────── */

export const WORKSPACE = {
  brand: "North Star Pantry",
  domain: "northstarpantry.co",
  initials: "NP",
  industry: "Food & beverage",
  timezone: "America/Chicago",
  owner: "Max Polst",
  email: "max@northstarpantry.co",
} as const;

/** Workspaces the account can switch between (account selector). */
export const WORKSPACES = [
  { id: "np", name: "North Star Pantry", domain: "northstarpantry.co", initials: "NP", current: true },
  { id: "hf", name: "Harvest & Fold", domain: "harvestfold.com", initials: "HF", current: false },
] as const;

/* ── Entity types ────────────────────────────────────────────────── */

export type ChainQuestion = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  /** % of this question's votes on option A (0 when nothing has run). */
  splitA: number;
};

/** The decision question's result, carried with its own evidence: both
 *  percentages and the response count travel with the winning option so
 *  every surface can lead with "56% vs 44%" instead of a bare margin
 *  (the audit's language contract). marginPts stays derived for the
 *  signal/confidence thresholds — it is never the headline. */
export type CampaignWinner = {
  option: string;
  marginPts: number; // |2·splitA − 100| — threshold input, not display
  pctFor: number; // % of decision-question responses for the winner
  pctAgainst: number; // % for the other option
  responses: number; // votes on the decision question
};

export type Campaign = {
  id: string;
  name: string;
  /** The business decision this campaign answers. */
  decision: string;
  event?: string; // key-date id it targets (see KEY_DATES)
  status: Status;
  createdAt: string;
  startAt?: string;
  endAt?: string; // ISO
  target?: number; // voter goal set at creation
  category: Category;
  chain: ChainQuestion[];
  decisionIndex: number; // which chain question answers `decision`
  // Observed totals for the run so far (authored):
  voters: number; // unique people who started (= Q1 votes)
  completed: number; // answered every question (= last Q votes)
  viewsFactor: number; // views = round(votes * viewsFactor)
  shares: number; // interactions (likes/shares/reposts)
  avgTimeSeconds?: number; // avg completion time
  // Narrative (authored — every number in the copy matches the data):
  summary: string;
  nextStep: string;
  findings: string[];
  caveats: string[];
  sampleNote: string;
  // Derived at module load (never authored):
  votesByQuestion: number[]; // chainVotes(voters, completed, chain.length)
  votes: number; // Σ votesByQuestion
  views: number; // round(votes * viewsFactor)
  winner: CampaignWinner | null;
  signal: DecisionSignal;
  confidence: Confidence;
  completionRate: number | null; // completed/voters*100, 1dp
  sources: Source[]; // back-refs, populated after SOURCES
};

export type SinglePolst = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  splitA: number;
  status: Status;
  createdAt: string;
  startAt?: string;
  endAt?: string;
  event?: string;
  category: Category;
  votes: number; // single question: votes = voters
  viewsFactor: number;
  interactions: number; // likes + shares + reposts (canon METRIC_INFO)
  // Derived at module load:
  views: number;
  engagementRate: number | null; // votes/views*100, 1dp
  /** Exact integer split of `interactions` (likes ≥ shares ≥ reposts,
   *  deterministic per polst) so the aggregate and its parts never
   *  disagree in a table. */
  interactionMix: { likes: number; shares: number; reposts: number };
  sources: Source[]; // back-refs
};

export type Source = {
  id: string;
  name: string;
  kind: "QR code" | "Share link" | "Embed" | "Tracked link";
  channel: Channel;
  placement?: string; // "On-pack sticker", "Booth banner", "@handle"
  linked: { type: "campaign" | "polst"; id: string } | null;
  createdAt: string;
  lastActivity?: string; // ISO; omitted when no traffic
  // Authored allocation inputs (Σ voterShare per linked object = 1):
  voterShare?: number;
  completionDelta?: number; // pts vs the linked object's completion rate
  // Derived at module load (exact integer allocation of the object's run):
  voters: number;
  views: number;
  completed: number;
  completionRate: number | null;
};

export type KeyDate = { id: string; title: string; start: string; end: string };

/* ── Live clock: the authored model rides the real date ──────────────
   Every seed below is authored against canon.SEED_ANCHOR. shiftSeed
   moves every ISO date — and every "Jun 17"-style mention inside
   narrative copy — by the same whole-day offset, so the model's
   relative facts ("starts in 3 days", calendar urgency) hold on any
   day the prototype runs. A stale fixed "today" was the audit's #1
   trust defect; nothing below renders unshifted. */

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TEXT_DATE_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})\b/g;
const pad2 = (n: number) => String(n).padStart(2, "0");

/** "Jun 17" inside authored copy → the shifted month-day. Authored text
 *  dates always live in the anchor's year. */
const shiftTextDates = (text: string) =>
  text.replace(TEXT_DATE_RE, (_, mon: string, day: string) => {
    const iso = `${SEED_ANCHOR.slice(0, 4)}-${pad2(MONTH_SHORT.indexOf(mon) + 1)}-${pad2(Number(day))}`;
    const shifted = shiftSeedDate(iso);
    return `${MONTH_SHORT[Number(shifted.slice(5, 7)) - 1]} ${Number(shifted.slice(8, 10))}`;
  });

/** Deep-shift a seed literal: ISO date strings and in-copy month-day
 *  mentions move together; everything else passes through untouched. */
function shiftSeed<T>(value: T): T {
  if (typeof value === "string")
    return (ISO_DATE_RE.test(value) ? shiftSeedDate(value) : shiftTextDates(value)) as T;
  if (Array.isArray(value)) return value.map(shiftSeed) as T;
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, shiftSeed(v)]),
    ) as T;
  return value;
}

/* ── Key dates (planning events, authored) ───────────────────────── */

export const KEY_DATES: KeyDate[] = shiftSeed([
  { id: "world-cup", title: "World Cup Kickoff", start: "2026-06-18", end: "2026-06-18" },
  { id: "product-launch", title: "Product Launch Week", start: "2026-06-22", end: "2026-06-26" },
  { id: "fancy-food-show", title: "Summer Fancy Food Show", start: "2026-06-28", end: "2026-06-30" },
  { id: "july-fourth", title: "Independence Day", start: "2026-07-04", end: "2026-07-04" },
]);

/* ── Campaign seeds (authored observations + narrative) ──────────── */

type CampaignSeed = Omit<
  Campaign,
  | "votesByQuestion" | "votes" | "views" | "winner" | "signal" | "confidence"
  | "completionRate" | "sources"
>;

const CAMPAIGN_SEEDS: CampaignSeed[] = [
  {
    id: "flavor-launch-recap",
    name: "Flavor Launch Recap",
    decision: "Which flavor should lead retail sell-in?",
    status: "Ended",
    createdAt: "2026-05-20",
    startAt: "2026-05-28",
    endAt: "2026-06-10",
    target: 1000,
    category: "Food & drink",
    viewsFactor: 2.1,
    voters: 1184,
    completed: 935,
    shares: 74,
    avgTimeSeconds: 46,
    decisionIndex: 0,
    chain: [
      { id: "fl-lead", question: "Which flavor should lead the shelf?", optionA: "Citrus Mint", optionB: "Berry Basil", splitA: 56 },
      { id: "fl-pack", question: "Which pack color fits the flavor?", optionA: "Green", optionB: "Purple", splitA: 61 },
      { id: "fl-name", question: "Which name sounds tastier?", optionA: "Fresh Twist", optionB: "Garden Chill", splitA: 53 },
      { id: "fl-price", question: "Which launch price feels right?", optionA: "$3.99", optionB: "$4.49", splitA: 58 },
    ],
    summary:
      "Citrus Mint received 56% of responses on the lead question; Berry Basil received 44%. The run passed its 1,000-participant target with 79% completion.",
    nextStep: "Export the report and share it with the retail team.",
    findings: [
      "Citrus Mint received 56% of responses on the shelf question; Berry Basil received 44%.",
      "$3.99 received 58% of responses on the price question; $4.49 received 42%.",
      "Share Link — Newsletter delivered 41% of voters, the largest single source.",
    ],
    caveats: ["Launch-week traffic skewed toward existing subscribers."],
    sampleNote: "1,184 voters across 3 sources — past the 1,000 target with consistent splits.",
  },
  {
    id: "packaging-direction",
    name: "Packaging Direction Test",
    decision: "Which packaging direction should we launch?",
    status: "Active",
    createdAt: "2026-05-30",
    startAt: "2026-06-03",
    endAt: "2026-06-17",
    target: 1200,
    category: "Food & drink",
    viewsFactor: 2.3,
    voters: 1486,
    completed: 1055,
    shares: 96,
    avgTimeSeconds: 31,
    decisionIndex: 1,
    chain: [
      { id: "pd-shelf", question: "Which pack reads faster on shelf?", optionA: "Bold label", optionB: "Minimal label", splitA: 59 },
      { id: "pd-premium", question: "Which pack feels more premium?", optionA: "Bold label", optionB: "Minimal label", splitA: 42 },
    ],
    summary:
      "Minimal label received 58% of responses on the premium question; Bold label received 42%. The campaign has passed its 1,200-participant target, with two days remaining.",
    nextStep: "Review the recommendation and lock the direction when the run ends Jun 17.",
    findings: [
      "Minimal label received 58% on premium feel, while Bold label received 59% on shelf readability.",
      "Among Instagram participants, the premium question is closer: 53% select Minimal label and 47% select Bold label.",
      "Website Embed — Packaging drives 42% of voters at 76% completion; QR — Shelf Talker completes highest at 78%.",
    ],
    caveats: ["Creator traffic completes at 60%; the campaign completes at 71%."],
    sampleNote: "1,486 voters across 4 sources — past the 1,200 target.",
  },
  {
    id: "summer-flavor-lineup",
    name: "Summer Flavor Lineup",
    decision: "Which three flavors should headline the summer box?",
    status: "Active",
    createdAt: "2026-05-26",
    startAt: "2026-06-01",
    endAt: "2026-06-30",
    target: 2500,
    category: "Food & drink",
    viewsFactor: 2.2,
    voters: 2103,
    completed: 1220,
    shares: 158,
    avgTimeSeconds: 58,
    decisionIndex: 0,
    chain: [
      { id: "sf-lead", question: "Which flavor headlines the box?", optionA: "Citrus Mint", optionB: "Peach Punch", splitA: 53 },
      { id: "sf-second", question: "Which flavor takes the second slot?", optionA: "Berry Basil", optionB: "Melon Chili", splitA: 52 },
      { id: "sf-third", question: "Which flavor rounds out the trio?", optionA: "Mango Lime", optionB: "Cocoa Sea Salt", splitA: 49 },
      { id: "sf-size", question: "Which box size should we sell?", optionA: "6-pack", optionB: "10-pack", splitA: 55 },
    ],
    summary:
      "Citrus Mint received 53% of responses for the headline slot; Peach Punch received 47%. The campaign has reached 2,103 of its 2,500-participant target, while the middle slots remain inconclusive.",
    nextStep: "Keep collecting through Jun 30 before calling the middle slots.",
    findings: [
      "Email delivers 45% of voters — the largest channel in the mix.",
      "The third slot remains inconclusive: Cocoa Sea Salt received 51% and Mango Lime received 49%.",
      "The 6-pack received 55% of responses on the size question; the 10-pack received 45%.",
    ],
    caveats: [
      "Slots two and three remain close enough that no recommendation should be made yet.",
      "QR — Conference Booth completes at 41%; the campaign completes at 58%.",
    ],
    sampleNote: "2,103 of 2,500 target voters; email carries 45% of the sample.",
  },
  {
    id: "retail-shelf-layout",
    name: "Retail Shelf Layout",
    decision: "Which shelf arrangement reads fastest?",
    status: "Active",
    createdAt: "2026-06-05",
    startAt: "2026-06-12",
    endAt: "2026-06-24",
    target: 1200,
    category: "Shopping & deals",
    viewsFactor: 2.4,
    voters: 640,
    completed: 301,
    shares: 22,
    avgTimeSeconds: 24,
    decisionIndex: 0,
    chain: [
      { id: "rs-read", question: "Which shelf reads faster?", optionA: "Layout A", optionB: "Layout B", splitA: 51 },
      { id: "rs-find", question: "Which shelf helps you find flavors?", optionA: "Layout A", optionB: "Layout B", splitA: 51 },
    ],
    summary:
      "Layout A received 51% and Layout B received 49% across 640 of the 1,200 target participants. The result is inconclusive, and completion is 47%.",
    nextStep: "Keep running and add a second source beyond the website embed.",
    findings: [
      "Both questions sit at 51 / 49 — no separation yet.",
      "The second question loses more than half of starters.",
    ],
    caveats: ["Website embed is the only source, so the sample skews to existing site visitors."],
    sampleNote: "640 of 1,200 target voters from a single website source.",
  },
  {
    id: "holiday-gifting-bundles",
    name: "Holiday Gifting Bundles",
    decision: "Which gift bundle should we lead with?",
    status: "Active",
    createdAt: "2026-06-01",
    startAt: "2026-06-08",
    endAt: "2026-06-20",
    target: 1200,
    category: "Shopping & deals",
    viewsFactor: 2.2,
    voters: 892,
    completed: 571,
    shares: 67,
    avgTimeSeconds: 41,
    decisionIndex: 0,
    chain: [
      { id: "hg-hero", question: "Which bundle should lead the gift guide?", optionA: "Trio Box", optionB: "Pantry Sampler", splitA: 55 },
      { id: "hg-wrap", question: "Which wrap feels more giftable?", optionA: "Kraft ribbon", optionB: "Printed sleeve", splitA: 48 },
      { id: "hg-card", question: "Include a recipe card?", optionA: "Yes", optionB: "No", splitA: 71 },
    ],
    summary:
      "Trio Box received 55% of responses on the gift-guide question; Pantry Sampler received 45%. Campaign completion is 64%, and email drives 55% of participants.",
    nextStep: "Review the recommendation before the gift-guide print deadline.",
    findings: [
      "The recipe card is a landslide: 71% say include it.",
      "Printed sleeve received 52% on the wrap question; Kraft ribbon received 48%.",
      "Email delivers 55% of voters — one channel dominates the read.",
    ],
    caveats: ["Email dominance means the read reflects subscribers more than new shoppers."],
    sampleNote: "892 of 1,200 target voters; email carries 55% of the sample.",
  },
  {
    id: "spring-email-creative",
    name: "Spring Email Creative",
    decision: "Which email direction should lead the spring promotion?",
    status: "Ended",
    createdAt: "2026-04-12",
    startAt: "2026-04-19",
    endAt: "2026-04-29",
    target: 1400,
    category: "Lifestyle",
    viewsFactor: 2.1,
    voters: 1637,
    completed: 1328,
    shares: 83,
    avgTimeSeconds: 34,
    decisionIndex: 0,
    chain: [
      { id: "se-subject", question: "Which subject line earns the open?", optionA: "A brighter pantry starts here", optionB: "Spring favorites are back", splitA: 57 },
      { id: "se-hero", question: "Which email hero feels more seasonal?", optionA: "Styled pantry shelf", optionB: "Outdoor picnic", splitA: 44 },
      { id: "se-cta", question: "Which call to action feels clearer?", optionA: "Shop the spring edit", optionB: "See what's new", splitA: 63 },
    ],
    summary:
      "A brighter pantry starts here received 57% of responses on the decision question; Spring favorites are back received 43%. The campaign completed at 81%.",
    nextStep: "Use the winning subject line with the outdoor-picnic hero in the spring send.",
    findings: [
      "A brighter pantry starts here received 57% of responses on the subject-line question.",
      "The outdoor-picnic hero received 56% of responses, so the preferred visual differs from the preferred subject direction.",
      "Shop the spring edit received 63% of responses on the call-to-action question.",
    ],
    caveats: ["Most participants arrived through the existing email list, so the result reflects current subscribers."],
    sampleNote: "1,637 participants across email and website sources; 81% completed all three questions.",
  },
  {
    id: "subscription-box-positioning",
    name: "Subscription Box Positioning",
    decision: "Which promise should position the monthly box?",
    status: "Ended",
    createdAt: "2026-04-18",
    startAt: "2026-04-25",
    endAt: "2026-05-07",
    target: 1600,
    category: "Food & drink",
    viewsFactor: 2.2,
    voters: 1872,
    completed: 1460,
    shares: 119,
    avgTimeSeconds: 49,
    decisionIndex: 0,
    chain: [
      { id: "sb-promise", question: "Which promise makes the box worth joining?", optionA: "Discover something new", optionB: "Never run out of favorites", splitA: 39 },
      { id: "sb-frequency", question: "Which delivery rhythm feels right?", optionA: "Every month", optionB: "Every other month", splitA: 58 },
      { id: "sb-savings", question: "Which value message is clearer?", optionA: "Save 15% every box", optionB: "Member-only pricing", splitA: 66 },
      { id: "sb-skip", question: "Which flexibility promise matters more?", optionA: "Skip anytime", optionB: "Swap any item", splitA: 54 },
    ],
    summary:
      "Never run out of favorites received 61% of responses on the positioning question. The campaign passed its target and completed at 78%.",
    nextStep: "Lead the subscription page with reliable replenishment and support it with explicit savings.",
    findings: [
      "Never run out of favorites received 61% of responses; Discover something new received 39%.",
      "Save 15% every box received 66% on the value-message question.",
      "Monthly delivery received 58%, while every-other-month delivery received 42%.",
    ],
    caveats: ["Email participants were already familiar with the products, which may favor replenishment language."],
    sampleNote: "1,872 participants across three sources; 1,460 completed all four questions.",
  },
  {
    id: "mothers-day-gift-guide",
    name: "Mother's Day Gift Guide",
    decision: "Which gift story should lead the guide?",
    status: "Ended",
    createdAt: "2026-04-25",
    startAt: "2026-05-01",
    endAt: "2026-05-12",
    target: 1200,
    category: "Shopping & deals",
    viewsFactor: 2.2,
    voters: 1409,
    completed: 1014,
    shares: 104,
    avgTimeSeconds: 52,
    decisionIndex: 0,
    chain: [
      { id: "md-story", question: "Which gift story feels more meaningful?", optionA: "A slow Sunday together", optionB: "A pantry full of favorites", splitA: 62 },
      { id: "md-bundle", question: "Which bundle feels more giftable?", optionA: "Brunch box", optionB: "Baking box", splitA: 55 },
      { id: "md-card", question: "Which card treatment feels more personal?", optionA: "Handwritten note", optionB: "Printed recipe", splitA: 68 },
      { id: "md-delivery", question: "Which delivery promise matters more?", optionA: "Arrives by Friday", optionB: "Free scheduled delivery", splitA: 47 },
    ],
    summary:
      "A slow Sunday together received 62% of responses on the gift-story question. Completion was 72%, with the largest participation decline before the delivery question.",
    nextStep: "Build the guide around the slow-Sunday story and simplify the final delivery question in the next campaign.",
    findings: [
      "A slow Sunday together received 62% of responses; A pantry full of favorites received 38%.",
      "A handwritten note received 68% on the card-treatment question.",
      "The final delivery question had the campaign's largest loss of participants.",
    ],
    caveats: ["The campaign ended close to the shipping cutoff, so late participants had fewer viable delivery options."],
    sampleNote: "1,409 participants across email, Instagram, and QR; 1,014 completed the campaign.",
  },
  {
    id: "homepage-message-hierarchy",
    name: "Homepage Message Hierarchy",
    decision: "Which value proposition should open the homepage?",
    status: "Ended",
    createdAt: "2026-05-02",
    startAt: "2026-05-09",
    endAt: "2026-05-18",
    target: 900,
    category: "Lifestyle",
    viewsFactor: 2.3,
    voters: 948,
    completed: 681,
    shares: 39,
    avgTimeSeconds: 37,
    decisionIndex: 0,
    chain: [
      { id: "hm-value", question: "Which value proposition should appear first?", optionA: "Small-batch flavor", optionB: "Everyday pantry ease", splitA: 52 },
      { id: "hm-proof", question: "Which proof point builds more trust?", optionA: "Made in small batches", optionB: "Loved by 20,000 households", splitA: 46 },
      { id: "hm-action", question: "Which first action feels more natural?", optionA: "Explore products", optionB: "Take the flavor quiz", splitA: 43 },
    ],
    summary:
      "The homepage value proposition remains inconclusive: Small-batch flavor received 52% and Everyday pantry ease received 48%. Social proof and the flavor quiz produced clearer preferences.",
    nextStep: "Do not declare a homepage-message winner; run a focused follow-up using the stronger proof and action choices.",
    findings: [
      "The decision question is inconclusive at 52% versus 48%.",
      "Loved by 20,000 households received 54% on the proof-point question.",
      "Take the flavor quiz received 57% on the first-action question.",
    ],
    caveats: ["Website visitors made up most of the sample, so the campaign says little about first-time paid traffic."],
    sampleNote: "948 participants across website and Instagram; 681 completed all three questions.",
  },
  {
    id: "creator-brief-direction",
    name: "Creator Brief Direction",
    decision: "Which creator brief should guide the next partnership?",
    status: "Ended",
    createdAt: "2026-05-08",
    startAt: "2026-05-15",
    endAt: "2026-05-24",
    target: 700,
    category: "Lifestyle",
    viewsFactor: 2.4,
    voters: 775,
    completed: 502,
    shares: 91,
    avgTimeSeconds: 44,
    decisionIndex: 0,
    chain: [
      { id: "cb-story", question: "Which creator story feels more authentic?", optionA: "Weeknight routine", optionB: "Weekend hosting", splitA: 64 },
      { id: "cb-format", question: "Which format keeps your attention?", optionA: "Recipe walkthrough", optionB: "Pantry tour", splitA: 45 },
      { id: "cb-offer", question: "Which offer fits the story?", optionA: "Starter bundle", optionB: "Build your own box", splitA: 41 },
    ],
    summary:
      "Weeknight routine received 64% of responses on the brief direction. Completion was 65%, and tracked creator traffic completed less often than Instagram traffic.",
    nextStep: "Use the weeknight-routine story, but shorten the brief and test the build-your-own offer separately.",
    findings: [
      "Weeknight routine received 64% of responses; Weekend hosting received 36%.",
      "Pantry tour received 55% on the format question.",
      "Build your own box received 59% on the offer question.",
    ],
    caveats: ["The two source groups were recruited differently, so source completion should not be treated as causal."],
    sampleNote: "775 participants across creator and Instagram sources; 502 completed the campaign.",
  },
  {
    id: "farmers-market-sampling",
    name: "Farmers Market Sampling",
    decision: "Which sample should anchor the market booth?",
    status: "Ended",
    createdAt: "2026-05-12",
    startAt: "2026-05-19",
    endAt: "2026-05-27",
    target: 500,
    category: "Food & drink",
    viewsFactor: 2.1,
    voters: 526,
    completed: 401,
    shares: 31,
    avgTimeSeconds: 21,
    decisionIndex: 0,
    chain: [
      { id: "fm-sample", question: "Which sample should lead the tasting table?", optionA: "Citrus Mint cracker", optionB: "Berry Basil toast", splitA: 59 },
      { id: "fm-followup", question: "What should visitors receive after tasting?", optionA: "Recipe card", optionB: "Discount card", splitA: 35 },
    ],
    summary:
      "Citrus Mint cracker received 59% of responses on the sampling question. Completion was 76%, and most participants preferred a discount card as the follow-up.",
    nextStep: "Lead with Citrus Mint samples and hand out the preferred discount card at the next market.",
    findings: [
      "Citrus Mint cracker received 59% of responses; Berry Basil toast received 41%.",
      "Discount card received 65% on the follow-up question.",
      "QR participants completed more often than participants arriving through the recap email.",
    ],
    caveats: ["The sample reflects one market and should not be generalized to retail shoppers without a follow-up."],
    sampleNote: "526 participants across market QR and recap email; 401 completed both questions.",
  },
  {
    id: "game-day-creative",
    name: "Game Day Creative Test",
    decision: "Which creative should we run for the World Cup?",
    status: "Scheduled",
    createdAt: "2026-06-08",
    startAt: "2026-06-17",
    endAt: "2026-06-26",
    target: 1000,
    category: "Lifestyle",
    event: "world-cup",
    viewsFactor: 2.2,
    voters: 0,
    completed: 0,
    shares: 0,
    decisionIndex: 0,
    chain: [
      { id: "gd-hero", question: "Which hero visual stops the scroll?", optionA: "Stadium crowd", optionB: "Product close-up", splitA: 0 },
      { id: "gd-line", question: "Which line lands harder?", optionA: "Snack the match", optionB: "Game day fuel", splitA: 0 },
      { id: "gd-cta", question: "Which offer converts?", optionA: "Bundle deal", optionB: "Free shipping", splitA: 0 },
    ],
    summary:
      "Scheduled for the World Cup window starting Jun 17. Three creatives are staged, but no source is attached yet.",
    nextStep: "Attach a QR code, share link, or embed before the Jun 17 start.",
    findings: [],
    caveats: ["No sources attached — the campaign can't collect voters until one is."],
    sampleNote: "",
  },
  {
    id: "loyalty-program-naming",
    name: "Loyalty Program Naming",
    decision: "What should we call the rewards program?",
    status: "Scheduled",
    createdAt: "2026-06-10",
    startAt: "2026-06-30",
    endAt: "2026-07-14",
    target: 800,
    category: "Lifestyle",
    viewsFactor: 2.2,
    voters: 0,
    completed: 0,
    shares: 0,
    decisionIndex: 0,
    chain: [
      { id: "lp-name", question: "Which rewards name sticks?", optionA: "Pantry Points", optionB: "North Star Club", splitA: 0 },
      { id: "lp-tier", question: "Which tier name feels premium?", optionA: "Gold Shelf", optionB: "First Harvest", splitA: 0 },
    ],
    summary: "Scheduled to start Jun 30 with a website embed already staged. Nothing has run yet.",
    nextStep: "Confirm the schedule; the staged embed goes live with the campaign.",
    findings: [],
    caveats: ["Website will be the only source at launch — add a second before deciding."],
    sampleNote: "",
  },
  {
    id: "back-to-school-snacks",
    name: "Back-to-School Snacks",
    decision: "Which lunchbox snack should we push?",
    status: "Scheduled",
    createdAt: "2026-06-12",
    startAt: "2026-07-20",
    endAt: "2026-08-03",
    target: 1000,
    category: "Food & drink",
    viewsFactor: 2.2,
    voters: 0,
    completed: 0,
    shares: 0,
    decisionIndex: 0,
    chain: [
      { id: "bs-snack", question: "Which snack goes in the lunchbox?", optionA: "Fruit crisps", optionB: "Trail mix", splitA: 0 },
      { id: "bs-size", question: "Which size for lunchboxes?", optionA: "Mini pack", optionB: "Standard", splitA: 0 },
      { id: "bs-claim", question: "Which claim matters to parents?", optionA: "No added sugar", optionB: "Whole grain", splitA: 0 },
    ],
    summary: "Scheduled for the back-to-school window starting Jul 20. Three questions staged; no sources yet.",
    nextStep: "Attach a distribution source before the Jul 20 start.",
    findings: [],
    caveats: ["No sources attached yet — the start is more than a month out."],
    sampleNote: "",
  },
  {
    id: "summer-launch-draft",
    name: "Summer launch",
    decision: "",
    status: "Draft",
    createdAt: "2026-06-13",
    category: "Lifestyle",
    viewsFactor: 2.2,
    voters: 0,
    completed: 0,
    shares: 0,
    decisionIndex: 0,
    chain: [],
    summary: "Add at least one polst before publishing.",
    nextStep: "Create a new polst or select one from the library.",
    findings: [],
    caveats: [],
    sampleNote: "",
  },
  {
    id: "rebrand-concept-test",
    name: "Rebrand Concept Test",
    decision: "Which brand direction resonates most?",
    status: "Draft",
    createdAt: "2026-06-04",
    target: 1000,
    category: "Lifestyle",
    viewsFactor: 2.2,
    voters: 0,
    completed: 0,
    shares: 0,
    decisionIndex: 0,
    chain: [
      { id: "rb-logo", question: "Which logo direction resonates?", optionA: "Wordmark", optionB: "Emblem", splitA: 0 },
      { id: "rb-voice", question: "Which voice fits the brand?", optionA: "Warm & homey", optionB: "Bold & modern", splitA: 0 },
    ],
    summary: "Still a draft — both polsts need visuals before this can be scheduled.",
    nextStep: "Finish both polsts, then schedule the campaign.",
    findings: [],
    caveats: ["Draft — nothing has run yet."],
    sampleNote: "",
  },
];

/* ── Single polst seeds ──────────────────────────────────────────── */

type PolstSeed = Omit<SinglePolst, "views" | "engagementRate" | "interactionMix" | "sources">;

const POLST_SEEDS: PolstSeed[] = [
  { id: "which-headline-wins", question: "Which headline wins?", optionA: "Fuel your morning", optionB: "Mornings, handled", splitA: 57, status: "Active", createdAt: "2026-06-03", startAt: "2026-06-05", endAt: "2026-06-19", category: "Food & drink", votes: 428, viewsFactor: 2.2, interactions: 17 },
  { id: "price-point-fair", question: "Which price point feels fair?", optionA: "$4.99", optionB: "$5.49", splitA: 49, status: "Active", createdAt: "2026-05-30", startAt: "2026-06-03", endAt: "2026-06-20", category: "Food & drink", votes: 1204, viewsFactor: 2.1, interactions: 48 },
  { id: "snack-size-sells", question: "Which snack size sells better?", optionA: "Single serve", optionB: "Share bag", splitA: 54, status: "Active", createdAt: "2026-06-02", startAt: "2026-06-06", endAt: "2026-06-21", category: "Food & drink", votes: 512, viewsFactor: 2.3, interactions: 20 },
  { id: "hero-image-ad", question: "Best hero image for the ad?", optionA: "Product close-up", optionB: "Lifestyle shot", splitA: 61, status: "Active", createdAt: "2026-06-05", startAt: "2026-06-09", endAt: "2026-06-18", category: "Food & drink", votes: 738, viewsFactor: 2.2, interactions: 30 },
  { id: "sweet-or-savory", question: "Sweet or savory launch?", optionA: "Sweet", optionB: "Savory", splitA: 58, status: "Active", createdAt: "2026-06-08", startAt: "2026-06-11", endAt: "2026-06-22", category: "Food & drink", votes: 430, viewsFactor: 2.4, interactions: 17 },
  { id: "label-layout", question: "Which label reads faster on shelf?", optionA: "Icon-led", optionB: "Type-led", splitA: 62, status: "Ended", createdAt: "2026-05-14", startAt: "2026-05-20", endAt: "2026-05-29", category: "Food & drink", votes: 906, viewsFactor: 2.2, interactions: 36 },
  { id: "packaging-color-premium", question: "Which packaging color feels more premium?", optionA: "Deep navy", optionB: "Warm cream", splitA: 0, status: "Scheduled", createdAt: "2026-06-04", startAt: "2026-06-22", endAt: "2026-06-26", event: "product-launch", category: "Food & drink", votes: 0, viewsFactor: 2.2, interactions: 0 },
  { id: "mascot-preference", question: "Which mascot do people like?", optionA: "The Fox", optionB: "The Bear", splitA: 0, status: "Scheduled", createdAt: "2026-06-08", startAt: "2026-06-28", endAt: "2026-07-05", category: "Lifestyle", votes: 0, viewsFactor: 2.2, interactions: 0 },
  { id: "event-hook", question: "Which tagline should we use?", optionA: "Taste the season", optionB: "Made for the moment", splitA: 0, status: "Draft", createdAt: "2026-06-09", category: "Food & drink", votes: 0, viewsFactor: 2.2, interactions: 0 },
  { id: "bundle-vs-single", question: "Bundle or single pack?", optionA: "Bundle", optionB: "Single", splitA: 0, status: "Draft", createdAt: "2026-06-11", category: "Shopping & deals", votes: 0, viewsFactor: 2.2, interactions: 0 },
  { id: "archived-draft", question: "Which seasonal badge feels clearer?", optionA: "Limited batch", optionB: "Seasonal pick", splitA: 0, status: "Archived", createdAt: "2026-05-08", category: "Food & drink", votes: 0, viewsFactor: 2.2, interactions: 0 },
];

/* ── Source seeds (attribution inputs) ───────────────────────────── */

type SourceSeed = Omit<Source, "voters" | "views" | "completed" | "completionRate" | "lastActivity">;

const SOURCE_SEEDS: SourceSeed[] = shiftSeed([
  // Flavor Launch Recap
  { id: "qr-packaging", name: "QR — Packaging", kind: "QR code", channel: "QR", placement: "On-pack sticker", linked: { type: "campaign", id: "flavor-launch-recap" }, createdAt: "2026-05-26", voterShare: 0.26, completionDelta: 4 },
  { id: "link-newsletter", name: "Share Link — Newsletter", kind: "Share link", channel: "Email", linked: { type: "campaign", id: "flavor-launch-recap" }, createdAt: "2026-05-27", voterShare: 0.41, completionDelta: 2 },
  { id: "embed-site-flavor", name: "Website Embed — Flavor", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "flavor-launch-recap" }, createdAt: "2026-05-26", voterShare: 0.33, completionDelta: -3 },
  // Spring Email Creative
  { id: "email-spring-creative", name: "Share Link — Spring Email", kind: "Share link", channel: "Email", linked: { type: "campaign", id: "spring-email-creative" }, createdAt: "2026-04-18", voterShare: 0.68, completionDelta: 3 },
  { id: "embed-spring-creative", name: "Website Embed — Spring Edit", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "spring-email-creative" }, createdAt: "2026-04-18", voterShare: 0.32, completionDelta: -6 },
  // Subscription Box Positioning
  { id: "email-subscription-box", name: "Share Link — Subscriber List", kind: "Share link", channel: "Email", linked: { type: "campaign", id: "subscription-box-positioning" }, createdAt: "2026-04-24", voterShare: 0.47, completionDelta: 4 },
  { id: "embed-subscription-box", name: "Website Embed — Subscription", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "subscription-box-positioning" }, createdAt: "2026-04-24", voterShare: 0.34, completionDelta: 1 },
  { id: "creator-subscription-box", name: "Creator — @pantryweek", kind: "Tracked link", channel: "Influencer", placement: "@pantryweek", linked: { type: "campaign", id: "subscription-box-positioning" }, createdAt: "2026-04-26", voterShare: 0.19, completionDelta: -8 },
  // Mother's Day Gift Guide
  { id: "email-mothers-day", name: "Share Link — Mother's Day Email", kind: "Share link", channel: "Email", linked: { type: "campaign", id: "mothers-day-gift-guide" }, createdAt: "2026-04-30", voterShare: 0.52, completionDelta: 6 },
  { id: "story-mothers-day", name: "Instagram Story — Gift Guide", kind: "Share link", channel: "Instagram", linked: { type: "campaign", id: "mothers-day-gift-guide" }, createdAt: "2026-05-01", voterShare: 0.30, completionDelta: -2 },
  { id: "qr-mothers-day", name: "QR — Gift Display", kind: "QR code", channel: "QR", placement: "Gift display", linked: { type: "campaign", id: "mothers-day-gift-guide" }, createdAt: "2026-05-02", voterShare: 0.18, completionDelta: -9 },
  // Homepage Message Hierarchy
  { id: "embed-homepage-message", name: "Website Embed — Homepage", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "homepage-message-hierarchy" }, createdAt: "2026-05-08", voterShare: 0.74, completionDelta: 2 },
  { id: "story-homepage-message", name: "Instagram Story — Homepage", kind: "Share link", channel: "Instagram", linked: { type: "campaign", id: "homepage-message-hierarchy" }, createdAt: "2026-05-09", voterShare: 0.26, completionDelta: -5 },
  // Creator Brief Direction
  { id: "creator-brief-link", name: "Creator — @weeknighttable", kind: "Tracked link", channel: "Influencer", placement: "@weeknighttable", linked: { type: "campaign", id: "creator-brief-direction" }, createdAt: "2026-05-14", voterShare: 0.58, completionDelta: -7 },
  { id: "story-creator-brief", name: "Instagram Story — Creator Brief", kind: "Share link", channel: "Instagram", linked: { type: "campaign", id: "creator-brief-direction" }, createdAt: "2026-05-15", voterShare: 0.42, completionDelta: 5 },
  // Farmers Market Sampling
  { id: "qr-farmers-market", name: "QR — Market Booth", kind: "QR code", channel: "QR", placement: "Tasting table", linked: { type: "campaign", id: "farmers-market-sampling" }, createdAt: "2026-05-18", voterShare: 0.72, completionDelta: 5 },
  { id: "email-farmers-market", name: "Share Link — Market Recap", kind: "Share link", channel: "Email", linked: { type: "campaign", id: "farmers-market-sampling" }, createdAt: "2026-05-20", voterShare: 0.28, completionDelta: -7 },
  // Packaging Direction Test
  { id: "embed-website-pd", name: "Website Embed — Packaging", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "packaging-direction" }, createdAt: "2026-05-31", voterShare: 0.42, completionDelta: 7 },
  { id: "story-instagram-pd", name: "Instagram Story Link", kind: "Share link", channel: "Instagram", linked: { type: "campaign", id: "packaging-direction" }, createdAt: "2026-06-02", voterShare: 0.33, completionDelta: -6 },
  { id: "qr-instore-pd", name: "QR — Shelf Talker", kind: "QR code", channel: "QR", placement: "Shelf talker", linked: { type: "campaign", id: "packaging-direction" }, createdAt: "2026-06-01", voterShare: 0.16, completionDelta: 9 },
  { id: "creator-morningfeed", name: "Creator — @themorningfeed", kind: "Tracked link", channel: "Influencer", placement: "@themorningfeed", linked: { type: "campaign", id: "packaging-direction" }, createdAt: "2026-06-03", voterShare: 0.09, completionDelta: -10 },
  // Summer Flavor Lineup
  { id: "newsletter-summer", name: "Share Link — Summer Newsletter", kind: "Share link", channel: "Email", linked: { type: "campaign", id: "summer-flavor-lineup" }, createdAt: "2026-05-30", voterShare: 0.45, completionDelta: 6 },
  { id: "embed-landing", name: "Landing Page Embed", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "summer-flavor-lineup" }, createdAt: "2026-05-28", voterShare: 0.31, completionDelta: 0 },
  { id: "story-instagram-summer", name: "Instagram Story — Lineup", kind: "Share link", channel: "Instagram", linked: { type: "campaign", id: "summer-flavor-lineup" }, createdAt: "2026-06-03", voterShare: 0.18, completionDelta: -4 },
  { id: "qr-conference", name: "QR — Conference Booth", kind: "QR code", channel: "QR", placement: "Booth banner", linked: { type: "campaign", id: "summer-flavor-lineup" }, createdAt: "2026-06-02", voterShare: 0.06, completionDelta: -17 },
  // Retail Shelf Layout
  { id: "embed-website-retail", name: "Website Embed — Retail", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "retail-shelf-layout" }, createdAt: "2026-06-10", voterShare: 1, completionDelta: 0 },
  // Holiday Gifting Bundles
  { id: "newsletter-holiday", name: "Share Link — Gift Guide Email", kind: "Share link", channel: "Email", linked: { type: "campaign", id: "holiday-gifting-bundles" }, createdAt: "2026-06-05", voterShare: 0.55, completionDelta: 5 },
  { id: "story-instagram-holiday", name: "Instagram Story — Gifting", kind: "Share link", channel: "Instagram", linked: { type: "campaign", id: "holiday-gifting-bundles" }, createdAt: "2026-06-08", voterShare: 0.27, completionDelta: -3 },
  { id: "qr-endcap-holiday", name: "QR — End-cap Poster", kind: "QR code", channel: "QR", placement: "End-cap poster", linked: { type: "campaign", id: "holiday-gifting-bundles" }, createdAt: "2026-06-06", voterShare: 0.18, completionDelta: -6 },
  // Loyalty Program Naming — staged ahead of start, zero traffic
  { id: "embed-website-loyalty", name: "Website Embed — Loyalty", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "loyalty-program-naming" }, createdAt: "2026-06-12", voterShare: 1, completionDelta: 0 },
  // Standalone polsts (single source each)
  { id: "story-instagram-headline", name: "Instagram Story — Headline", kind: "Share link", channel: "Instagram", linked: { type: "polst", id: "which-headline-wins" }, createdAt: "2026-06-05", voterShare: 1, completionDelta: 0 },
  { id: "newsletter-price", name: "Share Link — Price Test Email", kind: "Share link", channel: "Email", linked: { type: "polst", id: "price-point-fair" }, createdAt: "2026-06-03", voterShare: 1, completionDelta: 0 },
  { id: "embed-website-snack", name: "Website Embed — Snack Size", kind: "Embed", channel: "Website", linked: { type: "polst", id: "snack-size-sells" }, createdAt: "2026-06-06", voterShare: 1, completionDelta: 0 },
  { id: "story-instagram-hero", name: "Instagram Story — Hero Image", kind: "Share link", channel: "Instagram", linked: { type: "polst", id: "hero-image-ad" }, createdAt: "2026-06-09", voterShare: 1, completionDelta: 0 },
  { id: "qr-instore-sweet", name: "QR — In-store Counter", kind: "QR code", channel: "QR", placement: "Counter card", linked: { type: "polst", id: "sweet-or-savory" }, createdAt: "2026-06-11", voterShare: 1, completionDelta: 0 },
  { id: "embed-website-label", name: "Website Embed — Label Test", kind: "Embed", channel: "Website", linked: { type: "polst", id: "label-layout" }, createdAt: "2026-05-20", voterShare: 1, completionDelta: 0 },
  // Unlinked — the assign flow's material
  { id: "qr-poster", name: "QR — Retail Poster", kind: "QR code", channel: "QR", placement: "End-cap poster", linked: null, createdAt: "2026-06-09" },
  { id: "link-instagram-spare", name: "Instagram Story Link", kind: "Share link", channel: "Instagram", linked: null, createdAt: "2026-03-18" },
]);

/* ── Derivation pipeline ─────────────────────────────────────────── */

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Pass 1: everything derivable from the campaign's own observations. */
const deriveCampaign = (seed: CampaignSeed): Campaign => {
  const votesByQuestion = seed.chain.length
    ? chainVotes(seed.voters, seed.completed, seed.chain.length)
    : [];
  const votes = votesByQuestion.reduce((a, b) => a + b, 0);
  const views = Math.round(votes * seed.viewsFactor);
  const decisionQ = seed.chain[seed.decisionIndex];
  const winner: CampaignWinner | null =
    seed.voters > 0 && decisionQ
      ? {
          option: decisionQ.splitA >= 50 ? decisionQ.optionA : decisionQ.optionB,
          marginPts: Math.abs(2 * decisionQ.splitA - 100),
          pctFor: Math.max(decisionQ.splitA, 100 - decisionQ.splitA),
          pctAgainst: Math.min(decisionQ.splitA, 100 - decisionQ.splitA),
          responses: votesByQuestion[seed.decisionIndex] ?? 0,
        }
      : null;
  return {
    ...seed,
    votesByQuestion,
    votes,
    views,
    winner,
    signal: signalFor({ status: seed.status, voters: seed.voters, target: seed.target, marginPts: winner?.marginPts ?? 0 }),
    confidence: "—", // finalized once sources are attached (needs sourceCount)
    completionRate: seed.voters > 0 ? round1((seed.completed / seed.voters) * 100) : null,
    sources: [],
  };
};

/** Split a polst's interaction total into likes/shares/reposts without
 *  inventing data: fixed shares (~58/26/16) hashed a step by the id so
 *  rows differ, remainder assigned largest-first so parts sum exactly. */
const deriveInteractionMix = (id: string, total: number) => {
  if (total <= 0) return { likes: 0, shares: 0, reposts: 0 };
  const nudge = (id.charCodeAt(0) + id.length) % 5; // deterministic ±2pts
  const likeShare = (56 + nudge) / 100;
  const shareShare = (28 - nudge) / 100;
  const likes = Math.round(total * likeShare);
  const shares = Math.round(total * shareShare);
  return { likes, shares, reposts: Math.max(0, total - likes - shares) };
};

const derivePolst = (seed: PolstSeed): SinglePolst => {
  const views = Math.round(seed.votes * seed.viewsFactor);
  return {
    ...seed,
    views,
    engagementRate: views > 0 ? round1((seed.votes / views) * 100) : null,
    interactionMix: deriveInteractionMix(seed.id, seed.interactions),
    sources: [],
  };
};

export const CAMPAIGNS: Campaign[] = shiftSeed(CAMPAIGN_SEEDS).map(deriveCampaign);
export const SINGLE_POLSTS: SinglePolst[] = shiftSeed(POLST_SEEDS).map(derivePolst);

const campaignById = new Map(CAMPAIGNS.map((c) => [c.id, c]));
const polstById = new Map(SINGLE_POLSTS.map((p) => [p.id, p]));

/** The funnel totals a source's allocation divides (polsts complete what they vote). */
const linkedTotals = (linked: NonNullable<Source["linked"]>) => {
  if (linked.type === "campaign") {
    const c = campaignById.get(linked.id)!;
    return { voters: c.voters, views: c.views, completed: c.completed, rate: c.voters > 0 ? (c.completed / c.voters) * 100 : 0, startAt: c.startAt, endAt: c.endAt };
  }
  const p = polstById.get(linked.id)!;
  return { voters: p.votes, views: p.views, completed: p.votes, rate: p.votes > 0 ? 100 : 0, startAt: p.startAt, endAt: p.endAt };
};

/** Pass 2: allocate each linked object's run across its sources — voters and
 *  views proportional to voterShare, completed weighted by (rate + delta) —
 *  with `allocate` so every per-object sum is EXACT (invariant 6). */
export const SOURCES: Source[] = (() => {
  const derived = new Map<string, { voters: number; views: number; completed: number }>();
  const byObject = new Map<string, SourceSeed[]>();
  for (const seed of SOURCE_SEEDS) {
    if (!seed.linked) continue;
    const key = `${seed.linked.type}:${seed.linked.id}`;
    byObject.set(key, [...(byObject.get(key) ?? []), seed]);
  }
  for (const [, group] of byObject) {
    const totals = linkedTotals(group[0].linked!);
    const shares = group.map((s) => s.voterShare ?? 0);
    const completionWeights = group.map(
      (s) => (s.voterShare ?? 0) * Math.max(0, totals.rate + (s.completionDelta ?? 0)),
    );
    const voters = allocate(totals.voters, shares);
    const views = allocate(totals.views, shares);
    const completed = allocate(totals.completed, completionWeights);
    group.forEach((s, i) =>
      derived.set(s.id, { voters: voters[i], views: views[i], completed: completed[i] }),
    );
  }
  return SOURCE_SEEDS.map((seed) => {
    const alloc = derived.get(seed.id) ?? { voters: 0, views: 0, completed: 0 };
    const totals = seed.linked ? linkedTotals(seed.linked) : null;
    // Last activity follows the linked run: its end if past, otherwise today.
    const lastActivity =
      seed.id === "link-instagram-spare"
        ? shiftSeedDate("2026-03-24") // dormant — collected before it was ever re-pointed
        : alloc.voters > 0 && totals?.startAt
          ? totals.endAt && totals.endAt < TODAY
            ? totals.endAt
            : TODAY
          : undefined;
    return {
      ...seed,
      ...alloc,
      completionRate: alloc.voters > 0 ? round1((alloc.completed / alloc.voters) * 100) : null,
      ...(lastActivity ? { lastActivity } : {}),
    };
  });
})();

/* Pass 3: back-references and the fields that need them. */
for (const campaign of CAMPAIGNS) {
  campaign.sources = SOURCES.filter((s) => s.linked?.type === "campaign" && s.linked.id === campaign.id);
  campaign.confidence = confidenceFor({
    status: campaign.status,
    voters: campaign.voters,
    target: campaign.target,
    sourceCount: campaign.sources.length,
  });
}
for (const polst of SINGLE_POLSTS) {
  polst.sources = SOURCES.filter((s) => s.linked?.type === "polst" && s.linked.id === polst.id);
}

/* ── Daily series (memoized — called in loops everywhere) ────────── */

export type SeriesMetric = "views" | "votes" | "voters" | "completed";

const EMPTY_SERIES: DailySeries = { dates: [], values: [] };
const seriesCache = new Map<string, DailySeries>();

const objectSeries = (id: string, metric: SeriesMetric, total: number, startAt?: string, endAt?: string): DailySeries => {
  const key = `${id}:${metric}`;
  const hit = seriesCache.get(key);
  if (hit) return hit;
  const series = !startAt || !endAt || total <= 0 ? EMPTY_SERIES : dailySeries(key, total, startAt, endAt);
  seriesCache.set(key, series);
  return series;
};

export const campaignSeries = (c: Campaign, metric: SeriesMetric): DailySeries =>
  objectSeries(c.id, metric, c[metric], c.startAt, c.endAt);

/** A single question completes as it votes: voters = completed = votes. */
export const polstSeries = (p: SinglePolst, metric: SeriesMetric): DailySeries =>
  objectSeries(p.id, metric, metric === "views" ? p.views : p.votes, p.startAt, p.endAt);

const allSeries = (metric: SeriesMetric): DailySeries[] => [
  ...CAMPAIGNS.map((c) => campaignSeries(c, metric)),
  ...SINGLE_POLSTS.map((p) => polstSeries(p, metric)),
];

/** Per-day workspace totals for one metric inside [start, end] (memoized). */
const metricWindowCache = new Map<string, DailySeries>();
const metricWindow = (metric: SeriesMetric, start: string, end: string): DailySeries => {
  const key = `${metric}:${start}:${end}`;
  const hit = metricWindowCache.get(key);
  if (hit) return hit;
  const series = windowSeries(allSeries(metric), start, end);
  metricWindowCache.set(key, series);
  return series;
};

const sumValues = (s: DailySeries) => s.values.reduce((a, b) => a + b, 0);

/* ── Workspace window (every headline number reads from here) ────── */

export type WindowTotals = { views: number; votes: number; voters: number; completed: number };

export type WorkspaceWindow = WindowTotals & {
  range: WindowRange;
  start: string;
  end: string;
  /** "Jun 9 – Jun 15" — the exact window behind the numbers. */
  label: string;
  /** "vs Jun 2 – Jun 8" — null when there is no previous window, or when the
   *  previous window has too little traffic for any honest comparison. */
  compareLabel: string | null;
  engagementRate: number | null; // votes/views*100, 1dp
  completionRate: number | null; // completed/voters*100, 1dp
  prev: WindowTotals | null;
  series: { views: DailySeries; votes: DailySeries };
};

const windowCache = new Map<WindowRange, WorkspaceWindow>();

export function workspaceWindow(range: WindowRange): WorkspaceWindow {
  const hit = windowCache.get(range);
  if (hit) return hit;
  const [start, end] = windowBounds(range);
  const totals = (s: string, e: string): WindowTotals => ({
    views: allSeries("views").reduce((a, x) => a + sumWindow(x, s, e), 0),
    votes: allSeries("votes").reduce((a, x) => a + sumWindow(x, s, e), 0),
    voters: allSeries("voters").reduce((a, x) => a + sumWindow(x, s, e), 0),
    completed: allSeries("completed").reduce((a, x) => a + sumWindow(x, s, e), 0),
  });
  const current = totals(start, end);
  const [prevStart, prevEnd] = windowBounds(range, 1);
  const prev = range === "All" ? null : totals(prevStart, prevEnd);
  // A stated baseline needs something to compare: views bound every other
  // metric, so when the previous window's views fall under windowDelta's
  // honesty floor no delta anywhere can survive — the comparison label is
  // then withheld instead of decorating suppressed numbers.
  const comparable = prev !== null && windowDelta(current.views, prev.views) !== null;
  const result: WorkspaceWindow = {
    range,
    start,
    end,
    label: `${fmtDate(start)} – ${fmtDate(end)}`,
    compareLabel: comparable ? `vs ${fmtDate(prevStart)} – ${fmtDate(prevEnd)}` : null,
    ...current,
    engagementRate: current.views > 0 ? round1((current.votes / current.views) * 100) : null,
    completionRate: current.voters > 0 ? round1((current.completed / current.voters) * 100) : null,
    prev,
    series: {
      views: metricWindow("views", start, end),
      votes: metricWindow("votes", start, end),
    },
  };
  windowCache.set(range, result);
  return result;
}

/* ── Stats strip (Home) ──────────────────────────────────────────── */

export type Stat = {
  label: string;
  value: string;
  /** Period-over-period change, e.g. "12%" (arrow + colour come from trend). */
  delta: string;
  trend?: "up" | "down" | "flat";
  spark?: number[];
  /** The same metric over the previous window, on the spark's scale. */
  previous?: number[];
  /** The metric's definition — formula and denominator, in plain words. */
  info?: string;
  /** Chart-anchored movements — each marker explains a rise or drop. */
  annotations?: StatAnnotation[];
};

/** A point on the stat hero's chart. Every campaign/polst launch and end
 *  inside the window gets a marker stating the metric's movement around
 *  it; material movements with no such event get an "insight" marker —
 *  so every movement on the curve carries its explanation. */
export type StatAnnotation = {
  /** Index into the stat's spark — the bucket the marker sits on. */
  bucket: number;
  /** The bucket's real date span, e.g. "Jun 10 – Jun 14". */
  dateLabel: string;
  /** Picks the marker's glyph: launch, end, or unexplained movement. */
  kind: "launch" | "end" | "insight";
  /** "Summer Flavor Lineup launched" / "Views rose 43%". */
  headline: string;
  /** One sentence on how the metric moved through this stretch. */
  detail: string;
  link?: { label: string; to: string };
};

export type StatRange = WindowRange;
export const STAT_RANGES: StatRange[] = ["7D", "30D", "90D", "All"];

const SPARK_POINTS = 25;

/** Bucket a daily series into ~12 points (sums, so counts stay honest). */
const downsampleCounts = (values: number[], points = SPARK_POINTS): number[] => {
  if (values.length <= points) return [...values];
  return Array.from({ length: points }, (_, i) => {
    const from = Math.floor((i * values.length) / points);
    const to = Math.floor(((i + 1) * values.length) / points);
    return values.slice(from, to).reduce((a, b) => a + b, 0);
  });
};

/** Bucketed ratio series (rate per ~12-point bucket, 1dp, guarded). */
const downsampleRate = (numer: number[], denom: number[], points = SPARK_POINTS): number[] => {
  const n = downsampleCounts(numer, points);
  const d = downsampleCounts(denom, points);
  return n.map((value, i) => (d[i] > 0 ? round1((value / d[i]) * 100) : 0));
};

const deltaParts = (current: number, previous: number | null) => {
  const d = previous === null ? null : windowDelta(current, previous);
  return {
    delta: d === null ? "—" : `${Math.abs(d)}%`,
    trend: (d === null || d === 0 ? "flat" : d > 0 ? "up" : "down") as "up" | "down" | "flat",
  };
};

/* Derived facts the stat insights and attention queue speak from. They take
   the entity arrays as arguments so pages can pass LIVE store state — assign
   a source or finish a draft and the line clears immediately. The module
   constants below apply the same rules to the seed snapshot. */

const sourcesLinkedTo = (sources: Source[], type: "campaign" | "polst", id: string) =>
  sources.filter((s) => s.linked?.type === type && s.linked.id === id);

/** A linked object's completion rate (%), resolved from the passed arrays. */
const linkedRate = (
  linked: NonNullable<Source["linked"]>,
  campaigns: Campaign[],
  polsts: SinglePolst[],
): number | null => {
  if (linked.type === "campaign") {
    const c = campaigns.find((x) => x.id === linked.id);
    return c && c.voters > 0 ? (c.completed / c.voters) * 100 : null;
  }
  const p = polsts.find((x) => x.id === linked.id);
  return p && p.votes > 0 ? 100 : null; // a single question completes as it votes
};

/** Sources whose completion trails their object by ≥15 pts on real volume. */
const laggingSources = (campaigns: Campaign[], polsts: SinglePolst[], sources: Source[]) =>
  sources.filter((s) => {
    if (!s.linked || s.voters < 100 || s.completionRate === null) return false;
    const rate = linkedRate(s.linked, campaigns, polsts);
    return rate !== null && s.completionRate <= rate - 15;
  });

/* ── Chart annotations (the stat hero's insight markers) ─────────── */

/** Bucket i's [firstDayIdx, lastDayIdx] — mirrors downsampleCounts' slices
 *  so a marker's date span is exactly the days its spark bucket sums. */
const bucketDayBounds = (len: number, points = SPARK_POINTS): Array<[number, number]> =>
  len <= points
    ? Array.from({ length: len }, (_, i) => [i, i] as [number, number])
    : Array.from({ length: points }, (_, i) => [
        Math.floor((i * len) / points),
        Math.floor(((i + 1) * len) / points) - 1,
      ] as [number, number]);

/* A count doubling is routine campaign traffic; a ratio moving 15% of
   itself is a real mix shift — so rates flag at a lower relative floor. */
const MOVEMENT_FLOOR_PCT = 25;
const MOVEMENT_FLOOR_PCT_RATE = 15;
const MOVEMENT_SCALE_FLOOR = 0.2; // of the series peak — de-noises the quiet tail
const MAX_ANNOTATIONS = 3; // markers stay legible; the chart is not a ruler

/** The spark's material movements, largest first. */
const detectMovements = (spark: number[], floorPct: number): Array<{ bucket: number; pct: number }> => {
  const peak = Math.max(...spark, 0);
  if (peak <= 0) return [];
  const moves: Array<{ bucket: number; pct: number }> = [];
  for (let i = 1; i < spark.length; i++) {
    const prev = spark[i - 1];
    const curr = spark[i];
    if (prev <= 0 || Math.max(prev, curr) < peak * MOVEMENT_SCALE_FLOOR) continue;
    const pct = Math.round(((curr - prev) / prev) * 100);
    if (Math.abs(pct) < floorPct) continue;
    // The final bucket is still collecting (the chart draws it dashed) — a
    // "drop" into partial data is an artifact, not a story.
    if (pct < 0 && i === spark.length - 1) continue;
    moves.push({ bucket: i, pct });
  }
  return moves.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, MAX_ANNOTATIONS);
};

type LifecycleEvent = {
  kind: "launch" | "end";
  date: string;
  name: string;
  views: number; // tie-break: the biggest object most plausibly moved the total
  to: string;
};

/** Every dated start/end across campaigns and polsts — the only things that
 *  can move the workspace totals, since each object's series lives inside
 *  its own [startAt, endAt]. */
const lifecycleEvents = (campaigns: Campaign[], polsts: SinglePolst[]): LifecycleEvent[] => [
  ...campaigns.flatMap((c): LifecycleEvent[] => [
    ...(c.startAt ? [{ kind: "launch" as const, date: c.startAt, name: c.name, views: c.views, to: `/campaigns/${c.id}` }] : []),
    ...(c.endAt ? [{ kind: "end" as const, date: c.endAt, name: c.name, views: c.views, to: `/campaigns/${c.id}` }] : []),
  ]),
  ...polsts.flatMap((p): LifecycleEvent[] => [
    ...(p.startAt ? [{ kind: "launch" as const, date: p.startAt, name: p.question, views: p.views, to: `/polsts/${p.id}` }] : []),
    ...(p.endAt ? [{ kind: "end" as const, date: p.endAt, name: p.question, views: p.views, to: `/polsts/${p.id}` }] : []),
  ]),
];

/** "rose 43%" / "fell 12%" — past tripling, state the multiple instead
 *  of an unreadable "rose 1870%". */
const movePhrase = (pct: number) =>
  pct >= 200 ? `rose ${round1((pct + 100) / 100)}×` : `${pct > 0 ? "rose" : "fell"} ${Math.abs(pct)}%`;

/** Every launch/end in the window becomes a marker whose card states the
 *  metric's movement through that stretch; material movements with no
 *  event in this or the previous bucket become "insight" markers. One
 *  marker per bucket — simultaneous events share a card. */
const annotateStat = (
  subject: string,
  spark: number[] | undefined,
  dates: string[],
  events: LifecycleEvent[],
  isRate = false,
): StatAnnotation[] => {
  if (!spark?.length || !dates.length) return [];
  const bounds = bucketDayBounds(dates.length).slice(0, spark.length);
  const spanLabel = ([from, to]: [number, number]) =>
    from === to ? fmtDate(dates[from]) : `${fmtDate(dates[from])} – ${fmtDate(dates[to])}`;
  /** % change into a bucket, null when there is nothing to compare. */
  const pctAt = (b: number) =>
    b > 0 && spark[b - 1] > 0 ? Math.round(((spark[b] - spark[b - 1]) / spark[b - 1]) * 100) : null;

  const byBucket = new Map<number, LifecycleEvent[]>();
  for (const e of events) {
    const b = bounds.findIndex(([from, to]) => e.date >= dates[from] && e.date <= dates[to]);
    if (b === -1) continue;
    byBucket.set(b, [...(byBucket.get(b) ?? []), e]);
  }

  // Markers explain CHANGE — an event on a flat stretch stays unmarked.
  const annotations: StatAnnotation[] = [...byBucket.entries()].flatMap(([bucket, evs]) => {
    const pct = pctAt(bucket);
    if (pct === null || Math.abs(pct) < 5) return [];
    // The biggest run most plausibly moved the total — it fronts the card.
    const [primary, ...rest] = [...evs].sort((a, b) => b.views - a.views);
    return [{
      bucket,
      dateLabel: spanLabel(bounds[bucket]),
      kind: primary.kind,
      headline: `${primary.name} ${primary.kind === "launch" ? "launched" : "ended"}`,
      detail: `${subject} ${movePhrase(pct)} through this stretch.${
        rest.length ? ` ${rest.length} other ${rest.length === 1 ? "run" : "runs"} changed here too.` : ""
      }`,
      link: {
        label: primary.to.startsWith("/campaigns") ? "Open campaign" : "Open polst",
        to: primary.to,
      },
    }];
  });

  // A movement is explained by an event in its own or the previous bucket
  // (a launch's traffic keeps climbing into the next stretch).
  const floorPct = isRate ? MOVEMENT_FLOOR_PCT_RATE : MOVEMENT_FLOOR_PCT;
  for (const { bucket, pct } of detectMovements(spark, floorPct)) {
    if (byBucket.has(bucket) || byBucket.has(bucket - 1)) continue;
    annotations.push({
      bucket,
      dateLabel: spanLabel(bounds[bucket]),
      kind: "insight",
      headline: `${subject} ${movePhrase(pct)}`,
      detail: "No campaign or polst launched or ended near this stretch — worth a look at sources.",
    });
  }

  return annotations.sort((a, b) => a.bucket - b.bucket);
};

const buildStats = (
  range: StatRange,
  campaigns: Campaign[],
  polsts: SinglePolst[],
): Stat[] => {
  const w = workspaceWindow(range);
  const [prevStart, prevEnd] = windowBounds(range, 1);
  const hasPrev = range !== "All";
  const cur = {
    views: w.series.views.values,
    votes: w.series.votes.values,
    voters: metricWindow("voters", w.start, w.end).values,
    completed: metricWindow("completed", w.start, w.end).values,
  };
  const prev = hasPrev
    ? {
        views: metricWindow("views", prevStart, prevEnd).values,
        votes: metricWindow("votes", prevStart, prevEnd).values,
        voters: metricWindow("voters", prevStart, prevEnd).values,
        completed: metricWindow("completed", prevStart, prevEnd).values,
      }
    : null;
  const prevEngagement = w.prev && w.prev.views > 0 ? round1((w.prev.votes / w.prev.views) * 100) : null;
  const prevCompletion = w.prev && w.prev.voters > 0 ? round1((w.prev.completed / w.prev.voters) * 100) : null;
  // The dashed previous-period line follows the comparison label: a previous
  // window with no comparable traffic draws nothing (a flat-zero dashed line
  // would decorate a comparison every tile honestly suppresses).
  const comparable = prev !== null && w.compareLabel !== null;

  const views: Stat = {
    label: "Total views",
    value: fmtInt(w.views),
    ...deltaParts(w.views, w.prev?.views ?? null),
    spark: downsampleCounts(cur.views),
    ...(comparable ? { previous: downsampleCounts(prev!.views) } : {}),
  };
  const votes: Stat = {
    label: "Total votes",
    value: fmtInt(w.votes),
    ...deltaParts(w.votes, w.prev?.votes ?? null),
    spark: downsampleCounts(cur.votes),
    ...(comparable ? { previous: downsampleCounts(prev!.votes) } : {}),
  };
  const engagement: Stat = {
    label: "Engagement rate",
    value: w.engagementRate !== null ? fmtPct(w.engagementRate, 1) : "—",
    ...deltaParts(w.engagementRate ?? 0, prevEngagement),
    spark: downsampleRate(cur.votes, cur.views),
    ...(comparable ? { previous: downsampleRate(prev!.votes, prev!.views) } : {}),
  };
  const completion: Stat = {
    label: "Completion rate",
    value: w.completionRate !== null ? fmtPct(w.completionRate, 1) : "—",
    ...deltaParts(w.completionRate ?? 0, prevCompletion),
    spark: downsampleRate(cur.completed, cur.voters),
    ...(comparable ? { previous: downsampleRate(prev!.completed, prev!.voters) } : {}),
  };

  // Marker attribution reads the passed (live) arrays, so a campaign created
  // in-session with dates inside the window explains movements immediately.
  const events = lifecycleEvents(campaigns, polsts);
  const dates = w.series.views.dates;
  views.annotations = annotateStat("Views", views.spark, dates, events);
  votes.annotations = annotateStat("Votes", votes.spark, dates, events);
  engagement.annotations = annotateStat("Engagement", engagement.spark, dates, events, true);
  completion.annotations = annotateStat("Completion", completion.spark, dates, events, true);

  const stats = [views, votes, engagement, completion];
  return stats.map((stat) => ({ ...stat, info: STAT_INFO[stat.label] }));
};

/** One definition per metric — canon's words, never restated locally. */
const STAT_INFO: Record<string, string> = {
  "Total views": METRIC_INFO.views,
  "Total votes": METRIC_INFO.votes,
  "Engagement rate": METRIC_INFO.engagementRate,
  "Completion rate": METRIC_INFO.completionRate,
};

/** The live stat strip — Home passes the store's entity arrays so marker
 *  attribution sees in-session campaigns and polsts. Window totals still
 *  derive from the seed series (store-created objects carry zero traffic). */
export const dashboardStats = buildStats;

/** Axis labels for the expanded chart — first / middle / last window day. */
export const STAT_XTICKS: Record<StatRange, string[]> = Object.fromEntries(
  STAT_RANGES.map((range) => {
    const [start, end] = windowBounds(range);
    const mid = workspaceWindow(range).series.views.dates[Math.floor(daysBetween(start, end) / 2)];
    return [range, [fmtDate(start), fmtDate(mid), fmtDate(end)]];
  }),
) as Record<StatRange, string[]>;

/* ── Recommendations (Home's rail) ───────────────────────────────── */

export type Recommendation = {
  id: string;
  /** The action with its evidence — "Go with Modern Holiday — 61%
   *  preference across 6,842 responses". */
  title: string;
  /** The run and the strength of the read — "Holiday Creative · won by
   *  22 points" / "· high confidence". */
  meta: string;
  to: string;
};

/** Result-backed recommendations: every run whose decision question has
 *  a winner speaks one action line with its numbers. Live runs that
 *  reached their target lead (decidable now); decided runs follow,
 *  newest first. Pure over the passed array. */
export function workspaceRecommendations(campaigns: Campaign[], limit = 6): Recommendation[] {
  return campaigns
    .filter((c) => !!c.winner && c.winner.responses > 0 && (c.status === "Ended" || isReadyToDecide(c)))
    .sort(
      (a, b) =>
        Number(a.status === "Ended") - Number(b.status === "Ended") ||
        (b.endAt ?? "").localeCompare(a.endAt ?? ""),
    )
    .slice(0, limit)
    .map((c) => ({
      id: `rec-${c.id}`,
      title: `Go with ${c.winner!.option} — ${c.winner!.pctFor}% preference across ${fmtInt(c.winner!.responses)} responses`,
      meta:
        c.status === "Ended"
          ? `${c.name} · won by ${c.winner!.marginPts} points`
          : c.confidence !== "—"
            ? `${c.name} · ${c.confidence.toLowerCase()} confidence`
            : `${c.name} · still collecting`,
      to: `/campaigns/${c.id}`,
    }));
}

/* ── Ready to decide & attention (Home) ──────────────────────────── */

export const READY_TO_DECIDE: Campaign[] = CAMPAIGNS.filter(isReadyToDecide);

export type ListItem = {
  id: string;
  title: string;
  reason: string;
  tone: "danger" | "warning" | "neutral";
  action: string;
  to: string;
  /** Card-register copy: a verb-led title ("Assign sources to X") and a
   *  one-clause reason, both short enough for a two-line clamp. */
  card: { title: string; reason: string };
};

/** Rule-derived queue, ordered by severity (a→e in the derivation), cap 5.
 *  Pure over the entity arrays: Home and the Shell nag pass the LIVE store
 *  state, so assigning a source, adding a polst, or finishing a draft clears
 *  its item immediately. */
export function attentionItems(
  campaigns: Campaign[],
  polsts: SinglePolst[],
  sources: Source[],
): ListItem[] {
  const items: ListItem[] = [];
  // a) Scheduled campaign starting ≤14 days with no sources — launch is blocked.
  for (const c of campaigns) {
    if (
      c.status === "Scheduled" &&
      c.startAt &&
      daysBetween(TODAY, c.startAt) <= 14 &&
      sourcesLinkedTo(sources, "campaign", c.id).length === 0
    ) {
      items.push({
        id: `${c.id}-no-sources`,
        title: `${c.name} starts ${relativeToToday(c.startAt)} with no sources`,
        reason: `Nothing is set up to collect voters before the ${fmtDate(c.startAt)} start. Add a QR code, link, or embed.`,
        tone: "danger",
        // "Assign" is the verb of the control this lands on (the Sources
        // tab's "Assign source"); "Add source" means create-new (Distribution).
        action: "Assign sources",
        to: `/campaigns/${c.id}?tab=sources`,
        card: {
          title: `Assign sources to ${c.name}`,
          reason: `It starts ${relativeToToday(c.startAt)} with nothing collecting voters.`,
        },
      });
    }
  }
  // b) A source eroding its campaign's completion on real volume.
  for (const s of laggingSources(campaigns, polsts, sources)) {
    const rate = linkedRate(s.linked!, campaigns, polsts) ?? 0;
    items.push({
      id: `${s.id}-completion`,
      title: `${s.name} completion is ${fmtPct(s.completionRate!, 0)} — the campaign averages ${fmtPct(rate, 0)}`,
      reason: `${fmtInt(s.voters)} voters arrived through it, but most stop before the last question. Check the landing step.`,
      tone: "warning",
      action: "View source",
      to: "/distribution",
      card: {
        title: `Check ${s.name}`,
        reason: `Completion is ${fmtPct(s.completionRate!, 0)} — the campaign averages ${fmtPct(rate, 0)}.`,
      },
    });
  }
  // c) The nearest key date (≤21 days out) with nothing planned against it.
  const attachedEvents = new Set([
    ...campaigns.filter((c) => c.status !== "Archived").map((c) => c.event),
    ...polsts.filter((p) => p.status !== "Archived").map((p) => p.event),
  ]);
  const uncovered = KEY_DATES.filter(
    (k) => daysBetween(TODAY, k.start) >= 0 && daysBetween(TODAY, k.start) <= 21 && !attachedEvents.has(k.id),
  ).sort((a, b) => a.start.localeCompare(b.start))[0];
  if (uncovered) {
    items.push({
      id: `${uncovered.id}-uncovered`,
      title: `Nothing is planned for ${uncovered.title} (${fmtDate(uncovered.start)})`,
      reason: "No campaign or polst is attached to this key date yet.",
      tone: "warning",
      action: "Plan a campaign",
      to: `/campaigns/new?event=${uncovered.id}`,
      card: {
        title: `Plan for ${uncovered.title}`,
        reason: `Nothing is attached to this key date yet (${fmtDate(uncovered.start)}).`,
      },
    });
  }
  // d) Draft campaigns with nothing inside them.
  for (const c of campaigns) {
    if (c.status === "Draft" && !c.chain.length) {
      items.push({
        id: `${c.id}-empty`,
        title: `${c.name} has no polsts yet`,
        reason: "The draft can't be scheduled until it has at least one question.",
        tone: "neutral",
        action: "Add polsts",
        to: `/campaigns/${c.id}?tab=polsts`,
        card: {
          title: `Add polsts to ${c.name}`,
          reason: "The draft can't be scheduled while it's empty.",
        },
      });
    }
  }
  // e) Draft polsts still missing a schedule.
  for (const p of polsts) {
    if (p.status === "Draft" && !p.startAt) {
      items.push({
        id: `${p.id}-unfinished`,
        title: `Finish "${p.question}"`,
        reason: "The draft has both options but no schedule or source yet.",
        tone: "neutral",
        action: "Finish polst",
        to: `/polsts/${p.id}`,
        card: {
          title: "Finish your draft polst",
          reason: `"${p.question}" has no schedule or source yet.`,
        },
      });
    }
  }
  return items.slice(0, 5);
}

/** Seed-time snapshot of the queue. scripts/verify-model.ts asserts against
 *  it (invariants 9 & 17); no page reads it — every UI surface derives the
 *  queue live from the store via attentionItems(...). */
export const ATTENTION_ITEMS: ListItem[] = attentionItems(CAMPAIGNS, SINGLE_POLSTS, SOURCES);

/* ── Calendar (Home) ─────────────────────────────────────────────── */

/** The month the calendar opens on, and "today". Navigation moves off this. */
/** The calendar opens on the live clock's month. */
export const CALENDAR_MONTH = {
  month: Number(TODAY.slice(5, 7)) - 1,
  year: Number(TODAY.slice(0, 4)),
  today: TODAY,
};

export type CalendarItemKind = "campaign" | "polst" | "date";

/** Campaigns/polsts render as bars from start to end; key dates carry no
 *  lifecycle status — they are moments, not objects. */
export type CalendarItem = {
  id: string;
  title: string;
  kind: CalendarItemKind;
  status?: Status;
  start: string;
  end: string;
  to?: string;
};

export const CALENDAR_ITEMS: CalendarItem[] = [
  ...CAMPAIGNS.filter((c) => c.startAt && c.status !== "Draft" && c.status !== "Archived").map((c) => ({
    id: c.id,
    title: c.name,
    kind: "campaign" as const,
    status: c.status,
    start: c.startAt!,
    end: c.endAt ?? c.startAt!,
    to: `/campaigns/${c.id}`,
  })),
  ...SINGLE_POLSTS.filter((p) => p.startAt && p.status !== "Draft" && p.status !== "Archived").map((p) => ({
    id: p.id,
    title: p.question,
    kind: "polst" as const,
    status: p.status,
    start: p.startAt!,
    end: p.endAt ?? p.startAt!,
    to: `/polsts/${p.id}`,
  })),
  ...KEY_DATES.map((k) => ({ id: k.id, title: k.title, kind: "date" as const, start: k.start, end: k.end })),
];

/* ── What changed & notifications ────────────────────────────────── */

export type WhatChanged = { id: string; text: string; at: string; to: string };

/** Feeds render newest-first; sorting here keeps every consumer honest. */
const byMostRecent = <T extends { at: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => b.at.localeCompare(a.at));

/* Milestone stamps agree with the derived daily series: cumulative voters
   cross 1,200 (Packaging) on Jun 13 and 2,000 (Summer) on Jun 15 — checked
   by scripts/verify-model.ts. */
export const WHAT_CHANGED: WhatChanged[] = byMostRecent(shiftSeed([
  { id: "wc-packaging-target", text: "Packaging Direction Test passed its 1,200-voter target", at: "2026-06-13", to: "/campaigns/packaging-direction" },
  { id: "wc-conference", text: "QR — Conference Booth completion fell to 41%", at: "2026-06-14", to: "/distribution" },
  { id: "wc-flavor-report", text: "Flavor Launch Recap report is ready", at: "2026-06-11", to: "/analytics/reports" },
  { id: "wc-summer-2k", text: "Summer Flavor Lineup passed 2,000 voters", at: "2026-06-15", to: "/campaigns/summer-flavor-lineup" },
]));

/** Drop feed entries a run's own record now contradicts: when a schedule
 *  edit or an in-session ending moves a campaign's end earlier, milestones
 *  stamped after the new end can no longer have happened ("passed 2,000
 *  voters · today" under "Voting closed Jun 10"). Pass the LIVE campaigns;
 *  entries that don't point at a campaign pass through untouched. */
export const clipToRun = <T extends { at: string; to: string }>(
  items: T[],
  campaigns: Array<Pick<Campaign, "id" | "endAt">>,
): T[] =>
  items.filter((item) => {
    const id = item.to.match(/^\/campaigns\/([^/?#]+)/)?.[1];
    if (!id) return true;
    const campaign = campaigns.find((c) => c.id === id);
    return !campaign || !campaign.endAt || item.at <= campaign.endAt;
  });

export type WorkspaceNotification = {
  id: string;
  title: string;
  body: string;
  at: string;
  to: string;
  read: boolean;
};

/* Stamps agree with the derived series: Summer crosses 2,000 voters on
   Jun 15 (2,103 is today's total), and Holiday first clears the Leading
   threshold (≥70% of its 1,200 target: 892 voters = 74%) on Jun 15. */
export const WORKSPACE_NOTIFICATIONS: WorkspaceNotification[] = byMostRecent(shiftSeed([
  { id: "nt-packaging-target", title: "Packaging Direction Test passed its target", body: "1,486 of 1,200 voters — the recommendation is ready to review.", at: "2026-06-13", to: "/campaigns/packaging-direction", read: false },
  { id: "nt-conference", title: "QR — Conference Booth completion fell to 41%", body: "Scans keep coming, but most voters stop before the last question.", at: "2026-06-14", to: "/distribution", read: false },
  { id: "nt-flavor-report", title: "Flavor Launch Recap report is ready", body: "The decision report for the ended run is ready to preview.", at: "2026-06-11", to: "/analytics/reports", read: true },
  { id: "nt-summer-2k", title: "Summer Flavor Lineup passed 2,000 voters", body: "2,103 voters so far, against a 2,500 target.", at: "2026-06-15", to: "/campaigns/summer-flavor-lineup", read: false },
  { id: "nt-holiday-leading", title: "Holiday Gifting Bundles moved to Leading", body: "Trio Box has 55% of responses and Pantry Sampler has 45%, with 74% of the participant target reached.", at: "2026-06-15", to: "/campaigns/holiday-gifting-bundles", read: false },
]));

/* ── Reports ─────────────────────────────────────────────────────── */

export type WorkspaceReport = {
  id: string;
  name: string;
  linked: { type: "campaign" | "polst"; id: string };
  /** Deliverable state — deliberately not the lifecycle `Status` vocabulary. */
  state: "Ready" | "Draft";
  createdAt: string;
};

export const REPORTS: WorkspaceReport[] = shiftSeed([
  { id: "flavor-launch-recap-report", name: "Flavor Launch Recap — decision report", linked: { type: "campaign", id: "flavor-launch-recap" }, state: "Ready", createdAt: "2026-06-11" },
  { id: "label-layout-report", name: "Label Layout — results summary", linked: { type: "polst", id: "label-layout" }, state: "Ready", createdAt: "2026-06-01" },
  { id: "packaging-direction-report", name: "Packaging Direction Test — decision report", linked: { type: "campaign", id: "packaging-direction" }, state: "Draft", createdAt: "2026-06-15" },
]);

/* ── Usage (plan/billing surface) ────────────────────────────────── */

const monthTotals = (series: DailySeries, monthPrefix: string) =>
  series.values.reduce((a, v, i) => (series.dates[i].startsWith(monthPrefix) ? a + v : a), 0);

export const USAGE = (() => {
  const all = workspaceWindow("All");
  // The two most recent calendar months, derived from the live clock —
  // the labels carry the year so the table never guesses one.
  const currentMonth = TODAY.slice(0, 7);
  const previousMonth = new Date(Date.parse(`${currentMonth}-01`) - 86_400_000)
    .toISOString()
    .slice(0, 7);
  const monthLabel = (prefix: string) =>
    `${MONTH_SHORT[Number(prefix.slice(5, 7)) - 1]} ${prefix.slice(0, 4)}`;
  const monthRow = (prefix: string) => ({
    month: monthLabel(prefix),
    views: monthTotals(all.series.views, prefix),
    votes: monthTotals(all.series.votes, prefix),
  });
  return {
    campaignsCreated: CAMPAIGNS.length,
    polstsCreated: CAMPAIGNS.reduce((a, c) => a + c.chain.length, 0) + SINGLE_POLSTS.length,
    totalViews: all.views,
    totalVotes: all.votes,
    byMonth: [monthRow(previousMonth), monthRow(currentMonth)],
  };
})();

/* ── Answer-time heatmap ─────────────────────────────────────────── */

export const HEATMAP_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const HEATMAP_BUCKETS = ["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"] as const;

const heatCache = new Map<WindowRange, number[][]>();

/** Day × 2-hour vote density, scaled to the window's REAL vote total. */
export function answerHeat(range: WindowRange): number[][] {
  const hit = heatCache.get(range);
  if (hit) return hit;
  const heat = timeHeat(workspaceWindow(range).votes);
  heatCache.set(range, heat);
  return heat;
}

/* ── Vote velocity (polst detail) ────────────────────────────────────
   votes/hr over the trailing 1h / 6h / 24h, staging's readout. Derived
   from the polst's REAL daily series spread across the daypart curve
   (engine.hourlyVotes) — active runs only; nothing else has a pace. */

export type VoteVelocity = { lastHour: number; perHour6: number; perHour24: number };

export function voteVelocity(polst: SinglePolst): VoteVelocity | null {
  if (polst.status !== "Active" || polst.votes === 0) return null;
  const series = polstSeries(polst, "votes");
  const on = (iso: string) => {
    const i = series.dates.indexOf(iso);
    return i === -1 ? 0 : series.values[i];
  };
  const hours = hourlyVotes(polst.id, on(TODAY), on(addDays(TODAY, -1)));
  const rate = (n: number) => round1(hours.slice(-n).reduce((a, b) => a + b, 0) / n);
  return { lastHour: rate(1), perHour6: rate(6), perHour24: rate(24) };
}

/* ── Device & platform mix ───────────────────────────────────────── */

export type MixSlice = { label: string; value: number; detail?: string };

/** A labeled A/B pair for the kit's SplitBar. */
export type Split = {
  a: { label: string; value: number; detail?: string };
  b: { label: string; value: number; detail?: string };
};

const DEVICE_SHARES = [
  { label: "Mobile", value: 64 },
  { label: "Desktop", value: 31 },
  { label: "Tablet", value: 5 },
];

const PLATFORM_SHARES = [
  { label: "iOS", value: 41 },
  { label: "Android", value: 23 },
  { label: "macOS", value: 19 },
  { label: "Windows", value: 14 },
  { label: "Other", value: 3 },
];

const BROWSER_SHARES = [
  { label: "Chrome", value: 46 },
  { label: "Mobile Safari", value: 28 },
  { label: "Safari", value: 14 },
  { label: "Other", value: 12 },
];

const mixFor = (shares: Array<{ label: string; value: number }>, range: WindowRange): MixSlice[] => {
  const counts = allocate(workspaceWindow(range).voters, shares.map((s) => s.value));
  return shares.map((s, i) => ({ ...s, detail: `${fmtInt(counts[i])} voters` }));
};

export const deviceMix = (range: WindowRange): MixSlice[] => mixFor(DEVICE_SHARES, range);
export const platformMix = (range: WindowRange): MixSlice[] => mixFor(PLATFORM_SHARES, range);
export const browserMix = (range: WindowRange): MixSlice[] => mixFor(BROWSER_SHARES, range);

/* ── Geography (country mix) ─────────────────────────────────────────
   Authored share-of-voters weights (US-heavy, like the real audience)
   plus a completion delta per country — the window's REAL voter and
   completed totals are allocated across them exactly, the same pattern
   sources use, so the table reconciles with every headline number. */

const COUNTRY_SHARES = [
  { label: "United States", value: 63, completionDelta: 2 },
  { label: "Canada", value: 12, completionDelta: 1 },
  { label: "United Kingdom", value: 9, completionDelta: -2 },
  { label: "Australia", value: 7, completionDelta: -3 },
  { label: "Germany", value: 5, completionDelta: -5 },
  { label: "Other", value: 4, completionDelta: -7 },
];

export type CountryRow = {
  id: string;
  country: string;
  /** Share of the window's voters, in %. */
  share: number;
  voters: number;
  completed: number;
  completionRate: number | null; // completed/voters*100, 1dp
};

const countryCache = new Map<WindowRange, CountryRow[]>();

export function countryMix(range: WindowRange): CountryRow[] {
  const hit = countryCache.get(range);
  if (hit) return hit;
  const w = workspaceWindow(range);
  const voters = allocate(w.voters, COUNTRY_SHARES.map((c) => c.value));
  const completed = allocate(
    w.completed,
    COUNTRY_SHARES.map((c) => c.value * Math.max(0, (w.completionRate ?? 0) + c.completionDelta)),
  );
  const rows = COUNTRY_SHARES.map((c, i) => ({
    id: c.label,
    country: c.label,
    share: c.value,
    voters: voters[i],
    completed: Math.min(completed[i], voters[i]),
    completionRate: voters[i] > 0 ? round1((Math.min(completed[i], voters[i]) / voters[i]) * 100) : null,
  }));
  countryCache.set(range, rows);
  return rows;
}

/* ── Share links & embed snippets (per object) ───────────────────── */

export const shareUrl = (type: "campaign" | "polst", id: string) =>
  `https://polst.app/${type === "campaign" ? "c" : "p"}/${id}`;

export const embedIframe = (id: string) => `<iframe
  src="https://polst.app/embed/c/${id}"
  width="100%" height="600" frameborder="0"
  style="border:none;border-radius:12px;min-width:320px"
  title="Polst campaign" loading="lazy"></iframe>`;

export const embedScript = (id: string) => `<div id="polst-campaign"></div>
<script async src="https://polst.app/embed.js"
  data-campaign="${id}"></script>`;

/** "Minimal label · 58% vs 42%" | "—" — the one string form of a winner.
 *  The audit's language contract: lead with both percentages, never a bare
 *  margin ("Points?" was real feedback; "never display bare pts" is the
 *  follow-up). The percentages are the decision question's split; surfaces
 *  with room add the response count via `winnerEvidence`. */
export const winnerLabel = (c: { winner: CampaignWinner | null }) =>
  c.winner ? `${c.winner.option} · ${c.winner.pctFor}% vs ${c.winner.pctAgainst}%` : "—";

/** The full-evidence sentence form — "58% selected Minimal label; 42%
 *  selected Bold label (1,055 responses on the decision question)". Reports
 *  and insight readouts speak this; chips speak `winnerLabel`. */
export const winnerEvidence = (c: {
  winner: CampaignWinner | null;
  chain: ChainQuestion[];
  decisionIndex: number;
}) => {
  if (!c.winner) return "—";
  const q = c.chain[c.decisionIndex];
  const loser = c.winner.option === q.optionA ? q.optionB : q.optionA;
  return `${c.winner.pctFor}% selected ${c.winner.option}; ${c.winner.pctAgainst}% selected ${loser} (${fmtInt(c.winner.responses)} responses on the decision question)`;
};

/** The plain-language verdict campaign-facing surfaces speak — "Result so
 *  far" columns, brief eyebrows, ready strips. The internal `DecisionSignal`
 *  taxonomy (canon's signalFor) still drives it, but its raw labels never
 *  reach the UI (the exported report is the one deliberate exception).
 *  Ended runs speak past voice — nothing is "ahead" in a closed race. */
export const verdictLabel = (c: {
  status: Status;
  signal: DecisionSignal;
  winner: CampaignWinner | null;
}): string => {
  switch (c.signal) {
    case "Decisive":
    case "Leading":
      return winnerLabel(c);
    case "Directional":
      if (!c.winner) return "—";
      return c.status === "Ended"
        ? `${c.winner.option} finished slightly ahead`
        : `${c.winner.option} slightly ahead`;
    case "Too close":
      return c.status === "Ended" ? "Ended too close to call" : "Too close to call";
    case "Collecting":
      return "Collecting votes";
    case "Inconclusive":
      return "No clear winner";
    default:
      return "—";
  }
};

/** The one headline framing of the call — the DecisionBrief and the decision
 *  report speak the same words ("Decided: Trio Box · 55% vs 45%"), so the
 *  report never prints the raw result label twice (eyebrow verdict +
 *  headline call).
 *  Live voice ("Early read") is reserved for runs still collecting; a
 *  finished run's read is final, just not necessarily decisive. */
export const headlineLabel = (c: {
  status: Status;
  signal: DecisionSignal;
  winner: CampaignWinner | null;
}): string => {
  switch (c.signal) {
    case "Decisive":
      return c.status === "Ended"
        ? `Decided: ${winnerLabel(c)}`
        : `Recommended: ${winnerLabel(c)}`;
    case "Leading":
      return `Recommended: ${winnerLabel(c)}`;
    case "Directional":
      return c.status === "Ended"
        ? `Ended: ${winnerLabel(c)} — short of decisive`
        : `Early read: ${winnerLabel(c)}`;
    case "Too close":
      return c.status === "Ended"
        ? `Ended too close to call — ${winnerLabel(c)}`
        : `Too close to call — ${winnerLabel(c)}`;
    case "Collecting":
      return `Collecting — ${winnerLabel(c)} so far`;
    case "Inconclusive":
      return "Ended without a clear winner";
    default:
      return "No votes yet";
  }
};

/** The short ready-state title every ready surface speaks. "Ready to decide"
 *  on a still-collecting run read as "campaign ended, results ready" — it
 *  wasn't. Ended runs say so; live runs state the evidence fact instead:
 *  the target is reached, or the lead is strong on volume short of it. */
export const readyTitle = (c: { status: Status; voters: number; target?: number }) =>
  c.status === "Ended"
    ? "Results ready"
    : c.target && c.voters >= c.target
      ? "Target reached"
      : "Strong lead";

/** The one status-aware eyebrow above `headlineLabel`. The DecisionBrief and
 *  the decision report both speak it — "Results ready · High confidence" once
 *  a run has ended, "Target reached · … — collecting until …" while a live
 *  run's evidence supports the call, otherwise the plain verdict with its
 *  evidence volume — so the two surfaces can never drift, and the report
 *  never opens with the raw lead label directly above the headline. */
export const decisionEyebrow = (c: {
  status: Status;
  signal: DecisionSignal;
  confidence: Confidence;
  winner: CampaignWinner | null;
  voters: number;
  target?: number;
  endAt?: string;
}): { label: string; ready: boolean } =>
  isReadyToDecide(c)
    ? {
        ready: true,
        label: `${readyTitle(c)}${
          c.confidence !== "—" ? ` · ${c.confidence} confidence` : ""
        }${c.status !== "Ended" && c.endAt ? ` — collecting until ${fmtDate(c.endAt)}` : ""}`,
      }
    : {
        ready: false,
        label: `${verdictLabel(c)} — ${fmtInt(c.voters)}${
          c.target ? ` of ${fmtInt(c.target)}` : ""
        } voters`,
      };

/* ── Team (Settings) ─────────────────────────────────────────────────
   Staging's model: members are provisioned brand-only accounts (no
   invite email), and everyone but the owner is a Manager. */

export type TeamRole = "Owner" | "Manager";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  /** First sign-in date; absent while the provisioned account is unused. */
  joined?: string;
};

export const TEAM: TeamMember[] = shiftSeed([
  { id: "owner", name: WORKSPACE.owner, email: WORKSPACE.email, role: "Owner", joined: "2026-01-12" },
  { id: "strategist", name: "Elena Morris", email: "elena@northstarpantry.co", role: "Manager", joined: "2026-02-03" },
  { id: "analyst", name: "Devon Park", email: "devon@northstarpantry.co", role: "Manager", joined: "2026-04-18" },
  // Provisioned three days before the anchor for the agency; hasn't signed in yet.
  { id: "agency", name: "Sam Ellery", email: "sam@brightside.agency", role: "Manager" },
]);

/* ── Campaign reviews (the marketer's resolution record) ─────────────
   The audit's Insights spec: every campaign insight carries "the decision
   taken, owner, date, and optional follow-up". A review is a human record,
   never computed — its absence is itself a state ("New": nobody has
   reviewed the findings yet), which is why "New" is not a stored value. */

export type CampaignReviewState = "Monitoring" | "Acted on" | "Dismissed" | "Resolved";

export type CampaignReview = {
  campaignId: string;
  state: CampaignReviewState;
  owner: string; // team member name
  at: string; // ISO date the resolution was recorded
  note?: string; // what was decided / why it was set aside
};

export const CAMPAIGN_REVIEWS: CampaignReview[] = shiftSeed([
  {
    campaignId: "flavor-launch-recap",
    state: "Acted on",
    owner: "Elena Morris",
    at: "2026-06-12",
    note: "Citrus Mint locked for the retail sell-in; report shared with the retail team.",
  },
  {
    campaignId: "spring-email-creative",
    state: "Resolved",
    owner: "Devon Park",
    at: "2026-05-02",
    note: "Winning subject line shipped in the spring send with the outdoor-picnic hero.",
  },
  {
    campaignId: "homepage-message-hierarchy",
    state: "Dismissed",
    owner: "Elena Morris",
    at: "2026-05-21",
    note: "No homepage winner declared — running a focused follow-up with the stronger proof and action choices instead.",
  },
]);

/* ── Developer platform (Settings) ───────────────────────────────────
   Staging exposes a working Developer section — scoped API keys and up
   to ten webhook endpoints — so the dashboard does too; the old "Pro"
   teaser contradicted a capability the workspace actually has. Keys
   carry a non-recoverable secret (shown once at creation); the seeds
   mirror a workspace that already integrated once. */

export type ApiScope = "Read analytics" | "Manage polsts" | "Manage campaigns";
export const API_SCOPES: ApiScope[] = ["Read analytics", "Manage polsts", "Manage campaigns"];

export type ApiKey = {
  id: string;
  name: string;
  /** Displayable prefix + last 4 — the secret itself is never stored. */
  tokenPreview: string;
  scopes: ApiScope[];
  createdAt: string;
  lastUsed?: string;
};

export const API_KEYS: ApiKey[] = shiftSeed([
  {
    id: "key-site",
    name: "Website embeds",
    tokenPreview: "pk_live_••••4h2m",
    scopes: ["Read analytics"],
    createdAt: "2026-03-02",
    lastUsed: "2026-06-14",
  },
]);

export const WEBHOOK_EVENTS = [
  "polst.vote.created",
  "campaign.completed",
  "campaign.ended",
  "source.scan",
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Staging's cap: up to ten webhook endpoints per workspace. */
export const WEBHOOK_LIMIT = 10;

export type Webhook = {
  id: string;
  url: string;
  events: WebhookEvent[];
  createdAt: string;
  /** Last delivery result; absent before the first event fires. */
  lastDelivery?: { at: string; ok: boolean };
};

export const WEBHOOKS: Webhook[] = shiftSeed([
  {
    id: "wh-warehouse",
    url: "https://hooks.northstarpantry.co/polst",
    events: ["campaign.ended", "polst.vote.created"],
    createdAt: "2026-04-22",
    lastDelivery: { at: "2026-06-14", ok: true },
  },
]);

/* ── Integrations (Settings) ─────────────────────────────────────── */

/** Ad and analytics platforms only — embeds, QR codes, and links are native
 *  sources, not integrations. None are connected in this workspace. */
export type Integration = {
  id: string;
  name: string;
  icon: string;
  feeds: string;
  connected: boolean;
  lastSync?: string;
};

export const INTEGRATIONS: Integration[] = [
  { id: "int-meta", name: "Meta Ads", icon: "ads_click", feeds: "Paid reach, CPC, and creative formats", connected: false },
  { id: "int-tiktok", name: "TikTok Ads", icon: "music_note", feeds: "Paid reach, CPC, and creative formats", connected: false },
  { id: "int-ga4", name: "Google Analytics", icon: "query_stats", feeds: "Visits, bounce, and referral sources", connected: false },
  { id: "int-klaviyo", name: "Klaviyo", icon: "mail", feeds: "Sends, opens, clicks, and unsubscribes", connected: false },
];

/* ── polst imagery ───────────────────────────────────────────────── */

/** Deterministic tiny hash so every polst side keeps the same photo. */
const imageSeed = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 997;
  return hash + 1;
};

/** The curated photo library — hand-picked food / packaging / grocery
 *  photography with known crops, so the product face is never at the mercy
 *  of a random placeholder service. */
const IMAGE_LIBRARY = [
  "1504674900247-0877df9cc836", // plated dish, warm light
  "1512621776951-a57141f2eefd", // fresh salad bowl
  "1542838132-92c53300491e", // grocery shelves
  "1578985545062-69928b1d9587", // layered cake close-up
  "1568901346375-23c9450c58cd", // burger straight-on
  "1571091718767-18b5b1457add", // burger and fries
  "1550989460-0adf9ea622e2", // preserve jar
  "1606787366850-de6330128bfc", // cooking prep
  "1585238342024-78d387f4a707", // tomatoes on board
  "1543168256-418811576931", // tea packaging flat lay
  "1587049352846-4a222e784d38", // honey jars
  "1505253716362-afaea1d3d1af", // breakfast bowls
  "1467453678174-768ec283a940", // fruit crate
  "1519996529931-28324d5a630e", // picnic spread
  "1607349913338-fca6f7fc42d0", // snack pour
  "1599490659213-e2b9527bd087", // pantry goods
  "1610348725531-843dff563e2c", // meal kit box
  "1534483509719-3feaee7c30da", // citrus halves
  "1621939514649-280e2ee25f60", // stacked cookies
  "1553456558-aff63285bdd1", // iced drinks
] as const;

const libraryUrl = (index: number, w: number, h: number) =>
  `https://images.unsplash.com/photo-${IMAGE_LIBRARY[index]}?w=${w}&h=${h}&fit=crop&q=70`;

/** Deterministic curated image URL — one place owns sizing and quality. */
export const curatedImage = (key: string, w = 600, h = 450) =>
  libraryUrl(imageSeed(key) % IMAGE_LIBRARY.length, w, h);

/** Round-robin photo assignment in data-declaration order (standalone polsts,
 *  then every campaign chain question): each library photo is used evenly and
 *  same-page neighbours never collide. Unknown keys fall back to the hash. */
let imageAssignments: Map<string, number> | null = null;
const assignedImageIndex = (key: string): number | undefined => {
  if (!imageAssignments) {
    imageAssignments = new Map();
    let cursor = 0;
    const assign = (assignKey: string) => {
      if (!imageAssignments!.has(assignKey)) {
        imageAssignments!.set(assignKey, cursor++ % IMAGE_LIBRARY.length);
      }
    };
    SINGLE_POLSTS.forEach((polst) => {
      assign(`${polst.id}-a`);
      assign(`${polst.id}-b`);
    });
    CAMPAIGNS.forEach((campaign) =>
      campaign.chain.forEach((q) => {
        assign(`${q.id}-a`);
        assign(`${q.id}-b`);
      }),
    );
  }
  return imageAssignments.get(key);
};

/** Every A/B visual in the dashboard resolves through this one helper, so the
 *  photo source can be swapped in a single place. */
export const polstImage = (id: string, side: "a" | "b", w = 600, h = 450) => {
  const key = `${id}-${side}`;
  const index = assignedImageIndex(key) ?? imageSeed(key) % IMAGE_LIBRARY.length;
  return libraryUrl(index, w, h);
};

/** A dashboard polst as the consumer card renders it: the real option pair
 *  (label · image · votes) derived from splitA and the vote count. */
export const polstOptions = (polst: {
  id: string;
  optionA: string;
  optionB: string;
  splitA: number;
  votes: number;
}): [PollOption, PollOption] => {
  const votesA = Math.round((polst.votes * polst.splitA) / 100);
  return [
    { label: polst.optionA, image: polstImage(polst.id, "a", 600, 450), votes: votesA },
    { label: polst.optionB, image: polstImage(polst.id, "b", 600, 450), votes: polst.votes - votesA },
  ];
};

/* ── Shared formatter (kit) ──────────────────────────────────────── */

/** Integer formatter for kit primitives; tolerates undefined counts. */
export const formatNumber = (n: number | undefined): string => (n ?? 0).toLocaleString("en-US");
