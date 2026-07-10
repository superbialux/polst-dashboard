import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Checkbox, Field, SelectMenu, TextInput } from "@/components/Field";
import { PollCard } from "@/components/PollCard";
import { PollComposer, type ComposerState } from "@/components/PollComposer";
import { QrCodeModal, SocialShareModal } from "@/components/DistributionActions";
import {
  DashboardCard,
  DashboardPage,
  DataTable,
  DetailList,
  PollResults,
  PollThumb,
  SegmentedControl,
  SearchAndFilters,
  SectionGrid,
  StatusBadge,
  filterByStatus,
  type DataColumn,
} from "@/components/dashboard";
import {
  SINGLE_POLSTS,
  TOP_INTERESTS,
  WORKSPACE,
  formatNumber,
  polstOptions,
  type SinglePolst,
} from "@/lib/workspace";
const POLST_FILTERS = ["All", "Active", "Drafts"] as const;
const DRAFT_FILTERS = ["Active", "Archived"] as const;
const POLST_CREATED: Record<string, string> = {
  "which-headline-wins": "Jun 5, 2026",
  "packaging-color-premium": "Jun 4, 2026",
  "event-hook": "Jun 11, 2026",
  "archived-draft": "Jun 1, 2026",
  "label-layout": "May 20, 2026",
  "snack-size-sells": "Jun 6, 2026",
  "hero-image-ad": "Jun 9, 2026",
  "price-point-fair": "Jun 3, 2026",
  "sweet-or-savory": "Jun 11, 2026",
  "mascot-preference": "Jun 8, 2026",
};
const createdDate = (polst: SinglePolst) => POLST_CREATED[polst.id] ?? "Jun 1, 2026";
const viewCount = (polst: SinglePolst) => polst.responses ? Math.round(polst.responses / 0.18) : 0;
const displayStatus = (polst: SinglePolst) => polst.status === "Completed" ? "Ended" : polst.status;

/** The operational default: the object's identity is a small paired thumb,
 *  the row is owned by status, scope, evidence, and recency. */
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
  { header: "Status", cell: (row) => <StatusBadge status={displayStatus(row)} /> },
  {
    header: "Views",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(viewCount(row))}</span>,
  },
  {
    header: "Votes",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "Engagement",
    align: "right",
    cell: (row) => <span className="tabular-nums text-text-secondary">{row.responses ? `${formatNumber(Math.max(1, Math.round(row.responses * 0.04)))} interactions` : "—"}</span>,
  },
  {
    header: "Created",
    cell: (row) => <span className="whitespace-nowrap text-text-secondary">{createdDate(row)}</span>,
  },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" title="View analytics" asChild>
          <Link to={`/polsts/${row.id}`}><Icon name="monitoring" size={18} /></Link>
        </Button>
        <Button variant="ghost" size="icon" title="Distribute" onClick={() => onShare(row)}>
          <Icon name="send" size={18} />
        </Button>
        <Button variant="ghost" size="icon" title="QR code" onClick={() => onQr(row)}>
          <Icon name="qr_code_2" size={18} />
        </Button>
      </div>
    ),
  },
];

/* ── View toggle ─────────────────────────────────────────────────── */

/** List is the operational default; the grid is a deliberate gallery mode
 *  for reviewing creative, not for admin scanning. */
const VIEWS = [
  { key: "list", icon: "table_rows", label: "List view" },
  { key: "grid", icon: "grid_view", label: "Gallery view" },
] as const;
type View = (typeof VIEWS)[number]["key"];

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div role="group" aria-label="View mode" className="flex h-[37px] rounded-md border border-border-default bg-surface-raised p-1">
      {VIEWS.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={view === option.key}
          aria-label={option.label}
          onClick={() => onChange(option.key)}
          className={cn(
            "grid h-[29px] w-8 place-items-center rounded-sm text-icon-secondary transition-colors hover:text-icon-primary",
            view === option.key && "bg-surface-subtle text-icon-primary",
          )}
        >
          <Icon name={option.icon} size={18} />
        </button>
      ))}
    </div>
  );
}

/* ── Grid card ───────────────────────────────────────────────────── */

/** A Polst exactly as its voters see the results — the real option pair
 *  with animated bars — plus the operator's row of numbers. */
function PolstGridCard({ polst }: { polst: SinglePolst }) {
  const hasVotes = polst.responses > 0;
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
          {hasVotes ? (
            <>
              <span className="font-semibold tabular-nums text-text-primary">
                {formatNumber(polst.responses)}
              </span>{" "}
              responses
            </>
          ) : (
            polst.dates
          )}
        </span>
        <Button variant="ghost" size="sm" className="-mr-2" asChild>
          <Link to={`/polsts/${polst.id}`}>
            {polst.nextAction}
            <Icon name="arrow_forward" size={18} />
          </Link>
        </Button>
      </div>
    </DashboardCard>
  );
}

export function PolstsPage() {
  const [active, setActive] = useState("All");
  const [draftFilter, setDraftFilter] = useState<(typeof DRAFT_FILTERS)[number]>("Active");
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [sharePolst, setSharePolst] = useState<SinglePolst | null>(null);
  const [qrPolst, setQrPolst] = useState<SinglePolst | null>(null);
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const scoped = active === "All"
      ? SINGLE_POLSTS.filter((polst) => polst.status !== "Draft" && polst.status !== "Archived")
      : active === "Drafts"
        ? SINGLE_POLSTS.filter((polst) => polst.status === (draftFilter === "Archived" ? "Archived" : "Draft"))
        : filterByStatus(SINGLE_POLSTS, active);
    return scoped.filter((polst) =>
      !normalized || [polst.question, polst.optionA, polst.optionB, polst.topSource]
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [active, draftFilter, query]);

  return (
    <DashboardPage
      actions={
        <Button asChild>
          <Link to="/polsts/new">Create a Polst</Link>
        </Button>
      }
    >
      {active === "Drafts" ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <SegmentedControl tabs={DRAFT_FILTERS} active={draftFilter} onChange={setDraftFilter} />
            <TextInput
              icon="search"
              placeholder="Search drafts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-[37px] max-w-72"
            />
          </div>
          <DashboardCard padded={false}>
            <DataTable rows={rows} columns={columns(setSharePolst, setQrPolst)} emptyLabel={`No ${draftFilter.toLowerCase()} drafts`} />
          </DashboardCard>
        </>
      ) : view === "grid" ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <SearchAndFilters
              tabs={POLST_FILTERS}
              active={active}
              onChange={setActive}
              placeholder="Search Polsts"
              query={query}
              onQueryChange={setQuery}
              className="min-w-0 flex-1 border-b-0 p-0"
            />
            <ViewToggle view={view} onChange={setView} />
          </div>
          {rows.length ? (
            <SectionGrid>
              {rows.map((polst) => (
                <PolstGridCard key={polst.id} polst={polst} />
              ))}
            </SectionGrid>
          ) : (
            <DashboardCard>
              <p className="py-6 text-center text-sm text-text-tertiary">
                No Polsts match this filter.
              </p>
            </DashboardCard>
          )}
        </>
      ) : (
        <DashboardCard padded={false}>
          <SearchAndFilters
            tabs={POLST_FILTERS}
            active={active}
            onChange={setActive}
            placeholder="Search Polsts"
            query={query}
            onQueryChange={setQuery}
            action={<ViewToggle view={view} onChange={setView} />}
          />
          <DataTable
            rows={rows}
            columns={columns(setSharePolst, setQrPolst)}
            emptyLabel="No Polsts match this filter"
          />
        </DashboardCard>
      )}
      <SocialShareModal open={Boolean(sharePolst)} onClose={() => setSharePolst(null)} objectName={sharePolst?.question ?? "this Polst"} />
      <QrCodeModal open={Boolean(qrPolst)} onClose={() => setQrPolst(null)} objectName={qrPolst?.question ?? "this Polst"} url={`https://polst.app/p/${qrPolst?.id ?? "polst"}?utm_source=qr`} />
    </DashboardPage>
  );
}

/* ── Polst detail ────────────────────────────────────────────────── */

export function PolstDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const polst = SINGLE_POLSTS.find((p) => p.id === id) ?? SINGLE_POLSTS[0];
  const hasVotes = polst.responses > 0;
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [lifetime, setLifetime] = useState("7 days");
  const splitA = Number.parseInt(polst.split, 10) || 0;
  const optionAVotes = Math.round(polst.responses * splitA / 100);

  return (
    <DashboardPage
      actions={
        <>
          <Button variant="secondary" onClick={() => setShareOpen(true)}>
            <Icon name="send" size={18} />
            Distribute
          </Button>
          <Button variant="secondary" onClick={() => setQrOpen(true)}>
            <Icon name="qr_code_2" size={18} />
            QR code
          </Button>
          <Button onClick={() => toast(hasVotes ? "Live Polsts can be duplicated into drafts" : "Draft opened for editing")}>
            Edit Polst
          </Button>
        </>
      }
    >
      <DashboardCard
        title="Lifetime"
        action={<StatusBadge status={displayStatus(polst)} />}
      >
        <SegmentedControl
          tabs={["3 days", "7 days", "10 days", "Custom"]}
          active={lifetime}
          onChange={setLifetime}
        />
      </DashboardCard>

      <SectionGrid>
        <DashboardCard title="Total votes" className="lg:col-span-4">
          <p className="font-display text-3xl font-semibold tabular-nums text-text-primary">{formatNumber(polst.responses)}</p>
        </DashboardCard>
        <DashboardCard title={polst.optionA} className="lg:col-span-4">
          <p className="font-display text-3xl font-semibold tabular-nums text-text-primary">{formatNumber(optionAVotes)}</p>
        </DashboardCard>
        <DashboardCard title={polst.optionB} className="lg:col-span-4">
          <p className="font-display text-3xl font-semibold tabular-nums text-text-primary">{formatNumber(polst.responses - optionAVotes)}</p>
        </DashboardCard>
      </SectionGrid>

      <SectionGrid>
        <div className="space-y-4 lg:col-span-7">
          <DashboardCard title="Results">
            <PollResults options={polstOptions(polst)} />
          </DashboardCard>
          <DashboardCard title="Vote velocity">
            <DetailList
              items={[
                ["Last hour", hasVotes ? "12 votes/hr" : "0 votes/hr"],
                ["Last 6 hours", hasVotes ? "9 votes/hr" : "0 votes/hr"],
                ["Last 24 hours", hasVotes ? "7 votes/hr" : "0 votes/hr"],
              ]}
            />
          </DashboardCard>
        </div>

        <DashboardCard
          title="Voter preview"
          description="Preview only."
          padded={false}
          className="self-start lg:col-span-5"
          bodyClassName="pt-2"
        >
          <PollCard
            author={WORKSPACE.brand}
            authorBadge={WORKSPACE.initials}
            authorColor="var(--color-purple-tint)"
            isFollowing
            postedAgo="2d"
            categories={[TOP_INTERESTS[0].label]}
            question={polst.question}
            options={polstOptions(polst)}
            tags={[]}
            likes={Math.round(polst.responses * 0.16)}
            reposts={Math.round(polst.responses * 0.04)}
            votes={polst.responses}
            timeLeft="2d"
          />
        </DashboardCard>
      </SectionGrid>
      <SocialShareModal open={shareOpen} onClose={() => setShareOpen(false)} objectName={polst.question} />
      <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} objectName={polst.question} url={`https://polst.app/p/${polst.id}?utm_source=qr`} />
    </DashboardPage>
  );
}

/* ── Create a Polst ──────────────────────────────────────────────── */

export function CreatePolstPage() {
  const [composer, setComposer] = useState<ComposerState>({
    question: "",
    optionsSet: false,
    imagesSet: false,
  });
  const [lifetime, setLifetime] = useState("3 days");
  const [isPrivate, setIsPrivate] = useState(false);
  const checks: [string, boolean][] = [
    ["Question written", composer.question !== ""],
    ["Both options set", composer.optionsSet],
    ["Images added", composer.imagesSet],
  ];
  const canPublish = checks.every(([, done]) => done);

  return (
    <DashboardPage
      actions={
        <Button variant="secondary" asChild><Link to="/polsts">Discard</Link></Button>
      }
    >
      <SectionGrid>
        <div className="space-y-4 lg:col-span-8">
          <DashboardCard>
            <PollComposer categories={TOP_INTERESTS.map((t) => t.label)} onChange={setComposer} />
          </DashboardCard>
          <DashboardCard title="Polst lifetime">
            <SegmentedControl tabs={["3 days", "7 days", "10 days", "Custom date"]} active={lifetime} onChange={setLifetime} />
            {lifetime === "Custom date" ? (
              <div className="mt-4 max-w-sm"><Field label="End date">{(id) => <TextInput id={id} type="datetime-local" />}</Field></div>
            ) : null}
          </DashboardCard>
          <DashboardCard title="Schedule" description="Optional">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date">{(id) => <TextInput id={id} type="datetime-local" />}</Field>
              <Field label="End date">{(id) => <TextInput id={id} type="datetime-local" />}</Field>
            </div>
          </DashboardCard>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border-default bg-surface-raised p-4">
            <Checkbox label="Private Polst" checked={isPrivate} onCheckedChange={setIsPrivate} />
            <span className="font-display text-sm font-semibold text-text-primary">Private Polst</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary">Save draft</Button>
            <Button disabled={!canPublish}>Publish Polst</Button>
          </div>
        </div>

        <div className="space-y-4 self-start lg:sticky lg:top-16 lg:col-span-4">
          <DashboardCard title="Completeness">
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
