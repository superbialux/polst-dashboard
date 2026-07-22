import { useMemo, useState, type ReactNode } from "react";
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
import { Field, FieldHelper, SelectMenu, TextInput } from "@/components/Field";
import { Menu, MenuItem, MenuSeparator } from "@/components/Menu";
import { PollComposer, type ComposerState } from "@/components/PollComposer";
import { QrCodeModal, SocialShareModal } from "@/components/DistributionActions";
import { PolstComposerModal } from "@/components/PolstComposerModal";
import {
  ActionCard,
  AssignSourceModal,
  ChecklistItem,
  ConfirmModal,
  DashboardCard,
  DashboardPage,
  DataTable,
  DetailList,
  DurationField,
  EmptyState,
  InfoHint,
  NotFoundCard,
  PollResults,
  PolstListRow,
  ReviewModal,
  TableToolbar,
  TablePagination,
  StatusSelect,
  ViewToggle,
  DateRangePicker,
  SectionGrid,
  SegmentedControl,
  StatsStrip,
  StatusBadge,
  durationEnd,
  durationPresetFor,
  filterByCreated,
  filterByStatus,
  type DataColumn,
  type DurationPreset,
  type EmptyStateAction,
  type SortState,
  sortRows,
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
import { cn } from "@/lib/utils";
import {
  polstImage,
  polstOptions,
  polstSeries,
  shareUrl,
  verdictLabel,
  voteVelocity,
  type SinglePolst,
  type Category,
  type Stat,
} from "@/lib/workspace";
import { SourceDetailModal, type LinkedMeta } from "@/components/SourceDetail";
import { publishedStatus, useWorkspace } from "@/lib/store";

/* ── Shared vocabulary ───────────────────────────────────────────── */

/** Every lifecycle state is reachable — "All" really means everything. */
const POLST_FILTERS = ["All", "Active", "Scheduled", "Drafts", "Ended", "Archived"] as const;

const CATEGORIES: Category[] = ["Food & drink", "Lifestyle", "Shopping & deals"];

/** Nothing has run yet — analytics columns render as "—", not zeros. */
const hasRun = (polst: SinglePolst) => polst.views > 0 || polst.votes > 0;

/** Live and finished runs report real numbers (zero included); unpublished
 *  polsts have no analytics to report at all. */
const reportsNumbers = (polst: SinglePolst) =>
  polst.status === "Active" || polst.status === "Ended" || hasRun(polst);

const qrUrl = (polst: SinglePolst) => `${shareUrl("polst", polst.id)}?utm_source=qr`;

/* ── Row actions ─────────────────────────────────────────────────── */

/** One labeled overflow menu per row; items follow the lifecycle. Drafts
 *  edit and publish, live polsts distribute, archived ones restore. */
function PolstRowMenu({
  polst,
  onShare,
  onQr,
}: {
  polst: SinglePolst;
  onShare: () => void;
  onQr: () => void;
}) {
  const { publishPolst, archivePolst, restorePolst, unpublishPolst, deletePolst } = useWorkspace();
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
          <MenuItem
            icon="delete"
            label="Delete"
            onClick={() => {
              const result = deletePolst(polst.id);
              toast(result.ok ? "Polst deleted" : result.reason);
            }}
          />
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
          <MenuSeparator />
          {/* Refused once votes exist — the store states why. */}
          <MenuItem
            icon="undo"
            label="Unpublish"
            onClick={() => {
              const result = unpublishPolst(polst.id);
              toast(result.ok ? "Polst unpublished — back to drafts" : result.reason);
            }}
          />
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
    sort: (row) => row.question.toLowerCase(),
    cell: (row) => (
      <PolstListRow options={polstOptions(row)} question={row.question} to={`/polsts/${row.id}`} />
    ),
  },
  { header: "Status", sort: (row) => row.status, cell: (row) => <StatusBadge status={row.status} /> },
  { header: "Views", align: "right", sort: (row) => row.views, cell: (row) => numberCell(row, row.views) },
  { header: "Votes", align: "right", sort: (row) => row.votes, cell: (row) => numberCell(row, row.votes) },
  { header: "Interactions", align: "right", sort: (row) => row.interactions, cell: (row) => numberCell(row, row.interactions) },
  {
    header: "Created",
    sort: (row) => row.createdAt,
    cell: (row) => <span className="whitespace-nowrap">{fmtDate(row.createdAt)}</span>,
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

/** A polst exactly as its voters see the results — the real option pair
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

const PAGE_SIZE = 25;

export function PolstsPage() {
  const { polsts, polstById } = useWorkspace();
  const navigate = useNavigate();
  // ?compose=1 opens the composer modal over the list; ?edit seeds it
  // with a draft. /polsts/new resolves here, so every old link works.
  const [composeParams, setComposeParams] = useSearchParams();
  const composeOpen = composeParams.get("compose") === "1";
  const editParam = composeParams.get("edit");
  const editDraft = editParam ? polstById(editParam) : undefined;
  const closeCompose = () => setComposeParams({}, { replace: true });
  const [active, setActive] = useState<string>("All");
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState | null>(null);
  const [sharePolst, setSharePolst] = useState<SinglePolst | null>(null);
  const [qrPolst, setQrPolst] = useState<SinglePolst | null>(null);

  const tableColumns = useMemo(() => columns(setSharePolst, setQrPolst), []);
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = filterByCreated(filterByStatus(polsts, active), createdFrom, createdTo).filter(
      (polst) =>
        !normalized ||
        [polst.question, polst.optionA, polst.optionB].some((value) =>
          value.toLowerCase().includes(normalized),
        ),
    );
    // The FULL list sorts before pagination — page 2 continues page 1's
    // order instead of sorting its own slice.
    return sortRows(filtered, tableColumns, sort);
  }, [polsts, active, query, createdFrom, createdTo, sort, tableColumns]);

  /* Pagination clamps to the filtered list — a filter change that shrinks
     the result below the current page snaps back instead of showing air. */
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const setFilterAndResetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  const dateFiltered = Boolean(createdFrom || createdTo);
  const emptyTitle = query.trim()
    ? `No polsts match “${query.trim()}”`
    : dateFiltered
      ? "No polsts were created in this date range"
      : active === "All"
        ? "No polsts yet"
        : active === "Drafts"
          ? "No drafts"
          : `No ${active.toLowerCase()} polsts`;
  const emptyAction: EmptyStateAction = query.trim() || dateFiltered
    ? {
        label: "Clear filters",
        onClick: () => {
          setQuery("");
          setCreatedFrom("");
          setCreatedTo("");
          setPage(0);
        },
      }
    : active === "Archived"
      ? { label: "View all polsts", onClick: () => setActive("All") }
      : { label: "Create polst", to: "/polsts/new" };

  const pager = (
    <TablePagination
      page={safePage}
      pageSize={PAGE_SIZE}
      total={rows.length}
      onPage={setPage}
      noun="polsts"
    />
  );

  const toolbar = (
    <TableToolbar
      placeholder="Search polsts"
      query={query}
      onQueryChange={setFilterAndResetPage(setQuery)}
    >
      <StatusSelect
        options={POLST_FILTERS}
        value={active}
        onChange={setFilterAndResetPage(setActive)}
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
  );

  return (
    <DashboardPage
      actions={
        <Button asChild>
          <Link to="/polsts/new">Create polst</Link>
        </Button>
      }
      // The pager lives in the fixed footer band — the header's mirror.
      footer={rows.length ? pager : null}
    >
      {/* The action row rides ABOVE the card — the stat hero's altitude. */}
      <section className="space-y-2">
        {toolbar}
        {view === "grid" ? (
          rows.length ? (
            <SectionGrid>
              {pageRows.map((polst) => (
                <PolstGridCard key={polst.id} polst={polst} />
              ))}
            </SectionGrid>
          ) : (
            <DashboardCard padded={false}>
              <EmptyState icon="ballot" title={emptyTitle} action={emptyAction} />
            </DashboardCard>
          )
        ) : rows.length ? (
          <DashboardCard padded={false}>
            <DataTable
              rows={pageRows}
              columns={tableColumns}
              onRowClick={(row) => navigate(`/polsts/${row.id}`)}
              sort={sort}
              onSortChange={setFilterAndResetPage(setSort)}
            />
          </DashboardCard>
        ) : (
          <DashboardCard padded={false}>
            <EmptyState icon="ballot" title={emptyTitle} action={emptyAction} />
          </DashboardCard>
        )}
      </section>
      <SocialShareModal
        open={Boolean(sharePolst)}
        onClose={() => setSharePolst(null)}
        objectName={sharePolst?.question ?? "this polst"}
        url={sharePolst ? shareUrl("polst", sharePolst.id) : ""}
      />
      <QrCodeModal
        open={Boolean(qrPolst)}
        onClose={() => setQrPolst(null)}
        objectName={qrPolst?.question ?? "this polst"}
        url={qrPolst ? qrUrl(qrPolst) : ""}
      />
      <PolstComposerModal
        open={composeOpen}
        onClose={closeCompose}
        draft={editDraft?.status === "Draft" ? editDraft : undefined}
      />
    </DashboardPage>
  );
}

/* ── polst detail ────────────────────────────────────────────────── */

export function PolstDetailPage() {
  const { id } = useParams();
  const {
    polstById,
    archivePolst,
    restorePolst,
    deletePolst,
    sources,
    assignSource,
    addSource,
    unassignSource,
    campaigns,
  } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* The source detail tracks the ID, not the object — unassign inside
     the modal drops the source from this polst's list live. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const polst = polstById(id);
  if (!polst) return <NotFoundCard kind="polst" />;

  /* This polst's sources, read live from the store — never the stale
   * back-refs baked onto the entity at module load. */
  const polstSources = sources.filter(
    (s) => s.linked?.type === "polst" && s.linked.id === polst.id,
  );

  const isDraft = polst.status === "Draft";
  const isScheduled = polst.status === "Scheduled";
  const isActive = polst.status === "Active";
  const isEnded = polst.status === "Ended";
  const isArchived = polst.status === "Archived";

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
      pctFor: Math.max(polst.splitA, 100 - polst.splitA),
      pctAgainst: Math.min(polst.splitA, 100 - polst.splitA),
      responses: polst.votes,
    };
    const signal = signalFor({ status: polst.status, voters: polst.votes, marginPts });
    return `${verdictLabel({ status: polst.status, signal, winner })} · ${fmtInt(polst.votes)} votes`;
  })();
  const verdictLine = resultVerdict ? (
    <span className="text-sm font-medium tabular-nums text-text-secondary">{resultVerdict}</span>
  ) : undefined;

  /* The run's reach on the stat strip — daily series are the polst's
     own record (polstSeries); sparkless cells borrow the nearest series
     and the chart header says which one it draws. */
  const viewSeries = polstSeries(polst, "views");
  const voteSeries = polstSeries(polst, "votes");
  const runDates = viewSeries.dates;
  const runTicks =
    runDates.length > 0
      ? [
          runDates[0],
          runDates[Math.floor(runDates.length / 2)],
          runDates[runDates.length - 1],
        ].map((d) => fmtDate(d))
      : [];
  const runStats: Stat[] = [
    {
      label: "Views",
      value: fmtInt(polst.views),
      delta: "—",
      trend: "flat",
      info: METRIC_INFO.views,
      spark: viewSeries.values,
    },
    {
      label: "Votes",
      value: fmtInt(polst.votes),
      delta: "—",
      trend: "flat",
      info: METRIC_INFO.votes,
      spark: voteSeries.values,
    },
    {
      label: "Interactions",
      value: fmtInt(polst.interactions),
      delta: "—",
      trend: "flat",
      info: METRIC_INFO.interactions,
    },
    {
      label: "Votes / view",
      value: polst.engagementRate !== null ? fmtPct(polst.engagementRate, 1) : "—",
      delta: "—",
      trend: "flat",
      info: METRIC_INFO.votesPerView,
    },
  ];

  /* Campaigns carrying this polst — a library add copies the question
     into the chain with an id derived from this polst's, so both the
     derived id and an exact question match count. */
  const inCampaigns = campaigns.filter((c) =>
    c.chain.some((q) => q.id.includes(polst.id) || q.question === polst.question),
  );

  // Every source here feeds THIS polst — the linked meta is the page.
  const sourceDetail = detailId ? polstSources.find((s) => s.id === detailId) ?? null : null;
  const linkedMeta: LinkedMeta = {
    type: "polst",
    id: polst.id,
    name: polst.question,
    status: polst.status,
    to: `/polsts/${polst.id}`,
  };
  const assignable = !isEnded && !isArchived;

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
            <>
              {/* A never-run archive can be deleted; a voted run's record
                  stays (the store refuses — same law as voted sources). */}
              {polst.votes === 0 ? (
                <Button variant="destructive-secondary" onClick={() => setDeleteOpen(true)}>
                  <Icon name="delete" size={18} />
                  Delete
                </Button>
              ) : null}
              {/* A voted run restores to Ended, not Draft — say so. */}
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
            </>
          ) : null}
        </>
      }
      // The breadcrumb names the polst; the header band carries only the
      // run's status — the campaign detail's chrome, tabless.
      tabs={
        <div className="flex w-full items-center justify-end">
          <StatusBadge status={polst.status} />
        </div>
      }
    >
      {isDraft ? (
        <ActionCard
          title="Finish and publish this polst"
          reason="Voters can't see a draft. Publish it to start collecting votes."
          primary={{ label: "Finish & publish", to: `/polsts/new?edit=${polst.id}` }}
        />
      ) : null}
      {isArchived ? (
        // The archived state, in one read-only summary — never a dead end.
        <DashboardCard title="Archived">
          <p className="max-w-3xl text-sm leading-6 text-text-secondary">
            {polst.votes > 0
              ? `Ran ${fmtDateRange(polst.startAt, polst.endAt)} and collected ${fmtInt(
                  polst.votes,
                )} votes — ${polst.splitA >= 50 ? polst.optionA : polst.optionB} finished ahead ${
                  polst.splitA >= 50 ? polst.splitA : 100 - polst.splitA
                }–${polst.splitA >= 50 ? 100 - polst.splitA : polst.splitA}. Voters can't reach an archived polst, but its record stays in analytics. Restore returns it to Ended.`
              : "Never ran — archived as a draft with no votes. Restore it to drafts to keep working on it, or delete it for good."}
          </p>
        </DashboardCard>
      ) : null}
      {/* A scheduled run always leads with the big when-it-starts statement —
          the schedule table below is the record, this is the headline. The
          missing-sources cut keeps its urgent framing and in-context fix. */}
      {isScheduled && polst.startAt ? (
        polstSources.length === 0 ? (
          <ActionCard
            title={`Starts ${relativeToToday(polst.startAt)} with no sources`}
            reason="Attach a QR code, share link, or embed so it collects votes from day one."
            // The action completes right here — the same in-context assign
            // flow the campaign Sources tab has, never a hop to Distribution.
            primary={{ label: "Assign source", onClick: () => setAssignOpen(true) }}
          />
        ) : (
          <ActionCard
            title={`Starts ${relativeToToday(polst.startAt)}`}
            reason={`${polstSources.length} ${
              polstSources.length === 1 ? "source is" : "sources are"
            } ready to collect votes the moment it goes live.`}
            primary={{ label: "Review schedule", to: `/polsts/new?edit=${polst.id}` }}
          />
        )
      ) : null}

      {hasRun(polst) ? (
        <StatsStrip
          stats={runStats}
          xTicks={runTicks}
          scopeLabel={fmtDateRange(polst.startAt, polst.endAt)}
          collapsible
        />
      ) : null}

      <SectionGrid className="items-start">
        {polst.votes > 0 || velocity ? (
          <div className="space-y-4 lg:col-span-7">
            {polst.votes > 0 ? (
              <DashboardCard title="Results" action={verdictLine}>
                <PollResults options={polstOptions(polst)} />
              </DashboardCard>
            ) : null}
            {velocity ? (
              <DashboardCard
                title="Vote velocity"
                action={<InfoHint label="Vote velocity" text={METRIC_INFO.voteVelocity} />}
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
        ) : null}
        <div
          className={cn(
            "space-y-4",
            polst.votes > 0 || velocity ? "lg:col-span-5" : "lg:col-span-7",
          )}
        >
          <DashboardCard title="About">
            <DetailList
              items={[
                ...scheduleItems,
                ["Category", polst.category],
                [
                  "In campaigns",
                  inCampaigns.length ? (
                    <span key="in-campaigns" className="flex flex-wrap justify-end gap-x-2">
                      {inCampaigns.map((c) => (
                        <Link
                          key={c.id}
                          to={`/campaigns/${c.id}`}
                          className="font-semibold text-text-accent hover:underline"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </span>
                  ) : (
                    "—"
                  ),
                ],
              ]}
            />
          </DashboardCard>
          {/* A row IS the way in — click opens the source's detail (stats,
              its working asset, guarded unassign), Distribution's contract. */}
          <DashboardCard
            title="Sources"
            padded={polstSources.length === 0}
            action={
              assignable ? (
                <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}>
                  <Icon name="add" size={18} />
                  Assign source
                </Button>
              ) : undefined
            }
          >
            {polstSources.length > 0 ? (
              <ul className="divide-y divide-border-default">
                {polstSources.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setDetailId(s.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-subtle"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          {s.name}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {s.kind} · {s.channel}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-text-secondary">
                        {s.voters > 0 ? `${fmtInt(s.voters)} voters` : "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="hub"
                title="No sources yet"
                action={
                  assignable
                    ? { label: "Assign source", onClick: () => setAssignOpen(true) }
                    : undefined
                }
              />
            )}
          </DashboardCard>
        </div>
      </SectionGrid>

      <SourceDetailModal
        source={sourceDetail}
        linked={sourceDetail ? linkedMeta : null}
        onClose={() => setDetailId(null)}
        // Already on the polst's own page — no circular "Open polst".
        showOpenLink={false}
        onAssign={() => setAssignOpen(true)}
        onUnassign={(s) => {
          const result = unassignSource(s.id);
          toast(result.ok ? `${s.name} unassigned` : result.reason);
        }}
      />

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
      {/* The campaign Sources tab's assign flow, scoped to this polst — the
          attention card's CTA finishes the job in place instead of landing
          one click short on Distribution. "Assign" links; create makes a
          pre-linked source. */}
      <AssignSourceModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        unlinked={sources.filter((s) => !s.linked)}
        onAssign={(s) => {
          assignSource(s.id, { type: "polst", id: polst.id });
          toast(`${s.name} assigned to this polst`);
          setAssignOpen(false);
        }}
        onCreate={(draft) => {
          addSource({ ...draft, linked: { type: "polst", id: polst.id } });
          toast(`${draft.name} created and assigned`);
          setAssignOpen(false);
        }}
      />
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        label="Delete polst"
        title="Delete this polst?"
        confirmLabel="Delete polst"
        tone="danger"
        onConfirm={() => {
          const result = deletePolst(polst.id);
          setDeleteOpen(false);
          if (result.ok) {
            toast("Polst deleted");
            navigate("/polsts");
          } else {
            toast(result.reason);
          }
        }}
      >
        “{polst.question}” never collected votes, so nothing is lost with it. This can't be
        undone.
      </ConfirmModal>
    </DashboardPage>
  );
}

/* ── Create / edit a polst ───────────────────────────────────────── */

export function CreatePolstPage() {
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const { polstById } = useWorkspace();
  const editing = editId ? polstById(editId) : undefined;
  if (editId && !editing) return <NotFoundCard kind="polst" />;
  // Only drafts are editable — published polsts land back on their page.
  if (editing && editing.status !== "Draft") {
    return <Navigate to={`/polsts/${editing.id}`} replace />;
  }
  // Composing is a MODAL over the list — the route survives for deep
  // links and the row menus, and resolves to the list with it open.
  return (
    <Navigate
      to={editing ? `/polsts?compose=1&edit=${editing.id}` : "/polsts?compose=1"}
      replace
    />
  );
}
