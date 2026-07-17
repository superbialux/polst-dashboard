import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  StatsListCard,
  CampaignCard,
  CampaignCardGrid,
  DashboardPage,
  DateRangeMenu,
  EmptyState,
  HeroBanner,
  PageTabs,
  SegmentedControl,
  StatsStrip,
  SuggestionBento,
  SuggestionGrid,
  WorkspaceCalendar,
  type Suggestion,
} from "@/components/dashboard";
import { TODAY, fmtDateRange, fmtInt, isReadyToDecide } from "@/lib/canon";
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
  type Source,
  type StatRange,
} from "@/lib/workspace";

/* ── Suggestions (the Hotjar "Suggested for you" register) ───────── */

/** The attention queue's action verb picks the card's glyph. */
const ACTION_ICONS: Record<string, string> = {
  "Assign sources": "hub",
  "View source": "trending_down",
  "Plan a campaign": "event",
  "Add polsts": "ballot",
  "Finish polst": "edit",
};

/** …and its illustration: add-flow art for setup work, the live-monitor
 *  board for source checks, the clipboard for planning and drafting. */
const ACTION_ART: Record<string, string> = {
  "Assign sources": "/add-polls-to-campaign.png",
  "View source": "/review-active-campaign.png",
  "Plan a campaign": "/edit-campaign.png",
  "Add polsts": "/add-polls-to-campaign.png",
  "Finish polst": "/edit-campaign.png",
};

const ATTENTION_TONES = { danger: "red", warning: "amber", neutral: "neutral" } as const;

/** Evergreen discovery cards — they fill the row only when the workspace
 *  has nothing more urgent to suggest. */
const DISCOVERY: Suggestion[] = [
  {
    id: "discover-qr",
    icon: "qr_code_2",
    tone: "accent",
    title: "Create a QR source",
    description: "Put a polst on packaging or a booth and collect votes offline.",
    action: "Create source",
    to: "/distribution",
    image: "/add-polls-to-campaign.png",
  },
  {
    id: "discover-analytics",
    icon: "monitoring",
    tone: "accent",
    title: "Explore analytics",
    description: "Views, votes, and completion for every campaign and source.",
    action: "Open analytics",
    to: "/analytics",
    image: "/review-active-campaign.png",
  },
  {
    id: "discover-audience",
    icon: "groups",
    tone: "accent",
    title: "Meet your audience",
    description: "Where voters come from and when they show up.",
    action: "Open audience",
    to: "/audience",
    image: "/review-finished-campaign.png",
  },
  {
    id: "discover-settings",
    icon: "palette",
    tone: "neutral",
    title: "Brand your polsts",
    description: "Logo, colors, and domain — make every vote look like you.",
    action: "Open settings",
    to: "/settings",
    image: "/edit-campaign.png",
  },
];

/* ── Page ────────────────────────────────────────────────────────── */

/** Sources currently pointed at a campaign — read from the store so
 *  in-session assignments update every readiness surface at once. */
const campaignSources = (sources: Source[], id: string) =>
  sources.filter((s) => s.linked?.type === "campaign" && s.linked.id === id);

const HOME_TABS = ["Overview", "Calendar"] as const;
type HomeTab = (typeof HOME_TABS)[number];

/** Tab state lives in `?tab=` (the detail pages' pattern) so the
 *  calendar can be deep-linked. Overview is the default. */
function useHomeTab(): [HomeTab, (t: HomeTab) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const active = HOME_TABS.find((t) => t.toLowerCase() === raw) ?? "Overview";
  const set = (t: HomeTab) =>
    setParams(t === "Overview" ? {} : { tab: t.toLowerCase() }, { replace: true });
  return [active, set];
}

export function HomePage() {
  const [tab, setTab] = useHomeTab();
  const [range, setRange] = useState<StatRange>("30D");
  const [campaignView, setCampaignView] = useState<"Active" | "Queued">("Active");
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());
  const { campaigns, polsts, sources } = useWorkspace();

  /* Stats derive from the LIVE store — marker attribution sees campaigns
     created in-session. */
  const stats = useMemo(
    () => dashboardStats(range, campaigns, polsts),
    [range, campaigns, polsts],
  );

  /* Suggested for you: decisions ready to make, then the attention queue
     (already ranked by severity), then discovery. Dismissing a card pulls
     the next candidate into the row; four show at a time. */
  const suggestions = useMemo(() => {
    // Two decision cards at most — the row stays a mix of "decide",
    // "fix", and "discover" instead of a wall of green.
    const ready: Suggestion[] = campaigns.filter(isReadyToDecide).slice(0, 2).map((c) => ({
      id: `ready-${c.id}`,
      icon: c.status === "Ended" ? "flag" : "verified",
      tone: "green",
      title: `Review ${c.name}`,
      description: `${readyTitle(c)} — the lead is ${winnerLabel(c)}.`,
      action: "Review decision",
      to: `/campaigns/${c.id}`,
      // Ended runs show the complete board; live leaders the in-progress one.
      image: c.status === "Ended" ? "/review-finished-campaign.png" : "/review-active-campaign.png",
    }));
    const attention: Suggestion[] = attentionItems(campaigns, polsts, sources).map((item) => ({
      id: item.id,
      icon: ACTION_ICONS[item.action] ?? "arrow_forward",
      tone: ATTENTION_TONES[item.tone],
      title: item.card.title,
      description: item.card.reason,
      action: item.action,
      to: item.to,
      image: ACTION_ART[item.action],
    }));
    // Each card keeps its semantic art unless a neighbour already wears
    // it — then it takes the next unused piece, so the visible row always
    // shows all four illustrations.
    const artPool = [
      "/review-finished-campaign.png",
      "/review-active-campaign.png",
      "/add-polls-to-campaign.png",
      "/edit-campaign.png",
    ];
    const used = new Set<string>();
    return [...ready, ...attention, ...DISCOVERY]
      .filter((s) => !dismissed.has(s.id))
      .slice(0, 4)
      .map((s) => {
        const image =
          s.image && !used.has(s.image) ? s.image : (artPool.find((a) => !used.has(a)) ?? s.image);
        if (image) used.add(image);
        return { ...s, image };
      });
  }, [campaigns, polsts, sources, dismissed]);

  const dismissSuggestion = (id: string) =>
    setDismissed((prev) => new Set(prev).add(id));

  /* Calendar tab's bento: every upcoming key date as a suggestion — a
     covered date links to its campaign, an uncovered one to planning. */
  const eventSuggestions = useMemo<Suggestion[]>(() => {
    const coveredBy = new Map(
      campaigns.filter((c) => c.event && c.status !== "Archived").map((c) => [c.event!, c]),
    );
    const polstEvents = new Set(
      polsts.filter((p) => p.event && p.status !== "Archived").map((p) => p.event!),
    );
    return KEY_DATES.filter((k) => k.end >= TODAY)
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 5)
      .map((k) => {
        const campaign = coveredBy.get(k.id);
        const range = fmtDateRange(k.start, k.end);
        if (campaign)
          return {
            id: `event-${k.id}`,
            icon: "event_available",
            tone: "green" as const,
            title: k.title,
            description: `${range} — covered by ${campaign.name}.`,
            action: "Open campaign",
            to: `/campaigns/${campaign.id}`,
            image: "/review-active-campaign.png",
          };
        return {
          id: `event-${k.id}`,
          icon: "event",
          tone: polstEvents.has(k.id) ? ("accent" as const) : ("amber" as const),
          title: `Plan for ${k.title}`,
          description: `${range} — ${
            polstEvents.has(k.id) ? "a polst is attached, no campaign yet" : "nothing is planned yet"
          }.`,
          action: "Plan campaign",
          to: `/campaigns/new?event=${k.id}`,
          image: "/edit-campaign.png",
        };
      })
      .filter((s) => !dismissed.has(s.id));
  }, [campaigns, polsts, dismissed]);

  /* The rail: two parallel overview panels — the same row shape over
     campaigns and over standalone polsts, so every number carries its
     universe. Votes are all-time (the objects' full runs). */
  const campaignStats = useMemo<Array<[string, string]>>(() => {
    const count = (status: string) => campaigns.filter((c) => c.status === status).length;
    return [
      ["Active", fmtInt(count("Active"))],
      ["Scheduled", fmtInt(count("Scheduled"))],
      ["Ended", fmtInt(count("Ended"))],
      ["Drafts", fmtInt(count("Draft"))],
      ["Votes", fmtInt(campaigns.reduce((a, c) => a + c.votes, 0))],
    ];
  }, [campaigns]);
  const polstStats = useMemo<Array<[string, string]>>(() => {
    const count = (status: string) => polsts.filter((p) => p.status === status).length;
    return [
      ["Active", fmtInt(count("Active"))],
      ["Scheduled", fmtInt(count("Scheduled"))],
      ["Ended", fmtInt(count("Ended"))],
      ["Drafts", fmtInt(count("Draft"))],
      ["Votes", fmtInt(polsts.reduce((a, p) => a + p.votes, 0))],
    ];
  }, [polsts]);

  const activeCampaigns = campaigns.filter((c) => c.status === "Active");
  const queuedCampaigns = useMemo(
    () =>
      campaigns
        .filter((c) => c.status === "Scheduled")
        .sort((a, b) => (a.startAt ?? "").localeCompare(b.startAt ?? "")),
    [campaigns],
  );
  const shownCampaigns = campaignView === "Active" ? activeCampaigns : queuedCampaigns;

  return (
    <DashboardPage
      actions={
        <Button size="sm" asChild>
          <Link to="/polsts/new">Create polst</Link>
        </Button>
      }
    >
      {/* The page's two faces: today's work, and the weeks around it. */}
      <PageTabs tabs={HOME_TABS} active={tab} onChange={setTab} />

      {tab === "Calendar" ? (
        <>
          {/* Upcoming key dates as a bento — covered dates open their
              campaign, uncovered ones open planning. */}
          <SuggestionBento
            title="Coming up"
            suggestions={eventSuggestions}
            onDismiss={dismissSuggestion}
          />
          <WorkspaceCalendar />
        </>
      ) : (
        <>
      {/* 1 · Workspace health leads; every delta states its comparison window. */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DateRangeMenu value={range} onChange={setRange} />
          <Button variant="secondary" size="sm" asChild>
            <Link to="/analytics">View analytics</Link>
          </Button>
        </div>
        <StatsStrip
          stats={stats}
          xTicks={STAT_XTICKS[range]}
          scopeLabel={workspaceWindow(range).compareLabel ?? undefined}
        />
      </section>

      {/* 2 · The two ways in — a campaign, or one quick polst. */}
      <HeroBanner
        left={{
          eyebrow: "Campaigns",
          title: "Create a new campaign",
          description:
            "Chain a few polsts into one run, point your sources at it, and the decision takes shape as votes come in.",
          cta: { label: "Create campaign", to: "/campaigns/new" },
          image: "/campaign.jpg",
        }}
        right={{
          eyebrow: "Polsts",
          title: "Start with a single polst",
          description:
            "One question, two options — live in a minute and ready to share anywhere.",
          cta: { label: "Create polst", to: "/polsts/new" },
          image: "/polst.jpg",
        }}
      />

      {/* 3 · Suggested for you — decisions, fixes, then discovery. */}
      <SuggestionGrid
        title="Suggested for you"
        suggestions={suggestions}
        onDismiss={dismissSuggestion}
      />

      {/* 4 · One campaign, one row — the stats rail rides the last
             quarter with the workspace's campaign totals. */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
            Campaigns
          </h2>
          <SegmentedControl
            tabs={["Active", "Queued"]}
            active={campaignView}
            onChange={setCampaignView}
            size="compact"
          />
        </div>
        <div className="grid items-start gap-3 lg:grid-cols-4">
          <div className="lg:col-span-3">
            {shownCampaigns.length ? (
              <CampaignCardGrid>
                {shownCampaigns.map((c: Campaign) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    sourceCount={campaignSources(sources, c.id).length}
                  />
                ))}
              </CampaignCardGrid>
            ) : (
              <div className="rounded-card border border-border-default bg-surface-raised shadow-sm">
                <EmptyState
                  icon="campaign"
                  title={campaignView === "Active" ? "No active campaigns" : "Nothing is scheduled"}
                  action={{ label: "Create campaign", to: "/campaigns/new" }}
                />
              </div>
            )}
          </div>
          <div className="space-y-3">
            <StatsListCard
              title="All campaigns"
              rows={campaignStats}
              viewAll={{ label: "View all campaigns", to: "/campaigns" }}
            />
            <StatsListCard
              title="All polsts"
              rows={polstStats}
              viewAll={{ label: "View all polsts", to: "/polsts" }}
            />
          </div>
        </div>
      </section>
        </>
      )}
    </DashboardPage>
  );
}
