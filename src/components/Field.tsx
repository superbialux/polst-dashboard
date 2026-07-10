import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Menu, MenuItem } from "./Menu";
import { Button } from "./ui/button";

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

export type SelectOption = {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
};

/** Menu-backed single select. Compact selectors use the same 32px trigger as
 * analytics date ranges; form fields keep the shared 40px input height. */
export function SelectMenu({
  id,
  label,
  options,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Select",
  icon,
  compact = false,
  align = "start",
  name,
  disabled = false,
  className,
}: {
  id?: string;
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (next: string) => void;
  placeholder?: string;
  icon?: string;
  compact?: boolean;
  align?: "start" | "end";
  name?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selected = options.find((option) => option.value === selectedValue);
  const choose = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <>
      <Menu
      label={label}
      align={align}
      rootClassName={compact ? "shrink-0" : "w-full"}
      className={cn(compact ? "min-w-52" : "w-full min-w-full")}
      trigger={({ open, toggle }) => (
        <Button
          id={id}
          type="button"
          variant="secondary"
          size={compact ? "md" : "lg"}
          disabled={disabled}
          onClick={toggle}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "justify-between",
            compact
              ? "max-w-full"
              : "h-10 w-full px-3 font-sans text-base font-normal lg:text-sm",
            !selected && "text-text-tertiary",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {icon ? <Icon name={icon} size={18} className="shrink-0" /> : null}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <Icon
            name="arrow_drop_down"
            size={18}
            className={cn("shrink-0 transition-transform", open && "rotate-180")}
          />
        </Button>
      )}
    >
      {options.map((option) => (
        <MenuItem
          key={option.value}
          icon={option.icon}
          label={option.label}
          selected={option.value === selectedValue}
          disabled={option.disabled}
          onClick={() => choose(option.value)}
        />
      ))}
      </Menu>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
    </>
  );
}

/** Tokenized checkbox with native input semantics and a stable visual across
 * browsers. The transparent input fills the control, so labels and table cells
 * both get the same click target. */
export function Checkbox({
  id,
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  name,
  value,
  disabled = false,
  className,
}: {
  id?: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  name?: string;
  value?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const active = checked ?? internalChecked;
  return (
    <span className={cn("relative inline-grid h-4 w-4 shrink-0 place-items-center", className)}>
      <input
        id={id}
        type="checkbox"
        aria-label={label}
        checked={active}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          if (checked === undefined) setInternalChecked(event.target.checked);
          onCheckedChange?.(event.target.checked);
        }}
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden
        className={cn(
          "grid h-4 w-4 place-items-center rounded-sm border transition-colors",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1",
          active
            ? "border-accent-default bg-accent-default text-text-on-accent"
            : "border-border-strong bg-surface-raised text-transparent",
          disabled && "opacity-50",
        )}
      >
        <Icon name="check" size={14} />
      </span>
    </span>
  );
}
