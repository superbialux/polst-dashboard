import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Menu, MenuItem } from "@/components/Menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Field, TextInput, Select } from "@/components/Field";
import { PollComposer } from "@/components/PollComposer";
import {
  DashboardCard,
  DashboardPage,
  DataTable,
  DecisionBrief,
  DetailList,
  FlowSteps,
  Funnel,
  PollResults,
  PageTabs,
  PollThumb,
  SavedChip,
  SearchAndFilters,
  SectionGrid,
  SegmentedControl,
  SignalBadge,
  SnippetCard,
  StatTile,
  StatusBadge,
  filterByStatus,
  useTabs,
  type DataColumn,
  type FunnelStep,
} from "@/components/dashboard";
import {
  CAMPAIGNS,
  CAMPAIGN_DETAILS,
  CREATORS,
  DISTRIBUTION_SOURCES,
  EMBED_IFRAME,
  EMBED_SCRIPT,
  FUNNEL_SOURCES,
  KEY_DATES,
  SINGLE_POLSTS,
  STATUS_FILTERS,
  TOP_INTERESTS,
  WORKSPACE,
  formatNumber,
  funnelForSource,
  polstOptions,
  type Campaign,
  type CampaignDetail,
  type ChainPolst,
  type FunnelSource,
} from "@/lib/workspace";
import { creatorColumns, sourceColumns } from "./Distribution";

/* ── Campaigns list ──────────────────────────────────────────────── */

const columns: Array<DataColumn<Campaign>> = [
  {
    header: "Campaign",
    cell: (row) => (
      <div className="min-w-0">
        <Link
          to={`/campaigns/${row.id}`}
          className="font-display font-semibold text-text-primary hover:text-text-accent"
        >
          {row.name}
        </Link>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{row.decision}</p>
      </div>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    header: "Event",
    cell: (row) => <span className="text-text-secondary">{row.event}</span>,
  },
  { header: "Polsts", align: "right", cell: (row) => row.polsts },
  {
    header: "Responses",
    align: "right",
    cell: (row) => (
      <span className="tabular-nums">
        {row.responses > 0
          ? `${formatNumber(row.responses)} / ${formatNumber(row.target)}`
          : "—"}
      </span>
    ),
  },
  {
    header: "Signal",
    cell: (row) => (
      <SignalBadge
        signal={row.signal}
        detail={row.winner !== "—" ? row.winner : undefined}
      />
    ),
  },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <Button variant="secondary" size="sm" asChild>
        <Link to={`/campaigns/${row.id}`}>{row.nextAction}</Link>
      </Button>
    ),
  },
];

export function CampaignsPage() {
  const [active, setActive] = useState("All");
  const rows = useMemo(() => filterByStatus(CAMPAIGNS, active), [active]);

  return (
    <DashboardPage
      title="Campaigns"
      actions={
        <Button asChild>
          <Link to="/campaigns/new">Create campaign</Link>
        </Button>
      }
    >
      <DashboardCard padded={false}>
        <SearchAndFilters
          tabs={STATUS_FILTERS}
          active={active}
          onChange={setActive}
          placeholder="Search campaigns"
        />
        <DataTable
          rows={rows}
          columns={columns}
          emptyLabel="No campaigns match this filter"
        />
      </DashboardCard>
    </DashboardPage>
  );
}

/* ── Campaign detail ─────────────────────────────────────────────── */

const DETAIL_TABS = [
  "Overview",
  "Polsts",
  "Distribution",
  "Influencers",
  "Insights",
  "Report",
  "Settings",
] as const;

/** Builds the journey funnel: Started → each question → Completed. */
function funnelSteps(detail: CampaignDetail): FunnelStep[] {
  return [
    { label: "Started", count: detail.journey.started },
    ...detail.chain.map((polst, i) => ({
      label: `Q${i + 1}: ${polst.question}`,
      count: polst.responses,
    })),
    { label: "Completed", count: detail.journey.completed },
  ];
}

export function CampaignDetailPage() {
  const { id } = useParams();
  const campaign = CAMPAIGNS.find((c) => c.id === id) ?? CAMPAIGNS[0];
  const detail = CAMPAIGN_DETAILS[campaign.id];
  const { active, setActive } = useTabs(DETAIL_TABS);

  return (
    <DashboardPage
      eyebrow={
        <Link to="/campaigns" className="hover:text-text-primary">
          Campaigns
        </Link>
      }
      title={campaign.name}
      description={campaign.decision}
      updated="2 min ago"
      actions={
        <Button onClick={() => setActive(campaign.responses > 0 ? "Insights" : "Distribution")}>
          {campaign.nextAction}
        </Button>
      }
    >
      <PageTabs tabs={DETAIL_TABS} active={active} onChange={setActive} />

      {active === "Overview" ? (
        <CampaignOverview campaign={campaign} detail={detail} onGoTo={setActive} />
      ) : null}
      {active === "Polsts" ? <CampaignPolsts detail={detail} /> : null}
      {active === "Distribution" ? <CampaignDistribution /> : null}
      {active === "Influencers" ? <CampaignInfluencers campaign={campaign} /> : null}
      {active === "Insights" ? <CampaignInsights campaign={campaign} detail={detail} /> : null}
      {active === "Report" ? <CampaignReport campaign={campaign} detail={detail} /> : null}
      {active === "Settings" ? <CampaignSettings campaign={campaign} /> : null}
    </DashboardPage>
  );
}

function CampaignOverview({
  campaign,
  detail,
  onGoTo,
}: {
  campaign: Campaign;
  detail: CampaignDetail;
  onGoTo: (tab: (typeof DETAIL_TABS)[number]) => void;
}) {
  const hasSignal = campaign.responses > 0;
  const [funnelSource, setFunnelSource] = useState<FunnelSource>("All sources");
  const allSteps = funnelSteps(detail);
  const steps = allSteps.map((step, i) => ({
    ...step,
    count: funnelForSource(allSteps.map((s) => s.count), funnelSource)[i],
  }));
  // The remedy line under the funnel names the worst step and where to look.
  let dropIndex = -1;
  let dropLoss = 0;
  steps.forEach((step, i) => {
    if (i === 0) return;
    const loss = steps[i - 1].count - step.count;
    if (loss > dropLoss) {
      dropLoss = loss;
      dropIndex = i;
    }
  });
  const dropStep = dropIndex > 0 ? steps[dropIndex] : null;
  const headline = !hasSignal
    ? "No signal yet — nothing is collecting responses"
    : campaign.signal === "Too close"
      ? `Too close to call — ${campaign.winner}`
      : `Recommended: ${campaign.winner}`;
  return (
    <>
      <DecisionBrief
        signal={campaign.signal}
        signalDetail={
          campaign.confidence !== "—"
            ? `${campaign.confidence} confidence`
            : hasSignal
              ? `${formatNumber(campaign.responses)} responses`
              : undefined
        }
        headline={headline}
        summary={detail.summary}
        caveat={detail.caveats[0]}
        evidence={
          hasSignal
            ? [
                {
                  label: "Confidence",
                  value: campaign.confidence,
                  info: `Scored from sample size vs target, source diversity, and lead stability. Here: ${campaign.sampleNote}`,
                },
                {
                  label: "Responses vs target",
                  value: `${formatNumber(campaign.responses)} of ${formatNumber(campaign.target)}`,
                  info: "Completed votes on this campaign's Polsts, against the response target set at launch.",
                },
                {
                  label: "Completion",
                  value: campaign.completion,
                  info: "Voters who finished every question ÷ voters who started the sequence.",
                },
                { label: "Top source", value: campaign.topSource },
                { label: "Runs", value: campaign.dates },
              ]
            : [
                { label: "Launches", value: campaign.dates },
                { label: "Polsts ready", value: String(campaign.polsts) },
                { label: "Sources assigned", value: "0" },
              ]
        }
        updated="2 min ago"
        primary={{
          label: campaign.nextAction,
          onClick: () => onGoTo(hasSignal ? "Insights" : "Distribution"),
        }}
        secondary={
          hasSignal
            ? { label: "See the evidence", onClick: () => onGoTo("Insights") }
            : undefined
        }
      />

      <SectionGrid>
        <DashboardCard
          title="Voter journey"
          className="lg:col-span-7"
          action={
            hasSignal ? (
              <SegmentedControl
                tabs={FUNNEL_SOURCES}
                active={funnelSource}
                onChange={setFunnelSource}
              />
            ) : null
          }
        >
          {hasSignal ? (
            <>
              <Funnel steps={steps} />
              {dropStep ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-3">
                  <p className="min-w-0 text-sm leading-5 text-text-secondary">
                    Most voters leave at “{dropStep.label}” — switch the source
                    filter above; if one source drives the drop, fix the source,
                    not the question.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => onGoTo("Distribution")}>
                    Compare sources
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="py-6 text-center text-sm text-text-tertiary">
              The journey appears once the campaign starts collecting responses.
            </p>
          )}
        </DashboardCard>
        <div className="space-y-4 lg:col-span-5">
          <DashboardCard title="Campaign health">
            <DetailList
              items={[
                ["Status", <StatusBadge key="s" status={campaign.status} />],
                ["Dates", campaign.dates],
                ["Event", campaign.event],
                ["Polsts", String(campaign.polsts)],
                ["Top source", campaign.topSource],
              ]}
            />
          </DashboardCard>
          <DashboardCard title="Source snapshot" padded={false}>
            <DataTable
              rows={DISTRIBUTION_SOURCES.slice(0, 3)}
              columns={[sourceColumns[0], ...sourceColumns.slice(3, 5)]}
            />
          </DashboardCard>
        </div>
      </SectionGrid>
    </>
  );
}

/* ── Influencers tab ─────────────────────────────────────────────── */

/** Per-creator tracked-link performance, scoped to this campaign. The
 *  columns come from Distribution's creator table minus the campaign
 *  column — same object, same anatomy, narrower scope. */
function CampaignInfluencers({ campaign }: { campaign: Campaign }) {
  const creators = CREATORS.filter((c) => c.campaign === campaign.name);
  const scopedColumns = creatorColumns.filter((col) => col.header !== "Campaign");
  const totalClicks = creators.reduce((sum, c) => sum + c.clicks, 0);
  const totalResponses = creators.reduce((sum, c) => sum + c.responses, 0);
  return (
    <>
      <SectionGrid>
        <StatTile
          className="lg:col-span-4"
          label="Creators"
          value={String(creators.length)}
        />
        <StatTile
          className="lg:col-span-4"
          label="Link clicks"
          value={totalClicks > 0 ? formatNumber(totalClicks) : "—"}
        />
        <StatTile
          className="lg:col-span-4"
          label="Responses from creators"
          value={totalResponses > 0 ? formatNumber(totalResponses) : "—"}
        />
      </SectionGrid>
      <DashboardCard
        title="Creators on this campaign"
        padded={false}
        action={<Button variant="secondary" size="sm">Add creator link</Button>}
      >
        <DataTable
          rows={creators}
          columns={scopedColumns}
          emptyLabel="No creators yet — add a tracked link to start attributing"
        />
      </DashboardCard>
    </>
  );
}

/* ── Polsts tab ──────────────────────────────────────────────────── */

function ChainPolstCard({ polst, index }: { polst: ChainPolst; index: number }) {
  const hasVotes = polst.responses > 0;
  return (
    <DashboardCard>
      <div className="flex items-start gap-3">
        <span
          className="-m-1.5 grid h-9 w-9 shrink-0 cursor-grab place-items-center rounded-md text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
          title="Drag to reorder"
          aria-hidden
        >
          <Icon name="drag_indicator" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-secondary">
                Question {index + 1}
              </p>
              <h3 className="mt-1 font-display text-base font-bold leading-6 text-text-primary">
                {polst.question}
              </h3>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-text-secondary">
              {hasVotes ? `${formatNumber(polst.responses)} votes` : "No votes yet"}
            </span>
          </div>
          <PollResults className="mt-4" options={polstOptions(polst)} dense />
        </div>
      </div>
    </DashboardCard>
  );
}

function CampaignPolsts({ detail }: { detail: CampaignDetail }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Voters answer these in order. Drag to rearrange.
        </p>
        <Menu
          label="Add polst"
          trigger={({ toggle }) => (
            <Button variant="secondary" size="sm" onClick={toggle}>
              <Icon name="add" size={18} />
              Add polst
            </Button>
          )}
        >
          <MenuItem icon="edit_square" label="Create new Polst" />
          <MenuItem
            icon="library_add"
            label="Select from your library"
            onClick={() => setLibraryOpen(true)}
          />
        </Menu>
      </div>
      <SectionGrid>
        {detail.chain.map((polst, index) => (
          <div key={polst.id} className="lg:col-span-6">
            <ChainPolstCard polst={polst} index={index} />
          </div>
        ))}
      </SectionGrid>
      <SelectFromLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </>
  );
}

function SelectFromLibraryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Select existing Polsts"
      title="Select existing Polsts"
      className="lg:max-w-2xl"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Add selected</Button>
        </div>
      }
    >
      <div className="scroll-subtle max-h-96 overflow-y-auto p-2">
        {SINGLE_POLSTS.map((polst) => (
          <label
            key={polst.id}
            className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-subtle"
          >
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded-sm border-border-strong accent-accent-default"
            />
            <PollThumb options={polstOptions(polst)} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-text-primary">
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
    </Modal>
  );
}

/* ── Distribution tab ────────────────────────────────────────────── */

function CampaignDistribution() {
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <>
      <DashboardCard
        title="Campaign sources"
        padded={false}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
              Link &amp; embed code
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link to="/distribution">Assign sources</Link>
            </Button>
          </div>
        }
      >
        <DataTable rows={DISTRIBUTION_SOURCES.slice(0, 4)} columns={sourceColumns} />
      </DashboardCard>
      <SectionGrid>
        <div className="lg:col-span-6">
          <SnippetCard
            title="iframe embed"
            description="Drops into any page. The widget adapts to the container width."
            code={EMBED_IFRAME}
          />
        </div>
        <div className="lg:col-span-6">
          <SnippetCard
            title="JavaScript embed"
            description="For sites that restrict iframes through their content security policy."
            code={EMBED_SCRIPT}
          />
        </div>
      </SectionGrid>
      <ShareEmbedModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}

/* ── Insights tab ────────────────────────────────────────────────── */

function CampaignInsights({
  campaign,
  detail,
}: {
  campaign: Campaign;
  detail: CampaignDetail;
}) {
  const hasSignal = campaign.responses > 0;
  return (
    <>
      <SectionGrid>
        <DashboardCard title="Recommended decision" className="lg:col-span-7">
          <div className="space-y-4 text-sm leading-6 text-text-secondary">
            <h3 className="font-display text-lg font-bold text-text-primary">
              {hasSignal ? campaign.winner : "No recommendation yet"}
            </h3>
            <p>{detail.summary}</p>
            <p>
              <span className="font-semibold text-text-primary">Next action:</span>{" "}
              {detail.nextStep}
            </p>
          </div>
        </DashboardCard>
        <DashboardCard title="Readiness" className="lg:col-span-5">
          <DetailList
            items={[
              ["Winning direction", campaign.winner],
              ["Signal", <SignalBadge key="sig" signal={campaign.signal} />],
              ["Confidence", campaign.confidence],
              [
                "Responses vs target",
                `${formatNumber(campaign.responses)} of ${formatNumber(campaign.target)}`,
              ],
              ["Completion", campaign.completion],
            ]}
          />
          {campaign.sampleNote ? (
            <p className="mt-3 text-sm leading-5 text-text-secondary">
              <span className="font-semibold text-text-primary">Sample quality:</span>{" "}
              {campaign.sampleNote}
            </p>
          ) : null}
          <Button className="mt-4 w-full" disabled={!hasSignal}>
            Lock this decision
          </Button>
        </DashboardCard>
      </SectionGrid>

      <SectionGrid>
        <DashboardCard title="Key findings" className="lg:col-span-7">
          {detail.findings.length ? (
            <ul className="space-y-3">
              {detail.findings.map((finding) => (
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
          ) : (
            <p className="py-4 text-center text-sm text-text-tertiary">
              Findings appear once the campaign collects responses.
            </p>
          )}
        </DashboardCard>
        <DashboardCard title="Caveats" className="lg:col-span-5">
          <ul className="space-y-3">
            {detail.caveats.map((caveat) => (
              <li key={caveat} className="flex items-start gap-2.5 text-sm leading-6">
                <Icon
                  name="error"
                  size={20}
                  filled
                  className="mt-0.5 shrink-0 text-status-danger"
                />
                <span className="text-text-secondary">{caveat}</span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </SectionGrid>
    </>
  );
}

/* ── Report tab ──────────────────────────────────────────────────── */

function CampaignReport({
  campaign,
  detail,
}: {
  campaign: Campaign;
  detail: CampaignDetail;
}) {
  const toast = useToast();
  const hasSignal = campaign.responses > 0;
  return (
    <DashboardCard
      title="Report preview"
      action={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast("Report exported as CSV")}
          >
            Export CSV
          </Button>
          <Button size="sm" onClick={() => toast("Report exported as PDF")}>
            Export PDF
          </Button>
        </div>
      }
    >
      <article className="mx-auto max-w-2xl space-y-6 py-2">
        <header className="space-y-2 border-b border-border-default pb-5">
          <p className="text-xs font-medium text-text-secondary">
            {WORKSPACE.brand} · Decision report
          </p>
          <h3 className="font-display text-2xl font-bold text-text-primary">
            {campaign.name}
          </h3>
          <p className="text-sm text-text-secondary">
            {campaign.decision} · {campaign.dates}
          </p>
        </header>

        <section>
          <h4 className="font-display text-sm font-semibold text-text-secondary">
            Executive summary
          </h4>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {hasSignal
              ? detail.summary
              : "This campaign has not collected enough signal to summarize."}
          </p>
        </section>

        <section>
          <h4 className="font-display text-sm font-semibold text-text-secondary">
            Response summary
          </h4>
          <div className="mt-2">
            <DetailList
              items={[
                [
                  "Responses vs target",
                  `${formatNumber(campaign.responses)} of ${formatNumber(campaign.target)}`,
                ],
                ["Completion", campaign.completion],
                ["Winning direction", campaign.winner],
                ["Signal", campaign.signal],
                ["Confidence", campaign.confidence],
                ["Top source", campaign.topSource],
              ]}
            />
          </div>
        </section>

        {detail.findings.length ? (
          <section>
            <h4 className="font-display text-sm font-semibold text-text-secondary">
              Key findings
            </h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-secondary">
              {detail.findings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {detail.caveats.length ? (
          <section>
            <h4 className="font-display text-sm font-semibold text-text-secondary">
              Caveats
            </h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-secondary">
              {detail.caveats.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h4 className="font-display text-sm font-semibold text-text-secondary">
            Recommended action
          </h4>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{detail.nextStep}</p>
        </section>
      </article>
    </DashboardCard>
  );
}

/* ── Settings tab ────────────────────────────────────────────────── */

function CampaignSettings({ campaign }: { campaign: Campaign }) {
  const toast = useToast();
  return (
    <SectionGrid>
      <div className="space-y-4 lg:col-span-7">
        <DashboardCard title="Configuration">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campaign name">
              {(fieldId) => (
                <TextInput id={fieldId} defaultValue={campaign.name} />
              )}
            </Field>
            <Field label="Linked event">
              {(fieldId) => (
                <Select id={fieldId} defaultValue={campaign.event}>
                  <option>None</option>
                  {KEY_DATES.map((date) => (
                    <option key={date.id}>{date.title}</option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Decision question">
                {(fieldId) => (
                  <TextInput id={fieldId} defaultValue={campaign.decision} />
                )}
              </Field>
            </div>
            <Field label="Owner">
              {(fieldId) => (
                <TextInput id={fieldId} defaultValue={WORKSPACE.owner} readOnly />
              )}
            </Field>
            <Field label="Run dates">
              {(fieldId) => (
                <TextInput id={fieldId} defaultValue={campaign.dates} />
              )}
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <Button size="sm" onClick={() => toast("Campaign settings saved")}>
              Save changes
            </Button>
          </div>
        </DashboardCard>
      </div>

      <div className="space-y-4 lg:col-span-5">
        <DashboardCard title="Lifecycle">
          <p className="text-sm leading-6 text-text-secondary">
            Unpublishing hides the campaign from voters — votes already cast are
            kept, and you can publish again any time. Ending is final: voters
            can no longer submit, but your analytics stay.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => toast("Campaign unpublished")}>
              Unpublish
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-status-danger"
              onClick={() => toast("Campaign ended")}
            >
              End campaign
            </Button>
          </div>
        </DashboardCard>
        <DashboardCard title="Danger zone">
          <p className="text-sm leading-6 text-text-secondary">
            Archiving hides this campaign from active views but keeps its
            report. Deleting is permanent and removes its responses.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => toast("Campaign archived")}>
              Archive campaign
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-status-danger"
              onClick={() => toast("Campaign deleted")}
            >
              Delete campaign
            </Button>
          </div>
        </DashboardCard>
      </div>
    </SectionGrid>
  );
}

/* ── Share / Embed modal ─────────────────────────────────────────── */

function ShareEmbedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Link and embed code"
      title="Link &amp; embed code"
      className="lg:max-w-2xl"
    >
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2 rounded-md border border-border-default bg-surface-subtle p-2 pl-3">
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">
            https://polst.app/campaign/CAMPAIGN_ID
          </p>
          <Button variant="secondary" size="sm" onClick={() => toast("Share link copied")}>
            <Icon name="content_copy" size={16} />
            Copy link
          </Button>
        </div>
        <SnippetCard
          title="iframe embed"
          description="Drops into any page. The widget adapts to the container width (minimum 320px)."
          code={EMBED_IFRAME}
        />
        <SnippetCard
          title="JavaScript embed"
          description="For sites that restrict iframes through their content security policy."
          code={EMBED_SCRIPT}
        />
      </div>
    </Modal>
  );
}

/* ── Create campaign (staged flow) ───────────────────────────────── */

const CREATE_STEPS = ["Decision", "Polsts", "Channels", "Review"] as const;
type CreateStep = (typeof CREATE_STEPS)[number];

/** Launch checks shared by the Review step and the completeness rail. */
const LAUNCH_CHECKS = [
  ["Decision question written", true],
  ["At least one Polst added", true],
  ["A channel source selected", true],
  ["Run dates set", false],
] as const;

export function CreateCampaignPage() {
  const toast = useToast();
  const [step, setStep] = useState<CreateStep>("Decision");
  const stepIndex = CREATE_STEPS.indexOf(step);
  const nextStep = CREATE_STEPS[stepIndex + 1];
  const blockers = LAUNCH_CHECKS.filter(([, done]) => !done);

  return (
    <DashboardPage
      eyebrow={
        <span>
          <Link to="/campaigns" className="hover:text-text-primary">
            Campaigns
          </Link>{" "}
          / Create campaign
        </span>
      }
      title="Create campaign"
      actions={
        <>
          <SavedChip />
          <Button variant="secondary" asChild>
            <Link to="/campaigns">Discard</Link>
          </Button>
        </>
      }
    >
      <FlowSteps steps={CREATE_STEPS} active={step} onChange={setStep} />

      <SectionGrid>
        <div className="space-y-4 lg:col-span-8">
          {step === "Decision" ? (
            <DashboardCard
              title="Decision"
              description="Name the campaign and define the decision this test should settle. Dates come at review."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Campaign name">
                  {(fieldId) => (
                    <TextInput id={fieldId} placeholder="Game Day Creative Test" />
                  )}
                </Field>
                <Field
                  label="Linked event"
                  helper={
                    <span className="text-xs text-text-tertiary">
                      Optional — puts the campaign on your calendar.
                    </span>
                  }
                >
                  {(fieldId) => (
                    <Select id={fieldId} defaultValue="None">
                      <option>None</option>
                      {KEY_DATES.map((date) => (
                        <option key={date.id}>{date.title}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Decision question">
                    {(fieldId) => (
                      <TextInput
                        id={fieldId}
                        placeholder="Which creative should we run for the World Cup?"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </DashboardCard>
          ) : null}

          {step === "Polsts" ? (
            <DashboardCard
              title="Polsts"
              description="Add one or more Polsts. Voters see them in the order you set."
            >
              <div className="space-y-4">
                <PollComposer categories={TOP_INTERESTS.map((t) => t.label)} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    <Icon name="add" size={18} />
                    Add another Polst
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Icon name="library_add" size={18} />
                    Add from your library
                  </Button>
                </div>
              </div>
            </DashboardCard>
          ) : null}

          {step === "Channels" ? (
            <DashboardCard
              title="Channels"
              description="Attach at least one tracked source so every response is attributed from day one."
            >
              <div className="space-y-1">
                {DISTRIBUTION_SOURCES.slice(0, 4).map((source) => (
                  <label
                    key={source.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-surface-subtle"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={source.id === "website-embed"}
                      className="h-4 w-4 shrink-0 rounded-sm border-border-strong accent-accent-default"
                    />
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
                <div className="pt-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/distribution">Create a new source</Link>
                  </Button>
                </div>
              </div>
            </DashboardCard>
          ) : null}

          {step === "Review" ? (
            <DashboardCard
              title="Review and launch"
              description="Set the run dates, confirm the checks, and launch. Launch stays disabled until every check passes."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date">
                  {(fieldId) => <TextInput id={fieldId} type="date" icon="calendar_today" />}
                </Field>
                <Field label="End date">
                  {(fieldId) => <TextInput id={fieldId} type="date" icon="event" />}
                </Field>
              </div>
              <ul className="mt-5 space-y-3 border-t border-border-default pt-4">
                {LAUNCH_CHECKS.map(([label, done]) => (
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

          {/* One dominant next action per step */}
          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <Button variant="secondary" onClick={() => setStep(CREATE_STEPS[stepIndex - 1])}>
                Back
              </Button>
            ) : null}
            {nextStep ? (
              <Button onClick={() => setStep(nextStep)}>
                Continue to {nextStep}
                <Icon name="arrow_forward" size={18} />
              </Button>
            ) : (
              <Button
                disabled={blockers.length > 0}
                title={blockers.length ? `Blocked: ${blockers.map(([l]) => l).join(", ")}` : undefined}
              >
                Launch campaign
              </Button>
            )}
            {!nextStep && blockers.length ? (
              <span className="text-sm text-text-secondary">
                {blockers.map(([label]) => label).join(" · ")}
              </span>
            ) : null}
          </div>
        </div>

        {/* The rail shows only what still blocks launch — no dead inventory. */}
        <div className="space-y-4 self-start lg:sticky lg:top-16 lg:col-span-4">
          <DashboardCard title="Completeness">
            <ul className="space-y-3">
              {LAUNCH_CHECKS.map(([label, done]) => (
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
            {blockers.length ? (
              <p className="mt-4 border-t border-border-default pt-3 text-sm leading-5 text-text-secondary">
                {blockers.length === 1
                  ? "One step left before this campaign can launch."
                  : `${blockers.length} steps left before this campaign can launch.`}
              </p>
            ) : null}
          </DashboardCard>
        </div>
      </SectionGrid>
    </DashboardPage>
  );
}
