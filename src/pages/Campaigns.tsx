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
  DetailList,
  Funnel,
  PollResults,
  PageTabs,
  PollThumb,
  ProgressBar,
  SearchAndFilters,
  SectionGrid,
  SegmentedControl,
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
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "Readiness",
    cell: (row) => <span className="text-text-secondary">{row.readiness}</span>,
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
      wide
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
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <DashboardPage
      eyebrow={
        <Link to="/campaigns" className="hover:text-text-primary">
          Campaigns
        </Link>
      }
      title={campaign.name}
      description={campaign.decision}
      actions={
        <>
          <Button variant="secondary" onClick={() => setShareOpen(true)}>
            Share / Embed
          </Button>
          <Button onClick={() => setActive(campaign.responses > 0 ? "Insights" : "Distribution")}>
            {campaign.nextAction}
          </Button>
        </>
      }
      wide
    >
      <PageTabs tabs={DETAIL_TABS} active={active} onChange={setActive} />

      {active === "Overview" ? <CampaignOverview campaign={campaign} detail={detail} /> : null}
      {active === "Polsts" ? <CampaignPolsts detail={detail} /> : null}
      {active === "Distribution" ? <CampaignDistribution /> : null}
      {active === "Influencers" ? <CampaignInfluencers campaign={campaign} /> : null}
      {active === "Insights" ? <CampaignInsights campaign={campaign} detail={detail} /> : null}
      {active === "Report" ? <CampaignReport campaign={campaign} detail={detail} /> : null}
      {active === "Settings" ? <CampaignSettings campaign={campaign} /> : null}

      <ShareEmbedModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </DashboardPage>
  );
}

function CampaignOverview({
  campaign,
  detail,
}: {
  campaign: Campaign;
  detail: CampaignDetail;
}) {
  const hasSignal = campaign.responses > 0;
  const completionValue = Number(campaign.completion.replace("%", "")) || 0;
  const [funnelSource, setFunnelSource] = useState<FunnelSource>("All sources");
  const allSteps = funnelSteps(detail);
  const steps = allSteps.map((step, i) => ({
    ...step,
    count: funnelForSource(allSteps.map((s) => s.count), funnelSource)[i],
  }));
  return (
    <>
      <SectionGrid>
        <DashboardCard title="Decision summary" className="lg:col-span-7">
          <div className="space-y-4">
            <StatusBadge status={campaign.status} />
            <h3 className="font-display text-xl font-bold text-text-primary">
              {hasSignal ? `Recommended: ${campaign.winner}` : "No signal yet"}
            </h3>
            <p className="text-sm leading-6 text-text-secondary">{detail.summary}</p>
            {hasSignal ? (
              <ProgressBar
                value={completionValue}
                label="Completion rate"
                caption={campaign.completion}
              />
            ) : null}
          </div>
        </DashboardCard>

        <DashboardCard title="Campaign health" className="lg:col-span-5">
          <DetailList
            items={[
              ["Status", <StatusBadge key="s" status={campaign.status} />],
              ["Dates", campaign.dates],
              ["Event", campaign.event],
              ["Polsts", String(campaign.polsts)],
              ["Responses", formatNumber(campaign.responses)],
              ["Top source", campaign.topSource],
            ]}
          />
        </DashboardCard>
      </SectionGrid>

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
            <Funnel steps={steps} />
          ) : (
            <p className="py-6 text-center text-sm text-text-tertiary">
              The journey appears once the campaign starts collecting responses.
            </p>
          )}
        </DashboardCard>
        <div className="space-y-4 lg:col-span-5">
          <DashboardCard title="Next action">
            <p className="text-sm leading-6 text-text-secondary">{detail.nextStep}</p>
            <Button className="mt-4" size="sm">
              {campaign.nextAction}
            </Button>
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
      <div className="grid gap-4 lg:grid-cols-2">
        {detail.chain.map((polst, index) => (
          <ChainPolstCard key={polst.id} polst={polst} index={index} />
        ))}
      </div>
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
  return (
    <>
      <DashboardCard
        title="Campaign sources"
        padded={false}
        action={
          <Button variant="secondary" size="sm" asChild>
            <Link to="/distribution">Assign sources</Link>
          </Button>
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
              ["Confidence", campaign.readiness],
              ["Responses", formatNumber(campaign.responses)],
              ["Completion", campaign.completion],
            ]}
          />
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
                ["Responses", formatNumber(campaign.responses)],
                ["Completion", campaign.completion],
                ["Winning direction", campaign.winner],
                ["Confidence", campaign.readiness],
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
            report. Deleting is permanent. Both are mock actions here.
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
      label="Share and embed"
      title="Share / Embed"
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

/* ── Create campaign (guided setup + right rail) ─────────────────── */

/** One numbered step card in the create flow. */
function StepCard({
  step,
  title,
  body,
  children,
}: {
  step: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardCard>
      <div className="flex gap-4">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-accent-soft font-display text-xs font-bold text-accent-default">
          {step}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-text-primary">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{body}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </DashboardCard>
  );
}

export function CreateCampaignPage() {
  const toast = useToast();
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
          <Button variant="secondary" asChild>
            <Link to="/campaigns">Discard</Link>
          </Button>
          <Button onClick={() => toast("Draft saved")}>Save draft</Button>
        </>
      }
      wide
    >
      <SectionGrid>
        <div className="space-y-4 lg:col-span-8">
          <StepCard
            step="1"
            title="Decision"
            body="Name the campaign and define the decision this test should settle."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Campaign name">
                {(fieldId) => (
                  <TextInput id={fieldId} placeholder="Game Day Creative Test" />
                )}
              </Field>
              <Field label="Linked event" helper={<span className="text-xs text-text-tertiary">Optional — puts the campaign on your calendar.</span>}>
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
              <Field label="Start date">
                {(fieldId) => <TextInput id={fieldId} type="date" icon="calendar_today" />}
              </Field>
              <Field label="End date">
                {(fieldId) => <TextInput id={fieldId} type="date" icon="event" />}
              </Field>
            </div>
          </StepCard>

          <StepCard
            step="2"
            title="Build"
            body="Add one or more Polsts. Voters see them in the order you set."
          >
            <div className="space-y-4">
              <PollComposer categories={TOP_INTERESTS.map((t) => t.label)} />
              <Button variant="secondary" size="sm">
                <Icon name="add" size={18} />
                Add another Polst
              </Button>
            </div>
          </StepCard>

          <StepCard
            step="3"
            title="Distribution"
            body="Attach at least one source so every response is attributed from day one."
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
              <div className="pt-2">
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/distribution">Create a new source</Link>
                </Button>
              </div>
            </div>
          </StepCard>

          <StepCard
            step="4"
            title="Review"
            body="Confirm launch readiness. Launch stays disabled until every check passes."
          >
            <ul className="space-y-3">
              {(
                [
                  ["Decision question written", true],
                  ["At least one Polst added", true],
                  ["Distribution selected", true],
                  ["Run dates set", false],
                ] as const
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
            <Button className="mt-4" disabled>
              Launch campaign
            </Button>
          </StepCard>
        </div>

        <div className="space-y-4 self-start lg:sticky lg:top-5 lg:col-span-4">
          <DashboardCard title="Status">
            <DetailList
              items={[
                ["State", <StatusBadge key="s" status="Draft" />],
                ["Start date", "Not set"],
                ["End date", "Not set"],
                ["Event", "Optional"],
              ]}
            />
          </DashboardCard>
          <DashboardCard title="Shareable assets">
            <DetailList
              items={[
                ["Share link", "Created at launch"],
                ["QR codes", "0"],
                ["Embed", "Not created"],
                ["Assigned sources", "1"],
              ]}
            />
          </DashboardCard>
          <DashboardCard title="What happens next">
            <p className="text-sm leading-6 text-text-secondary">
              You'll land on the campaign page where you can reorder Polsts,
              attach more sources, and publish when you're ready.
            </p>
          </DashboardCard>
        </div>
      </SectionGrid>
    </DashboardPage>
  );
}
