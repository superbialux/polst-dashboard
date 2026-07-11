import type { PollOption } from "@/lib/poll";
import {
  TODAY,
  confidenceFor,
  daysBetween,
  fmtDate,
  fmtInt,
  fmtPct,
  isReadyToDecide,
  relativeToToday,
  signalFor,
  type Confidence,
  type DecisionSignal,
  type Status,
} from "@/lib/canon";
import {
  allocate,
  chainVotes,
  dailySeries,
  sumWindow,
  timeHeat,
  windowBounds,
  windowDelta,
  windowSeries,
  type DailySeries,
  type WindowRange,
} from "@/lib/engine";

/* ══════════════════════════════════════════════════════════════════
   BRAND WORKSPACE — the one system of record for the Polst dashboard
   ────────────────────────────────────────────────────────────────
   Entities (campaigns, standalone Polsts, sources, key dates) are
   authored below; every aggregate, series, table, and story is DERIVED
   from them through src/lib/engine.ts at module load. Nothing here is
   fetched or persisted; scripts/verify-model.ts checks the invariants.
   ══════════════════════════════════════════════════════════════════ */

/** Canon vocabulary re-exported for pages/kit that import it from here. */
export type { Confidence, DecisionSignal, Status } from "@/lib/canon";
export type { WindowRange } from "@/lib/engine";

export type Vertical = "Food & drink" | "Lifestyle" | "Shopping & deals";
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
  vertical: Vertical;
  chain: ChainQuestion[];
  decisionIndex: number; // which chain question answers `decision`
  // Observed totals for the run so far (authored):
  voters: number; // unique people who started (= Q1 votes)
  completed: number; // answered every question (= last Q votes)
  viewsFactor: number; // views = round(votes * viewsFactor)
  shares: number; // interactions (shares/reposts)
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
  winner: { option: string; marginPts: number } | null;
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
  vertical: Vertical;
  votes: number; // single question: votes = voters
  viewsFactor: number;
  interactions: number; // shares/reposts
  // Derived at module load:
  views: number;
  engagementRate: number | null; // votes/views*100, 1dp
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

/* ── Key dates (planning events, authored) ───────────────────────── */

export const KEY_DATES: KeyDate[] = [
  { id: "world-cup", title: "World Cup Kickoff", start: "2026-06-18", end: "2026-06-18" },
  { id: "product-launch", title: "Product Launch Week", start: "2026-06-22", end: "2026-06-26" },
  { id: "fancy-food-show", title: "Summer Fancy Food Show", start: "2026-06-28", end: "2026-06-30" },
  { id: "july-fourth", title: "Independence Day", start: "2026-07-04", end: "2026-07-04" },
];

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
    vertical: "Food & drink",
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
      "Citrus Mint won the lead question by 12 points and held it through all four questions. The run passed its 1,000-voter target with 79% completion.",
    nextStep: "Export the report and share it with the retail team.",
    findings: [
      "Citrus Mint led the shelf question by 12 points and never lost it.",
      "$3.99 wins the price question by 16 points with no drop in completion.",
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
    vertical: "Food & drink",
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
      "Minimal label leads the premium question by 16 points and the campaign has passed its 1,200-voter target. Two days remain in the run.",
    nextStep: "Review the recommendation and lock the direction when the run ends Jun 17.",
    findings: [
      "Minimal label wins premium feel by 16 points; Bold label still reads faster on shelf by 18.",
      "Instagram voters narrow the premium lead to about +6 — watch the mix.",
      "Website Embed — Packaging drives 42% of voters at the strongest completion.",
    ],
    caveats: ["Creator traffic completes 10 points below the campaign average."],
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
    vertical: "Food & drink",
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
      "Citrus Mint leads the headline slot by 6 points at 2,103 of the 2,500-voter target. The middle slots are still inside the noise band.",
    nextStep: "Keep collecting through Jun 30 before calling the middle slots.",
    findings: [
      "Email delivers 45% of voters — the largest channel in the mix.",
      "The third slot is a coin flip: Cocoa Sea Salt edges Mango Lime by 2 points.",
      "The 6-pack leads the size question by 10 points.",
    ],
    caveats: [
      "Slots two and three sit within 4 points — don't call them yet.",
      "QR — Conference Booth completes 17 points below the campaign average.",
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
    vertical: "Shopping & deals",
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
      "Layout A leads by just 2 points at 640 of 1,200 voters — too close to call. Completion sits at 47%.",
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
    vertical: "Shopping & deals",
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
      "Trio Box leads the gift guide question by 10 points with 64% completion. Email drives 55% of voters.",
    nextStep: "Review the recommendation before the gift-guide print deadline.",
    findings: [
      "The recipe card is a landslide: 71% say include it.",
      "Printed sleeve edges Kraft ribbon by 4 points on the wrap question.",
      "Email delivers 55% of voters — one channel dominates the read.",
    ],
    caveats: ["Email dominance means the read reflects subscribers more than new shoppers."],
    sampleNote: "892 of 1,200 target voters; email carries 55% of the sample.",
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
    vertical: "Lifestyle",
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
    vertical: "Lifestyle",
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
    vertical: "Food & drink",
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
    vertical: "Lifestyle",
    viewsFactor: 2.2,
    voters: 0,
    completed: 0,
    shares: 0,
    decisionIndex: 0,
    chain: [],
    summary: "Add at least one Polst before publishing.",
    nextStep: "Create a new Polst or select one from the library.",
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
    vertical: "Lifestyle",
    viewsFactor: 2.2,
    voters: 0,
    completed: 0,
    shares: 0,
    decisionIndex: 0,
    chain: [
      { id: "rb-logo", question: "Which logo direction resonates?", optionA: "Wordmark", optionB: "Emblem", splitA: 0 },
      { id: "rb-voice", question: "Which voice fits the brand?", optionA: "Warm & homey", optionB: "Bold & modern", splitA: 0 },
    ],
    summary: "Still a draft — both Polsts need visuals before this can be scheduled.",
    nextStep: "Finish both Polsts, then schedule the campaign.",
    findings: [],
    caveats: ["Draft — nothing has run yet."],
    sampleNote: "",
  },
];

/* ── Single Polst seeds ──────────────────────────────────────────── */

type PolstSeed = Omit<SinglePolst, "views" | "engagementRate" | "sources">;

const POLST_SEEDS: PolstSeed[] = [
  { id: "which-headline-wins", question: "Which headline wins?", optionA: "Fuel your morning", optionB: "Mornings, handled", splitA: 57, status: "Active", createdAt: "2026-06-03", startAt: "2026-06-05", endAt: "2026-06-19", vertical: "Food & drink", votes: 428, viewsFactor: 2.2, interactions: 17 },
  { id: "price-point-fair", question: "Which price point feels fair?", optionA: "$4.99", optionB: "$5.49", splitA: 49, status: "Active", createdAt: "2026-05-30", startAt: "2026-06-03", endAt: "2026-06-20", vertical: "Food & drink", votes: 1204, viewsFactor: 2.1, interactions: 48 },
  { id: "snack-size-sells", question: "Which snack size sells better?", optionA: "Single serve", optionB: "Share bag", splitA: 54, status: "Active", createdAt: "2026-06-02", startAt: "2026-06-06", endAt: "2026-06-21", vertical: "Food & drink", votes: 512, viewsFactor: 2.3, interactions: 20 },
  { id: "hero-image-ad", question: "Best hero image for the ad?", optionA: "Product close-up", optionB: "Lifestyle shot", splitA: 61, status: "Active", createdAt: "2026-06-05", startAt: "2026-06-09", endAt: "2026-06-18", vertical: "Food & drink", votes: 738, viewsFactor: 2.2, interactions: 30 },
  { id: "sweet-or-savory", question: "Sweet or savory launch?", optionA: "Sweet", optionB: "Savory", splitA: 58, status: "Active", createdAt: "2026-06-08", startAt: "2026-06-11", endAt: "2026-06-22", vertical: "Food & drink", votes: 430, viewsFactor: 2.4, interactions: 17 },
  { id: "label-layout", question: "Which label reads faster on shelf?", optionA: "Icon-led", optionB: "Type-led", splitA: 62, status: "Ended", createdAt: "2026-05-14", startAt: "2026-05-20", endAt: "2026-05-29", vertical: "Food & drink", votes: 906, viewsFactor: 2.2, interactions: 36 },
  { id: "packaging-color-premium", question: "Which packaging color feels more premium?", optionA: "Deep navy", optionB: "Warm cream", splitA: 0, status: "Scheduled", createdAt: "2026-06-04", startAt: "2026-06-22", endAt: "2026-06-26", event: "product-launch", vertical: "Food & drink", votes: 0, viewsFactor: 2.2, interactions: 0 },
  { id: "mascot-preference", question: "Which mascot do people like?", optionA: "The Fox", optionB: "The Bear", splitA: 0, status: "Scheduled", createdAt: "2026-06-08", startAt: "2026-06-28", endAt: "2026-07-05", vertical: "Lifestyle", votes: 0, viewsFactor: 2.2, interactions: 0 },
  { id: "event-hook", question: "Which tagline should we use?", optionA: "Taste the season", optionB: "Made for the moment", splitA: 0, status: "Draft", createdAt: "2026-06-09", vertical: "Food & drink", votes: 0, viewsFactor: 2.2, interactions: 0 },
  { id: "bundle-vs-single", question: "Bundle or single pack?", optionA: "Bundle", optionB: "Single", splitA: 0, status: "Draft", createdAt: "2026-06-11", vertical: "Shopping & deals", votes: 0, viewsFactor: 2.2, interactions: 0 },
  { id: "archived-draft", question: "Which seasonal badge feels clearer?", optionA: "Limited batch", optionB: "Seasonal pick", splitA: 0, status: "Archived", createdAt: "2026-05-08", vertical: "Food & drink", votes: 0, viewsFactor: 2.2, interactions: 0 },
];

/* ── Source seeds (attribution inputs) ───────────────────────────── */

type SourceSeed = Omit<Source, "voters" | "views" | "completed" | "completionRate" | "lastActivity">;

const SOURCE_SEEDS: SourceSeed[] = [
  // Flavor Launch Recap
  { id: "qr-packaging", name: "QR — Packaging", kind: "QR code", channel: "QR", placement: "On-pack sticker", linked: { type: "campaign", id: "flavor-launch-recap" }, createdAt: "2026-05-26", voterShare: 0.26, completionDelta: 4 },
  { id: "link-newsletter", name: "Share Link — Newsletter", kind: "Share link", channel: "Email", linked: { type: "campaign", id: "flavor-launch-recap" }, createdAt: "2026-05-27", voterShare: 0.41, completionDelta: 2 },
  { id: "embed-site-flavor", name: "Website Embed — Flavor", kind: "Embed", channel: "Website", linked: { type: "campaign", id: "flavor-launch-recap" }, createdAt: "2026-05-26", voterShare: 0.33, completionDelta: -3 },
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
  // Standalone Polsts (single source each)
  { id: "story-instagram-headline", name: "Instagram Story — Headline", kind: "Share link", channel: "Instagram", linked: { type: "polst", id: "which-headline-wins" }, createdAt: "2026-06-05", voterShare: 1, completionDelta: 0 },
  { id: "newsletter-price", name: "Share Link — Price Test Email", kind: "Share link", channel: "Email", linked: { type: "polst", id: "price-point-fair" }, createdAt: "2026-06-03", voterShare: 1, completionDelta: 0 },
  { id: "embed-website-snack", name: "Website Embed — Snack Size", kind: "Embed", channel: "Website", linked: { type: "polst", id: "snack-size-sells" }, createdAt: "2026-06-06", voterShare: 1, completionDelta: 0 },
  { id: "story-instagram-hero", name: "Instagram Story — Hero Image", kind: "Share link", channel: "Instagram", linked: { type: "polst", id: "hero-image-ad" }, createdAt: "2026-06-09", voterShare: 1, completionDelta: 0 },
  { id: "qr-instore-sweet", name: "QR — In-store Counter", kind: "QR code", channel: "QR", placement: "Counter card", linked: { type: "polst", id: "sweet-or-savory" }, createdAt: "2026-06-11", voterShare: 1, completionDelta: 0 },
  { id: "embed-website-label", name: "Website Embed — Label Test", kind: "Embed", channel: "Website", linked: { type: "polst", id: "label-layout" }, createdAt: "2026-05-20", voterShare: 1, completionDelta: 0 },
  // Unlinked — the assign flow's material
  { id: "qr-poster", name: "QR — Retail Poster", kind: "QR code", channel: "QR", placement: "End-cap poster", linked: null, createdAt: "2026-06-09" },
  { id: "link-instagram-spare", name: "Instagram Story Link", kind: "Share link", channel: "Instagram", linked: null, createdAt: "2026-03-18" },
];

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
  const winner =
    seed.voters > 0 && decisionQ
      ? {
          option: decisionQ.splitA >= 50 ? decisionQ.optionA : decisionQ.optionB,
          marginPts: Math.abs(2 * decisionQ.splitA - 100),
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

const derivePolst = (seed: PolstSeed): SinglePolst => {
  const views = Math.round(seed.votes * seed.viewsFactor);
  return {
    ...seed,
    views,
    engagementRate: views > 0 ? round1((seed.votes / views) * 100) : null,
    sources: [],
  };
};

export const CAMPAIGNS: Campaign[] = CAMPAIGN_SEEDS.map(deriveCampaign);
export const SINGLE_POLSTS: SinglePolst[] = POLST_SEEDS.map(derivePolst);

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
        ? "2026-03-24" // dormant — collected before it was ever re-pointed
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
  /** "vs Jun 2 – Jun 8", or null when there is no previous window. */
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
  const result: WorkspaceWindow = {
    range,
    start,
    end,
    label: `${fmtDate(start)} – ${fmtDate(end)}`,
    compareLabel: range === "All" ? null : `vs ${fmtDate(prevStart)} – ${fmtDate(prevEnd)}`,
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
  insights?: Array<{
    text: string;
    to: string;
    tone: "success" | "warning" | "danger" | "accent";
  }>;
};

export type StatRange = WindowRange;
export const STAT_RANGES: StatRange[] = ["7D", "30D", "90D", "All"];

const SPARK_POINTS = 12;

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

/* Derived facts the stat insights speak from — computed once, all real. */
const channelVoters = (() => {
  const byChannel = new Map<Channel, number>();
  for (const s of SOURCES) byChannel.set(s.channel, (byChannel.get(s.channel) ?? 0) + s.voters);
  const total = [...byChannel.values()].reduce((a, b) => a + b, 0);
  const [topChannel, topVoters] = [...byChannel.entries()].sort((a, b) => b[1] - a[1])[0];
  return { topChannel, topShare: total > 0 ? Math.round((topVoters / total) * 100) : 0 };
})();

const uncoveredScheduled = CAMPAIGNS.find(
  (c) => c.status === "Scheduled" && !!c.startAt && daysBetween(TODAY, c.startAt) <= 14 && c.sources.length === 0,
);

const biggestShortfall = CAMPAIGNS.filter((c) => c.status === "Active" && (c.target ?? 0) > c.voters)
  .sort((a, b) => (b.target! - b.voters) - (a.target! - a.voters))[0];

const bestEngagementCampaign = CAMPAIGNS.filter((c) => c.status === "Active" && c.views > 0)
  .sort((a, b) => b.votes / b.views - a.votes / a.views)[0];

const lowestCompletionActive = CAMPAIGNS.filter((c) => c.status === "Active" && c.completionRate !== null)
  .sort((a, b) => a.completionRate! - b.completionRate!)[0];

/** Sources whose completion trails their object by ≥15 pts on real volume. */
const laggingSources = SOURCES.filter((s) => {
  if (!s.linked || s.voters < 100 || s.completionRate === null) return false;
  const rate = linkedTotals(s.linked).rate;
  return s.completionRate <= rate - 15;
});

const trendLine = (subject: string, stat: Stat, range: StatRange) => {
  const movement = stat.trend === "down" ? "fell" : stat.trend === "up" ? "rose" : "held steady";
  const change = stat.delta === "—" ? "" : ` ${stat.delta}`;
  return range === "All"
    ? `${subject} reached ${stat.value} since launch.`
    : `${subject} ${movement}${change} versus the previous period.`;
};

const buildStats = (range: StatRange): Stat[] => {
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

  const views: Stat = {
    label: "Total views",
    value: fmtInt(w.views),
    ...deltaParts(w.views, w.prev?.views ?? null),
    spark: downsampleCounts(cur.views),
    ...(prev ? { previous: downsampleCounts(prev.views) } : {}),
  };
  const votes: Stat = {
    label: "Total votes",
    value: fmtInt(w.votes),
    ...deltaParts(w.votes, w.prev?.votes ?? null),
    spark: downsampleCounts(cur.votes),
    ...(prev ? { previous: downsampleCounts(prev.votes) } : {}),
  };
  const engagement: Stat = {
    label: "Engagement rate",
    value: w.engagementRate !== null ? fmtPct(w.engagementRate, 1) : "—",
    ...deltaParts(w.engagementRate ?? 0, prevEngagement),
    spark: downsampleRate(cur.votes, cur.views),
    ...(prev ? { previous: downsampleRate(prev.votes, prev.views) } : {}),
  };
  const completion: Stat = {
    label: "Completion rate",
    value: w.completionRate !== null ? fmtPct(w.completionRate, 1) : "—",
    ...deltaParts(w.completionRate ?? 0, prevCompletion),
    spark: downsampleRate(cur.completed, cur.voters),
    ...(prev ? { previous: downsampleRate(prev.completed, prev.voters) } : {}),
  };

  views.insights = [
    { text: trendLine("Views", views, range), to: "/analytics", tone: views.trend === "down" ? "danger" : "success" },
    { text: `${channelVoters.topChannel} delivers ${channelVoters.topShare}% of all voters.`, to: "/distribution", tone: "success" },
    ...(uncoveredScheduled
      ? [{ text: `${uncoveredScheduled.name} starts ${relativeToToday(uncoveredScheduled.startAt!)} with no sources.`, to: `/campaigns/${uncoveredScheduled.id}`, tone: "danger" as const }]
      : []),
  ];
  votes.insights = [
    { text: trendLine("Votes", votes, range), to: "/analytics", tone: votes.trend === "down" ? "danger" : "success" },
    ...(biggestShortfall
      ? [{ text: `${biggestShortfall.name} is ${fmtInt(biggestShortfall.target! - biggestShortfall.voters)} voters short of its ${fmtInt(biggestShortfall.target!)} target.`, to: `/campaigns/${biggestShortfall.id}`, tone: "warning" as const }]
      : []),
  ];
  engagement.insights = [
    { text: trendLine("Engagement", engagement, range), to: "/analytics", tone: engagement.trend === "down" ? "danger" : "success" },
    ...(bestEngagementCampaign
      ? [{ text: `${bestEngagementCampaign.name} converts ${fmtPct((bestEngagementCampaign.votes / bestEngagementCampaign.views) * 100, 0)} of views into votes — the strongest live campaign.`, to: `/campaigns/${bestEngagementCampaign.id}`, tone: "success" as const }]
      : []),
  ];
  completion.insights = [
    { text: trendLine("Completion", completion, range), to: "/analytics", tone: completion.trend === "down" ? "danger" : "success" },
    ...(lowestCompletionActive
      ? [{ text: `${lowestCompletionActive.name} completes at ${fmtPct(lowestCompletionActive.completionRate!, 0)} — the lowest of any active campaign.`, to: `/campaigns/${lowestCompletionActive.id}`, tone: "warning" as const }]
      : []),
    ...laggingSources.slice(0, 1).map((s) => ({
      text: `${s.name} completes at ${fmtPct(s.completionRate!, 0)} — its campaign averages ${fmtPct(linkedTotals(s.linked!).rate, 0)}.`,
      to: "/distribution",
      tone: "danger" as const,
    })),
  ];

  const stats = [views, votes, engagement, completion];
  return stats.map((stat) => ({ ...stat, info: STAT_INFO[stat.label] }));
};

/** One definition per metric — attached to every stat on the strip. */
const STAT_INFO: Record<string, string> = {
  "Total views": "Times a Polst was shown, across every campaign, standalone Polst, and source in this workspace.",
  "Total votes": "Option taps. A voter answering a three-question campaign counts as three votes.",
  "Engagement rate": "Total votes ÷ total views for the period.",
  "Completion rate": "Voters who completed the full sequence ÷ voters who started it.",
};

export const DASHBOARD_STATS: Record<StatRange, Stat[]> = {
  "7D": buildStats("7D"),
  "30D": buildStats("30D"),
  "90D": buildStats("90D"),
  All: buildStats("All"),
};

/** Axis labels for the expanded chart — first / middle / last window day. */
export const STAT_XTICKS: Record<StatRange, string[]> = Object.fromEntries(
  STAT_RANGES.map((range) => {
    const [start, end] = windowBounds(range);
    const mid = workspaceWindow(range).series.views.dates[Math.floor(daysBetween(start, end) / 2)];
    return [range, [fmtDate(start), fmtDate(mid), fmtDate(end)]];
  }),
) as Record<StatRange, string[]>;

/* ── Ready to decide & attention (Home) ──────────────────────────── */

export const READY_TO_DECIDE: Campaign[] = CAMPAIGNS.filter(isReadyToDecide);

export type ListItem = {
  id: string;
  title: string;
  reason: string;
  tone: "danger" | "warning" | "neutral";
  action: string;
  to: string;
};

/** Rule-derived queue, ordered by severity (a→e in the derivation), cap 5. */
export const ATTENTION_ITEMS: ListItem[] = (() => {
  const items: ListItem[] = [];
  // a) Scheduled campaign starting ≤14 days with no sources — launch is blocked.
  for (const c of CAMPAIGNS) {
    if (c.status === "Scheduled" && c.startAt && daysBetween(TODAY, c.startAt) <= 14 && !c.sources.length) {
      items.push({
        id: `${c.id}-no-sources`,
        title: `${c.name} starts ${relativeToToday(c.startAt)} with no sources`,
        reason: `Nothing is set up to collect voters before the ${fmtDate(c.startAt)} start. Add a QR code, link, or embed.`,
        tone: "danger",
        action: "Add sources",
        to: `/campaigns/${c.id}`,
      });
    }
  }
  // b) A source eroding its campaign's completion on real volume.
  for (const s of laggingSources) {
    const rate = linkedTotals(s.linked!).rate;
    items.push({
      id: `${s.id}-completion`,
      title: `${s.name} completion is ${fmtPct(s.completionRate!, 0)} — the campaign averages ${fmtPct(rate, 0)}`,
      reason: `${fmtInt(s.voters)} voters arrived through it, but most stop before the last question. Check the landing step.`,
      tone: "warning",
      action: "View source",
      to: "/distribution",
    });
  }
  // c) The nearest key date (≤21 days out) with nothing planned against it.
  const attachedEvents = new Set([
    ...CAMPAIGNS.map((c) => c.event),
    ...SINGLE_POLSTS.map((p) => p.event),
  ]);
  const uncovered = KEY_DATES.filter(
    (k) => daysBetween(TODAY, k.start) >= 0 && daysBetween(TODAY, k.start) <= 21 && !attachedEvents.has(k.id),
  ).sort((a, b) => a.start.localeCompare(b.start))[0];
  if (uncovered) {
    items.push({
      id: `${uncovered.id}-uncovered`,
      title: `Nothing is planned for ${uncovered.title} (${fmtDate(uncovered.start)})`,
      reason: "No campaign or Polst is attached to this key date yet.",
      tone: "warning",
      action: "Plan a campaign",
      to: `/campaigns/new?event=${uncovered.id}`,
    });
  }
  // d) Draft campaigns with nothing inside them.
  for (const c of CAMPAIGNS) {
    if (c.status === "Draft" && !c.chain.length) {
      items.push({
        id: `${c.id}-empty`,
        title: `${c.name} has no Polsts yet`,
        reason: "The draft can't be scheduled until it has at least one question.",
        tone: "neutral",
        action: "Add Polsts",
        to: `/campaigns/${c.id}`,
      });
    }
  }
  // e) Draft Polsts still missing a schedule.
  for (const p of SINGLE_POLSTS) {
    if (p.status === "Draft" && !p.startAt) {
      items.push({
        id: `${p.id}-unfinished`,
        title: `Finish "${p.question}"`,
        reason: "The draft has both options but no schedule or source yet.",
        tone: "neutral",
        action: "Finish Polst",
        to: `/polsts/${p.id}`,
      });
    }
  }
  return items.slice(0, 5);
})();

/* ── Calendar (Home) ─────────────────────────────────────────────── */

/** The month the calendar opens on, and "today". Navigation moves off this. */
export const CALENDAR_MONTH = { month: 5, year: 2026, today: TODAY };

export type CalendarItemKind = "campaign" | "polst" | "date";

/** Campaigns/Polsts render as bars from start to end; key dates carry no
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

export const WHAT_CHANGED: WhatChanged[] = [
  { id: "wc-packaging-target", text: "Packaging Direction Test passed its 1,200-voter target", at: "2026-06-13", to: "/campaigns/packaging-direction" },
  { id: "wc-conference", text: "QR — Conference Booth completion fell to 41%", at: "2026-06-14", to: "/distribution" },
  { id: "wc-flavor-report", text: "Flavor Launch Recap report is ready", at: "2026-06-11", to: "/analytics/reports" },
  { id: "wc-summer-2k", text: "Summer Flavor Lineup passed 2,000 voters", at: "2026-06-12", to: "/campaigns/summer-flavor-lineup" },
];

export type WorkspaceNotification = {
  id: string;
  title: string;
  body: string;
  at: string;
  to: string;
  read: boolean;
};

export const WORKSPACE_NOTIFICATIONS: WorkspaceNotification[] = [
  { id: "nt-packaging-target", title: "Packaging Direction Test passed its target", body: "1,486 of 1,200 voters — the recommendation is ready to review.", at: "2026-06-13", to: "/campaigns/packaging-direction", read: false },
  { id: "nt-conference", title: "QR — Conference Booth completion fell to 41%", body: "Scans keep coming, but most voters stop before the last question.", at: "2026-06-14", to: "/distribution", read: false },
  { id: "nt-flavor-report", title: "Flavor Launch Recap report is ready", body: "The decision report for the ended run is ready to preview.", at: "2026-06-11", to: "/analytics/reports", read: true },
  { id: "nt-summer-2k", title: "Summer Flavor Lineup passed 2,000 voters", body: "2,103 voters so far, against a 2,500 target.", at: "2026-06-12", to: "/campaigns/summer-flavor-lineup", read: false },
  { id: "nt-holiday-leading", title: "Holiday Gifting Bundles moved to Leading", body: "Trio Box leads by 10 points with 74% of the voter target reached.", at: "2026-06-14", to: "/campaigns/holiday-gifting-bundles", read: false },
];

/* ── Reports ─────────────────────────────────────────────────────── */

export type WorkspaceReport = {
  id: string;
  name: string;
  linked: { type: "campaign" | "polst"; id: string };
  status: "Ready" | "Draft";
  createdAt: string;
};

export const REPORTS: WorkspaceReport[] = [
  { id: "flavor-launch-recap-report", name: "Flavor Launch Recap — decision report", linked: { type: "campaign", id: "flavor-launch-recap" }, status: "Ready", createdAt: "2026-06-11" },
  { id: "label-layout-report", name: "Label Layout — results summary", linked: { type: "polst", id: "label-layout" }, status: "Ready", createdAt: "2026-06-01" },
  { id: "packaging-direction-report", name: "Packaging Direction Test — decision report", linked: { type: "campaign", id: "packaging-direction" }, status: "Draft", createdAt: "2026-06-15" },
];

/* ── Usage (plan/billing surface) ────────────────────────────────── */

const monthTotals = (series: DailySeries, monthPrefix: string) =>
  series.values.reduce((a, v, i) => (series.dates[i].startsWith(monthPrefix) ? a + v : a), 0);

export const USAGE = (() => {
  const all = workspaceWindow("All");
  return {
    campaignsCreated: CAMPAIGNS.length,
    polstsCreated: CAMPAIGNS.reduce((a, c) => a + c.chain.length, 0) + SINGLE_POLSTS.length,
    totalViews: all.views,
    totalVotes: all.votes,
    byMonth: [
      { month: "May", views: monthTotals(all.series.views, "2026-05"), votes: monthTotals(all.series.votes, "2026-05") },
      { month: "Jun", views: monthTotals(all.series.views, "2026-06"), votes: monthTotals(all.series.votes, "2026-06") },
    ],
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

const mixFor = (shares: Array<{ label: string; value: number }>, range: WindowRange): MixSlice[] => {
  const counts = allocate(workspaceWindow(range).voters, shares.map((s) => s.value));
  return shares.map((s, i) => ({ ...s, detail: `${fmtInt(counts[i])} voters` }));
};

export const deviceMix = (range: WindowRange): MixSlice[] => mixFor(DEVICE_SHARES, range);
export const platformMix = (range: WindowRange): MixSlice[] => mixFor(PLATFORM_SHARES, range);

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

/** "Minimal label +16 pts" | "—" — the one string form of a winner. */
export const winnerLabel = (c: { winner: { option: string; marginPts: number } | null }) =>
  c.winner ? `${c.winner.option} +${c.winner.marginPts} pts` : "—";

/* ── Team & invitations (Settings) ───────────────────────────────── */

export type TeamRole = "Owner" | "Editor" | "Viewer";

export type TeamMember = { id: string; name: string; email: string; role: TeamRole };

export const TEAM: TeamMember[] = [
  { id: "owner", name: WORKSPACE.owner, email: WORKSPACE.email, role: "Owner" },
  { id: "strategist", name: "Elena Morris", email: "elena@northstarpantry.co", role: "Editor" },
  { id: "analyst", name: "Devon Park", email: "devon@northstarpantry.co", role: "Viewer" },
];

export type PendingInvite = { id: string; email: string; role: TeamRole; sent: string };

export const PENDING_INVITES: PendingInvite[] = [
  { id: "invite-agency", email: "sam@brightside.agency", role: "Viewer", sent: fmtDate("2026-06-12") },
];

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

/** Round-robin photo assignment in data-declaration order (standalone Polsts,
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

/** A dashboard Polst as the consumer card renders it: the real option pair
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
