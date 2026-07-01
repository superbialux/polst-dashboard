import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";

/** 404 — the polite dead end. */
export function NotFound() {
  return (
    <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
      <h1 className="sr-only">Page not found</h1>
      <div className="rounded-card border border-border-default bg-card-bg shadow-sm">
        <EmptyState
          icon="explore_off"
          title="This page doesn't exist"
          body="The link may be broken, or the poll may have been removed."
          action={
            <Link
              to="/"
              className="flex h-10 items-center rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
            >
              Back to Explore
            </Link>
          }
        />
      </div>
    </PageShell>
  );
}
