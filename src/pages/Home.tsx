import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import {
  ActionCard,
  type CardTone,
  CampaignRow,
  DashboardCard,
  FilterTabs,
  NextStepsCard,
  PageTabs,
  PolstMiniRow,
  SectionGrid,
  type SetupStep,
  StatsStrip,
  WorkspaceCalendar,
} from "@/components/dashboard";
import {
  CAMPAIGNS,
  DASHBOARD_STATS,
  KEY_DATES,
  SINGLE_POLSTS,
  STAT_RANGES,
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

/** Recommendations (three per row) — text + CTA for now (no placeholder art). */
const RECOMMENDATIONS: {
  title: string;
  reason: string;
  cta: { label: string; to: string };
}[] = [
  {
    title: "Call the Packaging Direction Test",
    reason: "Option B leads by 18 points across website and QR traffic — enough to make the call.",
    cta: { label: "Open results", to: "/campaigns/packaging-direction" },
  },
  {
    title: "Finish your draft Polst",
    reason: "“Which tagline should we use?” still needs a schedule and a source.",
    cta: { label: "Finish Polst", to: "/polsts/event-hook" },
  },
  {
    title: "Check the Conference Booth QR",
    reason: "It's getting scans, but only 41% of people finish the Polst.",
    cta: { label: "View source", to: "/distribution" },
  },
];

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
    <h2 className="pt-2 font-display text-lg font-bold leading-7 text-text-primary">{title}</h2>
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
    <div className="px-4 py-5 sm:px-5 lg:px-6">
      {/* One narrow reading column for the whole page */}
      <div className="mx-auto max-w-dashboard space-y-6">
        {/* Greeting — centered, with breathing room above and below */}
        <div className="py-4 text-center">
          <h1 className="font-display text-3xl font-bold leading-9 text-text-primary">
            Good afternoon, {firstName}.
          </h1>
        </div>

        {/* Range filter, then the (expandable) stat strip */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <PageTabs tabs={STAT_RANGES} active={range} onChange={setRange} />
            <Button variant="secondary" size="sm" asChild>
              <Link to="/analytics">
                View full analytics
                <Icon name="arrow_forward" size={20} />
              </Link>
            </Button>
          </div>
          <StatsStrip stats={DASHBOARD_STATS[range]} xTicks={STAT_XTICKS[range]} />
        </section>

        {/* The most important row — Campaigns and Polsts */}
        <SectionGrid>
          <DashboardCard
            title="Campaigns"
            className="lg:col-span-7"
            bodyClassName="pt-2"
            action={
              <FilterTabs
                tabs={LIST_FILTERS}
                active={campaignFilter}
                onChange={(t) => setCampaignFilter(t as ListFilter)}
              />
            }
          >
            <div className="scroll-subtle -mx-2 max-h-96 space-y-0.5 overflow-y-auto">
              {campaigns.length ? (
                campaigns.map((c) => <CampaignRow key={c.id} campaign={c} />)
              ) : (
                <EmptyRow label="No campaigns in this view." />
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Polsts"
            className="lg:col-span-5"
            bodyClassName="pt-2"
            action={
              <FilterTabs
                tabs={LIST_FILTERS}
                active={polstFilter}
                onChange={(t) => setPolstFilter(t as ListFilter)}
              />
            }
          >
            <div className="scroll-subtle -mx-2 max-h-96 space-y-0.5 overflow-y-auto">
              {polsts.length ? (
                polsts.map((p) => <PolstMiniRow key={p.id} polst={p} />)
              ) : (
                <EmptyRow label="No Polsts in this view." />
              )}
            </div>
          </DashboardCard>
        </SectionGrid>

        {/* Recommendation & setup */}
        <section className="space-y-4">
          <SectionHeading title="What's next" />
          <SectionGrid>
            {RECOMMENDATIONS.map((rec) => (
              <ActionCard
                key={rec.title}
                className="lg:col-span-4"
                title={rec.title}
                reason={rec.reason}
                primary={rec.cta}
              />
            ))}
          </SectionGrid>

          <NextStepsCard
            title="Get your workspace launch-ready"
            intro="A few steps left before your first campaign runs clean end to end."
            steps={SETUP_STEPS}
          />
        </section>

        {/* The calendar + key dates: one planning band */}
        <SectionHeading title="Plan ahead" />
        <WorkspaceCalendar />

        {/* Key dates — each event its own bento card; only World Cup carries art */}
        <SectionGrid>
          {KEY_DATES.map((date) => {
            const meta = KEY_DATE_META[date.id];
            if (!meta) return null;
            return (
              <ActionCard
                key={date.id}
                className={meta.span}
                eyebrow={fmtRange(date.start, date.end)}
                title={date.title}
                reason={meta.blurb}
                primary={{ label: "Plan a campaign", to: "/campaigns/new" }}
                media={
                  date.id === "world-cup"
                    ? { tone: meta.tone, icon: meta.icon, placement: meta.placement }
                    : undefined
                }
              />
            );
          })}
          <ActionCard
            className="lg:col-span-4"
            title="Send the Flavor Launch report"
            reason="That campaign wrapped and its report is ready to share with your team."
            primary={{ label: "Open report", to: "/analytics/reports" }}
          />
        </SectionGrid>
      </div>
    </div>
  );
}
