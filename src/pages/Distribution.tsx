import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { useCopyToClipboard, useToast } from "@/components/Toast";
import { QrCodeModal } from "@/components/DistributionActions";
import {
  FORMAT_META,
  SourceDetailModal,
  attributedUrl,
  sourceStatItems,
  type LinkedMeta,
} from "@/components/SourceDetail";
import {
  AssignSourceModal,
  AssignTargetModal,
  CHANNELS,
  Chip,
  ConnectCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  DateRangePicker,
  EmptyState,
  HeaderTabs,
  IconTile,
  LockedCard,
  MiniStatGrid,
  ModalFooter,
  RateCell,
  SOURCE_KINDS,
  SectionHeader,
  SnippetCard,
  StatsStrip,
  StatusBadge,
  StatusSelect,
  TablePagination,
  TableToolbar,
  UnassignButton,
  filterByCreated,
  sortRows,
  type DataColumn,
  type SortState,
  type SourceTargetOption,
} from "@/components/dashboard";
import { useWorkspace } from "@/lib/store";
import { METRIC_INFO, fmtInt, fmtPct, pct, relativeToToday } from "@/lib/canon";
import { windowDelta } from "@/lib/engine";
import {
  INTEGRATIONS,
  STAT_XTICKS,
  embedIframe,
  shareUrl,
  sourceSetVotersWindow,
  windowMetricSpark,
  workspaceWindow,
  type Source,
  type Stat,
  type Status,
} from "@/lib/workspace";

/* ── The Sources library ────────────────────────────────────────────
   Distribution owns the concrete assets that collect voters — share
   links, QR codes, embeds. "Source" is the tracked asset Polst mints;
   "channel" is where it gets placed. Content itself lives on /polsts
   and /campaigns. The source detail modal and its vocabulary are the
   shared components/SourceDetail module — campaign Sources reuses them. */

const LIVE_STATUSES: Status[] = ["Active", "Scheduled"];

/* Overview leads; each format gets its own tab with format stats and
   asset cards. Tab state lives in `?tab=` (Home's pattern). */
const DIST_TABS = [
  { key: "Overview", slug: "overview" },
  { key: "Share links", slug: "links" },
  { key: "QR codes", slug: "qr" },
  { key: "Embeds", slug: "embeds" },
] as const;
type DistTab = (typeof DIST_TABS)[number]["key"];
const DIST_TAB_KEYS = DIST_TABS.map((t) => t.key) as DistTab[];

function useDistTab(): [DistTab, (t: DistTab) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const active = DIST_TABS.find((t) => t.slug === raw)?.key ?? "Overview";
  const set = (key: DistTab) => {
    const slug = DIST_TABS.find((t) => t.key === key)!.slug;
    setParams(key === "Overview" ? {} : { tab: slug }, { replace: true });
  };
  return [active, set];
}

const TAB_FORMAT: Record<Exclude<DistTab, "Overview">, Source["kind"]> = {
  "Share links": "Share link",
  "QR codes": "QR code",
  Embeds: "Embed",
};

/* The pager's honest-range noun — sentence case except the initialism. */
const TAB_NOUN: Record<Exclude<DistTab, "Overview">, string> = {
  "Share links": "share links",
  "QR codes": "QR codes",
  Embeds: "embeds",
};

const FORMAT_FILTERS = ["All formats", ...SOURCE_KINDS] as const;
const CHANNEL_FILTERS = ["All channels", ...CHANNELS] as const;
const PAGE_SIZE = 25;
/* Card grids page in whole rows: 12 is 4 rows of 3 (lg), 6 rows of 2 (sm). */
const CARD_PAGE_SIZE = 12;

const COMPLETION_SCOPE = `${METRIC_INFO.completionRate} Ranked across campaign sources — a single-question polst always completes.`;

/** A format's honest totals: volume and voters over every source, but
 *  completion only over campaign-fed ones (a single-question polst
 *  completes by definition). */
const formatTotals = (list: Source[]) => {
  const views = list.reduce((sum, s) => sum + s.views, 0);
  const voters = list.reduce((sum, s) => sum + s.voters, 0);
  const campaignFed = list.filter((s) => s.linked?.type === "campaign");
  const completed = campaignFed.reduce((sum, s) => sum + s.completed, 0);
  const campaignVoters = campaignFed.reduce((sum, s) => sum + s.voters, 0);
  return {
    views,
    voters,
    completion: campaignVoters > 0 ? (completed / campaignVoters) * 100 : null,
    unassigned: list.filter((s) => !s.linked).length,
  };
};

export function DistributionPage() {
  const toast = useToast();
  const copy = useCopyToClipboard();
  const {
    campaigns,
    polsts,
    sources,
    addSource,
    assignSource,
    unassignSource,
    campaignById,
    polstById,
  } = useWorkspace();
  const [tab, setTab] = useDistTab();
  const [addOpen, setAddOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Source | null>(null);
  const [qrTarget, setQrTarget] = useState<{ source: Source; linked: LinkedMeta } | null>(null);
  /* The detail modal tracks the ID, not the object — assign/unassign
     inside the modal re-renders it against the live store row. */
  const [detailId, setDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<string>("All formats");
  const [channel, setChannel] = useState<string>("All channels");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(0);
  /* The format tabs' card grid pages independently of the Overview table. */
  const [cardPage, setCardPage] = useState(0);
  const [sort, setSort] = useState<SortState | null>(null);

  const metaFor = (s: Source): LinkedMeta | null => {
    if (!s.linked) return null;
    if (s.linked.type === "campaign") {
      const c = campaignById(s.linked.id);
      return c
        ? { type: "campaign", id: c.id, name: c.name, status: c.status, to: `/campaigns/${c.id}` }
        : null;
    }
    const p = polstById(s.linked.id);
    return p
      ? { type: "polst", id: p.id, name: p.question, status: p.status, to: `/polsts/${p.id}` }
      : null;
  };

  /** The format-appropriate quick action for a linked source: a QR
   *  previews and downloads, a link or embed copies its snippet. */
  const quickAction = (s: Source, m: LinkedMeta) => {
    if (s.kind === "QR code") {
      return {
        icon: "qr_code_2",
        label: "QR code",
        onClick: () => setQrTarget({ source: s, linked: m }),
      };
    }
    if (s.kind === "Share link") {
      return {
        icon: "content_copy",
        label: "Copy link",
        onClick: () => void copy(attributedUrl(m, s.id), "Link copied to clipboard"),
      };
    }
    return {
      icon: "content_copy",
      label: "Copy embed",
      onClick: () => void copy(embedIframe(m.id), "Embed code copied to clipboard"),
    };
  };

  /* Campaign sources worst-completion first (the eroding source Home
     points at), then polst sources by volume — a single question has no
     completion to rank — then the silent sources, newest on top so a
     just-created one is visible. */
  const ordered = useMemo(() => {
    const measured = sources
      .filter((s) => s.completionRate !== null && s.linked?.type === "campaign")
      .sort((a, b) => a.completionRate! - b.completionRate!);
    const polstFed = sources
      .filter((s) => s.voters > 0 && s.linked?.type === "polst")
      .sort((a, b) => b.voters - a.voters);
    const silent = sources
      .filter((s) => !measured.includes(s) && !polstFed.includes(s))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return [...measured, ...polstFed, ...silent];
  }, [sources]);

  const window30 = workspaceWindow("30D");
  const activeCount = sources.filter((s) => {
    const m = metaFor(s);
    return m !== null && LIVE_STATUSES.includes(m.status);
  }).length;
  const unassignedCount = sources.filter((s) => !s.linked).length;
  /* Single-question polsts complete by definition (100%), so only sources
     feeding multi-question campaigns can be ranked on completion. */
  const rankable = ordered.filter(
    (s) => s.completionRate !== null && s.linked?.type === "campaign",
  );
  const worst = rankable[0];
  const best = rankable[rankable.length - 1];

  /* The Overview strip: the same four distribution facts the tiles held,
     on the Home stat-strip anatomy. Only voters carries an honest daily
     series — the sparkless cells borrow it (and the chart header says
     so), which is the strip's built-in contract. */
  const votersDelta = window30.prev ? windowDelta(window30.voters, window30.prev.voters) : null;
  const overviewStats: Stat[] = [
    {
      label: "Active sources",
      value: fmtInt(activeCount),
      delta: "—",
      trend: "flat",
      detail: unassignedCount > 0 ? `${fmtInt(unassignedCount)} unassigned` : undefined,
      info: "Sources assigned to a campaign or polst that is live or scheduled.",
    },
    {
      label: "Voters · last 30 days",
      value: fmtInt(window30.voters),
      delta: votersDelta === null ? "—" : `${Math.abs(votersDelta)}%`,
      trend:
        votersDelta === null || votersDelta === 0 ? "flat" : votersDelta > 0 ? "up" : "down",
      info: METRIC_INFO.voters,
      ...windowMetricSpark("30D", "voters"),
    },
    {
      label: "Best completion",
      value: best?.completionRate != null ? fmtPct(best.completionRate, 0) : "—",
      delta: "—",
      trend: "flat",
      detail: best?.name,
      info: COMPLETION_SCOPE,
    },
    {
      label: "Lowest completion",
      value: worst?.completionRate != null ? fmtPct(worst.completionRate, 0) : "—",
      delta: "—",
      trend: "flat",
      detail: worst?.name,
      info: COMPLETION_SCOPE,
    },
  ];

  const columns: Array<DataColumn<Source>> = [
    {
      header: "Source",
      sort: (s) => s.name.toLowerCase(),
      cell: (s) => (
        <div className="min-w-0">
          <p className="font-display font-semibold text-text-primary">{s.name}</p>
          {s.placement ? (
            <p className="mt-0.5 text-xs text-text-secondary">{s.placement}</p>
          ) : null}
        </div>
      ),
    },
    { header: "Format", sort: (s) => s.kind, cell: (s) => <Chip>{s.kind}</Chip> },
    {
      header: "Channel",
      sort: (s) => s.channel,
      cell: (s) => <span className="text-text-secondary">{s.channel}</span>,
    },
    {
      header: "Linked to",
      sort: (s) => metaFor(s)?.name.toLowerCase() ?? "",
      cell: (s) => {
        const m = metaFor(s);
        return m ? (
          <span className="block min-w-0">
            <span className="block truncate text-text-primary">{m.name}</span>
            <span className="block text-xs text-text-tertiary">
              {m.type === "campaign" ? "Campaign" : "polst"}
            </span>
          </span>
        ) : (
          <span className="text-text-tertiary">Unassigned</span>
        );
      },
    },
    {
      header: "Voters",
      align: "right",
      sort: (s) => s.voters,
      cell: (s) => (
        <span className="tabular-nums">{s.voters > 0 ? fmtInt(s.voters) : "—"}</span>
      ),
    },
    {
      header: "Completion",
      align: "right",
      sort: (s) => (s.linked?.type === "campaign" ? s.completionRate ?? -1 : -1),
      /* Only campaign sources have a real completion story — a single-
         question polst completes the moment it votes, so "100%" would be
         a degenerate stat, not information. */
      cell: (s) => RateCell(s.linked?.type === "campaign" ? s.completionRate : null),
    },
    {
      header: "Last activity",
      sort: (s) => s.lastActivity ?? "",
      cell: (s) => (
        <span className="text-text-secondary">
          {s.lastActivity ? relativeToToday(s.lastActivity) : "—"}
        </span>
      ),
    },
  ];

  const klaviyo = INTEGRATIONS.find((i) => i.id === "int-klaviyo");

  /* The list pipeline (the Polsts/Campaigns contract): filter, sort the
     FULL list, then slice a page — page 2 continues page 1's order. */
  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = filterByCreated(ordered, createdFrom, createdTo)
      .filter((s) => format === "All formats" || s.kind === format)
      .filter((s) => channel === "All channels" || s.channel === channel)
      .filter(
        (s) =>
          !normalized ||
          [s.name, s.placement ?? "", metaFor(s)?.name ?? ""].some((v) =>
            v.toLowerCase().includes(normalized),
          ),
      );
    return sortRows(filtered, columns, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered, query, format, channel, createdFrom, createdTo, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const setFilterAndResetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  const filtering = Boolean(
    query.trim() ||
      format !== "All formats" ||
      channel !== "All channels" ||
      createdFrom ||
      createdTo,
  );
  const emptyTitle = filtering ? "No sources match these filters" : "No sources yet";
  const emptyAction = filtering
    ? {
        label: "Clear filters",
        onClick: () => {
          setQuery("");
          setFormat("All formats");
          setChannel("All channels");
          setCreatedFrom("");
          setCreatedTo("");
          setPage(0);
        },
      }
    : { label: "Add source", onClick: () => setAddOpen(true) };

  const detail = detailId ? sources.find((s) => s.id === detailId) ?? null : null;

  /* The current format tab's slice and totals (Overview skips this).
     Strip stats always cover the WHOLE format — only the card grid pages. */
  const tabFormat = tab === "Overview" ? null : TAB_FORMAT[tab];
  const tabSources = tabFormat ? ordered.filter((s) => s.kind === tabFormat) : [];
  const tabTotals = formatTotals(tabSources);
  const cardPageCount = Math.max(1, Math.ceil(tabSources.length / CARD_PAGE_SIZE));
  const safeCardPage = Math.min(cardPage, cardPageCount - 1);
  const cardPageSources = tabSources.slice(
    safeCardPage * CARD_PAGE_SIZE,
    (safeCardPage + 1) * CARD_PAGE_SIZE,
  );

  /* The format tab's strip: count, run-to-date volume, and completion
     are facts without a daily shape; voters gets the format's real
     windowed series (each source riding its run, share-allocated). */
  const tabVoters = tabFormat ? sourceSetVotersWindow(tabSources, "30D") : null;
  const tabStats: Stat[] = tabFormat
    ? [
        {
          label: tab,
          value: fmtInt(tabSources.length),
          delta: "—",
          trend: "flat",
          detail:
            tabTotals.unassigned > 0 ? `${fmtInt(tabTotals.unassigned)} unassigned` : undefined,
          info: FORMAT_META[tabFormat].blurb,
        },
        {
          label: FORMAT_META[tabFormat].volume,
          value: tabTotals.views > 0 ? fmtInt(tabTotals.views) : "—",
          delta: "—",
          trend: "flat",
          detail: "run to date",
          info: METRIC_INFO.views,
        },
        {
          label: "Voters · last 30 days",
          value: fmtInt(tabVoters!.total),
          delta: tabVoters!.delta === null ? "—" : `${Math.abs(tabVoters!.delta)}%`,
          trend:
            tabVoters!.delta === null || tabVoters!.delta === 0
              ? "flat"
              : tabVoters!.delta > 0
                ? "up"
                : "down",
          info: METRIC_INFO.voters,
          spark: tabVoters!.spark,
          previous: tabVoters!.previous,
        },
        {
          label: "Completion",
          value: tabTotals.completion !== null ? fmtPct(tabTotals.completion, 0) : "—",
          delta: "—",
          trend: "flat",
          detail: "across campaign sources",
          info: COMPLETION_SCOPE,
        },
      ]
    : [];

  return (
    <DashboardPage
      actions={
        <Button onClick={() => setAddOpen(true)}>
          <Icon name="add" size={18} />
          Add source
        </Button>
      }
      tabs={
        <HeaderTabs
          tabs={DIST_TAB_KEYS}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setCardPage(0);
          }}
        />
      }
      // The pager rides the fixed footer band — under the Overview table
      // or a format tab's card grid, never over an empty state.
      footer={
        tab === "Overview" ? (
          rows.length ? (
            <TablePagination
              page={safePage}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onPage={setPage}
              noun="sources"
            />
          ) : null
        ) : tabSources.length ? (
          <TablePagination
            page={safeCardPage}
            pageSize={CARD_PAGE_SIZE}
            total={tabSources.length}
            onPage={setCardPage}
            noun={TAB_NOUN[tab]}
          />
        ) : null
      }
    >
      {tab === "Overview" ? (
        <>
          {/* The Home stat-strip, folded by default — a stat click (or the
              chevron) opens the chart; the chevron folds it back. */}
          <StatsStrip
            stats={overviewStats}
            xTicks={STAT_XTICKS["30D"]}
            scopeLabel={window30.compareLabel ?? undefined}
            collapsible
          />

          {/* The action row rides ABOVE the card (the list-page altitude). */}
          <section className="space-y-2">
            <TableToolbar
              placeholder="Search sources"
              query={query}
              onQueryChange={setFilterAndResetPage(setQuery)}
            >
              <StatusSelect
                options={FORMAT_FILTERS}
                value={format}
                onChange={setFilterAndResetPage(setFormat)}
                className="w-40"
              />
              <StatusSelect
                options={CHANNEL_FILTERS}
                value={channel}
                onChange={setFilterAndResetPage(setChannel)}
                className="w-40"
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
            </TableToolbar>
            {rows.length ? (
              <DashboardCard padded={false}>
                {/* A row IS the way in — click opens the source's detail
                    (stats, its asset, assign/unassign), so no per-row
                    action buttons crowd the table. */}
                <DataTable
                  rows={pageRows}
                  columns={columns}
                  onRowClick={(s) => setDetailId(s.id)}
                  sort={sort}
                  onSortChange={setFilterAndResetPage(setSort)}
                />
              </DashboardCard>
            ) : (
              <DashboardCard padded={false}>
                <EmptyState icon="hub" title={emptyTitle} action={emptyAction} />
              </DashboardCard>
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="Email & influencer platforms" />
            <div className="grid gap-4 lg:grid-cols-2">
              {klaviyo ? <ConnectCard integration={klaviyo} /> : null}
              <LockedCard
                title="Influencer tracking"
                chip="Not connected"
                description="Creator benchmarks and story views arrive once a creator platform is connected."
              />
            </div>
          </section>
        </>
      ) : (
        <>
          {/* The same folded strip as Overview — a stat click opens the
              format's voters chart, the chevron folds it back. */}
          <StatsStrip
            stats={tabStats}
            xTicks={STAT_XTICKS["30D"]}
            scopeLabel={window30.compareLabel ?? undefined}
            collapsible
          />

          {tabSources.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cardPageSources.map((s) => {
                const m = metaFor(s);
                return (
                  <AssetCard
                    key={s.id}
                    source={s}
                    linked={m}
                    onOpen={() => setDetailId(s.id)}
                    action={m ? quickAction(s, m) : { label: "Assign", onClick: () => setAssignTarget(s) }}
                  />
                );
              })}
            </div>
          ) : (
            <DashboardCard padded={false}>
              <EmptyState
                icon={FORMAT_META[tabFormat!].icon}
                title={`No ${tab.toLowerCase()} yet`}
                hint={FORMAT_META[tabFormat!].blurb}
                action={{ label: "Add source", onClick: () => setAddOpen(true) }}
              />
            </DashboardCard>
          )}
        </>
      )}

      <SourceDetailModal
        source={detail}
        linked={detail ? metaFor(detail) : null}
        onClose={() => setDetailId(null)}
        onAssign={(s) => setAssignTarget(s)}
        onUnassign={(s) => {
          const result = unassignSource(s.id);
          toast(result.ok ? `${s.name} unassigned` : result.reason);
        }}
      />

      <AssignSourceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add source"
        confirmLabel="Add source"
        targets={targetOptions(campaigns, polsts)}
        targetHint="An unassigned source doesn't collect voters yet — assign it to a campaign or polst when you're ready."
        // The library flow makes no assumptions: kind and channel start
        // unchosen so every asset is described deliberately.
        defaultKind=""
        defaultChannel=""
        namePlaceholder="QR — Farmers market booth"
        gridClassName="grid grid-cols-2 gap-3"
        onCreate={(input) => {
          addSource(input);
          setAddOpen(false);
          toast(`${input.name} added`);
        }}
      />
      <AssignTargetModal
        source={assignTarget}
        onClose={() => setAssignTarget(null)}
        targets={targetOptions(campaigns, polsts)}
        targetHint="From the first scan or click, every voter it collects is attributed here."
        onAssign={(linked, targetName) => {
          if (!assignTarget) return;
          assignSource(assignTarget.id, linked);
          setAssignTarget(null);
          toast(`${assignTarget.name} assigned to ${targetName}`);
        }}
      />
      <QrCodeModal
        open={Boolean(qrTarget)}
        onClose={() => setQrTarget(null)}
        objectName={qrTarget?.linked.name ?? "this source"}
        url={qrTarget ? attributedUrl(qrTarget.linked, qrTarget.source.id) : ""}
      />
    </DashboardPage>
  );
}

/* ── Asset card ──────────────────────────────────────────────────────
   One source as one card, any format: glyph, identity, the shared stat
   trio, and the format's quick action. The card itself opens the source
   detail — inner controls stop the bubble. */

function AssetCard({
  source,
  linked,
  onOpen,
  action,
}: {
  source: Source;
  linked: LinkedMeta | null;
  /** Open the source detail modal. */
  onOpen: () => void;
  action: { icon?: string; label: string; onClick: () => void };
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer flex-col rounded-card border border-border-default bg-surface-raised p-4 text-left shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <IconTile size={12} className="text-icon-primary">
          <Icon name={FORMAT_META[source.kind].icon} size={32} />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-text-primary">{source.name}</p>
          {source.placement ? (
            <p className="mt-0.5 text-xs text-text-secondary">{source.placement}</p>
          ) : null}
          <p className="mt-0.5 truncate text-xs">
            {linked ? (
              <span className="text-text-secondary">Feeds {linked.name}</span>
            ) : (
              <span className="text-text-tertiary">Unassigned</span>
            )}
          </p>
        </div>
      </div>
      <MiniStatGrid
        className="mt-3"
        cols={3}
        tone="subtle"
        items={sourceStatItems(source, linked)}
      />
      <div className="mt-auto flex gap-2 pt-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
        >
          {action.icon ? <Icon name={action.icon} size={18} /> : null}
          {action.label}
        </Button>
      </div>
    </div>
  );
}

/* ── Assign / create targets ─────────────────────────────────────── */

/** Campaigns and polsts a source can feed — nothing ended or archived. */
function targetOptions(
  campaigns: Array<{ id: string; name: string; status: Status }>,
  polsts: Array<{ id: string; question: string; status: Status }>,
): SourceTargetOption[] {
  const open = (status: Status) => status !== "Ended" && status !== "Archived";
  return [
    ...campaigns
      .filter((c) => open(c.status))
      .map((c) => ({
        value: `campaign:${c.id}`,
        label: c.name,
        icon: "campaign",
        group: "Campaigns",
        linked: { type: "campaign" as const, id: c.id },
      })),
    ...polsts
      .filter((p) => open(p.status))
      .map((p) => ({
        value: `polst:${p.id}`,
        label: p.question,
        icon: "ballot",
        group: "Polsts",
        linked: { type: "polst" as const, id: p.id },
      })),
  ];
}
