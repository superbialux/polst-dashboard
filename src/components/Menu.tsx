import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/** Anchored dropdown: `trigger` renders the button, `children` the items.
 *  Closes on outside click, Escape, or any item click. The panel renders in
 *  a body portal, fixed-positioned from the trigger's rect (same approach
 *  as the calendar's day popover), so an `overflow-hidden` card can never
 *  clip a row-action menu. */
export function Menu({
  trigger,
  align = "end",
  side = "bottom",
  label,
  rootClassName,
  className,
  closeOnClick = true,
  children,
}: {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
  }) => ReactNode;
  align?: "start" | "end";
  /** Which side of the trigger the panel opens on. */
  side?: "top" | "bottom";
  label: string;
  /** Classes for the wrapper around the trigger. */
  rootClassName?: string;
  className?: string;
  /** Keep open after clicks inside (rich panels like notifications). */
  closeOnClick?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Anchor the fixed panel to the trigger before paint. The panel is never
  // narrower than its trigger (208px floor = the old min-w-52), so selects
  // still read as one control with their input.
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const r = rootRef.current?.getBoundingClientRect();
    if (!r) return;
    const gap = 4;
    // Measurable in the same commit (portal already mounted), so a menu that
    // would leave the viewport flips to the trigger's other side instead.
    const panelHeight = listRef.current?.getBoundingClientRect().height ?? 0;
    const fitsBelow = r.bottom + gap + panelHeight <= window.innerHeight - 8;
    const fitsAbove = r.top - gap - panelHeight >= 8;
    const openBelow = side === "bottom" ? fitsBelow || !fitsAbove : !fitsAbove && fitsBelow;
    const style: CSSProperties = { minWidth: Math.max(r.width, 208) };
    if (openBelow) style.top = r.bottom + gap;
    else style.bottom = window.innerHeight - r.top + gap;
    if (align === "end") style.right = Math.max(8, window.innerWidth - r.right);
    else style.left = Math.max(8, r.left);
    setPos(style);
  }, [open, align, side]);

  useEffect(() => {
    if (!open) return;
    // Menus (not rich panels) move focus to their first item on open.
    if (closeOnClick) {
      const selected = listRef.current?.querySelector<HTMLElement>('[role="menuitem"][aria-pressed="true"]');
      (selected ?? listRef.current?.querySelector<HTMLElement>('[role="menuitem"]'))?.focus();
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    // The panel is fixed, so it can't ride an anchor that scrolls away —
    // close instead of chasing it. Scrolls inside the panel stay open.
    // If focus was inside the panel, hand it back to the trigger so the
    // keyboard user isn't dropped on <body> when the panel unmounts.
    const closeFromLayout = () => {
      const focusWasInside = listRef.current?.contains(document.activeElement);
      setOpen(false);
      if (focusWasInside) rootRef.current?.querySelector<HTMLElement>("button")?.focus();
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && listRef.current?.contains(e.target)) return;
      closeFromLayout();
    };
    const onResize = () => closeFromLayout();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector<HTMLElement>("button")?.focus();
        return;
      }
      // Roving focus over the items with the arrow keys.
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      const items = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
          [],
      );
      if (items.length === 0) return;
      e.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? items.length - 1
            : e.key === "ArrowDown"
              ? (current + 1) % items.length
              : (current - 1 + items.length) % items.length;
      items[next].focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, closeOnClick]);

  return (
    <div ref={rootRef} className={cn("relative", rootClassName)}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {/* Closed = unmounted, so the panel is inert until asked for. */}
      {open &&
        createPortal(
          <div
            ref={listRef}
            role={closeOnClick ? "menu" : "dialog"}
            aria-label={label}
            // Item clicks bubble here and close the menu after they run.
            onClick={closeOnClick ? () => {
              setOpen(false);
              requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("button")?.focus());
            } : undefined}
            style={pos ?? undefined}
            className={cn(
              "fixed z-50 rounded-card border border-border-default bg-surface-raised p-1 shadow-lg",
              className,
            )}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** One menu row: icon + label, with a danger variant for destructive acts. */
export function MenuItem({
  icon,
  label,
  danger = false,
  selected = false,
  disabled = false,
  onClick,
}: {
  icon?: string;
  label: string;
  danger?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      role="menuitem"
      aria-pressed={selected || undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left font-display text-ui font-semibold transition-colors",
        danger
          ? "text-status-danger hover:bg-status-danger-soft"
          : "text-text-primary hover:bg-surface-subtle",
        selected && !danger && "bg-surface-subtle",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {icon ? <Icon name={icon} size={20} className="shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected ? <Icon name="check" size={18} className="shrink-0 text-accent-default" /> : null}
    </button>
  );
}

/** Hairline between groups of menu items. */
export function MenuSeparator() {
  return <div role="separator" className="mx-2 my-1 h-px bg-border-default" />;
}
