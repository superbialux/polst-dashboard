import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Menu, MenuItem } from "@/components/Menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import {
  CONTROL,
  Checkbox,
  Field,
  FieldHelper,
  SelectMenu,
  TextInput,
} from "@/components/Field";
import { QrCodeModal } from "@/components/DistributionActions";
import {
  Chip,
  DashboardCard,
  DashboardPage,
  DataTable,
  DecisionBrief,
  DetailList,
  EmptyState,
  Funnel,
  NextStepsCard,
  NotFoundCard,
  PageTabs,
  PollResults,
  PollThumb,
  SearchAndFilters,
  SectionGrid,
  SegmentedControl,
  SignalBadge,
  SnippetCard,
  StatusBadge,
  filterByStatus,
  type DataColumn,
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
  fmtPct,
  pct,
  relativeToToday,
} from "@/lib/canon";
import {
  KEY_DATES,
  WHAT_CHANGED,
  embedIframe,
  embedScript,
  polstOptions,
  shareUrl,
  winnerLabel,
  type Campaign,
  type Channel,
  type Source,
} from "@/lib/workspace";
import { useWorkspace } from "@/lib/store";

/* ── Shared vocabulary ───────────────────────────────────────────── */

/** The one status filter set — "All" passes everything through. */
const CAMPAIGN_FILTERS = ["All", "Active", "Scheduled", "Drafts", "Ended", "Archived"] as const;

const EVENT_OPTIONS = [
  { value: "", label: "No event" },
  ...KEY_DATES.map((k) => ({ value: k.id, label: `${k.title} · ${fmtDate(k.start)}` })),
];

const eventTitle = (id?: string) => KEY_DATES.find((k) => k.id === id)?.title ?? "—";

/** Best-effort clipboard write — the mockup's copy affordances stay honest
 *  in normal browsers and never crash where the permission is denied. */
const copyText = (text: string) => {
  navigator.clipboard?.writeText(text).catch(() => {});
};

/** This campaign's sources, read live from the store (never the stale
 *  back-refs baked onto the entity at module load). */
const campaignSources = (sources: Source[], id: string) =>
  sources.filter((s) => s.linked?.type === "campaign" && s.linked.id === id);

/* ── Campaigns list ──────────────────────────────────────────────── */

const listColumns: Array<DataColumn<Campaign>> = [
  {
    header: "Campaign",
    cell: (row) => (
      <div className="min-w-0">
        <p className="font-display font-semibold text-text-primary">{row.name}</p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {fmtDateRange(row.startAt, row.endAt)}
        </p>
      </div>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { header: "Signal", cell: (row) => <SignalBadge signal={row.signal} /> },
  { header: "Polsts", align: "right", cell: (row) => row.chain.length },
  {
    header: "Voters",
    align: "right",
    cell: (row) => (
      <span className="tabular-nums">
        {fmtInt(row.voters)}
        {row.target ? <span className="text-text-tertiary"> / {fmtInt(row.target)}</span> : null}
      </span>
    ),
  },
  { header: "Completion", align: "right", cell: (row) => pct(row.completed, row.voters) },
];

export function CampaignsPage() {
  const { campaigns } = useWorkspace();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterByStatus(campaigns, active).filter(
      (c) =>
        !q ||
        [c.name, c.decision, eventTitle(c.event), c.vertical].some((v) =>
          v.toLowerCase().includes(q),
        ),
    );
  }, [campaigns, active, query]);

  const searching = query.trim().length > 0;

  return (
    <DashboardPage
      actions={
        <Button asChild>
          <Link to="/campaigns/new">Create campaign</Link>
        </Button>
      }
    >
      <DashboardCard padded={false}>
        <SearchAndFilters
          tabs={CAMPAIGN_FILTERS}
          active={active}
          onChange={setActive}
          placeholder="Search campaigns"
          query={query}
          onQueryChange={setQuery}
        />
        {searching && rows.length > 0 ? (
          <p className="border-b border-border-default px-5 py-2 text-xs text-text-secondary">
            {rows.length} {rows.length === 1 ? "campaign matches" : "campaigns match"} “
            {query.trim()}”
          </p>
        ) : null}
        {rows.length > 0 ? (
          <DataTable
            rows={rows}
            columns={listColumns}
            onRowClick={(row) => navigate(`/campaigns/${row.id}`)}
          />
        ) : searching ? (
          <EmptyState
            icon="search"
            title={`No campaigns match “${query.trim()}”`}
            action={{ label: "Clear search", onClick: () => setQuery("") }}
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
    </DashboardPage>
  );
}

/* ── Create campaign ─────────────────────────────────────────────── */

const DURATIONS = ["3 days", "7 days", "10 days", "Custom", "No end"] as const;
const DURATION_DAYS: Record<string, number> = { "3 days": 3, "7 days": 7, "10 days": 10 };

const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function CreateCampaignPage() {
  const { campaigns, createCampaign } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventParam = params.get("event") ?? "";

  const [name, setName] = useState("");
  const [decision, setDecision] = useState("");
  const [startAt, setStartAt] = useState("");
  const [duration, setDuration] = useState<string>("7 days");
  const [customEnd, setCustomEnd] = useState("");
  const [target, setTarget] = useState("");
  const [event, setEvent] = useState(
    KEY_DATES.some((k) => k.id === eventParam) ? eventParam : "",
  );

  // ?event= can change while the form stays mounted (e.g. two "Plan a
  // campaign" links for different key dates) — resync the preselect.
  useEffect(() => {
    setEvent(KEY_DATES.some((k) => k.id === eventParam) ? eventParam : "");
  }, [eventParam]);

  const endAt =
    duration === "No end"
      ? undefined
      : duration === "Custom"
        ? customEnd || undefined
        : startAt
          ? // Inclusive span: "7 days" runs start..start+6.
            addDays(startAt, DURATION_DAYS[duration] - 1)
          : undefined;

  const endLine =
    duration === "No end"
      ? "Runs until you end it manually."
      : endAt
        ? `Voters can submit until ${fmtDate(endAt)}.`
        : "Voters can submit until the campaign ends.";

  const drafts = campaigns.filter((c) => c.status === "Draft").slice(0, 3);

  const submit = () => {
    const id = createCampaign({
      name,
      decision: decision.trim() || undefined,
      startAt: startAt || undefined,
      endAt,
      target: target.trim() ? Number(target) : undefined,
      event: event || undefined,
    });
    toast("Campaign created as a draft");
    navigate(`/campaigns/${id}`);
  };

  return (
    <DashboardPage
      actions={
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      }
    >
      <SectionGrid>
        <div className="space-y-4 lg:col-span-8">
          <DashboardCard title="Campaign details">
            <div className="space-y-5">
              <Field label="Campaign name">
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
              <Field
                label="Decision question"
                helper={
                  <FieldHelper tone="neutral">
                    Optional — you can set it later in the campaign&rsquo;s settings.
                  </FieldHelper>
                }
              >
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
              <div className="grid gap-5 sm:grid-cols-2">
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
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-display text-sm font-semibold leading-5 text-text-primary">
                  How long should it run?
                </p>
                <SegmentedControl
                  tabs={DURATIONS}
                  active={duration}
                  onChange={setDuration}
                  size="form"
                />
                {duration === "Custom" ? (
                  <div className="mt-2 max-w-56">
                    <TextInput
                      type="date"
                      aria-label="End date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                ) : null}
                <FieldHelper tone="neutral">{endLine}</FieldHelper>
              </div>
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
            </div>
          </DashboardCard>
          <div className="flex justify-end">
            <Button disabled={!name.trim()} onClick={submit}>
              Create campaign
            </Button>
          </div>
        </div>
        {drafts.length > 0 ? (
          <div className="self-start lg:col-span-4">
            <DashboardCard title="Recent drafts">
              <div className="-mx-2 space-y-0.5">
                {drafts.map((c) => (
                  <Link
                    key={c.id}
                    to={`/campaigns/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-md p-2 transition-colors hover:bg-surface-subtle"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-display text-sm font-semibold text-text-primary">
                        {c.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-text-secondary">
                        Created {fmtDate(c.createdAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-ui font-semibold text-text-accent">Open</span>
                  </Link>
                ))}
              </div>
            </DashboardCard>
          </div>
        ) : null}
      </SectionGrid>
    </DashboardPage>
  );
}

/* ── Campaign detail ─────────────────────────────────────────────── */

const DETAIL_TABS = ["Overview", "Polsts", "Sources", "Settings"] as const;
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
  const campaign = store.campaignById(id);
  const [tab, setTab] = useDetailTab();
  const [qrOpen, setQrOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (!campaign) return <NotFoundCard kind="campaign" />;

  const sources = campaignSources(store.sources, campaign.id);
  const canPublish = campaign.chain.length > 0 && !!campaign.startAt;
  const shareable = campaign.status !== "Draft" && campaign.status !== "Archived";

  const publish = () => {
    const result = store.publishCampaign(campaign.id);
    if (result.ok) {
      toast(
        campaign.startAt! > TODAY
          ? `Published — starts ${fmtDate(campaign.startAt!)}`
          : "Campaign is live",
      );
    }
  };

  const copyLink = () => {
    copyText(shareUrl("campaign", campaign.id));
    toast("Share link copied");
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
            <Button
              disabled={!canPublish}
              title={
                canPublish
                  ? undefined
                  : campaign.chain.length === 0
                    ? "Add at least one Polst first"
                    : "Set a start date first"
              }
              onClick={publish}
            >
              Publish
            </Button>
          ) : null}
          {campaign.status === "Active" ? (
            <Button variant="destructive-secondary" onClick={() => setEndOpen(true)}>
              End campaign
            </Button>
          ) : null}
          {campaign.status === "Ended" ? (
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
          {campaign.voters > 0 ? <SignalBadge signal={campaign.signal} /> : null}
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
      <Modal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        label="End campaign"
        title="End campaign?"
        footer={
          <div className="flex justify-end gap-2 p-4">
            <Button variant="secondary" onClick={() => setEndOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                store.endCampaign(campaign.id);
                setEndOpen(false);
                toast("Campaign ended — voting is closed");
              }}
            >
              End campaign
            </Button>
          </div>
        }
      >
        <p className="p-4 text-sm leading-6 text-text-secondary">
          Voting stops immediately and {campaign.name} becomes read-only. The{" "}
          {fmtInt(campaign.voters)} voters collected so far are kept.
        </p>
      </Modal>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        campaign={campaign}
        sources={sources}
      />
    </DashboardPage>
  );
}

/* ── Overview tab ────────────────────────────────────────────────── */

const briefHeadline = (c: Campaign): string => {
  switch (c.signal) {
    case "Decisive":
      return c.status === "Ended"
        ? `Decided: ${winnerLabel(c)}`
        : `Recommended: ${winnerLabel(c)}`;
    case "Leading":
      return `Recommended: ${winnerLabel(c)}`;
    case "Directional":
      return `Early read: ${winnerLabel(c)}`;
    case "Too close":
      return `Too close to call — ${winnerLabel(c)}`;
    case "Collecting":
      return `Collecting — ${winnerLabel(c)} so far`;
    case "Inconclusive":
      return "Ended without a clear winner";
    default:
      return "No votes yet";
  }
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
    return <LaunchChecklist campaign={campaign} sources={sources} onGoTo={onGoTo} />;
  }

  const topSource = [...sources].sort((a, b) => b.voters - a.voters)[0];
  const daysLeft =
    campaign.status === "Active" && campaign.endAt ? daysBetween(TODAY, campaign.endAt) : null;
  const ready =
    campaign.status === "Active" &&
    (campaign.signal === "Leading" || campaign.signal === "Decisive");

  const funnelSteps: FunnelStep[] = [
    { label: "Started", count: campaign.voters },
    ...campaign.chain.map((q, i) => ({
      label: `Q${i + 1}: ${q.question}`,
      count: campaign.votesByQuestion[i] ?? 0,
    })),
    { label: "Completed", count: campaign.completed },
  ];

  const changed = WHAT_CHANGED.filter((w) => w.to === `/campaigns/${campaign.id}`);

  const sourceColumns: Array<DataColumn<Source>> = [
    {
      header: "Source",
      cell: (s) => <span className="font-semibold text-text-primary">{s.name}</span>,
    },
    { header: "Channel", cell: (s) => s.channel },
    { header: "Voters", align: "right", cell: (s) => fmtInt(s.voters) },
    {
      header: "Completion",
      align: "right",
      cell: (s) => (s.completionRate !== null ? fmtPct(s.completionRate, 0) : "—"),
    },
  ];

  return (
    <>
      <DecisionBrief
        signal={campaign.signal}
        signalDetail={
          campaign.confidence !== "—" ? `${campaign.confidence} confidence` : undefined
        }
        headline={briefHeadline(campaign)}
        summary={campaign.summary}
        caveat={campaign.caveats[0]}
        evidence={[
          {
            label: campaign.target ? "Voters vs target" : "Voters",
            value: campaign.target
              ? `${fmtInt(campaign.voters)} of ${fmtInt(campaign.target)}`
              : fmtInt(campaign.voters),
            info: METRIC_INFO.voters,
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
              : { label: "View Polst results", onClick: () => onGoTo("Polsts") }
        }
        secondary={
          ready || campaign.status === "Ended"
            ? { label: "View Polst results", onClick: () => onGoTo("Polsts") }
            : undefined
        }
      />
      <SectionGrid>
        <DashboardCard title="Voter journey" className="lg:col-span-6">
          <Funnel steps={funnelSteps} />
        </DashboardCard>
        <div className="space-y-4 lg:col-span-6">
          <DashboardCard title="Source performance" padded={false}>
            <DataTable rows={sources} columns={sourceColumns} emptyLabel="No sources assigned" />
            <p className="border-t border-border-default px-5 py-3 text-xs text-text-secondary">
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

/** Draft / Scheduled (and anything else with zero voters): the same
 *  launch-readiness pattern Home uses, derived entirely from real state. */
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
      title: "Add at least one Polst",
      done: hasPolsts,
      description: hasPolsts
        ? `${polstCount} ${polstCount === 1 ? "question" : "questions"} staged — voters answer them in order.`
        : "The campaign needs at least one question before it can publish.",
      cta: { label: hasPolsts ? "View Polsts" : "Add Polsts", onClick: () => onGoTo("Polsts") },
    },
    {
      title: "Assign a source",
      done: hasSources,
      description: hasSources
        ? `${sources.length} ${sources.length === 1 ? "source" : "sources"} will collect voters.`
        : "Nothing collects voters until a QR code, link, or embed points at this campaign.",
      cta: {
        label: hasSources ? "View sources" : "Add sources",
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
      <DashboardCard title="About this campaign" className="lg:col-span-5">
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
    </SectionGrid>
  );
}

/* ── Polsts tab ──────────────────────────────────────────────────── */

function CampaignPolsts({ campaign }: { campaign: Campaign }) {
  const { reorderChain } = useWorkspace();
  const [composerOpen, setComposerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  // The chain is evidence once voters exist — editable only before launch.
  const editable = campaign.status === "Draft" || campaign.status === "Scheduled";

  return (
    <>
      {editable ? (
        <div className="flex justify-end">
          <Menu
            label="Add Polst"
            trigger={({ toggle }) => (
              <Button variant="secondary" onClick={toggle}>
                <Icon name="add" size={18} />
                Add Polst
                <Icon name="arrow_drop_down" size={18} />
              </Button>
            )}
          >
            <MenuItem
              icon="edit_square"
              label="Create new Polst"
              onClick={() => setComposerOpen(true)}
            />
            <MenuItem
              icon="library_add"
              label="Select from library"
              onClick={() => setLibraryOpen(true)}
            />
          </Menu>
        </div>
      ) : null}
      {campaign.chain.length > 0 ? (
        <SectionGrid>
          {campaign.chain.map((q, index) => {
            const votes = campaign.votesByQuestion[index] ?? 0;
            return (
              <div key={q.id} className="lg:col-span-6">
                <DashboardCard>
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
                </DashboardCard>
              </div>
            );
          })}
        </SectionGrid>
      ) : (
        <DashboardCard>
          <EmptyState
            icon="ballot"
            title="No Polsts yet"
            hint="Voters answer the chain in order — start with one question."
            action={
              editable
                ? { label: "Create a Polst", onClick: () => setComposerOpen(true) }
                : undefined
            }
          />
        </DashboardCard>
      )}
      <AddPolstModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        campaign={campaign}
      />
      <SelectFromLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        campaign={campaign}
      />
    </>
  );
}

function AddPolstModal({
  open,
  onClose,
  campaign,
}: {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
}) {
  const { addQuestionToCampaign } = useWorkspace();
  const toast = useToast();
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const complete = question.trim() && optionA.trim() && optionB.trim();

  const add = () => {
    addQuestionToCampaign(campaign.id, {
      question: question.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
    });
    toast("Polst added to the chain");
    setQuestion("");
    setOptionA("");
    setOptionB("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="New Polst"
      title="New Polst"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!complete} onClick={add}>
            Add Polst
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <Field label="Question">
          {(id) => (
            <TextInput
              id={id}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Which hero visual stops the scroll?"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Option A">
            {(id) => (
              <TextInput id={id} value={optionA} onChange={(e) => setOptionA(e.target.value)} />
            )}
          </Field>
          <Field label="Option B">
            {(id) => (
              <TextInput id={id} value={optionB} onChange={(e) => setOptionB(e.target.value)} />
            )}
          </Field>
        </div>
      </div>
    </Modal>
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
      selected.size === 1 ? "1 Polst added to the chain" : `${selected.size} Polsts added to the chain`,
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
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={selected.size === 0} onClick={add}>
            {selected.size > 1 ? `Add ${selected.size} Polsts` : "Add Polst"}
          </Button>
        </div>
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
              <PollThumb options={polstOptions(polst)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-text-primary">
                  {polst.question}
                </p>
                <p className="mt-0.5 truncate text-xs text-text-secondary">
                  {polst.optionA} vs {polst.optionB}
                </p>
              </div>
              <StatusBadge status={polst.status} />
            </label>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="library_add"
          title="No standalone Polsts to add"
          hint="Draft and active Polsts from your library appear here."
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
    {
      header: "Completion",
      align: "right",
      cell: (s) => (s.completionRate !== null ? fmtPct(s.completionRate, 0) : "—"),
    },
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
            <div className="flex items-center gap-2 rounded-md border border-border-default bg-surface-subtle p-2 pl-3">
              <p className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">
                {url}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  copyText(url);
                  toast("Share link copied");
                }}
              >
                <Icon name="content_copy" size={18} />
                Copy link
              </Button>
            </div>
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
        campaign={campaign}
      />
    </>
  );
}

const SOURCE_KINDS: Array<Source["kind"]> = ["QR code", "Share link", "Embed", "Tracked link"];
const CHANNELS: Channel[] = ["Website", "Email", "Instagram", "QR", "Influencer"];

function AssignSourceModal({
  open,
  onClose,
  campaign,
}: {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
}) {
  const { sources, assignSource, addSource } = useWorkspace();
  const toast = useToast();
  const unlinked = sources.filter((s) => !s.linked);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<string>("QR code");
  const [channel, setChannel] = useState<string>("Website");

  const create = () => {
    addSource({
      name: name.trim(),
      kind: kind as Source["kind"],
      channel: channel as Channel,
      linked: { type: "campaign", id: campaign.id },
    });
    toast(`${name.trim()} created and assigned`);
    setName("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} label="Assign a source" title="Assign a source">
      <div className="space-y-5 p-4">
        {unlinked.length > 0 ? (
          <div>
            <p className="mb-2 font-display text-sm font-semibold text-text-primary">
              Unassigned sources
            </p>
            <div className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
              {unlinked.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{s.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {s.kind} · {s.channel}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      assignSource(s.id, { type: "campaign", id: campaign.id });
                      toast(`${s.name} assigned to ${campaign.name}`);
                      onClose();
                    }}
                  >
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="space-y-4">
          <p className="font-display text-sm font-semibold text-text-primary">
            Create a new source
          </p>
          <Field label="Name">
            {(id) => (
              <TextInput
                id={id}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="QR — Shelf talker"
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kind">
              {(id) => (
                <SelectMenu
                  id={id}
                  label="Kind"
                  value={kind}
                  onValueChange={setKind}
                  options={SOURCE_KINDS.map((k) => ({ value: k, label: k }))}
                />
              )}
            </Field>
            <Field label="Channel">
              {(id) => (
                <SelectMenu
                  id={id}
                  label="Channel"
                  value={channel}
                  onValueChange={setChannel}
                  options={CHANNELS.map((c) => ({ value: c, label: c }))}
                />
              )}
            </Field>
          </div>
          <div className="flex justify-end">
            <Button disabled={!name.trim()} onClick={create}>
              Create &amp; assign
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── Settings tab ────────────────────────────────────────────────── */

function CampaignSettings({ campaign }: { campaign: Campaign }) {
  const store = useWorkspace();
  const toast = useToast();
  const [name, setName] = useState(campaign.name);
  const [decision, setDecision] = useState(campaign.decision);
  const [startAt, setStartAt] = useState(campaign.startAt ?? "");
  const [endAt, setEndAt] = useState(campaign.endAt ?? "");
  const [target, setTarget] = useState(campaign.target ? String(campaign.target) : "");
  const [event, setEvent] = useState(campaign.event ?? "");
  const [confirm, setConfirm] = useState<"unpublish" | "archive" | null>(null);

  const dirty =
    name !== campaign.name ||
    decision !== campaign.decision ||
    startAt !== (campaign.startAt ?? "") ||
    endAt !== (campaign.endAt ?? "") ||
    target !== (campaign.target ? String(campaign.target) : "") ||
    event !== (campaign.event ?? "");

  const save = () => {
    store.updateCampaign(campaign.id, {
      name: name.trim(),
      decision,
      startAt,
      endAt,
      target: target.trim() ? Number(target) : 0,
      event,
    });
    toast("Campaign updated");
  };

  const live = campaign.status === "Scheduled" || campaign.status === "Active";

  return (
    <SectionGrid className="items-start">
      <DashboardCard title="Campaign settings" className="lg:col-span-7">
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          <Field label="Name">
            {(id) => <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} />}
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
          <Field
            label="End date"
            helper={<FieldHelper tone="neutral">Voters can submit until this date.</FieldHelper>}
          >
            {(id) => (
              <TextInput
                id={id}
                type="date"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
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
        </div>
        <div className="mt-5 flex justify-end">
          <Button disabled={!dirty || !name.trim()} onClick={save}>
            Save changes
          </Button>
        </div>
      </DashboardCard>

      <div className="space-y-4 lg:col-span-5">
        <DashboardCard title="About">
          <DetailList
            items={[
              ["Status", <StatusBadge key="status" status={campaign.status} />],
              ["Created", fmtDate(campaign.createdAt)],
              ["Vertical", campaign.vertical],
              ["Voters", fmtInt(campaign.voters)],
              ["Views", fmtInt(campaign.views)],
            ]}
          />
        </DashboardCard>
        <DashboardCard title="Lifecycle">
          <div className="flex flex-wrap gap-2">
            {live ? (
              <Button variant="secondary" size="sm" onClick={() => setConfirm("unpublish")}>
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  store.unpublishCampaign(campaign.id);
                  toast("Campaign restored as a draft");
                }}
              >
                Restore to draft
              </Button>
            ) : null}
          </div>
        </DashboardCard>
      </div>

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        label={confirm === "archive" ? "Archive campaign" : "Unpublish campaign"}
        title={confirm === "archive" ? "Archive campaign?" : "Unpublish campaign?"}
        footer={
          <div className="flex justify-end gap-2 p-4">
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm === "archive" ? "destructive" : "primary"}
              onClick={() => {
                if (confirm === "archive") {
                  store.archiveCampaign(campaign.id);
                  toast("Campaign archived");
                } else {
                  store.unpublishCampaign(campaign.id);
                  toast("Campaign unpublished — back to draft");
                }
                setConfirm(null);
              }}
            >
              {confirm === "archive" ? "Archive" : "Unpublish"}
            </Button>
          </div>
        }
      >
        <p className="p-4 text-sm leading-6 text-text-secondary">
          {confirm === "archive"
            ? `${campaign.name} moves out of the active views. Its results are kept.`
            : `Voters can no longer reach ${campaign.name} until you publish it again. Votes already cast are kept.`}
        </p>
      </Modal>
    </SectionGrid>
  );
}

/* ── Report preview (Ended campaigns) ────────────────────────────── */

function ReportModal({
  open,
  onClose,
  campaign,
  sources,
}: {
  open: boolean;
  onClose: () => void;
  campaign: Campaign;
  sources: Source[];
}) {
  const toast = useToast();
  const topSource = [...sources].sort((a, b) => b.voters - a.voters)[0];

  const summaryText = [
    `${campaign.name} — decision report`,
    campaign.decision,
    `Winner: ${winnerLabel(campaign)} · Signal: ${campaign.signal} · Confidence: ${campaign.confidence}`,
    `Voters: ${fmtInt(campaign.voters)}${campaign.target ? ` of ${fmtInt(campaign.target)} target` : ""} · Completion: ${pct(campaign.completed, campaign.voters)}`,
    ...(campaign.findings.length ? ["", "Findings:", ...campaign.findings.map((f) => `- ${f}`)] : []),
    ...(campaign.caveats.length ? ["", "Caveats:", ...campaign.caveats.map((c) => `- ${c}`)] : []),
  ].join("\n");

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Decision report"
      title="Decision report"
      className="lg:max-w-2xl"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button
            variant="secondary"
            onClick={() => {
              copyText(summaryText);
              toast("Summary copied");
            }}
          >
            <Icon name="content_copy" size={18} />
            Copy summary
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      }
    >
      <div className="space-y-5 p-5">
        <header>
          <h3 className="font-display text-xl font-semibold leading-7 text-text-primary">
            {campaign.name}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {campaign.decision} · {fmtDateRange(campaign.startAt, campaign.endAt)}
          </p>
        </header>
        <DetailList
          items={[
            ["Winning direction", winnerLabel(campaign)],
            ["Signal", <SignalBadge key="signal" signal={campaign.signal} />],
            ["Confidence", campaign.confidence],
            [
              "Voters",
              campaign.target
                ? `${fmtInt(campaign.voters)} of ${fmtInt(campaign.target)}`
                : fmtInt(campaign.voters),
            ],
            ["Completion", pct(campaign.completed, campaign.voters)],
            ["Top source", topSource && topSource.voters > 0 ? topSource.name : "—"],
          ]}
        />
        {campaign.findings.length > 0 ? (
          <section>
            <h4 className="font-display text-sm font-semibold text-text-secondary">
              Key findings
            </h4>
            <ul className="mt-2 space-y-2">
              {campaign.findings.map((finding) => (
                <li key={finding} className="flex items-start gap-2.5 text-sm leading-6">
                  <Icon
                    name="check_circle"
                    size={20}
                    filled
                    className="mt-0.5 shrink-0 text-status-success"
                  />
                  <span className="text-text-secondary">{finding}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {campaign.caveats.length > 0 ? (
          <section>
            <h4 className="font-display text-sm font-semibold text-text-secondary">Caveats</h4>
            <ul className="mt-2 space-y-2">
              {campaign.caveats.map((caveat) => (
                <li key={caveat} className="flex items-start gap-2.5 text-sm leading-6">
                  <Icon
                    name="error"
                    size={20}
                    filled
                    className="mt-0.5 shrink-0 text-status-warning"
                  />
                  <span className="text-text-secondary">{caveat}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <p className="text-sm leading-6 text-text-secondary">
          <span className="font-semibold text-text-primary">Next step:</span> {campaign.nextStep}
        </p>
      </div>
    </Modal>
  );
}
