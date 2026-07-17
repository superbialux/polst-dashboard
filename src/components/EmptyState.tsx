import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Button } from "./ui/button";

export type EmptyStateAction = { label: string; to?: string; onClick?: () => void };

/** The three empty registers (design-references §7a):
 *  - "first-run"  — never had data: sell the value; accent disc, display
 *    headline, ONE violet primary button.
 *  - "no-results" — filters/date range matched nothing: quiet neutral
 *    icon, the reason plus its fix in the hint, a quiet clear action.
 *  - "fork"       — an empty container with more than one way forward:
 *    dashed-border choice cards instead of a dead end.
 *  Omitted, the default keeps today's quiet in-card register. */
export type EmptyStateRegister = "first-run" | "no-results" | "fork";

/** One dashed choice card for the "fork" register. */
export type EmptyStateChoice = {
  icon: string;
  label: string;
  caption?: string;
  to?: string;
  onClick?: () => void;
};

/** Every action renders through the one Button; `to` wins over onClick. */
function ActionButton({
  action,
  variant,
  size,
}: {
  action: EmptyStateAction;
  variant: "primary" | "secondary";
  size: "md" | "sm";
}) {
  if (action.to) {
    return (
      <Button variant={variant} size={size} asChild>
        <Link to={action.to}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button variant={variant} size={size} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

/** A dashed-border fork card: icon disc, label, caption. */
function ChoiceCard({ choice }: { choice: EmptyStateChoice }) {
  const body = (
    <>
      <span className="grid h-10 w-10 place-items-center rounded-pill bg-accent-soft">
        <Icon name={choice.icon} size={22} className="text-accent-default" />
      </span>
      <span className="font-display text-sm font-semibold text-text-primary">
        {choice.label}
      </span>
      {choice.caption ? (
        <span className="text-xs leading-4 text-text-secondary">{choice.caption}</span>
      ) : null}
    </>
  );
  const shell =
    "flex w-52 flex-col items-center gap-2 rounded-md border border-dashed border-border-strong p-5 text-center transition-colors hover:border-border-accent hover:bg-surface-subtle";
  return choice.to ? (
    <Link to={choice.to} className={shell}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={choice.onClick} className={shell}>
      {body}
    </button>
  );
}

/** The kit's one empty pattern — empty tabs, filtered-out lists, soft
 *  errors: an optional icon on a soft wash disc, a semibold one-line
 *  headline, a centered supporting hint capped at max-w-96, and at most
 *  ONE primary action. `register` tunes the anatomy per §7a; the default
 *  stays the quiet in-card recipe (DataTable's `emptyLabel` shares the
 *  same ink). */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  register,
  choices,
  className,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: EmptyStateAction;
  register?: EmptyStateRegister;
  /** Fork register only: the ways forward, as dashed choice cards. */
  choices?: EmptyStateChoice[];
  className?: string;
}) {
  const firstRun = register === "first-run";
  const quiet = register === "no-results";
  const fork = register === "fork";
  // Fork with no explicit choices falls back to its single action as one card.
  const forkChoices: EmptyStateChoice[] =
    fork && !choices?.length && action
      ? [{ icon: icon ?? "add", label: action.label, to: action.to, onClick: action.onClick }]
      : (choices ?? []);
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-6 text-center",
        firstRun ? "py-12" : "py-8",
        className,
      )}
    >
      {icon && !fork ? (
        <span
          className={cn(
            "mb-2 grid place-items-center rounded-pill",
            firstRun ? "h-12 w-12" : "h-10 w-10",
            quiet ? "bg-surface-subtle" : "bg-accent-soft",
          )}
        >
          <Icon
            name={icon}
            size={firstRun ? 24 : 22}
            className={quiet ? "text-icon-secondary" : "text-accent-default"}
          />
        </span>
      ) : null}
      <h3
        className={cn(
          "font-semibold text-text-primary",
          firstRun ? "font-display text-lg leading-7" : "text-sm leading-5",
        )}
      >
        {title}
      </h3>
      {hint ? (
        <p className="max-w-96 text-sm leading-5 text-text-secondary">{hint}</p>
      ) : null}
      {fork ? (
        forkChoices.length ? (
          <div className="mt-4 flex flex-wrap items-stretch justify-center gap-3">
            {forkChoices.map((choice) => (
              <ChoiceCard key={choice.label} choice={choice} />
            ))}
          </div>
        ) : null
      ) : action ? (
        <div className={firstRun ? "mt-4" : "mt-3"}>
          <ActionButton
            action={action}
            variant={firstRun ? "primary" : "secondary"}
            size={firstRun ? "md" : "sm"}
          />
        </div>
      ) : null}
    </div>
  );
}
