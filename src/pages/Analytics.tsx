import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Menu, MenuItem } from "@/components/Menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import {
  ActionCard,
  Chip,
  ConnectCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  EmptyState,
  FilterBar,
  Funnel,
  InfoHint,
  LockedCard,
  MixBars,
  ReportPreview,
  SectionGrid,
  StatTile,
  StatusBadge,
  TrendChart,
  type DataColumn,
} from "@/components/dashboard";
import {
  METRIC_INFO,
  fmtDate,
  fmtInt,
  fmtPct,
  isReadyToDecide,
  pct,
  relativeToToday,
  type Status,
} from "@/lib/canon";
import { allocate, dateSpan, windowBounds, windowDelta, type WindowRange } from "@/lib/engine";
import {
  CAMPAIGNS,
  INTEGRATIONS,
  REPORTS,
  SINGLE_POLSTS,
  STAT_XTICKS,
  WHAT_CHANGED,
  WORKSPACE,
  attentionItems,
  campaignSeries,
  polstSeries,
  verdictLabel,
  winnerLabel,
  type Campaign,
  type SinglePolst,
  type WorkspaceReport,
} from "@/lib/workspace";
import {
  ANALYTICS_CHANNELS,
  ANALYTICS_VERTICALS,
  analyticsRows,
  mixBy,
  segmentTotal,
  verticalRows,
  type AnalyticsFilters,
  type SegmentRow,
  type VerticalRow,
} from "@/lib/analytics";
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
      verticals={ANALYTICS_VERTICALS}
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
        hint="Nothing collected votes in this window for the selected channel and vertical."
        action={{ label: "Reset filters", onClick: resetFilters }}
      />
    </DashboardCard>
  );
}

/** Copies text for real and tells the truth about the outcome. */
function useCopyText() {
  const toast = useToast();
  return async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Summary copied to clipboard");
    } catch {
      toast("Copy failed — the browser blocked clipboard access");
    }
  };
}

/** Header export: a real copy and a real print — never a fake download. */
function ExportMenu({ summary }: { summary: () => string }) {
  const copy = useCopyText();
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
      <MenuItem icon="content_copy" label="Copy summary" onClick={() => void copy(summary())} />
      <MenuItem icon="print" label="Print page" onClick={() => window.print()} />
    </Menu>
  );
}

/** "Jun 9 – Jun 15 · Email · Food & drink" — the scope behind a summary. */
function scopeLine(filters: AnalyticsFilters): string {
  const [start, end] = windowBounds(filters.range);
  return [
    `${fmtDate(start)} – ${fmtDate(end)}`,
    filters.channel !== "All channels" ? filters.channel : null,
    filters.vertical !== "All verticals" ? filters.vertical : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/* ── Windowed series (derived, never fabricated) ─────────────────────
   Every object's daily votes come from the same series the Home stats
   read; a channel/vertical filter keeps each object's share by exact
   integer allocation, so the chart total equals the table totals. */

const OBJECTS = new Map<string, { kind: "campaign" | "polst"; object: Campaign | SinglePolst }>([
  ...CAMPAIGNS.map((c) => [c.id, { kind: "campaign" as const, object: c }] as const),
  ...SINGLE_POLSTS.map((p) => [p.id, { kind: "polst" as const, object: p }] as const),
]);

function scopedDailyVotes(rows: SegmentRow[], range: WindowRange, offset = 0): number[] {
  const [start, end] = windowBounds(range, offset);
  const days = dateSpan(start, end);
  const totals = days.map(() => 0);
  const votesByObject = new Map<string, number>();
  for (const row of rows) {
    votesByObject.set(row.objectId, (votesByObject.get(row.objectId) ?? 0) + row.metrics.votes);
  }
  for (const [objectId, scopedVotes] of votesByObject) {
    const entry = OBJECTS.get(objectId);
    if (!entry) continue;
    const series =
      entry.kind === "campaign"
        ? campaignSeries(entry.object as Campaign, "votes")
        : polstSeries(entry.object as SinglePolst, "votes");
    const daily = days.map((iso) => {
      const i = series.dates.indexOf(iso);
      return i === -1 ? 0 : series.values[i];
    });
    const windowTotal = daily.reduce((a, b) => a + b, 0);
    const allocated = windowTotal === scopedVotes ? daily : allocate(scopedVotes, daily);
    allocated.forEach((v, i) => {
      totals[i] += v;
    });
  }
  return totals;
}

/* ── Overview ────────────────────────────────────────────────────── */

type CampaignPerfRow = {
  id: string;
  name: string;
  status: Status;
  voters: number;
  completed: number;
  verdict: string;
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
          voters: m.voters,
          completed: m.completed,
          verdict: verdictLabel(campaign),
        },
      ];
    })
    .sort((a, b) => b.voters - a.voters);
}

const campaignPerfColumns: Array<DataColumn<CampaignPerfRow>> = [
  {
    header: "Campaign",
    cell: (row) => (
      <Link
        to={`/campaigns/${row.id}`}
        className="font-display font-semibold text-text-primary hover:text-text-accent"
      >
        {row.name}
      </Link>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    header: "Voters",
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtInt(row.voters)}</span>,
  },
  {
    header: "Completion",
    align: "right",
    cell: (row) => <span className="tabular-nums">{pct(row.completed, row.voters)}</span>,
  },
  {
    header: "Result so far",
    cell: (row) => <span className="text-text-secondary">{row.verdict}</span>,
  },
];

type PolstPerfRow = { id: string; question: string; views: number; votes: number };

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
      return [{ id, question: polst.question, views: m.views, votes: m.votes }];
    })
    .sort((a, b) => b.views - a.views);
}

const polstPerfColumns: Array<DataColumn<PolstPerfRow>> = [
  {
    header: "Polst",
    cell: (row) => (
      <Link
        to={`/polsts/${row.id}`}
        className="font-display font-semibold text-text-primary hover:text-text-accent"
      >
        {row.question}
      </Link>
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

const verticalColumns: Array<DataColumn<VerticalRow>> = [
  {
    header: "Vertical",
    cell: (row) => (
      <span className="font-display font-semibold text-text-primary">{row.vertical}</span>
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
    cell: (row) => (
      <span className="tabular-nums">
        {row.completionRate !== null ? fmtPct(row.completionRate, 0) : "—"}
      </span>
    ),
  },
  {
    // An aggregate across every content in the vertical — canon's
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

/** The Home ready-to-decide vocabulary, windowless: entity truth per row. */
function ReadyToDecideList({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <ul className="divide-y divide-border-default">
      {campaigns.map((campaign) => (
        <li
          key={campaign.id}
          className="flex flex-col items-start gap-3 px-5 py-3 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <Link
              to={`/campaigns/${campaign.id}`}
              className="font-display text-sm font-semibold text-text-primary hover:text-text-accent"
            >
              {campaign.name}
            </Link>
            <p className="mt-0.5 text-xs text-text-secondary">
              {winnerLabel(campaign)} · {fmtInt(campaign.voters)} voters
              {campaign.target ? ` of ${fmtInt(campaign.target)} target` : ""} · run to date
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <span className="whitespace-nowrap text-sm font-semibold text-status-success">
              Ready to decide
              {campaign.confidence !== "—" ? ` · ${campaign.confidence} confidence` : ""}
            </span>
            <Button variant="secondary" size="sm" asChild>
              <Link to={`/campaigns/${campaign.id}`}>Review decision</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsOverviewPage() {
  const { filters, rows } = useAnalytics();
  const { campaigns, polsts } = useWorkspace();

  const views = segmentTotal(rows, "views");
  const votes = segmentTotal(rows, "votes");
  const voters = segmentTotal(rows, "voters");
  const completed = segmentTotal(rows, "completed");
  const shares = segmentTotal(rows, "shares");

  /* The previous window of equal length under the same filters — the same
     vs-previous contract Home's stat strip states for these four metrics. */
  const prevRows = useMemo(
    () => (filters.range === "All" ? null : analyticsRows(filters, 1)),
    [filters],
  );
  const [prevStart, prevEnd] = windowBounds(filters.range, 1);
  const compareLabel =
    filters.range === "All" ? null : `vs ${fmtDate(prevStart)} – ${fmtDate(prevEnd)}`;
  const prev = prevRows
    ? {
        views: segmentTotal(prevRows, "views"),
        votes: segmentTotal(prevRows, "votes"),
        voters: segmentTotal(prevRows, "voters"),
        completed: segmentTotal(prevRows, "completed"),
      }
    : null;
  /** Trend + "12% vs May 13 – Jun 11" for a tile; {} when the previous
   *  window is too small for an honest comparison (windowDelta's rule). */
  const tileDelta = (current: number, previous: number | null | undefined) => {
    const d = previous == null || !compareLabel ? null : windowDelta(current, previous);
    if (d === null) return {};
    return {
      detail: `${Math.abs(d)}% ${compareLabel}`,
      trend: (d === 0 ? "flat" : d > 0 ? "up" : "down") as "up" | "down" | "flat",
    };
  };
  const rate = (numer: number, denom: number) => (denom > 0 ? (numer / denom) * 100 : null);
  const engagement = rate(votes, views);
  const prevEngagement = prev ? rate(prev.votes, prev.views) : null;
  const completion = rate(completed, voters);
  const prevCompletion = prev ? rate(prev.completed, prev.voters) : null;

  const ready = useMemo(() => {
    const inScope = new Set(rows.filter((r) => r.kind === "campaign").map((r) => r.objectId));
    return campaigns.filter((c) => isReadyToDecide(c) && inScope.has(c.id));
  }, [rows, campaigns]);

  const trend = useMemo(() => scopedDailyVotes(rows, filters.range), [rows, filters.range]);
  const prevTrend = useMemo(
    () => (prevRows ? scopedDailyVotes(prevRows, filters.range, 1) : undefined),
    [prevRows, filters.range],
  );
  const sourceMix = useMemo(() => mixBy(rows, (row) => row.channel, "voters"), [rows]);
  const verticals = useMemo(() => verticalRows(rows), [rows]);
  const campaignPerf = useMemo(() => buildCampaignPerf(rows, campaigns), [rows, campaigns]);
  const polstPerf = useMemo(() => buildPolstPerf(rows, polsts), [rows, polsts]);

  /* Voting steps only, so the biggest-drop marker compares like with
   * like: views are impressions (not people) and would flag views→started
   * as the biggest drop forever, drowning the voting-step drops. Views
   * and share taps (interactions, not voters) stand as plain numbers. */
  const journey = [
    { label: "Started voting", count: voters },
    { label: "Completed", count: completed },
  ];

  const summary = () =>
    [
      `${WORKSPACE.brand} — analytics (${scopeLine(filters)})`,
      `Views ${fmtInt(views)} · Votes ${fmtInt(votes)} · Engagement ${pct(votes, views, 1)} · Completion ${pct(completed, voters, 1)}`,
      ...ready.map(
        (c) =>
          `Ready to decide: ${c.name} — ${winnerLabel(c)} (${fmtInt(c.voters)} voters run to date)`,
      ),
    ].join("\n");

  if (!rows.length) {
    return (
      <DashboardPage>
        <AnalyticsFilterBar />
        <EmptyAnalytics />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage actions={<ExportMenu summary={summary} />}>
      <AnalyticsFilterBar />

      {/* Decisions first, telemetry after. */}
      <DashboardCard title="Ready to decide" padded={false} bodyClassName="pb-1">
        {ready.length ? (
          <ReadyToDecideList campaigns={ready} />
        ) : (
          <EmptyState
            title="No campaigns are ready to decide"
            hint="Campaigns appear here once a clear leader emerges on enough voters."
            action={{ label: "View campaigns", to: "/campaigns" }}
          />
        )}
      </DashboardCard>

      <SectionGrid>
        <StatTile
          className="lg:col-span-3"
          label="Total views"
          value={fmtInt(views)}
          info={METRIC_INFO.views}
          {...tileDelta(views, prev?.views)}
        />
        <StatTile
          className="lg:col-span-3"
          label="Total votes"
          value={fmtInt(votes)}
          info={METRIC_INFO.votes}
          {...tileDelta(votes, prev?.votes)}
        />
        <StatTile
          className="lg:col-span-3"
          label="Engagement rate"
          value={pct(votes, views, 1)}
          info={METRIC_INFO.engagementRate}
          {...tileDelta(engagement ?? 0, prevEngagement)}
        />
        <StatTile
          className="lg:col-span-3"
          label="Completion rate"
          value={pct(completed, voters, 1)}
          info={METRIC_INFO.completionRate}
          {...tileDelta(completion ?? 0, prevCompletion)}
        />
      </SectionGrid>

      <SectionGrid>
        <DashboardCard
          title="Votes per day"
          className="lg:col-span-8"
          action={
            compareLabel ? (
              <span className="text-xs text-text-tertiary">{compareLabel}</span>
            ) : undefined
          }
        >
          <TrendChart series={trend} previous={prevTrend} xTicks={STAT_XTICKS[filters.range]} />
        </DashboardCard>
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

      <SectionGrid>
        <DashboardCard title="Voter journey" className="lg:col-span-5">
          <div className="mb-4 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-text-primary">
              Views
              <InfoHint label="Views" text={METRIC_INFO.views} />
            </span>
            <span className="tabular-nums text-text-secondary">
              {fmtInt(views)} · {pct(voters, views, 1)} started voting
            </span>
          </div>
          <Funnel steps={journey} />
          <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border-default pt-3 text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-text-primary">
              Interactions
              <InfoHint label="Interactions" text={METRIC_INFO.interactions} />
            </span>
            <span className="tabular-nums text-text-secondary">{fmtInt(shares)}</span>
          </div>
        </DashboardCard>
        <DashboardCard
          title="Verticals"
          className="lg:col-span-7"
          padded={false}
          action={<InfoHint label="Engagement" text={METRIC_INFO.engagementRate} />}
        >
          <DataTable rows={verticals} columns={verticalColumns} />
        </DashboardCard>
      </SectionGrid>

      <DashboardCard title="Campaign performance" padded={false}>
        <DataTable
          rows={campaignPerf}
          columns={campaignPerfColumns}
          emptyLabel="No campaigns collected votes in this view"
        />
        {campaignPerf.length ? (
          <p className="border-t border-border-default px-5 py-3 text-xs text-text-secondary">
            Voters and completion are scoped to the selected window; status and the result
            reflect the whole run.
          </p>
        ) : null}
      </DashboardCard>

      <DashboardCard
        title="Standalone Polsts"
        padded={false}
        action={<InfoHint label="Votes / view" text={METRIC_INFO.votesPerView} />}
      >
        <DataTable
          rows={polstPerf}
          columns={polstPerfColumns}
          emptyLabel="No standalone Polsts collected votes in this view"
        />
      </DashboardCard>
    </DashboardPage>
  );
}

/* ── Acquisition & Retention (modules) ───────────────────────────────
   Honest connect states: Polst has no ad-platform or identity data of
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

/* ── Insights ────────────────────────────────────────────────────────
   Everything here references a real entity with its real numbers — the
   same derived queues Home reads (ready-to-decide, attention, changes).
   No date filter: these are current workspace facts, each row carries
   its own stamp. */

const TONE_DOT: Record<"danger" | "warning" | "neutral", string> = {
  danger: "bg-status-danger",
  warning: "bg-status-warning",
  neutral: "bg-icon-secondary",
};

export function AnalyticsInsightsPage() {
  const { campaigns, polsts, sources } = useWorkspace();
  const ready = campaigns.filter(isReadyToDecide);
  /* Derived from the LIVE store, like Home and the sidebar nag — fixing an
     item (assigning a source, finishing a draft) clears it here too. */
  const attention = useMemo(
    () => attentionItems(campaigns, polsts, sources),
    [campaigns, polsts, sources],
  );

  const summary = () =>
    [
      `${WORKSPACE.brand} — insights`,
      ...ready.map(
        (c) =>
          `Ready to decide: ${c.name} — ${winnerLabel(c)} (${fmtInt(c.voters)} voters, ${c.confidence} confidence)`,
      ),
      ...attention.map((item) => `Needs attention: ${item.title}`),
      ...WHAT_CHANGED.map((item) => `${fmtDate(item.at)} — ${item.text}`),
    ].join("\n");

  return (
    <DashboardPage actions={<ExportMenu summary={summary} />}>
      {ready.length ? (
        <SectionGrid>
          {ready.map((campaign) => (
            <ActionCard
              key={campaign.id}
              className="h-full lg:col-span-4"
              eyebrow="Ready to decide"
              title={campaign.name}
              reason={`${winnerLabel(campaign)} · ${fmtInt(campaign.voters)} voters · ${campaign.confidence} confidence`}
              primary={{ label: "Review decision", to: `/campaigns/${campaign.id}` }}
            />
          ))}
        </SectionGrid>
      ) : null}

      <SectionGrid>
        <DashboardCard title="Needs attention" className="lg:col-span-7" bodyClassName="pt-2">
          {attention.length ? (
            <ul className="divide-y divide-border-default">
              {attention.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3 first:pt-1">
                  <span
                    aria-hidden
                    className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-pill", TONE_DOT[item.tone])}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-text-primary">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-5 text-text-secondary">{item.reason}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="shrink-0" asChild>
                    <Link to={item.to}>{item.action}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="verified" title="Nothing needs attention right now" />
          )}
        </DashboardCard>
        <DashboardCard title="What changed" className="lg:col-span-5" bodyClassName="pt-2">
          <ul className="divide-y divide-border-default">
            {WHAT_CHANGED.map((item) => (
              <li key={item.id} className="py-3 first:pt-1 last:pb-1">
                <Link
                  to={item.to}
                  className="block text-sm leading-5 text-text-primary hover:text-text-accent"
                >
                  {item.text}
                </Link>
                <p className="mt-0.5 text-xs text-text-tertiary">{relativeToToday(item.at)}</p>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </SectionGrid>
    </DashboardPage>
  );
}

/* ── Reports ─────────────────────────────────────────────────────── */

const reportPath = (report: WorkspaceReport) =>
  `/${report.linked.type === "campaign" ? "campaigns" : "polsts"}/${report.linked.id}`;

export function AnalyticsReportsPage() {
  const { filters, rows, resetFilters } = useAnalytics();
  const { campaignById, polstById, sources } = useWorkspace();
  const [previewId, setPreviewId] = useState<string | null>(null);

  // A report follows its object: it shows when the linked campaign/Polst
  // has activity inside the selected window and filters.
  const scoped = useMemo(
    () =>
      REPORTS.filter((report) =>
        rows.some(
          (row) => row.kind === report.linked.type && row.objectId === report.linked.id,
        ),
      ),
    [rows],
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
            hint="A report shows when its campaign or Polst has activity inside the selected window and filters."
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
