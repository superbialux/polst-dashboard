import { useRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
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

/** Centered dialog over a dimmed backdrop, built on Radix Dialog — focus
 *  trap, Escape, scroll lock, and focus return all come from the primitive.
 *  Escape layering (an open Menu above the dialog claims the first press)
 *  is handled by Radix's dismissable-layer stack. */
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
  // Radix's default close-focus targets a DialogTrigger, which this API
  // (imperative open/onClose) never renders — so the opener is captured
  // before Radix moves focus in, and handed back explicitly on close.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        {/* duration must ride the data-state variants: the plain utility
            loses specificity to the variant-wrapped animate-in/out. */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        {/* Content doubles as the layout layer (Presence watches the
            portal's direct child for exit animations, so the fade must
            live here). Presses on its padding — outside the panel —
            close the dialog, standing in for the old backdrop button. */}
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocusRef.current?.focus?.();
          }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className={cn(
            "group fixed inset-0 z-50 outline-none data-[state=open]:duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            placement === "top"
              ? "flex items-start justify-center px-4 pb-4 pt-[10vh]"
              : cn("grid place-items-center", sheetOnMobile ? "p-0 lg:p-4" : "p-4"),
          )}
        >
          <div
            className={cn(
              "relative flex max-h-full w-full flex-col overflow-hidden bg-surface-raised shadow-lg",
              "group-data-[state=open]:duration-200 group-data-[state=open]:animate-in group-data-[state=open]:zoom-in-[.98] group-data-[state=closed]:duration-200 group-data-[state=closed]:animate-out group-data-[state=closed]:zoom-out-[.98]",
              sheetOnMobile
                ? "h-full max-w-none rounded-none pt-[env(safe-area-inset-top)] lg:h-auto lg:max-w-md lg:rounded-card lg:border lg:border-border-default lg:pt-0"
                : "max-w-md rounded-card border border-border-default",
              className,
            )}
          >
            {/* Exactly one DialogTitle names the dialog: the visible header
                title when there is one, an sr-only copy of `label` otherwise
                (bare dialogs carry their own visible heading). */}
            {(bare || !title) && (
              <DialogPrimitive.Title className="sr-only">
                {label}
              </DialogPrimitive.Title>
            )}
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
                  <DialogPrimitive.Title asChild>
                    <h2 className="font-display text-base font-semibold leading-6 text-text-primary">
                      {title}
                    </h2>
                  </DialogPrimitive.Title>
                )}
                <DialogPrimitive.Close asChild>
                  <IconButton
                    aria-label="Close"
                    size="lg"
                    shape="pill"
                    className="-mr-1.5"
                  >
                    <Icon name="close" size={22} />
                  </IconButton>
                </DialogPrimitive.Close>
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
