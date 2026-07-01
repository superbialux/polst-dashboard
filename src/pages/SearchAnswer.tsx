import { Link, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PollMiniRow } from "@/components/Discover";
import { FEED_RAIL_GRID } from "@/components/DiscoveryPage";
import { DrawerSection } from "@/components/Drawer";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { PageShell } from "@/components/PageShell";
import { PollCard } from "@/components/PollCard";
import { RailBox } from "@/components/RailBox";
import { useToast } from "@/components/Toast";
import { seoAnswerFor, type SeoAnswer } from "@/lib/data";
import { formatCompact } from "@/lib/poll";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn, copyText } from "@/lib/utils";

/** /q/:slug — the aggregated answer page ("Best Burger in Chicago"): the
 *  current leader and live stats up front, the primary poll to vote on,
 *  follow-on questions, and onward paths to topics, tags, and places. */
export function SearchAnswer() {
  const { slug = "" } = useParams();
  const toast = useToast();
  const answer = seoAnswerFor(slug);
  const { signedIn } = useSession();
  const { openAuth, openNewPoll } = useUI();

  const askTheWorld = () => (signedIn ? openNewPoll() : openAuth("signup"));

  if (!answer) {
    return (
      <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
        <h1 className="sr-only">No results</h1>
        <div className="rounded-card border border-border-default bg-card-bg shadow-sm">
          <EmptyState
            icon="search_off"
            title="The world hasn't voted on this yet"
            body="No polls match this question — be the one who asks it."
            action={
              <button
                onClick={askTheWorld}
                className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
              >
                Ask the world
              </button>
            }
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="flex items-start justify-between gap-3 px-0.5 pb-4 lg:pb-5">
        <div className="min-w-0">
          <Breadcrumbs items={answer.breadcrumbs} />
          <h1 className="font-display text-xl font-bold leading-7 text-text-primary lg:text-2xl lg:leading-8">
            {answer.title}
          </h1>
          <p className="mt-0.5 max-w-2xl font-sans text-sm leading-5 text-text-secondary">
            {answer.intro}
          </p>
        </div>
        <button
          onClick={async () =>
            toast(
              (await copyText(window.location.href))
                ? "Link copied"
                : "Couldn't copy — try again",
            )
          }
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-pill border border-btn-secondary-border bg-btn-secondary-bg px-4 font-display text-sm font-bold leading-5 text-btn-secondary-fg transition-colors hover:bg-btn-secondary-bg-hover"
        >
          <Icon name="ios_share" size={18} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </header>

      <AnswerStrip answer={answer} />

      <div className={cn(FEED_RAIL_GRID, "mt-4")}>
        <main className="flex min-w-0 flex-col gap-4">
          {/* The primary poll, votable in place. */}
          <div className="overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm">
            <PollCard {...answer.poll} />
          </div>

          {answer.followOns.length > 0 && (
            <RailBox>
              <DrawerSection title="Continue answering" seeAll={false} className="pt-2">
                <ul className="flex flex-col gap-1">
                  {answer.followOns.map((p) => (
                    <li key={p.question}>
                      <PollMiniRow poll={p} />
                    </li>
                  ))}
                </ul>
              </DrawerSection>
            </RailBox>
          )}
        </main>

        <aside aria-label="Related" className="flex flex-col gap-4">
          <RailBox>
            <Leaderboard answer={answer} />
          </RailBox>

          {answer.trendingNearby.length > 0 && (
            <RailBox>
              <DrawerSection
                title={answer.stats.place ? `Trending in ${answer.stats.place}` : "Trending"}
                seeAll={false}
                className="pt-2"
              >
                <ol>
                  {answer.trendingNearby.map((item, i) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="flex items-center gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-surface-subtle"
                      >
                        <span className="w-4 shrink-0 text-center font-sans text-xs font-medium text-text-secondary">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-text-primary">
                          {item.label}
                        </span>
                        <span className="flex shrink-0 items-center gap-0.5 font-sans text-xs font-semibold text-status-success">
                          <Icon name="trending_up" size={14} />
                          {item.change}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </DrawerSection>
            </RailBox>
          )}

          {answer.relatedTopics.length > 0 && (
            <RailBox>
              <DrawerSection title="Explore more" seeAll={false} className="pt-2">
                <ul className="flex flex-wrap gap-1.5 px-2 pb-1 pt-1">
                  {answer.relatedTopics.map((topic) => (
                    <li key={topic.label}>
                      <Link
                        to={topic.to}
                        className="inline-flex items-center gap-1 rounded-md border border-border-default px-2.5 py-1.5 font-display text-sm font-semibold leading-5 text-text-primary transition-colors hover:bg-surface-subtle"
                      >
                        {topic.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </DrawerSection>
            </RailBox>
          )}

          {/* Create CTA — "have a take of your own?" */}
          <RailBox className="px-4 py-4">
            <p className="font-display text-sm font-bold leading-5 text-text-primary">
              Have a take of your own?
            </p>
            <p className="mt-0.5 font-sans text-xs leading-4 text-text-secondary">
              Create a Polst and get {answer.stats.place ?? "the world"} talking.
            </p>
            <button
              onClick={askTheWorld}
              className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
            >
              <Icon name="add" size={20} weight={600} />
              Ask the world
            </button>
          </RailBox>
        </aside>
      </div>
    </PageShell>
  );
}

/** The headline answer: who leads right now, how fresh it is, and the
 *  volume behind it — Google intent answered before any scrolling. */
function AnswerStrip({ answer }: { answer: SeoAnswer }) {
  const { leader, stats } = answer;
  return (
    <section
      aria-label="Current answer"
      className="grid grid-cols-2 divide-border-default overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm max-lg:divide-y lg:grid-cols-[minmax(0,1.6fr)_1fr_1fr_1fr] lg:divide-x"
    >
      {/* Leader — spans the strip's lead slot. */}
      <div className="col-span-2 flex items-center gap-3 px-4 py-3.5 lg:col-span-1">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-accent-soft">
          <Icon name="crown" size={22} className="text-text-accent" />
        </span>
        <div className="min-w-0">
          <p className="font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-text-accent">
            Current leader
          </p>
          <p className="truncate font-display text-lg font-bold leading-[26px] text-text-primary">
            {leader.name}
          </p>
          <p className="font-sans text-xs leading-4 text-text-secondary">
            {leader.share}% of votes ·{" "}
            <span className="font-semibold text-status-success">
              {leader.trend}
            </span>{" "}
            · updated {leader.updated}
          </p>
        </div>
      </div>

      <Stat value={formatCompact(stats.totalVotes)} label="Total votes" />
      <Stat value={formatCompact(stats.answersToday)} label="Answers today" />
      {stats.place ? (
        <Link
          to={`/place/${encodeURIComponent(stats.place)}`}
          className="group flex flex-col items-center justify-center gap-0.5 px-3 py-3 text-center transition-colors hover:bg-surface-subtle max-lg:col-span-2 max-lg:flex-row max-lg:gap-1.5"
        >
          <Icon name="location_on" size={18} className="text-icon-secondary" />
          <span className="font-display text-sm font-bold leading-5 text-text-primary group-hover:underline">
            Popular in {stats.place}
          </span>
        </Link>
      ) : (
        <Stat value="Live" label="Public opinion" />
      )}
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-3 py-3 text-center">
      <span className="font-display text-lg font-bold leading-6 text-text-primary">
        {value}
      </span>
      <span className="font-sans text-xs leading-4 text-text-secondary">
        {label}
      </span>
    </div>
  );
}

/** Ranked contenders with share bars — the page's data backbone. */
function Leaderboard({ answer }: { answer: SeoAnswer }) {
  const title = answer.stats.place
    ? `${answer.stats.place} leaderboard`
    : "Leaderboard";
  return (
    <DrawerSection title={title} seeAll={false} className="pt-2">
      <ol className="flex flex-col gap-1 px-2 pb-1">
        {answer.leaderboard.map((row, i) => (
          <li key={row.name} className="flex items-center gap-2.5 py-1">
            <span className="w-4 shrink-0 text-center font-sans text-xs font-medium text-text-secondary">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "truncate font-sans text-sm leading-5",
                    i === 0
                      ? "font-semibold text-text-primary"
                      : "text-text-secondary",
                  )}
                >
                  {row.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-sans text-sm leading-5",
                    i === 0
                      ? "font-semibold text-text-primary"
                      : "text-text-secondary",
                  )}
                >
                  {row.share}%
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-surface-strong">
                <div
                  className={cn(
                    "h-full rounded-pill",
                    i === 0 ? "bg-accent-default" : "bg-border-strong",
                  )}
                  style={{ width: `${row.share}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="px-2 pb-1 pt-1 font-sans text-xs leading-4 text-text-secondary">
        {formatCompact(answer.stats.totalVotes)} total votes
      </p>
    </DrawerSection>
  );
}
