import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import { QrCodeModal } from "@/components/DistributionActions";
import { Field, SelectMenu, TextInput, type SelectOption } from "@/components/Field";
import {
  Chip,
  ConnectCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  EmptyState,
  LockedCard,
  SectionGrid,
  SnippetCard,
  StatTile,
  type DataColumn,
} from "@/components/dashboard";
import { useWorkspace } from "@/lib/store";
import { METRIC_INFO, fmtInt, fmtPct, pct, relativeToToday } from "@/lib/canon";
import { windowDelta } from "@/lib/engine";
import {
  INTEGRATIONS,
  embedIframe,
  shareUrl,
  workspaceWindow,
  type Channel,
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

const KIND_OPTIONS: Array<Source["kind"]> = ["QR code", "Share link", "Embed", "Tracked link"];
const CHANNEL_OPTIONS: Channel[] = ["Website", "Email", "Instagram", "QR", "Influencer"];
const LIVE_STATUSES: Status[] = ["Active", "Scheduled"];

/** Share links get the source id appended so every visit stays attributed. */
const attributedUrl = (meta: LinkedMeta, sourceId: string) =>
  `${shareUrl(meta.type, meta.id)}?src=${sourceId}`;

export function DistributionPage() {
  const toast = useToast();
  const { campaigns, polsts, sources, addSource, assignSource, campaignById, polstById } =
    useWorkspace();
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
     points at), then Polst sources by volume — a single question has no
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
  const votersDelta = window30.prev ? windowDelta(window30.voters, window30.prev.voters) : null;
  const activeCount = sources.filter((s) => {
    const m = metaFor(s);
    return m !== null && LIVE_STATUSES.includes(m.status);
  }).length;
  const unassignedCount = sources.filter((s) => !s.linked).length;
  /* Single-question Polsts complete by definition (100%), so only sources
     feeding multi-question campaigns can be ranked on completion. */
  const rankable = rows.filter(
    (s) => s.completionRate !== null && s.linked?.type === "campaign",
  );
  const worst = rankable[0];
  const best = rankable[rankable.length - 1];
  const completionScope = `${METRIC_INFO.completionRate} Ranked across campaign sources — a single-question Polst always completes.`;

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
              {m.type === "campaign" ? "Campaign" : "Polst"}
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
         question Polst completes the moment it votes, so "100%" would be
         a degenerate stat, not information. */
      cell: (s) => (
        <span className="tabular-nums">
          {s.linked?.type === "campaign" && s.completionRate !== null
            ? fmtPct(s.completionRate, 0)
            : "—"}
        </span>
      ),
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
      cell: (s) =>
        s.linked ? null : (
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
          info="Sources assigned to a campaign or Polst that is live or scheduled."
        />
        <StatTile
          className="lg:col-span-3"
          label="Voters · last 30 days"
          value={fmtInt(window30.voters)}
          detail={
            votersDelta === null || !window30.compareLabel
              ? window30.label
              : `${Math.abs(votersDelta)}% ${window30.compareLabel}`
          }
          trend={
            votersDelta === null || votersDelta === 0 ? "flat" : votersDelta > 0 ? "up" : "down"
          }
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
            hint="Share links and embeds appear here while their campaign or Polst is live."
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

      <AddSourceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        targets={targetOptions(campaigns, polsts)}
        onCreate={(input) => {
          addSource(input);
          setAddOpen(false);
          toast(`${input.name} added`);
        }}
      />
      <AssignSourceModal
        source={assignTarget}
        onClose={() => setAssignTarget(null)}
        targets={targetOptions(campaigns, polsts)}
        onAssign={(source, linked, targetName) => {
          assignSource(source.id, linked);
          setAssignTarget(null);
          toast(`${source.name} assigned to ${targetName}`);
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
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-surface-subtle text-icon-primary">
          <Icon name="qr_code_2" size={32} />
        </span>
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
      <dl className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-surface-subtle p-2.5 text-center">
        {(
          [
            ["Scans", source.views > 0 ? fmtInt(source.views) : "—"],
            ["Voters", source.voters > 0 ? fmtInt(source.voters) : "—"],
            // A single-question Polst always "completes" — its honest QR
            // stat is scan → vote conversion instead.
            linked?.type === "polst"
              ? ["Conversion", pct(source.voters, source.views)]
              : [
                  "Completion",
                  source.completionRate !== null ? fmtPct(source.completionRate, 0) : "—",
                ],
          ] as Array<[string, string]>
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-text-secondary">{label}</dt>
            <dd className="mt-0.5 font-display text-sm font-semibold tabular-nums text-text-primary">
              {value}
            </dd>
          </div>
        ))}
      </dl>
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

type TargetOption = SelectOption & { linked: NonNullable<Source["linked"]> };

/** Campaigns and Polsts a source can feed — nothing ended or archived. */
function targetOptions(
  campaigns: Array<{ id: string; name: string; status: Status }>,
  polsts: Array<{ id: string; question: string; status: Status }>,
): TargetOption[] {
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

/* ── Add source ──────────────────────────────────────────────────── */

function AddSourceModal({
  open,
  onClose,
  targets,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  targets: TargetOption[];
  onCreate: (input: {
    name: string;
    kind: Source["kind"];
    channel: Channel;
    linked?: Source["linked"];
  }) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("");
  const [channel, setChannel] = useState("");
  const [target, setTarget] = useState("");

  const reset = () => {
    setName("");
    setKind("");
    setChannel("");
    setTarget("");
  };
  const close = () => {
    reset();
    onClose();
  };
  const canSubmit = name.trim().length > 0 && kind !== "" && channel !== "";

  return (
    <Modal
      open={open}
      onClose={close}
      label="Add source"
      title="Add source"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              onCreate({
                name: name.trim(),
                kind: kind as Source["kind"],
                channel: channel as Channel,
                linked: targets.find((t) => t.value === target)?.linked ?? null,
              });
              reset();
            }}
          >
            Add source
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <Field label="Name">
          {(id) => (
            <TextInput
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="QR — Farmers market booth"
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kind">
            {(id) => (
              <SelectMenu
                id={id}
                label="Kind"
                options={KIND_OPTIONS.map((k) => ({ value: k, label: k }))}
                value={kind}
                onValueChange={setKind}
              />
            )}
          </Field>
          <Field label="Channel">
            {(id) => (
              <SelectMenu
                id={id}
                label="Channel"
                options={CHANNEL_OPTIONS.map((c) => ({ value: c, label: c }))}
                value={channel}
                onValueChange={setChannel}
              />
            )}
          </Field>
        </div>
        <Field
          label="Link to"
          helper={
            <p className="text-xs leading-4 text-text-secondary">
              Unassigned sources collect without attribution — you can assign one later.
            </p>
          }
        >
          {(id) => (
            <SelectMenu
              id={id}
              label="Link to"
              placeholder="Not linked yet"
              options={targets}
              value={target}
              onValueChange={setTarget}
            />
          )}
        </Field>
      </div>
    </Modal>
  );
}

/* ── Assign an existing source ───────────────────────────────────── */

function AssignSourceModal({
  source,
  onClose,
  targets,
  onAssign,
}: {
  source: Source | null;
  onClose: () => void;
  targets: TargetOption[];
  onAssign: (
    source: Source,
    linked: NonNullable<Source["linked"]>,
    targetName: string,
  ) => void;
}) {
  const [target, setTarget] = useState("");
  const close = () => {
    setTarget("");
    onClose();
  };
  const chosen = targets.find((t) => t.value === target);

  return (
    <Modal
      open={Boolean(source)}
      onClose={close}
      label="Assign source"
      title="Assign source"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!chosen}
            onClick={() => {
              if (source && chosen) {
                onAssign(source, chosen.linked, chosen.label);
                setTarget("");
              }
            }}
          >
            Assign
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <p className="truncate text-sm text-text-secondary">{source?.name}</p>
        <Field
          label="Assign to"
          helper={
            <p className="text-xs leading-4 text-text-secondary">
              From the first scan or click, every voter it collects is attributed here.
            </p>
          }
        >
          {(id) => (
            <SelectMenu
              id={id}
              label="Assign to"
              placeholder="Pick a campaign or Polst"
              options={targets}
              value={target}
              onValueChange={setTarget}
            />
          )}
        </Field>
      </div>
    </Modal>
  );
}
