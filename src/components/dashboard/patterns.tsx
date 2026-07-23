import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/components/Toast";
import {
  Checkbox,
  Field,
  SearchSelect,
  SelectMenu,
  TextInput,
  type SearchSelectOption,
  type SelectOption,
} from "@/components/Field";
import { DashboardCard, DetailList, InfoHint, PollThumb } from "./kit";
import { fmtPct } from "@/lib/canon";
import type { PollOption } from "@/lib/poll";
import type { Channel, Source } from "@/lib/workspace";

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD PATTERNS
   The recurring compositions the DRY audit found written by hand on
   every page — modal footers, confirm/review dialogs, source forms,
   attention queues, list rows. Everything here is presentational and
   data-driven: no store hooks, no derivations — pages pass facts in.
   ══════════════════════════════════════════════════════════════════ */

/* ── Modal footer ────────────────────────────────────────────────── */

/** The one modal action row: buttons on the trailing edge, 16px frame.
 *  `start` pins helper text (a count, a caveat) to the leading edge
 *  without disturbing the button block. */
export function ModalFooter({
  children,
  start,
  className,
}: {
  children: ReactNode;
  /** Left-aligned helper content opposite the buttons. */
  start?: ReactNode;
  className?: string;
}) {
  if (!start) {
    return <div className={cn("flex justify-end gap-2 p-4", className)}>{children}</div>;
  }
  return (
    <div className={cn("flex items-center justify-between gap-3 p-4", className)}>
      <div className="min-w-0 text-sm text-text-secondary">{start}</div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </div>
  );
}

/* ── Confirm modal ───────────────────────────────────────────────── */

/** The one yes/no gate: Cancel + a single verb. Danger tone puts the
 *  filled destructive button on the point-of-no-return action; the
 *  default tone keeps primary for reversible confirmations (unpublish,
 *  revoke). Closing stays the caller's job — confirm handlers usually
 *  need to toast the store's real outcome first. */
export function ConfirmModal({
  open,
  onClose,
  title,
  label,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  confirmDisabled = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Visible header title ("Delete this polst?"). */
  title: string;
  /** Accessible dialog name when it differs from the title. */
  label?: string;
  /** Body copy — what happens and what is (or isn't) lost. */
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  confirmDisabled?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      label={label ?? title}
      title={title}
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "primary"}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      }
    >
      <p className="p-4 text-sm leading-6 text-text-secondary">{children}</p>
    </Modal>
  );
}

/* ── Lock notice ─────────────────────────────────────────────────── */

/** The lock contract, stated before publishing: what freezes and what
 *  stays possible. Quiet surface — a fact, not a warning tone. */
export function LockNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 rounded-md bg-surface-subtle p-3 text-sm leading-5 text-text-secondary",
        className,
      )}
    >
      <Icon name="lock" size={18} className="mt-0.5 shrink-0 text-icon-secondary" />
      <span>{children}</span>
    </p>
  );
}

/* ── Review-before-publish modal ─────────────────────────────────── */

/** The pre-publish gate both editors share: the exact thing voters will
 *  see, the facts of the run, the lock contract, then Back / Confirm.
 *  `factsFirst` flips the facts above the preview (the campaign review
 *  leads with the record; the polst review leads with the card). */
export function ReviewModal({
  open,
  onClose,
  title,
  label,
  children,
  facts,
  factsFirst = false,
  lockText,
  confirmLabel,
  confirmDisabled = false,
  onConfirm,
  backLabel = "Back to editing",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Accessible dialog name when it differs from the title. */
  label?: string;
  /** The preview content — the real card / chain voters will get. */
  children: ReactNode;
  /** The run's facts, spoken through DetailList. */
  facts: Array<[string, ReactNode]>;
  factsFirst?: boolean;
  /** The lock contract for this object. */
  lockText: ReactNode;
  confirmLabel: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  backLabel?: string;
  /** Width override — reviews outgrow the default modal (lg:max-w-xl…). */
  className?: string;
}) {
  const factList = <DetailList items={facts} />;
  return (
    <Modal
      open={open}
      onClose={onClose}
      label={label ?? title}
      title={title}
      className={className}
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            {backLabel}
          </Button>
          <Button disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-4 p-4">
        {factsFirst ? factList : null}
        {children}
        {factsFirst ? null : factList}
        <LockNotice>{lockText}</LockNotice>
      </div>
    </Modal>
  );
}

/* ── Copyable field ──────────────────────────────────────────────── */

/** A value that exists to be copied — mono, full-bleed selectable, with
 *  the honest copy button beside it. Secrets ride `size="xs"` (they're
 *  long); short values keep the sm mono. */
export function CopyableField({
  value,
  label = "Copy",
  successMessage = "Copied to clipboard",
  size = "sm",
  onCopied,
  className,
}: {
  value: string;
  /** The button's verb, e.g. "Copy link". */
  label?: string;
  /** What the toast says when the clipboard write really lands. */
  successMessage?: string;
  size?: "sm" | "xs";
  onCopied?: () => void;
  className?: string;
}) {
  const copy = useCopyToClipboard();
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-border-default bg-surface-subtle p-3",
        className,
      )}
    >
      <code
        className={cn(
          "min-w-0 flex-1 break-all font-mono text-text-primary",
          size === "xs" ? "text-xs" : "text-sm",
        )}
      >
        {value}
      </code>
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          await copy(value, successMessage);
          onCopied?.();
        }}
      >
        {label}
      </Button>
    </div>
  );
}

/* ── Reveal-secret modal ─────────────────────────────────────────── */

/** The show-once surface for minted credentials (API secrets, initial
 *  passwords): why it matters, the value with its copy affordance, and
 *  a single Done. The secret never appears anywhere else. */
export function RevealSecretModal({
  open,
  onClose,
  title,
  intro,
  secret,
  secretSize = "sm",
  copyMessage = "Copied to clipboard",
  hint,
  doneLabel = "Done",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** The show-once contract, in words ("It is shown once — …"). */
  intro: ReactNode;
  secret: string;
  secretSize?: "sm" | "xs";
  /** What the toast says on a successful copy. */
  copyMessage?: string;
  /** Optional trailing note under the secret. */
  hint?: ReactNode;
  doneLabel?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      label={title}
      title={title}
      footer={
        <ModalFooter>
          <Button onClick={onClose}>{doneLabel}</Button>
        </ModalFooter>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-sm leading-6 text-text-secondary">{intro}</p>
        <CopyableField value={secret} size={secretSize} successMessage={copyMessage} />
        {hint ? <p className="text-xs leading-4 text-text-tertiary">{hint}</p> : null}
      </div>
    </Modal>
  );
}

/* ── Sources: vocabulary, form, modals ───────────────────────────────
   The one source vocabulary and the one create-source fieldset, shared
   by every assign/add flow. "Assign" links an existing asset; "Add"
   (Distribution) creates one, optionally pre-linked. */

/** The formats Polst can mint — every one a tracked asset. Single source
 *  of truth: the type narrows to Source["kind"] so the store and the
 *  form agree. */
export const SOURCE_KINDS: Array<Source["kind"]> = ["Share link", "QR code", "Embed"];

/** Where a source gets placed. Polst never operates these channels — it
 *  only counts the voters each placement brings in. */
export const CHANNELS: Channel[] = ["Website", "Email", "Instagram", "In person", "Influencer"];

/** A campaign/polst a source can point at, ready for the search select
 *  (grouped "Campaigns" / "Polsts" so a thousand of each stays findable). */
export type SourceTargetOption = SearchSelectOption & { linked: NonNullable<Source["linked"]> };

/** What the create flow hands back — the store's addSource input shape. */
export type SourceDraft = {
  name: string;
  kind: Source["kind"];
  channel: Channel;
  linked?: Source["linked"];
};

/** The controlled name / kind / channel fieldset every create-source
 *  surface shares. State lives with the caller (or the wrapping modal). */
export function SourceForm({
  name,
  onNameChange,
  kind,
  onKindChange,
  channel,
  onChannelChange,
  namePlaceholder = "Share link — Newsletter",
  gridClassName = "grid gap-4 sm:grid-cols-2",
}: {
  name: string;
  onNameChange: (next: string) => void;
  /** "" is legal — the Distribution flow starts unchosen. */
  kind: string;
  onKindChange: (next: string) => void;
  channel: string;
  onChannelChange: (next: string) => void;
  namePlaceholder?: string;
  /** The kind/channel pair's grid recipe, for faithful call-site swaps. */
  gridClassName?: string;
}) {
  return (
    <>
      <Field label="Name">
        {(id) => (
          <TextInput
            id={id}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={namePlaceholder}
          />
        )}
      </Field>
      {/* The Format/Channel split is taught on the labels, behind info
          hints — explanatory copy never sits under an input. */}
      <div className={gridClassName}>
        <Field
          label="Format"
          hint="The tracked asset Polst generates for you — a share link, a QR code, or an embed."
        >
          {(id) => (
            <SelectMenu
              id={id}
              label="Format"
              value={kind}
              onValueChange={onKindChange}
              options={SOURCE_KINDS.map((k) => ({ value: k, label: k }))}
            />
          )}
        </Field>
        <Field
          label="Channel"
          hint="Where you place the asset. Polst counts the voters each placement brings in."
        >
          {(id) => (
            <SelectMenu
              id={id}
              label="Channel"
              value={channel}
              onValueChange={onChannelChange}
              options={CHANNELS.map((c) => ({ value: c, label: c }))}
            />
          )}
        </Field>
      </div>
    </>
  );
}

/** An unassigned source as the assign list needs it. */
export type UnlinkedSource = Pick<Source, "id" | "name" | "kind" | "channel">;

/** The one create-or-assign source modal, covering both shapes:
 *  - Entity-scoped assign (polst / campaign pages): pass `unlinked` +
 *    `onAssign` — the free sources list renders above the create form,
 *    with the "Unassigned sources" / "Create a new source" headings.
 *  - Library create (Distribution "Add source"): pass `targets` — a
 *    "Link to" select joins the form, headings drop, and the created
 *    draft carries the chosen link (or null).
 *  Field state and the double-click guard live here; the caller owns
 *  the store write and the toast. */
export function AssignSourceModal({
  open,
  onClose,
  title = "Assign source",
  confirmLabel = "Create & assign",
  unlinked = [],
  onAssign,
  targets,
  targetLabel = "Link to",
  targetHint,
  onCreate,
  defaultKind = "Share link",
  defaultChannel = "Website",
  namePlaceholder,
  gridClassName,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  confirmLabel?: string;
  /** Existing free sources to offer before creating a new one. */
  unlinked?: UnlinkedSource[];
  /** One-click assign for a listed source. Enables the list + headings. */
  onAssign?: (source: UnlinkedSource) => void;
  /** Assignable campaigns/polsts. Enables the "Link to" search select. */
  targets?: SourceTargetOption[];
  targetLabel?: string;
  /** Label tooltip — explanation lives on the label, never under the input. */
  targetHint?: string;
  onCreate: (draft: SourceDraft) => void;
  /** Pass "" to force an explicit choice (the Distribution flow). */
  defaultKind?: string;
  defaultChannel?: string;
  namePlaceholder?: string;
  gridClassName?: string;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState(defaultKind);
  const [channel, setChannel] = useState(defaultChannel);
  const [target, setTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setKind(defaultKind);
    setChannel(defaultChannel);
    setTarget("");
    setSubmitting(false);
  }, [open, defaultKind, defaultChannel]);

  const withHeadings = Boolean(onAssign);
  const canSubmit = name.trim().length > 0 && kind !== "" && channel !== "" && !submitting;

  const create = () => {
    if (!canSubmit) return; // a double-click must not mint a duplicate source
    setSubmitting(true);
    onCreate({
      name: name.trim(),
      kind: kind as Source["kind"],
      channel: channel as Channel,
      ...(targets ? { linked: targets.find((t) => t.value === target)?.linked ?? null } : {}),
    });
    setName("");
  };

  return (
    // Titled like the button that opens it, with the standard modal footer
    // (Cancel + primary) every sibling form modal carries.
    <Modal
      open={open}
      onClose={onClose}
      label={title}
      title={title}
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={create}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-4 p-4">
        {onAssign && unlinked.length > 0 ? (
          <div>
            <p className="mb-2 font-display text-sm font-semibold text-text-primary">
              Unassigned sources
            </p>
            <div className="divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
              {unlinked.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{s.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {s.kind} · {s.channel}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => onAssign(s)}>
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="space-y-4">
          {withHeadings ? (
            <p className="font-display text-sm font-semibold text-text-primary">
              Create a new source
            </p>
          ) : null}
          <SourceForm
            name={name}
            onNameChange={setName}
            kind={kind}
            onKindChange={setKind}
            channel={channel}
            onChannelChange={setChannel}
            namePlaceholder={namePlaceholder}
            gridClassName={gridClassName}
          />
          {targets ? (
            <Field label={targetLabel} hint={targetHint}>
              {(id) => (
                <SearchSelect
                  id={id}
                  label={targetLabel}
                  placeholder="Not linked yet"
                  searchPlaceholder="Search campaigns and polsts…"
                  clearLabel="Keep unlinked"
                  options={targets}
                  value={target}
                  onValueChange={setTarget}
                />
              )}
            </Field>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

/** Point an EXISTING source at a campaign or polst (Distribution's row
 *  action). Opens while `source` is non-null; the chosen target's linked
 *  ref and label come back together so the caller's toast can name it. */
export function AssignTargetModal({
  source,
  onClose,
  targets,
  onAssign,
  title = "Assign source",
  targetLabel = "Assign to",
  targetHint,
}: {
  source: { name: string } | null;
  onClose: () => void;
  targets: SourceTargetOption[];
  onAssign: (linked: NonNullable<Source["linked"]>, targetName: string) => void;
  title?: string;
  targetLabel?: string;
  /** Label tooltip — explanation lives on the label, never under the input. */
  targetHint?: string;
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
      label={title}
      title={title}
      footer={
        <ModalFooter>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!chosen}
            onClick={() => {
              if (chosen) {
                onAssign(chosen.linked, chosen.label);
                setTarget("");
              }
            }}
          >
            Assign
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-4 p-4">
        <p className="truncate text-sm text-text-secondary">{source?.name}</p>
        <Field label={targetLabel} hint={targetHint}>
          {(id) => (
            <SearchSelect
              id={id}
              label={targetLabel}
              placeholder="Pick a campaign or polst"
              searchPlaceholder="Search campaigns and polsts…"
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

/* ── Mini stat grid ──────────────────────────────────────────────── */

export type MiniStat = { label: string; value: ReactNode };

/** The in-card evidence strip: a dl of label-over-value pairs. Two
 *  visual cuts, both real: `bordered` sits between hairlines inside a
 *  card body (Home's decision card); `subtle` is the toned inset panel
 *  (Distribution's QR tiles). */
export function MiniStatGrid({
  items,
  cols = 2,
  tone = "bordered",
  className,
}: {
  items: MiniStat[];
  cols?: 2 | 3;
  tone?: "bordered" | "subtle";
  className?: string;
}) {
  return (
    <dl
      className={cn(
        cols === 3 ? "grid-cols-3" : "grid-cols-2",
        tone === "bordered"
          ? "grid gap-3 border-y border-border-default py-3"
          : "grid gap-2 rounded-md bg-surface-subtle p-2.5 text-center",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt
            className={cn(
              "text-xs text-text-secondary",
              tone === "subtle" && "font-medium",
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              "mt-0.5 text-sm font-semibold tabular-nums text-text-primary",
              tone === "subtle" && "font-display",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Ready to decide ─────────────────────────────────────────────── */

/** One decidable campaign, in either physical form: the Home hero card
 *  (eyebrow title, evidence strength, evidence grid, full-width CTA) or the
 *  Analytics list row (name first, verdict + CTA trailing). All props
 *  are pre-derived facts — readyTitle/winnerLabel run at the call site,
 *  never here. */
export function ReadyDecisionRow({
  layout = "row",
  eyebrow,
  title,
  to,
  confidence,
  confidenceInfo,
  note,
  sublabel,
  stats,
  cta,
  more,
  className,
}: {
  layout?: "card" | "row";
  /** The ready-state verdict ("Results ready", "Strong lead"). */
  eyebrow: string;
  /** The campaign's name — always a link to it. */
  title: string;
  to: string;
  /** The composed evidence label ("Strong evidence"); omit on "—". */
  confidence?: string;
  /** The evidence method, one hover away (METRIC_INFO.confidence). */
  confidenceInfo?: string;
  /** Card only: the live-run qualifier ("Collecting until Jun 17"). */
  note?: string;
  /** Row only: the one-line evidence summary under the name. */
  sublabel?: string;
  /** Card only: the evidence pairs (Lead, Voters). */
  stats?: MiniStat[];
  cta: { label: string; to: string };
  /** Card only: the "N more ready" overflow link. */
  more?: { label: string; to: string };
  className?: string;
}) {
  if (layout === "card") {
    return (
      <DashboardCard title={eyebrow} className={className}>
        {confidence ? (
          <p className="flex items-center gap-1 text-sm font-semibold text-status-success">
            {confidence}
            {confidenceInfo ? <InfoHint label="Evidence strength" text={confidenceInfo} /> : null}
          </p>
        ) : null}
        {note ? <p className="mt-0.5 text-xs text-text-secondary">{note}</p> : null}
        <Link
          to={to}
          className="mt-2 block font-display text-base font-semibold leading-6 text-text-primary hover:text-text-accent"
        >
          {title}
        </Link>
        {stats?.length ? <MiniStatGrid className="mt-3" items={stats} /> : null}
        <Button className="mt-3 w-full" asChild>
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
        {more ? (
          <Link
            to={more.to}
            className="mt-2.5 block text-center text-xs font-semibold text-text-accent hover:underline"
          >
            {more.label}
          </Link>
        ) : null}
      </DashboardCard>
    );
  }
  return (
    <li
      className={cn(
        "flex flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <Link
          to={to}
          className="font-display text-sm font-semibold text-text-primary hover:text-text-accent"
        >
          {title}
        </Link>
        {sublabel ? <p className="mt-0.5 text-xs text-text-secondary">{sublabel}</p> : null}
      </div>
      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
        <span className="flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-status-success">
          {eyebrow}
          {confidence ? ` · ${confidence}` : ""}
          {confidence && confidenceInfo ? (
            <InfoHint label="Evidence strength" text={confidenceInfo} />
          ) : null}
        </span>
        <Button variant="secondary" size="sm" asChild>
          <Link to={cta.to}>{cta.label}</Link>
        </Button>
      </div>
    </li>
  );
}

/* ── polst list row ──────────────────────────────────────────────── */

/** A polst named the way every list names one: the split thumb, the
 *  question, and "A vs B" under it. With `to` the whole row links and
 *  the question picks up the hover accent; `meta` pins trailing content
 *  (a StatusBadge, a count) outside the truncation. */
export function PolstListRow({
  options,
  question,
  sublabel,
  to,
  meta,
  className,
}: {
  options: [PollOption, PollOption];
  question: string;
  /** Defaults to "{A} vs {B}" from the option labels. */
  sublabel?: string;
  to?: string;
  meta?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <PollThumb options={options} />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-display text-sm font-semibold text-text-primary",
            to && "group-hover:text-text-accent",
          )}
        >
          {question}
        </span>
        <span className="mt-0.5 block truncate text-xs text-text-secondary">
          {sublabel ?? `${options[0].label} vs ${options[1].label}`}
        </span>
      </span>
    </>
  );
  const rowClass = cn("flex min-w-0 flex-1 items-center gap-3", to && "group", className);
  if (to) {
    return (
      <Link to={to} className={rowClass}>
        {body}
        {meta ? <span className="shrink-0">{meta}</span> : null}
      </Link>
    );
  }
  return (
    <span className={rowClass}>
      {body}
      {meta ? <span className="shrink-0">{meta}</span> : null}
    </span>
  );
}

/* ── Icon button & tile ──────────────────────────────────────────── */
/* Live in a leaf module (ui/icon-button) so Modal/Drawer/kit can use
 * them without importing this file back into their own dependents.
 * Re-exported here so pattern consumers keep one import path. */

export { IconButton, IconTile, type IconButtonProps } from "@/components/ui/icon-button";

/* ── Checklists ──────────────────────────────────────────────────── */

const CHECK_TONES = {
  done: { icon: "check_circle", filled: true, ink: "text-status-success" },
  todo: { icon: "radio_button_unchecked", filled: false, ink: "text-text-tertiary" },
  warning: { icon: "error", filled: true, ink: "text-status-warning" },
} as const;

/** A read-only checklist row: state icon + line. `center` is the
 *  publish-readiness cut (done items fade out of the way); `start` is
 *  the reading cut for findings/caveats, where every line matters
 *  equally and wraps at leading-6. */
export function ChecklistItem({
  tone,
  align = "center",
  children,
  className,
}: {
  tone: keyof typeof CHECK_TONES;
  align?: "center" | "start";
  children: ReactNode;
  className?: string;
}) {
  const t = CHECK_TONES[tone];
  const centered = align === "center";
  return (
    <li
      className={cn(
        "flex text-sm",
        centered ? "items-center gap-2.5" : "items-start gap-2.5 leading-6",
        className,
      )}
    >
      <Icon
        name={t.icon}
        size={20}
        filled={t.filled}
        className={cn("shrink-0", t.ink, !centered && "mt-0.5")}
      />
      <span
        className={
          centered
            ? tone === "done"
              ? "text-text-tertiary"
              : "text-text-primary"
            : "text-text-secondary"
        }
      >
        {children}
      </span>
    </li>
  );
}

export type CheckboxListItem = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
};

/** The pick-several list (API scopes, webhook events): each row is one
 *  full-width click target around a real Checkbox. `mono` sets the code
 *  voice for identifier-shaped labels (event names). */
export function CheckboxList({
  items,
  onToggle,
  mono = false,
  className,
}: {
  items: CheckboxListItem[];
  onToggle: (id: string, next: boolean) => void;
  mono?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li key={item.id}>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2.5 text-sm text-text-primary",
              mono && "font-mono",
            )}
          >
            <Checkbox
              label={item.label}
              checked={item.checked}
              onCheckedChange={(next) => onToggle(item.id, next)}
            />
            {item.description ? (
              <span className="min-w-0">
                <span className="block">{item.label}</span>
                <span className="block font-sans text-xs text-text-secondary">
                  {item.description}
                </span>
              </span>
            ) : (
              item.label
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}

/* ── Unassign button ─────────────────────────────────────────────── */

/** The voters-guarded unassign action. Once a source delivered voters
 *  its attribution is part of the record: the button disables with the
 *  reason (and the store refuses regardless). */
export function UnassignButton({
  voters,
  onClick,
  className,
}: {
  voters: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      disabled={voters > 0}
      title={
        voters > 0
          ? "This source has collected voters — its attribution is part of the record."
          : undefined
      }
      onClick={onClick}
    >
      Unassign
    </Button>
  );
}

/* ── Rate cell ───────────────────────────────────────────────────── */

/** A completion-rate table cell: whole-percent, or an honest "—" where
 *  no rate exists (a single-question polst has no completion story). */
export function RateCell(rate: number | null): ReactNode {
  return <span className="tabular-nums">{rate !== null ? fmtPct(rate, 0) : "—"}</span>;
}

/* ── Section nav ─────────────────────────────────────────────────── */

export type SectionNavItem = { id: string; label: string; icon: string };

/** Vertical icon + label section switcher (Settings' left rail) — local
 *  page state, not routing. The active row lifts onto the raised surface
 *  with a hairline ring. Sticky/column placement stays at the call site. */
export function SectionNav({
  items,
  active,
  onSelect,
  label = "Sections",
  className,
}: {
  items: SectionNavItem[];
  active: string;
  onSelect: (id: string) => void;
  /** Accessible name for the nav landmark. */
  label?: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={active === item.id ? "page" : undefined}
              className={cn(
                "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left transition-colors",
                active === item.id
                  ? "bg-surface-raised shadow-sm ring-1 ring-border-default"
                  : "hover:bg-surface-subtle",
              )}
            >
              <Icon
                name={item.icon}
                size={20}
                className={active === item.id ? "text-icon-primary" : "text-icon-secondary"}
              />
              <span className="truncate font-display text-sm font-semibold text-text-primary">
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ── Pager ───────────────────────────────────────────────────────── */

/** The list pagination footer: "X–Y of N {noun}" + Previous/Next.
 *  Renders nothing while everything fits on one page, and clamps to the
 *  last page itself — a filter change that shrinks the result snaps
 *  back instead of showing air. */
export function Pager({
  page,
  pageSize,
  total,
  onPage,
  noun,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  /** Plural noun for the count line ("polsts", "sources"). */
  noun: string;
  className?: string;
}) {
  if (total <= pageSize) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border-default px-4 py-3",
        className,
      )}
    >
      <p className="text-xs tabular-nums text-text-secondary">
        {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, total)} of {total} {noun}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={safePage === 0}
          onClick={() => onPage(safePage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={safePage >= pageCount - 1}
          onClick={() => onPage(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

/* ── Section title ───────────────────────────────────────────────── */

/** The in-card sub-header — quieter than a card title, above a block
 *  the card groups (report sections, "Voters answer in this order"). */
export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h4 className={cn("font-display text-sm font-semibold text-text-secondary", className)}>
      {children}
    </h4>
  );
}
