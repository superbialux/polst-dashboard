import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn, copyText } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/badge";
import { IconButton, IconTile } from "@/components/ui/icon-button";
import { SearchField } from "@/components/ui/search-field";
import { TrendChart } from "./charts";
import { useToast } from "@/components/Toast";
import { PollOptionsBlock } from "@/components/PollCard";
import { voteShares, type PollOption } from "@/lib/poll";
import { FieldHelper, InfoHint, SelectMenu, TextInput } from "@/components/Field";
import { HeaderActions, HeaderTabsSlot, PageFooterSlot } from "./Shell";
import { STATUS_TONE, daysBetween, fmtDateRange, type StatusTone } from "@/lib/canon";
import { addDays } from "@/lib/engine";
import type { AnalyticsFilters } from "@/lib/analytics";
import {
  formatNumber,
  polstImage,
  type DecisionSignal,
  type Integration,
  type Split,
  type Stat,
  type Status,
  type WindowRange,
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
  /** A HeaderTabs row — rendered as a full-width band flush under the
   *  sticky header, before the centered content column. */
  tabs?: ReactNode;
  /** Fixed footer content (a list pager) — teleports into the footer
   *  band below the scroller, the header's mirror. */
  footer?: ReactNode;
  children: ReactNode;
};

/** The standard page: a centered, vertically-rhythmic column. Pages carry
 *  no title or description — the header breadcrumbs name where you are;
 *  content does the explaining. `actions` teleport into the header's
 *  right side (the page-contextual slot). Every page shares the one
 *  `max-w-dashboard` container — no per-page widths. */
export function DashboardPage({ actions, tabs, footer, children }: PageProps) {
  return (
    <>
      {/* Tabs teleport into the header block itself — part of the fixed
          chrome, above the scroller; the footer mirrors it below. */}
      {tabs ? <HeaderTabsSlot>{tabs}</HeaderTabsSlot> : null}
      {footer ? (
        <PageFooterSlot>
          {/* One layout contract for every footer: a full-width
              space-between flex row. */}
          <div className="flex min-h-12 w-full flex-wrap items-center justify-between gap-2 py-2">
            {footer}
          </div>
        </PageFooterSlot>
      ) : null}
      <div className="mx-auto max-w-dashboard space-y-8">
        {actions ? <HeaderActions>{actions}</HeaderActions> : null}
        {children}
      </div>
    </>
  );
}

/** True header tabs (the GitHub/Stripe register): quiet labels on the
 *  header band, the active one carrying the 2px accent underline — the
 *  same indicator language as the stat hero's cells. For view switches
 *  inside content, use SegmentedControl/PageTabs instead. */
export function HeaderTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<T>;
  active: T;
  onChange: (tab: T) => void;
}) {
  return (
    <nav aria-label="Page sections" className="flex gap-5">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          aria-current={tab === active ? "page" : undefined}
          onClick={() => onChange(tab)}
          className={cn(
            "relative flex h-9 items-center font-display text-sm font-medium transition-colors",
            tab === active ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
          )}
        >
          {tab}
          {tab === active ? (
            <span aria-hidden className="absolute inset-x-0 bottom-0 border-b-2 border-accent-default" />
          ) : null}
        </button>
      ))}
    </nav>
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
        <div className="flex items-start justify-between gap-4 px-4 pb-0 pt-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
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
      <div className={cn(padded && (hasHeader ? "px-4 pb-4 pt-3" : "p-4"), bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/** A page-level section heading — the same anatomy Home's "Campaigns"
 *  row carries: card-title type with an optional trailing control, over
 *  content that sits directly on the page (no wrapper card around it —
 *  cards never nest inside cards). */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-2", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm leading-5 text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** 12-column layout row at the shared 16px gutter. Children set
 *  `lg:col-span-{n}`; everything stacks below `lg`. Grid items default to
 *  `min-width: auto`, which lets a wide child (a table's min-content, a
 *  segmented form control) widen its track past the viewport on small
 *  screens — `[&>*]:min-w-0` keeps every panel inside its column so
 *  overflow scrolls inside the panel's own wrapper, never the page. */
export function SectionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-12 [&>*]:min-w-0", className)}>{children}</div>
  );
}

/* ── Status tone ─────────────────────────────────────────────────── */

const TONE_CHIP: Record<StatusTone, string> = {
  success: "bg-status-success-soft text-status-success",
  accent: "bg-accent-soft text-accent-default",
  warning: "bg-status-warning-soft text-status-warning",
  danger: "bg-status-danger-soft text-status-danger",
  neutral: "bg-surface-subtle text-text-secondary",
};

/** Canon's STATUS_TONE owns object-state → tone (Ended is neutral,
 *  Scheduled accent). Non-canonical strings from unmigrated pages fall
 *  back to a neutral pill instead of crashing. */
export function StatusBadge({ status }: { status: Status | string }) {
  const tone: StatusTone = (STATUS_TONE as Record<string, StatusTone>)[status] ?? "neutral";
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
 *  different question from where the object sits in its lifecycle. The
 *  taxonomy is internal (it drives readiness, attention, and phrasing);
 *  every surface speaks `verdictLabel` plain language instead. */
export type { DecisionSignal } from "@/lib/workspace";

/* ── Info hint ───────────────────────────────────────────────────── */

/* InfoHint moved next to Field so field labels can carry it without an
 * import cycle; kit keeps exporting it for every dashboard call site. */
export { InfoHint } from "@/components/Field";

/* ── Decision brief ──────────────────────────────────────────────── */

/** The Decision Narrative, as one reusable object: verdict eyebrow →
 *  headline → what changed and why → caveat → evidence → the next action.
 *  Anywhere a result is summarized (campaign overview, Home briefing,
 *  analytics), this pattern speaks — charts sit under it as evidence. */
export function DecisionBrief({
  eyebrow,
  headline,
  summary,
  caveat,
  evidence,
  primary,
  secondary,
  className,
}: {
  /** The plain-language read above the headline — "Target reached · High
   *  confidence — collecting until Jun 17", or verdict + progress
   *  ("Collecting votes — 640 of 1,200 voters"). Never a raw
   *  DecisionSignal taxonomy label. */
  eyebrow: ReactNode;
  headline: string;
  /** What changed and the likely cause, in plain words. */
  summary: string;
  /** What could invalidate the read. */
  caveat?: string;
  /** The numbers behind the call: voters vs target, sources, lead. */
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
      <p className="text-xs font-semibold text-text-secondary">{eyebrow}</p>
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

/** A segment: a bare string, or `{ value, label?, icon? }`. An item with an
 *  `icon` renders icon-only; its label (or value) becomes the accessible
 *  name — the view-mode toggles ride the same control as status filters. */
export type SegmentItem<T extends string> = T | { value: T; label?: string; icon?: string };

/** The control-height contract: every action control is 32px tall —
 *  toolbar and compact are the same track now and survive as aliases.
 *  Only enumerated form choices under a Field label keep the 40px form
 *  input height. Segments stretch to the track minus its padding. */
const SEGMENT_SIZES = {
  toolbar: "h-8 p-0.5",
  compact: "h-8 p-0.5",
  form: "h-10 w-full p-1",
} as const;

/** Segmented tab group on a subtle track — the in-page status filter. */
/** The one segmented select across the app — status filters, page tabs, and
 *  compact view changes. **White** (raised + bordered) so it reads against
 *  the page background, with a light active pill. Scrolls if it can't fit.
 *  `FilterTabs` / `PageTabs` are thin aliases so every select is identical. */
export function SegmentedControl<T extends string>({
  tabs,
  active,
  onChange,
  size = "toolbar",
  className,
}: {
  tabs: ReadonlyArray<SegmentItem<T>>;
  active: T;
  onChange: (tab: T) => void;
  size?: keyof typeof SEGMENT_SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-stretch gap-0.5 overflow-x-auto rounded-md border border-border-default bg-surface-raised [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        SEGMENT_SIZES[size],
        className,
      )}
    >
      {tabs.map((tab) => {
        const item = typeof tab === "string" ? { value: tab } : tab;
        const name = item.label ?? item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            aria-pressed={active === item.value}
            aria-label={item.icon ? name : undefined}
            className={cn(
              "flex shrink-0 items-center justify-center whitespace-nowrap rounded-sm font-display text-sm font-semibold transition-colors",
              item.icon ? "w-8" : "px-3",
              size === "form" && "flex-1",
              active === item.value
                ? "bg-surface-subtle text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {item.icon ? <Icon name={item.icon} size={18} /> : name}
          </button>
        );
      })}
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

/* ── Duration field ──────────────────────────────────────────────── */

/** The one run-length vocabulary users can CHOOSE: fixed presets only.
 *  "Custom" and "No end" are retired from creation (explicit marketing
 *  feedback — fixed durations guide users); "Custom" survives only as the
 *  honest representation of an already-saved non-preset schedule. */
export const DURATION_PRESETS = ["3 days", "7 days", "10 days"] as const;
export type DurationPreset = (typeof DURATION_PRESETS)[number] | "Custom";
const DURATION_PRESET_DAYS: Partial<Record<DurationPreset, number>> = {
  "3 days": 3,
  "7 days": 7,
  "10 days": 10,
};

/** End date a preset implies (inclusive span: "7 days" = start..start+6);
 *  the picked date for "Custom". */
export const durationEnd = (
  preset: DurationPreset,
  startAt: string,
  customEnd: string,
): string | undefined => {
  if (preset === "Custom") return customEnd || undefined;
  return startAt ? addDays(startAt, DURATION_PRESET_DAYS[preset]! - 1) : undefined;
};

/** The preset a saved schedule round-trips to — exact. A span no preset
 *  produces (or a legacy open end) reads back as Custom so the schedule
 *  editor states the record's truth instead of the nearest preset. */
export const durationPresetFor = (startAt?: string, endAt?: string): DurationPreset => {
  if (!startAt) return "7 days"; // nothing scheduled yet — the default
  if (!endAt) return "Custom";
  const days = daysBetween(startAt, endAt) + 1;
  const hit = (Object.entries(DURATION_PRESET_DAYS) as Array<[DurationPreset, number]>).find(
    ([, presetDays]) => presetDays === days,
  );
  return hit ? hit[0] : "Custom";
};

/** The one run-length control (create Campaign / create polst): fixed
 *  preset segments and an honest helper line saying exactly what the
 *  choice means. The Custom segment (with its date input) appears only
 *  when the schedule being edited already holds a non-preset span —
 *  creation never offers it. */
export function DurationField({
  value,
  onChange,
  customEnd,
  onCustomEndChange,
  startAt,
  subject,
}: {
  value: DurationPreset;
  onChange: (preset: DurationPreset) => void;
  customEnd: string;
  onCustomEndChange: (iso: string) => void;
  /** The run's start date (ISO), or "" when not set yet. */
  startAt: string;
  /** "campaign" | "polst" — the noun the helper line speaks. */
  subject: string;
}) {
  const end = durationEnd(value, startAt, customEnd);
  const line = end
    ? `Runs ${fmtDateRange(startAt || undefined, end)}. Voting closes when the ${subject} ends.`
    : value === "Custom"
      ? "Pick the last day voters can submit."
      : "Voting closes at the end of the run — set a start date to see it.";
  const tabs: DurationPreset[] =
    value === "Custom" ? [...DURATION_PRESETS, "Custom"] : [...DURATION_PRESETS];
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-display text-sm font-semibold leading-5 text-text-primary">
        How long should it run?
      </p>
      <SegmentedControl tabs={tabs} active={value} onChange={onChange} size="form" />
      {value === "Custom" ? (
        <div className="mt-2 max-w-56">
          <TextInput
            type="date"
            aria-label="End date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
          />
        </div>
      ) : null}
      <FieldHelper tone="neutral">{line}</FieldHelper>
    </div>
  );
}

/** The list action row OUTSIDE the table card (the StackAI register,
 *  and the same altitude as Home's date-range row): the compact search
 *  leads; selects, ranges, and toggles trail. */
export function TableToolbar({
  placeholder,
  query,
  onQueryChange,
  children,
  className,
}: {
  placeholder: string;
  query: string;
  onQueryChange: (next: string) => void;
  /** Trailing controls — status select, date range, view toggle. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 lg:flex-row lg:items-center", className)}>
      {/* The one search anatomy (the sidebar's), stretched — the row's
          full remaining width belongs to the query. */}
      <SearchField
        placeholder={placeholder}
        value={query}
        onChange={onQueryChange}
        className="lg:flex-1"
      />
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** The list-page toolbar. With `tabs`, status filters lead and search
 *  trails; without them (status lives in the page's HeaderTabs), the
 *  compact search leads the row Grok-style and extra controls trail. */
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
  tabs?: readonly string[];
  active?: string;
  onChange?: (tab: string) => void;
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
        "flex flex-col gap-3 border-b border-border-default px-4 py-3 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      {tabs && active && onChange ? (
        <FilterTabs tabs={tabs} active={active} onChange={onChange} />
      ) : null}
      <div className={cn("flex items-center gap-2", !tabs && "w-full lg:justify-between")}>
        <div className="w-full lg:w-72">
          <label htmlFor={searchId} className="sr-only">{placeholder}</label>
          <TextInput
            id={searchId}
            type="search"
            icon="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-8 text-sm"
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

/** Apply an inclusive created-date range (ISO bounds; "" = open). */
export function filterByCreated<T extends { createdAt: string }>(
  rows: T[],
  from: string,
  to: string,
): T[] {
  if (!from && !to) return rows;
  return rows.filter((r) => (!from || r.createdAt >= from) && (!to || r.createdAt <= to));
}

/* ── Data table ──────────────────────────────────────────────────── */

export type DataColumn<T> = {
  header: string;
  /** Optional metric definition, rendered as an ⓘ hover beside the
   *  header — funnel columns (Started, Finish rate) must be readable
   *  without leaving the table. */
  info?: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Right-align a column (numbers, row actions). */
  align?: "right";
  /** Sortable when present: the comparable value behind the cell. */
  sort?: (row: T) => string | number;
};

export type SortState = { key: string; dir: "asc" | "desc" };

/** Order rows by a column's `sort` accessor — exported so pages that
 *  paginate can sort the FULL list before slicing a page. */
export function sortRows<T>(
  rows: T[],
  columns: Array<DataColumn<T>>,
  sort: SortState | null,
): T[] {
  const col = sort ? columns.find((c) => c.header === sort.key) : undefined;
  if (!sort || !col?.sort) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = col.sort!(a);
    const vb = col.sort!(b);
    const cmp =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb));
    return cmp * dir;
  });
}

/** asc → desc → natural order, per click. */
const nextSort = (current: SortState | null, key: string): SortState | null =>
  current?.key !== key
    ? { key, dir: "asc" }
    : current.dir === "asc"
      ? { key, dir: "desc" }
      : null;

/** The one list primitive (Navattic anatomy): quiet 12px gray header
 *  labels — never uppercase — over ~52px rows (py-4 around a 20px text
 *  line), full-row hover tint, px-4 outer gutters flush with the card's
 *  padding. Typed columns, hover rows, honest empty label. */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  emptyLabel = "Nothing to show yet",
  sort: controlledSort,
  onSortChange,
}: {
  rows: T[];
  columns: Array<DataColumn<T>>;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
  /** Controlled sort — pass with onSortChange when the page must sort
   *  the full list itself (pagination). Omit both for internal sorting. */
  sort?: SortState | null;
  onSortChange?: (next: SortState | null) => void;
}) {
  const [internalSort, setInternalSort] = useState<SortState | null>(null);
  const sort = controlledSort !== undefined ? controlledSort : internalSort;
  const changeSort = onSortChange ?? setInternalSort;
  const sorted = controlledSort !== undefined ? rows : sortRows(rows, columns, sort);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-border-default text-xs text-text-secondary">
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.header ? sort.dir : undefined;
              const label = column.info ? (
                <span className="inline-flex items-center gap-1">
                  {column.header}
                  <InfoHint text={column.info} label={column.header} />
                </span>
              ) : (
                column.header
              );
              return (
                <th
                  key={column.header}
                  aria-sort={active ? (active === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(
                    "whitespace-nowrap px-3 py-3 font-medium first:pl-4 last:pr-4",
                    column.align === "right" && "text-right",
                    column.className,
                  )}
                >
                  {column.sort ? (
                    <button
                      type="button"
                      onClick={() => changeSort(nextSort(sort, column.header))}
                      className={cn(
                        "group/sort inline-flex items-center gap-0.5 transition-colors hover:text-text-primary",
                        active && "text-text-primary",
                      )}
                    >
                      {label}
                      <Icon
                        name={
                          active === "asc"
                            ? "arrow_upward"
                            : active === "desc"
                              ? "arrow_downward"
                              : "unfold_more"
                        }
                        size={14}
                        className={cn(
                          "shrink-0",
                          active
                            ? "text-icon-primary"
                            : "text-icon-tertiary opacity-0 transition-opacity group-hover/sort:opacity-100",
                        )}
                      />
                    </button>
                  ) : (
                    label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {sorted.length ? (
            sorted.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors hover:bg-surface-subtle",
                  onRowClick && "cursor-pointer",
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={cn(
                      "px-3 py-4 align-middle text-text-primary first:pl-4 last:pr-4",
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
              {/* Same ink and padding as EmptyState's title, so every
                  empty surface reads as one pattern. */}
              <td
                className="px-4 py-8 text-center text-sm font-medium text-text-primary"
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

/* ── Stats strip ─────────────────────────────────────────────────── */

/** The strip consumes the workspace's `Stat` — value, delta, real spark and
 *  real previous-period series — so no number here is synthesized. */
export type { Stat } from "@/lib/workspace";

/** Period-over-period change as a tinted pill, polarity at a glance:
 *  success when the metric rose, danger when it fell, quiet when there is
 *  no honest comparison (deltaParts' "—" rides the same neutral chip). The
 *  sign is spelled out (+/−) so colour never carries the reading alone. */
function DeltaChip({ delta, trend = "flat" }: { delta: string; trend?: Stat["trend"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-pill px-1.5 font-display text-xs font-medium tabular-nums",
        trend === "up" && "bg-status-success-soft text-status-success",
        trend === "down" && "bg-status-danger-soft text-status-danger",
        trend === "flat" && "bg-surface-subtle text-text-secondary",
      )}
    >
      {trend === "up" ? "+" : trend === "down" ? "−" : ""}
      {delta}
    </span>
  );
}

/** The fused KPI hero (Dub × Vercel): ONE card. The top strip is metric
 *  cells split by hairlines — 12px label, 24px tabular value, delta chip —
 *  and each cell is a tab: the active one carries a 2px accent underline
 *  (the strip's only violet; chart ink comes from charts.tsx) and picks
 *  which stat's TrendChart fills the card below. The chart is always on
 *  by default; `collapsible` pages fold it behind a chevron instead. A
 *  cell without its own series borrows the nearest stat that has one;
 *  the chart header names
 *  the series it actually draws, so the fallback never mislabels. The
 *  dashed previous-period line is the data layer's real previous series —
 *  when a stat carries none, the chart simply shows the current period. */
export function StatsStrip({
  stats,
  xTicks,
  scopeLabel,
  collapsible = false,
  className,
}: {
  stats: Stat[];
  xTicks: string[];
  /** The comparison window behind every delta — "vs previous 30 days". */
  scopeLabel?: string;
  /** Chart starts folded; a stat click opens it, the chevron folds it.
   *  Home keeps the always-on chart — this is for quieter pages. */
  collapsible?: boolean;
  className?: string;
}) {
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState(!collapsible);
  const active = stats[sel] ?? stats[0];
  const chartStat = active.spark?.length ? active : stats.find((s) => s.spark?.length);
  // A "%"-valued stat charts as a rate: its y-axis and hover chip say so.
  const format = chartStat?.value.trim().endsWith("%")
    ? (v: number) => `${Math.round(v * 10) / 10}%`
    : undefined;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-card border border-border-default bg-surface-raised shadow-sm",
        className,
      )}
    >
      <div className={cn("grid grid-cols-2 lg:grid-cols-4", open && "border-b border-border-default")}>
        {stats.map((stat, i) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => {
              setSel(i);
              if (collapsible && !open) setOpen(true);
            }}
            aria-pressed={i === sel}
            className={cn(
              // Hairline dividers: left of every in-row neighbour, above the
              // second row of the 2-up wrap below lg (one row at lg).
              "relative border-border-default px-4 py-3 text-left transition-colors hover:bg-surface-subtle",
              i % 2 === 1 && "border-l",
              i >= 2 && "max-lg:border-t lg:border-l",
            )}
          >
            <span className="block truncate text-xs font-semibold text-text-secondary">
              {stat.label}
            </span>
            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-display text-2xl font-semibold leading-8 tracking-tight tabular-nums text-text-primary">
                {stat.value}
              </span>
              <DeltaChip delta={stat.delta} trend={stat.trend} />
            </span>
            {stat.detail ? (
              <span className="mt-0.5 block truncate text-xs text-text-tertiary">
                {stat.detail}
              </span>
            ) : null}
            {i === sel && open ? (
              // The active tab's 2px accent underline, flush with the strip's
              // bottom hairline — tab semantics, not border-colour semantics.
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 border-b-2 border-accent-default"
              />
            ) : null}
          </button>
        ))}
      </div>
      {collapsible && !open ? (
        // Folded: the corner chevron is the visible way in (a stat click
        // opens too, selecting its series on the way).
        <Button
          variant="ghost"
          size="icon"
          aria-label="Show chart"
          onClick={() => setOpen(true)}
          className="absolute right-2 top-2 h-6 w-6 text-icon-secondary"
        >
          <Icon name="keyboard_arrow_down" size={18} />
        </Button>
      ) : null}

      {open ? (
        <div className="pt-3">
          {/* The chart names the series it draws; the metric's definition
              rides a visible ⓘ, not a title=. */}
          <div className="mb-2 flex items-center justify-between gap-3 px-4">
            <span className="flex items-center gap-1 text-xs font-semibold text-text-secondary">
              {chartStat?.label ?? active.label}
              {chartStat?.info ? <InfoHint text={chartStat.info} /> : null}
            </span>
            <span className="flex items-center gap-2">
              {scopeLabel ? <span className="text-xs text-text-tertiary">{scopeLabel}</span> : null}
              {collapsible ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Hide chart"
                  onClick={() => setOpen(false)}
                  className="h-6 w-6 text-icon-secondary"
                >
                  <Icon name="keyboard_arrow_up" size={18} />
                </Button>
              ) : null}
            </span>
          </div>
          <TrendChart
            series={chartStat?.spark ?? []}
            previous={chartStat?.previous}
            annotations={chartStat?.annotations}
            xTicks={xTicks}
            format={format}
            className="px-2 pb-3"
          />
        </div>
      ) : null}
    </section>
  );
}

/* ── Guidance cards (Home / Insights) ────────────────────────────── */

type Cta = { label: string; onClick?: () => void; to?: string };

export type CardTone = "accent" | "green" | "amber" | "red" | "neutral";

/** The one tone → wash map for card visuals (media placeholders and any
 *  future toned tile). Status colors never leave this recipe. */
const CARD_TONES: Record<CardTone, string> = {
  accent: "bg-accent-soft text-accent-default",
  green: "bg-status-success-soft text-status-success",
  red: "bg-status-danger-soft text-status-danger",
  amber: "bg-surface-subtle text-text-secondary",
  neutral: "bg-surface-subtle text-icon-secondary",
};

/** A full-bleed card image. Authored to 3:4 (side) / 16:9 (bottom); the
 *  container object-covers, so any close ratio crops cleanly. Until real art
 *  lands, a tone-wash placeholder (soft fill + glyph) stands in. */
export type CardMedia = {
  src?: string;
  alt?: string;
  tone?: CardTone;
  icon?: string;
  placement?: "side" | "bottom";
  /** Crop anchor for the image — "right" keeps a right-weighted
   *  illustration in frame (and leaves room for an overlaid action). */
  align?: "center" | "right";
};

/** Fills its box with the image on the card's own surface, or the
 *  tone-wash + glyph placeholder when there's no src. */
export function MediaFill({ media, className }: { media: CardMedia; className?: string }) {
  return (
    <div
      aria-hidden={!media.src}
      className={cn("relative overflow-hidden", !media.src && CARD_TONES[media.tone ?? "neutral"], className)}
    >
      {media.src ? (
        <img
          src={media.src}
          alt={media.alt ?? ""}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            media.align === "right" && "object-right",
          )}
        />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <Icon name={media.icon ?? "image"} size={40} filled />
        </div>
      )}
    </div>
  );
}

/** The one 16px completion ring (setup cards, checklist headers). Pass
 *  `steps` and hovering anywhere on the parent card (which carries `group`)
 *  reveals the steps still left; omit it for a plain ring. `r` tunes the
 *  ring's weight inside the same 24-unit box. */
export function ProgressRing({
  done,
  total,
  steps,
  r = 9,
}: {
  done: number;
  total: number;
  steps?: string[];
  r?: number;
}) {
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
      {steps?.length ? (
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
      ) : null}
    </div>
  );
}

/** The one card for every actionable surface on Home & Insights: an optional
 *  eyebrow / status / right-hand meta, a title, a 14/20 line of copy, an
 *  optional media fill, and a CTA pinned bottom-left. No header rule, no
 *  item borders — one consistent shape everywhere. */
export function ActionCard({
  eyebrow,
  title,
  reason,
  status,
  meta,
  primary,
  secondary,
  media,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  reason?: string;
  status?: Status;
  meta?: ReactNode;
  primary?: Cta;
  secondary?: Cta;
  media?: CardMedia;
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
            {eyebrow ? (
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-xs font-semibold text-text-secondary">{eyebrow}</span>
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
          <MediaFill media={media} className="w-2/5 max-w-56 shrink-0 self-stretch" />
        )
      ) : null}
    </section>
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

/* ── Campaigns & polsts lists (Home) ─────────────────────────────── */

/** Split thumbnail for a polst — the real option pair either side of the
 *  OR disc, in miniature (the MiniPoll thumb anatomy). */
export function PollThumb({ options }: { options: [PollOption, PollOption] }) {
  return (
    <div className="relative grid h-14 w-14 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-md bg-surface-strong">
      <img src={options[0].image} alt="" className="h-full w-full object-cover" />
      <img src={options[1].image} alt="" className="h-full w-full object-cover" />
      <span className="absolute left-1/2 top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-surface-raised font-display text-micro font-semibold text-text-primary shadow-sm">
        OR
      </span>
    </div>
  );
}

/** A campaign's chain at a glance: the first three polsts as split A/B
 *  minis, slightly overlapping like an avatar stack, then a "+N" chip for
 *  the rest. Every image resolves through `polstImage`, the same assigner
 *  the full-size thumbs use. Row-height (h-8) for lists and tables. */
export function ThumbStrip({ ids, className }: { ids: string[]; className?: string }) {
  if (!ids.length) return <span className="text-sm text-text-tertiary">—</span>;
  const shown = ids.slice(0, 3);
  const more = ids.length - shown.length;
  return (
    <div className={cn("flex items-center", className)} aria-label={`${ids.length} polsts`}>
      {shown.map((id, i) => (
        <span
          key={id}
          className={cn(
            "grid h-8 w-8 shrink-0 grid-cols-2 overflow-hidden rounded-md bg-surface-strong ring-2 ring-surface-raised",
            i > 0 && "-ml-2",
          )}
        >
          <img src={polstImage(id, "a", 120, 160)} alt="" className="h-full w-full object-cover" />
          <img src={polstImage(id, "b", 120, 160)} alt="" className="h-full w-full object-cover" />
        </span>
      ))}
      {more > 0 ? (
        <span className="-ml-2 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-subtle font-display text-xs font-semibold text-text-secondary ring-2 ring-surface-raised">
          +{more}
        </span>
      ) : null}
    </div>
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
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary">
            <ProgressRing done={done} total={steps.length} />
            {done} of {steps.length} tasks complete
          </div>
          <h2 className="font-display text-base font-semibold leading-6 text-text-primary">{title}</h2>
          {intro && !collapsed ? (
            <p className="mt-1 text-sm leading-5 text-text-secondary">{intro}</p>
          ) : null}
        </div>
        <IconButton
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand" : "Collapse"}
          aria-expanded={!collapsed}
        >
          <Icon name={collapsed ? "expand_more" : "expand_less"} size={20} />
        </IconButton>
      </div>

      {!collapsed ? (
        // Rows bleed 8px past the card's content edge (the Campaigns-card row
        // pattern): bullets align with the header above, backgrounds don't.
        <ol className="-mx-2 mt-3 space-y-0.5">
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
                        "flex w-full items-start gap-3 px-2 py-2 text-left transition-colors",
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
                    <MediaFill media={step.media} className="w-2/5 max-w-56 shrink-0 self-stretch" />
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

/* ── In-page tabs (detail pages) ─────────────────────────────────── */

/** Local section tabs (e.g. campaign Overview / polsts / Distribution) — the
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

/** Splits a windowTileDelta detail ("12% vs Jun 1 – Jun 7") into the chip's
 *  figure and its comparison caption. A non-delta detail (a source's name,
 *  "3 unassigned") deliberately doesn't match and stays plain text. */
const DELTA_DETAIL = /^(\d+(?:\.\d+)?%)(?:\s+(.*))?$/;

/** The one KPI tile (Distribution / Audience / Usage headline rows):
 *  quiet label, display number, and the same DeltaChip the hero strip
 *  wears — every KPI reads alike. */
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
        (() => {
          const parts = detail.match(DELTA_DETAIL);
          return parts || trend !== "flat" ? (
            <p className="mt-2 flex flex-wrap items-center gap-1.5">
              <DeltaChip delta={parts ? parts[1] : detail} trend={trend} />
              {parts?.[2] ? (
                <span className="text-xs text-text-secondary">{parts[2]}</span>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 text-sm font-medium text-text-secondary">{detail}</p>
          );
        })()
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

/** The largest absolute loss between consecutive steps (ties go to the
 *  earliest) — exported so a caller can speak the drop in prose. */
export function biggestFunnelDrop(
  steps: FunnelStep[],
): { index: number; lost: number; pct: number } | null {
  let index = -1;
  let lost = 0;
  steps.forEach((step, i) => {
    if (i === 0) return;
    const drop = steps[i - 1].count - step.count;
    if (drop > lost) {
      lost = drop;
      index = i;
    }
  });
  if (index === -1) return null;
  const prev = steps[index - 1].count;
  return { index, lost, pct: prev > 0 ? Math.round((lost / prev) * 100) : 0 };
}

/** The campaign journey as a REAL conversion funnel: label · bar · share
 *  of starters, with the between-step loss spoken on its own line and
 *  the biggest drop flagged. First step is the neutral baseline, middle
 *  steps accent, the finish success — read top to bottom like the voter
 *  experienced it. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.count || 1;
  const biggest = biggestFunnelDrop(steps);
  return (
    <ol>
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].count : step.count;
        const lost = prev - step.count;
        const dropPct = prev > 0 ? Math.round((lost / prev) * 100) : 0;
        const isBiggest = biggest?.index === i;
        const isLast = i === steps.length - 1;
        const width = Math.max(2, Math.round((step.count / max) * 100));
        // The count rides inside the bar when it fits, outside when not.
        const countInside = width >= 18;
        return (
          <li key={step.label} className="grid grid-cols-[minmax(96px,180px)_1fr_auto] items-center gap-x-3">
            {/* Between-step loss row — the funnel's story lives here. */}
            {i > 0 ? (
              <span
                className={cn(
                  "col-start-2 flex items-center gap-1.5 py-1 text-xs tabular-nums",
                  isBiggest && lost > 0
                    ? "font-semibold text-status-danger"
                    : "text-text-tertiary",
                )}
              >
                {lost > 0 ? (
                  <>
                    <Icon name="south" size={12} />−{formatNumber(lost)} · −{dropPct}%
                    {isBiggest ? (
                      <Chip tone="danger" className="ml-1">
                        Biggest drop
                      </Chip>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Icon name="east" size={12} />
                    held every voter
                  </>
                )}
              </span>
            ) : null}
            <span
              className={cn(
                "min-w-0 truncate text-right text-sm text-text-secondary",
                i > 0 && "row-start-2",
              )}
              title={step.label}
            >
              {step.label}
            </span>
            <span className={cn("flex min-w-0 items-center gap-2", i > 0 && "row-start-2")}>
              <span
                className={cn(
                  "flex h-7 items-center overflow-hidden rounded-md",
                  i === 0
                    ? "bg-surface-strong"
                    : isLast
                      ? "bg-status-success"
                      : "bg-accent-default",
                )}
                style={{ width: `${width}%` }}
              >
                {countInside ? (
                  <span
                    className={cn(
                      "px-2.5 text-xs font-semibold tabular-nums",
                      i === 0 ? "text-text-primary" : "text-text-inverse",
                    )}
                  >
                    {formatNumber(step.count)}
                  </span>
                ) : null}
              </span>
              {!countInside ? (
                <span className="shrink-0 text-xs font-semibold tabular-nums text-text-primary">
                  {formatNumber(step.count)}
                </span>
              ) : null}
            </span>
            <span
              className={cn(
                "shrink-0 text-right text-xs font-medium tabular-nums",
                i > 0 && "row-start-2",
                isLast ? "text-status-success" : "text-text-secondary",
              )}
            >
              {Math.round((step.count / max) * 100)}%
            </span>
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
    <ul className={cn("space-y-1", className)}>
      {slices.map((slice) => (
        // The Dub bar-row: the share renders as a soft accent wash *behind*
        // the row's own label and number, so the list stays one line per
        // slice. Bars scale to 100%, never to the largest slice — a 48%
        // share must read as 48%, or the chart lies.
        <li key={slice.label} className="relative overflow-hidden rounded-sm">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-sm bg-accent-soft"
            style={{ width: `${Math.min(100, Math.max(0, slice.value))}%` }}
          />
          <div className="relative flex items-baseline justify-between gap-3 px-2.5 py-2 text-sm">
            <span className="min-w-0 truncate font-medium text-text-primary">{slice.label}</span>
            <span className="flex shrink-0 items-baseline gap-2">
              {slice.detail ? (
                <span className="text-xs text-text-tertiary">{slice.detail}</span>
              ) : null}
              <span className="font-semibold tabular-nums text-text-primary">{slice.value}%</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Snippet card ────────────────────────────────────────────────── */

/** A labeled code block with a copy affordance — embed snippets, share
 *  links. Copy writes the real clipboard and the toast reports what
 *  actually happened. */
export function SnippetCard({
  title,
  description,
  code,
  className,
}: {
  title: string;
  description?: string;
  code: string;
  /** Standalone (page-level) call sites pass card chrome; inside a card
   *  the default subtle inset stands. */
  className?: string;
}) {
  const toast = useToast();
  return (
    <div className={cn("rounded-md border border-border-default bg-surface-subtle", className)}>
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
          onClick={async () =>
            toast(
              (await copyText(code)) ? `${title} copied` : "Couldn't copy — try again",
            )
          }
        >
          <Icon name="content_copy" size={18} />
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

/** A gated capability: quiet surface, lock icon, one line on what's
 *  missing, and a state chip. The chip is required and must state a fact
 *  ("Not connected") — "Coming soon" roadmap promises are retired; a
 *  capability we can't honestly gate simply doesn't render. */
export function LockedCard({
  title,
  description,
  chip,
  className,
}: {
  title: string;
  description: string;
  chip: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border border-dashed border-border-strong bg-surface-subtle p-4",
        className,
      )}
    >
      <IconTile size={9} className="bg-surface-strong">
        <Icon name="lock" size={20} />
      </IconTile>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm font-semibold text-text-primary">{title}</p>
          {/* Steps one fill above the card's subtle surface so it stays visible. */}
          <Chip className="bg-surface-strong">{chip}</Chip>
        </div>
        <p className="mt-1 text-sm leading-5 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

/* ── Split bar ───────────────────────────────────────────────────── */

/** The polst signature for any two-part share: one bar, two segments
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
                aria-label={`${days[d]} ${buckets[b]} — ${formatNumber(value)} votes`}
                title={`${days[d]} ${buckets[b]} — ${formatNumber(value)} votes`}
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
 *  section. No OAuth flow exists in this mockup, so Connect refuses in the
 *  demo voice — a toast never claims a window that will not open. */
export function ConnectCard({ integration }: { integration: Integration }) {
  const toast = useToast();
  return (
    // min-w-0: as a grid item this card must shrink to its track — without
    // it the nowrap name/action row forces the card wider than the column
    // and the parent card's overflow-hidden clips the Connect button.
    // Card chrome — every ConnectCard now sits directly on the page
    // (integration grids under a SectionHeader), never inside a card.
    <div className="flex min-w-0 items-center gap-3 rounded-card border border-border-default bg-surface-raised p-4 shadow-sm">
      <IconTile size={10} className="text-icon-primary">
        <Icon name={integration.icon} size={22} />
      </IconTile>
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
          onClick={() => toast(`Connecting ${integration.name} is disabled in this demo workspace`)}
        >
          Connect
        </Button>
      )}
    </div>
  );
}

/* ── Filter bar ──────────────────────────────────────────────────── */

export type DateRangeValue = WindowRange;

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
  categories,
  channels,
  className,
}: {
  filters: AnalyticsFilters;
  onChange: (next: AnalyticsFilters) => void;
  categories?: string[];
  channels?: string[];
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
      {categories?.length ? (
        <SelectMenu
          label="Category"
          value={filters.category}
          onValueChange={(category) => onChange({ ...filters, category })}
          options={["All categories", ...categories].map((name) => ({ value: name, label: name }))}
          align="end"
          compact
        />
      ) : null}
    </div>
  );
}
