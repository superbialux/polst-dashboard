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
import { Field, TextInput } from "@/components/Field";
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
  EmptyState,
  NotFoundCard,
  PollResults,
  PollThumb,
  SearchAndFilters,
  SectionGrid,
  SegmentedControl,
  StatTile,
  StatusBadge,
  filterByStatus,
  type DataColumn,
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
} from "@/lib/canon";
import { addDays } from "@/lib/engine";
import {
  WORKSPACE,
  polstImage,
  polstOptions,
  polstSeries,
  shareUrl,
  type SinglePolst,
  type Vertical,
} from "@/lib/workspace";
import { useWorkspace } from "@/lib/store";

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
    toast(
      polst.startAt && polst.startAt > TODAY
        ? `Polst scheduled — starts ${fmtDate(polst.startAt)}`
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
          <MenuItem
            icon="restore"
            label="Restore to drafts"
            onClick={() => {
              restorePolst(polst.id);
              toast("Restored to drafts");
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
    ? `No Polsts match "${query.trim()}"`
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

  /* Recent pace from the polst's real daily series — Active runs with
   *  votes only; a zero-vote run has no pace to report. */
  const pace = (() => {
    if (!isActive || polst.votes === 0) return null;
    const series = polstSeries(polst, "votes");
    const on = (iso: string) => {
      const i = series.dates.indexOf(iso);
      return i === -1 ? 0 : series.values[i];
    };
    const last7 = series.dates.reduce((sum, date, i) => {
      const back = daysBetween(date, TODAY);
      return back >= 0 && back <= 6 ? sum + series.values[i] : sum;
    }, 0);
    return { today: on(TODAY), yesterday: on(addDays(TODAY, -1)), last7 };
  })();

  /* Voter preview facts. The like/repost counts split the polst's real
   *  interactions total, so the card reconciles with the tile above. */
  const showPreview = !isEnded && !isArchived;
  const startedDaysAgo =
    polst.startAt && polst.startAt <= TODAY ? daysBetween(polst.startAt, TODAY) : 0;
  const previewReposts = Math.round(polst.interactions / 4);
  const previewLikes = polst.interactions - previewReposts;
  const previewTimeLeft = (() => {
    if (isActive && polst.endAt) {
      const left = daysBetween(TODAY, polst.endAt);
      return left > 0 ? `${left}d` : "<1d";
    }
    if (polst.startAt && polst.endAt) return `${daysBetween(polst.startAt, polst.endAt)}d`;
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
            <Button asChild>
              <Link to={`/polsts/new?edit=${polst.id}`}>Edit Polst</Link>
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
            <Button
              onClick={() => {
                restorePolst(polst.id);
                toast("Restored to drafts");
              }}
            >
              Restore to drafts
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
          primary={{ label: "Add a source", to: "/distribution" }}
        />
      ) : null}

      {hasRun(polst) ? (
        <SectionGrid>
          <StatTile className="lg:col-span-3" label="Views" value={fmtInt(polst.views)} />
          <StatTile className="lg:col-span-3" label="Votes" value={fmtInt(polst.votes)} />
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
              <DashboardCard title="Results">
                <PollResults options={polstOptions(polst)} />
              </DashboardCard>
            ) : null}
            <DashboardCard title="Schedule">
              <DetailList items={scheduleItems} />
            </DashboardCard>
            {pace ? (
              <DashboardCard title="Vote velocity">
                <DetailList
                  items={[
                    ["Today", `${fmtInt(pace.today)} votes`],
                    ["Yesterday", `${fmtInt(pace.yesterday)} votes`],
                    ["Last 7 days", `${fmtInt(pace.last7)} votes`],
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
            <DashboardCard title="Results" className="lg:col-span-7">
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
      />
      <QrCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        objectName={polst.question}
        url={qrUrl(polst)}
      />
    </DashboardPage>
  );
}

/* ── Create / edit a Polst ───────────────────────────────────────── */

const DURATION_TABS = ["3 days", "7 days", "10 days", "Custom"] as const;
type DurationTab = (typeof DURATION_TABS)[number];
const DURATION_DAYS: Record<Exclude<DurationTab, "Custom">, number> = {
  "3 days": 3,
  "7 days": 7,
  "10 days": 10,
};

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
  const [duration, setDuration] = useState<DurationTab>(() => {
    if (!draft) return "7 days";
    // A saved schedule round-trips exactly: no end = Custom with an empty
    // end field, an off-preset run = Custom with its end date.
    if (!draft.startAt || !draft.endAt) return draft.startAt ? "Custom" : "7 days";
    // Inclusive span: a "7 days" run counts both endpoints (start..start+6).
    const days = daysBetween(draft.startAt, draft.endAt) + 1;
    const preset = (Object.entries(DURATION_DAYS) as Array<[DurationTab, number]>).find(
      ([, presetDays]) => presetDays === days,
    );
    return preset ? preset[0] : "Custom";
  });
  const [customEnd, setCustomEnd] = useState(draft?.endAt ?? "");

  const endDate =
    duration === "Custom"
      ? customEnd || undefined
      : startDate
        ? // Inclusive span: "7 days" runs start..start+6.
          addDays(startDate, DURATION_DAYS[duration] - 1)
        : undefined;

  const checks: Array<[string, boolean]> = [
    ["Question written", composer.question !== ""],
    ["Both options set", composer.optionsSet],
    ["Images added", composer.imagesSet],
  ];
  const canSave = composer.question !== "" && composer.optionsSet;
  const canPublish = checks.every(([, done]) => done);

  const input = () => ({
    question: composer.question,
    optionA: composer.optionA,
    optionB: composer.optionB,
    startAt: startDate || undefined,
    endAt: endDate,
    vertical: VERTICALS.find((vertical) => vertical === composer.category),
  });

  const saveDraft = () => {
    let id: string;
    if (draft) {
      updatePolst(draft.id, input());
      id = draft.id;
    } else {
      id = createPolst(input());
    }
    toast("Draft saved");
    navigate(`/polsts/${id}`);
  };

  const publish = () => {
    let id: string;
    if (draft) {
      updatePolst(draft.id, input());
      const result = publishPolst(draft.id);
      if (!result.ok) {
        toast(result.reason);
        return;
      }
      id = draft.id;
    } else {
      id = createPolst(input(), { publish: true });
    }
    toast(
      startDate && startDate > TODAY
        ? `Polst scheduled — starts ${fmtDate(startDate)}`
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
            <div className="grid gap-4 sm:grid-cols-2">
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
              <Field label="Duration">
                {() => (
                  <SegmentedControl
                    tabs={DURATION_TABS}
                    active={duration}
                    onChange={setDuration}
                    size="form"
                  />
                )}
              </Field>
            </div>
            {duration === "Custom" ? (
              <div className="mt-4 max-w-sm">
                <Field label="End date">
                  {(fieldId) => (
                    <TextInput
                      id={fieldId}
                      type="date"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                    />
                  )}
                </Field>
              </div>
            ) : null}
            <p className="mt-3 text-xs leading-4 text-text-tertiary">
              {endDate
                ? `Runs ${fmtDateRange(startDate || undefined, endDate)}. Voting closes when the Polst ends.`
                : "No end date set — the Polst keeps collecting votes until you archive it."}
            </p>
          </DashboardCard>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={!canSave} onClick={saveDraft}>
              Save draft
            </Button>
            <Button disabled={!canPublish} onClick={publish}>
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
