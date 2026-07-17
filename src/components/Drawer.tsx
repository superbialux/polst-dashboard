import { useRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { IconButton } from "@/components/ui/icon-button";

/** Panel width, shared with the app frame so the screen is pushed aside by
 *  exactly the space the drawer slides into. */
export const DRAWER_WIDTH = "min(84vw, 24rem)";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title: string;
  children: ReactNode;
};

/** Slide-in panel (left or right) with backdrop + Escape close, built on
 *  Radix Dialog (the same primitive as ui/sheet) — focus trap, Escape, and
 *  focus return come from the primitive. The page translates itself by
 *  DRAWER_WIDTH while open (see Trending), so the panel pushes the screen
 *  aside rather than covering it. */
export function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
}: DrawerProps) {
  // Radix's default close-focus targets a DialogTrigger, which this API
  // (imperative open/onClose) never renders — capture the opener before
  // Radix moves focus in and hand it back explicitly on close.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        {/* duration/ease must ride the data-state variants: plain utilities
            lose specificity to the variant-wrapped animate-in/out. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocusRef.current?.focus?.();
          }}
          style={{ width: DRAWER_WIDTH }}
          className={cn(
            "fixed inset-y-0 z-50 flex flex-col bg-surface-raised shadow-lg outline-none data-[state=open]:duration-300 data-[state=open]:ease-out data-[state=open]:animate-in data-[state=closed]:duration-300 data-[state=closed]:ease-out data-[state=closed]:animate-out",
            side === "left"
              ? "left-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
              : "right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          )}
        >
          <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-[calc(1.25rem+env(safe-area-inset-top))]">
            <DialogPrimitive.Title asChild>
              <h2 className="font-display text-2xl font-bold text-text-primary">
                {title}
              </h2>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <IconButton aria-label="Close" size="lg" shape="pill">
                <Icon name="close" size={24} />
              </IconButton>
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Standard drawer section: title with a right-aligned "See all" action on
 *  one row, content below. Both drawers build from this template; boxed
 *  contexts (desktop cards) override the stacking pt-4 via className. */
export function DrawerSection({
  title,
  className,
  seeAll = true,
  seeAllTo,
  children,
}: {
  title: string;
  className?: string;
  /** Hide the "See all" action (e.g. search results). */
  seeAll?: boolean;
  /** Where "See all" goes; without a destination the action is hidden. */
  seeAllTo?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className={cn("pt-4", className)}>
      <div className="flex items-baseline justify-between px-2 pb-1 lg:pb-2">
        <h3 className="font-display text-base font-bold text-text-primary">
          {title}
        </h3>
        {seeAll && seeAllTo && (
          <Link
            to={seeAllTo}
            className="font-sans text-xs font-semibold text-text-accent hover:underline"
          >
            See all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Standard drawer row: a full-width tap target with the shared hover.
 *  rounded-sm: rows nest inside rounded-card boxes, so they take the step
 *  below the container radius. */
export function DrawerRow({
  className,
  onClick,
  to,
  children,
}: {
  className?: string;
  /** In-app action instead of navigation (e.g. fill the search field). */
  onClick?: () => void;
  /** Route the row navigates to (renders a router link). */
  to?: string;
  children: ReactNode;
}) {
  const rowClass = cn(
    "flex items-center gap-3 rounded-sm px-2 py-2.5 transition-colors hover:bg-surface-subtle",
    className,
  );
  if (to) {
    return (
      <Link to={to} className={rowClass}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(rowClass, "w-full text-left")}>
      {children}
    </button>
  );
}
