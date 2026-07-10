import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Checkbox, Field, SelectMenu, TextInput } from "@/components/Field";
import { PollCard } from "@/components/PollCard";
import { PollComposer, type ComposerState } from "@/components/PollComposer";
import {
  DashboardCard,
  DashboardPage,
  DataTable,
  DetailList,
  FlowSteps,
  MixBars,
  PollResults,
  PollThumb,
  SavedChip,
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

const EVENT_OPTIONS = [
  { value: "None", label: "None" },
  ...KEY_DATES.map((date) => ({ value: date.title, label: date.title })),
];

/** The operational default: the object's identity is a small paired thumb,
 *  the row is owned by status, scope, evidence, and recency. */
const columns: Array<DataColumn<SinglePolst>> = [
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
  {
    header: "Responses",
    align: "right",
    cell: (row) => (
      <span className="tabular-nums">
        {row.responses > 0 ? formatNumber(row.responses) : "—"}
      </span>
    ),
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
    header: "Schedule",
    cell: (row) => <span className="whitespace-nowrap text-text-secondary">{row.dates}</span>,
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
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return filterByStatus(SINGLE_POLSTS, active).filter((polst) =>
      !normalized || [polst.question, polst.optionA, polst.optionB, polst.topSource]
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [active, query]);

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
          <div className="flex items-center justify-between gap-3">
            <SearchAndFilters
              tabs={STATUS_FILTERS}
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
            tabs={STATUS_FILTERS}
            active={active}
            onChange={setActive}
            placeholder="Search Polsts"
            query={query}
            onQueryChange={setQuery}
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
  const toast = useToast();
  const polst = SINGLE_POLSTS.find((p) => p.id === id) ?? SINGLE_POLSTS[0];
  const hasVotes = polst.responses > 0;

  return (
    <DashboardPage
      actions={
        <>
          {/* Content-level actions only. Reporting and channel operations
              belong to campaigns — a standalone Polst links out instead. */}
          <Button variant="secondary" onClick={() => toast("Polst duplicated to drafts")}>
            Duplicate
          </Button>
          <Button onClick={() => toast("Editing is disabled while a Polst is live")}>
            Edit Polst
          </Button>
        </>
      }
    >
      <SectionGrid>
        <div className="space-y-4 lg:col-span-7">
          <DashboardCard title="Performance">
            <DetailList
              items={[
                ["Status", <StatusBadge key="s" status={polst.status} />],
                ["Responses", hasVotes ? formatNumber(polst.responses) : "—"],
                ["Vote split", polst.split],
                ["Completion", polst.completion],
                ["Median time to vote", hasVotes ? "4.6s" : "—"],
                ["Share rate", hasVotes ? "7.4%" : "—"],
                ["Top source", polst.topSource],
                ["Schedule", polst.dates],
                ["Event", polst.event],
              ]}
            />
          </DashboardCard>
          <DashboardCard title="Where it runs">
            <p className="text-sm leading-6 text-text-secondary">
              This Polst runs standalone — it isn't part of a campaign, so it
              carries its own schedule and sources. Campaign-grade attribution,
              reporting, and recommendations live with campaigns; a standalone
              Polst can export a simple results summary from Analytics ›
              Reports.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link to="/campaigns">Add to a campaign</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/distribution">Manage its sources</Link>
              </Button>
            </div>
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

        {/* The exact consumer card, contained as a preview — what voters see,
            clearly framed as a preview rather than a voting surface. */}
        <DashboardCard
          title="Voter preview"
          description="Exactly what your audience sees. Votes here are preview-only."
          padded={false}
          className="self-start lg:col-span-5"
          bodyClassName="p-4 pt-2"
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

/* ── Create a Polst ──────────────────────────────────────────────── */

const POLST_STEPS = ["Content", "Schedule & sources", "Review"] as const;
type PolstStep = (typeof POLST_STEPS)[number];

export function CreatePolstPage() {
  const [step, setStep] = useState<PolstStep>("Content");
  const [composer, setComposer] = useState<ComposerState>({
    question: "",
    optionsSet: false,
    imagesSet: false,
  });
  const stepIndex = POLST_STEPS.indexOf(step);
  const nextStep = POLST_STEPS[stepIndex + 1];
  const checks: [string, boolean][] = [
    ["Question written", composer.question !== ""],
    ["Both options set", composer.optionsSet],
    ["Images added", composer.imagesSet],
    ["Scheduled", false],
  ];
  const blockers = checks.filter(([, done]) => !done);

  return (
    <DashboardPage
      actions={
        <>
          <SavedChip />
          <Button variant="secondary" asChild>
            <Link to="/polsts">Discard</Link>
          </Button>
        </>
      }
    >
      <FlowSteps steps={POLST_STEPS} active={step} onChange={setStep} />

      <SectionGrid>
        <div className="space-y-4 lg:col-span-8">
          {step === "Content" ? (
            <DashboardCard>
              <PollComposer
                categories={TOP_INTERESTS.map((t) => t.label)}
                onChange={setComposer}
              />
            </DashboardCard>
          ) : null}

          {step === "Schedule & sources" ? (
            <>
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
                      <SelectMenu
                        id={fieldId}
                        label="Linked event"
                        defaultValue="None"
                        options={EVENT_OPTIONS}
                      />
                    )}
                  </Field>
                </div>
              </DashboardCard>

              <DashboardCard
                title="Sources"
                description="Optional but recommended — attach a source so responses are attributed."
              >
                <div className="space-y-1">
                  {DISTRIBUTION_SOURCES.slice(0, 3).map((source) => (
                    <label
                      key={source.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-subtle"
                    >
                      <Checkbox label={`Select ${source.name}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-semibold text-text-primary">
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
            </>
          ) : null}

          {step === "Review" ? (
            <DashboardCard
              title="Review and publish"
              description="Publish stays disabled until the content checks pass. An unscheduled Polst publishes to drafts."
            >
              <ul className="space-y-3">
                {checks.map(([label, done]) => (
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
          ) : null}

          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <Button variant="secondary" onClick={() => setStep(POLST_STEPS[stepIndex - 1])}>
                Back
              </Button>
            ) : null}
            {nextStep ? (
              <Button onClick={() => setStep(nextStep)}>
                Continue to {nextStep.toLowerCase()}
                <Icon name="arrow_forward" size={18} />
              </Button>
            ) : (
              <Button disabled={blockers.some(([label]) => label !== "Scheduled")}>
                Publish Polst
              </Button>
            )}
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
