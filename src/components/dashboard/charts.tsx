import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { Icon } from "@/components/Icon";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { formatNumber, type StatAnnotation } from "@/lib/workspace";

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

/* Annotation markers: tone fills come from the status palette (reserved
   for state, never a series), and the card restates direction in words
   and an icon — colour never carries the reading alone. */
const MARKER_FILL: Record<StatAnnotation["tone"], string> = {
  success: "var(--status-success)",
  danger: "var(--status-danger)",
  neutral: "hsl(var(--muted-foreground))",
};

const MARKER_CHIP: Record<StatAnnotation["tone"], string> = {
  success: "bg-status-success-soft text-status-success",
  danger: "bg-status-danger-soft text-status-danger",
  neutral: "bg-surface-subtle text-text-secondary",
};

type ActiveMarker = { annotation: StatAnnotation; x: number; y: number };

/** The dot itself: an 11px tone-filled circle on a 2px surface ring, riding
 *  a 28px invisible hit circle (targets larger than marks). */
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
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={5.5}
        fill={MARKER_FILL[annotation.tone]}
        stroke="var(--surface-raised)"
        strokeWidth={2}
        className="transition-all"
      />
    </g>
  );
}

/** The insight card a marker opens: date span, the movement with its
 *  number, one explaining sentence, and the drill-down to its cause. */
function AnnotationCard({ annotation }: { annotation: StatAnnotation }) {
  return (
    <>
      <p className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-pill",
            MARKER_CHIP[annotation.tone],
          )}
        >
          <Icon name={annotation.direction === "rise" ? "trending_up" : "trending_down"} size={15} />
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
