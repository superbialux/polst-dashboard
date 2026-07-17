import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  DurationField,
  EmptyState,
  Funnel,
  InfoHint,
  durationEnd,
  durationPresetFor,
  NextStepsCard,
  NotFoundCard,
  PageTabs,
  PollResults,
  PollThumb,
  CreatedRange,
  ReportPreview,
  SearchAndFilters,
  SectionGrid,
  filterByCreated,
  SegmentedControl,
  SnippetCard,
  StatusBadge,
  ThumbStrip,
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
  fmtPct,
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
  verdictLabel,
  type Campaign,
  type ChainQuestion,
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
    // A real link, like the Polsts list — the row onClick is a pointer
    // convenience, but keyboard and screen-reader users need an anchor.
    cell: (row) => (
      <Link to={`/campaigns/${row.id}`} className="group block min-w-0">
        <p className="font-display font-semibold text-text-primary group-hover:text-text-accent">
          {row.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {fmtDateRange(row.startAt, row.endAt)}
        </p>
      </Link>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { header: "Polsts", cell: (row) => <ThumbStrip ids={row.chain.map((q) => q.id)} /> },
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
  {
    header: "Result so far",
    cell: (row) => <span className="text-text-secondary">{verdictLabel(row)}</span>,
  },
];

export function CampaignsPage() {
  const { campaigns } = useWorkspace();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterByCreated(filterByStatus(campaigns, active), createdFrom, createdTo).filter(
      (c) =>
        !q ||
        [c.name, c.decision, eventTitle(c.event), c.category].some((v) =>
          v.toLowerCase().includes(q),
        ),
    );
  }, [campaigns, active, query, createdFrom, createdTo]);

  const searching = query.trim().length > 0;
  const dateFiltered = Boolean(createdFrom || createdTo);

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
          action={
            <CreatedRange
              from={createdFrom}
              to={createdTo}
              onFromChange={setCreatedFrom}
              onToChange={setCreatedTo}
            />
          }
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
    </DashboardPage>
  );
}

/* ── Create campaign ─────────────────────────────────────────────── */

export function CreateCampaignPage() {
  const { campaigns, createCampaign } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventParam = params.get("event") ?? "";

  const [name, setName] = useState("");
  const [decision, setDecision] = useState("");
  const [startAt, setStartAt] = useState("");
  const [duration, setDuration] = useState<DurationPreset>("7 days");
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

  const [submitting, setSubmitting] = useState(false);

  const endAt = durationEnd(duration, startAt, customEnd);
  // Only a Custom duration can invert the range — refuse it at the source.
  const endBeforeStart = Boolean(endAt && startAt && endAt < startAt);

  const drafts = campaigns.filter((c) => c.status === "Draft").slice(0, 3);

  const submit = () => {
    if (submitting) return; // a double-click must not mint a duplicate draft
    setSubmitting(true);
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
                <Field
                  label="Voter target"
                  helper={
                    <FieldHelper tone="neutral">
                      Optional evidence goal — the decision brief tracks progress against it.
                    </FieldHelper>
                  }
                >
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
              <Field
                label="Key date"
                helper={
                  <FieldHelper tone="neutral">
                    Optional planning event this campaign targets — it ties the run to a date
                    on the Home calendar.
                  </FieldHelper>
                }
              >
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
            <Button
              disabled={!name.trim() || endBeforeStart || submitting}
              title={endBeforeStart ? "The end date is before the start." : undefined}
              onClick={submit}
            >
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
            // Publishing always passes through the review (the audit's
            // required workflow): final ordered chain, schedule, and the
            // exact lock rule, confirmed — never a one-click launch.
            <Button
              disabled={!canPublish}
              title={
                canPublish
                  ? undefined
                  : campaign.chain.length === 0
                    ? "Add at least one Polst first"
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
      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        label="Review and publish campaign"
        title="Review before publishing"
        className="lg:max-w-2xl"
        footer={
          <div className="flex justify-end gap-2 p-4">
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>
              Back to editing
            </Button>
            <Button onClick={publish}>Confirm & publish</Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <DetailList
            items={[
              ["Campaign", campaign.name],
              ["Public URL", shareUrl("campaign", campaign.id)],
              ["Runs", fmtDateRange(campaign.startAt, campaign.endAt)],
              ...(campaign.decision ? [["Decision", campaign.decision] as [string, ReactNode]] : []),
              ...(campaign.target
                ? [["Voter target", fmtInt(campaign.target)] as [string, ReactNode]]
                : []),
            ]}
          />
          <div>
            <h4 className="font-display text-sm font-semibold text-text-secondary">
              Voters answer in this order
            </h4>
            <ol className="mt-2 divide-y divide-border-default rounded-md border border-border-default">
              {campaign.chain.map((q, index) => (
                <li key={q.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="w-5 shrink-0 text-center font-display text-sm font-semibold tabular-nums text-text-tertiary">
                    {index + 1}
                  </span>
                  <PollThumb
                    options={polstOptions({
                      id: q.id,
                      optionA: q.optionA,
                      optionB: q.optionB,
                      splitA: q.splitA,
                      votes: 0,
                    })}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-sm font-semibold text-text-primary">
                      {q.question}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-text-secondary">
                      {q.optionA} vs {q.optionB}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <p className="flex items-start gap-1.5 rounded-md bg-surface-subtle p-3 text-sm leading-5 text-text-secondary">
            <Icon name="lock" size={18} className="mt-0.5 shrink-0 text-icon-secondary" />
            <span>
              Once the first vote arrives, the Polst chain, its order, and the start date
              lock, and the campaign can no longer be unpublished — only ended. Until then
              you can still unpublish it back to a draft.
            </span>
          </p>
        </div>
      </Modal>
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
    {
      header: "Completion",
      align: "right",
      cell: (s) => (s.completionRate !== null ? fmtPct(s.completionRate, 0) : "—"),
    },
  ];

  return (
    <>
      <DecisionBrief
        eyebrow={briefEyebrow(campaign)}
        headline={headlineLabel(campaign)}
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
      {/* items-start, like this page's other grids — the journey card keeps
          its own height instead of stretching to the right column's. */}
      <SectionGrid className="items-start">
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
      title: "Add at least one Polst",
      done: hasPolsts,
      description: hasPolsts
        ? `${polstCount} ${polstCount === 1 ? "Polst is" : "Polsts are"} staged — voters answer them in order.`
        : "The campaign needs at least one Polst before it can publish.",
      cta: { label: hasPolsts ? "View Polsts" : "Add Polsts", onClick: () => onGoTo("Polsts") },
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

/* ── Polsts tab ──────────────────────────────────────────────────── */

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
              label="Add Polst"
              trigger={({ toggle }) => (
                <Button variant="secondary" size="sm" onClick={toggle}>
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
            title="No Polsts yet"
            hint="Voters answer the chain in order — start with one Polst."
            action={
              editable
                ? { label: "Create a Polst", onClick: () => setComposerOpen(true) }
                : undefined
            }
          />
        )}
      </DashboardCard>
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
      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        label="Remove Polst from campaign"
        title="Remove this Polst?"
        footer={
          <div className="flex justify-end gap-2 p-4">
            <Button variant="secondary" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) {
                  removeChainQuestion(campaign.id, removeTarget.id);
                  toast("Polst removed from the chain");
                }
                setRemoveTarget(null);
              }}
            >
              Remove Polst
            </Button>
          </div>
        }
      >
        {removeTarget ? (
          <p className="p-4 text-sm leading-6 text-text-secondary">
            “{removeTarget.question}” leaves the voting sequence, and the questions after it
            move up one position. No votes are lost — a chain can only be edited before
            voters arrive.
          </p>
        ) : null}
      </Modal>
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
  const [submitting, setSubmitting] = useState(false);
  const complete = question.trim() && optionA.trim() && optionB.trim();

  useEffect(() => {
    if (open) setSubmitting(false);
  }, [open]);

  const add = () => {
    if (submitting) return; // a double-click must not stage the Polst twice
    setSubmitting(true);
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
          <Button disabled={!complete || submitting} onClick={add}>
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
  const { unassignSource } = useWorkspace();
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
              <Button
                variant="secondary"
                size="sm"
                disabled={s.voters > 0}
                title={
                  s.voters > 0
                    ? "This source has collected voters — its attribution is part of the record."
                    : undefined
                }
                onClick={() => {
                  const result = unassignSource(s.id);
                  toast(result.ok ? `${s.name} unassigned` : result.reason);
                }}
              >
                Unassign
              </Button>
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setSubmitting(false);
  }, [open]);

  const create = () => {
    if (submitting) return; // a double-click must not mint a duplicate source
    setSubmitting(true);
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
    // Titled like the button that opens it, with the standard modal footer
    // (Cancel + primary) every sibling form modal carries.
    <Modal
      open={open}
      onClose={onClose}
      label="Assign source"
      title="Assign source"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim() || submitting} onClick={create}>
            Create &amp; assign
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
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
                  const result = store.unpublishCampaign(campaign.id);
                  toast(result.ok ? "Campaign unpublished — back to draft" : result.reason);
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
            : `Voters can no longer reach ${campaign.name} until you publish it again.`}
        </p>
      </Modal>
    </SectionGrid>
  );
}

/* The report dialog itself is the kit's shared `ReportPreview` — one
   anatomy for the campaign detail and Analytics → Reports. */
