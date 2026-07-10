import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ActionCard,
  type CardTone,
  CampaignRow,
  DashboardCard,
  DashboardPage,
  DateRangeMenu,
  NextStepsCard,
  SectionGrid,
  SignalBadge,
  type SetupStep,
  StatsStrip,
  WorkspaceCalendar,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";
import {
  CAMPAIGNS,
  DASHBOARD_STATS,
  ATTENTION_ITEMS,
  KEY_DATES,
  STAT_XTICKS,
  type Campaign,
  type ListItem,
  type StatRange,
} from "@/lib/workspace";

/* ── The attention queue ─────────────────────────────────────────────
   Ranked by severity: what blocks a campaign, then what erodes one, then
   what's simply waiting on you. The shared data also drives the sidebar count. */

const ATTENTION_TONE: Record<string, string> = {
  "game-day-distribution": "bg-status-danger",
  "super-bowl-uncovered": "bg-status-danger",
  "event-hook-draft": "bg-icon-secondary",
  "conference-completion": "bg-status-warning",
};

function AttentionRow({ item }: { item: ListItem }) {
  return (
    <li className="flex min-h-12 items-center gap-3 px-4 py-2.5">
      <span
        aria-hidden
        className={cn("h-2 w-2 shrink-0 rounded-pill", ATTENTION_TONE[item.id] ?? "bg-icon-secondary")}
      />
      <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-text-primary">
        {item.title}
      </p>
      {item.to ? (
        <Button variant="secondary" size="sm" className="shrink-0" asChild>
          <Link to={item.to}>{item.action}</Link>
        </Button>
      ) : null}
    </li>
  );
}

/** The workspace setup checklist (Shopify "Get your first N" pattern). */
const SETUP_STEPS: SetupStep[] = [
  {
    title: "Name your first campaign",
    description: "Packaging Direction Test is ready.",
    done: true,
    cta: { label: "View campaign", to: "/campaigns/packaging-direction" },
    media: { tone: "green", icon: "campaign", placement: "side" },
  },
  {
    title: "Add a distribution source",
    description: "Connect a link, QR code, or embed.",
    cta: { label: "Add a source", to: "/distribution" },
    media: { tone: "accent", icon: "hub", placement: "side" },
  },
  {
    title: "Confirm the campaign schedule",
    description: "Confirm launch and end dates.",
    cta: { label: "Review schedule", to: "/campaigns/game-day-creative" },
    media: { tone: "amber", icon: "calendar_month", placement: "side" },
  },
  {
    title: "Complete your brand profile",
    description: "Add your logo, website, and timezone.",
    cta: { label: "Open profile", to: "/settings" },
    media: { tone: "neutral", icon: "business", placement: "side" },
  },
  {
    title: "Invite a teammate",
    description: "Add teammates and choose access.",
    cta: { label: "Manage team", to: "/settings" },
    media: { tone: "green", icon: "group", placement: "side" },
  },
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

function ReadyDecisionCard({ campaign }: { campaign: Campaign }) {
  return (
    <DashboardCard title="Ready to decide" className="lg:col-span-4">
      <SignalBadge signal={campaign.signal} detail={`${campaign.confidence} confidence`} />
      <Link
        to={`/campaigns/${campaign.id}`}
        className="mt-2 block font-display text-base font-semibold leading-6 text-text-primary hover:text-text-accent"
      >
        {campaign.name}
      </Link>
      <dl className="mt-3 grid grid-cols-2 gap-3 border-y border-border-default py-3">
        <div>
          <dt className="text-xs text-text-secondary">Lead</dt>
          <dd className="mt-0.5 text-sm font-semibold text-text-primary">{campaign.winner}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-secondary">Responses</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">
            {campaign.responses.toLocaleString()} / {campaign.target.toLocaleString()}
          </dd>
        </div>
      </dl>
      <Button className="mt-3 w-full" asChild>
        <Link to={`/campaigns/${campaign.id}`}>Review decision</Link>
      </Button>
    </DashboardCard>
  );
}

export function HomePage() {
  const [range, setRange] = useState<StatRange>("30D");
  const campaigns = CAMPAIGNS.filter((campaign) => campaign.status === "Active");
  const readyCampaign = campaigns.find((campaign) => campaign.signal === "Leading") ?? campaigns[0];

  return (
    <DashboardPage>
        {/* Real-time health leads without a section title. */}
        <section className="space-y-2">
          <div className="flex justify-end">
            <DateRangeMenu value={range} onChange={setRange} />
          </div>
          <StatsStrip
            stats={DASHBOARD_STATS[range]}
            xTicks={STAT_XTICKS[range]}
          />
        </section>

        <NextStepsCard
          title="Get your workspace launch-ready"
          steps={SETUP_STEPS}
        />

        <DashboardCard
          title="Active campaigns"
          bodyClassName="pt-2"
          action={
            <Button variant="secondary" size="sm" asChild>
              <Link to="/campaigns">View all</Link>
            </Button>
          }
        >
          <div className="-mx-2 space-y-0.5">
            {campaigns.length ? (
              campaigns.map((c) => <CampaignRow key={c.id} campaign={c} />)
            ) : (
              <EmptyRow label="No active campaigns." />
            )}
          </div>
        </DashboardCard>

        {/* Structured priorities, without generated narrative copy. */}
        <SectionGrid>
          {readyCampaign ? <ReadyDecisionCard campaign={readyCampaign} /> : null}
          <DashboardCard
            title={`${ATTENTION_ITEMS.length} need attention`}
            className="lg:col-span-8"
            padded={false}
            bodyClassName="pb-1"
          >
            <ul className="divide-y divide-border-default">
              {ATTENTION_ITEMS.map((item) => (
                <AttentionRow key={item.id} item={item} />
              ))}
            </ul>
          </DashboardCard>
        </SectionGrid>

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

    </DashboardPage>
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
