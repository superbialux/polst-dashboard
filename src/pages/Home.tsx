import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ActionCard,
  DashboardCard,
  DashboardPage,
  DateRangeMenu,
  EmptyState,
  InfoHint,
  NextStepsCard,
  SectionGrid,
  SegmentedControl,
  type SetupStep,
  StatsStrip,
  ThumbStrip,
  WorkspaceCalendar,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";
import {
  METRIC_INFO,
  TODAY,
  fmtDate,
  fmtDateRange,
  fmtInt,
  isReadyToDecide,
  pct,
  relativeToToday,
} from "@/lib/canon";
import { useWorkspace } from "@/lib/store";
import {
  KEY_DATES,
  STAT_XTICKS,
  attentionItems,
  dashboardStats,
  readyTitle,
  winnerLabel,
  workspaceWindow,
  type Campaign,
  type KeyDate,
  type ListItem,
  type SinglePolst,
  type Source,
  type StatRange,
} from "@/lib/workspace";

/* ── Shared helpers ──────────────────────────────────────────────── */

/** Sources currently pointed at a campaign — read from the store so
 *  in-session assignments update every readiness surface at once. */
const campaignSources = (sources: Source[], id: string) =>
  sources.filter((s) => s.linked?.type === "campaign" && s.linked.id === id);

const polstSources = (sources: Source[], id: string) =>
  sources.filter((s) => s.linked?.type === "polst" && s.linked.id === id);

/** "1 Polst" / "3 Polsts" — counts and nouns agree everywhere on the page. */
const pluralize = (n: number, singular: string) => (n === 1 ? singular : `${singular}s`);

/** A dot separator between inline stats. */
const StatDot = () => (
  <span aria-hidden className="text-border-strong">
    ·
  </span>
);

/* ── Attention queue ─────────────────────────────────────────────────
   Ranked by severity in the model (blocked launches → eroding sources →
   waiting drafts); the same rows drive the sidebar count. */

const TONE_DOT: Record<ListItem["tone"], string> = {
  danger: "bg-status-danger",
  warning: "bg-status-warning",
  neutral: "bg-icon-secondary",
};

function AttentionRow({ item }: { item: ListItem }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-pill", TONE_DOT[item.tone])} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold leading-5 text-text-primary">
          {item.title}
        </p>
        <p className="truncate text-xs leading-4 text-text-secondary">{item.reason}</p>
      </div>
      <Button variant="secondary" size="sm" className="shrink-0" asChild>
        <Link to={item.to}>{item.action}</Link>
      </Button>
    </li>
  );
}

/* ── Ready to decide ─────────────────────────────────────────────── */

function ReadyDecisionCard({ campaign, more }: { campaign: Campaign; more?: string }) {
  // An Ended run's results are in — the card says so and points at the
  // report. A live run states the evidence fact ("Target reached"), never
  // "ready to decide" — that read belongs to a finished race.
  const decided = campaign.status === "Ended";
  return (
    <DashboardCard title={readyTitle(campaign)} className="lg:col-span-4">
      {/* The card title already carries the state — this line adds the
          evidence strength with its method one hover away. */}
      {campaign.confidence !== "—" ? (
        <p className="flex items-center gap-1 text-sm font-semibold text-status-success">
          {campaign.confidence} confidence
          <InfoHint label="Confidence" text={METRIC_INFO.confidence} />
        </p>
      ) : null}
      {!decided && campaign.endAt ? (
        <p className="mt-0.5 text-xs text-text-secondary">
          Collecting until {fmtDate(campaign.endAt)}
        </p>
      ) : null}
      <Link
        to={`/campaigns/${campaign.id}`}
        className="mt-2 block font-display text-base font-semibold leading-6 text-text-primary hover:text-text-accent"
      >
        {campaign.name}
      </Link>
      <dl className="mt-3 grid grid-cols-2 gap-3 border-y border-border-default py-3">
        <div>
          <dt className="text-xs text-text-secondary">Lead</dt>
          <dd className="mt-0.5 text-sm font-semibold text-text-primary">{winnerLabel(campaign)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-secondary">Voters</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">
            {fmtInt(campaign.voters)}
            {campaign.target ? ` / ${fmtInt(campaign.target)}` : ""}
          </dd>
        </div>
      </dl>
      <Button className="mt-3 w-full" asChild>
        <Link to={`/campaigns/${campaign.id}`}>{decided ? "Open report" : "Review decision"}</Link>
      </Button>
      {more ? (
        <Link
          to="/campaigns"
          className="mt-2.5 block text-center text-xs font-semibold text-text-accent hover:underline"
        >
          {more}
        </Link>
      ) : null}
    </DashboardCard>
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

/* ── Launch readiness ────────────────────────────────────────────────
   The nearest Scheduled campaign that can't launch cleanly yet, with its
   real gaps as steps. Fully derived — assign a source and the card moves
   on (or disappears). */

function launchSteps(campaign: Campaign, sourceCount: number): SetupStep[] {
  return [
    {
      title: "Stage the Polsts",
      done: campaign.chain.length > 0,
      description: campaign.chain.length
        ? `${campaign.chain.length} ${pluralize(campaign.chain.length, "Polst")} ${campaign.chain.length === 1 ? "is" : "are"} staged in the voting sequence.`
        : "The campaign can't be published without at least one Polst.",
      cta: {
        label: campaign.chain.length ? "Review Polsts" : "Add Polsts",
        to: `/campaigns/${campaign.id}?tab=polsts`,
      },
    },
    {
      // Plural like its CTA — a campaign collects through several sources.
      title: "Assign sources",
      done: sourceCount > 0,
      description:
        sourceCount > 0
          ? `${sourceCount} ${sourceCount === 1 ? "source is" : "sources are"} attached.`
          : "Nothing is attached to collect voters — add a QR code, share link, or embed.",
      cta: {
        // "Assign" is the verb of the control this lands on (the Sources
        // tab's "Assign source"); "Add source" means create-new (Distribution).
        label: sourceCount > 0 ? "Review sources" : "Assign sources",
        to: `/campaigns/${campaign.id}?tab=sources`,
      },
    },
    {
      title: "Confirm the schedule",
      done: Boolean(campaign.startAt),
      description: campaign.startAt
        ? `Runs ${fmtDateRange(campaign.startAt, campaign.endAt)}.`
        : "No start date is set.",
      cta: { label: "Review schedule", to: `/campaigns/${campaign.id}?tab=settings` },
    },
  ];
}

/* ── Key-date coverage ───────────────────────────────────────────── */

type KeyDateCoverage =
  | { kind: "campaign"; campaign: Campaign; sourceCount: number }
  | { kind: "polst"; polst: SinglePolst; sourceCount: number }
  | null;

function KeyDateCard({ date, coverage }: { date: KeyDate; coverage: KeyDateCoverage }) {
  let reason: string;
  let primary: { label: string; to: string };
  if (coverage?.kind === "campaign") {
    const { campaign, sourceCount } = coverage;
    reason =
      sourceCount > 0
        ? `${campaign.name} is ${campaign.status.toLowerCase()} — runs ${fmtDateRange(campaign.startAt, campaign.endAt)}.`
        : `${campaign.name} is ${campaign.status.toLowerCase()} — no sources yet.`;
    primary =
      sourceCount > 0
        ? { label: "View campaign", to: `/campaigns/${campaign.id}` }
        : { label: "Assign sources", to: `/campaigns/${campaign.id}?tab=sources` };
  } else if (coverage?.kind === "polst") {
    const { polst, sourceCount } = coverage;
    reason =
      sourceCount > 0
        ? `"${polst.question}" is ${polst.status.toLowerCase()} — runs ${fmtDateRange(polst.startAt, polst.endAt)}.`
        : `"${polst.question}" is ${polst.status.toLowerCase()} — no source yet.`;
    primary = {
      // Singular, no article — the same verb form as the control it lands on.
      label: sourceCount > 0 ? "View Polst" : "Assign source",
      to: `/polsts/${polst.id}`,
    };
  } else {
    reason = "Nothing is attached to this date yet.";
    primary = { label: "Plan a campaign", to: `/campaigns/new?event=${date.id}` };
  }
  return (
    <ActionCard
      className="lg:col-span-3"
      eyebrow={`${fmtDateRange(date.start, date.end)} · ${relativeToToday(date.start)}`}
      title={date.title}
      reason={reason}
      primary={primary}
    />
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
  const attention = useMemo(
    () => attentionItems(campaigns, polsts, sources),
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

  /* The nearest scheduled campaign that still has a launch gap. */
  const launchCampaign = useMemo(
    () =>
      queuedCampaigns.find(
        (c) => !c.chain.length || !campaignSources(sources, c.id).length || !c.startAt,
      ),
    [queuedCampaigns, sources],
  );

  /* Key dates still ahead, each with its real coverage. */
  const keyDates = useMemo(
    () =>
      KEY_DATES.filter((k) => k.end >= TODAY).map((date) => {
        const campaign = campaigns.find((c) => c.event === date.id && c.status !== "Archived");
        if (campaign) {
          return {
            date,
            coverage: {
              kind: "campaign",
              campaign,
              sourceCount: campaignSources(sources, campaign.id).length,
            } as KeyDateCoverage,
          };
        }
        const polst = polsts.find((p) => p.event === date.id && p.status !== "Archived");
        if (polst) {
          return {
            date,
            coverage: {
              kind: "polst",
              polst,
              sourceCount: polstSources(sources, polst.id).length,
            } as KeyDateCoverage,
          };
        }
        return { date, coverage: null };
      }),
    [campaigns, polsts, sources],
  );

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
            <ul className="divide-y divide-border-default">
              {attention.map((item) => (
                <AttentionRow key={item.id} item={item} />
              ))}
            </ul>
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

      {launchCampaign ? (
        <NextStepsCard
          title={`Get ${launchCampaign.name} ready to launch`}
          intro={launchCampaign.startAt ? `Starts ${relativeToToday(launchCampaign.startAt)}.` : undefined}
          steps={launchSteps(launchCampaign, campaignSources(sources, launchCampaign.id).length)}
        />
      ) : null}

      {/* Planning band: the calendar, then each key date's real coverage. */}
      <WorkspaceCalendar />
      <SectionGrid>
        {keyDates.map(({ date, coverage }) => (
          <KeyDateCard key={date.id} date={date} coverage={coverage} />
        ))}
      </SectionGrid>
    </DashboardPage>
  );
}
