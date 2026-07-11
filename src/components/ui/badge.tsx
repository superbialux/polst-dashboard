import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** The one non-status chip: plan tags, "Peak" markers, count badges.
 *  Lifecycle state keeps its own component (`StatusBadge` adds the dot and
 *  reads canon's STATUS_TONE); everything else that needs a small toned
 *  label uses this. One radius (soft rounded-md, matching StatusBadge),
 *  one padding recipe, semantic tokens only. */
const chipVariants = cva(
  "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 font-display text-xs font-semibold",
  {
    variants: {
      tone: {
        neutral: "bg-surface-subtle text-text-secondary",
        success: "bg-status-success-soft text-status-success",
        // Amber ink (--color-yellow-ink) on the yellow-15 soft wash — AA-dark.
        warning: "bg-status-warning-soft text-status-warning",
        accent: "bg-accent-soft text-accent-default",
        danger: "bg-status-danger-soft text-status-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

export function Chip({ className, tone, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ tone }), className)} {...props} />;
}
