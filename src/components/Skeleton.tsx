import { cn } from "@/lib/utils";

/** Pulsing placeholder block; compose into per-screen skeletons. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-surface-subtle", className)}
    />
  );
}

/** Loading stand-in matching the poll card's bones: author bar, question,
 *  option pair, meta, actions. */
export function PollCardSkeleton() {
  return (
    <div className="flex w-full flex-col bg-card-bg px-2.5 py-2.5">
      <div className="flex items-center gap-2 pb-3">
        <Skeleton className="h-[34px] w-[34px] rounded-pill lg:h-10 lg:w-10" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="mb-3 h-5 w-3/4 lg:h-7" />
      <div className="flex aspect-[4/3] gap-1">
        <Skeleton className="h-full flex-1" />
        <Skeleton className="h-full flex-1" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="mt-4 flex items-center justify-between pb-1">
        <div className="flex gap-3">
          <Skeleton className="h-5 w-14 rounded-pill" />
          <Skeleton className="h-5 w-14 rounded-pill" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-5 w-5 rounded-pill" />
          <Skeleton className="h-5 w-5 rounded-pill" />
        </div>
      </div>
    </div>
  );
}
