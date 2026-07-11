import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import { Field, FieldHelper, SelectMenu, TextInput } from "@/components/Field";
import { Menu, MenuItem, MenuSeparator } from "@/components/Menu";
import { PollCard } from "@/components/PollCard";
import { PollComposer, type ComposerState } from "@/components/PollComposer";
import { QrCodeModal, SocialShareModal } from "@/components/DistributionActions";
import {
  ActionCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  DetailList,
  DurationField,
  EmptyState,
  InfoHint,
  NotFoundCard,
  PollResults,
  PollThumb,
  SearchAndFilters,
  SectionGrid,
  SegmentedControl,
  StatTile,
  StatusBadge,
  durationEnd,
  durationPresetFor,
  filterByStatus,
  type DataColumn,
  type DurationPreset,
  type EmptyStateAction,
} from "@/components/dashboard";
import {
  METRIC_INFO,
  TODAY,
  daysBetween,
  fmtDate,
  fmtDateRange,
  fmtInt,
  fmtPct,
  relativeToToday,
  signalFor,
} from "@/lib/canon";
import {
  WORKSPACE,
  polstImage,
  polstOptions,
  shareUrl,
  verdictLabel,
  voteVelocity,
  type Channel,
  type SinglePolst,
  type Source,
  type Vertical,
} from "@/lib/workspace";
import { publishedStatus, useWorkspace } from "@/lib/store";

/* ── Shared vocabulary ───────────────────────────────────────────── */

/** Every lifecycle state is reachable — "All" really means everything. */
const POLST_FILTERS = ["All", "Active", "Scheduled", "Drafts", "Ended", "Archived"] as const;

const VERTICALS: Vertical[] = ["Food & drink", "Lifestyle", "Shopping & deals"];

/** Nothing has run yet — analytics columns render as "—", not zeros. */
const hasRun = (polst: SinglePolst) => polst.views > 0 || polst.votes > 0;

/** Live and finished runs report real numbers (zero included); unpublished
 *  Polsts have no analytics to report at all. */
const reportsNumbers = (polst: SinglePolst) =>
  polst.status === "Active" || polst.status === "Ended" || hasRun(polst);

const qrUrl = (polst: SinglePolst) => `${shareUrl("polst", polst.id)}?utm_source=qr`;

/* ── Row actions ─────────────────────────────────────────────────── */

/** One labeled overflow menu per row; items follow the lifecycle. Drafts
 *  edit and publish, live Polsts distribute, archived ones restore. */
function PolstRowMenu({
  polst,
  onShare,
  onQr,
}: {
  polst: SinglePolst;
  onShare: () => void;
  onQr: () => void;
}) {
  const { publishPolst, archivePolst, restorePolst } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();

  const publish = () => {
    const result = publishPolst(polst.id);
    if (!result.ok) {
      toast(result.reason);
      return;
    }
    // Speak the resolved status, never the intent: past dates land as Ended.
    toast(
      result.status === "Scheduled"
        ? `Polst scheduled — starts ${fmtDate(polst.startAt!)}`
        : result.status === "Ended"
          ? "Polst published — its dates are already past, so it's Ended"
          : "Polst published — it's live",
    );
  };
  const archive = () => {
    archivePolst(polst.id);
    toast("Moved to archive");
  };

  return (
    <Menu
      label={`Actions for ${polst.question}`}
      trigger={({ open, toggle }) => (
        <Button
          variant="ghost"
          size="icon"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Actions for ${polst.question}`}
          onClick={toggle}
        >
          <Icon name="more_horiz" size={18} />
        </Button>
      )}
    >
      {polst.status === "Draft" ? (
        <>
          <MenuItem icon="edit" label="Edit draft" onClick={() => navigate(`/polsts/new?edit=${polst.id}`)} />
          <MenuItem icon="publish" label="Publish" onClick={publish} />
          <MenuSeparator />
          <MenuItem icon="archive" label="Move to archive" onClick={archive} />
        </>
      ) : polst.status === "Archived" ? (
        <>
          <MenuItem icon="visibility" label="View" onClick={() => navigate(`/polsts/${polst.id}`)} />
          {/* A voted run restores to Ended, not Draft — say so. */}
          <MenuItem
            icon="restore"
            label={polst.votes > 0 ? "Restore" : "Restore to drafts"}
            onClick={() => {
              const status = restorePolst(polst.id);
              toast(
                status === "Ended"
                  ? "Restored — back under Ended (its votes are part of the record)"
                  : "Restored to drafts",
              );
            }}
          />
        </>
      ) : polst.status === "Ended" ? (
        <>
          <MenuItem icon="visibility" label="View" onClick={() => navigate(`/polsts/${polst.id}`)} />
          <MenuSeparator />
          <MenuItem icon="archive" label="Move to archive" onClick={archive} />
        </>
      ) : (
        <>
          <MenuItem icon="visibility" label="View" onClick={() => navigate(`/polsts/${polst.id}`)} />
          <MenuItem icon="send" label="Distribute" onClick={onShare} />
          <MenuItem icon="qr_code_2" label="QR code" onClick={onQr} />
        </>
      )}
    </Menu>
  );
}

/* ── List columns ────────────────────────────────────────────────── */

const numberCell = (polst: SinglePolst, value: number) => (
  <span className="tabular-nums">{reportsNumbers(polst) ? fmtInt(value) : "—"}</span>
);

const columns = (
  onShare: (polst: SinglePolst) => void,
  onQr: (polst: SinglePolst) => void,
): Array<DataColumn<SinglePolst>> => [
  {
    header: "Polst",
    cell: (row) => (
      <Link to={`/polsts/${row.id}`} className="group flex min-w-0 items-center gap-3">
        <PollThumb options={polstOptions(row)} />
        <span className="min-w-0">
          <span className="block truncate font-display font-semibold text-text-primary group-hover:text-text-accent">
            {row.question}
          </span>
          <span className="mt-0.5 block truncate text-xs text-text-secondary">
            {row.optionA} vs {row.optionB}
          </span>
        </span>
      </Link>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  { header: "Views", align: "right", cell: (row) => numberCell(row, row.views) },
  { header: "Votes", align: "right", cell: (row) => numberCell(row, row.votes) },
  { header: "Interactions", align: "right", cell: (row) => numberCell(row, row.interactions) },
  {
    header: "Created",
    cell: (row) => (
      <span className="whitespace-nowrap text-text-secondary">{fmtDate(row.createdAt)}</span>
    ),
  },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <div
        className="flex justify-end"
        onClick={(event) => event.stopPropagation()}
      >
        <PolstRowMenu polst={row} onShare={() => onShare(row)} onQr={() => onQr(row)} />
      </div>
    ),
  },
];

/* ── View toggle ─────────────────────────────────────────────────── */

/** List is the operational default; the grid is a gallery for reviewing
 *  creative. One SegmentedControl with icon items carries the switch. */
const VIEWS = [
  { value: "list", icon: "table_rows", label: "List view" },
  { value: "grid", icon: "grid_view", label: "Gallery view" },
] as const;
type View = (typeof VIEWS)[number]["value"];

/* ── Grid card ───────────────────────────────────────────────────── */

/** A Polst exactly as its voters see the results — the real option pair
 *  with animated bars — plus the operator's number or run dates. */
function PolstGridCard({ polst }: { polst: SinglePolst }) {
  return (
    <DashboardCard className="lg:col-span-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/polsts/${polst.id}`}
          className="min-w-0 font-display text-sm font-semibold leading-6 text-text-primary hover:text-text-accent"
        >
          {polst.question}
        </Link>
        <StatusBadge status={polst.status} />
      </div>
      <PollResults className="mt-3" options={polstOptions(polst)} dense />
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-default pt-3 text-sm">
        <span className="text-text-secondary">
          {polst.votes > 0 ? (
            <>
              <span className="font-semibold tabular-nums text-text-primary">
                {fmtInt(polst.votes)}
              </span>{" "}
              votes
            </>
          ) : (
            fmtDateRange(polst.startAt, polst.endAt)
          )}
        </span>
        <Button variant="ghost" size="sm" className="-mr-2" asChild>
          <Link to={`/polsts/${polst.id}`}>
            View
            <Icon name="arrow_forward" size={18} />
          </Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

/* ── List page ───────────────────────────────────────────────────── */

export function PolstsPage() {
  const { polsts } = useWorkspace();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("All");
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [sharePolst, setSharePolst] = useState<SinglePolst | null>(null);
  const [qrPolst, setQrPolst] = useState<SinglePolst | null>(null);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return filterByStatus(polsts, active).filter(
      (polst) =>
        !normalized ||
        [polst.question, polst.optionA, polst.optionB].some((value) =>
          value.toLowerCase().includes(normalized),
        ),
    );
  }, [polsts, active, query]);

  const emptyTitle = query.trim()
    ? `No Polsts match “${query.trim()}”`
    : active === "All"
      ? "No Polsts yet"
      : active === "Drafts"
        ? "No drafts"
        : `No ${active.toLowerCase()} Polsts`;
  const emptyAction: EmptyStateAction = query.trim()
    ? { label: "Clear search", onClick: () => setQuery("") }
    : active === "Archived"
      ? { label: "View all Polsts", onClick: () => setActive("All") }
      : { label: "Create a Polst", to: "/polsts/new" };

  const toolbar = (
    <SearchAndFilters
      tabs={POLST_FILTERS}
      active={active}
      onChange={setActive}
      placeholder="Search Polsts"
      query={query}
      onQueryChange={setQuery}
      action={<SegmentedControl tabs={VIEWS} active={view} onChange={setView} />}
      className={view === "grid" ? "border-b-0" : undefined}
    />
  );

  return (
    <DashboardPage
      actions={
        <Button asChild>
          <Link to="/polsts/new">Create a Polst</Link>
        </Button>
      }
    >
      {view === "grid" ? (
        <>
          <DashboardCard padded={false}>{toolbar}</DashboardCard>
          {rows.length ? (
            <SectionGrid>
              {rows.map((polst) => (
                <PolstGridCard key={polst.id} polst={polst} />
              ))}
            </SectionGrid>
          ) : (
            <DashboardCard padded={false}>
              <EmptyState icon="ballot" title={emptyTitle} action={emptyAction} />
            </DashboardCard>
          )}
        </>
      ) : (
        <DashboardCard padded={false}>
          {toolbar}
          {rows.length ? (
            <DataTable
              rows={rows}
              columns={columns(setSharePolst, setQrPolst)}
              onRowClick={(row) => navigate(`/polsts/${row.id}`)}
            />
          ) : (
            <EmptyState icon="ballot" title={emptyTitle} action={emptyAction} />
          )}
        </DashboardCard>
      )}
      <SocialShareModal
        open={Boolean(sharePolst)}
        onClose={() => setSharePolst(null)}
        objectName={sharePolst?.question ?? "this Polst"}
        url={sharePolst ? shareUrl("polst", sharePolst.id) : ""}
      />
      <QrCodeModal
        open={Boolean(qrPolst)}
        onClose={() => setQrPolst(null)}
        objectName={qrPolst?.question ?? "this Polst"}
        url={qrPolst ? qrUrl(qrPolst) : ""}
      />
    </DashboardPage>
  );
}

/* ── Polst detail ────────────────────────────────────────────────── */

export function PolstDetailPage() {
  const { id } = useParams();
  const { polstById, archivePolst, restorePolst, sources } = useWorkspace();
  const toast = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const polst = polstById(id);
  if (!polst) return <NotFoundCard kind="Polst" />;

  /* This Polst's sources, read live from the store — never the stale
   * back-refs baked onto the entity at module load. */
  const polstSources = sources.filter(
    (s) => s.linked?.type === "polst" && s.linked.id === polst.id,
  );

  const isDraft = polst.status === "Draft";
  const isScheduled = polst.status === "Scheduled";
  const isActive = polst.status === "Active";
  const isEnded = polst.status === "Ended";
  const isArchived = polst.status === "Archived";
  const locked = isScheduled || isActive || isEnded;

  /* Schedule facts — every value from the entity, none synthesized. */
  const scheduleItems: Array<[string, ReactNode]> = [["Created", fmtDate(polst.createdAt)]];
  if (polst.startAt) {
    // An unpublished start date is a plan, not a fact — it never "started".
    const neverRan = isDraft || (isArchived && !hasRun(polst));
    scheduleItems.push([
      polst.startAt > TODAY || neverRan ? "Starts" : "Started",
      fmtDate(polst.startAt),
    ]);
    scheduleItems.push([
      polst.endAt ? (polst.endAt > TODAY ? "Ends" : "Ended") : "Ends",
      polst.endAt ? fmtDate(polst.endAt) : "No end date",
    ]);
  } else {
    scheduleItems.push(["Runs", "Not scheduled"]);
  }
  if (isActive && polst.endAt && polst.endAt >= TODAY) {
    const left = daysBetween(TODAY, polst.endAt);
    scheduleItems.push(["Days left", left === 0 ? "Ends today" : `${left} ${left === 1 ? "day" : "days"}`]);
  }
  if (isScheduled && polst.startAt) {
    const until = daysBetween(TODAY, polst.startAt);
    scheduleItems.push(["Starts in", `${until} ${until === 1 ? "day" : "days"}`]);
  }

  /* votes/hr over the trailing 1h / 6h / 24h — Active runs with votes
   *  only; a zero-vote run has no pace to report. */
  const velocity = voteVelocity(polst);

  /* The quiet answer to "is this result good?": lead option, margin, and
   * the evidence volume — canon's verdict vocabulary (signalFor), one line
   * in the Results header, no new card. */
  const resultVerdict = (() => {
    if (polst.votes === 0) return null;
    const marginPts = Math.abs(2 * polst.splitA - 100);
    const winner = {
      option: polst.splitA >= 50 ? polst.optionA : polst.optionB,
      marginPts,
    };
    const signal = signalFor({ status: polst.status, voters: polst.votes, marginPts });
    return `${verdictLabel({ signal, winner })} · ${fmtInt(polst.votes)} votes`;
  })();
  const verdictLine = resultVerdict ? (
    <span className="text-sm font-medium tabular-nums text-text-secondary">{resultVerdict}</span>
  ) : undefined;

  /* Voter preview facts. The like/repost counts split the polst's real
   *  interactions total, so the card reconciles with the tile above. */
  const showPreview = !isEnded && !isArchived;
  const startedDaysAgo =
    polst.startAt && polst.startAt <= TODAY ? daysBetween(polst.startAt, TODAY) : 0;
  const previewReposts = Math.round(polst.interactions / 4);
  const previewLikes = polst.interactions - previewReposts;
  /* "Time left" only exists once a run is live — a Draft or Scheduled
   * Polst has no countdown, so the preview carries no time-left chip. */
  const previewTimeLeft = (() => {
    if (isActive && polst.endAt) {
      const left = daysBetween(TODAY, polst.endAt);
      return left > 0 ? `${left}d` : "<1d";
    }
    return undefined;
  })();

  return (
    <DashboardPage
      actions={
        <>
          {isActive || isScheduled ? (
            <>
              <Button variant="secondary" onClick={() => setShareOpen(true)}>
                <Icon name="send" size={18} />
                Distribute
              </Button>
              <Button variant="secondary" onClick={() => setQrOpen(true)}>
                <Icon name="qr_code_2" size={18} />
                QR code
              </Button>
            </>
          ) : null}
          {isDraft ? (
            // The banner's "Finish & publish" owns the page's primary path
            // to the same editor — the header stays a quiet secondary.
            <Button variant="secondary" asChild>
              <Link to={`/polsts/new?edit=${polst.id}`}>Edit draft</Link>
            </Button>
          ) : null}
          {isEnded ? (
            <Button
              variant="secondary"
              onClick={() => {
                archivePolst(polst.id);
                toast("Moved to archive");
              }}
            >
              <Icon name="archive" size={18} />
              Archive
            </Button>
          ) : null}
          {isArchived ? (
            // A voted run restores to Ended, not Draft — say so.
            <Button
              onClick={() => {
                const status = restorePolst(polst.id);
                toast(
                  status === "Ended"
                    ? "Restored — back under Ended (its votes are part of the record)"
                    : "Restored to drafts",
                );
              }}
            >
              {polst.votes > 0 ? "Restore" : "Restore to drafts"}
            </Button>
          ) : null}
        </>
      }
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl font-semibold leading-7 text-text-primary">
            {polst.question}
          </h1>
          <StatusBadge status={polst.status} />
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {polst.optionA} vs {polst.optionB}
          {locked ? " · Question and options lock after publishing." : ""}
        </p>
      </div>

      {isDraft ? (
        <ActionCard
          title="Finish and publish this Polst"
          reason="Voters can't see a draft. Publish it to start collecting votes."
          primary={{ label: "Finish & publish", to: `/polsts/new?edit=${polst.id}` }}
        />
      ) : null}
      {isScheduled && polst.startAt && polstSources.length === 0 ? (
        <ActionCard
          title={`Starts ${relativeToToday(polst.startAt)} with no sources`}
          reason="Attach a QR code, share link, or embed so it collects votes from day one."
          // The action completes right here — the same in-context assign
          // flow the campaign Sources tab has, never a hop to Distribution.
          primary={{ label: "Assign source", onClick: () => setAssignOpen(true) }}
        />
      ) : null}

      {hasRun(polst) ? (
        <SectionGrid>
          <StatTile
            className="lg:col-span-3"
            label="Views"
            value={fmtInt(polst.views)}
            info={METRIC_INFO.views}
          />
          <StatTile
            className="lg:col-span-3"
            label="Votes"
            value={fmtInt(polst.votes)}
            info={METRIC_INFO.votes}
          />
          <StatTile
            className="lg:col-span-3"
            label="Interactions"
            value={fmtInt(polst.interactions)}
            info={METRIC_INFO.interactions}
          />
          <StatTile
            className="lg:col-span-3"
            label="Votes / view"
            value={polst.engagementRate !== null ? fmtPct(polst.engagementRate, 1) : "—"}
            info={METRIC_INFO.votesPerView}
          />
        </SectionGrid>
      ) : null}

      {showPreview ? (
        <SectionGrid>
          <div className="space-y-4 lg:col-span-7">
            {polst.votes > 0 ? (
              <DashboardCard title="Results" action={verdictLine}>
                <PollResults options={polstOptions(polst)} />
              </DashboardCard>
            ) : null}
            <DashboardCard title="Schedule">
              <DetailList items={scheduleItems} />
            </DashboardCard>
            {velocity ? (
              <DashboardCard
                title="Vote velocity"
                action={
                  <InfoHint
                    label="Vote velocity"
                    text="Average votes per hour over the trailing window, from this Polst's daily votes."
                  />
                }
              >
                <DetailList
                  items={[
                    ["Last hour", `${velocity.lastHour} votes/hr`],
                    ["Last 6 hours", `${velocity.perHour6} votes/hr`],
                    ["Last 24 hours", `${velocity.perHour24} votes/hr`],
                  ]}
                />
              </DashboardCard>
            ) : null}
          </div>
          <DashboardCard
            title="Voter preview"
            padded={false}
            className="self-start lg:col-span-5"
            bodyClassName="pt-2"
          >
            <PollCard
              author={WORKSPACE.brand}
              authorBadge={WORKSPACE.initials}
              authorColor="var(--color-purple-tint)"
              isFollowing
              postedAgo={startedDaysAgo > 0 ? `${startedDaysAgo}d` : undefined}
              categories={[polst.vertical]}
              question={polst.question}
              options={polstOptions(polst)}
              tags={[]}
              likes={previewLikes}
              reposts={previewReposts}
              votes={polst.votes}
              timeLeft={previewTimeLeft}
            />
          </DashboardCard>
        </SectionGrid>
      ) : (
        <SectionGrid>
          {polst.votes > 0 ? (
            <DashboardCard title="Results" className="lg:col-span-7" action={verdictLine}>
              <PollResults options={polstOptions(polst)} />
            </DashboardCard>
          ) : null}
          <DashboardCard
            title="Schedule"
            className={polst.votes > 0 ? "self-start lg:col-span-5" : "lg:col-span-7"}
          >
            <DetailList items={scheduleItems} />
          </DashboardCard>
        </SectionGrid>
      )}

      <SocialShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        objectName={polst.question}
        url={shareUrl("polst", polst.id)}
      />
      <QrCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        objectName={polst.question}
        url={qrUrl(polst)}
      />
      <AssignSourceModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        polst={polst}
      />
    </DashboardPage>
  );
}

/* ── Assign a source (scheduled runs) ─────────────────────────────────
   The campaign Sources tab's assign flow, scoped to this Polst — the
   attention card's CTA finishes the job in place instead of landing one
   click short on Distribution. "Assign" links; "Add" (Distribution)
   creates. */

const SOURCE_KINDS: Array<Source["kind"]> = ["QR code", "Share link", "Embed", "Tracked link"];
const CHANNELS: Channel[] = ["Website", "Email", "Instagram", "QR", "Influencer"];

function AssignSourceModal({
  open,
  onClose,
  polst,
}: {
  open: boolean;
  onClose: () => void;
  polst: SinglePolst;
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
      linked: { type: "polst", id: polst.id },
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
                      assignSource(s.id, { type: "polst", id: polst.id });
                      toast(`${s.name} assigned to this Polst`);
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
            {(fieldId) => (
              <TextInput
                id={fieldId}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="QR — Shelf talker"
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kind">
              {(fieldId) => (
                <SelectMenu
                  id={fieldId}
                  label="Kind"
                  value={kind}
                  onValueChange={setKind}
                  options={SOURCE_KINDS.map((k) => ({ value: k, label: k }))}
                />
              )}
            </Field>
            <Field label="Channel">
              {(fieldId) => (
                <SelectMenu
                  id={fieldId}
                  label="Channel"
                  value={channel}
                  onValueChange={setChannel}
                  options={CHANNELS.map((c) => ({ value: c, label: c }))}
                />
              )}
            </Field>
          </div>
          <div className="flex justify-end">
            <Button disabled={!name.trim() || submitting} onClick={create}>
              Create &amp; assign
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ── Create / edit a Polst ───────────────────────────────────────── */

/** /polsts/new — also the draft editor via ?edit={id}. */
export function CreatePolstPage() {
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const { polstById } = useWorkspace();
  const editing = editId ? polstById(editId) : undefined;
  if (editId && !editing) return <NotFoundCard kind="Polst" />;
  // Only drafts are editable — published Polsts land back on their page.
  if (editing && editing.status !== "Draft") {
    return <Navigate to={`/polsts/${editing.id}`} replace />;
  }
  return <ComposePolst key={editing?.id ?? "new"} draft={editing} />;
}

function ComposePolst({ draft }: { draft?: SinglePolst }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { createPolst, updatePolst, publishPolst } = useWorkspace();

  const [composer, setComposer] = useState<ComposerState>({
    question: draft?.question ?? "",
    optionA: draft?.optionA ?? "",
    optionB: draft?.optionB ?? "",
    category: draft?.vertical ?? null,
    optionsSet: Boolean(draft),
    imagesSet: Boolean(draft),
  });
  const [startDate, setStartDate] = useState(draft?.startAt ?? TODAY);
  // A saved schedule round-trips exactly (kit owns the preset vocabulary).
  const [duration, setDuration] = useState<DurationPreset>(() =>
    draft ? durationPresetFor(draft.startAt, draft.endAt) : "7 days",
  );
  const [customEnd, setCustomEnd] = useState(draft?.endAt ?? "");
  const [submitting, setSubmitting] = useState(false);

  const endDate = durationEnd(duration, startDate, customEnd);
  // Only a Custom duration can invert the range — refuse it at the source
  // so an impossible run (ends before it starts) can never be authored.
  const endBeforeStart = Boolean(endDate && startDate && endDate < startDate);

  const checks: Array<[string, boolean]> = [
    ["Question written", composer.question !== ""],
    ["Both options set", composer.optionsSet],
    ["Images added", composer.imagesSet],
  ];
  const canSave = composer.question !== "" && composer.optionsSet && !endBeforeStart;
  const canPublish = checks.every(([, done]) => done) && !endBeforeStart;

  const input = () => ({
    question: composer.question,
    optionA: composer.optionA,
    optionB: composer.optionB,
    startAt: startDate || undefined,
    endAt: endDate,
    vertical: VERTICALS.find((vertical) => vertical === composer.category),
  });

  const saveDraft = () => {
    if (submitting) return; // a double-click must not mint a duplicate draft
    let id: string;
    if (draft) {
      updatePolst(draft.id, input());
      id = draft.id;
    } else {
      id = createPolst(input());
    }
    setSubmitting(true);
    toast("Draft saved");
    navigate(`/polsts/${id}`);
  };

  const publish = () => {
    if (submitting) return; // a double-click must not publish twice
    const data = input();
    let id: string;
    if (draft) {
      updatePolst(draft.id, data);
      const result = publishPolst(draft.id);
      if (!result.ok) {
        toast(result.reason);
        return;
      }
      id = draft.id;
    } else {
      id = createPolst(data, { publish: true });
    }
    setSubmitting(true);
    // Speak the resolved status, never the intent: past dates land as Ended.
    const resolved = publishedStatus(data.startAt, data.endAt);
    toast(
      resolved === "Scheduled"
        ? `Polst scheduled — starts ${fmtDate(data.startAt!)}`
        : resolved === "Ended"
          ? "Polst published — its dates are already past, so it's Ended"
          : "Polst published — it's live",
    );
    navigate(`/polsts/${id}`);
  };

  return (
    <DashboardPage
      actions={
        <Button variant="secondary" asChild>
          <Link to={draft ? `/polsts/${draft.id}` : "/polsts"}>Cancel</Link>
        </Button>
      }
    >
      <SectionGrid>
        <div className="space-y-4 lg:col-span-8">
          <DashboardCard>
            <PollComposer
              categories={VERTICALS}
              initial={
                draft
                  ? {
                      question: draft.question,
                      optionA: draft.optionA,
                      optionB: draft.optionB,
                      imageA: polstImage(draft.id, "a"),
                      imageB: polstImage(draft.id, "b"),
                      categories: [draft.vertical],
                    }
                  : undefined
              }
              onChange={setComposer}
            />
          </DashboardCard>
          <DashboardCard title="Schedule">
            <div className="space-y-4">
              <div className="max-w-sm">
                <Field label="Start date">
                  {(fieldId) => (
                    <TextInput
                      id={fieldId}
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                    />
                  )}
                </Field>
              </div>
              <DurationField
                value={duration}
                onChange={setDuration}
                customEnd={customEnd}
                onCustomEndChange={setCustomEnd}
                startAt={startDate}
                subject="Polst"
              />
              {endBeforeStart ? (
                <FieldHelper tone="danger">The end date is before the start.</FieldHelper>
              ) : null}
            </div>
          </DashboardCard>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              disabled={!canSave || submitting}
              title={endBeforeStart ? "The end date is before the start." : undefined}
              onClick={saveDraft}
            >
              Save draft
            </Button>
            <Button
              disabled={!canPublish || submitting}
              title={endBeforeStart ? "The end date is before the start." : undefined}
              onClick={publish}
            >
              Publish Polst
            </Button>
          </div>
        </div>

        <div className="space-y-4 self-start lg:sticky lg:top-16 lg:col-span-4">
          <DashboardCard title="Ready to publish">
            <ul className="space-y-3">
              {checks.map(([label, done]) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  <Icon
                    name={done ? "check_circle" : "radio_button_unchecked"}
                    size={20}
                    filled={done}
                    className={done ? "text-status-success" : "text-text-tertiary"}
                  />
                  <span className={done ? "text-text-tertiary" : "text-text-primary"}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      </SectionGrid>
    </DashboardPage>
  );
}
