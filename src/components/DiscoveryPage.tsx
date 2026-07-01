import { type ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";
import { PageShell } from "./PageShell";
import { PollCard, type PollCardProps } from "./PollCard";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** The grid every feed-plus-rail page shares (matches lib/layout's
 *  column math: rail = 4 cols at each breakpoint). */
export const FEED_RAIL_GRID =
  "flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_304px] lg:items-start xl:grid-cols-[minmax(0,1fr)_352px]";

/** Shared template for the category / hashtag / location pages: ancestry +
 *  title up top, a poll feed on the left, and whatever rail sections the
 *  scope calls for on the right (stacked below the feed on mobile). */
export function DiscoveryPage({
  breadcrumbs = [],
  title,
  subtitle,
  polls,
  emptyTitle,
  notice,
  rail,
}: {
  breadcrumbs?: { label: string; to: string }[];
  title: string;
  subtitle: string;
  polls: PollCardProps[];
  /** Headline for the no-polls state. */
  emptyTitle: string;
  /** Quiet banner above the feed (e.g. when showing fallback content). */
  notice?: string;
  rail: ReactNode;
}) {
  const { signedIn } = useSession();
  const { openAuth, openNewPoll } = useUI();

  return (
    <PageShell>
      <header className="px-0.5 pb-4 lg:pb-5">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="font-display text-xl font-bold leading-7 text-text-primary lg:text-2xl lg:leading-8">
          {title}
        </h1>
        <p className="mt-0.5 font-sans text-sm leading-5 text-text-secondary">
          {subtitle}
        </p>
      </header>

      <div className={FEED_RAIL_GRID}>
        <div className="flex min-w-0 flex-col gap-4">
        {notice && (
          <p className="flex items-center gap-2 rounded-card border border-border-default bg-card-bg px-4 py-3 font-sans text-sm leading-5 text-text-secondary shadow-sm">
            <Icon name="info" size={18} className="shrink-0 text-icon-secondary" />
            {notice}
          </p>
        )}
        <main
          className={cn(
            "flex w-full flex-col overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm",
            polls.length > 0 && "divide-y divide-border-default",
          )}
        >
          {polls.length > 0 ? (
            polls.map((p) => <PollCard key={p.question} {...p} />)
          ) : (
            <EmptyState
              icon="ballot"
              title={emptyTitle}
              body="Be the first to ask the world about this."
              action={
                <button
                  onClick={() => (signedIn ? openNewPoll() : openAuth("signup"))}
                  className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
                >
                  Ask the world
                </button>
              }
            />
          )}
        </main>
        </div>

        <aside aria-label="Related" className="flex flex-col gap-4">
          {rail}
        </aside>
      </div>
    </PageShell>
  );
}
