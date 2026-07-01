import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { CategoryTabs } from "@/components/CategoryTabs";
import {
  AskTheWorldCard,
  HighestVolumeSection,
  TrendingTopicsSection,
} from "@/components/Discover";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { MobileTabBar } from "@/components/MobileTabBar";
import { PollCard } from "@/components/PollCard";
import { PollCardSkeleton } from "@/components/Skeleton";
import { RailBox } from "@/components/RailBox";
import { FEED_POLLS } from "@/cards/variants";
import { DAILY_SIX_POLL } from "@/lib/data";
import { PAGE_CONTAINER, PAGE_GRID } from "@/lib/layout";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** How long the simulated fetch shows skeletons when switching tabs. */
const TAB_LOAD_MS = 600;

export function Trending() {
  const [scrolled, setScrolled] = useState(false);
  // The active tab lives in the URL (?tab=) so topic links from the rail
  // and the Topics page land on the right slice, and back/forward work.
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "Trending";
  const [loading, setLoading] = useState(false);
  const feedRef = useRef<HTMLElement>(null);
  const { signedIn } = useSession();
  const { openAuth, openNewPoll } = useUI();

  /** The feed is the page's only scroller, so wheel input anywhere else
      (header, trending column, gutters) is forwarded to it. Events over the
      feed itself scroll natively and are left alone. */
  const forwardWheel = (e: React.WheelEvent) => {
    const feed = feedRef.current;
    if (!feed || feed.contains(e.target as Node)) return;
    feed.scrollTop += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  };

  /** Tab switches simulate a fetch: skeletons, then the new slice. */
  const selectTab = (next: string) => {
    if (next === tab) return;
    setParams(next === "Trending" ? {} : { tab: next });
  };
  useEffect(() => {
    setLoading(true);
    feedRef.current?.scrollTo({ top: 0 });
    const t = setTimeout(() => setLoading(false), TAB_LOAD_MS);
    return () => clearTimeout(t);
  }, [tab]);

  const polls = pollsFor(tab, signedIn);

  return (
    <div className="flex h-full flex-col" onWheel={forwardWheel}>
      <a
        href="#poll"
        className="sr-only sr-only-focusable font-display text-sm font-bold"
      >
        Skip to current poll
      </a>

      <Header scrolled={scrolled} />

      {/* The centred container owns both columns and aligns with the fixed
          header above. Only the feed column scrolls — the header and the
          trending column hold still, and the category tabs (top of the
          feed column) slide away under the header's border. */}
      <div
        className={cn(
          PAGE_CONTAINER,
          PAGE_GRID,
          "flex min-h-0 flex-1 flex-col lg:grid-rows-[minmax(0,1fr)]",
        )}
      >
        <main
          id="poll"
          ref={feedRef}
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 8)}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden"
        >
          <CategoryTabs active={tab} onSelect={selectTab} />

          <h1 className="sr-only">Trending polls</h1>

          {/* shrink-0: main is a flex column; without it the wrapper's
              overflow-hidden lets it squish to the viewport instead of
              letting main scroll. */}
          <div className="mt-1 flex w-full shrink-0 flex-col divide-y divide-border-default border-y border-border-default bg-card-bg lg:mb-6 lg:mt-4 lg:overflow-hidden lg:rounded-card lg:border-x lg:shadow-sm">
            {loading ? (
              <>
                <PollCardSkeleton />
                <PollCardSkeleton />
              </>
            ) : polls.length > 0 ? (
              feedCards(polls, tab)
            ) : tab === "Following" && !signedIn ? (
              <EmptyState
                icon="favorite"
                title="See polls from people you follow"
                body="Sign in to build a feed around the creators and topics you care about."
                action={
                  <button
                    onClick={() => openAuth("login")}
                    className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
                  >
                    Log In
                  </button>
                }
              />
            ) : (
              <EmptyState
                icon="ballot"
                title={`No ${tab} polls yet`}
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
          </div>
        </main>

        {/* Desktop trending column — the discover sections, one box each,
            with the feed card's chrome and padding. Fixed beside the
            scrolling feed; the desktop header carries search. */}
        <aside
          className="hidden min-h-0 lg:block"
          aria-label="Trending and discover"
        >
          {/* pt-2 on the sections: box padding (10px) + header inset
              (8px) = 18px, matching the title's inset from the left. */}
          <div className="mt-4 flex flex-col gap-4 pb-6">
            <AskTheWorldCard />

            <RailBox>
              <TrendingTopicsSection className="pt-2" />
            </RailBox>
            <RailBox>
              <HighestVolumeSection className="pt-2" />
            </RailBox>

            {/* Legal */}
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 font-sans text-xs leading-4 text-text-secondary"
            >
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map(
                (label) => (
                  <a
                    key={label}
                    href="#"
                    className="transition-colors hover:text-text-primary hover:underline"
                  >
                    {label}
                  </a>
                ),
              )}
              <span>© 2026 Polst</span>
            </nav>
          </div>
        </aside>
      </div>

      <MobileTabBar />
    </div>
  );
}

/** Feed cards for a tab. The Daily Six rides the Trending feed as its
 *  second card — a multi-step poll is just another kind of poll. */
function feedCards(polls: ReturnType<typeof pollsFor>, tab: string) {
  const cards = polls.map((p) => <PollCard key={p.question} {...p} />);
  if (tab === "Trending") {
    cards.splice(1, 0, <PollCard key="daily-six" {...DAILY_SIX_POLL} />);
  }
  return cards;
}

/** The slice of polls each tab pretends to fetch. */
function pollsFor(tab: string, signedIn: boolean) {
  switch (tab) {
    case "Trending":
      return FEED_POLLS;
    case "For You":
      return [...FEED_POLLS].reverse();
    case "Following":
      return signedIn ? FEED_POLLS.filter((p) => p.isFollowing) : [];
    default:
      return FEED_POLLS.filter((p) => p.categories?.includes(tab));
  }
}

