import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Menu, MenuItem, MenuSeparator } from "@/components/Menu";
import { PollCard } from "@/components/PollCard";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard, useToast } from "@/components/Toast";
import {
  CONTROL,
  Checkbox,
  Field,
  FieldHelper,
  SelectMenu,
  TextInput,
} from "@/components/Field";
import { QrCodeModal } from "@/components/DistributionActions";
import { PolstComposerModal } from "@/components/PolstComposerModal";
import {
  AssignSourceModal,
  Chip,
  ConfirmModal,
  CopyableField,
  DashboardCard,
  DashboardPage,
  DataTable,
  DecisionBrief,
  DetailList,
  DurationField,
  EmptyState,
  Funnel,
  InfoHint,
  durationEnd,
  durationPresetFor,
  ModalFooter,
  NextStepsCard,
  NotFoundCard,
  PageTabs,
  PollResults,
  PolstListRow,
  RateCell,
  ReportPreview,
  ReviewModal,
  TableToolbar,
  ChecklistItem,
  TablePagination,
  StatusSelect,
  ViewToggle,
  DateRangePicker,
  CampaignCard,
  sortRows,
  type SortState,
  SectionGrid,
  SectionTitle,
  filterByCreated,
  SnippetCard,
  StatusBadge,
  ThumbStrip,
  UnassignButton,
  filterByStatus,
  type DataColumn,
  type DurationPreset,
  type FunnelStep,
  type SetupStep,
} from "@/components/dashboard";
import {
  METRIC_INFO,
  TODAY,
  daysBetween,
  fmtDate,
  fmtDateRange,
  fmtInt,
  isReadyToDecide,
  pct,
  relativeToToday,
} from "@/lib/canon";
import {
  KEY_DATES,
  WHAT_CHANGED,
  clipToRun,
  decisionEyebrow,
  embedIframe,
  embedScript,
  headlineLabel,
  polstOptions,
  shareUrl,
  type Campaign,
  type CampaignReviewState,
  type ChainQuestion,
  type Source,
  WORKSPACE,
} from "@/lib/workspace";
import {
  INSIGHT_STATE_TONE,
  campaignReadout,
  dataThrough,
  insightStateFor,
  polstRole,
  qualifiesForInsights,
} from "@/lib/insights";
import { useWorkspace } from "@/lib/store";

/* ── Shared vocabulary ───────────────────────────────────────────── */

/** The one status filter set — "All" passes everything through. */
const CAMPAIGN_FILTERS = ["All", "Active", "Scheduled", "Drafts", "Ended", "Archived"] as const;

const EVENT_OPTIONS = [
  { value: "", label: "No event" },
  ...KEY_DATES.map((k) => ({ value: k.id, label: `${k.title} · ${fmtDate(k.start)}` })),
];

const eventTitle = (id?: string) => KEY_DATES.find((k) => k.id === id)?.title ?? "—";

/** This campaign's sources, read live from the store (never the stale
 *  back-refs baked onto the entity at module load). */
const campaignSources = (sources: Source[], id: string) =>
  sources.filter((s) => s.linked?.type === "campaign" && s.linked.id === id);

/* ── Campaigns list ──────────────────────────────────────────────── */

/** Time is spoken under the name, never mixed into the funnel columns —
 *  "Finish rate never communicates time remaining" (audit workflow 14). */
const scheduleNote = (row: Campaign): string | null => {
  if (row.status === "Active" && row.endAt) return `ends ${relativeToToday(row.endAt)}`;
  if (row.status === "Scheduled" && row.startAt) return `starts ${relativeToToday(row.startAt)}`;
  return null;
};

const listColumns: Array<DataColumn<Campaign>> = [
  {
    header: "Campaign",
    sort: (row) => row.name.toLowerCase(),
    // A real link, like the polsts list — the row onClick is a pointer
    // convenience, but keyboard and screen-reader users need an anchor.
    cell: (row) => (
      <Link to={`/campaigns/${row.id}`} className="group block min-w-0">
        <p className="font-display font-semibold text-text-primary group-hover:text-text-accent">
          {row.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {fmtDateRange(row.startAt, row.endAt)}
          {scheduleNote(row) ? ` · ${scheduleNote(row)}` : ""}
        </p>
      </Link>
    ),
  },
  { header: "Status", sort: (row) => row.status, cell: (row) => <StatusBadge status={row.status} /> },
  {
    header: "Polsts",
    sort: (row) => row.chain.length,
    cell: (row) => <ThumbStrip ids={row.chain.map((q) => q.id)} />,
  },
  /* The index speaks the card line's vocabulary: total votes across the
     chain, and the finish rate. The participant goal lives on the
     detail, never as a "1,486 / 1,200" shorthand. */
  {
    header: "Total votes",
    info: METRIC_INFO.votes,
    align: "right",
    sort: (row) => row.votes,
    cell: (row) => <span className="tabular-nums">{fmtInt(row.votes)}</span>,
  },
  {
    header: "Finish rate",
    info: METRIC_INFO.finishRate,
    align: "right",
    sort: (row) => (row.voters > 0 ? row.completed / row.voters : -1),
    cell: (row) => pct(row.completed, row.voters),
  },
  {
    header: "Created",
    sort: (row) => row.createdAt,
    cell: (row) => <span className="whitespace-nowrap">{fmtDate(row.createdAt)}</span>,
  },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
        <CampaignRowMenu campaign={row} />
      </div>
    ),
  },
];

const PAGE_SIZE = 25;

/* ── Row actions ─────────────────────────────────────────────────── */

/** One labeled overflow menu per row; items follow the lifecycle.
 *  Campaigns pause and resume, never delete — a run's record stays. */
function CampaignRowMenu({ campaign }: { campaign: Campaign }) {
  const {
    pauseCampaign,
    resumeCampaign,
    unpublishCampaign,
    archiveCampaign,
    restoreCampaign,
  } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();
  const view = (
    <MenuItem icon="visibility" label="View" onClick={() => navigate(`/campaigns/${campaign.id}`)} />
  );

  return (
    <Menu
      label={`Actions for ${campaign.name}`}
      trigger={({ open, toggle }) => (
        <Button
          variant="ghost"
          size="icon"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Actions for ${campaign.name}`}
          onClick={toggle}
        >
          <Icon name="more_horiz" size={18} />
        </Button>
      )}
    >
      {campaign.status === "Active" ? (
        <>
          {view}
          <MenuItem
            icon="pause"
            label="Pause campaign"
            onClick={() => {
              pauseCampaign(campaign.id);
              toast("Campaign paused — collection is on hold");
            }}
          />
        </>
      ) : campaign.status === "Paused" ? (
        <>
          {view}
          <MenuItem
            icon="play_arrow"
            label="Resume campaign"
            onClick={() => {
              const status = resumeCampaign(campaign.id);
              toast(
                status === "Ended"
                  ? "Resumed — its dates already passed, so it's Ended"
                  : "Campaign resumed — collecting again",
              );
            }}
          />
        </>
      ) : campaign.status === "Scheduled" ? (
        <>
          {view}
          <MenuItem
            icon="undo"
            label="Unpublish"
            onClick={() => {
              const result = unpublishCampaign(campaign.id);
              toast(result.ok ? "Campaign unpublished — back to drafts" : result.reason);
            }}
          />
        </>
      ) : campaign.status === "Ended" ? (
        <>
          {view}
          <MenuSeparator />
          <MenuItem
            icon="archive"
            label="Move to archive"
            onClick={() => {
              archiveCampaign(campaign.id);
              toast("Moved to archive");
            }}
          />
        </>
      ) : campaign.status === "Archived" ? (
        <>
          {view}
          <MenuItem
            icon="restore"
            label={campaign.voters > 0 ? "Restore" : "Restore to drafts"}
            onClick={() => {
              const status = restoreCampaign(campaign.id);
              toast(
                status === "Ended"
                  ? "Restored — back under Ended (its voters are part of the record)"
                  : "Restored to drafts",
              );
            }}
          />
        </>
      ) : (
        <MenuItem icon="edit" label="Edit draft" onClick={() => navigate(`/campaigns/${campaign.id}`)} />
      )}
    </Menu>
  );
}

export function CampaignsPage() {
  const { campaigns, sources } = useWorkspace();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("All");
  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = filterByCreated(filterByStatus(campaigns, active), createdFrom, createdTo).filter(
      (c) =>
        !q ||
        [c.name, c.decision, eventTitle(c.event), c.category].some((v) =>
          v.toLowerCase().includes(q),
        ),
    );
    // The FULL list sorts before pagination — page 2 continues page 1's order.
    return sortRows(filtered, listColumns, sort);
  }, [campaigns, active, query, createdFrom, createdTo, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };
  const sourceCount = (id: string) =>
    sources.filter((s) => s.linked?.type === "campaign" && s.linked.id === id).length;

  const searching = query.trim().length > 0;
  const dateFiltered = Boolean(createdFrom || createdTo);

  return (
    <DashboardPage
      actions={
        <Button asChild>
          <Link to="/campaigns/new">Create campaign</Link>
        </Button>
      }
      // The pager lives in the fixed footer band — always visible,
      // never scrolling, the header's mirror.
      footer={
        rows.length ? (
          <TablePagination
            page={safePage}
            pageSize={PAGE_SIZE}
            total={rows.length}
            onPage={setPage}
            noun="campaigns"
          />
        ) : null
      }
    >
      {/* The action row rides ABOVE the card — the stat hero's altitude. */}
      <section className="space-y-2">
        <TableToolbar placeholder="Search campaigns" query={query} onQueryChange={resetPage(setQuery)}>
          <StatusSelect
            options={CAMPAIGN_FILTERS}
            value={active}
            onChange={resetPage(setActive)}
          />
          <DateRangePicker
            from={createdFrom}
            to={createdTo}
            placeholder="Created date"
            onChange={(f, t) => {
              setCreatedFrom(f);
              setCreatedTo(t);
              setPage(0);
            }}
          />
          <ViewToggle value={view} onChange={setView} />
        </TableToolbar>
        {rows.length > 0 && view === "grid" ? (
          <div className="grid items-start gap-3 lg:grid-cols-2">
            {pageRows.map((c) => (
              <CampaignCard key={c.id} campaign={c} sourceCount={sourceCount(c.id)} />
            ))}
          </div>
        ) : (
        <DashboardCard padded={false}>
        {searching && rows.length > 0 ? (
          <p className="border-b border-border-default px-4 py-2 text-xs text-text-secondary">
            {rows.length} {rows.length === 1 ? "campaign matches" : "campaigns match"} “
            {query.trim()}”
          </p>
        ) : null}
        {rows.length > 0 ? (
          <DataTable
            rows={pageRows}
            columns={listColumns}
            onRowClick={(row) => navigate(`/campaigns/${row.id}`)}
            sort={sort}
            onSortChange={resetPage(setSort)}
          />
        ) : searching || dateFiltered ? (
          <EmptyState
            icon="search"
            title={
              searching
                ? `No campaigns match “${query.trim()}”`
                : "No campaigns were created in this date range"
            }
            action={{
              label: "Clear filters",
              onClick: () => {
                setQuery("");
                setCreatedFrom("");
                setCreatedTo("");
              },
            }}
          />
        ) : (
          <EmptyState
            icon="campaign"
            title={
              active === "All"
                ? "No campaigns yet"
                : active === "Drafts"
                  ? "No draft campaigns"
                  : `No ${active.toLowerCase()} campaigns`
            }
            action={
              active === "All" || active === "Drafts"
                ? { label: "Create campaign", to: "/campaigns/new" }
                : undefined
            }
          />
        )}
        </DashboardCard>
        )}
      </section>
    </DashboardPage>
  );
}

/* ── Create campaign ─────────────────────────────────────────────── */

/* ── Create campaign: the four-step builder ──────────────────────── */

const BUILDER_STEPS = ["Decision", "Build chain", "Distribution", "Review"] as const;

/** Steps dressed EXACTLY like header tabs — quiet labels, the active
 *  one on the accent underline — with the step number ahead of the
 *  name and a chevron between stops. Visited steps stay clickable. */
function StepTabs({
  current,
  maxStep,
  onStep,
}: {
  current: number; // 1-based
  maxStep: number;
  onStep: (step: number) => void;
}) {
  return (
    <nav aria-label="Campaign builder steps" className="flex items-center gap-1">
      {BUILDER_STEPS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const reachable = step <= maxStep;
        return (
          <span key={label} className="flex items-center gap-1">
            <button
              type="button"
              disabled={!reachable}
              aria-current={active ? "step" : undefined}
              onClick={() => onStep(step)}
              className={cn(
                "relative flex h-9 items-center gap-1 px-1 font-display text-sm font-medium transition-colors",
                active
                  ? "text-text-primary"
                  : reachable
                    ? "text-text-secondary hover:text-text-primary"
                    : "cursor-default text-text-tertiary",
              )}
            >
              <span className="tabular-nums">{step}.</span>
              {label}
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 border-b-2 border-accent-default"
                />
              ) : null}
            </button>
            {i < BUILDER_STEPS.length - 1 ? (
              <Icon name="chevron_right" size={16} className="shrink-0 text-icon-tertiary" />
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}

/* ── Presets: what a campaign can be ─────────────────────────────── */

type ChainSeed = { question: string; optionA: string; optionB: string };

type CampaignPreset = {
  id: string;
  icon: string;
  title: string;
  description: string;
  name?: string;
  decision?: string;
  chain?: ChainSeed[];
};

/** Each preset is a finished campaign one Continue away — they exist to
 *  show the range: big-screen creative, product concepts, audiences,
 *  events, internal calls. Scratch comes first and stays blank. */
const PRESETS: CampaignPreset[] = [
  {
    id: "scratch",
    icon: "edit_square",
    title: "Start from scratch",
    description: "A blank campaign — name it, chain your own polsts, and shape the decision yourself.",
  },
  {
    id: "big-screen",
    icon: "featured_video",
    title: "Big-screen creative test",
    description:
      "Pick the ad that survives a six-second glance — built for jumbotrons, transit screens, and billboards.",
    name: "Big-Screen Creative Test",
    decision: "Which creative should run on the big screens?",
    chain: [
      { question: "Which visual reads from across the street?", optionA: "Bold product shot", optionB: "Lifestyle scene" },
      { question: "Which four-word tagline lands?", optionA: "Taste the season", optionB: "Made for right now" },
      { question: "Which color field pops at night?", optionA: "Electric violet", optionB: "Warm cream" },
    ],
  },
  {
    id: "concept-faceoff",
    icon: "category",
    title: "Product concept face-off",
    description:
      "Two concepts enter, one gets built — compare the idea, its name, and its price before a dollar of tooling.",
    name: "Product Concept Face-Off",
    decision: "Which product concept do we take to market?",
    chain: [
      { question: "Which concept should we build?", optionA: "Protein granola", optionB: "Overnight oats kit" },
      { question: "Which name sells it?", optionA: "Morning Fuel", optionB: "First Light" },
      { question: "Which launch price feels fair?", optionA: "$6.99", optionB: "$8.49" },
    ],
  },
  {
    id: "find-audience",
    icon: "groups",
    title: "Find your audience",
    description:
      "Let voters tell you who this is for — pair creator styles and vibes until the audience shows itself.",
    name: "Audience Finder",
    decision: "Which audience and creator lane fits the brand?",
    chain: [
      { question: "Whose kitchen do you trust?", optionA: "Chef-led recipes", optionB: "Real-home cooking" },
      { question: "Which collab would you watch?", optionA: "Athlete morning routine", optionB: "Artist studio snacks" },
      { question: "What matters more?", optionA: "Low sugar", optionB: "High protein" },
    ],
  },
  {
    id: "event-activation",
    icon: "celebration",
    title: "Event activation planner",
    description:
      "Plan the booth before you book it — sampling, giveaway, and signage decided by the crowd you'll meet.",
    name: "Event Activation Planner",
    decision: "What runs at the event booth?",
    chain: [
      { question: "Which sample stops foot traffic?", optionA: "Iced tasting flight", optionB: "Warm mini-bites" },
      { question: "Which giveaway gets kept?", optionA: "Tote bag", optionB: "Enamel mug" },
      { question: "Which sign pulls people in?", optionA: "Neon logo", optionB: "Chalkboard menu" },
    ],
  },
  {
    id: "internal-pulse",
    icon: "diversity_3",
    title: "Internal pulse check",
    description:
      "Settle the team debate with votes instead of meetings — quick calls, results in days.",
    name: "Internal Pulse Check",
    decision: "What does the team actually want?",
    chain: [
      { question: "Which roadmap bet comes first?", optionA: "New flavors", optionB: "New formats" },
      { question: "Which office snack restock?", optionA: "Sparkling water", optionB: "Cold brew keg" },
      { question: "Offsite: mountains or coast?", optionA: "Mountains", optionB: "Coast" },
    ],
  },
];

export function CreateCampaignPage() {
  const {
    campaigns,
    sources: allSources,
    campaignById,
    createCampaign,
    updateCampaign,
    publishCampaign,
    reorderChain,
    removeChainQuestion,
    addQuestionToCampaign,
    assignSource,
    addSource,
  } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventParam = params.get("event") ?? "";

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const goStep = (next: number) => {
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
  };

  const [preset, setPreset] = useState<string>("scratch");
  const [name, setName] = useState("");
  const [decision, setDecision] = useState("");
  const [startAt, setStartAt] = useState("");
  const [duration, setDuration] = useState<DurationPreset>("7 days");
  const [customEnd, setCustomEnd] = useState("");
  const [event, setEvent] = useState(
    KEY_DATES.some((k) => k.id === eventParam) ? eventParam : "",
  );
  useEffect(() => {
    setEvent(KEY_DATES.some((k) => k.id === eventParam) ? eventParam : "");
  }, [eventParam]);

  /* The page IS the draft: the first meaningful change mints it, every
     change after patches it — nothing here can be lost by leaving. */
  const [draftId, setDraftId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"initial" | "saving" | "saved">("initial");
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleSave = () => {
    setSaveState("saving");
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setSaveState("saved"), 1200);
  };

  const [composerOpen, setComposerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const endAt = durationEnd(duration, startAt, customEnd);
  const endBeforeStart = Boolean(endAt && startAt && endAt < startAt);

  const draftInput = () => ({
    name: name.trim() || "Untitled campaign",
    decision: decision.trim() || undefined,
    startAt: startAt || undefined,
    endAt,
    event: event || undefined,
  });

  const draftIdRef = useRef<string | null>(null);
  draftIdRef.current = draftId;
  const ensureDraft = () => {
    if (draftIdRef.current) return draftIdRef.current;
    const id = createCampaign(draftInput());
    setDraftId(id);
    return id;
  };

  // Autosave: the spinner starts with the keystroke; 600ms after the
  // last one the draft is current, and the footer settles on saved.
  useEffect(() => {
    const dirty = name.trim() || decision.trim() || startAt || event;
    if (!dirty && !draftIdRef.current) return;
    settleSave();
    const t = setTimeout(() => {
      if (!draftIdRef.current) ensureDraft();
      else updateCampaign(draftIdRef.current, draftInput());
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, decision, startAt, duration, customEnd, event]);

  const draftCampaign = draftId ? campaignById(draftId) : undefined;
  const chain = draftCampaign?.chain ?? [];
  const selectedChain = chain.find((q) => q.id === selectedChainId) ?? chain[0];

  // Chain edits (add / reorder / remove) are saves too — same signal.
  const prevChainLength = useRef(chain.length);
  useEffect(() => {
    if (chain.length !== prevChainLength.current && draftIdRef.current) settleSave();
    prevChainLength.current = chain.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain.length]);

  /** A preset prefills EVERYTHING — details and the staged chain — so
   *  the rest of the flow is Continue, Continue, launch. */
  const applyPreset = (p: CampaignPreset) => {
    setPreset(p.id);
    if (p.id === "scratch") return;
    setName(p.name ?? "");
    setDecision(p.decision ?? "");
    if (!startAt) setStartAt(TODAY);
    const id = ensureDraft();
    updateCampaign(id, {
      name: p.name ?? "Untitled campaign",
      decision: p.decision,
      startAt: startAt || TODAY,
      endAt,
      event: event || undefined,
    });
    // Stage the preset chain once — re-picking a preset resets nothing
    // that's already staged (evidence-safe; remove rows by hand).
    const existing = campaignById(id)?.chain ?? [];
    if (existing.length === 0 && p.chain) {
      for (const q of p.chain) addQuestionToCampaign(id, q);
    }
    settleSave();
  };

  const assigned = draftId
    ? allSources.filter((s) => s.linked?.type === "campaign" && s.linked.id === draftId)
    : [];
  // The honest estimate: what these sources delivered historically.
  const estReach = assigned.reduce((a, s) => a + s.views, 0);
  const estVoters = assigned.reduce((a, s) => a + s.voters, 0);

  const finish = (launchNow: boolean) => {
    if (finishing) return;
    const id = ensureDraft();
    updateCampaign(id, draftInput());
    if (!launchNow) {
      setFinishing(true);
      toast("Saved to drafts");
      navigate(`/campaigns/${id}`);
      return;
    }
    const result = publishCampaign(id);
    if (!result.ok) {
      toast(result.reason);
      return;
    }
    setFinishing(true);
    toast(
      result.status === "Scheduled"
        ? `Campaign scheduled — starts ${fmtDate(startAt)}`
        : result.status === "Ended"
          ? "Campaign published — its dates are already past, so it's Ended"
          : "Campaign launched — it's live",
    );
    navigate(`/campaigns/${id}`);
  };

  const otherDrafts = campaigns
    .filter((c) => c.status === "Draft" && c.id !== draftId)
    .slice(0, 3);

  const canContinue =
    step === 1 ? Boolean(name.trim()) && !endBeforeStart : step === 2 ? chain.length > 0 : true;

  return (
    <DashboardPage
      tabs={<StepTabs current={step} maxStep={maxStep} onStep={goStep} />}
      footer={
        <>
          <p className="flex items-center gap-1.5 text-sm text-text-secondary">
            {saveState === "saving" ? (
              <>
                <Icon name="progress_activity" size={16} className="animate-spin text-icon-secondary" />
                Saving…
              </>
            ) : saveState === "saved" ? (
              <>
                <Icon name="done_all" size={16} className="text-status-success" />
                Changes saved
              </>
            ) : (
              <>
                <Icon name="done_all" size={16} className="text-icon-tertiary" />
                Saved as draft
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" asChild>
                <Link to="/campaigns">Cancel</Link>
              </Button>
            )}
            {step < 4 ? (
              <Button
                disabled={!canContinue}
                title={
                  step === 1 && !name.trim()
                    ? "Name the campaign to continue."
                    : step === 2 && chain.length === 0
                      ? "Add at least one polst to continue."
                      : undefined
                }
                onClick={() => goStep(step + 1)}
              >
                Continue
                <Icon name="arrow_forward" size={16} />
              </Button>
            ) : (
              <>
                <Button variant="secondary" disabled={finishing} onClick={() => finish(false)}>
                  Keep as draft
                </Button>
                <Button disabled={finishing || chain.length === 0} onClick={() => finish(true)}>
                  Create &amp; launch
                </Button>
              </>
            )}
          </div>
        </>
      }
    >
      {step === 1 ? (
        <SectionGrid>
          <div className="space-y-4 lg:col-span-8">
            <DashboardCard
              title="What kind of decision is this?"
              description="Pick a preset to see what a campaign can carry — everything prefills, ready to launch."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {PRESETS.map((p) => {
                  const active = preset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col items-start rounded-md border p-4 text-left transition-colors",
                        active
                          ? "border-accent-default bg-accent-soft/40 ring-1 ring-accent-default"
                          : "border-border-default bg-surface-raised hover:border-border-strong",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-md",
                          active ? "bg-accent-soft text-accent-default" : "bg-surface-subtle text-icon-secondary",
                        )}
                      >
                        <Icon name={p.icon} size={20} />
                      </span>
                      <span className="mt-3 font-display text-sm font-semibold leading-5 text-text-primary">
                        {p.title}
                      </span>
                      <span className="mt-1 text-sm leading-5 text-text-secondary">
                        {p.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </DashboardCard>
            <DashboardCard title="Campaign details">
              <div className="space-y-5">
                <Field label="Campaign name" required>
                  {(id) => (
                    <TextInput
                      id={id}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={255}
                      placeholder="Summer launch"
                    />
                  )}
                </Field>
                <Field label="Decision question">
                  {(id) => (
                    <textarea
                      id={id}
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      rows={2}
                      placeholder="Which flavor should lead retail sell-in?"
                      className={cn(CONTROL, "h-auto min-h-16 resize-none px-3 py-2.5")}
                    />
                  )}
                </Field>
                <Field label="Start date">
                  {(id) => (
                    <TextInput
                      id={id}
                      type="date"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                    />
                  )}
                </Field>
                <DurationField
                  value={duration}
                  onChange={setDuration}
                  customEnd={customEnd}
                  onCustomEndChange={setCustomEnd}
                  startAt={startAt}
                  subject="campaign"
                />
                {endBeforeStart ? (
                  <FieldHelper tone="danger">The end date is before the start.</FieldHelper>
                ) : null}
              </div>
            </DashboardCard>
          </div>
          <div className="space-y-4 self-start lg:col-span-4">
            <DashboardCard>
              <h2 className="font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
                About campaigns
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-text-secondary">
                A campaign bundles several polsts under one shareable link. Voters see them in
                the order you set — use one per launch, event, or research round.
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  "Reorder polsts at any time before launch",
                  "Pull from your existing polst library",
                  "Share via link, QR, or embed code",
                  "End the campaign manually",
                ].map((line) => (
                  <ChecklistItem key={line} tone="done">
                    {line}
                  </ChecklistItem>
                ))}
              </ul>
            </DashboardCard>
            {otherDrafts.length > 0 ? (
              <DashboardCard>
                <h2 className="font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
                  Drafts
                </h2>
                <div className="mt-3 space-y-2">
                  {otherDrafts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-semibold text-text-primary">
                          {c.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-secondary">
                          Created {fmtDate(c.createdAt)}
                        </span>
                      </span>
                      <Button variant="secondary" size="sm" asChild className="shrink-0">
                        <Link to={`/campaigns/${c.id}`}>Open</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </DashboardCard>
            ) : null}
          </div>
        </SectionGrid>
      ) : step === 2 ? (
        <SectionGrid>
          <div className="lg:col-span-7">
            <DashboardCard
              title="Polsts"
              action={
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      ensureDraft();
                      setLibraryOpen(true);
                    }}
                  >
                    Add from library
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      ensureDraft();
                      setComposerOpen(true);
                    }}
                  >
                    Create polst
                  </Button>
                </div>
              }
            >
              {chain.length ? (
                <ul className="space-y-2">
                  {chain.map((q, i) => {
                    const selected = (selectedChain?.id ?? null) === q.id;
                    return (
                      <li
                        key={q.id}
                        draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragIndex !== null && dragIndex !== i && draftId) {
                            reorderChain(draftId, dragIndex, i);
                            settleSave();
                          }
                          setDragIndex(null);
                        }}
                        onDragEnd={() => setDragIndex(null)}
                        onClick={() => setSelectedChainId(q.id)}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-colors",
                          selected
                            ? "border-accent-default ring-1 ring-accent-default"
                            : "border-border-default bg-surface-raised hover:border-border-strong",
                          dragIndex === i && "opacity-50",
                        )}
                      >
                        <Icon name="drag_indicator" size={18} className="shrink-0 cursor-grab text-icon-tertiary" />
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-surface-subtle font-display text-xs font-semibold text-text-secondary">
                          {i + 1}
                        </span>
                        <PolstListRow
                          className="pointer-events-none min-w-0 flex-1"
                          question={q.question}
                          options={polstOptions({
                            id: q.id,
                            optionA: q.optionA,
                            optionB: q.optionB,
                            splitA: q.splitA,
                            votes: 0,
                          })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${q.question} from the chain`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (draftId) {
                              removeChainQuestion(draftId, q.id);
                              settleSave();
                            }
                          }}
                        >
                          <Icon name="close" size={18} />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon="ballot"
                  title="No polsts yet"
                  hint="Create one or pull from the library — voters answer them in order."
                />
              )}
            </DashboardCard>
          </div>
          {/* The REAL card, exactly as voters get it — click a row to
              preview it here. */}
          <div className="self-start lg:sticky lg:top-4 lg:col-span-5">
            {selectedChain ? (
              <PollCard
                preview
                author={WORKSPACE.brand}
                authorBadge={WORKSPACE.initials}
                authorColor="var(--color-purple-tint)"
                isFollowing
                categories={[]}
                question={selectedChain.question}
                options={polstOptions({
                  id: selectedChain.id,
                  optionA: selectedChain.optionA,
                  optionB: selectedChain.optionB,
                  splitA: selectedChain.splitA,
                  votes: 0,
                })}
                tags={[]}
                likes={0}
                reposts={0}
                votes={0}
              />
            ) : (
              <DashboardCard>
                <EmptyState
                  icon="visibility"
                  title="Nothing to preview yet"
                  hint="Add a polst and click its row to see the card voters will get."
                />
              </DashboardCard>
            )}
          </div>
        </SectionGrid>
      ) : step === 3 ? (
        <SectionGrid>
          <div className="lg:col-span-8">
            <DashboardCard
              title="Sources"
              description="Where voters will come from — QR codes, links, and embeds pointed at this campaign."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    ensureDraft();
                    setAssignOpen(true);
                  }}
                >
                  Add source
                </Button>
              }
            >
              {assigned.length ? (
                <ul className="divide-y divide-border-default">
                  {assigned.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate font-display text-sm font-semibold text-text-primary">
                          {s.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-secondary">
                          {s.kind} · {s.channel}
                        </span>
                      </span>
                      <StatusBadge status={s.voters > 0 ? "Active" : "Scheduled"} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon="hub"
                  title="No sources yet"
                  hint="A campaign can launch without sources — but nothing collects voters until one exists."
                />
              )}
            </DashboardCard>
          </div>
          <div className="self-start lg:col-span-4">
            <DashboardCard>
              <h2 className="font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
                Estimated reach
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-text-secondary">
                Based on what these sources delivered on their previous runs.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border-default pt-4">
                <div>
                  <dt className="text-xs text-text-secondary">Views</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-text-primary">
                    {assigned.length && estReach > 0 ? fmtInt(estReach) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-secondary">Voters</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-text-primary">
                    {assigned.length && estVoters > 0 ? fmtInt(estVoters) : "—"}
                  </dd>
                </div>
              </dl>
              {assigned.length === 0 ? (
                <p className="mt-3 text-xs text-text-tertiary">
                  Assign a source with history and the estimate fills in.
                </p>
              ) : null}
            </DashboardCard>
          </div>
        </SectionGrid>
      ) : (
        <SectionGrid>
          <div className="space-y-4 lg:col-span-8">
            <DashboardCard title="Review">
              <DetailList
                items={[
                  ["Name", name.trim() || "Untitled campaign"],
                  ["Decision", decision.trim() || "—"],
                  ["Runs", fmtDateRange(startAt || undefined, endAt)],
                  ["Polsts", fmtInt(chain.length)],
                  ["Sources", fmtInt(assigned.length)],
                ]}
              />
            </DashboardCard>
            <DashboardCard title="The chain, in order">
              {chain.length ? (
                <ul className="space-y-2">
                  {chain.map((q, i) => (
                    <li key={q.id} className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-surface-subtle font-display text-xs font-semibold text-text-secondary">
                        {i + 1}
                      </span>
                      <PolstListRow
                        className="min-w-0 flex-1"
                        question={q.question}
                        options={polstOptions({
                          id: q.id,
                          optionA: q.optionA,
                          optionB: q.optionB,
                          splitA: q.splitA,
                          votes: 0,
                        })}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon="ballot" title="No polsts yet" />
              )}
            </DashboardCard>
          </div>
          <div className="self-start lg:col-span-4">
            <DashboardCard>
              <h2 className="font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
                What launching does
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-text-secondary">
                The chain and start date lock once the first vote arrives. Keep it as a draft
                and everything stays editable — either way you land on the campaign page.
              </p>
            </DashboardCard>
          </div>
        </SectionGrid>
      )}

      {draftCampaign ? (
        <>
          <PolstComposerModal
            open={composerOpen}
            onClose={() => setComposerOpen(false)}
            campaign={{ id: draftCampaign.id, name: draftCampaign.name }}
          />
          <SelectFromLibraryModal
            open={libraryOpen}
            onClose={() => setLibraryOpen(false)}
            campaign={draftCampaign}
          />
          <AssignSourceModal
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            unlinked={allSources.filter((s) => !s.linked)}
            onAssign={(s) => {
              assignSource(s.id, { type: "campaign", id: draftCampaign.id });
              toast(`${s.name} assigned`);
              settleSave();
              setAssignOpen(false);
            }}
            onCreate={(draft) => {
              addSource({ ...draft, linked: { type: "campaign", id: draftCampaign.id } });
              toast(`${draft.name} created and assigned`);
              settleSave();
              setAssignOpen(false);
            }}
          />
        </>
      ) : null}
    </DashboardPage>
  );
}

/* ── Campaign detail ─────────────────────────────────────────────── */

const DETAIL_TABS = ["Overview", "Insights", "Polsts", "Sources", "Settings"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

/** Tab state lives in `?tab=` so other pages can deep-link (e.g. Home's
 *  "Add sources" → /campaigns/{id}?tab=sources). Overview is the default. */
function useDetailTab(): [DetailTab, (t: DetailTab) => void] {
  const [params, setParams] = useSearchParams();
  const raw = (params.get("tab") ?? "").toLowerCase();
  const active = DETAIL_TABS.find((t) => t.toLowerCase() === raw) ?? "Overview";
  const set = (t: DetailTab) =>
    setParams(t === "Overview" ? {} : { tab: t.toLowerCase() }, { replace: true });
  return [active, set];
}

export function CampaignDetailPage() {
  const { id } = useParams();
  const store = useWorkspace();
  const toast = useToast();
  const copy = useCopyToClipboard();
  const campaign = store.campaignById(id);
  const [tab, setTab] = useDetailTab();
  const [qrOpen, setQrOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (!campaign) return <NotFoundCard kind="campaign" />;

  const sources = campaignSources(store.sources, campaign.id);
  const invalidRange =
    !!campaign.startAt && !!campaign.endAt && campaign.endAt < campaign.startAt;
  const canPublish = campaign.chain.length > 0 && !!campaign.startAt && !invalidRange;
  const shareable = campaign.status !== "Draft" && campaign.status !== "Archived";

  const publish = () => {
    const result = store.publishCampaign(campaign.id);
    setReviewOpen(false);
    if (!result.ok) {
      // Every refusal reaches the user — a dead button explains nothing.
      toast(result.reason);
      return;
    }
    // Speak the resolved status, never the intent: past dates land as Ended.
    toast(
      result.status === "Scheduled"
        ? `Published — starts ${fmtDate(campaign.startAt!)}`
        : result.status === "Ended"
          ? "Published — the run's dates are already past, so it's Ended"
          : "Campaign is live",
    );
  };

  const copyLink = () => {
    void copy(shareUrl("campaign", campaign.id), "Share link copied");
  };

  return (
    <DashboardPage
      actions={
        <>
          {shareable ? (
            <Menu
              label="Share campaign"
              trigger={({ toggle }) => (
                <Button variant="secondary" onClick={toggle}>
                  <Icon name="share" size={18} />
                  Share
                  <Icon name="arrow_drop_down" size={18} />
                </Button>
              )}
            >
              <MenuItem icon="qr_code_2" label="QR code" onClick={() => setQrOpen(true)} />
              <MenuItem icon="link" label="Copy share link" onClick={copyLink} />
              <MenuItem icon="code" label="View embed code" onClick={() => setTab("Sources")} />
            </Menu>
          ) : null}
          {campaign.status === "Draft" ? (
            // Publishing always passes through the review (the audit's
            // required workflow): final ordered chain, schedule, and the
            // exact lock rule, confirmed — never a one-click launch.
            <Button
              disabled={!canPublish}
              title={
                canPublish
                  ? undefined
                  : campaign.chain.length === 0
                    ? "Add at least one polst first"
                    : !campaign.startAt
                      ? "Set a start date first"
                      : "The end date is before the start — fix the schedule in Settings"
              }
              onClick={() => setReviewOpen(true)}
            >
              Review & publish
            </Button>
          ) : null}
          {/* Ready campaigns end through the DecisionBrief's "End campaign
              & decide" — one owner, so two end affordances never compete.
              Ended campaigns export through the brief's primary for the
              same reason; the header holds no duplicate. */}
          {campaign.status === "Active" && !isReadyToDecide(campaign) ? (
            <Button variant="destructive-secondary" onClick={() => setEndOpen(true)}>
              End campaign
            </Button>
          ) : null}
          {campaign.status === "Ended" && campaign.voters === 0 ? (
            <Button onClick={() => setReportOpen(true)}>Export report</Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="min-w-0 font-display text-xl font-semibold leading-7 text-text-primary">
            {campaign.name}
          </h1>
          <StatusBadge status={campaign.status} />
        </div>
        <PageTabs tabs={DETAIL_TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "Overview" ? (
        <CampaignOverview
          campaign={campaign}
          sources={sources}
          onGoTo={setTab}
          onEnd={() => setEndOpen(true)}
          onReport={() => setReportOpen(true)}
        />
      ) : null}
      {tab === "Insights" ? (
        <CampaignInsights campaign={campaign} sources={sources} onGoTo={setTab} />
      ) : null}
      {tab === "Polsts" ? <CampaignPolsts campaign={campaign} /> : null}
      {tab === "Sources" ? (
        <CampaignSources campaign={campaign} sources={sources} onOpenQr={() => setQrOpen(true)} />
      ) : null}
      {tab === "Settings" ? <CampaignSettings campaign={campaign} /> : null}

      <QrCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        objectName={campaign.name}
        url={shareUrl("campaign", campaign.id)}
      />
      {/* The pre-publish review: the final ordered journey, the schedule,
          and the exact lock rule — confirmed, never skipped. */}
      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        label="Review and publish campaign"
        title="Review before publishing"
        className="lg:max-w-2xl"
        factsFirst
        facts={[
          ["Campaign", campaign.name],
          ["Public URL", shareUrl("campaign", campaign.id)],
          ["Runs", fmtDateRange(campaign.startAt, campaign.endAt)],
          ...(campaign.decision ? [["Decision", campaign.decision] as [string, ReactNode]] : []),
          ...(campaign.target
            ? [["Voter target", fmtInt(campaign.target)] as [string, ReactNode]]
            : []),
        ]}
        lockText="Once the first vote arrives, the polst chain, its order, and the start date lock, and the campaign can no longer be unpublished — only ended. Until then you can still unpublish it back to a draft."
        confirmLabel="Confirm & publish"
        onConfirm={publish}
      >
        <div>
          <SectionTitle>Voters answer in this order</SectionTitle>
          <ol className="mt-2 divide-y divide-border-default rounded-md border border-border-default">
            {campaign.chain.map((q, index) => (
              <li key={q.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-5 shrink-0 text-center font-display text-sm font-semibold tabular-nums text-text-tertiary">
                  {index + 1}
                </span>
                <PolstListRow
                  options={polstOptions({
                    id: q.id,
                    optionA: q.optionA,
                    optionB: q.optionB,
                    splitA: q.splitA,
                    votes: 0,
                  })}
                  question={q.question}
                />
              </li>
            ))}
          </ol>
        </div>
      </ReviewModal>
      <ConfirmModal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        label="End campaign"
        title="End campaign?"
        tone="danger"
        confirmLabel="End campaign"
        onConfirm={() => {
          store.endCampaign(campaign.id);
          setEndOpen(false);
          toast("Campaign ended — voting is closed");
        }}
      >
        Voting stops immediately and {campaign.name} becomes read-only. The{" "}
        {fmtInt(campaign.voters)} voters collected so far are kept.
      </ConfirmModal>
      <ReportPreview
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        campaign={campaign}
        sources={sources}
      />
    </DashboardPage>
  );
}

/* ── Overview tab ────────────────────────────────────────────────── */

/* The headline framing is the shared `headlineLabel` (workspace.ts) — the
   decision report leads with the exact same words, one anatomy. */

/** The brief's eyebrow is the shared status-aware `decisionEyebrow`
 *  (workspace.ts) — the exact words the decision report opens with, so the
 *  two surfaces can never drift. Ready states take the success tone; a
 *  stated confidence carries its method (canon METRIC_INFO) on hover. */
const briefEyebrow = (c: Campaign): ReactNode => {
  const { label, ready } = decisionEyebrow(c);
  const hint =
    ready && c.confidence !== "—" ? (
      <InfoHint label="Confidence" text={METRIC_INFO.confidence} />
    ) : null;
  return ready ? (
    <span className="inline-flex items-center gap-1 text-status-success">
      {label}
      {hint}
    </span>
  ) : (
    label
  );
};

function CampaignOverview({
  campaign,
  sources,
  onGoTo,
  onEnd,
  onReport,
}: {
  campaign: Campaign;
  sources: Source[];
  onGoTo: (tab: DetailTab) => void;
  onEnd: () => void;
  onReport: () => void;
}) {
  if (campaign.voters === 0) {
    // The launch checklist speaks only to runs that can still launch. A
    // live, ended, or archived zero-voter run gets the honest state instead
    // of instructions ("get this ready to launch") its lifecycle contradicts.
    return campaign.status === "Draft" || campaign.status === "Scheduled" ? (
      <LaunchChecklist campaign={campaign} sources={sources} onGoTo={onGoTo} />
    ) : (
      <ZeroVoterOverview campaign={campaign} sources={sources} onGoTo={onGoTo} />
    );
  }

  const topSource = [...sources].sort((a, b) => b.voters - a.voters)[0];
  const daysLeft =
    campaign.status === "Active" && campaign.endAt ? daysBetween(TODAY, campaign.endAt) : null;
  const ready = campaign.status === "Active" && isReadyToDecide(campaign);

  const funnelSteps: FunnelStep[] = [
    { label: "Started", count: campaign.voters },
    ...campaign.chain.map((q, i) => ({
      label: `Q${i + 1}: ${q.question}`,
      count: campaign.votesByQuestion[i] ?? 0,
    })),
    { label: "Completed", count: campaign.completed },
  ];

  // Milestones clip to the run's current end (clipToRun): an in-session
  // schedule edit or ending retires entries the record now contradicts.
  const changed = clipToRun(WHAT_CHANGED, [campaign]).filter(
    (w) => w.to === `/campaigns/${campaign.id}`,
  );

  const sourceColumns: Array<DataColumn<Source>> = [
    {
      header: "Source",
      cell: (s) => <span className="font-semibold text-text-primary">{s.name}</span>,
    },
    { header: "Channel", cell: (s) => s.channel },
    { header: "Voters", align: "right", cell: (s) => fmtInt(s.voters) },
    { header: "Completion", align: "right", cell: (s) => RateCell(s.completionRate) },
  ];

  return (
    <>
      <DecisionBrief
        eyebrow={briefEyebrow(campaign)}
        headline={headlineLabel(campaign)}
        summary={campaign.summary}
        caveat={campaign.caveats[0]}
        evidence={[
          /* The audit's participant-goal contract: the goal is a planning
             target spoken as a sentence on the detail ("goal of 1,200
             reached"), never the list's ambiguous "1,486 / 1,200". */
          {
            label: "Participants",
            value: campaign.target
              ? campaign.voters >= campaign.target
                ? `${fmtInt(campaign.voters)} — goal of ${fmtInt(campaign.target)} reached`
                : `${fmtInt(campaign.voters)} toward the ${fmtInt(campaign.target)} goal`
              : fmtInt(campaign.voters),
            info: campaign.target ? METRIC_INFO.participantGoal : METRIC_INFO.voters,
          },
          {
            label: "Completion",
            value: pct(campaign.completed, campaign.voters),
            info: METRIC_INFO.completionRate,
          },
          {
            label: "Top source",
            value: topSource && topSource.voters > 0 ? topSource.name : "—",
          },
          ...(daysLeft !== null
            ? [
                {
                  label: "Days left",
                  value:
                    daysLeft <= 0 ? "Ends today" : daysLeft === 1 ? "1 day" : `${daysLeft} days`,
                },
              ]
            : campaign.status === "Ended"
              ? [{ label: "Ran", value: fmtDateRange(campaign.startAt, campaign.endAt) }]
              : []),
        ]}
        primary={
          campaign.status === "Ended"
            ? { label: "Export report", onClick: onReport }
            : ready
              ? { label: "End campaign & decide", onClick: onEnd }
              : { label: "View polst results", onClick: () => onGoTo("Polsts") }
        }
        secondary={
          ready || campaign.status === "Ended"
            ? { label: "View polst results", onClick: () => onGoTo("Polsts") }
            : undefined
        }
      />
      {/* items-start, like this page's other grids — the journey card keeps
          its own height instead of stretching to the right column's. */}
      <SectionGrid className="items-start">
        <DashboardCard title="Voter journey" className="lg:col-span-6">
          <Funnel steps={funnelSteps} />
        </DashboardCard>
        <div className="space-y-4 lg:col-span-6">
          <DashboardCard title="Source performance" padded={false}>
            <DataTable rows={sources} columns={sourceColumns} emptyLabel="No sources assigned" />
            <p className="border-t border-border-default px-4 py-3 text-xs text-text-secondary">
              Campaign average completion: {pct(campaign.completed, campaign.voters)}
            </p>
          </DashboardCard>
          {changed.length > 0 ? (
            <DashboardCard title="What changed">
              <ul className="space-y-2.5">
                {changed.map((w) => (
                  <li key={w.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 leading-5 text-text-primary">{w.text}</span>
                    <span className="shrink-0 text-xs text-text-tertiary">
                      {relativeToToday(w.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          ) : null}
        </div>
      </SectionGrid>
    </>
  );
}

/* ── Insights tab ────────────────────────────────────────────────────
   The audit's campaign insight detail: what this campaign learned,
   which polsts shaped that learning, what each source contributed, and
   the marketer's resolution. Everything except the review is computed
   from the campaign's own record; the review is human-authored and
   says so. The Insights index (/analytics/insights) deep-links here. */

const REVIEW_STATE_OPTIONS: Array<{ value: CampaignReviewState; label: string }> = [
  { value: "Monitoring", label: "Monitoring — keep collecting, check back" },
  { value: "Acted on", label: "Acted on — a decision was made from this" },
  { value: "Dismissed", label: "Dismissed — findings set aside, with a reason" },
  { value: "Resolved", label: "Resolved — the follow-up is complete" },
];

const REVIEW_STATE_TONE: Record<CampaignReviewState, "success" | "accent" | "neutral"> = {
  Monitoring: "neutral",
  "Acted on": "success",
  Dismissed: "neutral",
  Resolved: "accent",
};

/** One ordered chain question: both percentages with the response count,
 *  the participation change from the question before it, and its
 *  plain-language role in the campaign's result. */
function InsightPolstRow({
  campaign,
  index,
  onInspect,
}: {
  campaign: Campaign;
  index: number;
  onInspect: () => void;
}) {
  const q = campaign.chain[index];
  const responses = campaign.votesByQuestion[index] ?? 0;
  const prev = index > 0 ? (campaign.votesByQuestion[index - 1] ?? 0) : null;
  const role = polstRole(campaign, index);
  const lost = prev !== null && prev > 0 ? prev - responses : null;
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-4">
      <span className="mt-0.5 w-7 shrink-0 font-display text-sm font-semibold text-text-tertiary">
        Q{index + 1}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-display text-sm font-semibold leading-5 text-text-primary">
          {q.question}
        </p>
        <p className="text-sm leading-5 text-text-secondary">
          {q.splitA}% {q.optionA} · {100 - q.splitA}% {q.optionB} —{" "}
          <span className="tabular-nums">{fmtInt(responses)}</span> responses
        </p>
        {lost !== null ? (
          <p className="text-xs leading-4 text-text-tertiary">
            {lost > 0
              ? `−${fmtInt(lost)} participants after Q${index} (−${Math.round((lost / prev!) * 100)}%)`
              : `Held every participant from Q${index}`}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Chip tone={role.tone}>{role.label}</Chip>
        <button
          type="button"
          onClick={onInspect}
          className="text-sm font-semibold text-text-accent hover:underline"
        >
          Inspect
        </button>
      </div>
    </li>
  );
}

function CampaignInsights({
  campaign,
  sources,
  onGoTo,
}: {
  campaign: Campaign;
  sources: Source[];
  onGoTo: (tab: DetailTab) => void;
}) {
  const store = useWorkspace();
  const toast = useToast();
  const review = store.reviewFor(campaign.id);
  const state = insightStateFor(campaign, review);
  const [reviewState, setReviewState] = useState<CampaignReviewState | "">(review?.state ?? "");
  const [note, setNote] = useState(review?.note ?? "");

  if (!qualifiesForInsights(campaign)) {
    return (
      <DashboardCard padded={false}>
        <EmptyState
          icon="query_stats"
          register="no-results"
          title="No findings yet"
          hint={
            campaign.status === "Scheduled" && campaign.startAt
              ? `Insights appear once a campaign collects responses. This one starts ${relativeToToday(campaign.startAt)}.`
              : campaign.status === "Draft"
                ? "Insights appear once a campaign collects responses. Finish composing this draft, then publish it."
                : "Insights appear once a campaign collects responses. This run ended without any."
          }
          action={
            campaign.status === "Draft"
              ? { label: "Open the launch checklist", onClick: () => onGoTo("Overview") }
              : undefined
          }
        />
      </DashboardCard>
    );
  }

  const finishRate = pct(campaign.completed, campaign.voters);
  const campaignRate = campaign.completionRate;
  /* The most instructive completion gap, spoken with BOTH rates — a
     description, never a cause (the audit's source-contribution rule). */
  const outlier = sources
    .filter((s) => s.voters >= 30 && s.completionRate !== null && campaignRate !== null)
    .sort(
      (a, b) =>
        Math.abs((b.completionRate ?? 0) - (campaignRate ?? 0)) -
        Math.abs((a.completionRate ?? 0) - (campaignRate ?? 0)),
    )[0];
  const outlierGap =
    outlier && campaignRate !== null
      ? Math.abs((outlier.completionRate ?? 0) - campaignRate)
      : 0;

  const collectionFacts = [
    campaign.status === "Ended"
      ? `Ended ${fmtDate(campaign.endAt!)}`
      : `Collecting until ${campaign.endAt ? fmtDate(campaign.endAt) : "ended manually"}`,
    `${fmtInt(campaign.voters)} participants${
      campaign.target
        ? campaign.voters >= campaign.target
          ? ` — goal of ${fmtInt(campaign.target)} reached`
          : ` toward the ${fmtInt(campaign.target)} goal`
        : ""
    }`,
    `${finishRate} finish rate`,
  ];

  const sourceColumns: Array<DataColumn<Source>> = [
    {
      header: "Source",
      cell: (s) => <span className="font-semibold text-text-primary">{s.name}</span>,
    },
    { header: "Channel", cell: (s) => s.channel },
    { header: "Participants", align: "right", cell: (s) => fmtInt(s.voters) },
    { header: "Completion", align: "right", cell: (s) => RateCell(s.completionRate) },
  ];

  return (
    <>
      <DashboardCard>
        <div className="flex flex-wrap items-center gap-3">
          <Chip tone={INSIGHT_STATE_TONE[state]}>{state}</Chip>
          <span className="text-xs text-text-tertiary">
            Data through {fmtDate(dataThrough(campaign))}
          </span>
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text-tertiary">
          Decision being tested
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold leading-6 text-text-primary">
          {campaign.decision || campaign.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{campaignReadout(campaign)}</p>
        <p className="mt-2 text-sm leading-5 text-text-secondary">
          {collectionFacts.join(" · ")}
        </p>
        {campaign.findings.length > 0 ? (
          <div className="mt-5 border-t border-border-default pt-4">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-sm font-semibold text-text-primary">
                What the run showed
              </h3>
              <InfoHint
                label="Provenance"
                text="The readout above is computed from the live record. These findings are authored by your team; every number in them is checked against the run's data."
              />
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-secondary">
              {campaign.findings.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {campaign.nextStep ? (
          <div className="mt-4">
            <h3 className="font-display text-sm font-semibold text-text-primary">Next action</h3>
            <p className="mt-1 text-sm leading-6 text-text-secondary">{campaign.nextStep}</p>
          </div>
        ) : null}
        {campaign.caveats.length > 0 || campaign.sampleNote ? (
          <div className="mt-4 rounded-md bg-surface-subtle p-4">
            <h3 className="font-display text-sm font-semibold text-text-primary">
              Sample & limitations
            </h3>
            {campaign.sampleNote ? (
              <p className="mt-1 text-sm leading-5 text-text-secondary">{campaign.sampleNote}</p>
            ) : null}
            <ul className="mt-1 space-y-1 text-sm leading-5 text-text-secondary">
              {campaign.caveats.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </DashboardCard>

      <DashboardCard title="Polsts in this campaign" padded={false}>
        <p className="border-b border-border-default px-4 pb-3 text-xs leading-4 text-text-secondary">
          How the ordered questions shaped the result — not a leaderboard. A question can only
          support or contradict the decision when it offers the same two options.
        </p>
        <ol className="divide-y divide-border-default">
          {campaign.chain.map((q, i) => (
            <InsightPolstRow
              key={q.id}
              campaign={campaign}
              index={i}
              onInspect={() => onGoTo("Polsts")}
            />
          ))}
        </ol>
      </DashboardCard>

      <SectionGrid className="items-start">
        <DashboardCard title="Source contribution" padded={false} className="lg:col-span-7">
          <DataTable rows={sources} columns={sourceColumns} emptyLabel="No sources assigned" />
          <div className="space-y-1 border-t border-border-default px-4 py-3">
            {outlier && outlierGap >= 5 ? (
              <p className="text-sm leading-5 text-text-secondary">
                {outlier.name} completes at {Math.round(outlier.completionRate!)}%; the campaign
                completes at {Math.round(campaignRate!)}%.
              </p>
            ) : null}
            <p className="text-xs leading-4 text-text-tertiary">
              Sources recruit different audiences — a completion gap describes the traffic, it
              does not prove the source caused it.
            </p>
          </div>
        </DashboardCard>

        <DashboardCard title="Marketer review" className="lg:col-span-5">
          {review ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone={REVIEW_STATE_TONE[review.state]}>{review.state}</Chip>
                <span className="text-xs text-text-tertiary">
                  {review.owner} · {fmtDate(review.at)}
                </span>
              </div>
              {review.note ? (
                <p className="text-sm leading-6 text-text-secondary">{review.note}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-6 text-text-secondary">
              Nobody has recorded a resolution for this campaign yet. Reviewing it moves it out
              of “{state}” in the Insights index.
            </p>
          )}
          <div className={cn("space-y-4", review ? "mt-5 border-t border-border-default pt-4" : "mt-4")}>
            <Field label={review ? "Update the resolution" : "Resolution"}>
              {(id) => (
                <SelectMenu
                  id={id}
                  label="Resolution"
                  options={REVIEW_STATE_OPTIONS}
                  value={reviewState}
                  onValueChange={(v) => setReviewState(v as CampaignReviewState)}
                  placeholder="What did the team decide?"
                />
              )}
            </Field>
            <Field label="Note" helper={<FieldHelper tone="neutral">Recorded with your name and today's date.</FieldHelper>}>
              {(id) => (
                <textarea
                  id={id}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="What was decided, or why it was set aside"
                  className={cn(CONTROL, "h-auto px-3 py-2")}
                />
              )}
            </Field>
            <Button
              disabled={!reviewState}
              title={reviewState ? undefined : "Pick a resolution first"}
              onClick={() => {
                if (!reviewState) return;
                store.recordReview(campaign.id, reviewState, note);
                toast("Review recorded");
              }}
            >
              {review ? "Update review" : "Record review"}
            </Button>
          </div>
        </DashboardCard>
      </SectionGrid>
    </>
  );
}

/** The zero-voter overviews' right-rail facts card — one anatomy whether the
 *  run is still launching or already over. Titled "About", like the
 *  Settings tab's twin. */
function AboutCampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <DashboardCard title="About" className="lg:col-span-5">
      <DetailList
        items={[
          ["Decision", campaign.decision || "Not set"],
          ["Dates", fmtDateRange(campaign.startAt, campaign.endAt)],
          ["Voter target", campaign.target ? fmtInt(campaign.target) : "—"],
          ["Key date", eventTitle(campaign.event)],
          ["Created", fmtDate(campaign.createdAt)],
        ]}
      />
    </DashboardCard>
  );
}

/** Zero-voter runs past the launch gate. An Active run is live and waiting
 *  for its first voter; an Ended or Archived one can never launch, so this
 *  speaks the report's zero-voter voice ("No result — nothing was
 *  collected") and offers the honest lifecycle exits instead of a checklist
 *  whose CTAs all land on read-only tabs. */
function ZeroVoterOverview({
  campaign,
  sources,
  onGoTo,
}: {
  campaign: Campaign;
  sources: Source[];
  onGoTo: (tab: DetailTab) => void;
}) {
  const store = useWorkspace();
  const toast = useToast();
  const state =
    campaign.status === "Active"
      ? {
          icon: "hub",
          title: "Live — no voters yet",
          hint: sources.length
            ? "The run is live and its sources are in place. Results appear here with the first voter."
            : "Nothing collects voters until a QR code, link, or embed points at this campaign.",
          action: {
            label: sources.length ? "View sources" : "Assign source",
            onClick: () => onGoTo("Sources"),
          },
        }
      : campaign.status === "Archived"
        ? {
            icon: "archive",
            title: "Archived without running",
            hint: "This campaign never collected voters and is read-only. Restore it to keep working on it.",
            action: {
              label: "Restore to draft",
              onClick: () => {
                store.restoreCampaign(campaign.id);
                toast("Campaign restored as a draft");
              },
            },
          }
        : {
            icon: "event_busy",
            title: "Ended without votes",
            hint: "No result — nothing was collected before the run closed.",
            action: {
              label: "Archive campaign",
              onClick: () => {
                store.archiveCampaign(campaign.id);
                toast("Campaign archived");
              },
            },
          };
  return (
    <SectionGrid className="items-start">
      <DashboardCard className="lg:col-span-7">
        <EmptyState icon={state.icon} title={state.title} hint={state.hint} action={state.action} />
      </DashboardCard>
      <AboutCampaignCard campaign={campaign} />
    </SectionGrid>
  );
}

/** Draft / Scheduled with zero voters: the same launch-readiness pattern
 *  Home uses, derived entirely from real state. */
function LaunchChecklist({
  campaign,
  sources,
  onGoTo,
}: {
  campaign: Campaign;
  sources: Source[];
  onGoTo: (tab: DetailTab) => void;
}) {
  const polstCount = campaign.chain.length;
  const hasPolsts = polstCount > 0;
  const hasSources = sources.length > 0;
  const hasSchedule = !!campaign.startAt;
  const allDone = hasPolsts && hasSources && hasSchedule;

  const steps: SetupStep[] = [
    {
      title: "Add at least one polst",
      done: hasPolsts,
      description: hasPolsts
        ? `${polstCount} ${polstCount === 1 ? "polst is" : "polsts are"} staged — voters answer them in order.`
        : "The campaign needs at least one polst before it can publish.",
      cta: { label: hasPolsts ? "View polsts" : "Add polsts", onClick: () => onGoTo("Polsts") },
    },
    {
      // Plural like its CTA — a campaign collects through several sources.
      title: "Assign sources",
      done: hasSources,
      description: hasSources
        ? `${sources.length} ${sources.length === 1 ? "source" : "sources"} will collect voters.`
        : "Nothing collects voters until a QR code, link, or embed points at this campaign.",
      cta: {
        // "Assign" is the verb of the control this lands on (the Sources
        // tab's "Assign source" action).
        label: hasSources ? "View sources" : "Assign sources",
        onClick: () => onGoTo("Sources"),
      },
    },
    {
      title: "Confirm the schedule",
      done: hasSchedule,
      description: hasSchedule
        ? `Runs ${fmtDateRange(campaign.startAt, campaign.endAt)}.`
        : "Set a start date so the campaign knows when to go live.",
      cta: {
        label: hasSchedule ? "Edit schedule" : "Set the schedule",
        onClick: () => onGoTo("Settings"),
      },
    },
  ];

  return (
    <SectionGrid className="items-start">
      <div className="lg:col-span-7">
        <NextStepsCard
          title={allDone ? "Ready to launch" : "Get this campaign ready to launch"}
          intro={
            campaign.status === "Scheduled" && campaign.startAt
              ? `Starts ${relativeToToday(campaign.startAt)}.`
              : undefined
          }
          steps={steps}
        />
      </div>
      <AboutCampaignCard campaign={campaign} />
    </SectionGrid>
  );
}

/* ── polsts tab ──────────────────────────────────────────────────── */

function CampaignPolsts({ campaign }: { campaign: Campaign }) {
  const { reorderChain, removeChainQuestion } = useWorkspace();
  const toast = useToast();
  const [composerOpen, setComposerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  // Removal always confirms first (staging removed instantly — the audit's
  // one destructive-workflow defect; never copy it).
  const [removeTarget, setRemoveTarget] = useState<ChainQuestion | null>(null);
  // The chain is evidence once voters exist — editable only before launch.
  const editable = campaign.status === "Draft" || campaign.status === "Scheduled";

  return (
    <>
      {/* Same anatomy as the Sources tab: one titled card whose header
          action slot owns the tab's primary action — never a detached menu. */}
      <DashboardCard
        title="Polsts"
        padded={campaign.chain.length > 0}
        action={
          editable ? (
            <Menu
              label="Add polst"
              trigger={({ toggle }) => (
                <Button variant="secondary" size="sm" onClick={toggle}>
                  <Icon name="add" size={18} />
                  Add polst
                  <Icon name="arrow_drop_down" size={18} />
                </Button>
              )}
            >
              <MenuItem
                icon="edit_square"
                label="Create new polst"
                onClick={() => setComposerOpen(true)}
              />
              <MenuItem
                icon="library_add"
                label="Select from library"
                onClick={() => setLibraryOpen(true)}
              />
            </Menu>
          ) : null
        }
      >
        {campaign.chain.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {campaign.chain.map((q, index) => {
              const votes = campaign.votesByQuestion[index] ?? 0;
              return (
                <div key={q.id} className="rounded-md border border-border-default p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-secondary">
                        Question {index + 1} of {campaign.chain.length}
                      </p>
                      <h3 className="mt-1 font-display text-base font-semibold leading-6 text-text-primary">
                        {q.question}
                      </h3>
                    </div>
                    {editable ? (
                      <div className="flex shrink-0 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Move question ${index + 1} up`}
                          disabled={index === 0}
                          onClick={() => reorderChain(campaign.id, index, index - 1)}
                        >
                          <Icon name="arrow_upward" size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Move question ${index + 1} down`}
                          disabled={index === campaign.chain.length - 1}
                          onClick={() => reorderChain(campaign.id, index, index + 1)}
                        >
                          <Icon name="arrow_downward" size={18} />
                        </Button>
                        {/* A mistyped or double-added question can leave the
                            chain while it's still editable — behind a
                            confirmation, and the store's voters-guard keeps
                            live evidence untouchable. */}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove question ${index + 1} from the chain`}
                          onClick={() => setRemoveTarget(q)}
                        >
                          <Icon name="close" size={18} />
                        </Button>
                      </div>
                    ) : (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-text-secondary">
                        {votes > 0 ? `${fmtInt(votes)} votes` : "No votes yet"}
                      </span>
                    )}
                  </div>
                  <PollResults
                    className="mt-4"
                    options={polstOptions({
                      id: q.id,
                      optionA: q.optionA,
                      optionB: q.optionB,
                      splitA: q.splitA,
                      votes,
                    })}
                    dense
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="ballot"
            title="No polsts yet"
            hint="Voters answer the chain in order — start with one polst."
            action={
              editable
                ? { label: "Create polst", onClick: () => setComposerOpen(true) }
                : undefined
            }
          />
        )}
      </DashboardCard>
      {/* The sibling-product composer as a modal — stack as many polsts
          as the chain needs without ever leaving the campaign. */}
      <PolstComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        campaign={{ id: campaign.id, name: campaign.name }}
      />
      <SelectFromLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        campaign={campaign}
      />
      <ConfirmModal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        label="Remove polst from campaign"
        title="Remove this polst?"
        tone="danger"
        confirmLabel="Remove polst"
        onConfirm={() => {
          if (removeTarget) {
            removeChainQuestion(campaign.id, removeTarget.id);
            toast("Polst removed from the chain");
          }
          setRemoveTarget(null);
        }}
      >
        {removeTarget ? (
          <>
            “{removeTarget.question}” leaves the voting sequence, and the questions after it
            move up one position. No votes are lost — a chain can only be edited before
            voters arrive.
          </>
        ) : null}
      </ConfirmModal>
    </>
  );
}

function SelectFromLibraryModal({
  open,
  onClose,
  campaign,
}: {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
}) {
  const { polsts, addLibraryPolstToCampaign } = useWorkspace();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const candidates = polsts.filter((p) => p.status === "Draft" || p.status === "Active");

  const toggle = (id: string, next: boolean) =>
    setSelected((prev) => {
      const set = new Set(prev);
      if (next) set.add(id);
      else set.delete(id);
      return set;
    });

  const add = () => {
    for (const id of selected) addLibraryPolstToCampaign(campaign.id, id);
    toast(
      selected.size === 1 ? "1 polst added to the chain" : `${selected.size} polsts added to the chain`,
    );
    setSelected(new Set());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Select from library"
      title="Select from library"
      className="lg:max-w-2xl"
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={selected.size === 0} onClick={add}>
            {selected.size > 1 ? `Add ${selected.size} polsts` : "Add polst"}
          </Button>
        </ModalFooter>
      }
    >
      {candidates.length > 0 ? (
        <div className="scroll-subtle max-h-96 overflow-y-auto p-2">
          {candidates.map((polst) => (
            <label
              key={polst.id}
              className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-subtle"
            >
              <Checkbox
                label={`Select ${polst.question}`}
                checked={selected.has(polst.id)}
                onCheckedChange={(next) => toggle(polst.id, next)}
              />
              <PolstListRow
                options={polstOptions(polst)}
                question={polst.question}
                meta={<StatusBadge status={polst.status} />}
              />
            </label>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="library_add"
          title="No standalone polsts to add"
          hint="Draft and active polsts from your library appear here."
        />
      )}
    </Modal>
  );
}

/* ── Sources tab ─────────────────────────────────────────────────── */

function CampaignSources({
  campaign,
  sources,
  onOpenQr,
}: {
  campaign: Campaign;
  sources: Source[];
  onOpenQr: () => void;
}) {
  const { unassignSource, assignSource, addSource, sources: allSources } = useWorkspace();
  const toast = useToast();
  const [assignOpen, setAssignOpen] = useState(false);
  const assignable = campaign.status !== "Ended" && campaign.status !== "Archived";
  const url = shareUrl("campaign", campaign.id);

  const columns: Array<DataColumn<Source>> = [
    {
      header: "Source",
      cell: (s) => (
        <div className="min-w-0">
          <p className="font-semibold text-text-primary">{s.name}</p>
          {s.placement ? (
            <p className="mt-0.5 truncate text-xs text-text-secondary">{s.placement}</p>
          ) : null}
        </div>
      ),
    },
    { header: "Kind", cell: (s) => <Chip>{s.kind}</Chip> },
    { header: "Channel", cell: (s) => s.channel },
    { header: "Voters", align: "right", cell: (s) => fmtInt(s.voters) },
    { header: "Completion", align: "right", cell: (s) => RateCell(s.completionRate) },
    // A mis-assigned source can be freed while its wiring is still clean;
    // once it delivered voters its attribution is part of the record, so
    // the action is disabled with the store's reason (and the store refuses
    // regardless). Read-only runs (Ended/Archived) manage nothing here.
    ...(assignable
      ? [
          {
            header: "",
            align: "right" as const,
            cell: (s: Source) => (
              <UnassignButton
                voters={s.voters}
                onClick={() => {
                  const result = unassignSource(s.id);
                  toast(result.ok ? `${s.name} unassigned` : result.reason);
                }}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <DashboardCard
        title="Sources"
        padded={false}
        action={
          assignable ? (
            <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}>
              <Icon name="add" size={18} />
              Assign source
            </Button>
          ) : null
        }
      >
        {sources.length > 0 ? (
          <DataTable rows={sources} columns={columns} />
        ) : (
          <EmptyState
            icon="hub"
            title="No sources yet"
            hint="Nothing collects voters until a QR code, link, or embed points at this campaign."
            action={
              assignable
                ? { label: "Assign source", onClick: () => setAssignOpen(true) }
                : undefined
            }
          />
        )}
      </DashboardCard>

      {campaign.status !== "Draft" ? (
        <DashboardCard
          title="Share & embed"
          action={
            <Button variant="secondary" size="sm" onClick={onOpenQr}>
              <Icon name="qr_code_2" size={18} />
              QR code
            </Button>
          }
        >
          <div className="space-y-4">
            <CopyableField
              value={url}
              label="Copy link"
              successMessage="Share link copied"
              size="xs"
              className="p-2 pl-3"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <SnippetCard
                title="iframe embed"
                description="Drops into any page; the widget adapts to the container width."
                code={embedIframe(campaign.id)}
              />
              <SnippetCard
                title="JavaScript embed"
                description="For sites whose content security policy restricts iframes."
                code={embedScript(campaign.id)}
              />
            </div>
          </div>
        </DashboardCard>
      ) : null}

      <AssignSourceModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        unlinked={allSources.filter((s) => !s.linked)}
        onAssign={(s) => {
          assignSource(s.id, { type: "campaign", id: campaign.id });
          toast(`${s.name} assigned to ${campaign.name}`);
          setAssignOpen(false);
        }}
        onCreate={(draft) => {
          addSource({ ...draft, linked: { type: "campaign", id: campaign.id } });
          toast(`${draft.name} created and assigned`);
          setAssignOpen(false);
        }}
      />
    </>
  );
}

/* ── Settings tab ────────────────────────────────────────────────── */

function CampaignSettings({ campaign }: { campaign: Campaign }) {
  const store = useWorkspace();
  const toast = useToast();
  const [name, setName] = useState(campaign.name);
  const [decision, setDecision] = useState(campaign.decision);
  const [startAt, setStartAt] = useState(campaign.startAt ?? "");
  // The schedule speaks the same DurationField vocabulary as both create
  // flows — a saved run round-trips to its preset exactly.
  const [duration, setDuration] = useState<DurationPreset>(() =>
    durationPresetFor(campaign.startAt, campaign.endAt),
  );
  const [customEnd, setCustomEnd] = useState(campaign.endAt ?? "");
  const [target, setTarget] = useState(campaign.target ? String(campaign.target) : "");
  const [event, setEvent] = useState(campaign.event ?? "");
  const [confirm, setConfirm] = useState<"unpublish" | "archive" | null>(null);

  const endAt = durationEnd(duration, startAt, customEnd);

  const dirty =
    name !== campaign.name ||
    decision !== campaign.decision ||
    startAt !== (campaign.startAt ?? "") ||
    (endAt ?? "") !== (campaign.endAt ?? "") ||
    target !== (campaign.target ? String(campaign.target) : "") ||
    event !== (campaign.event ?? "");

  // Only a Custom duration can invert the range — refuse it at the source.
  const invalidRange = Boolean(startAt && endAt && endAt < startAt);

  const save = () => {
    const result = store.updateCampaign(campaign.id, {
      name: name.trim(),
      decision,
      startAt,
      endAt: endAt ?? "",
      target: target.trim() ? Number(target) : 0,
      event,
    });
    if (!result.ok) {
      // Every refusal reaches the user (voted runs never move their start).
      toast(result.reason);
      return;
    }
    // Date edits re-resolve the run's status — the toast speaks the outcome.
    toast(
      result.status === campaign.status
        ? "Campaign updated"
        : result.status === "Ended"
          ? "Campaign updated — the end date is past, so the run is Ended"
          : result.status === "Scheduled"
            ? `Campaign updated — starts ${fmtDate(startAt)}`
            : "Campaign updated — the run is live now",
    );
  };

  const live = campaign.status === "Scheduled" || campaign.status === "Active";
  // A voted run's start date is part of the record — the store refuses the
  // edit, so the field says so up front instead of a click-to-discover toast.
  const startLocked = live && campaign.voters > 0;
  // A finished run is the record — "becomes read-only" must be true.
  const readOnly = campaign.status === "Ended" || campaign.status === "Archived";

  return (
    <SectionGrid className="items-start">
      {readOnly ? (
        <DashboardCard title="Campaign settings" className="lg:col-span-7">
          <DetailList
            items={[
              ["Name", campaign.name],
              ["Decision", campaign.decision || "Not set"],
              ["Start date", campaign.startAt ? fmtDate(campaign.startAt) : "—"],
              ["End date", campaign.endAt ? fmtDate(campaign.endAt) : "—"],
              ["Voter target", campaign.target ? fmtInt(campaign.target) : "—"],
              ["Key date", eventTitle(campaign.event)],
            ]}
          />
          <p className="mt-4 text-xs text-text-secondary">
            {campaign.status === "Ended" ? "Ended" : "Archived"} runs can&rsquo;t be edited.
          </p>
        </DashboardCard>
      ) : (
        <DashboardCard title="Campaign settings" className="lg:col-span-7">
          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field label="Name">
              {(id) => (
                <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} />
              )}
            </Field>
            <Field label="Key date">
              {(id) => (
                <SelectMenu
                  id={id}
                  label="Key date"
                  value={event}
                  onValueChange={setEvent}
                  options={EVENT_OPTIONS}
                />
              )}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Decision question">
                {(id) => (
                  <textarea
                    id={id}
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    rows={2}
                    placeholder="What should this campaign decide?"
                    className={cn(CONTROL, "h-auto min-h-16 resize-none px-3 py-2.5")}
                  />
                )}
              </Field>
            </div>
            <Field
              label="Start date"
              helper={
                startLocked ? (
                  <FieldHelper tone="neutral">
                    This run has collected votes — its start date is part of the record.
                  </FieldHelper>
                ) : undefined
              }
            >
              {(id) => (
                <TextInput
                  id={id}
                  type="date"
                  value={startAt}
                  disabled={startLocked}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              )}
            </Field>
            <Field label="Voter target">
              {(id) => (
                <TextInput
                  id={id}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="1,000"
                />
              )}
            </Field>
            <div className="space-y-1.5 sm:col-span-2">
              <DurationField
                value={duration}
                onChange={setDuration}
                customEnd={customEnd}
                onCustomEndChange={setCustomEnd}
                startAt={startAt}
                subject="campaign"
              />
              {invalidRange ? (
                <FieldHelper tone="danger">The end date is before the start.</FieldHelper>
              ) : null}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              disabled={!dirty || !name.trim() || invalidRange}
              title={invalidRange ? "The end date is before the start." : undefined}
              onClick={save}
            >
              Save changes
            </Button>
          </div>
        </DashboardCard>
      )}

      <div className="space-y-4 lg:col-span-5">
        <DashboardCard title="About">
          <DetailList
            items={[
              ["Status", <StatusBadge key="status" status={campaign.status} />],
              ["Created", fmtDate(campaign.createdAt)],
              ["Category", campaign.category],
              ["Voters", fmtInt(campaign.voters)],
              ["Views", fmtInt(campaign.views)],
            ]}
          />
        </DashboardCard>
        <DashboardCard title="Lifecycle">
          <div className="flex flex-wrap gap-2">
            {live ? (
              // A voted run never rewinds to Draft — the votes are evidence.
              <Button
                variant="secondary"
                size="sm"
                disabled={campaign.voters > 0}
                title={
                  campaign.voters > 0
                    ? "This run has collected votes — end it instead."
                    : undefined
                }
                onClick={() => setConfirm("unpublish")}
              >
                Unpublish to draft
              </Button>
            ) : null}
            {campaign.status === "Draft" || campaign.status === "Ended" ? (
              <Button
                variant="destructive-secondary"
                size="sm"
                onClick={() => setConfirm("archive")}
              >
                Archive campaign
              </Button>
            ) : null}
            {campaign.status === "Archived" ? (
              // The label and toast speak the true destination: a voted run
              // restores to Ended, a clean one to Draft.
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const status = store.restoreCampaign(campaign.id);
                  toast(
                    status === "Ended"
                      ? "Restored — the run keeps its results (Ended)"
                      : "Campaign restored as a draft",
                  );
                }}
              >
                {campaign.voters > 0 ? "Restore" : "Restore to draft"}
              </Button>
            ) : null}
          </div>
        </DashboardCard>
      </div>

      <ConfirmModal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        label={confirm === "archive" ? "Archive campaign" : "Unpublish campaign"}
        title={confirm === "archive" ? "Archive campaign?" : "Unpublish campaign?"}
        tone={confirm === "archive" ? "danger" : "default"}
        confirmLabel={confirm === "archive" ? "Archive" : "Unpublish"}
        onConfirm={() => {
          if (confirm === "archive") {
            store.archiveCampaign(campaign.id);
            toast("Campaign archived");
          } else {
            const result = store.unpublishCampaign(campaign.id);
            toast(result.ok ? "Campaign unpublished — back to draft" : result.reason);
          }
          setConfirm(null);
        }}
      >
        {confirm === "archive"
          ? `${campaign.name} moves out of the active views. Its results are kept.`
          : `Voters can no longer reach ${campaign.name} until you publish it again.`}
      </ConfirmModal>
    </SectionGrid>
  );
}

/* The report dialog itself is the kit's shared `ReportPreview` — one
   anatomy for the campaign detail and Analytics → Reports. */
