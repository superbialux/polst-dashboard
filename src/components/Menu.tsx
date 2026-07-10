import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/** Anchored dropdown: `trigger` renders the button, `children` the items.
 *  Closes on outside click, Escape, or any item click. */
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
  /** Classes for the positioning wrapper around trigger + panel. */
  rootClassName?: string;
  className?: string;
  /** Keep open after clicks inside (rich panels like notifications). */
  closeOnClick?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    // Menus (not rich panels) move focus to their first item on open.
    if (closeOnClick) {
      const selected = listRef.current?.querySelector<HTMLElement>('[role="menuitem"][aria-pressed="true"]');
      (selected ?? listRef.current?.querySelector<HTMLElement>('[role="menuitem"]'))?.focus();
    }
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
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
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeOnClick]);

  return (
    <div ref={rootRef} className={cn("relative", rootClassName)}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          ref={listRef}
          role={closeOnClick ? "menu" : "dialog"}
          aria-label={label}
          // Item clicks bubble here and close the menu after they run.
          onClick={closeOnClick ? () => {
            setOpen(false);
            requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>("button")?.focus());
          } : undefined}
          className={cn(
            "absolute z-40 min-w-52 rounded-card border border-border-default bg-surface-raised p-1 shadow-lg",
            side === "bottom" ? "top-full mt-1" : "bottom-full mb-1",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children}
        </div>
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
