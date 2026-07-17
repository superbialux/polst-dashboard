import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { IconButton } from "@/components/ui/icon-button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible dialog name (also the visible title when `title` is set). */
  label: string;
  /** Visible header title; omit for dialogs that carry their own heading. */
  title?: string;
  /** Below lg the panel fills the screen (creation flows); centered card otherwise. */
  sheetOnMobile?: boolean;
  /** "top" anchors the panel near the top of the viewport — command
   *  palettes and search, where the eye starts at the top bar. */
  placement?: "center" | "top";
  /** Drop the built-in header/close chrome; the dialog supplies its own
   *  affordances (Escape and the backdrop still close it). */
  bare?: boolean;
  /** Pinned action row rendered outside the scroll area. */
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Keep Tab cycling inside the dialog while it's open. */
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

/** Centered dialog over a dimmed backdrop. Stays mounted for the fade,
 *  inert while closed; Escape and the backdrop close it; focus is trapped
 *  inside and handed back to the opener on close. */
export function Modal({
  open,
  onClose,
  label,
  title,
  sheetOnMobile = false,
  placement = "center",
  bare = false,
  footer,
  className,
  children,
}: ModalProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (rootRef.current) rootRef.current.inert = !open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    if (closeRef.current) {
      closeRef.current.focus();
    } else {
      panelRef.current
        ?.querySelector<HTMLElement>("input, select, textarea, button")
        ?.focus();
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // A topmost layer (an open Menu portaled above this dialog) claims
      // Escape by marking it handled — the dialog only closes on the next
      // one. One keypress, one layer.
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
      else if (e.key !== "Escape" && panelRef.current) trapFocus(panelRef.current, e);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div
      ref={rootRef}
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0",
        placement === "top"
          ? "flex items-start justify-center px-4 pb-4 pt-[10vh]"
          : cn("grid place-items-center", sheetOnMobile ? "p-0 lg:p-4" : "p-4"),
      )}
    >
      <button
        tabIndex={-1}
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "relative flex max-h-full w-full flex-col overflow-hidden bg-surface-raised shadow-lg transition-transform duration-200",
          open ? "scale-100" : "scale-[0.98]",
          sheetOnMobile
            ? "h-full max-w-none rounded-none pt-[env(safe-area-inset-top)] lg:h-auto lg:max-w-md lg:rounded-card lg:border lg:border-border-default lg:pt-0"
            : "max-w-md rounded-card border border-border-default",
          className,
        )}
      >
        {!bare ? (
          <div
            className={cn(
              "flex shrink-0 items-center px-4",
              title
                ? "justify-between border-b border-border-default py-2.5"
                : "justify-end pt-3",
            )}
          >
            {title && (
              <h2 className="font-display text-base font-semibold leading-6 text-text-primary">
                {title}
              </h2>
            )}
            <IconButton
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              size="lg"
              shape="pill"
              className="-mr-1.5"
            >
              <Icon name="close" size={22} />
            </IconButton>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div
            className={cn(
              "shrink-0 border-t border-border-default",
              sheetOnMobile && "pb-[env(safe-area-inset-bottom)] lg:pb-0",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
