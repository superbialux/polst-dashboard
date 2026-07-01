import { Button } from "@/components/ui/button";
import { Icon } from "./Icon";

export function Pagination({
  total = 8,
  current = 0,
}: {
  total?: number;
  current?: number;
}) {
  return (
    <nav
      aria-label="Poll pagination"
      className="flex w-full items-center justify-between px-4"
    >
      <ol className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const isCurrent = i === current;
          return (
            <li key={i}>
              {isCurrent ? (
                <span
                  aria-current="true"
                  className="block h-1.5 w-8 overflow-hidden rounded-full bg-pagination-track"
                >
                  <span className="sr-only">
                    Page {current + 1} of {total}
                  </span>
                  <span
                    aria-hidden
                    className="block h-1.5 rounded-full bg-pagination-fill"
                    style={{ width: `${((current + 1) / total) * 100}%` }}
                  />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="block h-1.5 w-1.5 rounded-full bg-pagination-track"
                />
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex items-center gap-2">
        <Button variant="icon" size="icon" aria-label="Previous poll">
          <Icon name="chevron_left" size={24} />
        </Button>
        <Button variant="icon" size="icon" aria-label="Next poll">
          <Icon name="chevron_right" size={24} />
        </Button>
      </div>
    </nav>
  );
}
