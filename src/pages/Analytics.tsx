import { useState } from "react";
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
  Sparkline,
  SplitBar,
  StatTile,
  StatsStrip,
  StatusBadge,
  TimeHeatmap,
  TrendChart,
  type DataColumn,
} from "@/components/dashboard";
import {
  ACQ_FINDINGS,
  ACQUISITION_STATS,
  CAMPAIGNS,
  CAMPAIGN_ROI,
  CHANNELS,
  CHURN_RISKS,
  COHORTS,
  COHORT_USAGE,
  CREATIVE_FORMATS,
  DEVICE_MIX,
  HEATMAP_BUCKETS,
  HEATMAP_DAYS,
  HEATMAP_PEAK,
  INSIGHTS,
  OVERVIEW_FUNNEL,
  PAID_ORGANIC,
  PLATFORM_MIX,
  POST_VOTE_FUNNEL,
  REPORTS,
  RESPONSE_TREND,
  RETENTION_STATS,
  RETURN_PATHS,
  SIGNUP_TREND,
  SOURCE_MIX,
  TIME_HEATMAP,
  VERTICAL_PERFORMANCE,
  WHAT_CHANGED,
  formatNumber,
  type Campaign,
  type CampaignRoi,
  type ChannelEconomics,
  type ChurnRisk,
  type CohortUsage,
  type Finding,
  type Report,
  type VerticalPerformance,
  CHANNEL_ECONOMICS,
} from "@/lib/workspace";

const VERTICALS = VERTICAL_PERFORMANCE.map((v) => v.vertical);
const CHANNEL_NAMES = CHANNELS.map((c) => c.name);

/* ── Overview ────────────────────────────────────────────────────── */

const PORTFOLIO = [
  { label: "Total responses", value: "2,670", detail: "+14.2% vs prev. 30 days", trend: "up" as const },
  { label: "Average completion", value: "72.6%", detail: "+3.4 pts vs prev. 30 days", trend: "up" as const },
  { label: "Ready to decide", value: "2", detail: "campaigns at directional signal", trend: "flat" as const },
  { label: "Top source", value: "Website", detail: "388 responses", trend: "flat" as const },
];

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
    cell: (row) => <span className="text-text-secondary">{row.winner}</span>,
  },
  {
    header: "Readiness",
    cell: (row) => <span className="text-text-secondary">{row.readiness}</span>,
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
    header: "Drop-off point",
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

export function AnalyticsOverviewPage() {
  const [vertical, setVertical] = useState("All verticals");
  const campaigns =
    vertical === "All verticals"
      ? CAMPAIGNS
      : CAMPAIGNS.filter((c) => c.vertical === vertical);
  return (
    <DashboardPage
      eyebrow="Analytics"
      title="Overview"
      actions={<ExportMenu />}
    >
      <FilterBar
        channels={CHANNEL_NAMES}
        verticals={VERTICALS}
        vertical={vertical}
        onVertical={setVertical}
      />

      <SectionGrid>
        {PORTFOLIO.map((item) => (
          <StatTile
            key={item.label}
            className="lg:col-span-3"
            label={item.label}
            value={item.value}
            detail={item.detail}
            trend={item.trend}
          />
        ))}
      </SectionGrid>

      <SectionGrid>
        <DashboardCard
          title="Response trend"
          description="Responses per day across the last two weeks."
          className="lg:col-span-8"
        >
          <BarChart values={RESPONSE_TREND} xTicks={["14 days ago", "7 days ago", "Today"]} />
        </DashboardCard>
        <DashboardCard title="Source mix" className="lg:col-span-4">
          <MixBars slices={SOURCE_MIX} />
        </DashboardCard>
      </SectionGrid>

      <SectionGrid>
        <DashboardCard
          title="When your audience answers"
          className="lg:col-span-7"
          action={
            <span className="rounded-pill bg-accent-soft px-2.5 py-1 font-display text-xs font-semibold text-accent-default">
              Peak: {HEATMAP_PEAK}
            </span>
          }
        >
          <TimeHeatmap values={TIME_HEATMAP} days={HEATMAP_DAYS} buckets={HEATMAP_BUCKETS} />
        </DashboardCard>
        <DashboardCard title="Journey across campaigns" className="lg:col-span-5">
          <Funnel steps={OVERVIEW_FUNNEL} />
        </DashboardCard>
      </SectionGrid>

      <DashboardCard title="Verticals side by side" padded={false}>
        <DataTable rows={VERTICAL_PERFORMANCE} columns={verticalColumns} />
      </DashboardCard>

      <SectionGrid>
        <DashboardCard
          title="Devices"
          className="lg:col-span-6"
        >
          <MixBars slices={DEVICE_MIX} />
        </DashboardCard>
        <DashboardCard
          title="Platforms"
          className="lg:col-span-6"
        >
          <MixBars slices={PLATFORM_MIX} />
        </DashboardCard>
      </SectionGrid>

      <DashboardCard
        title={vertical === "All verticals" ? "Campaign performance" : `Campaign performance — ${vertical}`}
        padded={false}
      >
        <DataTable
          rows={campaigns}
          columns={campaignPerformanceColumns}
          emptyLabel="No campaigns in this vertical yet"
        />
      </DashboardCard>
    </DashboardPage>
  );
}

/* ── Acquisition (module) ────────────────────────────────────────── */

const economicsColumns: Array<DataColumn<ChannelEconomics>> = [
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
    header: "Conversion",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.conversion}</span>,
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
  {
    header: "Trend",
    align: "right",
    cell: (row) => (
      <Sparkline values={row.trend} trend="up" className="text-accent-default" />
    ),
  },
];

const roiColumns: Array<DataColumn<CampaignRoi>> = [
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
  return (
    <DashboardPage
      eyebrow="Analytics"
      title="Acquisition"
      actions={<ExportMenu />}
    >
      <FilterBar channels={CHANNEL_NAMES} verticals={VERTICALS} />

      <StatsStrip stats={ACQUISITION_STATS} xTicks={SIGNUP_TREND.xTicks} />

      <SectionGrid>
        <DashboardCard
          title="Account creations"
          description="Poll engagers converting to registered users, vs the previous 30 days."
          className="lg:col-span-8"
        >
          <TrendChart
            series={SIGNUP_TREND.series}
            previous={SIGNUP_TREND.previous}
            xTicks={SIGNUP_TREND.xTicks}
          />
        </DashboardCard>
        <div className="space-y-4 lg:col-span-4">
          <DashboardCard title="Paid vs organic">
            <SplitBar split={PAID_ORGANIC} />
          </DashboardCard>
          <DashboardCard title="Creative formats">
            <MixBars slices={CREATIVE_FORMATS} />
          </DashboardCard>
        </div>
      </SectionGrid>

      <DashboardCard title="Channel economics" padded={false}>
        <DataTable rows={CHANNEL_ECONOMICS} columns={economicsColumns} />
      </DashboardCard>

      <DashboardCard title="Campaign spend and return" padded={false}>
        <DataTable rows={CAMPAIGN_ROI} columns={roiColumns} />
      </DashboardCard>

      <SectionGrid>
        {ACQ_FINDINGS.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </SectionGrid>
    </DashboardPage>
  );
}

/* ── Retention (module) ──────────────────────────────────────────── */

const cohortUsageColumns: Array<DataColumn<CohortUsage>> = [
  {
    header: "Cohort",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.cohort}</p>
    ),
  },
  {
    header: "Polls per session",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.pollsPerSession}</span>,
  },
  {
    header: "Share rate",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.shareRate}</span>,
  },
  {
    header: "Still active at day 30",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.d30}</span>,
  },
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
  return (
    <DashboardPage
      eyebrow="Analytics"
      title="Retention"
      actions={<ExportMenu />}
    >
      <FilterBar channels={CHANNEL_NAMES} verticals={VERTICALS} />

      <StatsStrip stats={RETENTION_STATS} xTicks={["30 days ago", "15 days ago", "Today"]} />

      <SectionGrid>
        <DashboardCard
          title="Weekly cohorts"
          description="Of the people who voted for the first time each week, how many came back."
          className="lg:col-span-7"
        >
          <CohortGrid cohorts={COHORTS} />
        </DashboardCard>
        <DashboardCard title="How they come back" className="lg:col-span-5">
          <MixBars slices={RETURN_PATHS} />
        </DashboardCard>
      </SectionGrid>

      <SectionGrid>
        <DashboardCard title="After the vote" className="lg:col-span-5">
          <Funnel steps={POST_VOTE_FUNNEL} />
        </DashboardCard>
        <DashboardCard title="Cooling segments" className="lg:col-span-7">
          <ul className="divide-y divide-border-default">
            {CHURN_RISKS.map((risk) => (
              <ChurnRow key={risk.id} risk={risk} />
            ))}
          </ul>
        </DashboardCard>
      </SectionGrid>

      <DashboardCard title="Behavior by arrival cohort" padded={false}>
        <DataTable rows={COHORT_USAGE} columns={cohortUsageColumns} />
      </DashboardCard>
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
    cell: (row) => <span className="text-text-secondary">{row.winner}</span>,
  },
  {
    header: "Confidence",
    cell: (row) => <span className="text-text-secondary">{row.readiness}</span>,
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
  const withSignal = CAMPAIGNS.filter((c) => c.responses > 0);
  return (
    <DashboardPage
      eyebrow="Analytics"
      title="Insights"
    >
      <SectionGrid>
        {INSIGHTS.map((insight) => (
          <div key={insight.id} className="lg:col-span-4">
            <ActionCard
              title={insight.title}
              reason={insight.context}
              status={insight.status}
              primary={{ label: insight.action, to: "/analytics/reports" }}
              className="h-full"
            />
          </div>
        ))}
      </SectionGrid>

      <DashboardCard
        title="Recommendations by campaign"
        padded={false}
      >
        <DataTable rows={withSignal} columns={recommendationColumns} />
      </DashboardCard>

      <DashboardCard title="What changed">
        <ul className="divide-y divide-border-default">
          {WHAT_CHANGED.map((change) => (
            <li
              key={change.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-text-primary">{change.text}</span>
              <span className="shrink-0 text-xs text-text-secondary">{change.ago}</span>
            </li>
          ))}
        </ul>
      </DashboardCard>
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
  return (
    <DashboardPage
      eyebrow="Analytics"
      title="Reports"
      actions={<ExportMenu />}
    >
      <SectionGrid>
        <DashboardCard title="Report preview" className="lg:col-span-5">
          <div className="space-y-4">
            <StatusBadge status="Ready" />
            <h3 className="font-display text-xl font-bold text-text-primary">
              Flavor Launch Recap
            </h3>
            <p className="text-sm leading-6 text-text-secondary">
              Option A is supported for retail sell-in. Confidence is
              directional; source performance is strongest through QR and email.
            </p>
            <DetailList
              items={[
                ["Responses", "1,184"],
                ["Winning direction", "Option A +11 pts"],
                ["Completion", "79%"],
                ["Caveat", "Event traffic skewed local"],
              ]}
            />
            <Button variant="secondary" size="sm" asChild>
              <Link to="/campaigns/flavor-launch-recap">Open full report</Link>
            </Button>
          </div>
        </DashboardCard>
        <DashboardCard
          title="Generated and draft reports"
          className="lg:col-span-7"
          padded={false}
        >
          <DataTable rows={REPORTS} columns={reportColumns} />
        </DashboardCard>
      </SectionGrid>
    </DashboardPage>
  );
}
