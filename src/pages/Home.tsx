import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AttentionList,
  DashboardCard,
  DashboardPage,
  DateRangeMenu,
  EmptyState,
  ReadyDecisionRow,
  SectionGrid,
  SegmentedControl,
  StatsStrip,
  ThumbStrip,
  WorkspaceCalendar,
} from "@/components/dashboard";
import {
  METRIC_INFO,
  fmtDate,
  fmtDateRange,
  fmtInt,
  isReadyToDecide,
  pct,
  relativeToToday,
} from "@/lib/canon";
import { useWorkspace } from "@/lib/store";
import {
  STAT_XTICKS,
  attentionItems,
  dashboardStats,
  readyTitle,
  winnerLabel,
  workspaceWindow,
  type Campaign,
  type Source,
  type StatRange,
} from "@/lib/workspace";

/* ── Shared helpers ──────────────────────────────────────────────── */

/** Sources currently pointed at a campaign — read from the store so
 *  in-session assignments update every readiness surface at once. */
const campaignSources = (sources: Source[], id: string) =>
  sources.filter((s) => s.linked?.type === "campaign" && s.linked.id === id);

/** "1 Polst" / "3 Polsts" — counts and nouns agree everywhere on the page. */
const pluralize = (n: number, singular: string) => (n === 1 ? singular : `${singular}s`);

/** A dot separator between inline stats. */
const StatDot = () => (
  <span aria-hidden className="text-border-strong">
    ·
  </span>
);

/* ── Ready to decide ─────────────────────────────────────────────── */

function ReadyDecisionCard({ campaign, more }: { campaign: Campaign; more?: string }) {
  // An Ended run's results are in — the card says so and points at the
  // report. A live run states the evidence fact ("Target reached"), never
  // "ready to decide" — that read belongs to a finished race.
  const decided = campaign.status === "Ended";
  return (
    <ReadyDecisionRow
      layout="card"
      className="lg:col-span-4"
      // The card title already carries the state — confidence adds the
      // evidence strength with its method one hover away.
      eyebrow={readyTitle(campaign)}
      title={campaign.name}
      to={`/campaigns/${campaign.id}`}
      confidence={campaign.confidence !== "—" ? campaign.confidence : undefined}
      confidenceInfo={METRIC_INFO.confidence}
      note={
        !decided && campaign.endAt ? `Collecting until ${fmtDate(campaign.endAt)}` : undefined
      }
      stats={[
        { label: "Lead", value: winnerLabel(campaign) },
        {
          label: "Voters",
          value: `${fmtInt(campaign.voters)}${
            campaign.target ? ` / ${fmtInt(campaign.target)}` : ""
          }`,
        },
      ]}
      cta={{
        label: decided ? "Open report" : "Review decision",
        to: `/campaigns/${campaign.id}`,
      }}
      more={more ? { label: more, to: "/campaigns" } : undefined}
    />
  );
}

/* ── Campaigns (Active / Queued) ─────────────────────────────────── */

function HomeCampaignRow({ campaign, sourceCount }: { campaign: Campaign; sourceCount: number }) {
  const live = campaign.status === "Active";
  return (
    <Link
      to={`/campaigns/${campaign.id}`}
      className="block rounded-md p-2 transition-colors hover:bg-surface-subtle"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate font-display text-sm font-semibold leading-5 text-text-primary">
          {campaign.name}
        </p>
        {/* The chain itself, in miniature — what's running, at a glance. */}
        <ThumbStrip ids={campaign.chain.map((q) => q.id)} className="shrink-0" />
      </div>
      <p className="mt-0.5 text-xs text-text-secondary">
        {fmtDateRange(campaign.startAt, campaign.endAt)}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-text-secondary">
        {live ? (
          <>
            <span>
              <span className="font-semibold tabular-nums text-text-primary">
                {fmtInt(campaign.voters)}
                {campaign.target ? ` / ${fmtInt(campaign.target)}` : ""}
              </span>{" "}
              voters
            </span>
            <StatDot />
            <span>
              <span className="font-semibold tabular-nums text-text-primary">
                {pct(campaign.completed, campaign.voters)}
              </span>{" "}
              completion
            </span>
            <StatDot />
            <span>
              <span className="font-semibold tabular-nums text-text-primary">
                {campaign.chain.length}
              </span>{" "}
              {pluralize(campaign.chain.length, "Polst")} live
            </span>
          </>
        ) : (
          <>
            <span>starts {campaign.startAt ? relativeToToday(campaign.startAt) : "—"}</span>
            <StatDot />
            <span>
              <span className="font-semibold tabular-nums text-text-primary">
                {campaign.chain.length}
              </span>{" "}
              {pluralize(campaign.chain.length, "Polst")} staged
            </span>
            <StatDot />
            <span>
              <span className="font-semibold tabular-nums text-text-primary">{sourceCount}</span>{" "}
              {pluralize(sourceCount, "source")}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export function HomePage() {
  const [range, setRange] = useState<StatRange>("30D");
  const [campaignView, setCampaignView] = useState<"Active" | "Queued">("Active");
  const { campaigns, polsts, sources } = useWorkspace();

  /* Stats and the attention queue derive from the LIVE store — fixing an
     item (assigning a source, finishing a draft) clears it immediately. */
  const stats = useMemo(
    () => dashboardStats(range, campaigns, polsts, sources),
    [range, campaigns, polsts, sources],
  );
  /* Ranked by severity in the model (blocked launches → eroding sources →
     waiting drafts); the same rows drive the sidebar count. The store's
     ListItems reshape into the shared AttentionRow's action object. */
  const attention = useMemo(
    () =>
      attentionItems(campaigns, polsts, sources).map((item) => ({
        id: item.id,
        tone: item.tone,
        title: item.title,
        reason: item.reason,
        action: { label: item.action, to: item.to },
      })),
    [campaigns, polsts, sources],
  );

  const activeCampaigns = campaigns.filter((c) => c.status === "Active");
  const queuedCampaigns = useMemo(
    () =>
      campaigns
        .filter((c) => c.status === "Scheduled")
        .sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? "")),
    [campaigns],
  );
  const shownCampaigns = campaignView === "Active" ? activeCampaigns : queuedCampaigns;

  /* Ready to decide — same rule as canon everywhere; live campaigns first. */
  const readyToDecide = useMemo(
    () =>
      campaigns
        .filter((c) => isReadyToDecide(c))
        .sort((a, b) => Number(a.status === "Ended") - Number(b.status === "Ended")),
    [campaigns],
  );
  const readyCampaign = readyToDecide[0];

  /* The "more" link states each group truthfully: a finished run has
     results ready; a live run merely has a strong lead so far. */
  const moreReady = useMemo(() => {
    const rest = readyToDecide.slice(1);
    const live = rest.filter((c) => c.status !== "Ended").length;
    const decided = rest.length - live;
    return (
      [
        live > 0 ? `${live} more with a strong lead` : null,
        decided > 0 ? `${decided} more ${decided === 1 ? "result" : "results"} ready` : null,
      ]
        .filter(Boolean)
        .join(" · ") || undefined
    );
  }, [readyToDecide]);

  return (
    <DashboardPage
      actions={
        <Button variant="secondary" size="sm" asChild>
          <Link to="/analytics">View analytics</Link>
        </Button>
      }
    >
      {/* Workspace health leads; every delta states its comparison window. */}
      <section className="space-y-2">
        <div className="flex justify-end">
          <DateRangeMenu value={range} onChange={setRange} />
        </div>
        <StatsStrip
          stats={stats}
          xTicks={STAT_XTICKS[range]}
          scopeLabel={workspaceWindow(range).compareLabel ?? undefined}
        />
      </section>

      {/* What can be decided, and what's in the way. */}
      <SectionGrid>
        {readyCampaign ? (
          <ReadyDecisionCard campaign={readyCampaign} more={moreReady} />
        ) : null}
        <DashboardCard
          title={attention.length ? `${attention.length} need attention` : "Needs attention"}
          className={readyCampaign ? "lg:col-span-8" : "lg:col-span-12"}
          bodyClassName="pt-2"
        >
          {attention.length ? (
            <AttentionList items={attention} />
          ) : (
            <EmptyState icon="verified" title="Nothing needs attention right now" />
          )}
        </DashboardCard>
      </SectionGrid>

      <DashboardCard
        title="Campaigns"
        bodyClassName="pt-2"
        action={
          <div className="flex items-center gap-2">
            <SegmentedControl
              tabs={["Active", "Queued"]}
              active={campaignView}
              onChange={setCampaignView}
              size="compact"
            />
            <Button variant="secondary" size="sm" asChild>
              <Link to="/campaigns">View all</Link>
            </Button>
          </div>
        }
      >
        {shownCampaigns.length ? (
          <div className="-mx-2 space-y-0.5">
            {shownCampaigns.map((c) => (
              <HomeCampaignRow
                key={c.id}
                campaign={c}
                sourceCount={campaignSources(sources, c.id).length}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="campaign"
            title={campaignView === "Active" ? "No active campaigns" : "Nothing is scheduled"}
            action={{ label: "Create campaign", to: "/campaigns/new" }}
          />
        )}
      </DashboardCard>

      {/* Planning band: one calendar. Key dates ride its day cells and
          popover; the old per-date card grid and the launch checklist
          repeated what the attention queue and campaign rows already say
          (the campaign detail keeps its own launch checklist). */}
      <WorkspaceCalendar />
    </DashboardPage>
  );
}
