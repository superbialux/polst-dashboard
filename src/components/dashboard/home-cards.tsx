import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { fmtDateRange, fmtInt, pct, relativeToToday } from "@/lib/canon";
import { polstImage, type Campaign } from "@/lib/workspace";
import { CtaButton, MediaFill, StatusBadge, type CardTone } from "./kit";

/* ══════════════════════════════════════════════════════════════════
   HOME CARDS — the Hotjar-home register, in house tokens.
   · HeroBanner — one dismissible full-width invitation with a
     tone-wash illustration; the page's single primary CTA.
   · SuggestionCard/Grid — "Suggested for you": four dismissible
     cards, illustration on top, whole card is the action.
   · CampaignCard — one campaign per card, its running Polsts listed
     inside, so the chain is readable without opening the detail.
   ══════════════════════════════════════════════════════════════════ */

/* ── Hero banner ─────────────────────────────────────────────────── */

export function HeroBanner({
  eyebrow,
  title,
  description,
  cta,
  icon,
  mediaPolstId,
  onDismiss,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta: { label: string; to: string };
  /** Glyph fallback for the illustration slot when no Polst id is given. */
  icon: string;
  /** A real Polst whose A/B pair illustrates the banner — the product
   *  advertises itself instead of a lone glyph in a wash. */
  mediaPolstId?: string;
  onDismiss: () => void;
}) {
  return (
    <section className="relative flex overflow-hidden rounded-card border border-border-default bg-surface-raised shadow-sm">
      <div className="flex min-w-0 flex-1 flex-col items-start p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 font-display text-xl font-semibold leading-7 tracking-tight text-text-primary">
          {title}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm leading-5 text-text-secondary">{description}</p>
        <div className="mt-5">
          <CtaButton cta={cta} variant="primary" />
        </div>
      </div>
      {mediaPolstId ? (
        <div
          aria-hidden
          className="hidden w-2/5 max-w-72 shrink-0 items-center justify-center self-stretch bg-accent-soft sm:flex"
        >
          <span className="relative grid h-28 w-28 grid-cols-2 gap-0.5 overflow-hidden rounded-lg shadow-md ring-4 ring-surface-raised">
            <img
              src={polstImage(mediaPolstId, "a", 240, 320)}
              alt=""
              className="h-full w-full object-cover"
            />
            <img
              src={polstImage(mediaPolstId, "b", 240, 320)}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute left-1/2 top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-surface-raised font-display text-xs font-semibold text-text-primary shadow-sm">
              OR
            </span>
          </span>
        </div>
      ) : (
        <MediaFill
          media={{ tone: "accent", icon }}
          className="hidden w-2/5 max-w-72 shrink-0 self-stretch sm:block"
        />
      )}
      <IconButton aria-label="Dismiss" onClick={onDismiss} className="absolute right-2 top-2">
        <Icon name="close" size={18} />
      </IconButton>
    </section>
  );
}

/* ── Suggested for you ───────────────────────────────────────────── */

export type Suggestion = {
  id: string;
  /** Glyph for the illustration placeholder until real art lands. */
  icon: string;
  tone: CardTone;
  title: string;
  description: string;
  /** The pill's verb — "Review decision", "Assign sources". */
  action: string;
  to: string;
  /** Real illustration, once authored; the tone wash stands in until then. */
  image?: string;
};

/** One suggestion (the Shopify card anatomy): title and description on
 *  top — two lines each, then clamped — and the illustration filling
 *  the bottom, with the action pill floating over it bottom-left on the
 *  same padding line as the text. The whole card is the link; dismiss
 *  never triggers the navigation. */
export function SuggestionCard({
  suggestion,
  onDismiss,
}: {
  suggestion: Suggestion;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="group relative">
      <Link
        to={suggestion.to}
        className="flex h-full flex-col overflow-hidden rounded-card border border-border-default bg-surface-raised shadow-sm transition-colors hover:border-border-strong"
      >
        <span className="block p-4 pb-0">
          <span className="line-clamp-2 font-display text-sm font-semibold leading-5 text-text-primary">
            {suggestion.title}
          </span>
          <span className="mt-1 line-clamp-2 text-sm leading-5 text-text-secondary">
            {suggestion.description}
          </span>
        </span>
        <span className="relative mt-3 block flex-1">
          <MediaFill
            media={{ tone: suggestion.tone, icon: suggestion.icon, src: suggestion.image }}
            className="h-full min-h-32 w-full"
          />
          {/* The house secondary button, rendered inert — the card link
              carries the click. Pinned to the content's padding line. */}
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="pointer-events-none absolute bottom-4 left-4"
          >
            <span>{suggestion.action}</span>
          </Button>
        </span>
      </Link>
      <IconButton
        aria-label={`Dismiss "${suggestion.title}"`}
        size="sm"
        onClick={() => onDismiss(suggestion.id)}
        className="absolute right-1.5 top-1.5 bg-surface-raised opacity-0 shadow-sm transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Icon name="close" size={16} />
      </IconButton>
    </div>
  );
}

export function SuggestionGrid({
  title,
  suggestions,
  onDismiss,
}: {
  title: string;
  suggestions: Suggestion[];
  onDismiss: (id: string) => void;
}) {
  if (!suggestions.length) return null;
  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {suggestions.map((s) => (
          <SuggestionCard key={s.id} suggestion={s} onDismiss={onDismiss} />
        ))}
      </div>
    </section>
  );
}

/* ── Campaign cards ──────────────────────────────────────────────── */

/** A chain question inside a campaign card: the real A/B pair in
 *  miniature, the question, and its votes so far. */
function ChainPolstRow({
  id,
  question,
  meta,
}: {
  id: string;
  question: string;
  meta: string;
}) {
  return (
    <li className="flex items-center gap-2.5 py-2">
      <span className="grid h-8 w-8 shrink-0 grid-cols-2 overflow-hidden rounded-md bg-surface-strong">
        <img src={polstImage(id, "a", 120, 160)} alt="" className="h-full w-full object-cover" />
        <img src={polstImage(id, "b", 120, 160)} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm leading-5 text-text-primary">{question}</span>
      <span className="shrink-0 text-xs tabular-nums text-text-secondary">{meta}</span>
    </li>
  );
}

/** A dot separator between inline stats. */
const StatDot = () => (
  <span aria-hidden className="text-border-strong">
    ·
  </span>
);

function InlineStat({ value, label }: { value: string; label?: string }) {
  return (
    <span>
      <span className="font-semibold tabular-nums text-text-primary">{value}</span>
      {label ? <> {label}</> : null}
    </span>
  );
}

/** One campaign as one card: header states the run, the body lists the
 *  chain's Polsts with their votes — the campaign is readable here
 *  without opening the detail page. */
export function CampaignCard({
  campaign,
  sourceCount,
}: {
  campaign: Campaign;
  sourceCount: number;
}) {
  const live = campaign.status === "Active";
  const stats: ReactNode = live ? (
    <>
      <InlineStat
        value={`${fmtInt(campaign.voters)}${campaign.target ? ` / ${fmtInt(campaign.target)}` : ""}`}
        label="voters"
      />
      <StatDot />
      <InlineStat value={pct(campaign.completed, campaign.voters)} label="completion" />
    </>
  ) : (
    <>
      <span>starts {campaign.startAt ? relativeToToday(campaign.startAt) : "—"}</span>
      <StatDot />
      <InlineStat value={String(sourceCount)} label={sourceCount === 1 ? "source" : "sources"} />
    </>
  );

  return (
    <section className="flex flex-col rounded-card border border-border-default bg-surface-raised p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaign.id}`}
            className="block truncate font-display text-base font-semibold leading-6 text-text-primary hover:underline"
          >
            {campaign.name}
          </Link>
          <p className="mt-0.5 text-xs text-text-secondary">
            {fmtDateRange(campaign.startAt, campaign.endAt)}
          </p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-text-secondary">
        {stats}
      </div>
      {campaign.chain.length ? (
        <ul className="mt-3 divide-y divide-border-default border-t border-border-default">
          {campaign.chain.map((q, i) => (
            <ChainPolstRow
              key={q.id}
              id={q.id}
              question={q.question}
              meta={live ? `${fmtInt(campaign.votesByQuestion[i] ?? 0)} votes` : "staged"}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-3 border-t border-border-default pt-3 text-sm text-text-tertiary">
          No Polsts yet
        </p>
      )}
      <div className="mt-auto pt-3">
        <Link
          to={`/campaigns/${campaign.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-text-accent hover:underline"
        >
          {live ? "Open campaign" : "Review setup"}
          <Icon name="arrow_forward" size={16} />
        </Link>
      </div>
    </section>
  );
}

export function CampaignCardGrid({ children }: { children: ReactNode }) {
  return <div className={cn("grid items-start gap-3 lg:grid-cols-2")}>{children}</div>;
}
