import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The right-rail card chrome shared by every sidebar box (trending
 *  topics, highest volume, leaderboards): container radius, default
 *  border, raised surface, the feed card's 10px inset. */
export function RailBox({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border-default bg-card-bg px-2.5 py-2.5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
