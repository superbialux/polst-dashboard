/* ── Analytics — windowed, source-attributed views of the workspace ────
   Rows are derived per request: each campaign/polst's window totals come
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
  type Category,
} from "@/lib/workspace";

export type AnalyticsFilters = {
  range: WindowRange;
  channel: string;
  category: string;
};

export const ANALYTICS_DEFAULTS: AnalyticsFilters = {
  range: "30D",
  channel: "All channels",
  category: "All categories",
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
  category: Category;
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
  category: Category,
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
    category,
    metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, split[k][i]])) as SegmentMetrics,
  }));
}

const rowsCache = new Map<string, SegmentRow[]>();

const rowsForRange = (range: WindowRange, offset = 0): SegmentRow[] => {
  const key = `${range}:${offset}`;
  const hit = rowsCache.get(key);
  if (hit) return hit;
  const [start, end] = windowBounds(range, offset);
  const rows = [
    ...CAMPAIGNS.flatMap((c) => objectRows(c, "campaign", c.name, c.category, start, end)),
    ...SINGLE_POLSTS.flatMap((p) => objectRows(p, "polst", p.question, p.category, start, end)),
  ];
  rowsCache.set(key, rows);
  return rows;
};

/** Filtered segment rows for the window; `offset: 1` yields the previous
 *  window of equal length under the SAME channel/category filter, so
 *  vs-previous deltas stay honest even on a filtered view. */
export function analyticsRows(filters: AnalyticsFilters, offset = 0): SegmentRow[] {
  return rowsForRange(filters.range, offset).filter(
    (row) =>
      (filters.channel === "All channels" || row.channel === filters.channel) &&
      (filters.category === "All categories" || row.category === filters.category),
  );
}

export const segmentTotal = (rows: SegmentRow[], key: keyof SegmentMetrics): number =>
  rows.reduce((sum, row) => sum + row.metrics[key], 0);

/** Share-of-total breakdown by any dimension of rows carrying numeric metrics. */
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

export type CategoryRow = SegmentMetrics & {
  id: string;
  category: Category;
  completionRate: number | null;
  engagementRate: number | null;
};

/** Per-category rollup of the given rows (the Analytics categories table). */
export function categoryRows(rows: SegmentRow[]): CategoryRow[] {
  const groups = new Map<Category, SegmentRow[]>();
  for (const row of rows) groups.set(row.category, [...(groups.get(row.category) ?? []), row]);
  return [...groups.entries()]
    .map(([category, grouped]) => {
      const metrics = Object.fromEntries(
        METRIC_KEYS.map((k) => [k, segmentTotal(grouped, k)]),
      ) as SegmentMetrics;
      return {
        id: category.toLowerCase().replace(/[^a-z]+/g, "-"),
        category,
        ...metrics,
        completionRate: metrics.voters > 0 ? Math.round((metrics.completed / metrics.voters) * 1000) / 10 : null,
        engagementRate: metrics.views > 0 ? Math.round((metrics.votes / metrics.views) * 1000) / 10 : null,
      };
    })
    .sort((a, b) => b.voters - a.voters);
}

/** Filter options, derived from the entities that actually exist. */
export const ANALYTICS_CHANNELS = [...new Set(SOURCES.map((s) => s.channel))];
export const ANALYTICS_CATEGORIES = [
  ...new Set([...CAMPAIGNS.map((c) => c.category), ...SINGLE_POLSTS.map((p) => p.category)]),
];
