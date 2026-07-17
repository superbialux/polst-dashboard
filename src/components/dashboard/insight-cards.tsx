import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import type { Insight, TrendEntry } from "@/lib/insights";

/* ══════════════════════════════════════════════════════════════════
   INSIGHT SURFACES
   The two interpretation components fed by lib/insights.ts:
   · TrendGrid — Apple-Fitness rows: an arrow chip colored by
     desirability (not direction), the week against the 30-day
     baseline, one coaching sentence.
   · InsightCard — Hotjar anatomy: question headline → status pill +
     evidence → what it means → an arrow-link drill-down. One claim
     per card, and every claim carries its numbers.
   Analytics-zone chrome: 1px borders, no shadow — instrumentation,
   not furniture.
   ══════════════════════════════════════════════════════════════════ */

const ARROW_TONES = {
  good: "bg-status-success-soft text-status-success",
  bad: "bg-status-danger-soft text-status-danger",
  neutral: "bg-surface-subtle text-text-secondary",
} as const;

const ARROW_ICONS = { up: "trending_up", down: "trending_down", flat: "trending_flat" } as const;

/** One trend entry: the arrow chip carries the verdict, the numbers
 *  carry the proof, the coaching line carries the next step. */
export function TrendRow({ trend }: { trend: TrendEntry }) {
  return (
    <Link
      to={trend.to}
      className="group flex items-start gap-3 rounded-md border border-border-default bg-surface-raised p-4 transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-pill",
          ARROW_TONES[trend.tone],
        )}
      >
        <Icon name={ARROW_ICONS[trend.arrow]} size={18} />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-sm font-semibold text-text-primary">
            {trend.metric}
          </span>
          <span className="text-xs tabular-nums text-text-secondary">
            {trend.current} · vs {trend.baseline}
          </span>
        </span>
        <span className="mt-1 block text-sm leading-5 text-text-secondary">
          {trend.coaching}
        </span>
      </span>
    </Link>
  );
}

export function TrendGrid({ trends, className }: { trends: TrendEntry[]; className?: string }) {
  if (trends.length === 0) return null;
  return (
    <div className={cn("grid gap-3 lg:grid-cols-3", className)}>
      {trends.map((t) => (
        <TrendRow key={t.metric} trend={t} />
      ))}
    </div>
  );
}

const PILL_TONES = {
  success: "bg-status-success-soft text-status-success",
  warning: "bg-status-warning-soft text-status-warning",
  danger: "bg-status-danger-soft text-status-danger",
  accent: "bg-accent-soft text-accent-default",
  neutral: "bg-surface-subtle text-text-secondary",
} as const;

/** Hotjar's four-part card: ask → answer → meaning → next step. */
export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="flex flex-col rounded-md border border-border-default bg-surface-raised p-4">
      <h3 className="font-display text-sm font-semibold leading-5 text-text-primary">
        {insight.question}
      </h3>
      <p className="mt-2.5 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex h-5 items-center rounded-pill px-2 text-xs font-medium lowercase",
            PILL_TONES[insight.status.tone],
          )}
        >
          {insight.status.label}
        </span>
        <span className="text-sm font-semibold leading-5 text-text-primary">
          {insight.evidence}
        </span>
      </p>
      <p className="mt-2 flex-1 text-sm leading-5 text-text-secondary">
        {insight.interpretation}
      </p>
      <Link
        to={insight.action.to}
        className="mt-3 inline-flex items-center gap-1 self-start text-sm font-semibold text-text-accent hover:underline"
      >
        {insight.action.label}
        <Icon name="arrow_forward" size={16} />
      </Link>
    </div>
  );
}

export function InsightGrid({ insights, className }: { insights: Insight[]; className?: string }) {
  if (insights.length === 0) return null;
  return (
    <div className={cn("grid gap-3 lg:grid-cols-3", className)}>
      {insights.map((i) => (
        <InsightCard key={i.id} insight={i} />
      ))}
    </div>
  );
}
