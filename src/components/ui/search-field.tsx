import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";

/* The ONE search anatomy (the sidebar's): a 32px bordered row — leading
 * 16px glyph, the field, an optional trailing keycap. Two tones: light
 * for content toolbars, dark for the sidenav rail. Two modes: a real
 * input (list filtering) or a button (opens the ⌘K dialog). */

const TONE = {
  light:
    "border-border-default bg-surface-raised text-text-primary transition-colors focus-within:border-border-accent hover:border-border-strong",
  dark: "border-white/10 text-sidenav-muted transition-colors hover:bg-white/5 hover:text-sidenav-fg",
} as const;

const SHELL = "flex h-8 w-full items-center gap-2 rounded-sm border px-2 text-left text-sm font-medium";

export function SearchField({
  placeholder,
  value,
  onChange,
  tone = "light",
  kbd,
  className,
}: {
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  tone?: keyof typeof TONE;
  /** Trailing keycap hint, e.g. "⌘K". */
  kbd?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn(SHELL, "cursor-text", TONE[tone], className)}>
      <span className="grid size-4 shrink-0 place-items-center">
        <Icon name="search" size={16} />
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-text-tertiary"
      />
      {kbd ? <Keycap tone={tone}>{kbd}</Keycap> : null}
    </label>
  );
}

/** The same shell as a button — the sidebar's ⌘K trigger. */
export function SearchButton({
  label,
  onClick,
  tone = "dark",
  kbd,
  className,
  ...aria
}: {
  label: string;
  onClick: () => void;
  tone?: keyof typeof TONE;
  kbd?: ReactNode;
  className?: string;
  "aria-keyshortcuts"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Search ${label}`}
      className={cn(SHELL, TONE[tone], className)}
      {...aria}
    >
      <span className="grid size-4 shrink-0 place-items-center">
        <Icon name="search" size={16} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {kbd ? <Keycap tone={tone}>{kbd}</Keycap> : null}
    </button>
  );
}

function Keycap({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return (
    <kbd
      className={cn(
        "rounded-sm border px-1 py-0.5 font-sans text-micro font-medium",
        tone === "dark" ? "border-white/10 text-sidenav-muted" : "border-border-default text-text-tertiary",
      )}
    >
      {children}
    </kbd>
  );
}
