import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./Icon";
import { copyText } from "@/lib/utils";

type ToastContextValue = { toast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_MS = 2800;

/** One short confirmation at a time, announced politely and floated above
 *  the mobile tab bar / desktop content. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((next: string) => {
    clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-toast flex justify-center px-4 lg:bottom-8"
      >
        {message && (
          <div className="pointer-events-auto flex min-h-10 max-w-md items-center gap-3 rounded-md border border-border-default bg-surface-raised py-2 pl-3 pr-2 font-display text-sm font-semibold leading-5 text-text-primary shadow-pop">
            <span className="min-w-0 flex-1">{message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setMessage(null)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
      </div>
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
