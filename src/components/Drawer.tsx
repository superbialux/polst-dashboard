import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/** Keep Tab cycling inside the panel while it's open. */
function trapFocus(panel: HTMLElement, e: KeyboardEvent) {
  if (e.key !== "Tab") return;
  const focusables = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !panel.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

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

/** Slide-in panel (left or right) with backdrop + Escape close. The page
 *  translates itself by DRAWER_WIDTH while open (see Trending), so the panel
 *  pushes the screen aside rather than covering it. */
export function Drawer({
  open,
  onClose,
  side = "left",
  title,
  children,
}: DrawerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Disable focus/interaction when closed (kept mounted for the animation).
  useEffect(() => {
    if (rootRef.current) rootRef.current.inert = !open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (panelRef.current) trapFocus(panelRef.current, e);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="fixed inset-0 z-50" aria-hidden={!open}>
      <button
        tabIndex={-1}
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300 dark:bg-black/60",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ width: DRAWER_WIDTH }}
        className={cn(
          "absolute inset-y-0 flex flex-col bg-surface-raised shadow-lg transition-transform duration-300 ease-out",
          side === "left" ? "left-0" : "right-0",
          open
            ? "translate-x-0"
            : side === "left"
              ? "-translate-x-full"
              : "translate-x-full",
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-[calc(1.25rem+env(safe-area-inset-top))]">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            {title}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-pill text-icon-secondary transition-colors hover:bg-surface-subtle"
          >
            <Icon name="close" size={24} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
      </div>
    </div>
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
