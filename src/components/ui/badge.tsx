import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center font-semibold text-xs leading-4 whitespace-nowrap",
  {
    variants: {
      variant: {
        tag: "bg-surface-subtle text-text-primary rounded-full px-2 py-1",
        outline:
          "bg-surface-raised text-text-primary border border-border-accent rounded-md px-3 py-2 text-sm gap-2",
        soft: "bg-surface-subtle text-text-primary rounded-md px-3 py-2 text-sm gap-2",
      },
    },
    defaultVariants: { variant: "tag" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
