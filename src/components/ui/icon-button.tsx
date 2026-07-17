import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Leaf module — no imports beyond utils, so Modal/Drawer/kit and the
 * dashboard patterns can all consume these without a cycle. */

const ICON_BUTTON_SIZES = {
  /** 28px — toast dismiss, dense rows. */
  sm: "h-7 w-7 rounded-sm",
  /** 32px — the header/toolbar quiet control. */
  md: "h-8 w-8 rounded-md",
  /** 40px — overlay dismiss (Modal/Drawer close). */
  lg: "h-10 w-10 rounded-md",
} as const;

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required — an icon-only control has no other name. */
  "aria-label": string;
  size?: keyof typeof ICON_BUTTON_SIZES;
  shape?: "rounded" | "pill";
};

/** The quiet icon-only control (header bells, pager chevrons, dismiss
 *  crosses): transparent until hovered, then the subtle wash and full
 *  icon ink. Pass the Icon as children so each site keeps its glyph
 *  size. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = "md", shape = "rounded", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "grid shrink-0 place-items-center text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary",
        ICON_BUTTON_SIZES[size],
        shape === "pill" && "rounded-pill",
        className,
      )}
      {...props}
    />
  );
});

const ICON_TILE_SIZES = {
  8: "h-8 w-8",
  9: "h-9 w-9",
  10: "h-10 w-10",
  11: "h-11 w-11",
  12: "h-12 w-12",
} as const;

/** The non-interactive icon disc that anchors rows and tiles (search
 *  hits, calendar items, integrations, QR assets). Subtle wash and
 *  secondary ink by default; className overrides the fill/ink for the
 *  strong and accent variants. */
export function IconTile({
  size = 8,
  className,
  children,
}: {
  size?: keyof typeof ICON_TILE_SIZES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-md bg-surface-subtle text-icon-secondary",
        ICON_TILE_SIZES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
