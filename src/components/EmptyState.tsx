import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/** Quiet placeholder for empty tabs, no-result lists, and soft errors:
 *  an icon on a subtle disc, a one-line title, supporting copy, and an
 *  optional action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: string;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-2 grid h-12 w-12 place-items-center rounded-pill bg-surface-subtle">
        <Icon name={icon} size={26} className="text-icon-secondary" />
      </span>
      <h3 className="font-display text-base font-bold leading-6 text-text-primary">
        {title}
      </h3>
      {body && (
        <p className="max-w-72 font-sans text-sm leading-5 text-text-secondary">
          {body}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
