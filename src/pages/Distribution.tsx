import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { QrCodeModal } from "@/components/DistributionActions";
import {
  AssignSourceModal,
  AssignTargetModal,
  Chip,
  ConnectCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  EmptyState,
  IconTile,
  LockedCard,
  MiniStatGrid,
  RateCell,
  SectionGrid,
  SnippetCard,
  StatTile,
  UnassignButton,
  type DataColumn,
  type SourceTargetOption,
} from "@/components/dashboard";
import { useWorkspace } from "@/lib/store";
import { METRIC_INFO, fmtInt, fmtPct, pct, relativeToToday } from "@/lib/canon";
import { windowTileDelta } from "@/lib/engine";
import {
  INTEGRATIONS,
  embedIframe,
  shareUrl,
  workspaceWindow,
  type Source,
  type Status,
} from "@/lib/workspace";

/* ── The Sources library ────────────────────────────────────────────
   Distribution owns the concrete assets that collect voters — QR codes,
   share links, embeds, tracked links. "Source" is the asset; "channel"
   is its family. Content itself lives on /polsts and /campaigns. */

/** What a source feeds, resolved through the store so renames follow. */
type LinkedMeta = {
  type: "campaign" | "polst";
  id: string;
  name: string;
  status: Status;
  to: string;
};

const LIVE_STATUSES: Status[] = ["Active", "Scheduled"];

/** Share links get the source id appended so every visit stays attributed. */
const attributedUrl = (meta: LinkedMeta, sourceId: string) =>
  `${shareUrl(meta.type, meta.id)}?src=${sourceId}`;

export function DistributionPage() {
  const toast = useToast();
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
  const [addOpen, setAddOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Source | null>(null);
  const [qrTarget, setQrTarget] = useState<{ source: Source; linked: LinkedMeta } | null>(null);

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

  /* Campaign sources worst-completion first (the eroding source Home
     points at), then polst sources by volume — a single question has no
     completion to rank — then the silent sources, newest on top so a
     just-created one is visible. */
  const rows = useMemo(() => {
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
  const votersTile = windowTileDelta(window30.voters, window30.prev?.voters, window30.compareLabel, {
    fallbackDetail: window30.label,
  });
  const activeCount = sources.filter((s) => {
    const m = metaFor(s);
    return m !== null && LIVE_STATUSES.includes(m.status);
  }).length;
  const unassignedCount = sources.filter((s) => !s.linked).length;
  /* Single-question polsts complete by definition (100%), so only sources
     feeding multi-question campaigns can be ranked on completion. */
  const rankable = rows.filter(
    (s) => s.completionRate !== null && s.linked?.type === "campaign",
  );
  const worst = rankable[0];
  const best = rankable[rankable.length - 1];
  const completionScope = `${METRIC_INFO.completionRate} Ranked across campaign sources — a single-question polst always completes.`;

  const columns: Array<DataColumn<Source>> = [
    {
      header: "Source",
      cell: (s) => (
        <div className="min-w-0">
          <p className="font-display font-semibold text-text-primary">{s.name}</p>
          {s.placement ? (
            <p className="mt-0.5 text-xs text-text-secondary">{s.placement}</p>
          ) : null}
        </div>
      ),
    },
    { header: "Kind", cell: (s) => <Chip>{s.kind}</Chip> },
    { header: "Channel", cell: (s) => <span className="text-text-secondary">{s.channel}</span> },
    {
      header: "Linked to",
      cell: (s) => {
        const m = metaFor(s);
        return m ? (
          <span className="block min-w-0">
            <Link to={m.to} className="block truncate text-text-primary hover:text-text-accent">
              {m.name}
            </Link>
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
      cell: (s) => (
        <span className="tabular-nums">{s.voters > 0 ? fmtInt(s.voters) : "—"}</span>
      ),
    },
    {
      header: "Completion",
      align: "right",
      /* Only campaign sources have a real completion story — a single-
         question polst completes the moment it votes, so "100%" would be
         a degenerate stat, not information. */
      cell: (s) => RateCell(s.linked?.type === "campaign" ? s.completionRate : null),
    },
    {
      header: "Last activity",
      cell: (s) => (
        <span className="text-text-secondary">
          {s.lastActivity ? relativeToToday(s.lastActivity) : "—"}
        </span>
      ),
    },
    {
      header: "",
      align: "right",
      // Assign is one click — so is undoing it while the wiring is still
      // clean. Once a source delivered voters its attribution is part of
      // the record: the action disables with the store's reason (and the
      // store refuses regardless).
      cell: (s) =>
        s.linked ? (
          <UnassignButton
            voters={s.voters}
            onClick={() => {
              const result = unassignSource(s.id);
              toast(result.ok ? `${s.name} unassigned` : result.reason);
            }}
          />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAssignTarget(s)}>
            Assign
          </Button>
        ),
    },
  ];

  const qrSources = sources.filter((s) => s.kind === "QR code");
  const liveMeta = (s: Source) => {
    const m = metaFor(s);
    return m && LIVE_STATUSES.includes(m.status) ? m : null;
  };
  const linkAssets = sources.filter(
    (s) => (s.kind === "Share link" || s.kind === "Tracked link") && liveMeta(s),
  );
  const embedAssets = sources.filter((s) => s.kind === "Embed" && liveMeta(s));
  const klaviyo = INTEGRATIONS.find((i) => i.id === "int-klaviyo");

  return (
    <DashboardPage
      actions={
        <Button onClick={() => setAddOpen(true)}>
          <Icon name="add" size={18} />
          Add source
        </Button>
      }
    >
      <SectionGrid>
        <StatTile
          className="lg:col-span-3"
          label="Active sources"
          value={fmtInt(activeCount)}
          detail={unassignedCount > 0 ? `${fmtInt(unassignedCount)} unassigned` : undefined}
          info="Sources assigned to a campaign or polst that is live or scheduled."
        />
        <StatTile
          className="lg:col-span-3"
          label="Voters · last 30 days"
          value={fmtInt(window30.voters)}
          detail={votersTile.detail}
          trend={votersTile.trend}
          info={METRIC_INFO.voters}
        />
        <StatTile
          className="lg:col-span-3"
          label="Best completion"
          value={best?.completionRate != null ? fmtPct(best.completionRate, 0) : "—"}
          detail={best?.name}
          info={completionScope}
        />
        <StatTile
          className="lg:col-span-3"
          label="Lowest completion"
          value={worst?.completionRate != null ? fmtPct(worst.completionRate, 0) : "—"}
          detail={worst?.name}
          info={completionScope}
        />
      </SectionGrid>

      <DashboardCard padded={false}>
        <DataTable
          rows={rows}
          columns={columns}
          emptyLabel="No sources yet — add one to start attributing voters"
        />
      </DashboardCard>

      <DashboardCard title="QR codes">
        {qrSources.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {qrSources.map((s) => {
              const m = metaFor(s);
              return (
                <QrTile
                  key={s.id}
                  source={s}
                  linked={m}
                  onOpen={m ? () => setQrTarget({ source: s, linked: m }) : undefined}
                  onAssign={() => setAssignTarget(s)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="qr_code_2"
            title="No QR codes yet"
            hint="Print one per placement so every scan stays attributed."
            action={{ label: "Add source", onClick: () => setAddOpen(true) }}
          />
        )}
      </DashboardCard>

      <DashboardCard
        title="Links & embeds"
        description="Copy-ready assets for runs that are live or scheduled."
      >
        {linkAssets.length + embedAssets.length ? (
          <div className="space-y-3">
            {linkAssets.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {linkAssets.map((s) => {
                  const m = liveMeta(s)!;
                  return (
                    <SnippetCard
                      key={s.id}
                      title={s.name}
                      description={`Feeds ${m.name}`}
                      code={attributedUrl(m, s.id)}
                    />
                  );
                })}
              </div>
            ) : null}
            {embedAssets.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {embedAssets.map((s) => {
                  const m = liveMeta(s)!;
                  return (
                    <SnippetCard
                      key={s.id}
                      title={s.name}
                      description={`Feeds ${m.name}`}
                      code={embedIframe(m.id)}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState
            icon="link"
            title="No live links yet"
            hint="Share links and embeds appear here while their campaign or polst is live."
            action={{ label: "Add source", onClick: () => setAddOpen(true) }}
          />
        )}
      </DashboardCard>

      <DashboardCard title="Email & influencer platforms">
        <div className="grid gap-3 lg:grid-cols-2">
          {klaviyo ? <ConnectCard integration={klaviyo} /> : null}
          <LockedCard
            title="Influencer tracking"
            chip="Not connected"
            description="Creator benchmarks and story views arrive once a creator platform is connected."
          />
        </div>
      </DashboardCard>

      <AssignSourceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add source"
        confirmLabel="Add source"
        targets={targetOptions(campaigns, polsts)}
        targetHelper={
          <p className="text-xs leading-4 text-text-secondary">
            An unassigned source doesn&rsquo;t collect voters yet — assign it to a campaign
            or polst when you&rsquo;re ready.
          </p>
        }
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
        targetHelper={
          <p className="text-xs leading-4 text-text-secondary">
            From the first scan or click, every voter it collects is attributed here.
          </p>
        }
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

/* ── QR tile ─────────────────────────────────────────────────────── */

function QrTile({
  source,
  linked,
  onOpen,
  onAssign,
}: {
  source: Source;
  linked: LinkedMeta | null;
  onOpen?: () => void;
  onAssign: () => void;
}) {
  return (
    <div className="flex flex-col rounded-md border border-border-default p-4">
      <div className="flex items-start gap-3">
        <IconTile size={12} className="text-icon-primary">
          <Icon name="qr_code_2" size={32} />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-text-primary">{source.name}</p>
          {source.placement ? (
            <p className="mt-0.5 text-xs text-text-secondary">{source.placement}</p>
          ) : null}
          <p className="mt-0.5 truncate text-xs">
            {linked ? (
              <Link to={linked.to} className="text-text-secondary hover:text-text-accent">
                Feeds {linked.name}
              </Link>
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
        items={[
          { label: "Scans", value: source.views > 0 ? fmtInt(source.views) : "—" },
          { label: "Voters", value: source.voters > 0 ? fmtInt(source.voters) : "—" },
          // A single-question polst always "completes" — its honest QR
          // stat is scan → vote conversion instead.
          linked?.type === "polst"
            ? { label: "Conversion", value: pct(source.voters, source.views) }
            : {
                label: "Completion",
                value: source.completionRate !== null ? fmtPct(source.completionRate, 0) : "—",
              },
        ]}
      />
      <div className="mt-3 flex gap-2">
        {onOpen ? (
          <Button variant="secondary" size="sm" onClick={onOpen}>
            <Icon name="qr_code_2" size={18} />
            QR code
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={onAssign}>
            Assign
          </Button>
        )}
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
        linked: { type: "campaign" as const, id: c.id },
      })),
    ...polsts
      .filter((p) => open(p.status))
      .map((p) => ({
        value: `polst:${p.id}`,
        label: p.question,
        icon: "ballot",
        linked: { type: "polst" as const, id: p.id },
      })),
  ];
}
