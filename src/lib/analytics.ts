/* ── Analytics — windowed, source-attributed views of the workspace ────
   Rows are derived per request: each campaign/Polst's window totals come
   from the same daily series the Home stats read, then split across its
   sources' channels with exact integer allocation — so Analytics always
   reconciles with the rest of the dashboard by construction. */

import { allocate, sumWindow, windowBounds, type WindowRange } from "@/lib/engine";
import {
  CAMPAIGNS,
  SINGLE_POLSTS,
  SOURCES,
  campaignSeries,
  polstSeries,
  type Campaign,
  type Channel,
  type SinglePolst,
  type Vertical,
} from "@/lib/workspace";

/** @deprecated use WindowRange from engine */
export type AnalyticsRange = WindowRange;

export type AnalyticsFilters = {
  range: WindowRange;
  channel: string;
  vertical: string;
  /** @deprecated the UTM dimension is gone; kept optional for old pages. */
  utm?: string;
};

export const ANALYTICS_DEFAULTS: AnalyticsFilters = {
  range: "30D",
  channel: "All channels",
  vertical: "All verticals",
};

export type SegmentMetrics = {
  views: number;
  voters: number;
  completed: number;
  votes: number;
  shares: number;
};

export type SegmentRow = {
  id: string; // `${objectId}:${channel}`
  kind: "campaign" | "polst";
  objectId: string;
  name: string;
  channel: Channel;
  vertical: Vertical;
  metrics: SegmentMetrics;
};

const METRIC_KEYS: Array<keyof SegmentMetrics> = ["views", "voters", "completed", "votes", "shares"];

/** One traffic-bearing object's window totals split across its channels.
 *  Every split uses `allocate`, so channel rows sum EXACTLY to the object
 *  and all rows sum exactly to the workspace window. */
function objectRows(
  object: Campaign | SinglePolst,
  kind: "campaign" | "polst",
  name: string,
  vertical: Vertical,
  start: string,
  end: string,
): SegmentRow[] {
  const sources = object.sources;
  if (!sources.length) return [];
  const series = (metric: "views" | "votes" | "voters" | "completed") =>
    kind === "campaign"
      ? campaignSeries(object as Campaign, metric)
      : polstSeries(object as SinglePolst, metric);
  const views = sumWindow(series("views"), start, end);
  const votes = sumWindow(series("votes"), start, end);
  const voters = sumWindow(series("voters"), start, end);
  const completed = sumWindow(series("completed"), start, end);
  if (views + votes + voters + completed === 0) return [];
  // Shares scale with the voters that fall inside the window (exact split).
  const totalVoters = kind === "campaign" ? (object as Campaign).voters : (object as SinglePolst).votes;
  const totalShares = kind === "campaign" ? (object as Campaign).shares : (object as SinglePolst).interactions;
  const shares = allocate(totalShares, [voters, Math.max(0, totalVoters - voters)])[0];
  // Channel share = Σ voterShare of the object's sources in that channel.
  const channelShare = new Map<Channel, number>();
  for (const s of sources) {
    channelShare.set(s.channel, (channelShare.get(s.channel) ?? 0) + (s.voterShare ?? 0));
  }
  const channels = [...channelShare.keys()];
  const weights = channels.map((c) => channelShare.get(c)!);
  const split: Record<keyof SegmentMetrics, number[]> = {
    views: allocate(views, weights),
    voters: allocate(voters, weights),
    completed: allocate(completed, weights),
    votes: allocate(votes, weights),
    shares: allocate(shares, weights),
  };
  return channels.map((channel, i) => ({
    id: `${object.id}:${channel}`,
    kind,
    objectId: object.id,
    name,
    channel,
    vertical,
    metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, split[k][i]])) as SegmentMetrics,
  }));
}

const rowsCache = new Map<WindowRange, SegmentRow[]>();

const rowsForRange = (range: WindowRange): SegmentRow[] => {
  const hit = rowsCache.get(range);
  if (hit) return hit;
  const [start, end] = windowBounds(range);
  const rows = [
    ...CAMPAIGNS.flatMap((c) => objectRows(c, "campaign", c.name, c.vertical, start, end)),
    ...SINGLE_POLSTS.flatMap((p) => objectRows(p, "polst", p.question, p.vertical, start, end)),
  ];
  rowsCache.set(range, rows);
  return rows;
};

export function analyticsRows(filters: AnalyticsFilters): SegmentRow[] {
  return rowsForRange(filters.range).filter(
    (row) =>
      (filters.channel === "All channels" || row.channel === filters.channel) &&
      (filters.vertical === "All verticals" || row.vertical === filters.vertical),
  );
}

export const segmentTotal = (rows: SegmentRow[], key: keyof SegmentMetrics): number =>
  rows.reduce((sum, row) => sum + row.metrics[key], 0);

/** Share-of-total breakdown by any dimension — works for the new SegmentRow
 *  and the deprecated AnalyticsResult alike (both carry numeric metrics). */
export function mixBy<T extends { metrics: Record<string, number> }>(
  rows: T[],
  getLabel: (row: T) => string,
  metric = "views",
) {
  const denominator = rows.reduce((sum, row) => sum + (row.metrics[metric] ?? 0), 0);
  const groups = new Map<string, number>();
  for (const row of rows) {
    const label = getLabel(row);
    groups.set(label, (groups.get(label) ?? 0) + (row.metrics[metric] ?? 0));
  }
  return [...groups.entries()]
    .map(([label, value]) => ({
      label,
      value: denominator > 0 ? Math.round((value / denominator) * 100) : 0,
      detail: `${value.toLocaleString("en-US")} ${metric}`,
    }))
    .sort((a, b) => b.value - a.value);
}

export type VerticalRow = SegmentMetrics & {
  id: string;
  vertical: Vertical;
  completionRate: number | null;
  engagementRate: number | null;
};

/** Per-vertical rollup of the given rows (the Analytics verticals table). */
export function verticalRows(rows: SegmentRow[]): VerticalRow[] {
  const groups = new Map<Vertical, SegmentRow[]>();
  for (const row of rows) groups.set(row.vertical, [...(groups.get(row.vertical) ?? []), row]);
  return [...groups.entries()]
    .map(([vertical, grouped]) => {
      const metrics = Object.fromEntries(
        METRIC_KEYS.map((k) => [k, segmentTotal(grouped, k)]),
      ) as SegmentMetrics;
      return {
        id: vertical.toLowerCase().replace(/[^a-z]+/g, "-"),
        vertical,
        ...metrics,
        completionRate: metrics.voters > 0 ? Math.round((metrics.completed / metrics.voters) * 1000) / 10 : null,
        engagementRate: metrics.views > 0 ? Math.round((metrics.votes / metrics.views) * 1000) / 10 : null,
      };
    })
    .sort((a, b) => b.voters - a.voters);
}

/** Filter options, derived from the entities that actually exist. */
export const ANALYTICS_CHANNELS = [...new Set(SOURCES.map((s) => s.channel))];
export const ANALYTICS_VERTICALS = [
  ...new Set([...CAMPAIGNS.map((c) => c.vertical), ...SINGLE_POLSTS.map((p) => p.vertical)]),
];

/* ══════════════════════════════════════════════════════════════════
   COMPAT LAYER — the old fabricated segment table and its helpers.
   Still imported by src/pages/Analytics.tsx and analytics-context;
   deleted when those pages are rebuilt on analyticsRows above.
   ══════════════════════════════════════════════════════════════════ */

/** @deprecated fabricated — deleted with page rebuilds */
export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilters = {
  range: "30D",
  channel: "All channels",
  vertical: "All verticals",
  utm: "All UTM groups",
};

type LegacySegmentMetrics = {
  views: number;
  starts: number;
  completions: number;
  votes: number;
  shares: number;
  signups: number;
  impressions: number;
  clicks: number;
  spend: number;
  newUsers: number;
  returningUsers: number;
  repeatUsers: number;
  notificationReturns: number;
  churnedUsers: number;
  sessions: number;
  sessionPolls: number;
  timeToVoteSeconds: number;
  timeOnSiteSeconds: number;
  d1: number;
  d7: number;
  d30: number;
};

/** @deprecated fabricated — deleted with page rebuilds */
export type AnalyticsSegment = {
  id: string;
  campaignId: string;
  campaign: string;
  channel: Channel;
  vertical: Vertical;
  utm: "Organic" | "Email" | "Paid social" | "Creator" | "Offline QR";
  topic: string;
  hook: string;
  format: "Embed" | "Static image" | "Short video" | "Story" | "Email" | "QR code";
  device: "Mobile" | "Desktop" | "Tablet";
  platform: "iOS" | "Android" | "macOS" | "Windows";
  metrics: LegacySegmentMetrics;
};

/** @deprecated fabricated — deleted with page rebuilds */
export const ANALYTICS_SEGMENTS: AnalyticsSegment[] = [
  {
    id: "packaging-web",
    campaignId: "packaging-direction",
    campaign: "Packaging Direction Test",
    channel: "Website",
    vertical: "Food & drink",
    utm: "Organic",
    topic: "Packaging",
    hook: "Which feels more premium?",
    format: "Embed",
    device: "Desktop",
    platform: "macOS",
    metrics: { views: 3280, starts: 2730, completions: 2184, votes: 4092, shares: 241, signups: 138, impressions: 4100, clicks: 3280, spend: 0, newUsers: 2130, returningUsers: 600, repeatUsers: 812, notificationReturns: 86, churnedUsers: 61, sessions: 2510, sessionPolls: 8910, timeToVoteSeconds: 4.1, timeOnSiteSeconds: 96, d1: 48, d7: 36, d30: 27 },
  },
  {
    id: "packaging-instagram",
    campaignId: "packaging-direction",
    campaign: "Packaging Direction Test",
    channel: "Instagram",
    vertical: "Food & drink",
    utm: "Paid social",
    topic: "Packaging",
    hook: "Pick the shelf standout",
    format: "Short video",
    device: "Mobile",
    platform: "iOS",
    metrics: { views: 2410, starts: 1818, completions: 1216, votes: 2264, shares: 188, signups: 92, impressions: 61200, clicks: 2410, spend: 982, newUsers: 1502, returningUsers: 316, repeatUsers: 421, notificationReturns: 74, churnedUsers: 94, sessions: 1704, sessionPolls: 4686, timeToVoteSeconds: 5.8, timeOnSiteSeconds: 58, d1: 39, d7: 25, d30: 17 },
  },
  {
    id: "packaging-creator",
    campaignId: "packaging-direction",
    campaign: "Packaging Direction Test",
    channel: "Influencer",
    vertical: "Food & drink",
    utm: "Creator",
    topic: "Packaging",
    hook: "Morning Feed taste test",
    format: "Story",
    device: "Mobile",
    platform: "Android",
    metrics: { views: 1462, starts: 1126, completions: 784, votes: 1498, shares: 132, signups: 68, impressions: 48600, clicks: 1462, spend: 598, newUsers: 884, returningUsers: 242, repeatUsers: 346, notificationReturns: 51, churnedUsers: 48, sessions: 1010, sessionPolls: 3414, timeToVoteSeconds: 5.2, timeOnSiteSeconds: 67, d1: 44, d7: 31, d30: 23 },
  },
  {
    id: "summer-instagram",
    campaignId: "summer-flavor-lineup",
    campaign: "Summer Flavor Lineup",
    channel: "Instagram",
    vertical: "Food & drink",
    utm: "Paid social",
    topic: "Seasonal flavors",
    hook: "Build the summer box",
    format: "Static image",
    device: "Mobile",
    platform: "Android",
    metrics: { views: 3610, starts: 2744, completions: 1592, votes: 4936, shares: 296, signups: 71, impressions: 92500, clicks: 3610, spend: 1119, newUsers: 2238, returningUsers: 506, repeatUsers: 612, notificationReturns: 91, churnedUsers: 128, sessions: 2582, sessionPolls: 7312, timeToVoteSeconds: 6.4, timeOnSiteSeconds: 54, d1: 36, d7: 22, d30: 15 },
  },
  {
    id: "summer-qr",
    campaignId: "summer-flavor-lineup",
    campaign: "Summer Flavor Lineup",
    channel: "QR",
    vertical: "Food & drink",
    utm: "Offline QR",
    topic: "Seasonal flavors",
    hook: "Scan to choose the next flavor",
    format: "QR code",
    device: "Mobile",
    platform: "iOS",
    metrics: { views: 714, starts: 492, completions: 202, votes: 498, shares: 22, signups: 12, impressions: 0, clicks: 714, spend: 186, newUsers: 402, returningUsers: 90, repeatUsers: 71, notificationReturns: 14, churnedUsers: 43, sessions: 468, sessionPolls: 744, timeToVoteSeconds: 8.7, timeOnSiteSeconds: 39, d1: 28, d7: 14, d30: 8 },
  },
  {
    id: "summer-creator",
    campaignId: "summer-flavor-lineup",
    campaign: "Summer Flavor Lineup",
    channel: "Influencer",
    vertical: "Food & drink",
    utm: "Creator",
    topic: "Seasonal flavors",
    hook: "Snack Review flavor bracket",
    format: "Short video",
    device: "Mobile",
    platform: "iOS",
    metrics: { views: 806, starts: 644, completions: 438, votes: 1260, shares: 83, signups: 35, impressions: 19200, clicks: 806, spend: 234, newUsers: 512, returningUsers: 132, repeatUsers: 196, notificationReturns: 29, churnedUsers: 22, sessions: 596, sessionPolls: 2354, timeToVoteSeconds: 4.8, timeOnSiteSeconds: 88, d1: 51, d7: 38, d30: 29 },
  },
  {
    id: "flavor-email",
    campaignId: "flavor-launch-recap",
    campaign: "Flavor Launch Recap",
    channel: "Email",
    vertical: "Food & drink",
    utm: "Email",
    topic: "Flavor launch",
    hook: "Help choose the retail lead",
    format: "Email",
    device: "Desktop",
    platform: "Windows",
    metrics: { views: 1930, starts: 1578, completions: 1136, votes: 4288, shares: 174, signups: 102, impressions: 8106, clicks: 1930, spend: 180, newUsers: 986, returningUsers: 592, repeatUsers: 644, notificationReturns: 293, churnedUsers: 38, sessions: 1438, sessionPolls: 5876, timeToVoteSeconds: 4.6, timeOnSiteSeconds: 112, d1: 57, d7: 43, d30: 34 },
  },
  {
    id: "flavor-qr",
    campaignId: "flavor-launch-recap",
    campaign: "Flavor Launch Recap",
    channel: "QR",
    vertical: "Food & drink",
    utm: "Offline QR",
    topic: "Flavor launch",
    hook: "Taste, scan, vote",
    format: "QR code",
    device: "Mobile",
    platform: "Android",
    metrics: { views: 1040, starts: 842, completions: 624, votes: 2246, shares: 58, signups: 16, impressions: 0, clicks: 1040, spend: 120, newUsers: 642, returningUsers: 200, repeatUsers: 238, notificationReturns: 31, churnedUsers: 46, sessions: 802, sessionPolls: 2684, timeToVoteSeconds: 6.9, timeOnSiteSeconds: 71, d1: 34, d7: 21, d30: 13 },
  },
  {
    id: "retail-web",
    campaignId: "retail-shelf-layout",
    campaign: "Retail Shelf Layout",
    channel: "Website",
    vertical: "Shopping & deals",
    utm: "Organic",
    topic: "Shelf layout",
    hook: "Which shelf reads fastest?",
    format: "Embed",
    device: "Desktop",
    platform: "Windows",
    metrics: { views: 2010, starts: 1442, completions: 678, votes: 1240, shares: 51, signups: 44, impressions: 2590, clicks: 2010, spend: 0, newUsers: 1018, returningUsers: 424, repeatUsers: 382, notificationReturns: 63, churnedUsers: 76, sessions: 1352, sessionPolls: 3928, timeToVoteSeconds: 7.2, timeOnSiteSeconds: 62, d1: 37, d7: 24, d30: 16 },
  },
  {
    id: "holiday-email",
    campaignId: "holiday-gifting-bundles",
    campaign: "Holiday Gifting Bundles",
    channel: "Email",
    vertical: "Shopping & deals",
    utm: "Email",
    topic: "Gift bundles",
    hook: "Choose the bundle you would send",
    format: "Email",
    device: "Desktop",
    platform: "macOS",
    metrics: { views: 1724, starts: 1398, completions: 894, votes: 2518, shares: 112, signups: 74, impressions: 8032, clicks: 1724, spend: 146, newUsers: 792, returningUsers: 606, repeatUsers: 526, notificationReturns: 211, churnedUsers: 41, sessions: 1286, sessionPolls: 4638, timeToVoteSeconds: 5.1, timeOnSiteSeconds: 104, d1: 54, d7: 41, d30: 31 },
  },
  {
    id: "holiday-creator",
    campaignId: "holiday-gifting-bundles",
    campaign: "Holiday Gifting Bundles",
    channel: "Influencer",
    vertical: "Shopping & deals",
    utm: "Creator",
    topic: "Gift bundles",
    hook: "Pantry Notes gifting edit",
    format: "Story",
    device: "Mobile",
    platform: "iOS",
    metrics: { views: 1120, starts: 862, completions: 492, votes: 1386, shares: 96, signups: 46, impressions: 58900, clicks: 1120, spend: 739, newUsers: 676, returningUsers: 186, repeatUsers: 244, notificationReturns: 38, churnedUsers: 39, sessions: 816, sessionPolls: 2582, timeToVoteSeconds: 6.1, timeOnSiteSeconds: 73, d1: 42, d7: 29, d30: 20 },
  },
  {
    id: "loyalty-web",
    campaignId: "loyalty-program-naming",
    campaign: "Loyalty Program Naming",
    channel: "Website",
    vertical: "Lifestyle",
    utm: "Organic",
    topic: "Loyalty naming",
    hook: "Name the rewards program",
    format: "Embed",
    device: "Tablet",
    platform: "iOS",
    metrics: { views: 486, starts: 362, completions: 224, votes: 418, shares: 18, signups: 11, impressions: 612, clicks: 486, spend: 0, newUsers: 266, returningUsers: 96, repeatUsers: 82, notificationReturns: 12, churnedUsers: 17, sessions: 338, sessionPolls: 796, timeToVoteSeconds: 6.6, timeOnSiteSeconds: 69, d1: 35, d7: 23, d30: 14 },
  },
];

const RANGE_SCALE: Record<WindowRange, number> = { "7D": 0.24, "30D": 1, "90D": 2.74, All: 7.6 };
const RATE_ADJUSTMENT: Record<WindowRange, number> = { "7D": 1.5, "30D": 0, "90D": -1.2, All: -2.4 };

const COUNT_KEYS: Array<keyof LegacySegmentMetrics> = [
  "views", "starts", "completions", "votes", "shares", "signups", "impressions", "clicks",
  "spend", "newUsers", "returningUsers", "repeatUsers", "notificationReturns", "churnedUsers",
  "sessions", "sessionPolls",
];

/** @deprecated fabricated — deleted with page rebuilds */
export type AnalyticsResult = Omit<AnalyticsSegment, "metrics"> & { metrics: LegacySegmentMetrics };

/** @deprecated fabricated — deleted with page rebuilds */
export const ANALYTICS_UTMS = [...new Set(ANALYTICS_SEGMENTS.map((row) => row.utm))];

/** @deprecated fabricated — deleted with page rebuilds */
export function queryAnalytics(filters: AnalyticsFilters): AnalyticsResult[] {
  const scale = RANGE_SCALE[filters.range];
  const rateAdjustment = RATE_ADJUSTMENT[filters.range];
  return ANALYTICS_SEGMENTS.filter((row) =>
    (filters.channel === "All channels" || row.channel === filters.channel) &&
    (filters.vertical === "All verticals" || row.vertical === filters.vertical) &&
    (!filters.utm || filters.utm === "All UTM groups" || row.utm === filters.utm),
  ).map((row) => {
    const metrics = { ...row.metrics };
    COUNT_KEYS.forEach((key) => {
      metrics[key] = Math.round(metrics[key] * scale);
    });
    metrics.d1 = Math.max(0, metrics.d1 + rateAdjustment);
    metrics.d7 = Math.max(0, metrics.d7 + rateAdjustment);
    metrics.d30 = Math.max(0, metrics.d30 + rateAdjustment);
    return { ...row, metrics };
  });
}

/** @deprecated fabricated — deleted with page rebuilds */
export const total = (rows: AnalyticsResult[], key: keyof LegacySegmentMetrics) =>
  rows.reduce((sum, row) => sum + row.metrics[key], 0);

export const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;

export const formatPercent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;
export const formatMoney = (value: number) => value > 0 ? `$${value.toFixed(2)}` : "-";

/** @deprecated fabricated — deleted with page rebuilds */
export function weightedAverage(
  rows: AnalyticsResult[],
  value: keyof LegacySegmentMetrics,
  weight: keyof LegacySegmentMetrics,
) {
  const denominator = total(rows, weight);
  return denominator > 0
    ? rows.reduce((sum, row) => sum + row.metrics[value] * row.metrics[weight], 0) / denominator
    : 0;
}

function groupRows(rows: AnalyticsResult[], getKey: (row: AnalyticsResult) => string) {
  const groups = new Map<string, AnalyticsResult[]>();
  rows.forEach((row) => groups.set(getKey(row), [...(groups.get(getKey(row)) ?? []), row]));
  return [...groups.entries()];
}

/** @deprecated fabricated — deleted with page rebuilds */
export function seriesFor(
  rows: AnalyticsResult[],
  metric: keyof LegacySegmentMetrics,
  points = 14,
) {
  const sum = total(rows, metric);
  if (!sum) return Array.from({ length: points }, () => 0);
  const weights = Array.from({ length: points }, (_, index) =>
    0.72 + ((index * 7 + rows.length * 3) % 9) * 0.045 + index * 0.012,
  );
  const weightTotal = weights.reduce((acc, weight) => acc + weight, 0);
  return weights.map((weight) => Math.max(1, Math.round((sum * weight) / weightTotal)));
}

/** @deprecated fabricated — deleted with page rebuilds */
export type AcquisitionRow = {
  id: string;
  channel: string;
  visits: number;
  signups: number;
  newUsers: number;
  returningUsers: number;
  conversion: string;
  ctr: string;
  cpc: string;
  cpa: string;
};

/** @deprecated fabricated — deleted with page rebuilds */
export function acquisitionByChannel(rows: AnalyticsResult[]): AcquisitionRow[] {
  return groupRows(rows, (row) => row.channel).map(([channel, grouped]) => {
    const spend = total(grouped, "spend");
    const clicks = total(grouped, "clicks");
    const impressions = total(grouped, "impressions");
    const signups = total(grouped, "signups");
    const completions = total(grouped, "completions");
    const tracksClicks = channel === "Instagram" || channel === "Influencer" || channel === "Email";
    return {
      id: channel.toLowerCase(),
      channel,
      visits: total(grouped, "views"),
      signups,
      newUsers: total(grouped, "newUsers"),
      returningUsers: total(grouped, "returningUsers"),
      conversion: formatPercent(ratio(signups, completions)),
      ctr: tracksClicks && impressions > 0 ? formatPercent(ratio(clicks, impressions)) : "-",
      cpc: tracksClicks ? formatMoney(clicks ? spend / clicks : 0) : "-",
      cpa: formatMoney(signups ? spend / signups : 0),
    };
  }).sort((a, b) => b.signups - a.signups);
}

/** @deprecated fabricated — deleted with page rebuilds */
export type CampaignReturnRow = {
  id: string;
  campaign: string;
  spend: string;
  accounts: number;
  engaged: number;
  newUsers: number;
  returningUsers: number;
  cpa: string;
  costPerEngaged: string;
};

/** @deprecated fabricated — deleted with page rebuilds */
export function campaignReturns(rows: AnalyticsResult[]): CampaignReturnRow[] {
  return groupRows(rows, (row) => row.campaignId).map(([id, grouped]) => {
    const spend = total(grouped, "spend");
    const accounts = total(grouped, "signups");
    const engaged = total(grouped, "completions");
    return {
      id,
      campaign: grouped[0].campaign,
      spend: `$${Math.round(spend).toLocaleString("en-US")}`,
      accounts,
      engaged,
      newUsers: total(grouped, "newUsers"),
      returningUsers: total(grouped, "returningUsers"),
      cpa: formatMoney(accounts ? spend / accounts : 0),
      costPerEngaged: formatMoney(engaged ? spend / engaged : 0),
    };
  }).sort((a, b) => b.engaged - a.engaged);
}

/** @deprecated fabricated — deleted with page rebuilds */
export type ContentPerformanceRow = {
  id: string;
  topic: string;
  hook: string;
  format: string;
  views: number;
  engagement: string;
  completion: string;
  shareRate: string;
};

/** @deprecated fabricated — deleted with page rebuilds */
export function contentPerformance(rows: AnalyticsResult[]): ContentPerformanceRow[] {
  return rows.map((row) => ({
    id: row.id,
    topic: row.topic,
    hook: row.hook,
    format: row.format,
    views: row.metrics.views,
    engagement: formatPercent(ratio(row.metrics.votes, row.metrics.views)),
    completion: formatPercent(ratio(row.metrics.completions, row.metrics.starts)),
    shareRate: formatPercent(ratio(row.metrics.shares, row.metrics.completions)),
  })).sort((a, b) => b.views - a.views);
}

/** @deprecated fabricated — deleted with page rebuilds */
export type RetentionBreakdownRow = {
  id: string;
  cohort: string;
  newUsers: number;
  returningUsers: number;
  repeatRate: string;
  frequency: string;
  d1: string;
  d7: string;
  d30: string;
};

/** @deprecated fabricated — deleted with page rebuilds */
export function retentionByChannel(rows: AnalyticsResult[]): RetentionBreakdownRow[] {
  return groupRows(rows, (row) => row.channel).map(([channel, grouped]) => ({
    id: channel.toLowerCase(),
    cohort: channel,
    newUsers: total(grouped, "newUsers"),
    returningUsers: total(grouped, "returningUsers"),
    repeatRate: formatPercent(ratio(total(grouped, "repeatUsers"), total(grouped, "starts"))),
    frequency: (total(grouped, "sessionPolls") / Math.max(1, total(grouped, "sessions"))).toFixed(1),
    d1: formatPercent(weightedAverage(grouped, "d1", "newUsers"), 0),
    d7: formatPercent(weightedAverage(grouped, "d7", "newUsers"), 0),
    d30: formatPercent(weightedAverage(grouped, "d30", "newUsers"), 0),
  })).sort((a, b) => b.returningUsers - a.returningUsers);
}

/** @deprecated fabricated — deleted with page rebuilds */
export type TrafficQualityRow = {
  id: string;
  channel: string;
  vertical: string;
  format: string;
  bounce: string;
  timeOnSite: string;
  dropOff: string;
};

/** @deprecated fabricated — deleted with page rebuilds */
export function trafficQuality(rows: AnalyticsResult[]): TrafficQualityRow[] {
  return rows.map((row) => ({
    id: row.id,
    channel: row.channel,
    vertical: row.vertical,
    format: row.format,
    bounce: formatPercent(100 - ratio(row.metrics.starts, row.metrics.views)),
    timeOnSite: `${Math.round(row.metrics.timeOnSiteSeconds)}s`,
    dropOff: formatPercent(100 - ratio(row.metrics.completions, row.metrics.starts)),
  })).sort((a, b) => parseFloat(b.dropOff) - parseFloat(a.dropOff));
}
