/* ── Engine — deterministic mock-data math ─────────────────────────────
   Distributes an object's observed totals across the days of its run and
   aggregates any window from those days, so every screen — Home stats,
   Analytics, campaign tables, trend charts — reads from the same series
   and reconciles by construction. No randomness: same inputs, same data. */

import { TODAY, daysBetween } from "@/lib/canon";

/* ── Deterministic seeding ────────────────────────────────────────── */

/** Small stable string hash (same across sessions and builds). */
export const seedHash = (key: string) => {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Seeded unit float in [0, 1) — index-stable, not sequential. */
export const seededUnit = (seed: number, index: number) => {
  const x = Math.imul(seed ^ Math.imul(index + 1, 2654435761), 1597334677);
  return ((x >>> 8) & 0xffffff) / 0x1000000;
};

/* ── Dates ────────────────────────────────────────────────────────── */

export const addDays = (iso: string, days: number) => {
  const d = new Date(Date.parse(iso) + days * 86_400_000);
  return d.toISOString().slice(0, 10);
};

/** Inclusive ISO date list from start to end. */
export const dateSpan = (start: string, end: string) => {
  const n = Math.max(0, daysBetween(start, end)) + 1;
  return Array.from({ length: n }, (_, i) => addDays(start, i));
};

const weekdayOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();

/* ── Daily distribution ───────────────────────────────────────────────
   Shape: a launch ramp over the first days, a weekday rhythm (audiences
   answer midweek, quieter weekends), and seeded jitter — normalized so
   the series sums EXACTLY to the observed total (largest remainder). */

const WEEKDAY_WEIGHT = [0.74, 0.98, 1.1, 1.16, 1.12, 1.02, 0.88]; // Sun..Sat

/** Split `total` into integer parts proportional to `weights`, summing exactly. */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || sum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < order.length && remainder > 0; i++, remainder--) {
    floors[order[i].index] += 1;
  }
  return floors;
}

export type DailySeries = { dates: string[]; values: number[] };

/** The object's total distributed over its run (clamped at TODAY). */
export function dailySeries(id: string, total: number, start: string, end: string): DailySeries {
  const lastDay = daysBetween(end, TODAY) > 0 ? end : TODAY;
  const stop = daysBetween(start, lastDay) < 0 ? start : lastDay;
  const dates = dateSpan(start, stop);
  const seed = seedHash(id);
  const weights = dates.map((iso, i) => {
    const ramp = Math.min(1, 0.55 + i * 0.15); // launch ramp over ~3 days
    const jitter = 0.82 + seededUnit(seed, i) * 0.36;
    return WEEKDAY_WEIGHT[weekdayOf(iso)] * ramp * jitter;
  });
  return { dates, values: allocate(total, weights) };
}

/* ── Windows ──────────────────────────────────────────────────────── */

export type WindowRange = "7D" | "30D" | "90D" | "All";
export const WINDOW_RANGES: WindowRange[] = ["7D", "30D", "90D", "All"];

export const WINDOW_DAYS: Record<Exclude<WindowRange, "All">, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};

/** [start, end] inclusive ISO bounds for a range ending at TODAY.
 *  `offset: 1` gives the previous window of equal length. */
export function windowBounds(range: WindowRange, offset = 0): [string, string] {
  if (range === "All") return ["2026-01-01", TODAY];
  const days = WINDOW_DAYS[range];
  const end = addDays(TODAY, -offset * days);
  return [addDays(end, -(days - 1)), end];
}

/** Sum of the series inside [start, end] inclusive. */
export function sumWindow(series: DailySeries, start: string, end: string): number {
  let sum = 0;
  for (let i = 0; i < series.dates.length; i++) {
    if (series.dates[i] >= start && series.dates[i] <= end) sum += series.values[i];
  }
  return sum;
}

/** Per-day totals for [start, end] across many series (chart-ready). */
export function windowSeries(all: DailySeries[], start: string, end: string): DailySeries {
  const dates = dateSpan(start, end);
  const values = dates.map((iso) =>
    all.reduce((sum, s) => {
      const i = s.dates.indexOf(iso);
      return sum + (i === -1 ? 0 : s.values[i]);
    }, 0),
  );
  return { dates, values };
}

/** Period-over-period delta as a signed percent, or null when the previous
 *  window has too little volume for an honest comparison. */
export function windowDelta(current: number, previous: number): number | null {
  if (previous < 20) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/* ── Chain drop-off ───────────────────────────────────────────────────
   Voters decline from `started` to `completed` across n questions on a
   geometric curve — every intermediate question count is derived, so
   funnels are monotonic by construction. */

export function chainVotes(started: number, completed: number, questions: number): number[] {
  if (questions <= 0) return [];
  if (started <= 0) return Array.from({ length: questions }, () => 0);
  if (questions === 1) return [started];
  const rate = Math.pow(completed / Math.max(1, started), 1 / (questions - 1));
  return Array.from({ length: questions }, (_, i) =>
    i === questions - 1 ? completed : Math.round(started * Math.pow(rate, i)),
  );
}

/* ── Answer-time surface (heatmap + hourly velocity) ──────────────────
   One daypart curve — lunchtime and evening peaks, quiet nights — drives
   both the day × 2-hour heatmap and the trailing votes/hr readout. */

/** Relative vote density for an hour of the day (0–23). */
const daypartWeight = (hour: number) =>
  hour < 6 ? 0.15 : hour < 10 ? 0.7 : hour < 14 ? 1.05 : hour < 18 ? 0.9 : hour < 22 ? 1.25 : 0.4;

/** Day × 2-hour vote density, scaled to the window's REAL vote total. */
export function timeHeat(votesInWindow: number): number[][] {
  const buckets = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 12 }, (_, slot) =>
      WEEKDAY_WEIGHT[day] * daypartWeight(slot * 2) * (0.9 + seededUnit(97, day * 12 + slot) * 0.2),
    ),
  );
  const flat = buckets.flat();
  const alloc = allocate(votesInWindow, flat);
  return buckets.map((row, day) => row.map((_, slot) => alloc[day * 12 + slot]));
}

/** The demo clock: "now" is TODAY at 14:00. Hourly reads anchor here so
 *  they stay coherent with the fixed TODAY the daily series use. */
export const NOW_HOUR = 14;

/** The 24 completed hours ending at TODAY {NOW_HOUR}:00, oldest first.
 *  Each day's REAL total from the daily series spreads across its 24
 *  hours on the daypart curve (seeded jitter), so the trailing window —
 *  yesterday {NOW_HOUR}:00 → today {NOW_HOUR}:00 — reconciles with the
 *  same series every other screen reads. Deterministic. */
export function hourlyVotes(id: string, todayTotal: number, yesterdayTotal: number): number[] {
  const seed = seedHash(`${id}:hourly`);
  const dayHours = (dayIndex: number, total: number) =>
    allocate(
      total,
      Array.from({ length: 24 }, (_, h) =>
        daypartWeight(h) * (0.85 + seededUnit(seed, dayIndex * 24 + h) * 0.3),
      ),
    );
  const yesterday = dayHours(0, yesterdayTotal);
  const today = dayHours(1, todayTotal);
  return [...yesterday.slice(NOW_HOUR), ...today.slice(0, NOW_HOUR)];
}
