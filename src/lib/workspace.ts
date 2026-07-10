import type { PollOption } from "@/lib/poll";

/* ══════════════════════════════════════════════════════════════════
   BRAND WORKSPACE — mock data for the Polst V1 dashboard
   ────────────────────────────────────────────────────────────────
   A mockup only: nothing here is fetched or persisted. Copy is written
   in plain, operator-facing language — no internal jargon.
   ══════════════════════════════════════════════════════════════════ */

/** Every object state the dashboard can render. `StatusBadge` maps each
 *  onto a tone in one place (success / accent / danger / neutral). */
export type Status =
  | "Active"
  | "Scheduled"
  | "Draft"
  | "Completed"
  | "Archived"
  | "Needs attention"
  | "Ready"
  | "Inconclusive"
  | "Assigned"
  | "Unassigned";

/** The in-page status filters shared by Campaigns and Polsts. */
export const STATUS_FILTERS = [
  "All",
  "Active",
  "Scheduled",
  "Drafts",
  "Completed",
  "Archived",
] as const;

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

/* ── Home: compact stats bar ─────────────────────────────────────── */

export type Stat = {
  label: string;
  value: string;
  /** The period-over-period change, e.g. "62%" (arrow + colour come from trend). */
  delta: string;
  trend?: "up" | "down" | "flat";
  spark?: number[];
  /** The metric's definition — formula and denominator, in plain words. */
  info?: string;
  /** Short, metric-specific actions shown beside the expanded chart. */
  insights?: Array<{
    text: string;
    to: string;
    tone: "success" | "warning" | "danger" | "accent";
  }>;
};

export type StatRange = "7D" | "30D" | "90D" | "All";
export const STAT_RANGES: StatRange[] = ["7D", "30D", "90D", "All"];

/** One definition per metric — attached to every stat so any number on the
 *  strip can be inspected. The formulas must hold across the workspace. */
const STAT_INFO: Record<string, string> = {
  "Total views":
    "Times a Polst was shown, across every campaign, standalone Polst, and source in this workspace.",
  "Total votes":
    "Choices tapped across the same scope. One voter answering three questions counts as three votes.",
  "Engagement rate": "Total votes ÷ total views for the period.",
  "Completion rate":
    "Voters who finished a full Polst sequence ÷ voters who started one.",
};

const trendSentence = (stat: Stat, range: StatRange) => {
  const subject = stat.label === "Total views" ? "Views" : stat.label === "Total votes" ? "Votes" : stat.label;
  const movement = stat.trend === "down" ? "fell" : stat.trend === "up" ? "rose" : "held steady";
  return range === "All"
    ? `${subject} ${movement} ${stat.delta} since launch.`
    : `${subject} ${movement} ${stat.delta} versus the previous period.`;
};

const STAT_INSIGHTS: Record<
  string,
  (
    stat: Stat,
    range: StatRange,
  ) => Array<{
    text: string;
    to: string;
    tone: "success" | "warning" | "danger" | "accent";
  }>
> = {
  "Total views": (stat, range) => [
    {
      text: trendSentence(stat, range),
      to: "/analytics",
      tone: stat.trend === "down" ? "danger" : "success",
    },
    {
      text: "QR traffic saw the largest decline: 42% fewer visits.",
      to: "/distribution",
      tone: "warning",
    },
    {
      text: "Game Day Creative Test has no live sources yet.",
      to: "/campaigns/game-day-creative",
      tone: "danger",
    },
  ],
  "Total votes": (stat, range) => [
    {
      text: trendSentence(stat, range),
      to: "/analytics",
      tone: stat.trend === "down" ? "danger" : "success",
    },
    {
      text: "Website delivers 48% of all responses.",
      to: "/distribution",
      tone: "success",
    },
    {
      text: "Holiday Gifting Bundles is 308 responses short of target.",
      to: "/campaigns/holiday-gifting-bundles",
      tone: "warning",
    },
  ],
  "Engagement rate": (stat, range) => [
    {
      text:
        range === "All"
          ? `Engagement rose ${stat.delta} since launch to ${stat.value}.`
          : `Engagement is up ${stat.delta} to ${stat.value}.`,
      to: "/analytics",
      tone: "success",
    },
    {
      text: "QR engagement trails website traffic by 3.8 points.",
      to: "/distribution",
      tone: "warning",
    },
    {
      text: "Packaging questions have the strongest response rate.",
      to: "/campaigns/packaging-direction",
      tone: "success",
    },
  ],
  "Completion rate": (stat, range) => [
    {
      text:
        range === "All"
          ? `Completion rose ${stat.delta} since launch to ${stat.value}.`
          : `Completion is up ${stat.delta} to ${stat.value}.`,
      to: "/analytics",
      tone: "success",
    },
    {
      text: "Conference Booth QR has the most room to grow: 293 scans but only 41% completion.",
      to: "/distribution",
      tone: "danger",
    },
    {
      text: "Its landing step is the biggest lever.",
      to: "/distribution",
      tone: "accent",
    },
  ],
};

const withInfo = (stats: Stat[], range: StatRange) =>
  stats.map((stat) => ({
    ...stat,
    info: STAT_INFO[stat.label],
    insights: STAT_INSIGHTS[stat.label]?.(stat, range),
  }));

/** Mini-stats by range — values, deltas, and shape all shift with the filter.
 *  Volumes reconcile with the rest of the workspace: campaigns run ~1–2k
 *  responses each, so a 30-day window holds thousands of votes, not dozens. */
export const DASHBOARD_STATS: Record<StatRange, Stat[]> = {
  "7D": withInfo([
    { label: "Total views", value: "4,120", delta: "9%", trend: "down", spark: [720, 640, 660, 590, 560, 500, 450] },
    { label: "Total votes", value: "612", delta: "6%", trend: "down", spark: [104, 96, 98, 88, 82, 76, 68] },
    { label: "Engagement rate", value: "14.9%", delta: "1.2%", trend: "up", spark: [14.2, 14.4, 14.5, 14.6, 14.8, 14.8, 15] },
    { label: "Completion rate", value: "66.2%", delta: "2.1 pts", trend: "up", spark: [65, 65, 66, 66, 66, 66, 67] },
  ], "7D"),
  "30D": withInfo([
    { label: "Total views", value: "17,240", delta: "18%", trend: "down", spark: [820, 760, 740, 680, 620, 560, 480] },
    { label: "Total votes", value: "2,431", delta: "11%", trend: "down", spark: [118, 108, 112, 96, 92, 84, 74] },
    { label: "Engagement rate", value: "14.1%", delta: "4.2%", trend: "up", spark: [12.8, 13.1, 13.2, 13.6, 13.8, 14, 14.1] },
    { label: "Completion rate", value: "65.0%", delta: "5.7 pts", trend: "up", spark: [61, 63, 62, 64, 64, 65, 65] },
  ], "30D"),
  "90D": withInfo([
    { label: "Total views", value: "46,890", delta: "12%", trend: "down", spark: [2050, 1880, 2160, 1740, 1860, 1520, 1400] },
    { label: "Total votes", value: "6,318", delta: "8%", trend: "down", spark: [284, 262, 296, 238, 252, 214, 208] },
    { label: "Engagement rate", value: "13.5%", delta: "0.9%", trend: "up", spark: [12.9, 13, 12.9, 13.2, 13.3, 13.4, 13.5] },
    { label: "Completion rate", value: "61.8%", delta: "3.2 pts", trend: "up", spark: [58, 59, 60, 60, 61, 61, 62] },
  ], "90D"),
  All: withInfo([
    { label: "Total views", value: "128,400", delta: "210%", trend: "up", spark: [4200, 9400, 14800, 20200, 26400, 31200, 38600] },
    { label: "Total votes", value: "16,482", delta: "180%", trend: "up", spark: [520, 1320, 2260, 3080, 3900, 4820, 5640] },
    { label: "Engagement rate", value: "12.8%", delta: "2.4%", trend: "up", spark: [10.9, 11.4, 11.8, 12.1, 12.4, 12.6, 12.8] },
    { label: "Completion rate", value: "58.9%", delta: "12 pts", trend: "up", spark: [44, 49, 52, 55, 57, 58, 59] },
  ], "All"),
};

/** The data contract behind every number on the strip: the exact window,
 *  the exact comparison window, and the object scope. "Today" in this demo
 *  workspace is Jun 15, 2026 (America/Chicago). */
export const STAT_SCOPES: Record<StatRange, string> = {
  "7D": "Jun 9 – Jun 15, 2026 · vs Jun 2 – Jun 8 · all campaigns and standalone Polsts",
  "30D": "May 17 – Jun 15, 2026 · vs Apr 17 – May 16 · all campaigns and standalone Polsts",
  "90D": "Mar 18 – Jun 15, 2026 · vs Dec 18 – Mar 17 · all campaigns and standalone Polsts",
  All: "Since Feb 3, 2026 · vs nothing — this is everything · all campaigns and standalone Polsts",
};

/** Axis labels for the expanded chart, per range. */
export const STAT_XTICKS: Record<StatRange, string[]> = {
  "7D": ["Jun 9", "Jun 11", "Jun 13", "Jun 15"],
  "30D": ["May 17", "May 24", "May 31", "Jun 7", "Jun 15"],
  "90D": ["Mar 18", "Apr 15", "May 15", "Jun 15"],
  All: ["Feb", "Mar", "Apr", "May", "Jun"],
};

/** Response volume over the last 14 days — the Analytics trend chart.
 *  Gently declining and summing to ~1,200, so it reconciles with the
 *  30-day total of 2,431 votes and its −11% delta. */
export const RESPONSE_TREND = [
  112, 104, 96, 108, 92, 88, 96, 84, 78, 86, 72, 68, 74, 62,
];

/* ── Campaigns ───────────────────────────────────────────────────── */

/** The decision-signal vocabulary — evidence state, not lifecycle state. */
export type DecisionSignal =
  | "Decisive"
  | "Leading"
  | "Directional"
  | "Too close"
  | "Inconclusive"
  | "Collecting"
  | "Not started";

export type Campaign = {
  id: string;
  name: string;
  decision: string;
  status: Status;
  event: string;
  polsts: number;
  /** Breakdown of the campaign's Polsts by state (sum ≤ polsts). */
  pollsActive: number;
  pollsStarted: number;
  pollsCompleted: number;
  responses: number;
  /** The response target set at launch — evidence sufficiency baseline. */
  target: number;
  completion: string;
  winner: string;
  /** Decision-signal state (evidence), separate from lifecycle status. */
  signal: DecisionSignal;
  /** Evidence strength: sample size vs target, source diversity, stability. */
  confidence: "High" | "Medium" | "Low" | "—";
  /** One honest line on sample quality — what supports or weakens the read. */
  sampleNote: string;
  nextAction: string;
  dates: string;
  topSource: string;
  /** Content vertical the campaign's Polsts run in (feed categorization). */
  vertical: "Food & drink" | "Lifestyle" | "Shopping & deals";
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: "summer-launch-draft",
    name: "Summer launch",
    decision: "",
    status: "Draft",
    event: "None",
    polsts: 0,
    pollsActive: 0,
    pollsStarted: 0,
    pollsCompleted: 0,
    responses: 0,
    target: 0,
    completion: "—",
    winner: "—",
    signal: "Not started",
    confidence: "—",
    sampleNote: "",
    nextAction: "Add Polsts",
    dates: "Jul 10 – Jul 13",
    topSource: "—",
    vertical: "Lifestyle",
  },
  {
    id: "packaging-direction",
    name: "Packaging Direction Test",
    decision: "Which packaging direction should we launch?",
    status: "Active",
    event: "None",
    polsts: 2,
    pollsActive: 2,
    pollsStarted: 2,
    pollsCompleted: 0,
    responses: 1486,
    target: 1200,
    completion: "71%",
    winner: "Option B +18 pts",
    signal: "Leading",
    confidence: "High",
    sampleNote: "Balanced across 3 independent sources; QR voters skew older than baseline.",
    nextAction: "Review recommendation",
    dates: "Jun 3 – Jun 12",
    topSource: "Website embed",
    vertical: "Food & drink",
  },
  {
    id: "game-day-creative",
    name: "Game Day Creative Test",
    decision: "Which creative should we run for the World Cup?",
    status: "Scheduled",
    event: "World Cup Kickoff",
    polsts: 3,
    pollsActive: 0,
    pollsStarted: 0,
    pollsCompleted: 0,
    responses: 0,
    target: 1000,
    completion: "—",
    winner: "—",
    signal: "Not started",
    confidence: "—",
    sampleNote: "",
    nextAction: "Add sources",
    dates: "Jun 10 – Jun 19",
    topSource: "—",
    vertical: "Lifestyle",
  },
  {
    id: "flavor-launch-recap",
    name: "Flavor Launch Recap",
    decision: "Which flavor should lead retail sell-in?",
    status: "Completed",
    event: "Product Launch Week",
    polsts: 4,
    pollsActive: 0,
    pollsStarted: 4,
    pollsCompleted: 4,
    responses: 1184,
    target: 1000,
    completion: "79%",
    winner: "Option A +11 pts",
    signal: "Decisive",
    confidence: "High",
    sampleNote: "Passed target with consistent splits across QR and email.",
    nextAction: "Export report",
    dates: "May 28 – Jun 5",
    topSource: "QR — Packaging",
    vertical: "Food & drink",
  },
  {
    id: "summer-flavor-lineup",
    name: "Summer Flavor Lineup",
    decision: "Which three flavors should headline the summer box?",
    status: "Active",
    event: "None",
    polsts: 4,
    pollsActive: 2,
    pollsStarted: 4,
    pollsCompleted: 2,
    responses: 2103,
    target: 2500,
    completion: "58%",
    winner: "Citrus Mint leading",
    signal: "Directional",
    confidence: "Medium",
    sampleNote: "Volume on track, but Instagram is underrepresented in the mix.",
    nextAction: "Review recommendation",
    dates: "Jun 1 – Jun 30",
    topSource: "Instagram story link",
    vertical: "Food & drink",
  },
  {
    id: "retail-shelf-layout",
    name: "Retail Shelf Layout",
    decision: "Which shelf arrangement reads fastest?",
    status: "Active",
    event: "None",
    polsts: 2,
    pollsActive: 2,
    pollsStarted: 2,
    pollsCompleted: 0,
    responses: 640,
    target: 1200,
    completion: "47%",
    winner: "Layout A +6 pts",
    signal: "Too close",
    confidence: "Low",
    sampleNote: "Only 640 of the 1,200 target — half the sample is still to come.",
    nextAction: "Keep running",
    dates: "Jun 12 – Jun 24",
    topSource: "Website embed",
    vertical: "Shopping & deals",
  },
  {
    id: "holiday-gifting-bundles",
    name: "Holiday Gifting Bundles",
    decision: "Which gift bundle should we lead with?",
    status: "Active",
    event: "None",
    polsts: 3,
    pollsActive: 3,
    pollsStarted: 3,
    pollsCompleted: 0,
    responses: 892,
    target: 1200,
    completion: "64%",
    winner: "Trio Box +9 pts",
    signal: "Leading",
    confidence: "Medium",
    sampleNote: "Email drives 55% of responses — one channel dominates the read.",
    nextAction: "Review recommendation",
    dates: "Jun 8 – Jun 20",
    topSource: "Email newsletter",
    vertical: "Shopping & deals",
  },
  {
    id: "loyalty-program-naming",
    name: "Loyalty Program Naming",
    decision: "What should we call the rewards program?",
    status: "Active",
    event: "None",
    polsts: 2,
    pollsActive: 2,
    pollsStarted: 2,
    pollsCompleted: 0,
    responses: 362,
    target: 800,
    completion: "62%",
    winner: "North Star Club +8 pts",
    signal: "Directional",
    confidence: "Low",
    sampleNote: "Early website-only sample; add a second source before deciding.",
    nextAction: "Keep collecting",
    dates: "Jun 30 – Jul 14",
    topSource: "Website embed",
    vertical: "Lifestyle",
  },
  {
    id: "back-to-school-snacks",
    name: "Back-to-School Snacks",
    decision: "Which lunchbox snack should we push?",
    status: "Scheduled",
    event: "None",
    polsts: 3,
    pollsActive: 0,
    pollsStarted: 0,
    pollsCompleted: 0,
    responses: 0,
    target: 1000,
    completion: "—",
    winner: "—",
    signal: "Not started",
    confidence: "—",
    sampleNote: "",
    nextAction: "Add sources",
    dates: "Starts Jul 8",
    topSource: "—",
    vertical: "Food & drink",
  },
  {
    id: "rebrand-concept-test",
    name: "Rebrand Concept Test",
    decision: "Which brand direction resonates most?",
    status: "Draft",
    event: "None",
    polsts: 2,
    pollsActive: 0,
    pollsStarted: 0,
    pollsCompleted: 0,
    responses: 0,
    target: 1000,
    completion: "—",
    winner: "—",
    signal: "Not started",
    confidence: "—",
    sampleNote: "",
    nextAction: "Finish setup",
    dates: "Not scheduled",
    topSource: "—",
    vertical: "Lifestyle",
  },
];

/* ── Single Polsts ───────────────────────────────────────────────── */

export type SinglePolst = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  status: Status;
  event: string;
  responses: number;
  split: string;
  completion: string;
  topSource: string;
  nextAction: string;
  dates: string;
};

export const SINGLE_POLSTS: SinglePolst[] = [
  {
    id: "which-headline-wins",
    question: "Which headline wins?",
    optionA: "Fuel your morning",
    optionB: "Mornings, handled",
    status: "Active",
    event: "None",
    responses: 428,
    split: "57 / 43",
    completion: "68%",
    topSource: "Instagram story link",
    nextAction: "View results",
    dates: "Jun 5 – Jun 9",
  },
  {
    id: "packaging-color-premium",
    question: "Which packaging color feels more premium?",
    optionA: "Deep navy",
    optionB: "Warm cream",
    status: "Scheduled",
    event: "Product Launch Week",
    responses: 0,
    split: "—",
    completion: "—",
    topSource: "—",
    nextAction: "Add a QR code",
    dates: "Starts Jun 17",
  },
  {
    id: "event-hook",
    question: "Which tagline should we use?",
    optionA: "Taste the season",
    optionB: "Made for the moment",
    status: "Draft",
    event: "None",
    responses: 0,
    split: "—",
    completion: "—",
    topSource: "—",
    nextAction: "Finish Polst",
    dates: "Not scheduled",
  },
  {
    id: "archived-draft",
    question: "Which seasonal badge feels clearer?",
    optionA: "Limited batch",
    optionB: "Seasonal pick",
    status: "Archived",
    event: "None",
    responses: 0,
    split: "—",
    completion: "—",
    topSource: "—",
    nextAction: "Restore draft",
    dates: "Not scheduled",
  },
  {
    id: "label-layout",
    question: "Which label reads faster on shelf?",
    optionA: "Icon-led",
    optionB: "Type-led",
    status: "Completed",
    event: "None",
    responses: 906,
    split: "62 / 38",
    completion: "81%",
    topSource: "Website embed",
    nextAction: "View results",
    dates: "May 20 – May 29",
  },
  {
    id: "snack-size-sells",
    question: "Which snack size sells better?",
    optionA: "Single serve",
    optionB: "Share bag",
    status: "Active",
    event: "None",
    responses: 512,
    split: "54 / 46",
    completion: "63%",
    topSource: "Website embed",
    nextAction: "View results",
    dates: "Jun 6 – Jun 14",
  },
  {
    id: "hero-image-ad",
    question: "Best hero image for the ad?",
    optionA: "Product close-up",
    optionB: "Lifestyle shot",
    status: "Active",
    event: "None",
    responses: 738,
    split: "61 / 39",
    completion: "70%",
    topSource: "Instagram story link",
    nextAction: "View results",
    dates: "Jun 9 – Jun 18",
  },
  {
    id: "price-point-fair",
    question: "Which price point feels fair?",
    optionA: "$4.99",
    optionB: "$5.49",
    status: "Active",
    event: "None",
    responses: 1204,
    split: "49 / 51",
    completion: "72%",
    topSource: "Email newsletter",
    nextAction: "Keep running",
    dates: "Jun 3 – Jun 20",
  },
  {
    id: "sweet-or-savory",
    question: "Sweet or savory launch?",
    optionA: "Sweet",
    optionB: "Savory",
    status: "Active",
    event: "None",
    responses: 430,
    split: "58 / 42",
    completion: "51%",
    topSource: "QR — In-store",
    nextAction: "View results",
    dates: "Jun 11 – Jun 22",
  },
  {
    id: "mascot-preference",
    question: "Which mascot do people like?",
    optionA: "The Fox",
    optionB: "The Bear",
    status: "Scheduled",
    event: "None",
    responses: 0,
    split: "—",
    completion: "—",
    topSource: "—",
    nextAction: "Add a QR code",
    dates: "Starts Jun 28",
  },
  {
    id: "bundle-vs-single",
    question: "Bundle or single pack?",
    optionA: "Bundle",
    optionB: "Single",
    status: "Draft",
    event: "None",
    responses: 0,
    split: "—",
    completion: "—",
    topSource: "—",
    nextAction: "Finish Polst",
    dates: "Not scheduled",
  },
];

/* ── Calendar (Home) ─────────────────────────────────────────────── */

/** February 2026 opens on a Sunday, so the grid is a clean 4×7 with no
 *  leading or trailing blanks. `today` highlights a demo cell. */
/** The month the calendar opens on, and "today". Navigation moves off this. */
export const CALENDAR_MONTH = { month: 5, year: 2026, today: "2026-06-15" };

export type CalendarItemKind = "campaign" | "polst" | "date";

/** A campaign spans start→end (rendered as a bar); Polsts and key dates are
 *  single-day unless a range is given. Dates are ISO `YYYY-MM-DD`. */
export type CalendarItem = {
  id: string;
  title: string;
  kind: CalendarItemKind;
  status: Status;
  start: string;
  end: string;
  to?: string;
};

export const CALENDAR_ITEMS: CalendarItem[] = [
  {
    id: "flavor-launch-recap",
    title: "Flavor Launch Recap",
    kind: "campaign",
    status: "Completed",
    start: "2026-05-28",
    end: "2026-06-05",
    to: "/campaigns/flavor-launch-recap",
  },
  {
    id: "packaging-direction",
    title: "Packaging Direction Test",
    kind: "campaign",
    status: "Active",
    start: "2026-06-03",
    end: "2026-06-12",
    to: "/campaigns/packaging-direction",
  },
  {
    id: "game-day-creative",
    title: "Game Day Creative Test",
    kind: "campaign",
    status: "Scheduled",
    start: "2026-06-10",
    end: "2026-06-19",
    to: "/campaigns/game-day-creative",
  },
  {
    id: "which-headline-wins",
    title: "Which headline wins?",
    kind: "polst",
    status: "Active",
    start: "2026-06-09",
    end: "2026-06-09",
    to: "/polsts/which-headline-wins",
  },
  {
    id: "packaging-color-premium",
    title: "Packaging color test",
    kind: "polst",
    status: "Scheduled",
    start: "2026-06-17",
    end: "2026-06-17",
    to: "/polsts/packaging-color-premium",
  },
  {
    id: "event-hook",
    title: "Tagline test",
    kind: "polst",
    status: "Draft",
    start: "2026-06-24",
    end: "2026-06-24",
    to: "/polsts/event-hook",
  },
  {
    id: "world-cup",
    title: "World Cup Kickoff",
    kind: "date",
    status: "Scheduled",
    start: "2026-06-11",
    end: "2026-06-11",
  },
  {
    id: "product-launch",
    title: "Product Launch Week",
    kind: "date",
    status: "Scheduled",
    start: "2026-06-22",
    end: "2026-06-26",
  },
  {
    id: "fancy-food-show",
    title: "Summer Fancy Food Show",
    kind: "date",
    status: "Scheduled",
    start: "2026-06-28",
    end: "2026-06-30",
  },
  {
    id: "july-fourth",
    title: "Independence Day",
    kind: "date",
    status: "Scheduled",
    start: "2026-07-04",
    end: "2026-07-04",
  },
];

/** Company-set key dates (the "date" items) — surfaced as bento cards on Home. */
export const KEY_DATES = CALENDAR_ITEMS.filter((it) => it.kind === "date");

/* ── Home: needs attention & ready to review ─────────────────────── */

export type ListItem = {
  id: string;
  title: string;
  reason: string;
  status: Status;
  action: string;
  to?: string;
};

export const ATTENTION_ITEMS: ListItem[] = [
  {
    id: "game-day-distribution",
    title: "Game Day Creative Test has no sources",
    reason: "It's scheduled for Feb 6, but nothing is set up to collect responses yet. Add a QR code, link, or embed.",
    status: "Needs attention",
    action: "Add sources",
    to: "/campaigns/game-day-creative",
  },
  {
    id: "super-bowl-uncovered",
    title: "Nothing is planned for Super Bowl Sunday",
    reason: "Feb 8 is coming up and you don't have a campaign or Polst for it yet.",
    status: "Needs attention",
    action: "Create campaign",
    to: "/campaigns/new",
  },
  {
    id: "event-hook-draft",
    title: "Finish your draft Polst",
    reason: "“Which tagline should we use?” is still missing a schedule and a source.",
    status: "Draft",
    action: "Finish Polst",
    to: "/polsts/event-hook",
  },
  {
    id: "conference-completion",
    title: "Conference Booth QR isn't finishing",
    reason: "It's getting scans, but only 41% of people complete the Polst. Check the landing step.",
    status: "Needs attention",
    action: "View source",
    to: "/distribution",
  },
];

export const READY_TO_REVIEW: ListItem[] = [
  {
    id: "packaging-ready",
    title: "Packaging Direction Test is ready to review",
    reason: "Option B is ahead by 18 points — enough to make a call.",
    status: "Ready",
    action: "View results",
    to: "/campaigns/packaging-direction",
  },
  {
    id: "headline-close",
    title: "“Which headline wins?” is still close",
    reason: "Option A leads, but not by enough yet. Keep it running a little longer.",
    status: "Active",
    action: "Keep running",
    to: "/polsts/which-headline-wins",
  },
];

/* ── Distribution: channels & sources ────────────────────────────── */

export type Channel = {
  id: string;
  name: string;
  scope: string;
  campaigns: number;
  responses: number;
  completion: string;
  status: Status;
};

export const CHANNELS: Channel[] = [
  { id: "website", name: "Website", scope: "All campaigns", campaigns: 2, responses: 1042, completion: "76%", status: "Active" },
  { id: "email", name: "Email", scope: "All campaigns", campaigns: 1, responses: 486, completion: "72%", status: "Active" },
  { id: "instagram", name: "Instagram", scope: "Per campaign", campaigns: 2, responses: 512, completion: "64%", status: "Active" },
  { id: "qr", name: "QR", scope: "Per campaign", campaigns: 3, responses: 240, completion: "58%", status: "Active" },
  { id: "influencer", name: "Influencer", scope: "Per campaign", campaigns: 1, responses: 134, completion: "61%", status: "Active" },
];

export type DistributionSource = {
  id: string;
  name: string;
  channel: string;
  type: string;
  linkedObject: string;
  /** What the source feeds: a campaign, a standalone Polst, or nothing. */
  linkedType: "Campaign" | "Standalone Polst" | "—";
  responses: number;
  completion: string;
  split: string;
  status: Status;
  lastActivity: string;
  /** Accounts created by respondents from this source (Acquisition module). */
  signups: number;
  /** Landed but never started voting. */
  bounce: string;
};

export const DISTRIBUTION_SOURCES: DistributionSource[] = [
  {
    id: "website-embed",
    name: "Website Embed",
    channel: "Website",
    type: "Embed",
    linkedObject: "Packaging Direction Test",
    linkedType: "Campaign",
    responses: 388,
    completion: "78%",
    split: "58 / 42",
    status: "Assigned",
    lastActivity: "2h ago",
    signups: 24,
    bounce: "18%",
  },
  {
    id: "qr-packaging",
    name: "QR — Packaging",
    channel: "QR",
    type: "QR code",
    linkedObject: "Flavor Launch Recap",
    linkedType: "Campaign",
    responses: 312,
    completion: "74%",
    split: "55 / 45",
    status: "Assigned",
    lastActivity: "5h ago",
    signups: 16,
    bounce: "22%",
  },
  {
    id: "qr-conference",
    name: "QR — Conference Booth",
    channel: "QR",
    type: "QR code",
    linkedObject: "Summer Flavor Lineup",
    linkedType: "Campaign",
    responses: 120,
    completion: "41%",
    split: "51 / 49",
    status: "Assigned",
    lastActivity: "1d ago",
    signups: 4,
    bounce: "47%",
  },
  {
    id: "instagram-story",
    name: "Instagram Story Link",
    channel: "Instagram",
    type: "Share link",
    linkedObject: "—",
    linkedType: "—",
    responses: 214,
    completion: "64%",
    split: "57 / 43",
    status: "Unassigned",
    lastActivity: "12w ago",
    signups: 11,
    bounce: "31%",
  },
  {
    id: "influencer-creator",
    name: "Influencer — @themorningfeed",
    channel: "Influencer",
    type: "Tracked link",
    linkedObject: "Packaging Direction Test",
    linkedType: "Campaign",
    responses: 134,
    completion: "61%",
    split: "60 / 40",
    status: "Assigned",
    lastActivity: "3d ago",
    signups: 9,
    bounce: "26%",
  },
  {
    id: "share-newsletter",
    name: "Share Link — Newsletter",
    channel: "Email",
    type: "Share link",
    linkedObject: "Flavor Launch Recap",
    linkedType: "Campaign",
    responses: 486,
    completion: "72%",
    split: "53 / 47",
    status: "Assigned",
    lastActivity: "6h ago",
    signups: 21,
    bounce: "14%",
  },
];

/** Source mix for the Analytics overview breakdown (sums to 100). */
export const SOURCE_MIX = [
  { label: "Website", value: 48 },
  { label: "QR", value: 28 },
  { label: "Social", value: 16 },
  { label: "Influencer", value: 8 },
];

/* ── Analytics: insights ─────────────────────────────────────────── */

export type Insight = {
  id: string;
  title: string;
  status: Status;
  context: string;
  action: string;
};

export const INSIGHTS: Insight[] = [
  {
    id: "packaging-decision",
    title: "Packaging Direction Test is ready to review",
    status: "Ready",
    context: "Option B leads by 18 points and holds up across both website and QR traffic.",
    action: "Open results",
  },
  {
    id: "super-bowl",
    title: "Nothing is planned for Super Bowl Sunday",
    status: "Needs attention",
    context: "Feb 8 is coming up and no campaign or Polst is attached to it yet.",
    action: "Create campaign",
  },
  {
    id: "conference-source",
    title: "Conference Booth QR completion dropped",
    status: "Needs attention",
    context: "The QR is getting scans, but only 41% of people finish the Polst.",
    action: "View source",
  },
];

/* ── Analytics: reports ──────────────────────────────────────────── */

export type Report = {
  id: string;
  name: string;
  linkedObject: string;
  status: Status;
  updated: string;
  primaryAction: string;
};

export const REPORTS: Report[] = [
  {
    id: "flavor-recap",
    name: "Flavor Launch Recap",
    linkedObject: "Flavor Launch Recap · Campaign",
    status: "Ready",
    updated: "Jan 23",
    primaryAction: "Preview",
  },
  {
    id: "label-layout-report",
    name: "Label Layout Test — results summary",
    linkedObject: "Which label reads faster? · Standalone Polst",
    status: "Ready",
    updated: "Feb 9",
    primaryAction: "Preview",
  },
  {
    id: "packaging-draft",
    name: "Packaging Direction Test",
    linkedObject: "Packaging Direction Test · Campaign",
    status: "Draft",
    updated: "2h ago",
    primaryAction: "Continue",
  },
];

/* ── Team (Settings) ─────────────────────────────────────────────── */

export type TeamRole = "Owner" | "Editor" | "Viewer";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  /** Job label shown beside the role — "Marketing Director", "Agency". */
  label?: string;
  lastActive: string;
};

export const TEAM: TeamMember[] = [
  { id: "owner", name: WORKSPACE.owner, email: WORKSPACE.email, role: "Owner", label: "Founder", lastActive: "Now" },
  { id: "strategist", name: "Elena Morris", email: "elena@northstarpantry.co", role: "Editor", label: "Marketing Director", lastActive: "1h ago" },
  { id: "analyst", name: "Devon Park", email: "devon@northstarpantry.co", role: "Viewer", label: "Analyst", lastActive: "Yesterday" },
];

/* ── Polst imagery ───────────────────────────────────────────────── */

/** Deterministic tiny hash so every Polst side keeps the same photo. */
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

/** Round-robin photo assignment in data-declaration order: every library
 *  photo is used evenly and same-page neighbours never collide. Unknown
 *  keys (composer previews) fall back to the hash. Built lazily so it can
 *  read data declared later in this module. */
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
    Object.values(CAMPAIGN_DETAILS).forEach((detail) =>
      detail.chain.forEach((polst) => {
        assign(`${polst.id}-a`);
        assign(`${polst.id}-b`);
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

/** A dashboard Polst as the consumer card renders it: the real option pair
 *  (label · image · votes) derived from the row's split and response count.
 *  Both apps draw the same PollCard anatomy from this one shape. */
export const polstOptions = (polst: {
  id: string;
  optionA: string;
  optionB: string;
  split: string;
  responses: number;
}): [PollOption, PollOption] => {
  const hasSplit = polst.split.includes("/");
  const [a] = hasSplit ? polst.split.split("/").map((s) => Number(s.trim())) : [0];
  const votesA = Math.round((polst.responses * a) / 100);
  return [
    {
      label: polst.optionA,
      image: polstImage(polst.id, "a", 600, 450),
      votes: votesA,
    },
    {
      label: polst.optionB,
      image: polstImage(polst.id, "b", 600, 450),
      votes: polst.responses - votesA,
    },
  ];
};

/* ── Campaign detail: chains, journeys, and narratives ───────────── */

/** One Polst inside a campaign chain. Campaign Polsts live here — never in
 *  the standalone SINGLE_POLSTS list. */
export type ChainPolst = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  /** "58 / 42" or "—" before any votes. */
  split: string;
  responses: number;
};

export type CampaignDetail = {
  /** The decision summary paragraph on Overview — the story lead. */
  summary: string;
  /** The single recommended next step (Overview + Insights). */
  nextStep: string;
  /** Voters who opened the campaign / voters who finished every question. */
  journey: { started: number; completed: number };
  chain: ChainPolst[];
  /** Insight bullets: what the signal means, beyond the headline. */
  findings: string[];
  /** Honest limits of the read — the credibility layer. */
  caveats: string[];
};

export const CAMPAIGN_DETAILS: Record<string, CampaignDetail> = {
  "summer-launch-draft": {
    summary: "Add at least one Polst before publishing.",
    nextStep: "Create a new Polst or select one from the library.",
    journey: { started: 0, completed: 0 },
    chain: [],
    findings: [],
    caveats: [],
  },
  "packaging-direction": {
    summary:
      "Option B leads by 18 points and performs consistently across website and QR traffic. Instagram traffic is closer and should stay on the watchlist until volume catches up.",
    nextStep:
      "Keep the campaign open for 24 more hours and add email or QR distribution before exporting the report.",
    journey: { started: 1486, completed: 1055 },
    chain: [
      { id: "pd-shelf", question: "Which pack reads faster on shelf?", optionA: "Bold label", optionB: "Minimal label", split: "59 / 41", responses: 1486 },
      { id: "pd-premium", question: "Which pack feels more premium?", optionA: "Bold label", optionB: "Minimal label", split: "42 / 58", responses: 1213 },
    ],
    findings: [
      "Option B wins on premium feel by 16 points while staying within 6 points on shelf read speed.",
      "QR — Packaging voters complete both questions 9 points more often than website voters.",
      "The premium question loses 273 voters — the longest question in the chain.",
    ],
    caveats: [
      "Instagram traffic skews younger than other sources and is not yet at volume.",
      "Response count is below the target for a locked decision.",
    ],
  },
  "game-day-creative": {
    summary:
      "Scheduled for the World Cup window. Three creatives are staged, but no distribution source is attached yet — the campaign can't collect signal until one is.",
    nextStep: "Attach a QR code, share link, or embed before the Jun 10 start.",
    journey: { started: 0, completed: 0 },
    chain: [
      { id: "gd-hero", question: "Which hero visual stops the scroll?", optionA: "Stadium crowd", optionB: "Product close-up", split: "—", responses: 0 },
      { id: "gd-line", question: "Which line lands harder?", optionA: "Snack the match", optionB: "Game day fuel", split: "—", responses: 0 },
      { id: "gd-cta", question: "Which offer converts?", optionA: "Bundle deal", optionB: "Free shipping", split: "—", responses: 0 },
    ],
    findings: [],
    caveats: ["No responses yet — the campaign has not started."],
  },
  "flavor-launch-recap": {
    summary:
      "Option A is supported for retail sell-in: an 11-point lead held across all four questions, strongest through QR — Packaging.",
    nextStep: "Export the report and share it with the retail team.",
    journey: { started: 1184, completed: 935 },
    chain: [
      { id: "fl-lead", question: "Which flavor should lead the shelf?", optionA: "Citrus Mint", optionB: "Berry Basil", split: "56 / 44", responses: 1184 },
      { id: "fl-pack", question: "Which pack color fits the flavor?", optionA: "Green", optionB: "Purple", split: "61 / 39", responses: 1102 },
      { id: "fl-name", question: "Which name sounds tastier?", optionA: "Fresh Twist", optionB: "Garden Chill", split: "53 / 47", responses: 1021 },
      { id: "fl-price", question: "Which launch price feels right?", optionA: "$3.99", optionB: "$4.49", split: "58 / 42", responses: 935 },
    ],
    findings: [
      "Citrus Mint held its lead across every question — no order effects observed.",
      "QR — Packaging voters completed the full chain at 79%, the strongest of any source.",
      "Price sensitivity is mild: $3.99 wins by 16 points with no drop in completion.",
    ],
    caveats: ["Event traffic skewed local during launch week."],
  },
  "summer-flavor-lineup": {
    summary:
      "Citrus Mint is trending toward the top slot, but the middle of the lineup is still churning — two of four questions remain within 5 points.",
    nextStep: "Let the remaining two questions run; revisit after the weekend spike.",
    journey: { started: 2103, completed: 1220 },
    chain: [
      { id: "sf-lead", question: "Which flavor headlines the box?", optionA: "Citrus Mint", optionB: "Peach Punch", split: "57 / 43", responses: 2103 },
      { id: "sf-second", question: "Which flavor takes the second slot?", optionA: "Berry Basil", optionB: "Melon Chili", split: "52 / 48", responses: 1804 },
      { id: "sf-third", question: "Which flavor rounds out the trio?", optionA: "Mango Lime", optionB: "Cocoa Sea Salt", split: "49 / 51", responses: 1533 },
      { id: "sf-size", question: "Which box size should we sell?", optionA: "6-pack", optionB: "10-pack", split: "55 / 45", responses: 1220 },
    ],
    findings: [
      "Citrus Mint's lead is stable across sources and days.",
      "The third-slot question is a coin flip — Instagram leans Cocoa, website leans Mango.",
    ],
    caveats: ["Slots two and three are inside the noise band — don't call them yet."],
  },
  "retail-shelf-layout": {
    summary:
      "Layout A leads by 6 points — too close to call. Completion is low at 47%, concentrated at the second question.",
    nextStep: "Keep running and add an email source to broaden the sample.",
    journey: { started: 640, completed: 301 },
    chain: [
      { id: "rs-read", question: "Which shelf reads faster?", optionA: "Layout A", optionB: "Layout B", split: "53 / 47", responses: 640 },
      { id: "rs-find", question: "Which shelf helps you find flavors?", optionA: "Layout A", optionB: "Layout B", split: "51 / 49", responses: 301 },
    ],
    findings: ["The second question loses more than half the voters — likely too similar to the first."],
    caveats: ["Sample is website-only so far; in-store QR is not live yet."],
  },
  "holiday-gifting-bundles": {
    summary:
      "Trio Box leads by 9 points with healthy 64% completion. Email traffic favors it hardest — a good sign for the gifting audience.",
    nextStep: "Review results and lock the hero bundle before the print deadline.",
    journey: { started: 892, completed: 571 },
    chain: [
      { id: "hg-hero", question: "Which bundle should lead the gift guide?", optionA: "Trio Box", optionB: "Pantry Sampler", split: "55 / 45", responses: 892 },
      { id: "hg-wrap", question: "Which wrap feels more giftable?", optionA: "Kraft ribbon", optionB: "Printed sleeve", split: "48 / 52", responses: 713 },
      { id: "hg-card", question: "Include a recipe card?", optionA: "Yes", optionB: "No", split: "71 / 29", responses: 571 },
    ],
    findings: [
      "Trio Box wins with email voters by 14 points — the strongest gifting signal.",
      "The recipe card is a landslide: 71% want it included.",
    ],
    caveats: ["Wrap preference flips between sources; treat it as unresolved."],
  },
  "loyalty-program-naming": {
    summary: "North Star Club leads by 8 points, but the sample is still website-only.",
    nextStep: "Keep collecting and add a second source before deciding.",
    journey: { started: 362, completed: 224 },
    chain: [
      { id: "lp-name", question: "Which rewards name sticks?", optionA: "Pantry Points", optionB: "North Star Club", split: "46 / 54", responses: 362 },
      { id: "lp-tier", question: "Which tier name feels premium?", optionA: "Gold Shelf", optionB: "First Harvest", split: "52 / 48", responses: 224 },
    ],
    findings: ["North Star Club leads by 8 points in the first website sample."],
    caveats: ["Website is the only active source, so treat the lead as directional."],
  },
  "back-to-school-snacks": {
    summary: "Scheduled for the back-to-school window starting Jul 8. Three questions staged; no sources attached yet.",
    nextStep: "Attach a distribution source before the start date.",
    journey: { started: 0, completed: 0 },
    chain: [
      { id: "bs-snack", question: "Which snack goes in the lunchbox?", optionA: "Fruit crisps", optionB: "Trail mix", split: "—", responses: 0 },
      { id: "bs-size", question: "Which size for lunchboxes?", optionA: "Mini pack", optionB: "Standard", split: "—", responses: 0 },
      { id: "bs-claim", question: "Which claim matters to parents?", optionA: "No added sugar", optionB: "Whole grain", split: "—", responses: 0 },
    ],
    findings: [],
    caveats: ["No responses yet — the campaign has not started."],
  },
  "rebrand-concept-test": {
    summary: "Still a draft — the decision question is set, but the Polsts need options and visuals before this can be scheduled.",
    nextStep: "Finish both Polsts, then schedule the campaign.",
    journey: { started: 0, completed: 0 },
    chain: [
      { id: "rb-logo", question: "Which logo direction resonates?", optionA: "Wordmark", optionB: "Emblem", split: "—", responses: 0 },
      { id: "rb-voice", question: "Which voice fits the brand?", optionA: "Warm & homey", optionB: "Bold & modern", split: "—", responses: 0 },
    ],
    findings: [],
    caveats: ["Draft — nothing has run yet."],
  },
};

/* ── Distribution: QR codes, links & embeds, influencer links ────── */

export type QrAsset = {
  id: string;
  name: string;
  placement: string;
  linkedObject: string;
  scans: number;
  responses: number;
  completion: string;
  status: Status;
  created: string;
};

export const QR_CODES: QrAsset[] = [
  { id: "qr-packaging", name: "QR — Packaging", placement: "On-pack sticker", linkedObject: "Flavor Launch Recap", scans: 421, responses: 312, completion: "74%", status: "Assigned", created: "May 26" },
  { id: "qr-conference", name: "QR — Conference Booth", placement: "Booth banner", linkedObject: "Summer Flavor Lineup", scans: 293, responses: 120, completion: "41%", status: "Assigned", created: "Jun 2" },
  { id: "qr-poster", name: "QR — Retail Poster", placement: "End-cap poster", linkedObject: "—", scans: 0, responses: 0, completion: "—", status: "Unassigned", created: "Jun 9" },
];

export type LinkAsset = {
  id: string;
  name: string;
  type: "Share link" | "Embed";
  linkedObject: string;
  responses: number;
  completion: string;
  lastCopied: string;
  status: Status;
};

export const LINK_ASSETS: LinkAsset[] = [
  { id: "embed-website", name: "Website Embed", type: "Embed", linkedObject: "Packaging Direction Test", responses: 388, completion: "78%", lastCopied: "2h ago", status: "Assigned" },
  { id: "link-newsletter", name: "Share Link — Newsletter", type: "Share link", linkedObject: "Flavor Launch Recap", responses: 486, completion: "72%", lastCopied: "2w ago", status: "Assigned" },
  { id: "link-instagram", name: "Instagram Story Link", type: "Share link", linkedObject: "—", responses: 214, completion: "64%", lastCopied: "12w ago", status: "Unassigned" },
  { id: "embed-landing", name: "Landing Page Embed", type: "Embed", linkedObject: "Summer Flavor Lineup", responses: 655, completion: "58%", lastCopied: "1w ago", status: "Assigned" },
];

export type InfluencerLink = {
  id: string;
  creator: string;
  handle: string;
  followers: string;
  linkedObject: string;
  responses: number;
  completion: string;
  split: string;
  status: Status;
};

export const INFLUENCER_LINKS: InfluencerLink[] = [
  { id: "inf-morningfeed", creator: "The Morning Feed", handle: "@themorningfeed", followers: "48k", linkedObject: "Packaging Direction Test", responses: 134, completion: "61%", split: "60 / 40", status: "Assigned" },
  { id: "inf-snackreview", creator: "Snack Review Daily", handle: "@snackreviewdaily", followers: "22k", linkedObject: "—", responses: 0, completion: "—", split: "—", status: "Unassigned" },
];

/** Embed snippets. One source of truth for both code blocks — they carry a
 *  real campaign slug so no copy path ever shows a placeholder token. */
export const CAMPAIGN_SHARE_URL = "https://polst.app/c/packaging-direction";

export const EMBED_IFRAME = `<iframe
  src="https://polst.app/embed/c/packaging-direction"
  width="100%" height="600" frameborder="0"
  style="border:none;border-radius:12px;min-width:320px"
  title="Polst campaign" loading="lazy"></iframe>`;

export const EMBED_SCRIPT = `<div id="polst-campaign"></div>
<script async src="https://polst.app/embed.js"
  data-campaign="packaging-direction"></script>`;

/* ── Analytics: audience & platform breakdowns ───────────────────── */

export type MixSlice = { label: string; value: number; detail?: string };

export const DEVICE_MIX: MixSlice[] = [
  { label: "Mobile", value: 64, detail: "1,709 responses" },
  { label: "Desktop", value: 31, detail: "828 responses" },
  { label: "Tablet", value: 5, detail: "133 responses" },
];

export const PLATFORM_MIX: MixSlice[] = [
  { label: "iOS", value: 41 },
  { label: "Android", value: 23 },
  { label: "macOS", value: 19 },
  { label: "Windows", value: 14 },
  { label: "Other", value: 3 },
];

export const WHAT_CHANGED: { id: string; text: string; ago: string }[] = [
  { id: "wc-threshold", text: "Packaging Direction Test crossed the directional threshold", ago: "2h ago" },
  { id: "wc-conference", text: "QR — Conference Booth completion dropped to 41%", ago: "1d ago" },
  { id: "wc-report", text: "Flavor Launch Recap report marked ready", ago: "2d ago" },
  { id: "wc-summer", text: "Summer Flavor Lineup passed 2,000 responses", ago: "3d ago" },
];

/* ── Audience ────────────────────────────────────────────────────── */

export const AUDIENCE_STATS = [
  { label: "Followers", value: "3,204", detail: "+186 this month", trend: "up" as const },
  { label: "Previous respondents", value: "1,842", detail: "have voted before", trend: "flat" as const },
  { label: "Response reach", value: "12,400", detail: "unique viewers", trend: "up" as const },
];

export const TOP_INTERESTS: MixSlice[] = [
  { label: "Snacking & treats", value: 34 },
  { label: "Cooking at home", value: 27 },
  { label: "Health & wellness", value: 18 },
  { label: "Grocery deals", value: 13 },
  { label: "Entertaining", value: 8 },
];

export const AGE_MIX: MixSlice[] = [
  { label: "18–24", value: 14 },
  { label: "25–34", value: 33 },
  { label: "35–44", value: 28 },
  { label: "45–54", value: 16 },
  { label: "55+", value: 9 },
];

/** Weekly engaged respondents, trailing 12 weeks. */
export const AUDIENCE_TREND = [182, 210, 195, 244, 236, 268, 301, 287, 322, 348, 361, 394];

export const NEW_VS_RETURNING = { new: 62, returning: 38 };

/* ── Team invitations ────────────────────────────────────────────── */

export type PendingInvite = { id: string; email: string; role: string; sent: string };

export const PENDING_INVITES: PendingInvite[] = [
  { id: "invite-agency", email: "sam@brightside.agency", role: "Viewer", sent: "Jun 12" },
];

/* ── Split shares (two-part breakdowns) ──────────────────────────── */

export type Split = {
  a: { label: string; value: number; detail?: string };
  b: { label: string; value: number; detail?: string };
};

export const PAID_ORGANIC: Split = {
  a: { label: "Paid", value: 42, detail: "1,121 responses" },
  b: { label: "Organic", value: 58, detail: "1,549 responses" },
};

export const US_SPLIT: Split = {
  a: { label: "United States", value: 71, detail: "1,896 respondents" },
  b: { label: "International", value: 29, detail: "774 respondents" },
};

/* ── Acquisition module (flag-gated) ─────────────────────────────── */

export const ACQUISITION_STATS: Stat[] = [
  { label: "New accounts", value: "312", delta: "+18.4%", trend: "up", spark: [14, 18, 16, 22, 25, 24, 31] },
  { label: "Creation rate", value: "11.7%", delta: "+1.2 pts", trend: "up", spark: [9.2, 9.8, 10.1, 10.6, 11.0, 11.4, 11.7] },
  { label: "Cost per account", value: "$1.84", delta: "-$0.22", trend: "up", spark: [2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.84] },
  { label: "Paid share", value: "42%", delta: "-3 pts", trend: "flat", spark: [47, 46, 45, 44, 43, 43, 42] },
];

/** Daily account creations, current vs previous 30 days. */
export const SIGNUP_TREND = {
  series: [6, 8, 7, 9, 11, 10, 12, 9, 11, 13, 12, 14, 11, 13, 15, 14, 12, 16, 15, 17, 14, 16, 18, 17, 19, 16, 18, 20, 19, 22],
  previous: [5, 6, 6, 7, 8, 7, 9, 8, 8, 9, 10, 9, 10, 11, 10, 9, 11, 10, 12, 11, 10, 12, 11, 13, 12, 11, 13, 12, 14, 13],
  xTicks: ["30 days ago", "15 days ago", "Today"],
};

export type ChannelEconomics = {
  id: string;
  channel: string;
  visits: number;
  signups: number;
  conversion: string;
  cpc: string;
  cpa: string;
  trend: number[];
};

export const CHANNEL_ECONOMICS: ChannelEconomics[] = [
  { id: "ce-instagram", channel: "Instagram Ads", visits: 4820, signups: 96, conversion: "2.0%", cpc: "$0.44", cpa: "$2.10", trend: [12, 14, 13, 15, 16, 15, 17] },
  { id: "ce-tiktok", channel: "TikTok Ads", visits: 3610, signups: 71, conversion: "2.0%", cpc: "$0.31", cpa: "$1.62", trend: [8, 10, 11, 10, 12, 13, 14] },
  { id: "ce-influencer", channel: "Influencer links", visits: 2140, signups: 68, conversion: "3.2%", cpc: "$0.28", cpa: "$0.96", trend: [7, 8, 9, 11, 10, 12, 13] },
  { id: "ce-website", channel: "Website embed", visits: 5280, signups: 44, conversion: "0.8%", cpc: "—", cpa: "—", trend: [6, 6, 7, 6, 8, 7, 8] },
  { id: "ce-email", channel: "Email", visits: 1930, signups: 21, conversion: "1.1%", cpc: "—", cpa: "—", trend: [3, 4, 3, 4, 5, 4, 5] },
  { id: "ce-qr", channel: "QR codes", visits: 714, signups: 12, conversion: "1.7%", cpc: "—", cpa: "—", trend: [1, 2, 2, 3, 2, 3, 3] },
];

export const CREATIVE_FORMATS: MixSlice[] = [
  { label: "Short video", value: 46, detail: "3.1% CTR" },
  { label: "Static image", value: 27, detail: "1.8% CTR" },
  { label: "Carousel", value: 17, detail: "2.2% CTR" },
  { label: "Story", value: 10, detail: "2.6% CTR" },
];

export type CampaignRoi = {
  id: string;
  campaign: string;
  spend: string;
  accounts: number;
  engaged: number;
  costPerEngaged: string;
};

export const CAMPAIGN_ROI: CampaignRoi[] = [
  { id: "roi-packaging", campaign: "Packaging Direction Test", spend: "$420", accounts: 88, engaged: 512, costPerEngaged: "$0.82" },
  { id: "roi-summer", campaign: "Summer Flavor Lineup", spend: "$610", accounts: 64, engaged: 388, costPerEngaged: "$1.57" },
  { id: "roi-flavor", campaign: "Flavor Launch Recap", spend: "$180", accounts: 102, engaged: 743, costPerEngaged: "$0.24" },
];

export type Finding = {
  id: string;
  title: string;
  body: string;
  confidence: "High confidence" | "Medium confidence" | "Early signal";
};

export const ACQ_FINDINGS: Finding[] = [
  {
    id: "find-overlap",
    title: "Influencer and paid audiences barely overlap",
    body: "Only ~14% of respondents arriving through creator links had previously seen a paid placement. The two pilots are reaching different people — keep both running.",
    confidence: "Medium confidence",
  },
  {
    id: "find-frequency",
    title: "Conversion peaks at the second exposure",
    body: "Respondents who saw a placement twice created accounts at 2.3× the single-exposure rate; a third exposure added almost nothing. Cap paid frequency at 2.",
    confidence: "Early signal",
  },
];

/* ── Retention module (flag-gated) ───────────────────────────────── */

export const RETENTION_STATS: Stat[] = [
  { label: "Day-7 retention", value: "34%", delta: "+2.1 pts", trend: "up", spark: [28, 29, 31, 30, 32, 33, 34] },
  { label: "Repeat vote rate", value: "41%", delta: "+3.4 pts", trend: "up", spark: [33, 35, 36, 38, 37, 39, 41] },
  { label: "Gone quiet", value: "214", delta: "+12", trend: "down", spark: [180, 188, 186, 195, 202, 208, 214] },
  { label: "Notification returns", value: "18%", delta: "+0.8 pts", trend: "flat", spark: [17, 17, 18, 17, 18, 18, 18] },
];

export type Cohort = {
  label: string;
  size: number;
  /** Percent returning by day; null = cohort not old enough yet. */
  d1: number;
  d7: number | null;
  d14: number | null;
  d30: number | null;
};

export const COHORTS: Cohort[] = [
  { label: "May 4", size: 186, d1: 62, d7: 38, d14: 29, d30: 24 },
  { label: "May 11", size: 204, d1: 58, d7: 35, d14: 27, d30: 22 },
  { label: "May 18", size: 233, d1: 64, d7: 39, d14: 31, d30: 26 },
  { label: "May 25", size: 248, d1: 66, d7: 41, d14: 33, d30: null },
  { label: "Jun 1", size: 271, d1: 63, d7: 40, d14: null, d30: null },
  { label: "Jun 8", size: 296, d1: 68, d7: null, d14: null, d30: null },
];

export const RETURN_PATHS: MixSlice[] = [
  { label: "Push notification", value: 38, detail: "412 returns" },
  { label: "Email", value: 27, detail: "293 returns" },
  { label: "Direct", value: 22, detail: "239 returns" },
  { label: "Social link", value: 13, detail: "141 returns" },
];

export type ChurnRisk = {
  id: string;
  segment: string;
  detail: string;
  size: number;
  action: string;
};

export const CHURN_RISKS: ChurnRisk[] = [
  { id: "churn-qr", segment: "Conference scanners", detail: "Voted once at the booth, silent for 21 days", size: 96, action: "Re-ask" },
  { id: "churn-email", segment: "April email cohort", detail: "Open rates halved over the last three sends", size: 74, action: "Send nudge" },
  { id: "churn-heavy", segment: "Former weekly voters", detail: "Were active 4+ weeks in a row, quiet for two", size: 44, action: "Re-ask" },
];

export const POST_VOTE_FUNNEL = [
  { label: "Voted", count: 2670 },
  { label: "Viewed result", count: 2434 },
  { label: "Continued to another Polst", count: 1381 },
  { label: "Created an account", count: 312 },
  { label: "Returned within 7 days", count: 907 },
];

export type CohortUsage = {
  id: string;
  cohort: string;
  pollsPerSession: string;
  shareRate: string;
  d30: string;
};

export const COHORT_USAGE: CohortUsage[] = [
  { id: "cu-influencer", cohort: "Arrived via influencer", pollsPerSession: "4.1", shareRate: "9.2%", d30: "31%" },
  { id: "cu-paid", cohort: "Arrived via paid", pollsPerSession: "2.6", shareRate: "4.8%", d30: "19%" },
  { id: "cu-qr", cohort: "Arrived via QR", pollsPerSession: "1.9", shareRate: "3.1%", d30: "12%" },
  { id: "cu-organic", cohort: "Arrived organically", pollsPerSession: "3.4", shareRate: "7.6%", d30: "27%" },
];

/* ── Verticals & timing (Analytics overview) ─────────────────────── */

export type VerticalPerformance = {
  id: string;
  vertical: string;
  responses: number;
  completion: string;
  dropOff: string;
  timeToVote: string;
  shareRate: string;
};

export const VERTICAL_PERFORMANCE: VerticalPerformance[] = [
  { id: "vert-food", vertical: "Food & drink", responses: 1494, completion: "78%", dropOff: "Q3 of 4", timeToVote: "4.2s", shareRate: "8.1%" },
  { id: "vert-lifestyle", vertical: "Lifestyle", responses: 762, completion: "71%", dropOff: "Q2 of 4", timeToVote: "5.6s", shareRate: "6.4%" },
  { id: "vert-shopping", vertical: "Shopping & deals", responses: 414, completion: "64%", dropOff: "Q2 of 3", timeToVote: "6.8s", shareRate: "4.2%" },
];

export const HEATMAP_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const HEATMAP_BUCKETS = ["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"] as const;

/** Responses per 2-hour bucket per weekday. Evenings peak; Wed/Thu strongest;
 *  weekend afternoons carry a second bump. Deterministic — same every load. */
export const TIME_HEATMAP: number[][] = HEATMAP_DAYS.map((_, day) => {
  const weekday = day >= 1 && day <= 5;
  const dayWeight = [0.72, 0.82, 0.94, 1.0, 0.98, 0.86, 0.78][day];
  return HEATMAP_BUCKETS.map((_, b) => {
    const hour = b * 2;
    const evening = Math.exp(-((hour - 19) ** 2) / 18);
    const lunch = Math.exp(-((hour - 12) ** 2) / 8) * (weekday ? 0.55 : 0.8);
    const night = hour <= 4 ? 0.06 : 0.12;
    return Math.round((evening + lunch + night) * dayWeight * 96);
  });
});

export const HEATMAP_PEAK = "Wednesdays 6–10pm";

/** Cross-campaign journey, all sources. */
export const OVERVIEW_FUNNEL = [
  { label: "Landed", count: 4210 },
  { label: "Started voting", count: 3390 },
  { label: "Completed the chain", count: 2670 },
  { label: "Shared or continued", count: 811 },
];

/* ── Campaign funnel, by source ──────────────────────────────────── */

export const FUNNEL_SOURCES = ["All sources", "QR", "Website", "Email"] as const;
export type FunnelSource = (typeof FUNNEL_SOURCES)[number];

/** Share of traffic and drop-off character per source: QR starts strong and
 *  leaks (scan-and-go), Website converts best, Email is small but loyal. */
const FUNNEL_SHAPES: Record<Exclude<FunnelSource, "All sources">, { share: number; decay: number }> = {
  QR: { share: 0.24, decay: 0.82 },
  Website: { share: 0.46, decay: 0.97 },
  Email: { share: 0.3, decay: 0.93 },
};

export function funnelForSource(counts: number[], source: FunnelSource): number[] {
  if (source === "All sources") return counts;
  const { share, decay } = FUNNEL_SHAPES[source];
  return counts.map((count, step) => Math.round(count * share * decay ** step));
}

/* ── Email channel detail ────────────────────────────────────────── */

export const EMAIL_STATS: Stat[] = [
  { label: "List size", value: "8,412", delta: "+4.6%", trend: "up", spark: [7.4, 7.6, 7.7, 7.9, 8.1, 8.2, 8.4] },
  { label: "Open rate", value: "41%", delta: "+2.2 pts", trend: "up", spark: [36, 37, 38, 38, 39, 40, 41] },
  { label: "Click-to-vote", value: "9.4%", delta: "+0.6 pts", trend: "up", spark: [8.1, 8.3, 8.6, 8.8, 9.0, 9.2, 9.4] },
  { label: "Unsubscribe", value: "0.31%", delta: "-0.04 pts", trend: "up", spark: [0.42, 0.4, 0.38, 0.36, 0.34, 0.32, 0.31] },
];

export type EmailPerformance = {
  id: string;
  type: string;
  audience: string;
  sends: number;
  openRate: string;
  ctr: string;
  clickToVote: string;
  unsub: string;
};

export const EMAIL_PERFORMANCE: EmailPerformance[] = [
  { id: "em-recap", type: "Decision recap", audience: "Previous respondents", sends: 1842, openRate: "52%", ctr: "14.1%", clickToVote: "11.8%", unsub: "0.18%" },
  { id: "em-launch", type: "Product drop", audience: "Full list", sends: 8106, openRate: "44%", ctr: "9.8%", clickToVote: "8.2%", unsub: "0.29%" },
  { id: "em-digest", type: "Weekly digest", audience: "Full list", sends: 8032, openRate: "38%", ctr: "7.2%", clickToVote: "5.9%", unsub: "0.34%" },
  { id: "em-nudge", type: "Re-ask nudge", audience: "Gone-quiet segment", sends: 214, openRate: "31%", ctr: "6.1%", clickToVote: "5.2%", unsub: "0.62%" },
];

/** Weekly list size, trailing 12 weeks, vs the prior 12. */
export const LIST_GROWTH = {
  series: [6.8, 7.0, 7.1, 7.3, 7.4, 7.4, 7.6, 7.7, 7.9, 8.1, 8.2, 8.4],
  previous: [6.1, 6.2, 6.2, 6.3, 6.4, 6.5, 6.5, 6.6, 6.7, 6.7, 6.8, 6.8],
  xTicks: ["12 weeks ago", "6 weeks ago", "This week"],
};

/** Response trend per channel for the generic channel detail page. */
export const CHANNEL_TRENDS: Record<string, { series: number[]; previous: number[] }> = {
  website: { series: [28, 31, 30, 34, 36, 33, 38, 40, 37, 42, 44, 41, 46, 48], previous: [22, 24, 23, 26, 27, 26, 29, 30, 28, 31, 33, 31, 34, 35] },
  email: { series: [11, 12, 14, 13, 15, 16, 15, 17, 18, 17, 19, 20, 19, 21], previous: [9, 10, 10, 11, 12, 11, 13, 13, 12, 14, 15, 14, 15, 16] },
  instagram: { series: [14, 16, 15, 18, 17, 19, 21, 20, 22, 21, 23, 25, 24, 26], previous: [12, 13, 12, 14, 15, 14, 16, 17, 16, 18, 17, 19, 20, 19] },
  qr: { series: [6, 7, 8, 7, 9, 8, 10, 9, 11, 10, 9, 11, 12, 11], previous: [5, 6, 5, 7, 6, 8, 7, 8, 9, 8, 9, 8, 10, 9] },
  influencer: { series: [3, 4, 5, 4, 6, 7, 6, 8, 9, 8, 10, 11, 10, 12], previous: [2, 3, 3, 4, 3, 5, 4, 5, 6, 5, 7, 6, 8, 7] },
};

/* ── Creators (influencer program) ───────────────────────────────── */

export type CreatorTier = "10–25k" | "25–50k" | "50–75k";

export type Creator = {
  id: string;
  name: string;
  handle: string;
  followers: string;
  tier: CreatorTier;
  status: Status;
  clicks: number;
  ctr: string;
  ecpc: string;
  /** Entered by hand — story views aren't in any API. */
  storyViews: number;
  responses: number;
  completion: string;
  split: string;
  campaign: string;
  clickTrend: number[];
  links: { id: string; name: string; linkedObject: string; clicks: number; responses: number; ctr: string }[];
};

export const CREATORS: Creator[] = [
  {
    id: "cr-morningfeed",
    name: "The Morning Feed",
    handle: "@themorningfeed",
    followers: "48k",
    tier: "25–50k",
    status: "Active",
    clicks: 1462,
    ctr: "3.0%",
    ecpc: "$0.41",
    storyViews: 12400,
    responses: 134,
    completion: "61%",
    split: "60 / 40",
    campaign: "Packaging Direction Test",
    clickTrend: [86, 102, 94, 118, 131, 124, 142, 156, 149, 168, 181, 174],
    links: [
      { id: "lk-mf-story", name: "Story swipe-up", linkedObject: "Packaging Direction Test", clicks: 918, responses: 84, ctr: "3.4%" },
      { id: "lk-mf-bio", name: "Link in bio", linkedObject: "Packaging Direction Test", clicks: 544, responses: 50, ctr: "2.4%" },
    ],
  },
  {
    id: "cr-snackreview",
    name: "Snack Review Daily",
    handle: "@snackreviewdaily",
    followers: "22k",
    tier: "10–25k",
    status: "Active",
    clicks: 806,
    ctr: "4.2%",
    ecpc: "$0.29",
    storyViews: 6800,
    responses: 71,
    completion: "68%",
    split: "54 / 46",
    campaign: "Summer Flavor Lineup",
    clickTrend: [42, 51, 48, 60, 66, 62, 71, 78, 74, 83, 88, 92],
    links: [
      { id: "lk-sr-story", name: "Story swipe-up", linkedObject: "Summer Flavor Lineup", clicks: 806, responses: 71, ctr: "4.2%" },
    ],
  },
  {
    id: "cr-pantrynotes",
    name: "Pantry Notes",
    handle: "@pantrynotes",
    followers: "61k",
    tier: "50–75k",
    status: "Active",
    clicks: 1120,
    ctr: "1.9%",
    ecpc: "$0.66",
    storyViews: 18200,
    responses: 96,
    completion: "57%",
    split: "48 / 52",
    campaign: "Flavor Launch Recap",
    clickTrend: [74, 81, 78, 88, 92, 86, 96, 104, 98, 108, 112, 118],
    links: [
      { id: "lk-pn-story", name: "Story swipe-up", linkedObject: "Flavor Launch Recap", clicks: 692, responses: 58, ctr: "2.1%" },
      { id: "lk-pn-reel", name: "Reel caption link", linkedObject: "Flavor Launch Recap", clicks: 428, responses: 38, ctr: "1.6%" },
    ],
  },
  {
    id: "cr-weeknight",
    name: "Weeknight Table",
    handle: "@weeknighttable",
    followers: "14k",
    tier: "10–25k",
    status: "Draft",
    clicks: 0,
    ctr: "—",
    ecpc: "—",
    storyViews: 0,
    responses: 0,
    completion: "—",
    split: "—",
    campaign: "—",
    clickTrend: [],
    links: [],
  },
];

export type TierBenchmark = {
  id: string;
  tier: CreatorTier;
  creators: number;
  avgCtr: string;
  avgEcpc: string;
  ctrValue: number;
};

export const TIER_BENCHMARKS: TierBenchmark[] = [
  { id: "tier-small", tier: "10–25k", creators: 2, avgCtr: "4.2%", avgEcpc: "$0.29", ctrValue: 42 },
  { id: "tier-mid", tier: "25–50k", creators: 1, avgCtr: "3.0%", avgEcpc: "$0.41", ctrValue: 30 },
  { id: "tier-large", tier: "50–75k", creators: 1, avgCtr: "1.9%", avgEcpc: "$0.66", ctrValue: 19 },
];

/* ── Integrations (Settings) ─────────────────────────────────────── */

export type Integration = {
  id: string;
  name: string;
  icon: string;
  feeds: string;
  connected: boolean;
  lastSync?: string;
};

export const INTEGRATIONS: Integration[] = [
  { id: "int-ga4", name: "Google Analytics 4", icon: "query_stats", feeds: "Visits, bounce, and UTM sources", connected: true, lastSync: "12 min ago" },
  { id: "int-gtm", name: "Google Tag Manager", icon: "sell", feeds: "Event tracking on embeds", connected: true, lastSync: "12 min ago" },
  { id: "int-meta", name: "Meta Ads", icon: "ads_click", feeds: "Paid reach, CPC, and creative formats", connected: false },
  { id: "int-tiktok", name: "TikTok Ads", icon: "music_note", feeds: "Paid reach, CPC, and creative formats", connected: false },
  { id: "int-linkedin", name: "LinkedIn Ads", icon: "work", feeds: "Paid reach and CPC", connected: false },
  { id: "int-klaviyo", name: "Klaviyo", icon: "mail", feeds: "Sends, opens, clicks, and unsubscribes", connected: false },
];

/* ── Formatting ──────────────────────────────────────────────────── */

/** Comma-grouped exact counts — the dashboard reports precise numbers
 *  ("1,248"), unlike the consumer feed's compact "14K". */
export const formatNumber = (n: number): string => n.toLocaleString("en-US");
