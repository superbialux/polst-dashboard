import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { DashboardPage } from "@/components/dashboard";

/* ══════════════════════════════════════════════════════════════════
   ADD NEW — the type chooser ("what do you want to create?").
   Teaches the product's two shapes before asking for any input: one
   polst for a quick decision, or a campaign chaining up to five
   around one business question. Each card is a schematic of the thing
   itself — the OR pair, the numbered chain — never a stock icon.
   ══════════════════════════════════════════════════════════════════ */

/** The single polst, in miniature: two blank options around the OR disc. */
function MiniPolst() {
  return (
    <div className="flex items-center gap-2 rounded-md bg-surface-subtle p-4">
      <span className="h-14 flex-1 rounded-md bg-surface-raised ring-1 ring-border-default" />
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-pill bg-surface-raised font-display text-micro font-semibold text-text-primary shadow-sm">
        OR
      </span>
      <span className="h-14 flex-1 rounded-md bg-surface-raised ring-1 ring-border-default" />
    </div>
  );
}

/** The chain, in miniature: three numbered question rows. */
function MiniChain() {
  return (
    <div className="flex flex-col gap-1.5 rounded-md bg-surface-subtle p-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="flex items-center gap-1.5">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-accent-default font-display text-micro font-semibold text-text-on-accent">
            {n}
          </span>
          <span className="h-5 flex-1 rounded-sm bg-surface-raised ring-1 ring-border-default" />
          <span className="font-display text-micro font-semibold text-text-tertiary">OR</span>
          <span className="h-5 flex-1 rounded-sm bg-surface-raised ring-1 ring-border-default" />
        </div>
      ))}
    </div>
  );
}

type CreateType = {
  chip: { icon: string; label: string };
  title: string;
  description: string;
  bestFor: string[];
  cta: string;
  to: string;
  visual: React.ReactNode;
};

const TYPES: CreateType[] = [
  {
    chip: { icon: "ballot", label: "One question" },
    title: "Single polst",
    description: "Ask one visual this-or-that question and share it anywhere with tracked links.",
    bestFor: ["Quick creative test", "Product A/B", "Headline choice", "Menu item", "Social reaction"],
    cta: "Create polst",
    to: "/polsts/new",
    visual: <MiniPolst />,
  },
  {
    chip: { icon: "campaign", label: "2–5 polsts" },
    title: "Campaign",
    description:
      "Chain up to five polsts in sequence around one business decision and review the combined recommendation.",
    bestFor: ["Product launch", "Packaging decision", "Campaign creative", "Seasonal push", "Naming"],
    cta: "Create campaign",
    to: "/campaigns/new",
    visual: <MiniChain />,
  },
];

function CreateTypeCard({ type }: { type: CreateType }) {
  return (
    <Link
      to={type.to}
      className="group flex flex-col rounded-card border border-border-default bg-surface-raised p-6 shadow-sm transition-colors hover:border-border-strong"
    >
      <span className="mb-3 inline-flex h-6 items-center gap-1.5 self-start rounded-md bg-surface-subtle px-2 text-xs font-medium text-text-secondary">
        <Icon name={type.chip.icon} size={14} />
        {type.chip.label}
      </span>
      {type.visual}
      <h2 className="mt-5 font-display text-lg font-semibold leading-7 tracking-tight text-text-primary">
        {type.title}
      </h2>
      <p className="mt-1.5 text-sm leading-5 text-text-secondary">{type.description}</p>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Best for</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {type.bestFor.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-subtle px-2 py-1 text-xs text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      {/* The house primary button, rendered inert — the card is the link. */}
      <Button asChild className="pointer-events-none mt-6 w-full">
        <span>
          {type.cta}
          <Icon name="arrow_forward" size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Button>
    </Link>
  );
}

export function CreateChoicePage() {
  return (
    <DashboardPage>
      <div className="mx-auto max-w-3xl space-y-8 pt-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold text-text-accent">Add new</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            What do you want to create?
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-5 text-text-secondary">
            Start with one polst for a quick decision, or build a campaign when several polsts
            should answer one larger business question.
          </p>
        </div>
        <div className="grid items-stretch gap-3 md:grid-cols-2">
          {TYPES.map((type) => (
            <CreateTypeCard key={type.title} type={type} />
          ))}
        </div>
        <p className="text-center text-sm text-text-secondary">
          You can always start with one polst and add more later — a campaign chains up to five in
          sequence.
        </p>
      </div>
    </DashboardPage>
  );
}
