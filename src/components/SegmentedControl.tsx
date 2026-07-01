import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: string;
};

/** Equal-width option group (gender, visibility, appearance): one selected
 *  value on an accent-washed segment, hairline separators between the rest. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex w-full overflow-hidden rounded-md border border-border-default bg-surface-raised",
        className,
      )}
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-1.5 font-display text-sm font-semibold leading-5 transition-colors",
              i > 0 && "border-l border-border-default",
              selected
                ? "bg-accent-soft text-text-accent"
                : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
            )}
          >
            {option.icon && <Icon name={option.icon} size={20} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
