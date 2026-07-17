import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/workspace";

/* ══════════════════════════════════════════════════════════════════
   CHARTS — the Recharts layer.
   Series ink comes only from the chart-* tokens (validated palette:
   lightness band, chroma floor, adjacent-pair CVD, 3:1 contrast).
   Chrome stays recessive: dashed horizontal hairlines only, no axis
   strokes, 2–3 y ticks, sparse x anchors. Time-series live here;
   meters and ranked lists (ProgressBar, MixBars, Funnel, ProgressRing,
   TimeHeatmap) stay HTML in kit.tsx — their job is reading a list,
   not tracing a curve.
   ══════════════════════════════════════════════════════════════════ */

const SERIES = "hsl(var(--chart-1))";
const GRID = "hsl(var(--chart-grid))";
const PREVIOUS = "hsl(var(--muted-foreground))";

type TrendDatum = {
  i: number;
  cur: number;
  /** Current period split for the stroke: history draws solid, the final
   *  (still-collecting) bucket draws dashed — the Vercel "in progress"
   *  cue. The area fill still spans the whole series. */
  solid: number | null;
  tail: number | null;
  prev: number | null;
};

function TrendTooltip({
  active,
  payload,
  format,
  labels,
  hasPrevious,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendDatum }>;
  format: (v: number) => string;
  labels?: string[];
  hasPrevious: boolean;
}) {
  const d = active && payload?.length ? payload[0].payload : null;
  if (!d) return null;
  return (
    <div className="whitespace-nowrap rounded-md border border-border-default bg-surface-raised px-2 py-1 shadow-md">
      {labels?.[d.i] ? (
        <p className="text-xs text-text-tertiary">{labels[d.i]}</p>
      ) : null}
      <p>
        <span className="font-display text-xs font-semibold tabular-nums text-text-primary">
          {format(d.cur)}
        </span>
        {hasPrevious && d.prev !== null ? (
          <span className="ml-1.5 text-xs tabular-nums text-text-tertiary">
            prev {format(d.prev)}
          </span>
        ) : null}
      </p>
    </div>
  );
}

/** The house time-series: violet line over a fading area, dashed neutral
 *  line for the previous period, dashed final segment for the bucket
 *  still collecting today. Crosshair + bordered tooltip on hover. */
export function TrendChart({
  series,
  previous,
  xTicks,
  labels,
  format = (v) => formatNumber(Math.round(v)),
  className,
}: {
  series: number[];
  previous?: number[];
  xTicks: string[];
  /** Optional per-point hover labels (dates); xTicks stay the sparse
   *  range anchors under the plot. */
  labels?: string[];
  /** Value formatter for the y-axis and hover chip (e.g. thousands, %). */
  format?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(...series, ...(previous ?? []), 1);
  const data = useMemo<TrendDatum[]>(() => {
    const last = series.length - 1;
    return series.map((v, i) => ({
      i,
      cur: v,
      solid: i <= last - 1 ? v : null,
      tail: i >= last - 1 ? v : null,
      prev: previous?.[i] ?? null,
    }));
  }, [series, previous]);
  const hasPrevious = Boolean(previous?.length);
  const fillId = `trend${useId().replace(/:/g, "")}`;

  return (
    <div className={className}>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 6, left: 0 }}>
            <defs>
              {/* One-hue gradient, 14% at the line → 0 at the baseline. */}
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES} stopOpacity={0.14} />
                <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal
              vertical={false}
              stroke={GRID}
              strokeDasharray="3 4"
            />
            <YAxis
              width={40}
              domain={[0, max]}
              ticks={[0, max / 2, max]}
              tickFormatter={format}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
              tickMargin={6}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              isAnimationActive={false}
              content={
                <TrendTooltip format={format} labels={labels} hasPrevious={hasPrevious} />
              }
            />
            {hasPrevious ? (
              <Line
                dataKey="prev"
                type="monotone"
                stroke={PREVIOUS}
                strokeOpacity={0.5}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ) : null}
            <Area
              dataKey="cur"
              type="monotone"
              stroke="none"
              fill={`url(#${fillId})`}
              activeDot={{
                r: 5,
                fill: SERIES,
                stroke: "var(--surface-raised)",
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
            <Line
              dataKey="solid"
              type="monotone"
              stroke={SERIES}
              strokeWidth={1.75}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="tail"
              type="monotone"
              stroke={SERIES}
              strokeWidth={1.75}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Sparse anchors, not a tick per bucket — the range, not a ruler. */}
      <div className="ml-10 mt-2 flex justify-between text-xs text-text-tertiary">
        {xTicks.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/** Inline mini trend for stat tiles: the same violet area, no chrome at
 *  all. Decorative next to a stated value — the tile's number and delta
 *  carry the reading. */
export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const data = useMemo(() => values.map((v, i) => ({ i, v })), [values]);
  const fillId = `spark${useId().replace(/:/g, "")}`;
  return (
    <div className={cn("h-6 w-16", className)} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 1, left: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES} stopOpacity={0.14} />
              <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            dataKey="v"
            type="monotone"
            stroke={SERIES}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
