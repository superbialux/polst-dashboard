import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Menu, MenuItem } from "@/components/Menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import {
  ActionCard,
  BarChart,
  CohortGrid,
  DashboardCard,
  DashboardPage,
  DataTable,
  DetailList,
  FilterBar,
  Funnel,
  MixBars,
  SectionGrid,
  SplitBar,
  StatTile,
  StatsStrip,
  SignalBadge,
  StatusBadge,
  TimeHeatmap,
  TrendChart,
  type DataColumn,
} from "@/components/dashboard";
import {
  CAMPAIGNS,
  HEATMAP_BUCKETS,
  HEATMAP_DAYS,
  HEATMAP_PEAK,
  TIME_HEATMAP,
  formatNumber,
  winnerLabel,
  type Campaign,
  type ChurnRisk,
  type Finding,
  type Report,
  type VerticalPerformance,
} from "@/lib/workspace";
import {
  ANALYTICS_CHANNELS,
  ANALYTICS_UTMS,
  ANALYTICS_VERTICALS,
  acquisitionByChannel,
  campaignReturns,
  contentPerformance,
  formatMoney,
  formatPercent,
  mixBy,
  ratio,
  retentionByChannel,
  seriesFor,
  total,
  trafficQuality,
  weightedAverage,
  type AcquisitionRow,
  type AnalyticsResult,
  type CampaignReturnRow,
  type ContentPerformanceRow,
  type RetentionBreakdownRow,
  type TrafficQualityRow,
} from "@/lib/analytics";
import { useAnalytics } from "@/lib/analytics-context";

const RANGE_TICKS = {
  "7D": ["7 days ago", "3 days ago", "Today"],
  "30D": ["30 days ago", "15 days ago", "Today"],
  "90D": ["90 days ago", "45 days ago", "Today"],
  All: ["First response", "Midpoint", "Today"],
} as const;

function AnalyticsFilters() {
  const { filters, setFilters } = useAnalytics();
  return (
    <FilterBar
      filters={filters}
      onChange={setFilters}
      channels={ANALYTICS_CHANNELS}
      verticals={ANALYTICS_VERTICALS}
      utms={ANALYTICS_UTMS}
    />
  );
}

function EmptyAnalytics() {
  return (
    <DashboardCard>
      <p className="py-8 text-center text-sm text-text-secondary">
        No activity matches these filters.
      </p>
    </DashboardCard>
  );
}

function campaignScope(rows: AnalyticsResult[]) {
  const byCampaign = new Map<string, AnalyticsResult[]>();
  rows.forEach((row) => byCampaign.set(row.campaignId, [...(byCampaign.get(row.campaignId) ?? []), row]));
  return [...byCampaign.entries()].map(([id, scoped]) => {
    const campaign = CAMPAIGNS.find((item) => item.id === id)!;
    return {
      ...campaign,
      responses: total(scoped, "completions"),
      completion: formatPercent(ratio(total(scoped, "completions"), total(scoped, "starts")), 0),
      topSource: mixBy(scoped, (row) => row.channel, "completions")[0]?.label ?? "-",
    };
  });
}

/* ── Overview ────────────────────────────────────────────────────── */

const campaignPerformanceColumns: Array<DataColumn<Campaign>> = [
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
    header: "Responses",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "Completion",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.completion}</span>,
  },
  {
    header: "Winning direction",
    cell: (row) => <span className="text-text-secondary">{winnerLabel(row)}</span>,
  },
  {
    header: "Signal",
    cell: (row) => <SignalBadge signal={row.signal} />,
  },
];

/** The CSV/PDF export affordance shared by Overview and Reports. */
function ExportMenu() {
  const toast = useToast();
  return (
    <Menu
      label="Export"
      trigger={({ toggle }) => (
        <Button variant="secondary" onClick={toggle}>
          <Icon name="download" size={18} />
          Export
        </Button>
      )}
    >
      <MenuItem icon="csv" label="Download CSV" onClick={() => toast("Exported as CSV")} />
      <MenuItem
        icon="picture_as_pdf"
        label="Download PDF"
        onClick={() => toast("Exported as PDF")}
      />
    </Menu>
  );
}

const verticalColumns: Array<DataColumn<VerticalPerformance>> = [
  {
    header: "Vertical",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.vertical}</p>
    ),
  },
  {
    header: "Responses",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "Completion",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.completion}</span>,
  },
  {
    header: "Drop-off",
    cell: (row) => <span className="text-text-secondary">{row.dropOff}</span>,
  },
  {
    header: "Time to vote",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.timeToVote}</span>,
  },
  {
    header: "Share rate",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.shareRate}</span>,
  },
];

const contentColumns: Array<DataColumn<ContentPerformanceRow>> = [
  { header: "Topic", cell: (row) => <span className="font-display font-semibold">{row.topic}</span> },
  { header: "Hook", cell: (row) => <span className="text-text-secondary">{row.hook}</span> },
  { header: "Format", cell: (row) => <span className="text-text-secondary">{row.format}</span> },
  { header: "Views", align: "right", cell: (row) => <span className="tabular-nums">{formatNumber(row.views)}</span> },
  { header: "Engagement", align: "right", cell: (row) => <span className="tabular-nums">{row.engagement}</span> },
  { header: "Completion", align: "right", cell: (row) => <span className="tabular-nums">{row.completion}</span> },
  { header: "Share", align: "right", cell: (row) => <span className="tabular-nums">{row.shareRate}</span> },
];

const trafficColumns: Array<DataColumn<TrafficQualityRow>> = [
  { header: "Channel", cell: (row) => <span className="font-display font-semibold">{row.channel}</span> },
  { header: "Vertical", cell: (row) => <span className="text-text-secondary">{row.vertical}</span> },
  { header: "Creative", cell: (row) => <span className="text-text-secondary">{row.format}</span> },
  { header: "Bounce", align: "right", cell: (row) => <span className="tabular-nums">{row.bounce}</span> },
  { header: "Time on site", align: "right", cell: (row) => <span className="tabular-nums">{row.timeOnSite}</span> },
  { header: "Vote drop-off", align: "right", cell: (row) => <span className="tabular-nums">{row.dropOff}</span> },
];

export function AnalyticsOverviewPage() {
  const { filters, rows } = useAnalytics();
  const campaigns = campaignScope(rows);
  const readyToDecide = campaigns.filter(
    (c) => c.status === "Active" && (c.signal === "Leading" || c.signal === "Decisive"),
  );
  const views = total(rows, "views");
  const votes = total(rows, "votes");
  const starts = total(rows, "starts");
  const completions = total(rows, "completions");
  const newUsers = total(rows, "newUsers");
  const returningUsers = total(rows, "returningUsers");
  const sourceMix = mixBy(rows, (row) => row.channel, "completions");
  const topSource = sourceMix[0]?.label ?? "-";
  const portfolio = [
    { label: "Total views", value: formatNumber(views), info: "Attributed views in the selected scope." },
    { label: "Total votes", value: formatNumber(votes), info: "Choices tapped in the selected scope." },
    { label: "Completion rate", value: formatPercent(ratio(completions, starts)), info: "Completed sequences divided by starts." },
    { label: "Top source", value: topSource, info: "Highest completed-response volume in the selected scope." },
  ];
  const verticalRows: VerticalPerformance[] = ANALYTICS_VERTICALS.map((vertical) => {
    const scoped = rows.filter((row) => row.vertical === vertical);
    return {
      id: vertical.toLowerCase().replace(/ /g, "-"),
      vertical,
      responses: total(scoped, "completions"),
      completion: formatPercent(ratio(total(scoped, "completions"), total(scoped, "starts"))),
      dropOff: formatPercent(100 - ratio(total(scoped, "completions"), total(scoped, "starts"))),
      timeToVote: `${weightedAverage(scoped, "timeToVoteSeconds", "starts").toFixed(1)}s`,
      shareRate: formatPercent(ratio(total(scoped, "shares"), total(scoped, "completions"))),
    };
  }).filter((row) => row.responses > 0);
  const heatScale = completions / 2670;
  const heatmap = TIME_HEATMAP.map((day) => day.map((value) => Math.round(value * heatScale)));
  const peak = filters.channel === "Email" ? "Wednesday 6-8pm" : filters.channel === "Instagram" ? "Thursday 8-10pm" : filters.channel === "QR" ? "Saturday 2-4pm" : HEATMAP_PEAK;
  const journey = [
    { label: "Landed", count: views },
    { label: "Started voting", count: starts },
    { label: "Completed", count: completions },
    { label: "Shared", count: total(rows, "shares") },
  ];
  return (
    <DashboardPage
      actions={<ExportMenu />}
    >
      <AnalyticsFilters />

      {!rows.length ? <EmptyAnalytics /> : null}

      {/* Decisions first, telemetry after */}
      {rows.length ? <DashboardCard
        title="Ready to decide"
        padded={false}
        bodyClassName="pb-1"
      >
        <ul className="divide-y divide-border-default">
          {readyToDecide.map((campaign) => (
            <li key={campaign.id} className="flex flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/campaigns/${campaign.id}`}
                  className="font-display text-sm font-semibold text-text-primary hover:text-text-accent"
                >
                  {campaign.name}
                </Link>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {winnerLabel(campaign)} · {formatNumber(campaign.responses)} scoped responses
                </p>
              </div>
              <div className="flex w-full flex-wrap items-center justify-start gap-3 sm:w-auto">
                <SignalBadge
                  signal={campaign.signal}
                  detail={campaign.confidence !== "—" ? `${campaign.confidence} confidence` : undefined}
                />
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/campaigns/${campaign.id}`}>Review</Link>
                </Button>
              </div>
            </li>
          ))}
          {!readyToDecide.length ? <p className="px-4 py-8 text-center text-sm text-text-secondary">No ready decisions in this scope.</p> : null}
        </ul>
      </DashboardCard> : null}

      {rows.length ? <SectionGrid>
        {portfolio.map((item) => (
          <StatTile
            key={item.label}
            className="lg:col-span-3"
            label={item.label}
            value={item.value}
            info={item.info}
          />
        ))}
      </SectionGrid> : null}

      {rows.length ? <SectionGrid>
        <DashboardCard
          title="Response trend"
          className="lg:col-span-8"
        >
          <BarChart values={seriesFor(rows, "completions")} xTicks={[...RANGE_TICKS[filters.range]]} />
        </DashboardCard>
        <DashboardCard title="Source mix" className="lg:col-span-4">
          <MixBars slices={sourceMix} />
        </DashboardCard>
      </SectionGrid> : null}

      {rows.length ? <SectionGrid>
        <DashboardCard
          title="When your audience answers"
          className="lg:col-span-7"
          action={
            <span className="rounded-pill bg-accent-soft px-2.5 py-1 font-display text-xs font-semibold text-accent-default">
              Peak: {peak}
            </span>
          }
        >
          <TimeHeatmap values={heatmap} days={HEATMAP_DAYS} buckets={HEATMAP_BUCKETS} />
        </DashboardCard>
        <DashboardCard title="Journey across campaigns" className="lg:col-span-5">
          <Funnel steps={journey} />
        </DashboardCard>
      </SectionGrid> : null}

      {rows.length ? <DashboardCard title="Verticals side by side" padded={false}>
        <DataTable rows={verticalRows} columns={verticalColumns} />
      </DashboardCard> : null}

      {rows.length ? <SectionGrid>
        <DashboardCard
          title="Devices"
          className="lg:col-span-6"
        >
          <MixBars slices={mixBy(rows, (row) => row.device, "completions")} />
        </DashboardCard>
        <DashboardCard
          title="New vs returning"
          className="lg:col-span-6"
        >
          <SplitBar split={{
            a: { label: "New", value: Math.round(ratio(newUsers, newUsers + returningUsers)) },
            b: { label: "Returning", value: Math.round(ratio(returningUsers, newUsers + returningUsers)) },
          }} />
        </DashboardCard>
      </SectionGrid> : null}

      {rows.length ? <DashboardCard
        title="Campaign performance"
        padded={false}
      >
        <DataTable
          rows={campaigns}
          columns={campaignPerformanceColumns}
          emptyLabel="No campaigns match these filters"
        />
      </DashboardCard> : null}

      {rows.length ? <DashboardCard title="Content performance" padded={false}>
        <DataTable rows={contentPerformance(rows)} columns={contentColumns} />
      </DashboardCard> : null}

      {rows.length ? <DashboardCard title="Traffic quality" padded={false}>
        <DataTable rows={trafficQuality(rows)} columns={trafficColumns} />
      </DashboardCard> : null}
    </DashboardPage>
  );
}

/* ── Acquisition (module) ────────────────────────────────────────── */

const economicsColumns: Array<DataColumn<AcquisitionRow>> = [
  {
    header: "Channel",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.channel}</p>
    ),
  },
  {
    header: "Visits",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.visits)}</span>,
  },
  {
    header: "Signups",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.signups)}</span>,
  },
  {
    header: "New",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.newUsers)}</span>,
  },
  {
    header: "Returning",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.returningUsers)}</span>,
  },
  {
    header: "Creation rate",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.conversion}</span>,
  },
  {
    header: "CTR",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.ctr}</span>,
  },
  {
    header: "CPC",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.cpc}</span>,
  },
  {
    header: "Cost per account",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.cpa}</span>,
  },
];

const roiColumns: Array<DataColumn<CampaignReturnRow>> = [
  {
    header: "Campaign",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.campaign}</p>
    ),
  },
  {
    header: "Spend",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.spend}</span>,
  },
  {
    header: "Accounts",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.accounts}</span>,
  },
  {
    header: "Engaged",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.engaged)}</span>,
  },
  {
    header: "New / returning",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.newUsers)} / {formatNumber(row.returningUsers)}</span>,
  },
  {
    header: "CPA",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.cpa}</span>,
  },
  {
    header: "Cost per engaged",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.costPerEngaged}</span>,
  },
];

/** A starred dream-list item shipped honestly: a written conclusion with a
 *  confidence chip, not a speculative chart. */
function FindingCard({ finding }: { finding: Finding }) {
  return (
    <DashboardCard className="lg:col-span-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-sm font-semibold text-text-primary">
          {finding.title}
        </h3>
        <span className="rounded-pill bg-surface-subtle px-2 py-0.5 font-display text-xs font-semibold text-text-secondary">
          {finding.confidence}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{finding.body}</p>
    </DashboardCard>
  );
}

export function AnalyticsAcquisitionPage() {
  const { filters, rows } = useAnalytics();
  const economics = acquisitionByChannel(rows);
  const returns = campaignReturns(rows);
  const signups = total(rows, "signups");
  const completions = total(rows, "completions");
  const spend = total(rows, "spend");
  const paidViews = rows
    .filter((row) => row.utm === "Paid social" || row.utm === "Creator")
    .reduce((sum, row) => sum + row.metrics.views, 0);
  const views = total(rows, "views");
  const stats = [
    { label: "New accounts", value: formatNumber(signups), delta: "", trend: "flat" as const, spark: seriesFor(rows, "signups") },
    { label: "Creation rate", value: formatPercent(ratio(signups, completions)), delta: "", trend: "flat" as const, spark: seriesFor(rows, "signups") },
    { label: "Cost per account", value: formatMoney(signups ? spend / signups : 0), delta: "", trend: "flat" as const, spark: seriesFor(rows, "spend") },
    { label: "Paid share", value: formatPercent(ratio(paidViews, views), 0), delta: "", trend: "flat" as const, spark: seriesFor(rows.filter((row) => row.utm === "Paid social" || row.utm === "Creator"), "views") },
  ];
  const paidShare = Math.round(ratio(paidViews, views));
  const bestChannel = [...economics].sort((a, b) => parseFloat(b.conversion) - parseFloat(a.conversion))[0];
  const bestCampaign = [...returns].filter((row) => row.accounts > 0).sort((a, b) => parseFloat(a.cpa.replace(/[$-]/g, "") || "999") - parseFloat(b.cpa.replace(/[$-]/g, "") || "999"))[0];
  const findings: Finding[] = [
    ...(bestChannel ? [{ id: "best-channel", title: `${bestChannel.channel} converts best`, body: `${bestChannel.conversion} of completed voters create an account.`, confidence: "High confidence" as const }] : []),
    ...(bestCampaign ? [{ id: "best-campaign", title: `${bestCampaign.campaign} has the lowest CPA`, body: `${bestCampaign.cpa} per account across ${formatNumber(bestCampaign.accounts)} creations.`, confidence: "High confidence" as const }] : []),
  ];
  return (
    <DashboardPage
      actions={<ExportMenu />}
    >
      <AnalyticsFilters />

      {!rows.length ? <EmptyAnalytics /> : null}

      {rows.length ? <StatsStrip stats={stats} xTicks={[...RANGE_TICKS[filters.range]]} /> : null}

      {rows.length ? <SectionGrid>
        <DashboardCard
          title="Account creations"
          className="lg:col-span-8"
        >
          <TrendChart
            series={seriesFor(rows, "signups", 30)}
            xTicks={[...RANGE_TICKS[filters.range]]}
          />
        </DashboardCard>
        <div className="space-y-4 lg:col-span-4">
          <DashboardCard title="Paid vs organic">
            <SplitBar split={{
              a: { label: "Paid", value: paidShare, detail: `${formatNumber(paidViews)} views` },
              b: { label: "Organic", value: 100 - paidShare, detail: `${formatNumber(views - paidViews)} views` },
            }} />
          </DashboardCard>
          <DashboardCard title="Creative formats">
            <MixBars slices={mixBy(rows, (row) => row.format, "signups")} />
          </DashboardCard>
        </div>
      </SectionGrid> : null}

      {rows.length ? <DashboardCard title="Channel economics" padded={false}>
        <DataTable rows={economics} columns={economicsColumns} />
      </DashboardCard> : null}

      {rows.length ? <DashboardCard title="Campaign spend and return" padded={false}>
        <DataTable rows={returns} columns={roiColumns} />
      </DashboardCard> : null}

      {rows.length ? <SectionGrid>
        {findings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </SectionGrid> : null}
    </DashboardPage>
  );
}

/* ── Retention (module) ──────────────────────────────────────────── */

const cohortUsageColumns: Array<DataColumn<RetentionBreakdownRow>> = [
  {
    header: "Cohort",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.cohort}</p>
    ),
  },
  {
    header: "New",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.newUsers)}</span>,
  },
  {
    header: "Returning",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.returningUsers)}</span>,
  },
  {
    header: "Repeat",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.repeatRate}</span>,
  },
  { header: "Polls / session", align: "right", cell: (row) => <span className="tabular-nums">{row.frequency}</span> },
  { header: "D1", align: "right", cell: (row) => <span className="tabular-nums">{row.d1}</span> },
  { header: "D7", align: "right", cell: (row) => <span className="tabular-nums">{row.d7}</span> },
  { header: "D30", align: "right", cell: (row) => <span className="tabular-nums">{row.d30}</span> },
];

/** One at-risk segment: who they are, why they're cooling, and the next
 *  action — every row answers "so what do I do?" */
function ChurnRow({ risk }: { risk: ChurnRisk }) {
  const toast = useToast();
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold text-text-primary">
          {risk.segment}
          <span className="ml-2 font-sans text-xs font-normal tabular-nums text-text-tertiary">
            {formatNumber(risk.size)} people
          </span>
        </p>
        <p className="mt-0.5 text-sm text-text-secondary">{risk.detail}</p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="shrink-0"
        onClick={() => toast(`${risk.action} queued for ${risk.segment}`)}
      >
        {risk.action}
      </Button>
    </li>
  );
}

export function AnalyticsRetentionPage() {
  const { filters, rows } = useAnalytics();
  const breakdowns = retentionByChannel(rows);
  const newUsers = total(rows, "newUsers");
  const d1 = weightedAverage(rows, "d1", "newUsers");
  const d7 = weightedAverage(rows, "d7", "newUsers");
  const d30 = weightedAverage(rows, "d30", "newUsers");
  const repeatUsers = total(rows, "repeatUsers");
  const starts = total(rows, "starts");
  const churned = total(rows, "churnedUsers");
  const notifications = total(rows, "notificationReturns");
  const stats = [
    { label: "Day-7 retention", value: formatPercent(d7, 0), delta: "", trend: "flat" as const, spark: seriesFor(rows, "returningUsers") },
    { label: "Repeat vote rate", value: formatPercent(ratio(repeatUsers, starts)), delta: "", trend: "flat" as const, spark: seriesFor(rows, "repeatUsers") },
    { label: "Gone quiet", value: formatNumber(churned), delta: "", trend: "flat" as const, spark: seriesFor(rows, "churnedUsers") },
    { label: "Notification returns", value: formatPercent(ratio(notifications, total(rows, "returningUsers"))), delta: "", trend: "flat" as const, spark: seriesFor(rows, "notificationReturns") },
  ];
  const cohortSizes = [0.13, 0.15, 0.16, 0.17, 0.19, 0.2];
  const cohorts = cohortSizes.map((share, index) => ({
    label: `Week ${index + 1}`,
    size: Math.round(newUsers * share),
    d1: Math.max(0, Math.round(d1 + (index - 2) * 1.2)),
    d7: Math.max(0, Math.round(d7 + (index - 2) * 0.8)),
    d14: Math.max(0, Math.round((d7 + d30) / 2 + (index - 2) * 0.5)),
    d30: Math.max(0, Math.round(d30 + (index - 2) * 0.4)),
  }));
  const churnRisks: ChurnRisk[] = breakdowns
    .map((row) => {
      const scoped = rows.filter((item) => item.channel === row.cohort);
      return {
        id: row.id,
        segment: `${row.cohort} arrivals`,
        detail: `${row.d30} remain active at day 30`,
        size: total(scoped, "churnedUsers"),
        action: "Re-ask",
      };
    })
    .filter((row) => row.size > 0)
    .sort((a, b) => b.size - a.size)
    .slice(0, 3);
  const postVote = [
    { label: "Voted", count: total(rows, "completions") },
    { label: "Continued", count: repeatUsers },
    { label: "Shared", count: total(rows, "shares") },
    { label: "Created account", count: total(rows, "signups") },
  ];
  return (
    <DashboardPage
      actions={<ExportMenu />}
    >
      <AnalyticsFilters />

      {!rows.length ? <EmptyAnalytics /> : null}

      {rows.length ? <StatsStrip stats={stats} xTicks={[...RANGE_TICKS[filters.range]]} /> : null}

      {rows.length ? <SectionGrid>
        <DashboardCard
          title="Weekly cohorts"
          className="lg:col-span-7"
        >
          <CohortGrid cohorts={cohorts} />
        </DashboardCard>
        <DashboardCard title="Returning by channel" className="lg:col-span-5">
          <MixBars slices={mixBy(rows, (row) => row.channel, "returningUsers")} />
        </DashboardCard>
      </SectionGrid> : null}

      {rows.length ? <SectionGrid>
        <DashboardCard title="After the vote" className="lg:col-span-5">
          <Funnel steps={postVote} />
        </DashboardCard>
        <DashboardCard title="Cooling segments" className="lg:col-span-7">
          <ul className="divide-y divide-border-default">
            {churnRisks.map((risk) => (
              <ChurnRow key={risk.id} risk={risk} />
            ))}
          </ul>
        </DashboardCard>
      </SectionGrid> : null}

      {rows.length ? <DashboardCard title="Behavior by arrival channel" padded={false}>
        <DataTable rows={breakdowns} columns={cohortUsageColumns} />
      </DashboardCard> : null}
    </DashboardPage>
  );
}

/* ── Insights ────────────────────────────────────────────────────── */

/** Campaigns with a live recommendation, ranked by readiness. */
const recommendationColumns: Array<DataColumn<Campaign>> = [
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
  {
    header: "Recommendation",
    cell: (row) => <span className="text-text-secondary">{winnerLabel(row)}</span>,
  },
  {
    header: "Signal",
    cell: (row) => <SignalBadge signal={row.signal} />,
  },
  {
    header: "Responses",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <Button variant="secondary" size="sm" asChild>
        <Link to={`/campaigns/${row.id}`}>Open insights</Link>
      </Button>
    ),
  },
];

export function AnalyticsInsightsPage() {
  const { rows } = useAnalytics();
  const withSignal = campaignScope(rows).filter((c) => c.responses > 0);
  const content = contentPerformance(rows);
  const traffic = trafficQuality(rows);
  const retention = retentionByChannel(rows);
  const topContent = content[0];
  const worstTraffic = traffic[0];
  const weakestRetention = [...retention].sort((a, b) => parseFloat(a.d30) - parseFloat(b.d30))[0];
  const scopedInsights = [
    ...(topContent ? [{ id: "content", title: `${topContent.topic} drives the most reach`, context: `${formatNumber(topContent.views)} views with ${topContent.completion} completion.`, status: "Ready" as const, action: "Open performance", to: "/analytics" }] : []),
    ...(worstTraffic ? [{ id: "dropoff", title: `${worstTraffic.channel} needs attention`, context: `${worstTraffic.dropOff} vote drop-off on ${worstTraffic.format.toLowerCase()} traffic.`, status: "Needs attention" as const, action: "Review traffic", to: "/analytics" }] : []),
    ...(weakestRetention ? [{ id: "retention", title: `${weakestRetention.cohort} has the weakest return rate`, context: `${weakestRetention.d30} remain active at day 30.`, status: "Needs attention" as const, action: "Review retention", to: "/analytics/retention" }] : []),
  ];
  return (
    <DashboardPage
    >
      <AnalyticsFilters />

      {!rows.length ? <EmptyAnalytics /> : null}

      {rows.length ? <SectionGrid>
        {scopedInsights.map((insight) => (
          <div key={insight.id} className="lg:col-span-4">
            <ActionCard
              title={insight.title}
              reason={insight.context}
              meta={insight.status}
              primary={{ label: insight.action, to: insight.to }}
              className="h-full"
            />
          </div>
        ))}
      </SectionGrid> : null}

      {rows.length ? <DashboardCard
        title="Recommendations by campaign"
        padded={false}
      >
        <DataTable rows={withSignal} columns={recommendationColumns} />
      </DashboardCard> : null}

      {rows.length ? <DashboardCard title="What changed">
        <ul className="divide-y divide-border-default">
          {withSignal.slice(0, 4).map((campaign) => (
            <li
              key={campaign.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-text-primary">{campaign.name} reached {formatNumber(campaign.responses)} scoped responses</span>
              <span className="shrink-0 text-xs text-text-secondary">{campaign.completion} completion</span>
            </li>
          ))}
        </ul>
      </DashboardCard> : null}
    </DashboardPage>
  );
}

/* ── Reports ─────────────────────────────────────────────────────── */

const reportColumns: Array<DataColumn<Report>> = [
  {
    header: "Report",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.name}</p>
    ),
  },
  {
    header: "Linked object",
    cell: (row) => <span className="text-text-secondary">{row.linkedObject}</span>,
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    header: "Updated",
    cell: (row) => <span className="text-text-secondary">{row.updated}</span>,
  },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <Button variant="secondary" size="sm">
        {row.primaryAction}
      </Button>
    ),
  },
];

export function AnalyticsReportsPage() {
  const { rows } = useAnalytics();
  const campaigns = campaignScope(rows);
  const reports: Report[] = campaigns.map((campaign) => ({
    id: `report-${campaign.id}`,
    name: campaign.name,
    linkedObject: `${campaign.name} · Campaign`,
    status: campaign.status === "Ended" ? "Ready" : "Draft",
    updated: "Today",
    primaryAction: "Preview",
  }));
  const preview = campaigns[0];
  return (
    <DashboardPage
      actions={<ExportMenu />}
    >
      <AnalyticsFilters />

      {!rows.length ? <EmptyAnalytics /> : null}

      {rows.length ? <SectionGrid>
        <DashboardCard title="Report preview" className="lg:col-span-5">
          <div className="space-y-4">
            <StatusBadge status={preview.status === "Ended" ? "Ready" : "Draft"} />
            <h3 className="font-display text-xl font-bold text-text-primary">
              {preview.name}
            </h3>
            <DetailList
              items={[
                ["Responses", formatNumber(preview.responses)],
                ["Winning direction", winnerLabel(preview)],
                ["Completion", preview.completion],
                ["Top source", preview.topSource],
              ]}
            />
            <Button variant="secondary" size="sm" asChild>
              <Link to={`/campaigns/${preview.id}`}>Open full report</Link>
            </Button>
          </div>
        </DashboardCard>
        <DashboardCard
          title="Generated and draft reports"
          className="lg:col-span-7"
          padded={false}
        >
          <DataTable rows={reports} columns={reportColumns} />
        </DashboardCard>
      </SectionGrid> : null}
    </DashboardPage>
  );
}
