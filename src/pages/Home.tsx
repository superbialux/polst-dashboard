import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import {
  ActionCard,
  type CardTone,
  CampaignRow,
  DashboardCard,
  DecisionBrief,
  FilterTabs,
  NextStepsCard,
  PageTabs,
  PolstMiniRow,
  SectionGrid,
  type SetupStep,
  StatsStrip,
  WorkspaceCalendar,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";
import {
  CAMPAIGNS,
  DASHBOARD_STATS,
  KEY_DATES,
  SINGLE_POLSTS,
  STAT_RANGES,
  STAT_SCOPES,
  STAT_XTICKS,
  type StatRange,
  type Status,
  WORKSPACE,
} from "@/lib/workspace";

/** The status filters shared by the Campaigns and Polsts cards. */
const LIST_FILTERS = ["Active", "Queued"] as const;
type ListFilter = (typeof LIST_FILTERS)[number];
const matchesFilter = (status: Status, filter: ListFilter) =>
  filter === "Active" ? status === "Active" : status === "Scheduled" || status === "Draft";

/* ── The attention queue ─────────────────────────────────────────────
   Ranked by severity: what blocks a campaign, then what erodes one, then
   what's simply waiting on you. Each row carries its evidence and one
   action — never a bare metric. */

type AttentionItem = {
  severity: "blocker" | "warning" | "task";
  title: string;
  evidence: string;
  cta: { label: string; to: string };
};

const ATTENTION_QUEUE: AttentionItem[] = [
  {
    severity: "blocker",
    title: "Game Day Creative Test has no sources",
    evidence: "It launches Jun 10 — in the current state it will collect zero responses.",
    cta: { label: "Assign a source", to: "/distribution" },
  },
  {
    severity: "warning",
    title: "Conference Booth QR is losing 6 in 10 voters",
    evidence: "Scans are steady (100+ this week) but completion sits at 41% vs your 68% average.",
    cta: { label: "Inspect source", to: "/distribution" },
  },
  {
    severity: "task",
    title: "“Which tagline should we use?” is still a draft",
    evidence: "The Polst is written but has no schedule and no source, so it can't run.",
    cta: { label: "Finish Polst", to: "/polsts/event-hook" },
  },
  {
    severity: "task",
    title: "The Flavor Launch report is ready to share",
    evidence: "That campaign wrapped Monday; the decision and evidence are packaged.",
    cta: { label: "Open report", to: "/analytics/reports" },
  },
];

const SEVERITY_META: Record<AttentionItem["severity"], { icon: string; className: string }> = {
  blocker: { icon: "error", className: "text-status-danger" },
  warning: { icon: "warning", className: "text-status-warning" },
  task: { icon: "arrow_circle_right", className: "text-icon-secondary" },
};

function AttentionRow({ item }: { item: AttentionItem }) {
  const meta = SEVERITY_META[item.severity];
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Icon name={meta.icon} size={20} className={cn("mt-0.5 shrink-0", meta.className)} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold leading-5 text-text-primary">
          {item.title}
        </p>
        <p className="mt-0.5 text-sm leading-5 text-text-secondary">{item.evidence}</p>
      </div>
      <Button variant="secondary" size="sm" className="shrink-0" asChild>
        <Link to={item.cta.to}>{item.cta.label}</Link>
      </Button>
    </li>
  );
}

/** The workspace setup checklist (Shopify "Get your first N" pattern). */
const SETUP_STEPS: SetupStep[] = [
  { title: "Name your first campaign", done: true },
  {
    title: "Add a distribution source",
    description:
      "Connect where your Polst collects responses — a website embed, a QR code, or a social link — so Game Day Creative Test can go live on Jun 10.",
    cta: { label: "Add a source", to: "/distribution" },
    media: { tone: "accent", icon: "hub", placement: "side" },
  },
  { title: "Confirm the campaign schedule" },
  { title: "Complete your brand profile" },
  { title: "Invite a teammate" },
];

/** Date helpers for the event bento (ISO → "Jun 11" / "Jun 22–26"). */
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleString("en-US", { month: "short", day: "numeric" });
};
const fmtRange = (start: string, end: string) => {
  if (start === end) return fmtDate(start);
  return start.slice(0, 7) === end.slice(0, 7)
    ? `${fmtDate(start)}–${Number(end.slice(8, 10))}`
    : `${fmtDate(start)} – ${fmtDate(end)}`;
};

/** Per-event presentation: art tone + glyph, a line of why it matters, a bento
 *  span, and where its full-bleed image sits (bottom for the tall hero card). */
const KEY_DATE_META: Record<
  string,
  { icon: string; tone: CardTone; blurb: string; span: string; placement: "side" | "bottom" }
> = {
  "world-cup": {
    icon: "sports_soccer",
    tone: "accent",
    blurb: "A tentpole cultural moment — line up a snack campaign before kickoff.",
    span: "lg:col-span-8",
    placement: "side",
  },
  "product-launch": {
    icon: "rocket_launch",
    tone: "green",
    blurb: "Your own launch window. Get creative tested and ready to ship.",
    span: "lg:col-span-4",
    placement: "side",
  },
  "fancy-food-show": {
    icon: "storefront",
    tone: "amber",
    blurb: "Buyers in the room — a fresh Polst sharpens the pitch.",
    span: "lg:col-span-4",
    placement: "side",
  },
  "july-fourth": {
    icon: "celebration",
    tone: "red",
    blurb: "Grill-season peak. Worth a seasonal flavor read.",
    span: "lg:col-span-4",
    placement: "side",
  },
};

/** Empty-state line for a filtered list. */
function EmptyRow({ label }: { label: string }) {
  return <p className="py-6 text-center text-sm text-text-tertiary">{label}</p>;
}

/** A quiet band header that names the section: What's next, Plan ahead. */
function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="pt-2 font-display text-lg font-semibold leading-7 text-text-primary">{title}</h2>
  );
}

export function HomePage() {
  const firstName = WORKSPACE.owner.split(" ")[0];
  const [range, setRange] = useState<StatRange>("30D");
  const [campaignFilter, setCampaignFilter] = useState<ListFilter>("Active");
  const [polstFilter, setPolstFilter] = useState<ListFilter>("Active");

  const campaigns = CAMPAIGNS.filter((c) => matchesFilter(c.status, campaignFilter)).slice(0, 20);
  const polsts = SINGLE_POLSTS.filter((p) => matchesFilter(p.status, polstFilter)).slice(0, 20);

  return (
    // One narrow reading column for the whole page (the shell owns padding)
    <div className="mx-auto max-w-dashboard space-y-6">
        {/* Compact header — a small salutation, the data contract beside it.
            The strongest position on the page belongs to the briefing below. */}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-display text-2xl font-semibold leading-8 tracking-tight text-text-primary lg:text-3xl lg:leading-9">
              Good afternoon, {firstName}
            </h1>
            <span className="flex items-center gap-1 text-xs text-text-tertiary">
              <Icon name="sync" size={14} />
              Updated 2 min ago
            </span>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/analytics">
              View analytics
              <Icon name="arrow_forward" size={20} />
            </Link>
          </Button>
        </div>

        {/* The one decision that's ready — status, change, why, caveat, action */}
        <DecisionBrief
          signal="Leading"
          signalDetail="High confidence"
          headline="Packaging Direction Test is ready to decide"
          summary="Matte Forest has held an 18-point lead for six straight days, and the lead holds on website and QR traffic alike. Responses passed your 1,200 target this morning."
          caveat="QR voters skew older than your audience baseline — check the source mix before announcing."
          evidence={[
            {
              label: "Confidence",
              value: "High",
              info: "Scored from sample size vs target, source diversity, and lead stability. Here: balanced across 3 independent sources; QR voters skew older than baseline.",
            },
            {
              label: "Responses vs target",
              value: "1,486 of 1,200",
              info: "Completed votes on this campaign's Polsts, against the response target set at launch.",
            },
            { label: "Lead", value: "Option B +18 pts" },
            { label: "Sources reporting", value: "3 of 3" },
            { label: "Lead stable for", value: "6 days" },
          ]}
          updated="2 min ago"
          primary={{ label: "Review recommendation", to: "/campaigns/packaging-direction" }}
          secondary={{ label: "See all campaigns", to: "/campaigns" }}
        />

        {/* Everything else that needs a human, ranked by severity */}
        <DashboardCard title="Needs attention" padded={false} bodyClassName="pb-1">
          <ul className="divide-y divide-border-default">
            {ATTENTION_QUEUE.map((item) => (
              <AttentionRow key={item.title} item={item} />
            ))}
          </ul>
        </DashboardCard>

        {/* Campaigns own the wide column; recent Polsts support them */}
        <SectionGrid>
          <DashboardCard
            title="Campaigns"
            className="lg:col-span-8"
            bodyClassName="pt-2"
            action={
              <FilterTabs
                tabs={LIST_FILTERS}
                active={campaignFilter}
                onChange={(t) => setCampaignFilter(t as ListFilter)}
              />
            }
          >
            <div className="-mx-2 space-y-0.5">
              {campaigns.length ? (
                campaigns.map((c) => <CampaignRow key={c.id} campaign={c} />)
              ) : (
                <EmptyRow label="No campaigns in this view." />
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Recent Polsts"
            className="lg:col-span-4"
            bodyClassName="pt-2"
            action={
              <FilterTabs
                tabs={LIST_FILTERS}
                active={polstFilter}
                onChange={(t) => setPolstFilter(t as ListFilter)}
              />
            }
          >
            <div className="-mx-2 space-y-0.5">
              {polsts.length ? (
                polsts.slice(0, 4).map((p) => <PolstMiniRow key={p.id} polst={p} />)
              ) : (
                <EmptyRow label="No Polsts in this view." />
              )}
            </div>
          </DashboardCard>
        </SectionGrid>

        {/* Workspace health — demoted below the work, with its data contract */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading title="Workspace health" />
            <PageTabs tabs={STAT_RANGES} active={range} onChange={setRange} />
          </div>
          <StatsStrip
            stats={DASHBOARD_STATS[range]}
            xTicks={STAT_XTICKS[range]}
            scope={STAT_SCOPES[range]}
          />
        </section>

        <NextStepsCard
          title="Get your workspace launch-ready"
          intro="A few steps left before your first campaign runs clean end to end."
          steps={SETUP_STEPS}
        />

        {/* The calendar + key dates: one planning band */}
        <SectionHeading title="Plan ahead" />
        <WorkspaceCalendar />

        {/* Key dates — each event its own bento card; only World Cup carries art */}
        <SectionGrid>
          {KEY_DATES.map((date) => {
            const meta = KEY_DATE_META[date.id];
            if (!meta) return null;
            return (
              <ActionCardForDate
                key={date.id}
                span={meta.span}
                eyebrow={fmtRange(date.start, date.end)}
                title={date.title}
                blurb={meta.blurb}
                media={date.id === "world-cup" ? { tone: meta.tone, icon: meta.icon } : undefined}
              />
            );
          })}
        </SectionGrid>
    </div>
  );
}

/** Key-date bento card — thin wrapper so the map above stays readable. */
function ActionCardForDate({
  span,
  eyebrow,
  title,
  blurb,
  media,
}: {
  span: string;
  eyebrow: string;
  title: string;
  blurb: string;
  media?: { tone: CardTone; icon: string };
}) {
  return (
    <ActionCard
      className={span}
      eyebrow={eyebrow}
      title={title}
      reason={blurb}
      primary={{ label: "Plan a campaign", to: "/campaigns/new" }}
      media={media ? { ...media, placement: "side" } : undefined}
    />
  );
}
