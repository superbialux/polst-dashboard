import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { formatNumber, polstImage, type StatAnnotation } from "@/lib/workspace";

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
  /** The series value at annotated buckets — a dots-only Line rides the
   *  same scales as the stroke, so markers sit exactly on the curve. */
  mark: number | null;
};

/* Annotation markers: the KIND sets both the glyph (rocket for a
   launch, flag for an end, an exclamation for an unexplained movement)
   and the dot's fill — launches wear the brand accent, ends the quiet
   secondary ink, insights the warning amber — so the two encodings
   agree and neither carries the reading alone. */
const MARKER_ICONS: Record<StatAnnotation["kind"], string> = {
  launch: "rocket_launch",
  end: "flag",
  insight: "priority_high",
};

const MARKER_FILL: Record<StatAnnotation["kind"], string> = {
  launch: "var(--accent-default)",
  end: "var(--text-secondary)",
  insight: "var(--status-warning)",
};

const MARKER_CHIP: Record<StatAnnotation["kind"], string> = {
  launch: "bg-accent-soft text-accent-default",
  end: "bg-surface-subtle text-text-secondary",
  insight: "bg-status-warning-soft text-status-warning",
};

type ActiveMarker = { annotation: StatAnnotation; x: number; y: number };

/** The dot: a 20px accent disc on a 2px surface ring with the kind's
 *  glyph inside, riding a 32px invisible hit circle (targets larger
 *  than marks). */
function AnnotationDot({
  cx,
  cy,
  annotation,
  onOpen,
}: {
  cx: number;
  cy: number;
  annotation: StatAnnotation;
  onOpen: (m: ActiveMarker) => void;
}) {
  const open = () => onOpen({ annotation, x: cx, y: cy });
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${annotation.headline} — open insight`}
      className="cursor-pointer outline-none [&:focus-visible>circle:last-of-type]:stroke-[3px] [&:hover>circle:last-of-type]:stroke-[3px]"
      onClick={(e) => {
        e.stopPropagation();
        open();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <circle cx={cx} cy={cy} r={16} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill={MARKER_FILL[annotation.kind]}
        stroke="var(--surface-raised)"
        strokeWidth={2}
        className="transition-all"
      />
      <foreignObject x={cx - 7} y={cy - 7} width={14} height={14} className="pointer-events-none">
        <span className="grid h-full w-full place-items-center">
          <Icon
            name={MARKER_ICONS[annotation.kind]}
            size={12}
            weight={300}
            filled
            className="text-text-inverse"
          />
        </span>
      </foreignObject>
    </g>
  );
}

/** The insight card a marker opens: date span, what happened, how the
 *  metric moved through it, and the drill-down to its cause. */
function AnnotationCard({ annotation }: { annotation: StatAnnotation }) {
  return (
    <>
      <p className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-pill",
            MARKER_CHIP[annotation.kind],
          )}
        >
          <Icon name={MARKER_ICONS[annotation.kind]} size={12} weight={300} filled />
        </span>
        <span className="text-xs text-text-tertiary">{annotation.dateLabel}</span>
      </p>
      <p className="mt-2.5 font-display text-sm font-semibold leading-5 text-text-primary">
        {annotation.headline}
      </p>
      <p className="mt-1 text-sm leading-5 text-text-secondary">{annotation.detail}</p>
      {annotation.link ? (
        <Link
          to={annotation.link.to}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-text-accent hover:underline"
        >
          {annotation.link.label}
          <Icon name="arrow_forward" size={16} />
        </Link>
      ) : null}
    </>
  );
}

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
  annotations,
  xTicks,
  labels,
  format = (v) => formatNumber(Math.round(v)),
  className,
}: {
  series: number[];
  previous?: number[];
  /** Clickable insight markers pinned to their spark buckets. */
  annotations?: StatAnnotation[];
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
    const annotated = new Set(annotations?.map((a) => a.bucket));
    return series.map((v, i) => ({
      i,
      cur: v,
      solid: i <= last - 1 ? v : null,
      tail: i >= last - 1 ? v : null,
      prev: previous?.[i] ?? null,
      mark: annotated.has(i) ? v : null,
    }));
  }, [series, previous, annotations]);
  const hasPrevious = Boolean(previous?.length);
  const fillId = `trend${useId().replace(/:/g, "")}`;

  /* The open marker's card, anchored at the dot's own pixel position.
     Switching stat tabs or ranges swaps `annotations`, so any open card
     closes rather than pointing at a spot on someone else's series. */
  const [active, setActive] = useState<ActiveMarker | null>(null);
  useEffect(() => setActive(null), [annotations]);
  const byBucket = useMemo(
    () => new Map(annotations?.map((a) => [a.bucket, a])),
    [annotations],
  );

  return (
    <div className={className}>
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          {/* Top/right headroom fits a 12px-radius marker on a peak at the
              window's edge without clipping. */}
          <ComposedChart data={data} margin={{ top: 14, right: 14, bottom: 6, left: 0 }}>
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
              width={46}
              domain={[0, max]}
              ticks={[0, max / 2, max]}
              tickFormatter={format}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
              tickMargin={6}
            />
            {/* The hover layer yields while an insight card is open — two
                floating readouts over one curve is noise. */}
            <Tooltip
              cursor={active ? false : { stroke: "hsl(var(--border))", strokeWidth: 1 }}
              isAnimationActive={false}
              wrapperStyle={active ? { display: "none" } : undefined}
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
            {byBucket.size ? (
              // Dots-only series: null everywhere except annotated buckets,
              // so each marker lands exactly on the curve at its bucket.
              <Line
                dataKey="mark"
                stroke="none"
                isAnimationActive={false}
                activeDot={false}
                dot={(props: { key?: string; cx?: number; cy?: number; payload?: TrendDatum }) => {
                  const annotation =
                    props.payload && props.cx !== undefined && props.cy !== undefined
                      ? byBucket.get(props.payload.i)
                      : undefined;
                  return annotation ? (
                    <AnnotationDot
                      key={props.key}
                      cx={props.cx!}
                      cy={props.cy!}
                      annotation={annotation}
                      onOpen={setActive}
                    />
                  ) : (
                    <g key={props.key} />
                  );
                }}
              />
            ) : null}
          </ComposedChart>
        </ResponsiveContainer>
        {active ? (
          <Popover open onOpenChange={(open) => (open ? undefined : setActive(null))}>
            <PopoverAnchor asChild>
              <span
                aria-hidden
                className="pointer-events-none absolute h-0 w-0"
                style={{ left: active.x, top: active.y }}
              />
            </PopoverAnchor>
            <PopoverContent side="top" sideOffset={12} className="w-72">
              <AnnotationCard annotation={active.annotation} />
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
      {/* Sparse anchors, not a tick per bucket — the range, not a ruler. */}
      <div className="ml-[46px] mt-2 flex justify-between text-xs text-text-tertiary">
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

/* ── Funnel chart ────────────────────────────────────────────────────
   The closed funnel (the GA register): one column per step — the step's
   name, count, and share of starters in the header — vertical bars on a
   shared baseline with the flow silhouette behind them. Steps that are
   polsts carry their image pair, because that IS the polst. The
   percentages do the talking; no caption explains the obvious. */

export type FunnelChartStep = { label: string; count: number; thumbId?: string };

export function FunnelChart({
  steps,
  className,
}: {
  steps: FunnelChartStep[];
  className?: string;
}) {
  const max = steps[0]?.count || 1;
  const n = steps.length;
  if (!n) return null;
  const pcts = steps.map((s) => (max > 0 ? s.count / max : 0));
  /* The flow silhouette passes through each bar's top at its column
     center, then closes along the baseline. */
  const points = [
    `0,${100 - pcts[0] * 100}`,
    ...pcts.map((p, i) => `${((i + 0.5) / n) * 100},${100 - p * 100}`),
    `100,${100 - pcts[n - 1] * 100}`,
    "100,100",
    "0,100",
  ].join(" ");

  return (
    <div className={className}>
      <div
        className="grid gap-x-3"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {steps.map((s, i) => (
          <div
            key={`${s.label}-${i}`}
            className="min-w-0 border-l border-border-default pl-3 first:border-l-0 first:pl-0"
          >
            {s.thumbId ? (
              <span className="mb-1.5 grid h-9 w-14 grid-cols-2 overflow-hidden rounded-md bg-surface-strong">
                <img
                  src={polstImage(s.thumbId, "a", 120, 160)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <img
                  src={polstImage(s.thumbId, "b", 120, 160)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              // Started/Completed keep the header baseline without art.
              <span className="mb-1.5 block h-9" aria-hidden />
            )}
            <p className="truncate text-xs font-medium text-text-secondary" title={s.label}>
              {s.label}
            </p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-display text-lg font-semibold leading-6 tabular-nums text-text-primary">
                {formatNumber(s.count)}
              </span>
              <span className="text-xs tabular-nums text-text-tertiary">
                {Math.round(pcts[i] * 100)}%
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="relative mt-3 h-36">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polygon points={points} fill="var(--color-purple-tint)" />
        </svg>
        <div
          className="absolute inset-0 grid gap-x-3"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {steps.map((s, i) => (
            <div key={`${s.label}-bar-${i}`} className="flex items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-14 rounded-t",
                  i === n - 1 ? "bg-status-success" : "bg-accent-default",
                )}
                style={{ height: `${Math.max(2, pcts[i] * 100)}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border-default" />
    </div>
  );
}

/* ── Donut chart ─────────────────────────────────────────────────────
   A share-of-total ring on the validated chart palette, the headline
   total in the hole, and a legend that carries the exact numbers. More
   than five slices fold into "Other" — a ring stops reading past that. */

export type DonutSlice = { label: string; value: number };

const DONUT_FILLS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DonutChart({
  slices,
  centerValue,
  centerLabel,
  noun = "voters",
  className,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  /** What the legend counts, for screen-reader labels. */
  noun?: string;
  className?: string;
}) {
  const ranked = [...slices].filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const top = ranked.slice(0, 4);
  const rest = ranked.slice(4);
  const data = rest.length
    ? [...top, { label: "Other", value: rest.reduce((sum, s) => sum + s.value, 0) }]
    : top;
  const total = data.reduce((sum, s) => sum + s.value, 0);

  return (
    // Ring on top, legend underneath — names stay fully readable at any
    // card width instead of squeezing beside the chart.
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={54}
              outerRadius={78}
              paddingAngle={2}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((s, i) => (
                <Cell key={s.label} fill={DONUT_FILLS[i % DONUT_FILLS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-xl font-semibold leading-7 tabular-nums text-text-primary">
              {centerValue}
            </p>
            <p className="text-xs text-text-secondary">{centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2" aria-label={`Share of ${noun}`}>
        {data.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: DONUT_FILLS[i % DONUT_FILLS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-text-primary">{s.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-text-primary">
              {formatNumber(s.value)}
            </span>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-text-tertiary">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
