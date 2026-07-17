import {
  createContext,
  useCallback,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Toaster, toast as sonnerToast } from "sonner";
import { Icon } from "./Icon";
import { copyText } from "@/lib/utils";

type ToastContextValue = { toast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_MS = 2800;

/** One confirmation at a time: reusing the id makes the next message
 *  replace the current pill instead of stacking under it. */
const TOAST_ID = "app-toast";

/** One short confirmation at a time, announced politely and floated above
 *  the mobile tab bar / desktop content. Rendering is delegated to sonner
 *  (mounted here, bottom-center); each toast draws its own pill so the
 *  surface/border/shadow tokens stay exactly as before. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback((message: string) => {
    sonnerToast.custom(
      (id) => (
        <div className="pointer-events-auto mx-auto flex min-h-10 w-fit max-w-md items-center gap-3 rounded-md border border-border-default bg-surface-raised py-2 pl-3 pr-2 font-display text-sm font-semibold leading-5 text-text-primary shadow-pop">
          <span className="min-w-0 flex-1">{message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => sonnerToast.dismiss(id)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      ),
      { id: TOAST_ID, duration: TOAST_MS },
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster
        position="bottom-center"
        theme="light"
        // bottom-20 above the mobile tab bar, bottom-8 on desktop — the
        // !important overrides beat sonner's own offset styling.
        className="!bottom-20 lg:!bottom-8"
        // z-toast (60): above the z-50 overlay layer. The width cap mirrors
        // the old max-w-md pill; the pill itself hugs its content.
        style={{ zIndex: 60, "--width": "28rem" } as CSSProperties}
        // w-full: the unstyled li shrink-wraps and left-aligns; spanning the
        // toaster lets the pill's mx-auto center it. Only the pill is
        // interactive — the invisible strip must not swallow page clicks.
        toastOptions={{ className: "w-full !pointer-events-none" }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requires ToastProvider");
  return ctx.toast;
}

/** Copy + toast in one move, and the toast tells the truth: the success
 *  message only appears when the clipboard write actually landed. */
export function useCopyToClipboard() {
  const toast = useToast();
  return useCallback(
    async (text: string, successMsg = "Copied to clipboard") => {
      toast(
        (await copyText(text))
          ? successMsg
          : "Copy failed — the browser blocked clipboard access",
      );
    },
    [toast],
  );
}
