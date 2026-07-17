import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-display font-semibold text-sm transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-btn-primary-bg text-btn-primary-fg hover:bg-btn-primary-bg-hover",
        secondary:
          "bg-btn-secondary-bg text-btn-secondary-fg border border-btn-secondary-border hover:bg-btn-secondary-bg-hover",
        ghost:
          "text-text-primary hover:bg-surface-subtle",
        icon:
          "bg-surface-raised border border-border-default text-text-primary hover:bg-surface-subtle",
        // Destructive pair: filled for the point-of-no-return action,
        // secondary chrome + danger ink for its quieter siblings.
        destructive:
          "bg-status-danger text-text-on-accent hover:bg-status-danger-hover",
        "destructive-secondary":
          "bg-btn-secondary-bg text-status-danger border border-btn-secondary-border hover:bg-btn-secondary-bg-hover",
      },
      size: {
        // ONE control height: every button is 32px tall; sizes differ only
        // in horizontal padding (row action < toolbar < page action).
        sm: "h-8 px-2.5",
        md: "h-8 px-3",
        lg: "h-8 px-4",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
