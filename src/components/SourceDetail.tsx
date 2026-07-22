import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { QrPanel } from "@/components/DistributionActions";
import {
  Chip,
  MiniStatGrid,
  ModalFooter,
  SnippetCard,
  StatusBadge,
  UnassignButton,
} from "@/components/dashboard";
import { fmtInt, fmtPct, pct, relativeToToday } from "@/lib/canon";
import { embedIframe, shareUrl, type Source, type Status } from "@/lib/workspace";

/* ── Source detail ───────────────────────────────────────────────────
   Clicking a source anywhere (Distribution's table and cards, a
   campaign's Sources tab) opens this one modal: what the source is,
   what it feeds, its numbers, and its working asset — the QR to
   download, the URL or embed code to copy. Assign/unassign lives here
   too, so tables carry no row buttons. */

/** What a source feeds, resolved through the store so renames follow. */
export type LinkedMeta = {
  type: "campaign" | "polst";
  id: string;
  name: string;
  status: Status;
  to: string;
};

/** Share links get the source id appended so every visit stays attributed. */
export const attributedUrl = (meta: LinkedMeta, sourceId: string) =>
  `${shareUrl(meta.type, meta.id)}?src=${sourceId}`;

/** Per-format vocabulary: the glyph, what its volume metric is called
 *  (a QR is scanned, a link or embed is viewed), and the format's
 *  one-line description. */
export const FORMAT_META: Record<Source["kind"], { icon: string; volume: string; blurb: string }> =
  {
    "Share link": {
      icon: "link",
      volume: "Views",
      blurb:
        "Tracked URLs for email, social posts, and creators — every click stays attributed.",
    },
    "QR code": {
      icon: "qr_code_2",
      volume: "Scans",
      blurb: "Print one per placement so every scan stays attributed.",
    },
    Embed: {
      icon: "code",
      volume: "Views",
      blurb: "Drop the iframe on any page and its votes stay attributed.",
    },
  };

/** The card/modal stat trio, shared so every surface reads the same:
 *  volume (scans or views), voters, and completion — or scan→vote
 *  conversion when the source feeds a single-question polst. */
export const sourceStatItems = (source: Source, linked: LinkedMeta | null) => [
  {
    label: FORMAT_META[source.kind].volume,
    value: source.views > 0 ? fmtInt(source.views) : "—",
  },
  { label: "Voters", value: source.voters > 0 ? fmtInt(source.voters) : "—" },
  linked?.type === "polst"
    ? { label: "Conversion", value: pct(source.voters, source.views) }
    : {
        label: "Completion",
        value: source.completionRate !== null ? fmtPct(source.completionRate, 0) : "—",
      },
];

export function SourceDetailModal({
  source,
  linked,
  onClose,
  onAssign,
  onUnassign,
  showOpenLink = true,
}: {
  source: Source | null;
  linked: LinkedMeta | null;
  onClose: () => void;
  onAssign: (source: Source) => void;
  onUnassign: (source: Source) => void;
  /** Off when the modal already sits on the linked object's own page. */
  showOpenLink?: boolean;
}) {
  /* A linked QR opens two-up: the story on the left, the working QR —
     live preview, options, download — on the right, no extra click. */
  const twoUp = Boolean(source && linked && source.kind === "QR code");
  return (
    <Modal
      open={Boolean(source)}
      onClose={onClose}
      label="Source"
      title={source?.name ?? "Source"}
      className={twoUp ? "lg:max-w-2xl" : undefined}
      footer={
        source ? (
          <ModalFooter
            start={
              source.lastActivity
                ? `Last activity ${relativeToToday(source.lastActivity)}`
                : "No activity yet"
            }
          >
            {linked ? (
              <>
                <UnassignButton voters={source.voters} onClick={() => onUnassign(source)} />
                {showOpenLink ? (
                  <Button asChild>
                    <Link to={linked.to}>
                      Open {linked.type === "campaign" ? "campaign" : "polst"}
                    </Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <Button onClick={() => onAssign(source)}>Assign to a run</Button>
            )}
          </ModalFooter>
        ) : undefined
      }
    >
      {source ? (
        <div className={cn("p-4", twoUp && "grid gap-6 lg:grid-cols-2")}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip>{source.kind}</Chip>
              <Chip>{source.channel}</Chip>
              {source.placement ? (
                <span className="text-xs text-text-secondary">{source.placement}</span>
              ) : null}
            </div>

            {linked ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                Feeds{" "}
                {showOpenLink ? (
                  <Link
                    to={linked.to}
                    className="font-semibold text-text-primary hover:text-text-accent"
                  >
                    {linked.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-text-primary">{linked.name}</span>
                )}
                <StatusBadge status={linked.status} />
              </p>
            ) : (
              <p className="text-sm leading-5 text-text-secondary">
                Unassigned — this source has no working asset and collects no voters until it
                feeds a campaign or polst.
              </p>
            )}

            <MiniStatGrid cols={3} tone="subtle" items={sourceStatItems(source, linked)} />

            {linked && source.kind === "Share link" ? (
              <SnippetCard title="Share link" code={attributedUrl(linked, source.id)} />
            ) : null}
            {linked && source.kind === "Embed" ? (
              <SnippetCard title="Embed code" code={embedIframe(linked.id)} />
            ) : null}
          </div>

          {twoUp && linked ? (
            // Keyed per source so options reset between sources.
            <QrPanel
              key={source.id}
              objectName={linked.name}
              url={attributedUrl(linked, source.id)}
            />
          ) : null}
        </div>
      ) : (
        <div className="p-4" />
      )}
    </Modal>
  );
}
