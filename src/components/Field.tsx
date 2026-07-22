import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Menu, MenuItem } from "./Menu";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

/** A definition on hover/focus — the inspectable contract behind a
 *  number or a field label. Keeps explanations out of the layout until
 *  asked; never rendered under an input. Portaled (Radix), so it never
 *  clips inside overflow-hidden panels like modals and cards. */
export function InfoHint({ text, label = "Definition" }: { text: string; label?: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            role="note"
            aria-label={`${label}: ${text}`}
            className="grid cursor-help place-items-center text-icon-tertiary transition-colors hover:text-icon-secondary"
          >
            <Icon name="info" size={14} />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          collisionPadding={8}
          className="w-56 rounded-md border border-border-default bg-surface-raised p-2.5 text-left text-xs font-normal leading-4 text-text-secondary shadow-lg"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Shared chrome for every text-ish control so inputs and selects match:
 *  40px tall, control radius, raised surface, default border. */
export const CONTROL =
  "h-10 w-full rounded-md border border-border-default bg-surface-raised font-sans text-base text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-border-accent lg:text-sm";

/** Label + control + optional helper line. The helper doubles as the
 *  success/error slot (see FieldHelper). `required` marks the label with
 *  a quiet "Required" — real feedback asked for visible required marks.
 *  `hint` puts the field's definition behind an InfoHint on the label —
 *  explanatory copy lives there, never under the input. */
export function Field({
  label,
  helper,
  hint,
  required,
  children,
}: {
  label: string;
  helper?: ReactNode;
  hint?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 font-display text-sm font-semibold leading-5 text-text-primary"
      >
        {label}
        {required ? (
          // The conventional mark, not the word — optional fields simply
          // carry no asterisk.
          <span aria-hidden className="text-status-danger">
            *
          </span>
        ) : null}
        {hint ? <InfoHint text={hint} label={label} /> : null}
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
        <Icon name={icon} size={20} />
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
      // The portaled panel matches the trigger's width by itself.
      rootClassName={compact ? "shrink-0" : "w-full"}
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

/** A SelectMenu-shaped option the search list can also group. */
export type SearchSelectOption = SelectOption & { group?: string };

/** CommandItem, restyled to the house MenuItem look — subtle highlight,
 *  display face — instead of the stock solid-accent row. */
const SEARCH_ITEM =
  "cursor-pointer gap-2.5 px-2.5 py-2 font-display text-sm font-semibold text-text-primary data-[selected=true]:bg-surface-subtle data-[selected=true]:text-text-primary";

/** Searchable single select — the same 40px trigger chrome as SelectMenu,
 *  but the panel opens on a filter box (cmdk). Reach for this whenever
 *  the option list can grow unbounded (campaigns, polsts); a dropdown
 *  you must scroll blind stops working around a few dozen entries. */
export function SearchSelect({
  id,
  label,
  options,
  value,
  onValueChange,
  placeholder = "Select",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  clearLabel,
  className,
}: {
  id?: string;
  label: string;
  options: SearchSelectOption[];
  value: string;
  onValueChange: (next: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** When set, a chosen value can be cleared back to none. */
  clearLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  // Group order follows first appearance; ungrouped options form one
  // headingless group so mixed lists still render.
  const groups = options.reduce<Array<{ heading?: string; items: SearchSelectOption[] }>>(
    (acc, option) => {
      const bucket = acc.find((g) => g.heading === option.group);
      if (bucket) bucket.items.push(option);
      else acc.push({ heading: option.group, items: [option] });
      return acc;
    },
    [],
  );
  const choose = (next: string) => {
    onValueChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          size="lg"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cn(
            "h-10 w-full justify-between px-3 font-sans text-base font-normal lg:text-sm",
            !selected && "text-text-tertiary",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {selected?.icon ? <Icon name={selected.icon} size={18} className="shrink-0" /> : null}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <Icon
            name="arrow_drop_down"
            size={18}
            className={cn("shrink-0 transition-transform", open && "rotate-180")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        {/* Plain substring matching — cmdk's fuzzy default surfaces
            subsequence noise ("picnic" hits "PackagIng dIreCtion"),
            which reads as a broken search on a long list of names. */}
        <Command
          filter={(itemValue, search, keywords) => {
            const haystack = `${itemValue} ${keywords?.join(" ") ?? ""}`.toLowerCase();
            return haystack.includes(search.trim().toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {clearLabel && selected ? (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  keywords={[clearLabel]}
                  className={SEARCH_ITEM}
                  onSelect={() => choose("")}
                >
                  <Icon name="backspace" size={16} className="shrink-0 text-icon-secondary" />
                  <span className="truncate">{clearLabel}</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
            {groups.map((group, i) => (
              <CommandGroup key={group.heading ?? `group-${i}`} heading={group.heading}>
                {group.items.map((option) => (
                  // value keys selection; keywords carry the label so the
                  // filter matches what the user reads, not the slug.
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label]}
                    disabled={option.disabled}
                    className={SEARCH_ITEM}
                    onSelect={() => choose(option.value)}
                  >
                    {option.icon ? (
                      <Icon name={option.icon} size={16} className="shrink-0 text-icon-secondary" />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                    {option.value === value ? (
                      <Icon name="check" size={16} className="ml-auto shrink-0 text-accent-default" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
