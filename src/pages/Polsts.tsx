import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Field, TextInput, Select } from "@/components/Field";
import { PollCard } from "@/components/PollCard";
import { PollComposer, type ComposerState } from "@/components/PollComposer";
import {
  DashboardCard,
  DashboardPage,
  DataTable,
  DetailList,
  MixBars,
  PollResults,
  SearchAndFilters,
  SectionGrid,
  StatusBadge,
  filterByStatus,
  type DataColumn,
} from "@/components/dashboard";
import {
  DEVICE_MIX,
  DISTRIBUTION_SOURCES,
  KEY_DATES,
  SINGLE_POLSTS,
  STATUS_FILTERS,
  TOP_INTERESTS,
  WORKSPACE,
  formatNumber,
  polstOptions,
  type SinglePolst,
} from "@/lib/workspace";
import { sourceColumns } from "./Distribution";

const columns: Array<DataColumn<SinglePolst>> = [
  {
    header: "Polst question",
    cell: (row) => (
      <Link
        to={`/polsts/${row.id}`}
        className="font-display font-semibold text-text-primary hover:text-text-accent"
      >
        {row.question}
      </Link>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    header: "Event",
    cell: (row) => <span className="text-text-secondary">{row.event}</span>,
  },
  {
    header: "Responses",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "Vote split",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.split}</span>,
  },
  {
    header: "Top source",
    cell: (row) => <span className="text-text-secondary">{row.topSource}</span>,
  },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <Button variant="secondary" size="sm" asChild>
        <Link to={`/polsts/${row.id}`}>{row.nextAction}</Link>
      </Button>
    ),
  },
];

/* ── View toggle ─────────────────────────────────────────────────── */

const VIEWS = [
  { key: "grid", icon: "grid_view", label: "Grid view" },
  { key: "list", icon: "table_rows", label: "List view" },
] as const;
type View = (typeof VIEWS)[number]["key"];

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div role="group" aria-label="View mode" className="flex rounded-md border border-border-default bg-surface-raised p-0.5">
      {VIEWS.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={view === option.key}
          aria-label={option.label}
          onClick={() => onChange(option.key)}
          className={cn(
            "grid h-7 w-8 place-items-center rounded-sm text-icon-secondary transition-colors hover:text-icon-primary",
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
    <DashboardCard className="transition-shadow duration-300 hover:shadow-md lg:col-span-4">
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
  const [view, setView] = useState<View>("grid");
  const rows = useMemo(() => filterByStatus(SINGLE_POLSTS, active), [active]);

  return (
    <DashboardPage
      title="Polsts"
      actions={
        <Button asChild>
          <Link to="/polsts/new">Create single Polst</Link>
        </Button>
      }
    >
      {view === "grid" ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <SearchAndFilters
              tabs={STATUS_FILTERS}
              active={active}
              onChange={setActive}
              placeholder="Search standalone Polsts"
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
            tabs={STATUS_FILTERS}
            active={active}
            onChange={setActive}
            placeholder="Search standalone Polsts"
            action={<ViewToggle view={view} onChange={setView} />}
          />
          <DataTable
            rows={rows}
            columns={columns}
            emptyLabel="No Polsts match this filter"
          />
        </DashboardCard>
      )}
    </DashboardPage>
  );
}

/* ── Polst detail ────────────────────────────────────────────────── */

export function PolstDetailPage() {
  const { id } = useParams();
  const polst = SINGLE_POLSTS.find((p) => p.id === id) ?? SINGLE_POLSTS[0];
  const hasVotes = polst.responses > 0;

  return (
    <DashboardPage
      eyebrow={
        <Link to="/polsts" className="hover:text-text-primary">
          Polsts
        </Link>
      }
      title={polst.question}
      actions={
        <>
          <Button variant="secondary">Generate report</Button>
          <Button asChild>
            <Link to="/distribution">Add distribution</Link>
          </Button>
        </>
      }
    >
      <SectionGrid>
        {/* The REAL consumer card, live — vote on it and the bars animate. */}
        <DashboardCard title="Live preview" padded={false} className="lg:col-span-7">
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

        <div className="space-y-4 lg:col-span-5">
          <DashboardCard title="Summary">
            <DetailList
              items={[
                ["Status", <StatusBadge key="s" status={polst.status} />],
                ["Responses", formatNumber(polst.responses)],
                ["Completion", polst.completion],
                ["Median time to vote", hasVotes ? "4.6s" : "—"],
                ["Share rate", hasVotes ? "7.4%" : "—"],
                ["Top source", polst.topSource],
                ["Schedule", polst.dates],
                ["Event", polst.event],
              ]}
            />
          </DashboardCard>
          <DashboardCard title="Audience snapshot">
            <DetailList
              items={[
                ["New / returning", hasVotes ? "72% / 28%" : "—"],
                ["Broad location", hasVotes ? "United States" : "—"],
              ]}
            />
            <div className="mt-4">
              <MixBars slices={hasVotes ? DEVICE_MIX : []} />
              {!hasVotes ? (
                <p className="py-2 text-center text-sm text-text-tertiary">
                  Device data appears once voting starts.
                </p>
              ) : null}
            </div>
          </DashboardCard>
        </div>
      </SectionGrid>

      <DashboardCard title="Source breakdown" padded={false}>
        <DataTable
          rows={hasVotes ? DISTRIBUTION_SOURCES.slice(0, 3) : []}
          columns={sourceColumns.slice(0, 5)}
          emptyLabel="No sources have collected responses yet"
        />
      </DashboardCard>
    </DashboardPage>
  );
}

/* ── Create single Polst ─────────────────────────────────────────── */

export function CreatePolstPage() {
  const toast = useToast();
  const [composer, setComposer] = useState<ComposerState>({
    question: "",
    optionsSet: false,
    imagesSet: false,
  });
  return (
    <DashboardPage
      eyebrow={
        <span>
          <Link to="/polsts" className="hover:text-text-primary">
            Polsts
          </Link>{" "}
          / Create single Polst
        </span>
      }
      title="Create single Polst"
      actions={
        <>
          <Button variant="secondary" asChild>
            <Link to="/polsts">Discard</Link>
          </Button>
          <Button onClick={() => toast("Draft saved")}>Save draft</Button>
        </>
      }
    >
      <SectionGrid>
        <div className="space-y-4 lg:col-span-8">
          <DashboardCard>
            <PollComposer
              categories={TOP_INTERESTS.map((t) => t.label)}
              onChange={setComposer}
            />
          </DashboardCard>

          <DashboardCard
            title="Schedule"
            description="Optional — an unscheduled Polst stays in drafts."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Start date">
                {(fieldId) => <TextInput id={fieldId} type="date" icon="calendar_today" />}
              </Field>
              <Field label="End date">
                {(fieldId) => <TextInput id={fieldId} type="date" icon="event" />}
              </Field>
              <Field label="Linked event">
                {(fieldId) => (
                  <Select id={fieldId} defaultValue="None">
                    <option>None</option>
                    {KEY_DATES.map((date) => (
                      <option key={date.id}>{date.title}</option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Distribution"
            description="Optional but recommended — attach a source so responses are attributed."
          >
            <div className="space-y-1">
              {DISTRIBUTION_SOURCES.slice(0, 3).map((source) => (
                <label
                  key={source.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-subtle"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded-sm border-border-strong accent-accent-default"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-text-primary">
                      {source.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">
                      {source.channel} · {source.type}
                    </p>
                  </div>
                  <StatusBadge status={source.status} />
                </label>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="space-y-4 self-start lg:sticky lg:top-5 lg:col-span-4">
          <DashboardCard title="Status">
            <DetailList
              items={[
                ["State", <StatusBadge key="s" status="Draft" />],
                ["Schedule", "Not set"],
                ["Event", "Optional"],
              ]}
            />
          </DashboardCard>
          <DashboardCard title="Launch readiness">
            <ul className="space-y-3">
              {(
                [
                  ["Question written", composer.question !== ""],
                  ["Both options set", composer.optionsSet],
                  ["Images added", composer.imagesSet],
                  ["Scheduled", false],
                ] as [string, boolean][]
              ).map(([label, done]) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-text-secondary">{label}</span>
                  <Icon
                    name={done ? "check_circle" : "radio_button_unchecked"}
                    size={20}
                    filled={done}
                    className={done ? "text-status-success" : "text-text-tertiary"}
                  />
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      </SectionGrid>
    </DashboardPage>
  );
}
