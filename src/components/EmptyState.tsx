import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Button } from "./ui/button";

export type EmptyStateAction = { label: string; to?: string; onClick?: () => void };

/** The kit's one empty pattern — empty tabs, filtered-out lists, soft
 *  errors: an optional icon disc, a one-line title, a supporting hint, and
 *  at most one quiet action. Fixed padding and ink so every empty surface
 *  reads identically (DataTable's `emptyLabel` shares the same recipe). */
export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: EmptyStateAction;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 px-6 py-8 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="mb-2 grid h-10 w-10 place-items-center rounded-pill bg-surface-subtle">
          <Icon name={icon} size={22} className="text-icon-secondary" />
        </span>
      ) : null}
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      {hint ? (
        <p className="max-w-72 text-sm leading-5 text-text-secondary">{hint}</p>
      ) : null}
      {action ? (
        <div className="mt-3">
          {action.to ? (
            <Button variant="secondary" size="sm" asChild>
              <Link to={action.to}>{action.label}</Link>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
