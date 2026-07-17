import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { PageFooterSlot } from "./Shell";

/* ══════════════════════════════════════════════════════════════════
   WIZARD — the multistep creation chrome (the brand-dashboard
   prototype's flow, on house tokens). A numbered progress rail, a
   centered step heading, and actions in the page's FIXED footer band
   (the shell's PageFooterSlot) so Back/Continue never scroll away.
   ══════════════════════════════════════════════════════════════════ */

/** The one creation journey: choose the shape, author it, review it.
 *  Every create surface positions itself on these three. */
export const CREATE_STEPS = ["Type", "Details", "Review"] as const;

export function WizardProgress({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number; // 1-based
}) {
  return (
    <ol className="flex w-full items-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none sm:gap-3">
            <div
              className="flex min-w-0 items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-pill border font-display text-xs font-semibold transition-colors",
                  done && "border-accent-default bg-accent-default text-text-on-accent",
                  active && "border-accent-default bg-accent-soft text-accent-default",
                  !done && !active && "border-border-default bg-surface-raised text-text-secondary",
                )}
              >
                {done ? <Icon name="check" size={14} /> : step}
              </span>
              <span
                className={cn(
                  "hidden truncate text-sm font-medium sm:block",
                  active ? "text-text-primary" : "text-text-secondary",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span
                aria-hidden
                className={cn("h-px flex-1", done ? "bg-accent-default" : "bg-border-default")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** One wizard step: progress rail, centered heading, content, and the
 *  step's actions pinned in the fixed footer band. `wide` steps (the
 *  composer with its checklist rail) get the full dashboard width. */
export function WizardShell({
  steps = CREATE_STEPS,
  step,
  title,
  subtitle,
  footer,
  wide = false,
  children,
}: {
  steps?: readonly string[];
  step: number;
  title: string;
  subtitle?: string;
  /** Left/right action groups for the fixed footer band. */
  footer?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto space-y-8 pt-2", wide ? "max-w-dashboard" : "max-w-3xl")}>
      <div className={cn("mx-auto", wide && "max-w-3xl")}>
        <WizardProgress steps={steps} current={step} />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        {subtitle ? (
          <p className="mx-auto max-w-xl text-sm leading-5 text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      <div>{children}</div>
      {footer ? (
        <PageFooterSlot>
          <div className="flex flex-wrap items-center justify-between gap-2 py-2">{footer}</div>
        </PageFooterSlot>
      ) : null}
    </div>
  );
}
