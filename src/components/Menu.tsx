import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/** Lets MenuItem honour the enclosing Menu's `closeOnClick` contract. */
const MenuContext = createContext({ closeOnClick: true });

/** Anchored dropdown: `trigger` renders the button, `children` the items.
 *  Built on Radix DropdownMenu — outside-press dismissal, Escape layering
 *  (one press closes only the menu, the next reaches a parent dialog),
 *  keyboard navigation, and collision flipping all come from the primitive.
 *  The panel renders in a body portal, so an `overflow-hidden` card can
 *  never clip a row-action menu; portals stack by DOM order, so a menu
 *  opened inside a Modal renders above it. */
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
  const contentRef = useRef<HTMLDivElement>(null);

  // Menus (not rich panels) hand focus to the selected item on open, so a
  // select reopens on its current value; Radix's default (panel or first
  // item) stands otherwise. Runs a frame late, after Radix's own autofocus.
  useEffect(() => {
    if (!open || !closeOnClick) return;
    const raf = requestAnimationFrame(() => {
      contentRef.current
        ?.querySelector<HTMLElement>('[role="menuitem"][aria-pressed="true"]')
        ?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, closeOnClick]);

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
      <div className={cn("relative", rootClassName)}>
        {/* Radix's Trigger owns the open/close gesture (pointerdown and
            Enter/Space/ArrowDown), so the `toggle` handed to the render
            prop is a no-op — call sites keep wiring `onClick={toggle}`
            and the primitive performs the same flip on the same press,
            without the two racing each other. `open` still reports the
            controlled state for aria-expanded / caret rotation. */}
        <DropdownMenuPrimitive.Trigger asChild>
          {trigger({ open, toggle: () => {} })}
        </DropdownMenuPrimitive.Trigger>
      </div>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          ref={contentRef}
          aria-label={label}
          align={align}
          side={side}
          sideOffset={4}
          collisionPadding={8}
          loop
          // Item clicks bubble here and close the menu after they run;
          // rich panels opt out (and rows like "mark all read" keep the
          // panel open by stopping propagation).
          onClick={closeOnClick ? () => setOpen(false) : undefined}
          // The panel is never narrower than its trigger (208px floor =
          // the old min-w-52), so selects still read as one control.
          style={{ minWidth: "max(var(--radix-dropdown-menu-trigger-width), 13rem)" }}
          className={cn(
            "z-50 rounded-card border border-border-default bg-surface-raised p-1 shadow-lg",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            className,
          )}
        >
          <MenuContext.Provider value={{ closeOnClick }}>
            {children}
          </MenuContext.Provider>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
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
  const { closeOnClick } = useContext(MenuContext);
  return (
    <DropdownMenuPrimitive.Item
      disabled={disabled}
      aria-pressed={selected || undefined}
      onSelect={(e) => {
        if (!closeOnClick) e.preventDefault();
        onClick?.();
      }}
      className={cn(
        "flex w-full select-none items-center gap-2.5 rounded-sm px-2.5 py-2 text-left font-display text-ui font-semibold outline-none transition-colors",
        danger
          ? "text-status-danger data-[highlighted]:bg-status-danger-soft"
          : "text-text-primary data-[highlighted]:bg-surface-subtle",
        selected && !danger && "bg-surface-subtle",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {icon ? <Icon name={icon} size={20} className="shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected ? <Icon name="check" size={18} className="shrink-0 text-accent-default" /> : null}
    </DropdownMenuPrimitive.Item>
  );
}

/** Hairline between groups of menu items. */
export function MenuSeparator() {
  return <div role="separator" className="mx-2 my-1 h-px bg-border-default" />;
}
