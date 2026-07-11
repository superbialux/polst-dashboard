import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Modal } from "@/components/Modal";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { QrCodeModal, SocialShareModal } from "@/components/DistributionActions";
import { Checkbox, Field, TextInput } from "@/components/Field";
import {
  DashboardCard,
  DashboardPage,
  DataTable,
  DetailList,
  MixBars,
  PageTabs,
  SectionGrid,
  SnippetCard,
  StatTile,
  StatsStrip,
  StatusBadge,
  TrendChart,
  useTabs,
  type DataColumn,
} from "@/components/dashboard";
import {
  CHANNELS,
  CAMPAIGNS,
  CAMPAIGN_SHARE_URL,
  CHANNEL_TRENDS,
  CREATORS,
  DISTRIBUTION_SOURCES,
  EMAIL_PERFORMANCE,
  EMAIL_STATS,
  EMBED_IFRAME,
  EMBED_SCRIPT,
  LINK_ASSETS,
  LIST_GROWTH,
  QR_CODES,
  SINGLE_POLSTS,
  TIER_BENCHMARKS,
  formatNumber,
  type ChannelRow,
  type Creator,
  type DistributionSource,
  type EmailPerformance,
  type LinkAsset,
  type QrAsset,
  type TierBenchmark,
} from "@/lib/workspace";

/** Shared source columns — the full set; detail pages slice what they need. */
export const sourceColumns: Array<DataColumn<DistributionSource>> = [
  {
    header: "Source",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.name}</p>
    ),
  },
  {
    header: "Channel",
    cell: (row) => <span className="text-text-secondary">{row.channel}</span>,
  },
  {
    header: "Feeds",
    cell: (row) =>
      row.linkedObject === "—" ? (
        <span className="text-text-tertiary">Nothing — responses go unattributed</span>
      ) : (
        <span className="min-w-0">
          <span className="block truncate text-text-primary">{row.linkedObject}</span>
          <span className="block text-xs text-text-tertiary">{row.linkedType}</span>
        </span>
      ),
  },
  {
    header: "Responses",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "Completion",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.completion}</span>,
  },
  {
    header: "Signups",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.signups}</span>,
  },
  {
    header: "Bounce",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.bounce}</span>,
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    header: "Last activity",
    cell: (row) => <span className="text-text-secondary">{row.lastActivity}</span>,
  },
];

const channelColumns: Array<DataColumn<ChannelRow>> = [
  {
    header: "Channel",
    cell: (row) => (
      <Link
        to={`/distribution/channels/${row.id}`}
        className="font-display font-semibold text-text-primary hover:text-text-accent"
      >
        {row.name}
      </Link>
    ),
  },
  {
    header: "Scope",
    cell: (row) => <span className="text-text-secondary">{row.scope}</span>,
  },
  { header: "Campaigns", align: "right", cell: (row) => row.campaigns },
  {
    header: "Responses",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "Completion",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.completion}</span>,
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    header: "",
    align: "right",
    cell: (row) => (
      <Button variant="secondary" size="sm" asChild>
        <Link to={`/distribution/channels/${row.id}`}>Open</Link>
      </Button>
    ),
  },
];

const linkColumns: Array<DataColumn<LinkAsset>> = [
  {
    header: "Asset",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.name}</p>
    ),
  },
  {
    header: "Type",
    cell: (row) => <span className="text-text-secondary">{row.type}</span>,
  },
  {
    header: "Feeds",
    cell: (row) =>
      row.linkedObject === "—" ? (
        <span className="text-text-tertiary">Nothing — responses go unattributed</span>
      ) : (
        <span className="text-text-secondary">{row.linkedObject}</span>
      ),
  },
  {
    header: "Responses",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "Completion",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.completion}</span>,
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  {
    header: "Last copied",
    cell: (row) => <span className="text-text-secondary">{row.lastCopied}</span>,
  },
];

export const creatorColumns: Array<DataColumn<Creator>> = [
  {
    header: "Creator",
    cell: (row) => (
      <div className="min-w-0">
        <Link
          to={`/distribution/creators/${row.id}`}
          className="font-display font-semibold text-text-primary hover:text-text-accent"
        >
          {row.name}
        </Link>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {row.handle} · {row.followers} followers
        </p>
      </div>
    ),
  },
  {
    header: "Tier",
    cell: (row) => <span className="text-text-secondary">{row.tier}</span>,
  },
  {
    header: "Campaign",
    cell: (row) => <span className="text-text-secondary">{row.campaign}</span>,
  },
  {
    header: "Clicks",
    align: "right",
    cell: (row) => (
      <span className="tabular-nums">{row.clicks > 0 ? formatNumber(row.clicks) : "—"}</span>
    ),
  },
  {
    header: "CTR",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.ctr}</span>,
  },
  {
    header: "Eff. CPC",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.ecpc}</span>,
  },
  {
    header: "Responses",
    align: "right",
    cell: (row) => (
      <span className="tabular-nums">{row.responses > 0 ? formatNumber(row.responses) : "—"}</span>
    ),
  },
  { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
];

const tierColumns: Array<DataColumn<TierBenchmark>> = [
  {
    header: "Follower tier",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.tier}</p>
    ),
  },
  { header: "Creators", align: "right", cell: (row) => row.creators },
  {
    header: "Avg. CTR",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.avgCtr}</span>,
  },
  {
    header: "Avg. eff. CPC",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.avgEcpc}</span>,
  },
];

const TABS = ["Polsts", "Campaigns", "Embed code"] as const;

/** Health before inventory: the four questions a marketer actually asks of
 *  distribution — is everything covered, what's eroding, what's collecting
 *  without attribution, and can I trust the numbers. */
const SUMMARY: Array<{
  label: string;
  value: string;
  detail: string;
  trend?: "up" | "down" | "flat";
  info: string;
}> = [
  {
    label: "Campaign coverage",
    value: "5 of 6",
    detail: "Game Day Creative Test has no sources",
    trend: "down",
    info: "Active and scheduled campaigns with at least one assigned source collecting responses.",
  },
  {
    label: "Sources need attention",
    value: "1",
    detail: "Conference Booth QR — 41% completion",
    trend: "down",
    info: "Sources whose completion rate fell more than 15 points below the workspace average.",
  },
  {
    label: "Unassigned sources",
    value: "1",
    detail: "Instagram Story Link is collecting unattributed",
    info: "Sources with traffic but no campaign or Polst assignment — their responses can't inform a decision.",
  },
  {
    label: "Attribution quality",
    value: "94%",
    detail: "+2.1% vs prev. 30 days",
    trend: "up",
    info: "Share of responses that arrived through a named source, May 17 – Jun 15 vs Apr 17 – May 16.",
  },
];

export function DistributionPage() {
  const { active, setActive } = useTabs(TABS);
  const [sharePolst, setSharePolst] = useState<(typeof SINGLE_POLSTS)[number] | null>(null);
  const [qrTarget, setQrTarget] = useState<{ name: string; id: string; kind: "p" | "campaign" } | null>(null);
  const [embedOpen, setEmbedOpen] = useState(false);
  const polstColumns: Array<DataColumn<(typeof SINGLE_POLSTS)[number]>> = [
    { header: "Polst", cell: (row) => <div><p className="font-display font-semibold text-text-primary">{row.question}</p><p className="mt-0.5 text-xs text-text-secondary">{row.optionA} vs {row.optionB}</p></div> },
    { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { header: "Votes", align: "right", cell: (row) => formatNumber(row.responses) },
    { header: "", align: "right", cell: (row) => <div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => setSharePolst(row)}>Distribute</Button><Button variant="secondary" size="sm" onClick={() => setQrTarget({ name: row.question, id: row.id, kind: "p" })}>QR code</Button></div> },
  ];
  const campaignColumns: Array<DataColumn<(typeof CAMPAIGNS)[number]>> = [
    { header: "Campaign", cell: (row) => <div><p className="font-display font-semibold text-text-primary">{row.name}</p><p className="mt-0.5 text-xs text-text-secondary">{row.polsts} Polsts</p></div> },
    { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { header: "Voters", align: "right", cell: (row) => formatNumber(row.responses) },
    { header: "", align: "right", cell: (row) => <div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => setEmbedOpen(true)}>Share / embed</Button><Button variant="secondary" size="sm" onClick={() => setQrTarget({ name: row.name, id: row.id, kind: "campaign" })}>QR code</Button></div> },
  ];

  return (
    <DashboardPage>
      <PageTabs tabs={TABS} active={active} onChange={setActive} />
      {active === "Polsts" ? <DashboardCard padded={false}><DataTable rows={SINGLE_POLSTS.filter((polst) => polst.status !== "Draft" && polst.status !== "Archived")} columns={polstColumns} /></DashboardCard> : null}
      {active === "Campaigns" ? <DashboardCard padded={false}><DataTable rows={CAMPAIGNS} columns={campaignColumns} /></DashboardCard> : null}
      {active === "Embed code" ? (
        <>
          <DashboardCard title="Public campaign link">
            <div className="flex items-center gap-2 rounded-md bg-surface-subtle p-2 pl-3">
              <p className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">{CAMPAIGN_SHARE_URL}</p>
              <Button variant="secondary" size="sm">Copy link</Button>
            </div>
          </DashboardCard>
          <SectionGrid>
            <div className="lg:col-span-6">
              <SnippetCard
                title="iframe embed"
                description="Drops into any page. The widget adapts to the container width (minimum 320px)."
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
      ) : null}
      <SocialShareModal open={Boolean(sharePolst)} onClose={() => setSharePolst(null)} objectName={sharePolst?.question ?? "this Polst"} />
      <QrCodeModal open={Boolean(qrTarget)} onClose={() => setQrTarget(null)} objectName={qrTarget?.name ?? "this item"} url={`https://polst.app/${qrTarget?.kind ?? "p"}/${qrTarget?.id ?? "item"}?utm_source=qr`} />
      <Modal open={embedOpen} onClose={() => setEmbedOpen(false)} label="Share and embed campaign" title="Share / embed campaign">
        <div className="space-y-4 p-4"><SnippetCard title="iframe embed" code={EMBED_IFRAME} /><SnippetCard title="JavaScript embed" code={EMBED_SCRIPT} /></div>
      </Modal>
    </DashboardPage>
  );
}

/* ── QR codes ────────────────────────────────────────────────────── */

/** One QR asset: a code placeholder beside its identity and funnel numbers.
 *  Downloads only raise a toast in this mockup. */
function QrCard({ qr }: { qr: QrAsset }) {
  const toast = useToast();
  return (
    <DashboardCard className="lg:col-span-4">
      <div className="flex items-start gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-md border border-border-default bg-surface-raised text-icon-primary">
          <Icon name="qr_code_2" size={56} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-sm font-bold text-text-primary">{qr.name}</p>
            <StatusBadge status={qr.status} />
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">{qr.placement}</p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {qr.linkedObject === "—" ? (
              <span className="text-text-tertiary">Feeds nothing — scans go unattributed</span>
            ) : (
              `Feeds ${qr.linkedObject}`
            )}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-surface-subtle p-3 text-center">
        {(
          [
            ["Scans", qr.scans > 0 ? formatNumber(qr.scans) : "—"],
            ["Responses", qr.responses > 0 ? formatNumber(qr.responses) : "—"],
            ["Completion", qr.completion],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-text-secondary">{label}</dt>
            <dd className="mt-0.5 font-display text-sm font-bold tabular-nums text-text-primary">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast(`${qr.name} downloaded as PNG`)}
        >
          <Icon name="download" size={16} />
          PNG
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast(`${qr.name} downloaded as SVG`)}
        >
          <Icon name="download" size={16} />
          SVG
        </Button>
      </div>
    </DashboardCard>
  );
}

function QrCodesSection() {
  return (
    <>
      <SectionGrid>
        {QR_CODES.map((qr) => (
          <QrCard key={qr.id} qr={qr} />
        ))}
      </SectionGrid>
      <DashboardCard title="Why multiple QR codes?">
        <p className="max-w-3xl text-sm leading-6 text-text-secondary">
          Print a different code for each placement — packaging, booth banner,
          retail poster — and every scan stays attributed to where it happened.
          When the booth outperforms the poster, you'll know, not guess.
        </p>
      </DashboardCard>
    </>
  );
}

/* ── Assign sources ──────────────────────────────────────────────── */

function AssignSourcesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const columns: Array<DataColumn<DistributionSource>> = [
    {
      header: "",
      className: "w-10",
      cell: (row) => <Checkbox label={`Select ${row.name}`} />,
    },
    ...sourceColumns.slice(0, 4),
    { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Assign sources"
      title="Assign sources"
      className="lg:max-w-3xl"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Save selection</Button>
        </div>
      }
    >
      <div className="p-4">
        <p className="mb-3 text-sm text-text-secondary">
          Attach existing tracked sources to a campaign so every response it
          collects is attributed from the first scan or click.
        </p>
        <div className="overflow-hidden rounded-md border border-border-default">
          <DataTable rows={DISTRIBUTION_SOURCES} columns={columns} />
        </div>
      </div>
    </Modal>
  );
}

/* ── Channel detail ──────────────────────────────────────────────── */

const emailColumns: Array<DataColumn<EmailPerformance>> = [
  {
    header: "Email type",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.type}</p>
    ),
  },
  {
    header: "Audience",
    cell: (row) => <span className="text-text-secondary">{row.audience}</span>,
  },
  {
    header: "Sends",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.sends)}</span>,
  },
  {
    header: "Open rate",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.openRate}</span>,
  },
  {
    header: "CTR",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.ctr}</span>,
  },
  {
    header: "Click-to-vote",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.clickToVote}</span>,
  },
  {
    header: "Unsubscribe",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.unsub}</span>,
  },
];

const SEND_WINDOWS = ["Wed 6–8pm", "Sun 11am–1pm", "Thu 7–9pm"];

/** Email gets the full treatment — the template every channel detail
 *  will grow into (paid, QR, embeds reuse this shape). */
function EmailChannelSections() {
  return (
    <>
      <StatsStrip stats={EMAIL_STATS} xTicks={LIST_GROWTH.xTicks} />
      <DashboardCard title="Performance by email type" padded={false}>
        <DataTable rows={EMAIL_PERFORMANCE} columns={emailColumns} />
      </DashboardCard>
      <SectionGrid>
        <DashboardCard
          title="List growth"
          description="Subscribers in thousands, trailing 12 weeks vs the 12 before."
          className="lg:col-span-8"
        >
          <TrendChart
            series={LIST_GROWTH.series}
            previous={LIST_GROWTH.previous}
            xTicks={LIST_GROWTH.xTicks}
            format={(v) => `${v.toFixed(1)}k`}
          />
        </DashboardCard>
        <DashboardCard title="Best send windows" className="lg:col-span-4">
          <ul className="space-y-2">
            {SEND_WINDOWS.map((window, index) => (
              <li
                key={window}
                className="flex items-center gap-3 rounded-md bg-surface-subtle px-3 py-2.5"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-pill bg-accent-soft font-display text-xs font-bold text-accent-default">
                  {index + 1}
                </span>
                <span className="font-display text-sm font-semibold text-text-primary">
                  {window}
                </span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </SectionGrid>
    </>
  );
}

export function ChannelDetailPage() {
  const { id } = useParams();
  const channel = CHANNELS.find((c) => c.id === id) ?? CHANNELS[0];
  const trend = CHANNEL_TRENDS[channel.id];
  const sources = DISTRIBUTION_SOURCES.filter((s) => s.channel === channel.name);
  return (
    <DashboardPage
      actions={<Button variant="secondary">Create source</Button>}
    >
      <SectionGrid>
        <StatTile
          className="lg:col-span-3"
          label="Responses"
          value={formatNumber(channel.responses)}
          detail={`across ${channel.campaigns} campaign${channel.campaigns === 1 ? "" : "s"}`}
        />
        <StatTile className="lg:col-span-3" label="Completion" value={channel.completion} />
        <StatTile className="lg:col-span-3" label="Scope" value={channel.scope} />
        <StatTile className="lg:col-span-3" label="Status" value={channel.status} />
      </SectionGrid>

      {channel.id === "email" ? <EmailChannelSections /> : null}

      {trend ? (
        <DashboardCard
          title="Responses"
          description="Daily responses through this channel, vs the previous two weeks."
        >
          <TrendChart
            series={trend.series}
            previous={trend.previous}
            xTicks={["14 days ago", "7 days ago", "Today"]}
          />
        </DashboardCard>
      ) : null}

      <DashboardCard title="Sources in this channel" padded={false}>
        <DataTable
          rows={sources}
          columns={sourceColumns}
          emptyLabel="No sources yet — create one to start attributing responses"
        />
      </DashboardCard>
    </DashboardPage>
  );
}

/* ── Creator detail ──────────────────────────────────────────────── */

const creatorLinkColumns: Array<DataColumn<Creator["links"][number]>> = [
  {
    header: "Link",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.name}</p>
    ),
  },
  {
    header: "Feeds",
    cell: (row) =>
      row.linkedObject === "—" ? (
        <span className="text-text-tertiary">Nothing — clicks go unattributed</span>
      ) : (
        <span className="text-text-secondary">{row.linkedObject}</span>
      ),
  },
  {
    header: "Clicks",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.clicks)}</span>,
  },
  {
    header: "Responses",
    align: "right",
    cell: (row) => <span className="tabular-nums">{formatNumber(row.responses)}</span>,
  },
  {
    header: "CTR",
    align: "right",
    cell: (row) => <span className="tabular-nums">{row.ctr}</span>,
  },
];

/** Story views come from screenshots, not APIs — the one number in the
 *  product a human types in. */
function StoryViewsCard({ creator }: { creator: Creator }) {
  const toast = useToast();
  const [views, setViews] = useState(String(creator.storyViews || ""));
  return (
    <DashboardCard title="Story views">
      <Field label="Reported by creator" helper="Manual entry — story analytics have no API.">
        {(fieldId) => (
          <div className="flex gap-2">
            <TextInput
              id={fieldId}
              type="number"
              inputMode="numeric"
              value={views}
              onChange={(e) => setViews(e.target.value)}
              placeholder="0"
            />
            <Button
              variant="secondary"
              onClick={() => toast("Story views updated")}
            >
              Save
            </Button>
          </div>
        )}
      </Field>
    </DashboardCard>
  );
}

export function CreatorDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const creator = CREATORS.find((c) => c.id === id) ?? CREATORS[0];
  const benchmark = TIER_BENCHMARKS.find((t) => t.tier === creator.tier);
  return (
    <DashboardPage
      actions={
        <Button
          variant="secondary"
          onClick={() => toast("Tracked link copied")}
        >
          <Icon name="link" size={18} />
          Copy tracked link
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-pill bg-avatar-bg font-display text-sm font-bold text-text-inverse">
          {creator.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {creator.handle}
            <span className="ml-2 font-normal text-text-secondary">
              {creator.followers} followers
            </span>
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">{creator.campaign}</p>
        </div>
        <span className="rounded-pill bg-surface-subtle px-2.5 py-1 font-display text-xs font-semibold text-text-secondary">
          {creator.tier} tier
        </span>
        <StatusBadge status={creator.status} />
      </div>

      <SectionGrid>
        <StatTile
          className="lg:col-span-3"
          label="Clicks"
          value={creator.clicks > 0 ? formatNumber(creator.clicks) : "—"}
        />
        <StatTile className="lg:col-span-3" label="CTR" value={creator.ctr} />
        <StatTile className="lg:col-span-3" label="Effective CPC" value={creator.ecpc} />
        <StatTile
          className="lg:col-span-3"
          label="Responses"
          value={creator.responses > 0 ? formatNumber(creator.responses) : "—"}
          detail={creator.completion === "—" ? undefined : `${creator.completion} completion`}
        />
      </SectionGrid>

      <SectionGrid>
        <DashboardCard
          title="Clicks"
          description="Weekly clicks on this creator's tracked links."
          className="lg:col-span-8"
        >
          {creator.clickTrend.length > 1 ? (
            <TrendChart
              series={creator.clickTrend}
              xTicks={["12 weeks ago", "6 weeks ago", "This week"]}
            />
          ) : (
            <p className="py-12 text-center text-sm text-text-secondary">
              No clicks yet — share the tracked link to start measuring.
            </p>
          )}
        </DashboardCard>
        <div className="space-y-4 lg:col-span-4">
          <StoryViewsCard creator={creator} />
          {benchmark ? (
            <DashboardCard title={`Vs the ${creator.tier} tier`}>
              <DetailList
                items={[
                  ["This creator CTR", creator.ctr],
                  ["Tier average CTR", benchmark.avgCtr],
                  ["This creator eff. CPC", creator.ecpc],
                  ["Tier average eff. CPC", benchmark.avgEcpc],
                ]}
              />
            </DashboardCard>
          ) : null}
        </div>
      </SectionGrid>

      <DashboardCard title="Tracked links" padded={false}>
        <DataTable
          rows={creator.links}
          columns={creatorLinkColumns}
          emptyLabel="No tracked links yet"
        />
      </DashboardCard>
    </DashboardPage>
  );
}
