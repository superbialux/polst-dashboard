import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { PollOptionsBlock } from "@/components/PollCard";
import { voteShares, type PollOption } from "@/lib/poll";
import { SelectMenu, TextInput } from "@/components/Field";
import { HeaderActions } from "./Shell";
import type { AnalyticsFilters, AnalyticsRange } from "@/lib/analytics";
import {
  formatNumber,
  polstOptions,
  type Campaign,
  type Cohort,
  type DecisionSignal,
  type Integration,
  type SinglePolst,
  type Split,
  type Status,
} from "@/lib/workspace";

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD KIT
   The fixed set of primitives every dashboard page composes from.
   See DESIGN.md § "Dashboard (Brand Workspace)". No magic values —
   spacing rides the 4pt scale, panels ride the 12-col SectionGrid.
   ══════════════════════════════════════════════════════════════════ */

/* ── Page scaffold ───────────────────────────────────────────────── */

type PageProps = {
  actions?: ReactNode;
  children: ReactNode;
};

/** The standard page: a centered, vertically-rhythmic column. Pages carry
 *  no title or description — the header breadcrumbs name where you are;
 *  content does the explaining. `actions` teleport into the header's
 *  right side (the page-contextual slot). Every page shares the one
 *  `max-w-dashboard` container — no per-page widths. */
export function DashboardPage({ actions, children }: PageProps) {
  return (
    <div className="mx-auto max-w-dashboard space-y-6">
      {actions ? <HeaderActions>{actions}</HeaderActions> : null}
      {children}
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────── */

type CardProps = {
  title?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Turn off body padding for full-bleed content like tables. */
  padded?: boolean;
};

/** The universal container: raised surface, hairline border, whisper
 *  shadow. Optional header row carries a title / description / action. */
export function DashboardCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}: CardProps) {
  const hasHeader = Boolean(title || description || action);
  return (
    <section
      className={cn(
        "overflow-hidden rounded-card border border-border-default bg-surface-raised shadow-sm",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex items-start justify-between gap-4 px-5 pb-0 pt-5">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-display text-base font-semibold leading-6 text-text-primary">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-5 text-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn(padded && (hasHeader ? "px-5 pb-5 pt-4" : "p-5"), bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/** 12-column layout row at the shared 16px gutter. Children set
 *  `lg:col-span-{n}`; everything stacks below `lg`. */
export function SectionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-12", className)}>{children}</div>
  );
}

/* ── Status tone ─────────────────────────────────────────────────── */

type Tone = "success" | "accent" | "danger" | "neutral";

const STATUS_TONE: Record<string, Tone> = {
  Active: "success",
  Covered: "success",
  Ready: "success",
  Completed: "success",
  Assigned: "success",
  Scheduled: "accent",
  "Needs attention": "danger",
  Draft: "neutral",
  Archived: "neutral",
  Unassigned: "neutral",
  Inconclusive: "neutral",
};

const TONE_CHIP: Record<Tone, string> = {
  success: "bg-status-success-soft text-status-success",
  accent: "bg-accent-soft text-accent-default",
  danger: "bg-status-danger-soft text-status-danger",
  neutral: "bg-surface-subtle text-text-secondary",
};

/** One place owns object-state → tone. Pass a status string, get the
 *  right soft pill (with a leading dot) for free. */
export function StatusBadge({ status }: { status: Status | string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 self-start whitespace-nowrap rounded-md px-2 font-display text-xs font-semibold",
        TONE_CHIP[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-pill bg-current" aria-hidden />
      {status}
    </span>
  );
}

/* ── Decision signal ─────────────────────────────────────────────── */

/** The decision-signal vocabulary — how sure the evidence is, which is a
 *  different question from where the object sits in its lifecycle. Signals
 *  render as icon + ink (no pill fill) so the two families never blur.
 *  The union itself lives in workspace.ts with the campaign data. */
export type { DecisionSignal } from "@/lib/workspace";

const SIGNAL_META: Record<DecisionSignal, { icon: string; className: string }> = {
  Decisive: { icon: "verified", className: "text-status-success" },
  Leading: { icon: "trending_up", className: "text-status-success" },
  Directional: { icon: "trending_up", className: "text-text-secondary" },
  "Too close": { icon: "balance", className: "text-status-warning" },
  Inconclusive: { icon: "help", className: "text-text-secondary" },
  Collecting: { icon: "hourglass_top", className: "text-text-secondary" },
  "Not started": { icon: "schedule", className: "text-text-tertiary" },
};

/** Evidence state, not lifecycle state: `StatusBadge` says where a campaign
 *  is; `SignalBadge` says whether its result can be trusted yet. */
export function SignalBadge({
  signal,
  detail,
  className,
}: {
  signal: DecisionSignal;
  /** Optional evidence qualifier, e.g. "+18 pts" or "n too small". */
  detail?: string;
  className?: string;
}) {
  const meta = SIGNAL_META[signal];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold",
        meta.className,
        className,
      )}
    >
      <Icon name={meta.icon} size={16} />
      {signal}
      {detail ? <span className="font-medium text-text-secondary">· {detail}</span> : null}
    </span>
  );
}

/* ── Info hint ───────────────────────────────────────────────────── */

/** A metric definition on hover/focus — the inspectable data contract
 *  behind every number. Keeps definitions out of the layout until asked. */
export function InfoHint({ text, label = "Definition" }: { text: string; label?: string }) {
  return (
    <span className="group/hint relative inline-flex">
      <span
        tabIndex={0}
        role="note"
        aria-label={`${label}: ${text}`}
        className="grid cursor-help place-items-center text-icon-tertiary transition-colors hover:text-icon-secondary"
      >
        <Icon name="info" size={14} />
      </span>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-56 -translate-x-1/2 rounded-md border border-border-default bg-surface-raised p-2.5 text-left text-xs font-normal leading-4 text-text-secondary shadow-lg group-hover/hint:block group-focus-within/hint:block">
        {text}
      </span>
    </span>
  );
}

/* ── Decision brief ──────────────────────────────────────────────── */

/** The Decision Narrative, as one reusable object: signal → headline →
 *  what changed and why → caveat → evidence → the next action. Anywhere a
 *  result is summarized (campaign overview, Home briefing, analytics),
 *  this pattern speaks — charts sit under it as supporting evidence. */
export function DecisionBrief({
  signal,
  signalDetail,
  headline,
  summary,
  caveat,
  evidence,
  primary,
  secondary,
  className,
}: {
  signal: DecisionSignal;
  signalDetail?: string;
  headline: string;
  /** What changed and the likely cause, in plain words. */
  summary: string;
  /** What could invalidate the read. */
  caveat?: string;
  /** The numbers behind the call: responses vs target, sources, lead. */
  evidence?: Array<{ label: string; value: string; info?: string }>;
  primary?: Cta;
  secondary?: Cta;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-border-default bg-surface-raised p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <SignalBadge signal={signal} detail={signalDetail} />
      </div>
      <h2 className="mt-2 font-display text-xl font-semibold leading-7 text-text-primary">
        {headline}
      </h2>
      <p className="mt-1.5 max-w-3xl text-sm leading-6 text-text-secondary">{summary}</p>
      {caveat ? (
        <p className="mt-2 flex max-w-3xl items-start gap-1.5 text-sm leading-5 text-status-warning">
          <Icon name="error" size={18} className="shrink-0" />
          <span>{caveat}</span>
        </p>
      ) : null}
      {evidence?.length ? (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-border-default pt-3">
          {evidence.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="flex items-center gap-1 text-xs font-medium text-text-secondary">
                {item.label}
                {item.info ? <InfoHint text={item.info} /> : null}
              </dt>
              <dd className="mt-0.5 font-display text-sm font-semibold tabular-nums text-text-primary">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {primary || secondary ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {/* The page's dominant action rides the toolbar weight (32px),
              never the compact row weight. */}
          {primary ? <CtaButton cta={primary} size="md" /> : null}
          {secondary ? <CtaButton cta={secondary} variant="secondary" size="md" /> : null}
        </div>
      ) : null}
    </section>
  );
}

/* ── Filters ─────────────────────────────────────────────────────── */

/** Segmented tab group on a subtle track — the in-page status filter. */
/** The one segmented select across the app — status filters and page tabs.
 *  32px tall (matches buttons), **white** (raised + bordered) so it reads
 *  against the page background, with a light active pill. Scrolls if it can't
 *  fit. `FilterTabs` / `PageTabs` are thin aliases so every select is identical. */
export function SegmentedControl<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-[37px] max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-border-default bg-surface-raised p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          aria-pressed={active === tab}
          className={cn(
            "h-[29px] shrink-0 whitespace-nowrap rounded-sm px-3 font-display text-ui font-semibold transition-colors",
            active === tab
              ? "bg-surface-subtle text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return <SegmentedControl tabs={tabs} active={active} onChange={onChange} />;
}

/** The list-page toolbar: status filters on the left, search on the right. */
export function SearchAndFilters({
  tabs,
  active,
  onChange,
  placeholder,
  query,
  onQueryChange,
  action,
  className,
}: {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
  placeholder: string;
  query: string;
  onQueryChange: (next: string) => void;
  /** Extra control on the trailing edge (e.g. a view toggle). */
  action?: ReactNode;
  className?: string;
}) {
  const searchId = useId();
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border-default p-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <FilterTabs tabs={tabs} active={active} onChange={onChange} />
      <div className="flex items-center gap-2">
        <div className="w-full lg:w-72">
          <label htmlFor={searchId} className="sr-only">{placeholder}</label>
          <TextInput
            id={searchId}
            type="search"
            icon="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-[37px] text-ui"
            placeholder={placeholder}
          />
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

/** Apply an in-page status chip to a row list. "Drafts" (plural chip)
 *  matches the "Draft" state; "All" passes everything through. */
export function filterByStatus<T extends { status: string }>(
  rows: T[],
  active: string,
): T[] {
  if (active === "All") return rows;
  const normalized = active === "Drafts" ? "Draft" : active;
  return rows.filter((row) => row.status === normalized);
}

/* ── Data table ──────────────────────────────────────────────────── */

export type DataColumn<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Right-align a column (numbers, row actions). */
  align?: "right";
};

/** The one list primitive. Typed columns, hover rows, honest empty label. */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  emptyLabel = "Nothing to show yet",
}: {
  rows: T[];
  columns: Array<DataColumn<T>>;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-border-default text-xs font-medium text-text-secondary">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn(
                  "whitespace-nowrap px-3 py-3 font-semibold first:pl-4 last:pr-4",
                  column.align === "right" && "text-right",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {rows.length ? (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors",
                  "transition-colors hover:bg-surface-subtle",
                  onRowClick && "cursor-pointer",
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={cn(
                      "px-3 py-3 align-middle text-text-primary first:pl-4 last:pr-4",
                      column.align === "right" && "text-right",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="px-4 py-12 text-center text-sm text-text-secondary"
                colSpan={columns.length}
              >
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Detail list ─────────────────────────────────────────────────── */

/** Label → value pairs for summaries, campaign health, and settings. */
export function DetailList({
  items,
}: {
  items: Array<[string, ReactNode]>;
}) {
  return (
    <dl className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
      {items.map(([label, value]) => (
        <div key={label} className="grid grid-cols-2 items-center gap-3 px-3 py-2.5">
          <dt className="text-sm text-text-secondary">{label}</dt>
          <dd className="flex justify-end text-right text-sm font-semibold tabular-nums text-text-primary">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Progress ────────────────────────────────────────────────────── */

/** A completion / vote-split track on the pill radius. */
export function ProgressBar({
  value,
  label,
  caption,
  className,
}: {
  value: number;
  label?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-text-primary">{label}</span>
          <span className="text-sm font-semibold tabular-nums text-text-secondary">
            {caption ?? `${value}%`}
          </span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-pill bg-surface-strong">
        <div
          className="h-full rounded-pill bg-accent-default"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

/* ── Sparkline ───────────────────────────────────────────────────── */

/** Inline SVG trend line for the stat strip and analytics tiles. The
 *  stroke tones by direction: up = success, down = danger, flat = quiet. */
export function Sparkline({
  values,
  trend = "flat",
  className,
}: {
  values: number[];
  trend?: "up" | "down" | "flat";
  className?: string;
}) {
  const w = 72;
  const h = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map(
    (v, i) => [(i / (values.length - 1)) * w, h - ((v - min) / range) * (h - 2) - 1] as [number, number],
  );
  const stroke =
    trend === "up"
      ? "text-status-success"
      : trend === "down"
        ? "text-status-danger"
        : "text-text-tertiary";
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-6 w-16", stroke, className)}
      aria-hidden
    >
      <path
        d={smoothPath(pts)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** A simple column chart for the analytics trend tiles: accent bars over a
 *  light instrumented scale — gridlines, y ticks at 0 / half / max, optional
 *  x-axis ticks, and a hover state that surfaces each bar's exact value. */
export function BarChart({
  values,
  xTicks,
  className,
}: {
  values: number[];
  /** Evenly-spread axis labels under the bars (first → last). */
  xTicks?: string[];
  className?: string;
}) {
  const max = Math.max(...values) || 1;
  return (
    <div className={className}>
      <div className="flex gap-3">
        <div className="flex h-40 shrink-0 flex-col justify-between text-right text-xs tabular-nums text-text-secondary">
          <span>{formatNumber(max)}</span>
          <span>{formatNumber(Math.round(max / 2))}</span>
          <span>0</span>
        </div>
        <div className="relative h-40 min-w-0 flex-1">
          {/* Gridlines at max / half / baseline */}
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-dashed border-border-default" />
            <div className="border-t border-dashed border-border-default" />
            <div className="border-t border-border-default" />
          </div>
          <div className="absolute inset-0 flex items-end gap-1.5 pb-px">
            {values.map((value, index) => (
              <div
                key={index}
                tabIndex={0}
                role="img"
                aria-label={formatNumber(value)}
                title={formatNumber(value)}
                className="flex-1 rounded-t-sm bg-accent-default transition-[filter] duration-150 hover:brightness-90 focus-visible:brightness-90"
                style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      {xTicks?.length ? (
        <div className="mt-2 flex justify-between text-xs text-text-secondary">
          {xTicks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Stats strip ─────────────────────────────────────────────────── */

type Stat = {
  label: string;
  value: string;
  delta: string;
  trend?: "up" | "down" | "flat";
  spark?: number[];
  /** The metric's definition — formula and denominator, in plain words. */
  info?: string;
  insights?: Array<{
    text: string;
    to: string;
    tone: "success" | "warning" | "danger" | "accent";
  }>;
};

const INSIGHT_TONES = {
  success: { border: "border-status-success", dot: "bg-status-success" },
  warning: { border: "border-status-warning", dot: "bg-status-warning" },
  danger: { border: "border-status-danger", dot: "bg-status-danger" },
  accent: { border: "border-accent-default", dot: "bg-accent-default" },
} as const;

const trendClass = (trend?: Stat["trend"]) =>
  trend === "up"
    ? "text-status-success"
    : trend === "down"
      ? "text-status-danger"
      : "text-text-secondary";

/** Expand a 7-point spark into a ~30-point daily series so the opened stat can
 *  show a full chart. Deterministic (a small wobble keeps it from reading flat). */
function expandSeries(spark: number[], n = 30): number[] {
  if (!spark.length) return [];
  return Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * (spark.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(spark.length - 1, lo + 1);
    const base = spark[lo] + (spark[hi] - spark[lo]) * (t - lo);
    const wob = Math.sin(i * 1.3) * 0.1 + Math.sin(i * 0.5) * 0.06;
    return Math.max(0, base * (1 + wob));
  });
}

/** Catmull-Rom → cubic-bezier smoothing so the line reads as a soft curve. */
function smoothPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  const t = 0.18;
  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** The house line chart: a smooth accent line with a soft area fill over a
 *  faded, dashed line for the previous period — plus a light y-axis, the
 *  range's date ticks, and a hover crosshair that pins the exact value.
 *  Used by the Home stat strip and every trend card in Analytics. */
export function TrendChart({
  series,
  previous,
  xTicks,
  format = (v) => formatNumber(Math.round(v)),
  className,
}: {
  series: number[];
  previous?: number[];
  xTicks: string[];
  /** Value formatter for the y-axis and hover chip (e.g. thousands, %). */
  format?: (v: number) => string;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, "trend");
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...series, ...(previous ?? []), 1);
  const toPts = (arr: number[]) =>
    arr.map((v, i) => [(i / (arr.length - 1)) * 300, 100 - (v / max) * 100] as [number, number]);
  const line = smoothPath(toPts(series));
  const prev = previous?.length ? smoothPath(toPts(previous)) : null;
  const area = `${line} L 300,100 L 0,100 Z`;
  const hoverX = hover === null ? 0 : (hover / (series.length - 1)) * 100;
  const hoverY = hover === null ? 0 : 100 - (series[hover] / max) * 100;
  return (
    <div className={cn("text-accent-default", className)}>
      <div className="flex gap-3">
        <div className="flex h-48 w-8 shrink-0 flex-col justify-between py-0.5 text-right text-xs tabular-nums text-text-tertiary">
          {[max, max / 2, 0].map((v, i) => (
            <span key={i}>{format(v)}</span>
          ))}
        </div>
        <div
          className="relative h-48 min-w-0 flex-1"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            setHover(Math.round(t * (series.length - 1)));
          }}
          onMouseLeave={() => setHover(null)}
        >
          <svg
            viewBox="0 0 300 100"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 50, 100].map((y) => (
              <line
                key={y}
                x1={0}
                x2={300}
                y1={y}
                y2={y}
                className="stroke-border-default"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={area} fill={`url(#${gradientId})`} stroke="none" />
            {prev ? (
              <path
                d={prev}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.4}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {hover !== null ? (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-border-strong"
                style={{ left: `${hoverX}%` }}
              />
              <div
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-surface-raised bg-accent-default shadow-sm"
                style={{ left: `${hoverX}%`, top: `${hoverY}%` }}
              />
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-default bg-surface-raised px-2 py-1 shadow-md"
                style={{
                  left: `min(max(${hoverX}%, 44px), calc(100% - 44px))`,
                  top: `calc(${hoverY}% - 38px)`,
                }}
              >
                <span className="font-display text-xs font-semibold tabular-nums text-text-primary">
                  {format(series[hover])}
                </span>
                {previous?.length ? (
                  <span className="ml-1.5 text-xs tabular-nums text-text-tertiary">
                    prev {format(previous[hover] ?? 0)}
                  </span>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="ml-11 mt-2 flex justify-between text-xs text-text-tertiary">
        {xTicks.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/** The mini-stats bar (Shopify-style): a padded parent holding borderless,
 *  rounded, hoverable stat cards. Click one to expand its full chart below
 *  (with a smooth reveal); the chevron toggles the panel. Purple sparklines
 *  echo the expanded chart; the trend arrow keeps its up/down colour. */
export function StatsStrip({
  stats,
  xTicks,
  scope,
}: {
  stats: Stat[];
  xTicks: string[];
  /** Optional scope copy for surfaces that do not already establish it. */
  scope?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const active = stats[sel] ?? stats[0];
  const series = expandSeries(active.spark ?? []);
  const previous = expandSeries((active.spark ?? []).map((v) => v * 0.82));

  return (
    <section className="rounded-card border border-border-default bg-surface-raised p-1.5 shadow-sm">
      {scope ? (
        <p className="px-2 pb-1 pt-1.5 text-xs text-text-tertiary">{scope}</p>
      ) : null}
      <div className="flex items-stretch gap-1">
        <div className="grid flex-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const selected = open && i === sel;
            return (
              <button
                key={stat.label}
                onClick={() => {
                  setSel(i);
                  setOpen(true);
                }}
                aria-pressed={selected}
                title={stat.info}
                className={cn(
                  "rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-subtle",
                  selected && "bg-surface-subtle",
                )}
              >
                <p className="truncate text-xs font-semibold text-text-secondary">{stat.label}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-baseline gap-1">
                    <span className="font-display text-2xl font-semibold leading-8 tracking-tight tabular-nums text-text-primary">
                      {stat.value}
                    </span>
                    {stat.trend && stat.trend !== "flat" ? (
                      <span className={cn("flex items-center text-xs font-semibold", trendClass(stat.trend))}>
                        <Icon
                          name={stat.trend === "up" ? "arrow_drop_up" : "arrow_drop_down"}
                          size={20}
                          filled
                          className="-mr-0.5"
                        />
                        {stat.delta}
                      </span>
                    ) : null}
                  </div>
                  {!open && stat.spark ? (
                    <Sparkline values={stat.spark} className="w-16 shrink-0 text-accent-default" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse chart" : "Expand chart"}
          className="grid w-9 shrink-0 place-items-center rounded-md text-icon-secondary transition-colors hover:bg-surface-subtle"
        >
          <Icon name={open ? "expand_less" : "expand_more"} size={20} />
        </button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "grid gap-4 px-2 pb-2 pt-4",
              active.insights?.length && "lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]",
            )}
          >
            <TrendChart series={series} previous={previous} xTicks={xTicks} />
            {active.insights?.length ? (
              <div>
                <ul className="space-y-2">
                  {active.insights.map((insight) => (
                    <li key={insight.text}>
                      <Link
                        to={insight.to}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-sm border bg-surface-raised py-2 pl-3 pr-2.5 text-sm leading-5 text-text-primary transition-colors hover:bg-surface-subtle",
                          INSIGHT_TONES[insight.tone].border,
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn("h-2 w-2 shrink-0 rounded-pill", INSIGHT_TONES[insight.tone].dot)}
                        />
                        <span className="truncate">{insight.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Guidance cards (Home / Insights) ────────────────────────────── */

type Cta = { label: string; onClick?: () => void; to?: string };
type CardProgress = { done: number; total: number; steps: string[] };

export type CardTone = "accent" | "green" | "amber" | "red" | "neutral";

/** A full-bleed card image. Authored to 3:4 (side) / 16:9 (bottom); the
 *  container object-covers, so any close ratio crops cleanly. Until real art
 *  lands, a tone-wash placeholder (soft fill + glyph) stands in. */
export type CardMedia = {
  src?: string;
  alt?: string;
  tone?: CardTone;
  icon?: string;
  placement?: "side" | "bottom";
};

const MEDIA_TONES: Record<CardTone, string> = {
  accent: "bg-accent-soft text-accent-default",
  green: "bg-status-success-soft text-status-success",
  red: "bg-status-danger-soft text-status-danger",
  amber: "bg-surface-subtle text-text-secondary",
  neutral: "bg-surface-subtle text-icon-secondary",
};

/** Fills its box with the image, or a tone-wash placeholder if there's no src. */
function MediaFill({ media, className }: { media: CardMedia; className?: string }) {
  return (
    <div
      aria-hidden={!media.src}
      className={cn("relative overflow-hidden", !media.src && MEDIA_TONES[media.tone ?? "neutral"], className)}
    >
      {media.src ? (
        <img src={media.src} alt={media.alt ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <Icon name={media.icon ?? "image"} size={40} filled />
        </div>
      )}
    </div>
  );
}

/** A 16px completion ring; hovering anywhere on the parent card (which carries
 *  `group`) reveals the steps still left. */
export function ProgressRing({ done, total, steps }: CardProgress) {
  const r = 9;
  const circ = 2 * Math.PI * r;
  const frac = total ? done / total : 0;
  const left = total - done;
  return (
    <div className="relative shrink-0">
      <svg viewBox="0 0 24 24" className="h-4 w-4 -rotate-90" aria-hidden>
        <circle cx={12} cy={12} r={r} fill="none" strokeWidth={3} className="stroke-surface-strong" />
        <circle
          cx={12}
          cy={12}
          r={r}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          className="stroke-accent-default"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
        />
      </svg>
      <span className="sr-only">
        {done} of {total} steps done
      </span>
      <div className="pointer-events-none absolute left-0 top-6 z-20 hidden w-60 rounded-md border border-border-default bg-surface-raised p-3 text-left shadow-lg group-hover:block">
        <p className="mb-2 text-xs font-semibold text-text-primary">
          {left} {left === 1 ? "step" : "steps"} left
        </p>
        <ul className="space-y-1.5">
          {steps.map((step, i) => (
            <li key={step} className="flex items-center gap-2 text-xs">
              <Icon
                name={i < done ? "check_circle" : "radio_button_unchecked"}
                size={16}
                filled={i < done}
                className={i < done ? "text-status-success" : "text-icon-tertiary"}
              />
              <span className={i < done ? "text-text-tertiary line-through" : "text-text-primary"}>
                {step}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The one card for every actionable surface on Home & Insights: an optional
 *  eyebrow / progress ring / status / right-hand meta, a title, a 14/20 line
 *  of copy, an optional visual, and a CTA pinned bottom-left. No header rule,
 *  no item borders — one consistent shape everywhere. */
export function ActionCard({
  eyebrow,
  title,
  reason,
  status,
  meta,
  primary,
  secondary,
  visual,
  media,
  progress,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  reason?: string;
  status?: Status;
  meta?: ReactNode;
  primary?: Cta;
  secondary?: Cta;
  visual?: ReactNode;
  media?: CardMedia;
  progress?: CardProgress;
  className?: string;
}) {
  const bottom = media?.placement === "bottom";
  return (
    <section
      className={cn(
        "group relative flex rounded-card border border-border-default bg-surface-raised shadow-sm",
        media ? (bottom ? "flex-col overflow-hidden" : "overflow-hidden") : "gap-4 p-4",
        className,
      )}
    >
      <div className={cn("flex min-w-0 flex-1 flex-col", media && "p-4")}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {eyebrow || progress ? (
              <div className="mb-1 flex items-center gap-1.5">
                {progress ? <ProgressRing {...progress} /> : null}
                {eyebrow ? (
                  <span className="text-xs font-semibold text-text-secondary">{eyebrow}</span>
                ) : null}
              </div>
            ) : null}
            <h3 className="font-display text-base font-semibold leading-6 text-text-primary">{title}</h3>
            {reason ? <p className="mt-1 text-sm leading-5 text-text-secondary">{reason}</p> : null}
          </div>
          {status ? (
            <StatusBadge status={status} />
          ) : meta ? (
            <span className="shrink-0 text-xs font-semibold text-text-secondary">{meta}</span>
          ) : null}
        </div>
        {(primary || secondary) && !bottom ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {primary ? <CtaButton cta={primary} variant="secondary" /> : null}
            {secondary ? <CtaButton cta={secondary} variant="ghost" /> : null}
          </div>
        ) : null}
      </div>
      {media ? (
        bottom ? (
          // Bottom image on tall/column cards — the CTA sits bottom-left over it.
          <div className="relative mt-auto">
            <MediaFill media={media} className="aspect-video w-full" />
            {primary ? (
              <div className="absolute inset-x-0 bottom-0 flex items-end p-3">
                <CtaButton cta={primary} variant="secondary" />
              </div>
            ) : null}
          </div>
        ) : (
          <MediaFill media={media} className="w-2/5 max-w-[14rem] shrink-0 self-stretch" />
        )
      ) : visual ? (
        <div className="shrink-0 self-center">{visual}</div>
      ) : null}
    </section>
  );
}

/** A decorative illustration tile — the "image" on setup/promo cards, in
 *  our tokens (soft tone wash + a big glyph) instead of a stock graphic. */
export function CardArt({
  icon,
  tone = "accent",
  className,
}: {
  icon: string;
  tone?: "accent" | "green" | "red" | "amber" | "neutral";
  className?: string;
}) {
  const tones: Record<string, string> = {
    accent: "bg-accent-soft text-accent-default",
    green: "bg-status-success-soft text-status-success",
    red: "bg-status-danger-soft text-status-danger",
    amber: "bg-surface-subtle text-text-secondary",
    neutral: "bg-surface-subtle text-icon-secondary",
  };
  return (
    <div
      aria-hidden
      className={cn(
        "grid aspect-[5/3] w-44 shrink-0 place-items-center overflow-hidden rounded-md",
        tones[tone],
        className,
      )}
    >
      <Icon name={icon} size={44} filled />
    </div>
  );
}

/** Shared CTA that renders a router link or a plain button from one shape. */
export function CtaButton({
  cta,
  variant = "primary",
  size = "sm",
}: {
  cta: { label: string; onClick?: () => void; to?: string };
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "sm";
}) {
  if (cta.to) {
    return (
      <Button variant={variant} size={size} asChild>
        <Link to={cta.to}>{cta.label}</Link>
      </Button>
    );
  }
  return (
    <Button variant={variant} size={size} onClick={cta.onClick}>
      {cta.label}
    </Button>
  );
}

/* ── Campaigns & Polsts lists (Home) ─────────────────────────────── */

/** Split thumbnail for a Polst — the real option pair either side of the
 *  OR disc, in miniature (the MiniPoll thumb anatomy). */
export function PollThumb({ options }: { options: [PollOption, PollOption] }) {
  return (
    <div className="relative grid h-14 w-14 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-md bg-surface-strong">
      <img src={options[0].image} alt="" className="h-full w-full object-cover" />
      <img src={options[1].image} alt="" className="h-full w-full object-cover" />
      <span className="absolute left-1/2 top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-surface-raised font-display text-[9px] font-bold text-text-primary shadow-sm">
        OR
      </span>
    </div>
  );
}

/** A Polst in miniature (Home "Polsts" card): a split thumb beside the
 *  question, its status, and the current split — or its state before it runs.
 *  Reuses the mini-poll anatomy (thumb · question · shares). */
export function PolstMiniRow({ polst }: { polst: SinglePolst }) {
  const hasSplit = polst.split.includes("/");
  const [a, b] = hasSplit ? polst.split.split("/").map((s) => s.trim()) : ["", ""];
  return (
    <Link
      to={`/polsts/${polst.id}`}
      className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-subtle"
    >
      <PollThumb options={polstOptions(polst)} />
      <div className="flex h-14 min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display text-sm font-semibold leading-5 text-text-primary">
            {polst.question}
          </p>
          <StatusBadge status={polst.status} />
        </div>
        {hasSplit ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            <span className="min-w-0 truncate">{polst.optionA}</span>
            <span className="shrink-0 font-semibold text-text-primary tabular-nums">{a}</span>
            <span aria-hidden className="h-3 w-px shrink-0 bg-border-strong" />
            <span className="shrink-0 font-semibold text-text-primary tabular-nums">{b}</span>
            <span className="min-w-0 truncate">{polst.optionB}</span>
          </div>
        ) : (
          <p className="truncate text-xs font-medium text-text-tertiary">{polst.dates}</p>
        )}
      </div>
    </Link>
  );
}

/** A dot separator between inline stats. */
const StatDot = () => (
  <span aria-hidden className="text-border-strong">
    ·
  </span>
);

/** An active campaign summary for Home: signal, response progress, and live Polsts. */
export function CampaignRow({ campaign }: { campaign: Campaign }) {
  return (
    <Link
      to={`/campaigns/${campaign.id}`}
      className="block rounded-md p-2 transition-colors hover:bg-surface-subtle"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate font-display text-sm font-semibold leading-5 text-text-primary">
          {campaign.name}
        </p>
        <SignalBadge signal={campaign.signal} />
      </div>
      <p className="mt-0.5 text-xs text-text-secondary">{campaign.dates}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1">
          <span className="font-semibold tabular-nums text-text-primary">
            {formatNumber(campaign.responses)} / {formatNumber(campaign.target)}
          </span>
          responses
        </span>
        <StatDot />
        <span>
          <span className="font-semibold tabular-nums text-text-primary">
            {campaign.pollsActive}
          </span>{" "}
          Polsts live
        </span>
      </div>
    </Link>
  );
}

/* ── Recommendations & setup (Home) ──────────────────────────────── */

/** A checkbox for a setup step: solid check when done, dashed ring when not. */
function StepBullet({ done }: { done?: boolean }) {
  return done ? (
    <Icon name="check_circle" size={20} filled className="mt-0.5 shrink-0 text-status-success" />
  ) : (
    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-border-strong" />
  );
}

/** Small completion ring for the setup-card header (no tooltip). */
function StepRing({ done, total }: { done: number; total: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r;
  const frac = total ? done / total : 0;
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 -rotate-90" aria-hidden>
      <circle cx={10} cy={10} r={r} fill="none" strokeWidth={2.5} className="stroke-surface-strong" />
      <circle
        cx={10}
        cy={10}
        r={r}
        fill="none"
        strokeWidth={2.5}
        strokeLinecap="round"
        className="stroke-accent-default"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - frac)}
      />
    </svg>
  );
}

export type SetupStep = {
  title: string;
  description?: string;
  done?: boolean;
  cta?: Cta;
  media?: CardMedia;
};

/** The setup checklist (Shopify "Get your first N" pattern). The whole card
 *  collapses from the header chevron; each step is a click-to-expand accordion
 *  row. Every bullet keeps the same x-position whether a step is open or not,
 *  so opening a step never shifts the checkboxes. Full width. */
export function NextStepsCard({
  title,
  intro,
  steps,
}: {
  title: string;
  intro?: string;
  steps: SetupStep[];
}) {
  const done = steps.filter((s) => s.done).length;
  const firstOpen = steps.findIndex((s) => !s.done);
  const [openIdx, setOpenIdx] = useState(firstOpen);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section className="overflow-hidden rounded-card border border-border-default bg-surface-raised p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary">
            <StepRing done={done} total={steps.length} />
            {done} of {steps.length} tasks complete
          </p>
          <h2 className="font-display text-base font-semibold leading-6 text-text-primary">{title}</h2>
          {intro && !collapsed ? (
            <p className="mt-1 text-sm leading-5 text-text-secondary">{intro}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand" : "Collapse"}
          aria-expanded={!collapsed}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-icon-secondary transition-colors hover:bg-surface-subtle"
        >
          <Icon name={collapsed ? "expand_more" : "expand_less"} size={20} />
        </button>
      </div>

      {!collapsed ? (
        <ol className="mt-3 space-y-0.5">
          {steps.map((step, i) => {
            const open = i === openIdx;
            return (
              <li key={step.title} className={cn("overflow-hidden rounded-md", open && "bg-surface-subtle")}>
                <div className="flex">
                  <div className="min-w-0 flex-1">
                    {/* Toggle row — the bullet keeps the same x whether open or not. */}
                    <button
                      type="button"
                      onClick={() => setOpenIdx(open ? -1 : i)}
                      aria-expanded={open}
                      className={cn(
                        "flex w-full items-start gap-3 p-2 text-left transition-colors",
                        !open && "rounded-md hover:bg-surface-subtle",
                      )}
                    >
                      <StepBullet done={step.done} />
                      <span
                        className={cn(
                          "min-w-0 font-display text-sm font-semibold leading-5",
                          step.done ? "text-text-tertiary line-through" : "text-text-primary",
                        )}
                      >
                        {step.title}
                      </span>
                    </button>
                    {open && (step.description || step.cta) ? (
                      <div className="pb-2 pl-10 pr-2">
                        {step.description ? (
                          <p className="text-sm leading-5 text-text-secondary">{step.description}</p>
                        ) : null}
                        {step.cta ? (
                          <div className="mt-3">
                            <CtaButton cta={step.cta} variant="secondary" />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {open && step.media ? (
                    <MediaFill media={step.media} className="w-2/5 max-w-[14rem] shrink-0 self-stretch" />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}

/* ── Flow steps (staged create/edit workflows) ───────────────────── */

/** The progress header for a staged workflow: numbered steps, the active
 *  one filled, finished ones checked. Completed steps are clickable so
 *  the user can go back without losing place. */
export function FlowSteps<T extends string>({
  steps,
  active,
  onChange,
}: {
  steps: readonly T[];
  active: T;
  onChange: (step: T) => void;
}) {
  const activeIndex = steps.indexOf(active);
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Setup steps">
      {steps.map((step, i) => {
        const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "todo";
        return (
          <li key={step} className="flex items-center gap-2">
            {i > 0 ? (
              <Icon name="chevron_right" size={16} className="text-icon-tertiary" aria-hidden />
            ) : null}
            <button
              type="button"
              disabled={state === "todo"}
              onClick={() => onChange(step)}
              aria-current={state === "active" ? "step" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2.5 font-display text-ui font-semibold transition-colors",
                state === "active" && "bg-surface-raised text-text-primary shadow-sm ring-1 ring-border-default",
                state === "done" && "text-text-secondary hover:text-text-primary",
                state === "todo" && "cursor-default text-text-tertiary",
              )}
            >
              {state === "done" ? (
                <Icon name="check_circle" size={18} filled className="text-status-success" />
              ) : (
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-pill text-xs font-semibold",
                    state === "active"
                      ? "bg-accent-default text-text-on-accent"
                      : "bg-surface-strong text-text-secondary",
                  )}
                >
                  {i + 1}
                </span>
              )}
              {step}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** The quiet autosave affordance: saving is the system's job, so it never
 *  gets a primary button — just this line beside the flow's real action. */
export function SavedChip({ when = "just now" }: { when?: string }) {
  return (
    <span className="flex h-8 items-center gap-1 text-xs text-text-tertiary">
      <Icon name="cloud_done" size={16} />
      Draft saved {when}
    </span>
  );
}

/* ── In-page tabs (detail pages) ─────────────────────────────────── */

/** Local section tabs (e.g. campaign Overview / Polsts / Distribution) — the
 *  same `SegmentedControl` as everywhere else. */
export function PageTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
}) {
  return <SegmentedControl tabs={tabs} active={active} onChange={onChange} />;
}

/** Small controlled-tabs helper for pages that only need local state. */
export function useTabs<T extends string>(tabs: readonly T[]) {
  const [active, setActive] = useState<T>(tabs[0]);
  return { active, setActive };
}

/* ── Stat tile ───────────────────────────────────────────────────── */

/** The one KPI tile (Distribution / Analytics / Audience headline rows):
 *  quiet label, display number, and a toned detail line. */
export function StatTile({
  label,
  value,
  detail,
  trend = "flat",
  info,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "flat";
  /** Metric definition, surfaced on hover — every number stays inspectable. */
  info?: string;
  className?: string;
}) {
  return (
    <DashboardCard className={className}>
      <p className="flex items-center gap-1 text-sm font-medium text-text-secondary">
        {label}
        {info ? <InfoHint text={info} /> : null}
      </p>
      <p
        className={cn(
          "mt-3 font-display font-semibold tracking-tight text-text-primary",
          /^[0-9]/.test(value)
            ? "text-2xl leading-8 tabular-nums"
            : "text-xl leading-7",
        )}
      >
        {value}
      </p>
      {detail ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-sm font-medium",
            trend === "up" && "font-semibold text-status-success",
            trend === "down" && "font-semibold text-status-danger",
            trend === "flat" && "text-text-secondary",
          )}
        >
          {trend !== "flat" ? (
            <Icon name={trend === "up" ? "trending_up" : "trending_down"} size={16} />
          ) : null}
          {detail}
        </p>
      ) : null}
    </DashboardCard>
  );
}

/* ── Poll results (the product's face) ───────────────────────────── */

/** The REAL consumer option pair in its results state — the same
 *  `PollOptionsBlock` voters see, with the leading side selected so the
 *  bars animate in from the seam. One component across both apps. */
export function PollResults({
  options,
  dense = false,
  className,
}: {
  options: [PollOption, PollOption];
  /** Admin-grid cut — smaller disc and bars for 3-up card grids. */
  dense?: boolean;
  className?: string;
}) {
  const [a, b] = voteShares(options);
  const hasVotes = (options[0].votes ?? 0) + (options[1].votes ?? 0) > 0;
  const leader = b > a ? 1 : 0;
  // Presentation only — the admin reads results, it doesn't vote. The block
  // leaves the tab order and drops its interactive affordances entirely.
  return (
    <div className={cn("pointer-events-none select-none", className)} aria-hidden={false}>
      <PollOptionsBlock
        options={options}
        selected={hasVotes ? leader : null}
        onSelect={() => {}}
        dense={dense}
        readOnly
      />
    </div>
  );
}

/* ── Funnel ──────────────────────────────────────────────────────── */

export type FunnelStep = { label: string; count: number };

/** The campaign journey: Started → each question → Completed. Bars scale
 *  to the first step; the step that loses the most voters carries the
 *  "Biggest drop" tag. Reads top to bottom like the voter experienced it. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.count || 1;
  // Largest absolute loss between consecutive steps (ties go to the earliest).
  let biggestDropIndex = -1;
  let biggestDrop = 0;
  steps.forEach((step, i) => {
    if (i === 0) return;
    const drop = steps[i - 1].count - step.count;
    if (drop > biggestDrop) {
      biggestDrop = drop;
      biggestDropIndex = i;
    }
  });
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].count : step.count;
        const dropPct = prev > 0 ? Math.round(((prev - step.count) / prev) * 100) : 0;
        const isBiggest = i === biggestDropIndex && biggestDrop > 0;
        const isLast = i === steps.length - 1;
        return (
          <li key={step.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-semibold text-text-primary">
                {step.label}
              </span>
              <span className="flex shrink-0 items-baseline gap-2 text-sm tabular-nums">
                {i > 0 && dropPct > 0 ? (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isBiggest ? "font-semibold text-status-danger" : "text-text-tertiary",
                    )}
                  >
                    −{dropPct}%{isBiggest ? " · biggest drop" : ""}
                  </span>
                ) : null}
                <span className="font-semibold text-text-primary">{formatNumber(step.count)}</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-pill bg-surface-strong">
              <div
                className={cn(
                  "h-full rounded-pill",
                  isLast ? "bg-status-success" : "bg-accent-default",
                )}
                style={{ width: `${Math.max(2, Math.round((step.count / max) * 100))}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Mix bars ────────────────────────────────────────────────────── */

/** A ranked share list (source mix, devices, interests, age bands):
 *  label · bar · share. One component so every breakdown reads alike. */
export function MixBars({
  slices,
  className,
}: {
  slices: { label: string; value: number; detail?: string }[];
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {slices.map((slice) => (
        <li key={slice.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-text-primary">{slice.label}</span>
            <span className="flex shrink-0 items-baseline gap-2">
              {slice.detail ? (
                <span className="text-xs text-text-tertiary">{slice.detail}</span>
              ) : null}
              <span className="font-semibold tabular-nums text-text-primary">{slice.value}%</span>
            </span>
          </div>
          {/* Bars scale to 100%, never to the largest slice — a 48% share
              must read as 48%, or the chart lies. */}
          <div className="h-2 overflow-hidden rounded-pill bg-surface-strong">
            <div
              className="h-full rounded-pill bg-accent-default"
              style={{ width: `${Math.min(100, Math.max(0, slice.value))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Snippet card ────────────────────────────────────────────────── */

/** A labeled code block with a copy affordance — embed snippets, share
 *  links. Copying only raises a toast in this mockup. */
export function SnippetCard({
  title,
  description,
  code,
}: {
  title: string;
  description?: string;
  code: string;
}) {
  const toast = useToast();
  return (
    <div className="rounded-md border border-border-default bg-surface-subtle">
      <div className="flex items-center justify-between gap-3 px-3 pt-3">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-text-primary">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs leading-4 text-text-secondary">{description}</p>
          ) : null}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast(`${title} copied`)}
        >
          <Icon name="content_copy" size={16} />
          Copy
        </Button>
      </div>
      <pre className="scroll-subtle overflow-x-auto p-3 font-mono text-xs leading-5 text-text-secondary">
        {code}
      </pre>
    </div>
  );
}

/* ── Locked section ──────────────────────────────────────────────── */

/** A gated capability: quiet surface, lock icon, one-line promise, and a
 *  plan chip. Used for demographics we don't collect yet and Pro-tier
 *  surfaces like the API — present, honest, never clickbait. */
export function LockedCard({
  title,
  description,
  chip = "Coming soon",
  className,
}: {
  title: string;
  description: string;
  chip?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-dashed border-border-strong bg-surface-subtle p-4",
        className,
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-strong text-icon-secondary">
        <Icon name="lock" size={20} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm font-semibold text-text-primary">{title}</p>
          <span className="rounded-pill bg-surface-strong px-2 py-0.5 font-display text-xs font-semibold text-text-secondary">
            {chip}
          </span>
        </div>
        <p className="mt-1 text-sm leading-5 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

/* ── Split bar ───────────────────────────────────────────────────── */

/** The Polst signature for any two-part share: one bar, two segments
 *  meeting at a seam — the visual echo of a vote result. Use for exactly
 *  two slices (paid/organic, US/international); MixBars handles 3+. */
export function SplitBar({ split, className }: { split: Split; className?: string }) {
  const total = split.a.value + split.b.value || 1;
  const aPct = (split.a.value / total) * 100;
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0">
          <span className="font-display text-xl font-semibold tabular-nums text-text-primary">
            {split.a.value}%
          </span>
          <span className="ml-1.5 text-sm font-medium text-text-secondary">{split.a.label}</span>
        </p>
        <p className="min-w-0 text-right">
          <span className="text-sm font-medium text-text-secondary">{split.b.label}</span>
          <span className="ml-1.5 font-display text-xl font-semibold tabular-nums text-text-primary">
            {split.b.value}%
          </span>
        </p>
      </div>
      <div className="mt-2 flex h-8 gap-0.5">
        <div
          className="rounded-l-md bg-accent-default"
          style={{ width: `${aPct}%` }}
          role="img"
          aria-label={`${split.a.label} ${split.a.value}%`}
        />
        <div
          className="flex-1 rounded-r-md bg-surface-strong"
          role="img"
          aria-label={`${split.b.label} ${split.b.value}%`}
        />
      </div>
      {split.a.detail || split.b.detail ? (
        <div className="mt-1.5 flex justify-between gap-3 text-xs text-text-tertiary">
          <span>{split.a.detail}</span>
          <span>{split.b.detail}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ── Cohort grid ─────────────────────────────────────────────────── */

/** Retention triangle: weekly cohorts down, return checkpoints across,
 *  cells shaded by percent returning. Cells the cohort hasn't reached yet
 *  render as quiet dashes — maturing, not missing. */
export function CohortGrid({ cohorts, className }: { cohorts: Cohort[]; className?: string }) {
  const columns = ["Day 1", "Day 7", "Day 14", "Day 30"] as const;
  const keys = ["d1", "d7", "d14", "d30"] as const;
  return (
    <div className={className}>
      <div className="grid grid-cols-[minmax(76px,1fr)_minmax(76px,1fr)_repeat(4,minmax(0,1.4fr))] gap-1">
        <span className="pb-1 text-xs font-medium text-text-secondary">Cohort</span>
        <span className="pb-1 text-right text-xs font-medium tabular-nums text-text-secondary">
          Voters
        </span>
        {columns.map((col) => (
          <span key={col} className="pb-1 text-center text-xs font-medium text-text-secondary">
            {col}
          </span>
        ))}
        {cohorts.map((cohort) => (
          <div key={cohort.label} className="contents">
            <span className="flex h-9 items-center text-sm font-semibold text-text-primary">
              {cohort.label}
            </span>
            <span className="flex h-9 items-center justify-end text-sm tabular-nums text-text-secondary">
              {formatNumber(cohort.size)}
            </span>
            {keys.map((key, i) => {
              const value = cohort[key];
              return value === null ? (
                <span
                  key={key}
                  className="grid h-9 place-items-center rounded-sm bg-surface-subtle text-sm text-text-tertiary"
                  title={`${cohort.label} · ${columns[i]}: not reached yet`}
                >
                  —
                </span>
              ) : (
                <span
                  key={key}
                  tabIndex={0}
                  role="img"
                  aria-label={`${cohort.label} cohort, ${columns[i]}: ${value}% returned`}
                  title={`${cohort.label} · ${columns[i]}: ${value}%`}
                  className="grid h-9 place-items-center rounded-sm text-sm font-semibold tabular-nums text-text-primary transition-[filter] duration-150 hover:brightness-90 focus-visible:brightness-90"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--accent-default) ${Math.round(value * 0.65)}%, var(--surface-subtle))`,
                  }}
                >
                  {value}%
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Time heatmap ────────────────────────────────────────────────── */

/** Day × time-of-day density in a single hue — accent strength is the
 *  scale. Answers "when does our audience answer?" in one glance. */
export function TimeHeatmap({
  values,
  days,
  buckets,
  className,
}: {
  values: number[][];
  days: readonly string[];
  buckets: readonly string[];
  className?: string;
}) {
  const max = Math.max(...values.flat(), 1);
  return (
    <div className={className}>
      <div className="space-y-1">
        {values.map((row, d) => (
          <div key={days[d]} className="flex items-center gap-1">
            <span className="w-8 shrink-0 text-right text-xs text-text-secondary">{days[d]}</span>
            {row.map((value, b) => (
              <span
                key={b}
                tabIndex={0}
                role="img"
                aria-label={`${days[d]} ${buckets[b]} — ${formatNumber(value)} responses`}
                title={`${days[d]} ${buckets[b]} — ${formatNumber(value)} responses`}
                className="h-6 min-w-0 flex-1 rounded-sm transition-[filter] duration-150 hover:brightness-90 focus-visible:brightness-90"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--accent-default) ${Math.round((value / max) * 82)}%, var(--surface-subtle))`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="ml-9 mt-1.5 flex gap-1">
        {buckets.map((label, i) => (
          <span key={label} className="min-w-0 flex-1 text-center text-xs text-text-tertiary">
            {i % 2 === 0 ? label : ""}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-text-tertiary">
        Fewer
        {[10, 28, 46, 64, 82].map((strength) => (
          <span
            key={strength}
            className="h-3 w-3 rounded-sm"
            style={{
              backgroundColor: `color-mix(in srgb, var(--accent-default) ${strength}%, var(--surface-subtle))`,
            }}
          />
        ))}
        More
      </div>
    </div>
  );
}

/* ── Switch ──────────────────────────────────────────────────────── */

/** The module on/off control. Accent when on, quiet when off, springy
 *  thumb — same physicality as the buttons. */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "group inline-flex shrink-0 items-center justify-center rounded-md p-2 transition-colors duration-150 hover:bg-surface-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-pill transition-colors duration-150",
          checked ? "bg-accent-default" : "bg-surface-strong",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-pill bg-surface-raised shadow-sm transition-transform duration-150",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

/* ── Connect card (integrations) ─────────────────────────────────── */

/** One integration: what it is, what it feeds, and its connection state.
 *  Marketers see integrations — the word "API" stays in the developer
 *  section. Connecting only raises a toast in this mockup. */
export function ConnectCard({ integration }: { integration: Integration }) {
  const toast = useToast();
  return (
    <div className="flex items-center gap-3 rounded-md border border-border-default bg-surface-raised p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-subtle text-icon-primary">
        <Icon name={integration.icon} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-text-primary">{integration.name}</p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{integration.feeds}</p>
      </div>
      {integration.connected ? (
        <div className="shrink-0 text-right">
          <span className="flex items-center gap-1 text-xs font-semibold text-status-success">
            <Icon name="check_circle" size={16} filled />
            Connected
          </span>
          {integration.lastSync ? (
            <p className="mt-0.5 text-xs text-text-tertiary">Synced {integration.lastSync}</p>
          ) : null}
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => toast(`Opening ${integration.name} to authorize the connection…`)}
        >
          Connect
        </Button>
      )}
    </div>
  );
}

/* ── Filter bar ──────────────────────────────────────────────────── */

export type DateRangeValue = AnalyticsRange;

const DATE_RANGE_OPTIONS: Array<{ value: DateRangeValue; label: string }> = [
  { value: "7D", label: "Last 7 days" },
  { value: "30D", label: "Last 30 days" },
  { value: "90D", label: "Last 90 days" },
  { value: "All", label: "All time" },
];

/** Shared reporting-window control for every analytics surface. */
export function DateRangeMenu({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
}) {
  return (
    <SelectMenu
      label="Date range"
      value={value}
      onValueChange={(next) => onChange(next as DateRangeValue)}
      options={DATE_RANGE_OPTIONS.map((option) => ({ ...option, icon: "calendar_today" }))}
      icon="calendar_month"
      compact
    />
  );
}

/** Shared controlled analytics filters. Every control belongs to the query;
 *  pages never render a selector that does not change their data. */
export function FilterBar({
  filters,
  onChange,
  verticals,
  channels,
  utms,
  className,
}: {
  filters: AnalyticsFilters;
  onChange: (next: AnalyticsFilters) => void;
  verticals?: string[];
  channels?: string[];
  utms?: string[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DateRangeMenu
        value={filters.range}
        onChange={(range) => onChange({ ...filters, range })}
      />
      {channels?.length ? (
        <SelectMenu
          label="Channel"
          value={filters.channel}
          onValueChange={(channel) => onChange({ ...filters, channel })}
          options={["All channels", ...channels].map((name) => ({ value: name, label: name }))}
          compact
        />
      ) : null}
      {verticals?.length ? (
        <SelectMenu
          label="Vertical"
          value={filters.vertical}
          onValueChange={(vertical) => onChange({ ...filters, vertical })}
          options={["All verticals", ...verticals].map((name) => ({ value: name, label: name }))}
          compact
        />
      ) : null}
      {utms?.length ? (
        <SelectMenu
          label="UTM group"
          value={filters.utm}
          onValueChange={(utm) => onChange({ ...filters, utm })}
          options={["All UTM groups", ...utms].map((name) => ({ value: name, label: name }))}
          align="end"
          compact
        />
      ) : null}
    </div>
  );
}
