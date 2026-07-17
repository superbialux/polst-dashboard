import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Menu, MenuItem } from "@/components/Menu";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard, useToast } from "@/components/Toast";
import {
  Chip,
  ConnectCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  EmptyState,
  FilterBar,
  InfoHint,
  InsightGrid,
  LockedCard,
  MixBars,
  Pager,
  PolstListRow,
  RateCell,
  ReadyDecisionRow,
  ReportPreview,
  SearchAndFilters,
  SectionGrid,
  SectionTitle,
  StatsStrip,
  StatusBadge,
  ThumbStrip,
  TrendGrid,
  type DataColumn,
} from "@/components/dashboard";
import {
  INSIGHT_STATE_TONE,
  campaignReadout,
  dataThrough,
  deriveInsights,
  deriveTrends,
  insightStateFor,
  qualifiesForInsights,
  type InsightState,
} from "@/lib/insights";
import {
  METRIC_INFO,
  TODAY,
  fmtDate,
  fmtDateRange,
  fmtInt,
  fmtPct,
  isReadyToDecide,
  pct,
  type Status,
} from "@/lib/canon";
import {
  allocate,
  dateSpan,
  windowBounds,
  windowDelta,
  type WindowRange,
} from "@/lib/engine";
import {
  CAMPAIGNS,
  INTEGRATIONS,
  REPORTS,
  SINGLE_POLSTS,
  STAT_XTICKS,
  WORKSPACE,
  campaignSeries,
  polstOptions,
  polstSeries,
  readyTitle,
  winnerLabel,
  type Campaign,
  type SeriesMetric,
  type SinglePolst,
  type Stat,
  type WorkspaceReport,
} from "@/lib/workspace";
import {
  ANALYTICS_CHANNELS,
  ANALYTICS_CATEGORIES,
  analyticsRows,
  mixBy,
  segmentTotal,
  categoryRows,
  type AnalyticsFilters,
  type SegmentRow,
  type CategoryRow,
} from "@/lib/analytics";
import { type PollOption } from "@/lib/poll";
import { useAnalytics } from "@/lib/analytics-context";
import { useModules } from "@/lib/modules";
import { useWorkspace } from "@/lib/store";

/* ── Shared scaffolding ──────────────────────────────────────────── */

function AnalyticsFilterBar() {
  const { filters, setFilters } = useAnalytics();
  return (
    <FilterBar
      filters={filters}
      onChange={setFilters}
      channels={ANALYTICS_CHANNELS}
      categories={ANALYTICS_CATEGORIES}
    />
  );
}

/** The one filtered-out state: what happened and the way back. */
function EmptyAnalytics() {
  const { resetFilters } = useAnalytics();
  return (
    <DashboardCard>
      <EmptyState
        icon="filter_alt_off"
        title="No activity matches these filters"
        hint="Nothing collected votes in this window for the selected channel and category."
        action={{ label: "Reset filters", onClick: resetFilters }}
      />
    </DashboardCard>
  );
}

/** One CSV cell, quoted only when it must be. */
const csvCell = (value: string | number) => {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** A real file download: rows → CSV blob → the browser's save flow. */
function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Header export: a real copy, a real CSV file, and a real print (the
 *  browser's save-as-PDF path) — every artifact named, never fake. */
function ExportMenu({
  summary,
  csv,
}: {
  summary: () => string;
  /** The page's tabular data; present when a CSV makes sense. */
  csv?: () => { filename: string; rows: Array<Array<string | number>> };
}) {
  const copy = useCopyToClipboard();
  const toast = useToast();
  return (
    <Menu
      label="Export"
      trigger={({ toggle }) => (
        <Button variant="secondary" onClick={toggle}>
          <Icon name="ios_share" size={18} />
          Export
        </Button>
      )}
    >
      <MenuItem
        icon="content_copy"
        label="Copy summary"
        onClick={() => void copy(summary(), "Summary copied to clipboard")}
      />
      {csv ? (
        <MenuItem
          icon="download"
          label="Download CSV"
          onClick={() => {
            const { filename, rows } = csv();
            downloadCsv(filename, rows);
            toast(`Downloaded ${filename}`);
          }}
        />
      ) : null}
      <MenuItem icon="print" label="Print / save as PDF" onClick={() => window.print()} />
    </Menu>
  );
}

/** "Jun 9 – Jun 15 · Email · Food & drink" — the scope behind a summary. */
function scopeLine(filters: AnalyticsFilters): string {
  const [start, end] = windowBounds(filters.range);
  return [
    `${fmtDate(start)} – ${fmtDate(end)}`,
    filters.channel !== "All channels" ? filters.channel : null,
    filters.category !== "All categories" ? filters.category : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/* ── Windowed series (derived, never fabricated) ─────────────────────
   Every object's daily votes come from the same series the Home stats
   read; a channel/category filter keeps each object's share by exact
   integer allocation, so the chart total equals the table totals. */

const OBJECTS = new Map<string, { kind: "campaign" | "polst"; object: Campaign | SinglePolst }>([
  ...CAMPAIGNS.map((c) => [c.id, { kind: "campaign" as const, object: c }] as const),
  ...SINGLE_POLSTS.map((p) => [p.id, { kind: "polst" as const, object: p }] as const),
]);

function scopedDailySeries(
  rows: SegmentRow[],
  range: WindowRange,
  metric: SeriesMetric,
  offset = 0,
): number[] {
  const [start, end] = windowBounds(range, offset);
  const days = dateSpan(start, end);
  const totals = days.map(() => 0);
  const byObject = new Map<string, number>();
  for (const row of rows) {
    byObject.set(row.objectId, (byObject.get(row.objectId) ?? 0) + row.metrics[metric]);
  }
  for (const [objectId, scopedTotal] of byObject) {
    const entry = OBJECTS.get(objectId);
    if (!entry) continue;
    const series =
      entry.kind === "campaign"
        ? campaignSeries(entry.object as Campaign, metric)
        : polstSeries(entry.object as SinglePolst, metric);
    const daily = days.map((iso) => {
      const i = series.dates.indexOf(iso);
      return i === -1 ? 0 : series.values[i];
    });
    const windowTotal = daily.reduce((a, b) => a + b, 0);
    const allocated = windowTotal === scopedTotal ? daily : allocate(scopedTotal, daily);
    allocated.forEach((v, i) => {
      totals[i] += v;
    });
  }
  return totals;
}

/** Daily rate series (%, 1dp) from two count series — the same votes/views
 *  arithmetic the headline rates use, per day, guarded where the
 *  denominator is empty. */
const rateSeries = (numer: number[], denom: number[]): number[] =>
  numer.map((v, i) => (denom[i] > 0 ? Math.round((v / denom[i]) * 1000) / 10 : 0));

/* ── Overview ────────────────────────────────────────────────────── */

type CampaignPerfRow = {
  id: string;
  name: string;
  status: Status;
  /** The chain's polst ids, for the same ThumbStrip the Campaigns list shows. */
  chainIds: string[];
  voters: number;
  completed: number;
};

function buildCampaignPerf(rows: SegmentRow[], campaigns: Campaign[]): CampaignPerfRow[] {
  const grouped = new Map<string, { voters: number; completed: number }>();
  for (const row of rows) {
    if (row.kind !== "campaign") continue;
    const g = grouped.get(row.objectId) ?? { voters: 0, completed: 0 };
    g.voters += row.metrics.voters;
    g.completed += row.metrics.completed;
    grouped.set(row.objectId, g);
  }
  return [...grouped.entries()]
    .flatMap(([id, m]) => {
      const campaign = campaigns.find((c) => c.id === id) ?? CAMPAIGNS.find((c) => c.id === id);
      if (!campaign) return [];
      return [
        {
          id,
          name: campaign.name,
          status: campaign.status,
          chainIds: campaign.chain.map((q) => q.id),
          voters: m.voters,
          completed: m.completed,
        },
      ];
    })
    .sort((a, b) => b.voters - a.voters);
}

const campaignPerfColumns: Array<DataColumn<CampaignPerfRow>> = [
  {
    header: "Campaign",
    cell: (row) => (
      <span className="flex min-w-0 items-center gap-3">
        <ThumbStrip ids={row.chainIds} className="shrink-0" />
        <Link
          to={`/campaigns/${row.id}`}
          className="min-w-0 truncate font-display font-semibold text-text-primary hover:text-text-accent"
        >
          {row.name}
        </Link>
      </span>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  /* Funnel facts only — the same Started/Completed/Finish-rate contract
     as the Campaigns index. Interpretation lives in campaign Insights. */
  {
    header: "Started",
    info: METRIC_INFO.started,
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtInt(row.voters)}</span>,
  },
  {
    header: "Completed",
    info: METRIC_INFO.completed,
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtInt(row.completed)}</span>,
  },
  {
    header: "Finish rate",
    info: METRIC_INFO.finishRate,
    align: "right",
    cell: (row) => <span className="tabular-nums">{pct(row.completed, row.voters)}</span>,
  },
];

type PolstPerfRow = {
  id: string;
  question: string;
  /** The real option pair (label · image), for the shared PolstListRow. */
  options: [PollOption, PollOption];
  views: number;
  votes: number;
};

function buildPolstPerf(rows: SegmentRow[], polsts: SinglePolst[]): PolstPerfRow[] {
  const grouped = new Map<string, { views: number; votes: number }>();
  for (const row of rows) {
    if (row.kind !== "polst") continue;
    const g = grouped.get(row.objectId) ?? { views: 0, votes: 0 };
    g.views += row.metrics.views;
    g.votes += row.metrics.votes;
    grouped.set(row.objectId, g);
  }
  return [...grouped.entries()]
    .flatMap(([id, m]) => {
      const polst = polsts.find((p) => p.id === id) ?? SINGLE_POLSTS.find((p) => p.id === id);
      if (!polst) return [];
      return [
        { id, question: polst.question, options: polstOptions(polst), views: m.views, votes: m.votes },
      ];
    })
    .sort((a, b) => b.views - a.views);
}

const polstPerfColumns: Array<DataColumn<PolstPerfRow>> = [
  {
    header: "Polst",
    cell: (row) => (
      <PolstListRow options={row.options} question={row.question} to={`/polsts/${row.id}`} />
    ),
  },
  {
    header: "Views",
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtInt(row.views)}</span>,
  },
  {
    header: "Votes",
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtInt(row.votes)}</span>,
  },
  {
    header: "Votes / view",
    align: "right",
    cell: (row) => <span className="tabular-nums">{pct(row.votes, row.views, 1)}</span>,
  },
];

const categoryColumns: Array<DataColumn<CategoryRow>> = [
  {
    header: "Category",
    cell: (row) => (
      <span className="font-display font-semibold text-text-primary">{row.category}</span>
    ),
  },
  {
    header: "Voters",
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtInt(row.voters)}</span>,
  },
  {
    // Tables speak whole percents (the campaigns list, campaign sources,
    // Distribution); one decimal is reserved for the rate stat tiles.
    header: "Completion",
    align: "right",
    cell: (row) => RateCell(row.completionRate),
  },
  {
    // An aggregate across every content in the category — canon's
    // "engagement rate", not the per-content "votes / view".
    header: "Engagement",
    align: "right",
    cell: (row) => (
      <span className="tabular-nums">
        {row.engagementRate !== null ? fmtPct(row.engagementRate, 1) : "—"}
      </span>
    ),
  },
];

/** The Home ready-state vocabulary, windowless: entity truth per row. An
 *  Ended run's results are in ("Results ready" → report); a live run states
 *  its evidence fact ("Target reached" / "Strong lead"), never a claim its
 *  lifecycle contradicts. */
function ReadyToDecideList({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <ul className="divide-y divide-border-default">
      {campaigns.map((campaign) => (
        <ReadyDecisionRow
          key={campaign.id}
          layout="row"
          eyebrow={readyTitle(campaign)}
          title={campaign.name}
          to={`/campaigns/${campaign.id}`}
          sublabel={`${winnerLabel(campaign)} · ${fmtInt(campaign.voters)} voters${
            campaign.target ? ` of ${fmtInt(campaign.target)} target` : ""
          } · run to date`}
          confidence={campaign.confidence !== "—" ? campaign.confidence : undefined}
          confidenceInfo={METRIC_INFO.confidence}
          cta={{
            label: campaign.status === "Ended" ? "Open report" : "Review decision",
            to: `/campaigns/${campaign.id}`,
          }}
        />
      ))}
    </ul>
  );
}

export function AnalyticsOverviewPage() {
  const { filters, rows } = useAnalytics();
  const { campaigns, polsts, sources } = useWorkspace();

  /* The interpretation layer lives on Overview — workspace-wide trends
     and cross-object findings are comparison work (the audit's division:
     Insights is campaign-by-campaign only). Both state their own window
     (7D vs 30D), independent of the filter bar. */
  const trends = useMemo(() => deriveTrends(campaigns, polsts), [campaigns, polsts]);
  const insights = useMemo(
    () => deriveInsights(campaigns, polsts, sources),
    [campaigns, polsts, sources],
  );

  const views = segmentTotal(rows, "views");
  const votes = segmentTotal(rows, "votes");
  const voters = segmentTotal(rows, "voters");
  const completed = segmentTotal(rows, "completed");

  /* The previous window of equal length under the same filters — the same
     vs-previous contract Home's stat strip states for these four metrics. */
  const prevRows = useMemo(
    () => (filters.range === "All" ? null : analyticsRows(filters, 1)),
    [filters],
  );
  const [prevStart, prevEnd] = windowBounds(filters.range, 1);
  const prev = prevRows
    ? {
        views: segmentTotal(prevRows, "views"),
        votes: segmentTotal(prevRows, "votes"),
        voters: segmentTotal(prevRows, "voters"),
        completed: segmentTotal(prevRows, "completed"),
      }
    : null;
  /* A stated baseline needs at least one surviving comparison: views bound
     every other metric, so when the previous window's views fall under
     windowDelta's honesty floor no tile can show a delta — the label and
     the dashed previous line are withheld rather than decorating zeros. */
  const comparable = prev !== null && windowDelta(views, prev.views) !== null;
  const compareLabel = comparable ? `vs ${fmtDate(prevStart)} – ${fmtDate(prevEnd)}` : null;
  const rate = (numer: number, denom: number) => (denom > 0 ? (numer / denom) * 100 : null);
  const engagement = rate(votes, views);
  const prevEngagement = prev ? rate(prev.votes, prev.views) : null;
  const completion = rate(completed, voters);
  const prevCompletion = prev ? rate(prev.completed, prev.voters) : null;

  const ready = useMemo(() => {
    const inScope = new Set(rows.filter((r) => r.kind === "campaign").map((r) => r.objectId));
    return campaigns.filter((c) => isReadyToDecide(c) && inScope.has(c.id));
  }, [rows, campaigns]);

  /* Every hero metric charts its own windowed series under the same
     filters; the rates derive per-day from the two count series they are
     defined by — nothing synthesized. */
  const daily = useMemo(
    () => ({
      views: scopedDailySeries(rows, filters.range, "views"),
      votes: scopedDailySeries(rows, filters.range, "votes"),
      voters: scopedDailySeries(rows, filters.range, "voters"),
      completed: scopedDailySeries(rows, filters.range, "completed"),
    }),
    [rows, filters.range],
  );
  const prevDaily = useMemo(
    () =>
      prevRows && comparable
        ? {
            views: scopedDailySeries(prevRows, filters.range, "views", 1),
            votes: scopedDailySeries(prevRows, filters.range, "votes", 1),
            voters: scopedDailySeries(prevRows, filters.range, "voters", 1),
            completed: scopedDailySeries(prevRows, filters.range, "completed", 1),
          }
        : null,
    [prevRows, comparable, filters.range],
  );
  /* The hero strip's Stat shape — the exact totals and deltas the four
     tiles carried (same windowDelta arithmetic windowTileDelta used),
     with each metric's own windowed series behind the fused chart. */
  const heroDelta = (
    current: number,
    previous: number | null | undefined,
  ): Pick<Stat, "delta" | "trend"> => {
    const d = comparable && previous != null ? windowDelta(current, previous) : null;
    return {
      delta: d === null ? "—" : `${Math.abs(d)}%`,
      trend: d === null || d === 0 ? "flat" : d > 0 ? "up" : "down",
    };
  };
  const heroStats: Stat[] = [
    {
      label: "Total views",
      value: fmtInt(views),
      ...heroDelta(views, prev?.views),
      info: METRIC_INFO.views,
      spark: daily.views,
      previous: prevDaily?.views,
    },
    {
      label: "Total votes",
      value: fmtInt(votes),
      ...heroDelta(votes, prev?.votes),
      info: METRIC_INFO.votes,
      spark: daily.votes,
      previous: prevDaily?.votes,
    },
    {
      label: "Engagement rate",
      value: pct(votes, views, 1),
      ...heroDelta(engagement ?? 0, prevEngagement),
      info: METRIC_INFO.engagementRate,
      spark: rateSeries(daily.votes, daily.views),
      previous: prevDaily ? rateSeries(prevDaily.votes, prevDaily.views) : undefined,
    },
    {
      label: "Completion rate",
      value: pct(completed, voters, 1),
      ...heroDelta(completion ?? 0, prevCompletion),
      info: METRIC_INFO.completionRate,
      spark: rateSeries(daily.completed, daily.voters),
      previous: prevDaily ? rateSeries(prevDaily.completed, prevDaily.voters) : undefined,
    },
  ];

  const sourceMix = useMemo(() => mixBy(rows, (row) => row.channel, "voters"), [rows]);
  const categories = useMemo(() => categoryRows(rows), [rows]);
  const campaignPerf = useMemo(() => buildCampaignPerf(rows, campaigns), [rows, campaigns]);
  const polstPerf = useMemo(() => buildPolstPerf(rows, polsts), [rows, polsts]);

  const summary = () =>
    [
      `${WORKSPACE.brand} — analytics (${scopeLine(filters)})`,
      `Views ${fmtInt(views)} · Votes ${fmtInt(votes)} · Engagement ${pct(votes, views, 1)} · Completion ${pct(completed, voters, 1)}`,
      ...ready.map(
        (c) =>
          `${readyTitle(c)}: ${c.name} — ${winnerLabel(c)} (${fmtInt(c.voters)} voters run to date)`,
      ),
      ...trends.map((t) => `${t.metric}: ${t.coaching}`),
      ...insights.map((i) => `${i.question} ${i.evidence}`),
    ].join("\n");

  /* The CSV carries exactly what the page shows for the visible scope —
     the totals and both performance tables — never a wider export than
     the filters state (the artifact must match the screen). */
  const csv = () => ({
    filename: `polst-analytics-${scopeLine(filters).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`,
    rows: [
      ["Scope", scopeLine(filters)],
      [],
      ["Metric", "Value"],
      ["Total views", views],
      ["Total votes", votes],
      ["Voters", voters],
      ["Completed", completed],
      ["Engagement rate", pct(votes, views, 1)],
      ["Completion rate", pct(completed, voters, 1)],
      [],
      ["Campaign", "Status", "Started", "Completed", "Finish rate"],
      ...campaignPerf.map((row) => [
        row.name,
        row.status,
        row.voters,
        row.completed,
        pct(row.completed, row.voters),
      ]),
      [],
      ["Standalone polst", "Views", "Votes"],
      ...polstPerf.map((row) => [row.question, row.views, row.votes]),
    ] as Array<Array<string | number>>,
  });

  if (!rows.length) {
    return (
      <DashboardPage>
        <AnalyticsFilterBar />
        <EmptyAnalytics />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage actions={<ExportMenu summary={summary} csv={csv} />}>
      <AnalyticsFilterBar />

      {/* Decisions first, telemetry after. The title follows the rows'
          truth: all-Ended runs have results ready; live rows state their
          own evidence fact. */}
      <DashboardCard
        title={
          ready.length > 0 && ready.every((c) => c.status === "Ended")
            ? "Results ready"
            : "Ready for a decision"
        }
        padded={false}
        bodyClassName="pb-1"
      >
        {ready.length ? (
          <ReadyToDecideList campaigns={ready} />
        ) : (
          <EmptyState
            title="No campaigns are ready for a decision"
            hint="Campaigns appear here once a clear leader emerges on enough voters."
            action={{ label: "View campaigns", to: "/campaigns" }}
          />
        )}
      </DashboardCard>

      <SectionGrid>
        {/* The fused KPI hero: the four headline metrics as tabs over one
            always-on chart — the same totals, deltas, and daily series the
            separate tiles and "Votes per day" card carried. */}
        <StatsStrip
          className="lg:col-span-8"
          stats={heroStats}
          xTicks={STAT_XTICKS[filters.range]}
          scopeLabel={compareLabel ?? undefined}
        />
        <DashboardCard
          title="Source mix"
          className="lg:col-span-4"
          action={
            <InfoHint
              label="Source mix"
              text="Share of voters by the channel of the source that delivered them."
            />
          }
        >
          <MixBars slices={sourceMix} />
        </DashboardCard>
      </SectionGrid>

      {trends.length ? (
        <section aria-label="Trends">
          <SectionTitle className="mb-3">This week against your 30-day baseline</SectionTitle>
          <TrendGrid trends={trends} />
        </section>
      ) : null}

      {insights.length ? (
        <section aria-label="What the data says">
          <SectionTitle className="mb-3">What the data says</SectionTitle>
          <InsightGrid insights={insights} />
        </section>
      ) : null}

      {/* The brand-wide "voter journey" is retired: a two-step funnel over
          unrelated runs answered nothing (real feedback: "бесполезный
          фанел"). Step drop-off lives on each campaign's overview, where
          the steps share one sequence. */}
      <DashboardCard
        title="Categories"
        padded={false}
        action={<InfoHint label="Engagement" text={METRIC_INFO.engagementRate} />}
      >
        <DataTable rows={categories} columns={categoryColumns} />
      </DashboardCard>

      <DashboardCard title="Campaign performance" padded={false}>
        <DataTable
          rows={campaignPerf}
          columns={campaignPerfColumns}
          emptyLabel="No campaigns collected votes in this view"
        />
        {campaignPerf.length ? (
          <p className="border-t border-border-default px-4 py-3 text-xs text-text-secondary">
            Started, Completed, and Finish rate are scoped to the selected window; status
            reflects the whole run. Each campaign's interpretation lives in its Insights tab.
          </p>
        ) : null}
      </DashboardCard>

      <DashboardCard
        title="Standalone polsts"
        padded={false}
        action={<InfoHint label="Votes / view" text={METRIC_INFO.votesPerView} />}
      >
        <DataTable
          rows={polstPerf}
          columns={polstPerfColumns}
          emptyLabel="No standalone polsts collected votes in this view"
        />
      </DashboardCard>
    </DashboardPage>
  );
}

/* ── Acquisition & Retention (modules) ───────────────────────────────
   Honest connect states: polst has no ad-platform or identity data of
   its own, so these pages hold the connection flow — nothing invented.
   When the module is off the route doesn't exist (nav already hides it). */

function ModuleConnectPage({
  locked,
  integrationIds,
}: {
  locked: { title: string; description: string };
  integrationIds: string[];
}) {
  const integrations = INTEGRATIONS.filter((i) => integrationIds.includes(i.id));
  return (
    <DashboardPage>
      <LockedCard title={locked.title} description={locked.description} chip="Not connected" />
      <DashboardCard title="Connect a platform">
        <div className="grid gap-3 lg:grid-cols-2">
          {integrations.map((integration) => (
            <ConnectCard key={integration.id} integration={integration} />
          ))}
        </div>
      </DashboardCard>
    </DashboardPage>
  );
}

export function AnalyticsAcquisitionPage() {
  const { modules } = useModules();
  if (!modules.acquisition) return <Navigate to="/analytics" replace />;
  return (
    <ModuleConnectPage
      locked={{
        title: "Acquisition data isn't flowing yet",
        description:
          "Spend, reach, and cost per voter come from your ad platforms. Connect one and this page fills in from its first sync.",
      }}
      integrationIds={["int-meta", "int-tiktok", "int-ga4"]}
    />
  );
}

export function AnalyticsRetentionPage() {
  const { modules } = useModules();
  if (!modules.retention) return <Navigate to="/analytics" replace />;
  return (
    <ModuleConnectPage
      locked={{
        title: "Retention data isn't flowing yet",
        description:
          "Polst voters are anonymous, so repeat visits can't be counted on their own. Connect a platform that recognizes voters across visits and return behavior appears here.",
      }}
      integrationIds={["int-klaviyo"]}
    />
  );
}

/* ── Insights — the campaign insights index ──────────────────────────
   The audit's contract: every insight belongs to one campaign. This
   page helps a marketer find campaigns with meaningful findings, then
   opens the evidence in that campaign's own Insights tab. It does not
   analyze standalone polsts, repeat Home's task queue, or restate the
   workspace totals (Overview owns those). Eight rows per page so each
   row can carry a real readout. */

const INSIGHT_PAGE_SIZE = 8;
const INSIGHT_STATE_FILTERS = [
  "All",
  "Needs review",
  "Decision ready",
  "Monitoring",
  "Reviewed",
] as const;

type InsightIndexRow = {
  id: string;
  campaign: Campaign;
  state: InsightState;
  through: string;
  sourceCount: number;
};

function CampaignInsightIndexRow({ row }: { row: InsightIndexRow }) {
  const { campaign, state, through, sourceCount } = row;
  const to = `/campaigns/${campaign.id}?tab=insights`;
  return (
    <li className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={to}
              className="font-display font-semibold text-text-primary hover:text-text-accent"
            >
              {campaign.name}
            </Link>
            <StatusBadge status={campaign.status} />
            <Chip tone={INSIGHT_STATE_TONE[state]}>{state}</Chip>
          </div>
          <p className="text-xs leading-4 text-text-secondary">
            {campaign.category} · {fmtDateRange(campaign.startAt, campaign.endAt)}
          </p>
          <p className="max-w-3xl text-sm leading-6 text-text-secondary">
            {campaignReadout(campaign)}
          </p>
          <p className="text-xs leading-4 text-text-tertiary">
            {fmtInt(campaign.voters)} participants · {pct(campaign.completed, campaign.voters)}{" "}
            finish rate · {campaign.chain.length}{" "}
            {campaign.chain.length === 1 ? "polst" : "polsts"} · {sourceCount}{" "}
            {sourceCount === 1 ? "source" : "sources"} · data through {fmtDate(through)}
          </p>
        </div>
        <Button variant="secondary" asChild className="shrink-0">
          <Link to={to}>View campaign insights</Link>
        </Button>
      </div>
    </li>
  );
}

export function AnalyticsInsightsPage() {
  const { campaigns, sources, reviewFor } = useWorkspace();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [page, setPage] = useState(0);

  /* Only Active and Ended campaigns with responses qualify — Scheduled
     and Draft runs have no findings yet, and the footer says so instead
     of leaving their absence to guesswork. */
  const eligible = useMemo(() => campaigns.filter(qualifiesForInsights), [campaigns]);
  const excluded = campaigns.length - eligible.length;

  const rows = useMemo<InsightIndexRow[]>(() => {
    const q = query.trim().toLowerCase();
    return eligible
      .map((campaign) => ({
        id: campaign.id,
        campaign,
        state: insightStateFor(campaign, reviewFor(campaign.id)),
        through: dataThrough(campaign),
        sourceCount: sources.filter(
          (s) => s.linked?.type === "campaign" && s.linked.id === campaign.id,
        ).length,
      }))
      .filter((r) => stateFilter === "All" || r.state === stateFilter)
      .filter(
        (r) =>
          !q ||
          [r.campaign.name, r.campaign.decision, r.campaign.category].some((v) =>
            v.toLowerCase().includes(q),
          ),
      )
      .sort((a, b) => {
        /* Latest meaningful activity first: live runs (data through
           today) ahead of ended ones, sooner-ending live runs first. */
        if (a.through !== b.through) return a.through < b.through ? 1 : -1;
        const aEnd = a.campaign.endAt ?? "9999";
        const bEnd = b.campaign.endAt ?? "9999";
        return aEnd === bEnd ? b.campaign.voters - a.campaign.voters : aEnd < bEnd ? -1 : 1;
      });
  }, [eligible, sources, reviewFor, stateFilter, query]);

  /* Filter and search changes land the user on page one; Pager clamps
     when the result set shrinks under the current page. */
  const changeFilter = (next: string) => {
    setStateFilter(next);
    setPage(0);
  };
  const changeQuery = (next: string) => {
    setQuery(next);
    setPage(0);
  };

  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / INSIGHT_PAGE_SIZE) - 1));
  const visible = rows.slice(
    safePage * INSIGHT_PAGE_SIZE,
    safePage * INSIGHT_PAGE_SIZE + INSIGHT_PAGE_SIZE,
  );

  const searching = query.trim().length > 0;
  const filtered = stateFilter !== "All";

  const summary = () =>
    [
      `${WORKSPACE.brand} — campaign insights`,
      ...rows.map(
        (r) =>
          `${r.campaign.name} (${r.state}, data through ${fmtDate(r.through)}): ${campaignReadout(r.campaign)}`,
      ),
    ].join("\n");

  return (
    <DashboardPage actions={<ExportMenu summary={summary} />}>
      <p className="max-w-3xl text-sm leading-6 text-text-secondary">
        What each campaign learned, which polsts shaped that learning, and what to do next.
        Standalone polsts keep their factual detail pages — they never appear here.
      </p>
      <DashboardCard padded={false}>
        <SearchAndFilters
          tabs={INSIGHT_STATE_FILTERS}
          active={stateFilter}
          onChange={changeFilter}
          placeholder="Search campaigns"
          query={query}
          onQueryChange={changeQuery}
        />
        {visible.length > 0 ? (
          <>
            <ul className="divide-y divide-border-default">
              {visible.map((row) => (
                <CampaignInsightIndexRow key={row.id} row={row} />
              ))}
            </ul>
            <Pager
              page={safePage}
              pageSize={INSIGHT_PAGE_SIZE}
              total={rows.length}
              onPage={setPage}
              noun="campaigns"
            />
          </>
        ) : searching || filtered ? (
          <EmptyState
            icon="search"
            register="no-results"
            title={
              searching
                ? `No campaigns with findings match “${query.trim()}”`
                : `No campaigns are ${stateFilter.toLowerCase()} right now`
            }
            hint="Only Active and Ended campaigns with responses appear here."
            action={{
              label: "Clear filters",
              onClick: () => {
                changeQuery("");
                changeFilter("All");
              },
            }}
          />
        ) : (
          <EmptyState
            icon="query_stats"
            title="No campaigns have findings yet"
            hint="Insights appear once a campaign is Active or Ended with responses. Publish a campaign and give its sources time to collect."
            action={{ label: "View campaigns", to: "/campaigns" }}
          />
        )}
        {excluded > 0 && eligible.length > 0 ? (
          <p className="border-t border-border-default px-4 py-3 text-xs leading-4 text-text-secondary">
            {excluded} {excluded === 1 ? "campaign doesn't" : "campaigns don't"} appear here —
            Scheduled and Draft runs have no responses to learn from yet.
          </p>
        ) : null}
      </DashboardCard>
    </DashboardPage>
  );
}

/* ── Reports ─────────────────────────────────────────────────────── */

const reportPath = (report: WorkspaceReport) =>
  `/${report.linked.type === "campaign" ? "campaigns" : "polsts"}/${report.linked.id}`;

export function AnalyticsReportsPage() {
  const { filters, rows, resetFilters } = useAnalytics();
  const { campaigns, campaignById, polstById, sources } = useWorkspace();
  const [previewId, setPreviewId] = useState<string | null>(null);

  /* The report library derives from the LIVE store: every Ended campaign
   * carries a Ready decision-report row — end a run in-session and its
   * report appears here immediately (the same report the campaign header
   * exports), on top of the authored seed rows. */
  const reports = useMemo<WorkspaceReport[]>(
    () => [
      ...campaigns
        .filter(
          (c) =>
            c.status === "Ended" &&
            !REPORTS.some((r) => r.linked.type === "campaign" && r.linked.id === c.id),
        )
        .map((c) => ({
          id: `${c.id}-report`,
          name: `${c.name} — decision report`,
          linked: { type: "campaign" as const, id: c.id },
          state: "Ready" as const,
          createdAt: c.endAt ?? TODAY,
        })),
      ...REPORTS,
    ],
    [campaigns],
  );

  // A report follows its object: it shows when the linked campaign/polst
  // has activity inside the selected window and filters.
  const scoped = useMemo(
    () =>
      reports.filter((report) =>
        rows.some(
          (row) => row.kind === report.linked.type && row.objectId === report.linked.id,
        ),
      ),
    [reports, rows],
  );
  const preview = scoped.find((report) => report.id === previewId) ?? null;
  /* The shared ReportPreview speaks the live entity: the linked object and
   * its sources come from the store, never the stale seed back-refs. */
  const previewCampaign =
    preview?.linked.type === "campaign" ? campaignById(preview.linked.id) : undefined;
  const previewPolst =
    preview?.linked.type === "polst" ? polstById(preview.linked.id) : undefined;
  const previewSources = previewCampaign
    ? sources.filter(
        (s) => s.linked?.type === "campaign" && s.linked.id === previewCampaign.id,
      )
    : undefined;

  const linkedName = (report: WorkspaceReport) =>
    report.linked.type === "campaign"
      ? campaignById(report.linked.id)?.name ?? "—"
      : polstById(report.linked.id)?.question ?? "—";

  const reportColumns: Array<DataColumn<WorkspaceReport>> = [
    {
      header: "Report",
      cell: (row) => (
        <span className="font-display font-semibold text-text-primary">{row.name}</span>
      ),
    },
    {
      header: "Scope",
      cell: (row) => (
        <Link to={reportPath(row)} className="text-text-secondary hover:text-text-accent">
          {linkedName(row)}
        </Link>
      ),
    },
    {
      header: "State",
      cell: (row) => (
        <Chip tone={row.state === "Ready" ? "success" : "neutral"}>{row.state}</Chip>
      ),
    },
    {
      header: "Created",
      cell: (row) => <span className="text-text-secondary">{fmtDate(row.createdAt)}</span>,
    },
    {
      header: "",
      align: "right",
      cell: (row) =>
        row.state === "Ready" ? (
          <Button variant="secondary" size="sm" onClick={() => setPreviewId(row.id)}>
            Preview
          </Button>
        ) : (
          <Button variant="secondary" size="sm" asChild>
            <Link to={reportPath(row)}>Continue</Link>
          </Button>
        ),
    },
  ];

  const summary = () =>
    [
      `${WORKSPACE.brand} — reports (${scopeLine(filters)})`,
      ...scoped.map(
        (report) => `${report.name} — ${report.state}, created ${fmtDate(report.createdAt)}`,
      ),
    ].join("\n");

  return (
    <DashboardPage actions={scoped.length ? <ExportMenu summary={summary} /> : undefined}>
      <AnalyticsFilterBar />

      {scoped.length ? (
        <DashboardCard padded={false}>
          <DataTable rows={scoped} columns={reportColumns} />
        </DashboardCard>
      ) : (
        <DashboardCard>
          <EmptyState
            icon="lab_profile"
            title="No reports in this view"
            hint="A report shows when its campaign or polst has activity inside the selected window and filters."
            action={{ label: "Reset filters", onClick: resetFilters }}
          />
        </DashboardCard>
      )}

      <ReportPreview
        open={Boolean(preview)}
        onClose={() => setPreviewId(null)}
        title={preview?.name}
        campaign={previewCampaign}
        sources={previewSources}
        polst={previewPolst}
      />
    </DashboardPage>
  );
}
