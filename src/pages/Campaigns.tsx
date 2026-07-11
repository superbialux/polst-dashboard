import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Menu, MenuItem } from "@/components/Menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Checkbox, Field, SelectMenu, TextInput } from "@/components/Field";
import { PollComposer } from "@/components/PollComposer";
import { QrCodeModal } from "@/components/DistributionActions";
import {
  DashboardCard,
  DashboardPage,
  DataTable,
  DateRangeMenu,
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
  type DateRangeValue,
} from "@/components/dashboard";
import {
  CAMPAIGNS,
  CAMPAIGN_DETAILS,
  CAMPAIGN_SHARE_URL,
  CREATORS,
  DISTRIBUTION_SOURCES,
  EMBED_IFRAME,
  EMBED_SCRIPT,
  FUNNEL_SOURCES,
  KEY_DATES,
  SINGLE_POLSTS,
  TOP_INTERESTS,
  WORKSPACE,
  formatNumber,
  funnelForSource,
  polstOptions,
  winnerLabel,
  type Campaign,
  type CampaignDetail,
  type ChainPolst,
  type FunnelSource,
} from "@/lib/workspace";
import { creatorColumns, sourceColumns } from "./Distribution";

const EVENT_OPTIONS = [
  { value: "None", label: "None" },
  ...KEY_DATES.map((date) => ({ value: date.title, label: date.title })),
];
const CAMPAIGN_FILTERS = ["All", "Draft", "Active", "Ended"] as const;
const campaignStatus = (campaign: Campaign) => campaign.status;
const CAMPAIGN_CREATED: Record<string, string> = {
  "summer-launch-draft": "Jul 10",
  "packaging-direction": "Jun 3",
  "game-day-creative": "Jun 10",
  "flavor-launch-recap": "May 28",
  "summer-flavor-lineup": "Jun 1",
  "retail-shelf-layout": "Jun 12",
  "holiday-gifting-bundles": "Jun 8",
  "loyalty-program-naming": "Jun 30",
  "back-to-school-snacks": "Jul 8",
  "rebrand-concept-test": "Jun 4",
};
const campaignCreated = (campaign: Campaign) => CAMPAIGN_CREATED[campaign.id] ?? "Jun 1";

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
        <p className="mt-0.5 truncate text-xs text-text-secondary">Created {campaignCreated(row)}, 2026</p>
      </div>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={campaignStatus(row)} /> },
  { header: "Polsts", align: "right", cell: (row) => row.polsts },
  { header: "Started", align: "right", cell: (row) => row.pollsStarted },
  { header: "Completed", align: "right", cell: (row) => row.pollsCompleted },
  { header: "Completion", align: "right", cell: (row) => row.completion },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <Button variant="ghost" size="icon" title="Open campaign" asChild>
        <Link to={`/campaigns/${row.id}`}><Icon name="chevron_right" size={18} /></Link>
      </Button>
    ),
  },
];

export function CampaignsPage() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<DateRangeValue>("30D");
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const scoped = active === "Ended"
      ? CAMPAIGNS.filter((campaign) => campaign.status === "Ended")
      : filterByStatus(CAMPAIGNS, active);
    return scoped.filter((campaign) =>
      !normalized || [campaign.name, campaign.decision, campaign.event ?? "", campaign.vertical]
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [active, query]);

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
          action={<DateRangeMenu value={range} onChange={setRange} />}
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
  "Polsts",
  "Overview",
  "Details",
  "Analytics",
  "Lifecycle",
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
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <DashboardPage
      actions={
        <>
          <Button variant="secondary" onClick={() => setQrOpen(true)}>
            <Icon name="qr_code_2" size={18} />
            QR code
          </Button>
          <Button variant="secondary" onClick={() => setShareOpen(true)}>
            <Icon name="code" size={18} />
            Share / embed
          </Button>
          <Menu
            label="Add Polst"
            trigger={({ toggle }) => <Button onClick={toggle}><Icon name="add" size={18} />Add Polst<Icon name="arrow_drop_down" size={18} /></Button>}
          >
            <MenuItem icon="edit_square" label="Create new Polst" onClick={() => setActive("Polsts")} />
            <MenuItem icon="library_add" label="Select from your library" onClick={() => setActive("Polsts")} />
          </Menu>
        </>
      }
    >
      <PageTabs tabs={DETAIL_TABS} active={active} onChange={setActive} />

      {active === "Overview" ? (
        <CampaignOverview campaign={campaign} detail={detail} onGoTo={setActive} />
      ) : null}
      {active === "Polsts" ? <CampaignPolsts detail={detail} /> : null}
      {active === "Details" ? <CampaignDetails campaign={campaign} /> : null}
      {active === "Analytics" ? <CampaignAnalytics campaign={campaign} detail={detail} /> : null}
      {active === "Lifecycle" ? <CampaignLifecycle campaign={campaign} /> : null}
      <ShareEmbedModal open={shareOpen} onClose={() => setShareOpen(false)} />
      <QrCodeModal open={qrOpen} onClose={() => setQrOpen(false)} objectName={campaign.name} url={`https://polst.app/campaign/${campaign.id}?utm_source=qr`} />
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
  const hasSignal = (campaign.responses ?? 0) > 0;
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
      ? `Too close to call — ${winnerLabel(campaign)}`
      : `Recommended: ${winnerLabel(campaign)}`;
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
                  value: campaign.completion ?? "—",
                  info: "Voters who finished every question ÷ voters who started the sequence.",
                },
                { label: "Top source", value: campaign.topSource ?? "—" },
                { label: "Runs", value: campaign.dates ?? "—" },
              ]
            : [
                { label: "Launches", value: campaign.dates ?? "—" },
                { label: "Polsts ready", value: String(campaign.polsts) },
                { label: "Sources assigned", value: "0" },
              ]
        }
        primary={{
          label: campaign.nextAction ?? "Open",
          onClick: () => onGoTo(hasSignal ? "Analytics" : "Polsts"),
        }}
        secondary={
          hasSignal
            ? { label: "See the evidence", onClick: () => onGoTo("Analytics") }
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
                  <Button variant="secondary" size="sm" onClick={() => onGoTo("Analytics")}>
                    View analytics
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
        {detail.chain.length ? detail.chain.map((polst, index) => (
          <div key={polst.id} className="lg:col-span-6"><ChainPolstCard polst={polst} index={index} /></div>
        )) : (
          <DashboardCard className="lg:col-span-12">
            <div className="py-8 text-center">
              <p className="font-display text-sm font-semibold text-text-primary">No Polsts yet</p>
              <p className="mt-1 text-sm text-text-secondary">Use Add Polst to create one or select from the library.</p>
            </div>
          </DashboardCard>
        )}
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
            <Checkbox label={`Select ${polst.question}`} />
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
  const hasSignal = (campaign.responses ?? 0) > 0;
  return (
    <>
      <SectionGrid>
        <DashboardCard title="Recommended decision" className="lg:col-span-7">
          <div className="space-y-4 text-sm leading-6 text-text-secondary">
            <h3 className="font-display text-lg font-bold text-text-primary">
              {hasSignal ? winnerLabel(campaign) : "No recommendation yet"}
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
              ["Winning direction", winnerLabel(campaign)],
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
  const hasSignal = (campaign.responses ?? 0) > 0;
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
                ["Winning direction", winnerLabel(campaign)],
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
                <SelectMenu
                  id={fieldId}
                  label="Linked event"
                  defaultValue={campaign.event}
                  options={EVENT_OPTIONS}
                />
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

function CampaignDetails({ campaign }: { campaign: Campaign }) {
  const toast = useToast();
  const [endRule, setEndRule] = useState("10 days");
  return (
    <DashboardCard>
      <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <div>
          <p className="font-display text-sm font-semibold text-text-primary">Brand</p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">Fixed when the campaign is created.</p>
        </div>
        <TextInput defaultValue={WORKSPACE.brand} readOnly />
        <div><p className="font-display text-sm font-semibold text-text-primary">Name</p></div>
        <div className="flex gap-2">
          <TextInput defaultValue={campaign.name} />
          <Button variant="secondary" onClick={() => toast("Campaign name saved")}>Save</Button>
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-text-primary">End date</p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">Voters can submit until this date.</p>
        </div>
        <div>
          <SegmentedControl tabs={["3 days", "7 days", "10 days", "Custom", "No end"]} active={endRule} onChange={setEndRule} />
          {endRule === "Custom" ? <TextInput type="datetime-local" className="mt-3 max-w-sm" /> : null}
        </div>
      </div>
    </DashboardCard>
  );
}

function CampaignAnalytics({ campaign, detail }: { campaign: Campaign; detail: CampaignDetail }) {
  const [range, setRange] = useState<DateRangeValue>("30D");
  const steps = funnelSteps(detail);
  const columns: Array<DataColumn<ChainPolst>> = [
    { header: "Polst", cell: (row) => <span className="font-semibold text-text-primary">{row.question}</span> },
    { header: "Votes", align: "right", cell: (row) => formatNumber(row.responses) },
    { header: "Split", align: "right", cell: (row) => row.split },
  ];
  return (
    <>
      <div className="flex justify-end"><DateRangeMenu value={range} onChange={setRange} /></div>
      <SectionGrid>
        <StatTile className="lg:col-span-3" label="Started" value={formatNumber(detail.journey.started)} />
        <StatTile className="lg:col-span-3" label="Completed" value={formatNumber(detail.journey.completed)} />
        <StatTile className="lg:col-span-3" label="Completion" value={campaign.completion ?? "—"} />
        <StatTile className="lg:col-span-3" label="Average time" value={campaign.responses ? "14s" : "—"} />
      </SectionGrid>
      <DashboardCard title="Conversion funnel"><Funnel steps={steps} /></DashboardCard>
      <DashboardCard title="Per-Polst results" padded={false}>
        <DataTable rows={detail.chain} columns={columns} emptyLabel="No Polsts yet" />
      </DashboardCard>
    </>
  );
}

function CampaignLifecycle({ campaign }: { campaign: Campaign }) {
  const toast = useToast();
  const state = campaign.status === "Draft" ? "Draft" : campaign.status === "Ended" ? "Ended" : "Active";
  return (
    <>
      <DashboardCard>
        <div className="grid grid-cols-3 gap-4">
          {["Draft", "Active", "Ended"].map((item) => (
            <div key={item} className="text-center">
              <span className={cn(
                "mx-auto grid size-9 place-items-center rounded-pill border",
                state === item ? "border-border-accent bg-accent-soft text-accent-default" : "border-border-default text-text-tertiary",
              )}>
                <Icon name={item === "Draft" ? "draft" : item === "Active" ? "campaign" : "lock"} size={18} />
              </span>
              <p className="mt-2 font-display text-sm font-semibold text-text-primary">{item}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{item === "Draft" ? "Hidden from voters" : item === "Active" ? "Voters can submit" : "Read-only"}</p>
            </div>
          ))}
        </div>
      </DashboardCard>
      {state === "Draft" ? (
        <DashboardCard title="Ready to publish?" action={<Button disabled={campaign.polsts === 0} onClick={() => toast("Campaign published")}>Publish campaign</Button>}>
          <p className="text-sm text-text-secondary">Add at least one Polst before publishing.</p>
        </DashboardCard>
      ) : state === "Active" ? (
        <div className="space-y-4">
          <DashboardCard title="Take this campaign offline temporarily" action={<Button variant="secondary" onClick={() => toast("Campaign unpublished")}>Unpublish</Button>}>
            <p className="text-sm text-text-secondary">Votes already cast are kept. Publish again at any time.</p>
          </DashboardCard>
          <DashboardCard title="End this campaign" action={<Button className="bg-status-danger hover:bg-status-danger" onClick={() => toast("Campaign ended")}>End campaign</Button>}>
            <p className="text-sm text-text-secondary">Voting stops and the campaign becomes read-only.</p>
          </DashboardCard>
        </div>
      ) : null}
    </>
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
            {CAMPAIGN_SHARE_URL}
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

/* ── Create campaign ─────────────────────────────────────────────── */

export function CreateCampaignPage() {
  const [name, setName] = useState("");
  const [endRule, setEndRule] = useState("3 days");

  return (
    <DashboardPage
      actions={<Button variant="secondary" asChild><Link to="/campaigns">Cancel</Link></Button>}
    >
      <SectionGrid>
        <div className="space-y-4 lg:col-span-8">
          <DashboardCard title="Campaign details">
            <div className="space-y-5">
              <Field label="Campaign name">
                {(id) => <TextInput id={id} value={name} onChange={(event) => setName(event.target.value)} maxLength={255} placeholder="Summer launch" />}
              </Field>
              <div>
                <p className="mb-2 font-display text-sm font-semibold text-text-primary">How long should this run?</p>
                <SegmentedControl tabs={["3 days", "7 days", "10 days", "Custom date", "No end"]} active={endRule} onChange={setEndRule} />
              </div>
              {endRule === "Custom date" ? (
                <Field label="End date">{(id) => <TextInput id={id} type="datetime-local" />}</Field>
              ) : null}
            </div>
          </DashboardCard>
          <div className="flex justify-end">
            <Button disabled={!name.trim()} asChild={Boolean(name.trim())}>
              {name.trim() ? <Link to="/campaigns/summer-launch-draft">Create campaign</Link> : <span>Create campaign</span>}
            </Button>
          </div>
        </div>
        <div className="space-y-4 self-start lg:col-span-4">
          <DashboardCard title="After creation">
            <ul className="space-y-2 text-sm leading-5 text-text-secondary">
              <li>Add new or existing Polsts.</li>
              <li>Reorder the voting sequence.</li>
              <li>Publish when the campaign is ready.</li>
            </ul>
          </DashboardCard>
          <DashboardCard title="Recent drafts">
            <div className="space-y-3">
              {CAMPAIGNS.filter((campaign) => campaign.status === "Draft").slice(0, 3).map((campaign) => (
                <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="flex items-center justify-between gap-3 text-sm font-medium text-text-primary hover:text-text-accent">
                  <span className="truncate">{campaign.name}</span><span className="text-text-secondary">Open</span>
                </Link>
              ))}
            </div>
          </DashboardCard>
        </div>
      </SectionGrid>
    </DashboardPage>
  );
}
