import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/** Shared chrome for every text-ish control so inputs and selects match:
 *  40px tall, control radius, raised surface, default border. */
export const CONTROL =
  "h-10 w-full rounded-md border border-border-default bg-surface-raised font-sans text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-border-accent lg:text-sm";

/** Label + control + optional helper line. The helper doubles as the
 *  success/error slot (see FieldHelper). */
export function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: ReactNode;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-display text-sm font-bold leading-5 text-text-primary"
      >
        {label}
      </label>
      {children(id)}
      {helper}
    </div>
  );
}

/** Status line under a field: a small icon + message in the status ink. */
export function FieldHelper({
  tone,
  children,
}: {
  tone: "success" | "danger" | "neutral";
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-1 font-sans text-xs leading-4",
        tone === "success" && "text-status-success",
        tone === "danger" && "text-status-danger",
        tone === "neutral" && "text-text-secondary",
      )}
    >
      {tone !== "neutral" && (
        <Icon
          name={tone === "success" ? "check_circle" : "error"}
          size={14}
          filled
        />
      )}
      {children}
    </p>
  );
}

/** Text input with an optional leading icon, on the shared control chrome. */
export function TextInput({
  id,
  icon,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: string }) {
  if (!icon) {
    return <input id={id} className={cn(CONTROL, "px-3", className)} {...rest} />;
  }
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 my-auto flex h-5 w-5 items-center justify-center text-icon-tertiary">
        {icon === "search" ? (
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8.75" cy="8.75" r="5.25" />
            <path d="m12.6 12.6 3.4 3.4" />
          </svg>
        ) : (
          <Icon name={icon} size={20} />
        )}
      </span>
      <input id={id} className={cn(CONTROL, "pl-10 pr-3", className)} {...rest} />
    </div>
  );
}

/** Native select on the shared control chrome with our own chevron. */
export function Select({
  id,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        id={id}
        className={cn(CONTROL, "appearance-none px-3 pr-10", className)}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="keyboard_arrow_down"
        size={20}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-icon-secondary"
      />
    </div>
  );
}
