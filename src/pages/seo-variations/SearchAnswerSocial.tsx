import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PollMiniRow } from "@/components/Discover";
import { FEED_RAIL_GRID } from "@/components/DiscoveryPage";
import { DrawerSection } from "@/components/Drawer";
import { EmptyState } from "@/components/EmptyState";
import { TextInput } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { Menu } from "@/components/Menu";
import { MultiPoll } from "@/components/MultiPoll";
import { PageShell } from "@/components/PageShell";
import { PollCard } from "@/components/PollCard";
import { RailBox } from "@/components/RailBox";
import { useToast } from "@/components/Toast";
import { pollSlug, seoAnswerFor, type SeoAnswer } from "@/lib/data";
import { championOf, formatCompact, ladderSteps, type PollOption } from "@/lib/poll";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn, copyText } from "@/lib/utils";
import { NewPollModal, useChallengeFlow, VariationSwitcher } from "./shared";

/**
 * Variation 5 — Social Thread. The aggregated answer rendered as a living
 * Polst conversation: a pinned, verified "Chicago's answer" sits at the head
 * of the thread like the top post everyone's replying to; the champion ladder
 * threads in beneath it as the next item ("Join in — pick yours"); and the
 * finale invites the visitor to reply by creating their own Polst. The rail
 * carries the standings, what's trending nearby, related answers, and the
 * create CTA — all in the feed's own rail chrome, so the page feels native.
 */
export function SearchAnswerSocial() {
  const { slug = "" } = useParams();
  const answer = seoAnswerFor(slug);
  const { signedIn } = useSession();
  const { openAuth, openNewPoll } = useUI();

  const askTheWorld = () => (signedIn ? openNewPoll() : openAuth("signup"));

  if (!answer) {
    return (
      <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
        <VariationSwitcher />
        <h1 className="sr-only">No results</h1>
        <div className="rounded-card border border-border-default bg-card-bg shadow-sm">
          <EmptyState
            icon="search_off"
            title="No one's started this thread yet"
            body="The world hasn't weighed in on this question. Be the first to ask it."
            action={
              <button
                onClick={askTheWorld}
                className="flex h-10 items-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
              >
                <Icon name="add" size={20} weight={600} />
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
      <VariationSwitcher />

      <div className="px-0.5 pb-4 lg:pb-5">
        <Breadcrumbs items={answer.breadcrumbs} />
        <EditableTitle answer={answer} />
        <p className="mt-1.5 max-w-2xl font-sans text-sm leading-5 text-text-secondary">
          {answer.intro}
        </p>
      </div>

      <div className={FEED_RAIL_GRID}>
        {/* The thread: pinned answer → the conversation → reply with your own.
            A hairline spine links the posts like a reply chain. */}
        <main className="flex min-w-0 flex-col">
          <Thread>
            <ThreadItem connectAfter>
              <PinnedAnswer answer={answer} />
            </ThreadItem>
            <ThreadItem>
              <Conversation answer={answer} />
            </ThreadItem>
          </Thread>
        </main>

        <aside aria-label="Related" className="flex flex-col gap-4">
          <RailBox>
            <Standings answer={answer} />
          </RailBox>

          {answer.trendingNearby.length > 0 && (
            <RailBox>
              <DrawerSection
                title={answer.stats.place ? `Trending in ${answer.stats.place}` : "Trending now"}
                seeAll={false}
                className="pt-2"
              >
                <ol>
                  {answer.trendingNearby.map((item, i) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="flex items-center gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
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
              <DrawerSection title="More threads" seeAll={false} className="pt-2">
                <ul className="flex flex-wrap gap-1.5 px-2 pb-1 pt-1">
                  {answer.relatedTopics.map((topic) => (
                    <li key={topic.label}>
                      <Link
                        to={topic.to}
                        className="inline-flex items-center gap-1 rounded-md border border-border-default px-2.5 py-1.5 font-display text-sm font-semibold leading-5 text-text-primary transition-colors hover:border-border-accent hover:bg-accent-soft hover:text-text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
                      >
                        {topic.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </DrawerSection>
            </RailBox>
          )}

          <RailBox className="px-4 py-4">
            <p className="font-display text-sm font-bold leading-5 text-text-primary">
              Got a hotter take?
            </p>
            <p className="mt-0.5 font-sans text-xs leading-4 text-text-secondary">
              Start your own Polst and get {answer.stats.place ?? "the world"} replying.
            </p>
            <button
              onClick={askTheWorld}
              className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
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

/* ------------------------------------------------------------------ */
/* The thread spine — links the posts like a reply chain               */
/* ------------------------------------------------------------------ */

function Thread({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

/** One post in the thread. When `connectAfter`, a hairline drops from this
 *  post's gutter into the next, so the conversation reads as one chain. */
function ThreadItem({
  connectAfter = false,
  children,
}: {
  connectAfter?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pb-4 last:pb-0">
      {connectAfter && (
        <span
          aria-hidden
          className="absolute left-[19px] top-2 bottom-0 w-px bg-border-default lg:left-[23px]"
        />
      )}
      <div className="relative overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editable keyword title                                              */
/* ------------------------------------------------------------------ */

/** The page title. With `keywords`, the subject and place are editable chips
 *  that rebuild the slug within this variation; otherwise the plain title. */
function EditableTitle({ answer }: { answer: SeoAnswer }) {
  const { variant = "social" } = useParams();
  const navigate = useNavigate();
  const k = answer.keywords;

  const go = (subject: string, place?: string) =>
    navigate(
      `/seo/${variant}/${pollSlug(
        place ? `Best ${subject} in ${place}` : `Best ${subject}`,
      )}`,
    );

  if (!k) {
    return (
      <h1 className="mt-1 font-display text-2xl font-bold leading-8 tracking-tight text-text-primary lg:text-3xl lg:leading-9">
        {answer.title}
      </h1>
    );
  }

  return (
    <h1 className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-2xl font-bold leading-8 tracking-tight text-text-primary lg:text-3xl lg:leading-9">
      <span>Best</span>
      <KeywordChip
        label={k.subject}
        title="Change the subject"
        suggestions={k.subjectSuggestions}
        onCommit={(next) => go(next, k.place)}
      />
      {k.place && (
        <>
          <span className="font-bold text-text-secondary">in</span>
          <KeywordChip
            label={k.place}
            title="Change the place"
            suggestions={k.placeSuggestions}
            onCommit={(next) => go(k.subject, next)}
          />
        </>
      )}
    </h1>
  );
}

/** A title word the reader can rewrite — a dotted underline signals it is
 *  editable; clicking opens an editor with a text field + quick picks. */
function KeywordChip({
  label,
  title,
  suggestions = [],
  onCommit,
}: {
  label: string;
  title: string;
  suggestions?: string[];
  onCommit: (value: string) => void;
}) {
  return (
    <Menu
      label={title}
      align="start"
      closeOnClick={false}
      className="w-72 p-0"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={cn(
            "group -mx-1 inline-flex items-center gap-1 rounded-md px-1 underline decoration-dotted decoration-2 underline-offset-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page",
            open
              ? "text-text-accent decoration-accent-default"
              : "text-text-accent decoration-soft-purple hover:decoration-accent-default",
          )}
        >
          {label}
          <Icon
            name="edit"
            size={20}
            className="text-text-accent opacity-60 transition-opacity group-hover:opacity-100 lg:text-[22px]"
          />
        </button>
      )}
    >
      <KeywordEditor initial={label} suggestions={suggestions} onCommit={onCommit} />
    </Menu>
  );
}

function KeywordEditor({
  initial,
  suggestions,
  onCommit,
}: {
  initial: string;
  suggestions: string[];
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const trimmed = value.trim();
  const commit = () => {
    if (trimmed) onCommit(trimmed);
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
        className="flex items-center gap-2"
      >
        <TextInput
          value={value}
          autoFocus
          aria-label="Edit term"
          onChange={(e) => setValue(e.target.value)}
          className="font-display font-bold"
        />
        <button
          type="submit"
          disabled={!trimmed}
          aria-label="Update the question"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-btn-primary-bg text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
        >
          <Icon name="arrow_forward" size={20} weight={600} />
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onCommit(s)}
              className="rounded-pill border border-border-default px-2.5 py-1 font-sans text-xs font-semibold leading-4 text-text-secondary transition-colors hover:border-border-accent hover:bg-accent-soft hover:text-text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The pinned answer — the verified top post of the thread             */
/* ------------------------------------------------------------------ */

/** The head of the thread: the current winner presented like the pinned,
 *  verified post everyone's replying to — author-style identity row with a
 *  crown + green verified mark, the live share set large, and a stat strip. */
function PinnedAnswer({ answer }: { answer: SeoAnswer }) {
  const { leader, stats } = answer;
  const toast = useToast();

  return (
    <article className="flex flex-col">
      {/* Pinned eyebrow — what this post is, in the app's social voice. */}
      <div className="flex items-center gap-1.5 border-b border-border-default bg-surface-subtle px-2.5 py-1.5 lg:px-4">
        <Icon name="push_pin" size={14} className="text-text-secondary" filled />
        <span className="font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-text-secondary">
          Pinned · {stats.place ? `${stats.place}'s answer` : "The answer"}
        </span>
        <span className="ml-auto flex items-center gap-1 font-sans text-xs leading-4 text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-pill bg-status-success" />
          Live
        </span>
      </div>

      {/* Identity row — the "author" is the verified winner. */}
      <div className="flex items-start gap-2.5 px-2.5 pb-2 pt-3 lg:px-4">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-accent-soft lg:h-11 lg:w-11">
          <Icon name="crown" size={24} className="text-text-accent" filled />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1">
            <span className="truncate font-display text-base font-bold leading-5 text-text-primary lg:text-lg lg:leading-6">
              {leader.name}
            </span>
            <Icon
              name="verified"
              size={18}
              filled
              className="shrink-0 text-status-success"
            />
          </span>
          <span className="font-sans text-xs leading-4 text-text-secondary lg:text-sm lg:leading-5">
            Leading the vote · updated {leader.updated}
          </span>
        </div>
        <button
          onClick={async () =>
            toast(
              (await copyText(window.location.href))
                ? "Link copied"
                : "Couldn't copy — try again",
            )
          }
          className="-m-2 grid h-10 w-10 shrink-0 place-items-center rounded-pill text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
          aria-label="Share this answer"
        >
          <Icon name="ios_share" size={20} />
        </button>
      </div>

      {/* The headline answer — the share set large, the way a feed question is. */}
      <div className="px-2.5 pb-3 lg:px-4">
        <p className="flex items-baseline gap-2">
          <span className="font-display text-[44px] font-bold leading-none tracking-tight text-text-primary tabular-nums lg:text-6xl">
            {leader.share}%
          </span>
          <span className="font-sans text-sm leading-5 text-text-secondary">
            of {stats.place ?? "the world"} pick{" "}
            <span className="font-semibold text-text-primary">{leader.name}</span>
          </span>
        </p>
        <p className="mt-1.5 flex items-center gap-1 font-sans text-xs font-semibold leading-4 text-status-success lg:text-sm">
          <Icon name="trending_up" size={16} />
          {leader.trend}
        </p>
      </div>

      {/* Stat strip — the volume behind the answer, threaded as one row. */}
      <dl className="grid grid-cols-3 divide-x divide-border-default border-t border-border-default">
        <Stat value={formatCompact(stats.totalVotes)} label="Votes" />
        <Stat value={formatCompact(stats.answersToday)} label="Today" />
        {stats.place ? (
          <Link
            to={`/place/${encodeURIComponent(stats.place)}`}
            className="group flex flex-col items-center justify-center gap-0.5 px-3 py-3 text-center transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-accent"
          >
            <span className="flex items-center gap-0.5 font-display text-sm font-bold leading-5 text-text-primary group-hover:text-text-accent">
              <Icon name="location_on" size={16} />
              {stats.place}
            </span>
            <span className="font-sans text-xs leading-4 text-text-secondary">
              Explore
            </span>
          </Link>
        ) : (
          <Stat value="Live" label="Public" />
        )}
      </dl>
    </article>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-3 py-3 text-center">
      <dd className="font-display text-base font-bold leading-5 text-text-primary tabular-nums lg:text-lg lg:leading-6">
        {value}
      </dd>
      <dt className="font-sans text-xs leading-4 text-text-secondary">{label}</dt>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The conversation — join in, then reply with your own                */
/* ------------------------------------------------------------------ */

/** The thread's next item: the champion ladder, framed as a reply prompt.
 *  Voting threads the visitor through the contenders; the finale invites the
 *  one reply Polst lives for — creating your own. Falls back to the single
 *  poll when no ladder is authored. */
function Conversation({ answer }: { answer: SeoAnswer }) {
  const { challenge, modal } = useChallengeFlow();
  const steps = answer.ladder ? ladderSteps(answer.ladder.contenders) : [];

  return (
    <article className="flex flex-col">
      <div className="flex items-center gap-2.5 px-2.5 pt-3 lg:px-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-surface-subtle lg:h-11 lg:w-11">
          <Icon name="forum" size={22} className="text-icon-secondary" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="font-display text-base font-bold leading-5 text-text-primary lg:text-lg lg:leading-6">
            Join in — pick yours
          </span>
          <span className="font-sans text-xs leading-4 text-text-secondary lg:text-sm lg:leading-5">
            {answer.stats.answersToday} people replied today
          </span>
        </div>
      </div>

      <div className="px-2.5 pb-3 pt-3 lg:px-4">
        {steps.length > 0 ? (
          <MultiPoll
            steps={steps}
            carryWinner
            bleed="-mx-2.5 lg:-mx-4"
            pad="px-2.5 lg:px-4"
            counterLabel={(a, t) => `Round ${Math.min(a + 1, t)} of ${t}`}
            finalSlide={(answers) => {
              const champ = championOf(steps, answers);
              return <ReplyFinale champion={champ} onChallenge={() => challenge(champ)} />;
            }}
          />
        ) : (
          <PollCard {...answer.poll} />
        )}
      </div>

      <NewPollModal {...modal} />
    </article>
  );
}

/** The last slide — your champion vs. an invitation to reply with your own.
 *  Left: the winner, display-only, in a green verified frame. Right: a dashed
 *  ghost tile that opens the seeded challenge composer. One 4:3 tile, so the
 *  card's silhouette never changes. */
function ReplyFinale({
  champion,
  onChallenge,
}: {
  champion: PollOption;
  onChallenge: () => void;
}) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
        Your pick: {champion.label}
      </h2>

      <div className="flex aspect-[4/3] items-stretch justify-center gap-1">
        {/* Winner — display only, green winner frame + badge, no vote. */}
        <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md border-2 border-status-success bg-option-bg">
          <div className="flex items-center gap-2 px-2 py-2.5 lg:px-3 lg:py-3">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-status-success">
              <Icon name="check" size={14} weight={700} className="text-text-on-accent" />
            </span>
            <span className="truncate font-display text-sm font-semibold leading-5 text-text-primary lg:text-lg lg:leading-6">
              {champion.label}
            </span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <img src={champion.image} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-pill bg-status-success px-2 py-0.5 font-sans text-xs font-semibold leading-4 text-text-on-accent shadow-sm">
              <Icon name="verified" size={14} filled />
              Winner
            </span>
          </div>
        </div>

        {/* Ghost tile — the reply. Dashed, no photo, opens the composer. */}
        <button
          type="button"
          onClick={onChallenge}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-surface-subtle px-4 text-center transition-colors hover:border-border-accent hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
        >
          <span className="grid h-10 w-10 place-items-center rounded-pill bg-surface-raised text-icon-secondary shadow-sm transition-colors group-hover:bg-accent-default group-hover:text-text-on-accent">
            <Icon name="add" size={22} weight={600} />
          </span>
          <span className="font-display text-sm font-bold leading-5 text-text-primary lg:text-base lg:leading-6">
            Know better than {champion.label}?
          </span>
          <span className="font-sans text-xs leading-4 text-text-secondary">
            Reply with your own Polst
          </span>
        </button>
      </div>

      <p className="mt-2 text-center font-sans text-xs leading-4 text-text-secondary lg:mt-3 lg:text-sm lg:leading-5">
        Your champion joins {champion.label} on the board the moment you post.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Standings — the leaderboard as a compact rail box                   */
/* ------------------------------------------------------------------ */

function Standings({ answer }: { answer: SeoAnswer }) {
  const title = answer.stats.place
    ? `${answer.stats.place} standings`
    : "Standings";
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
                    "flex min-w-0 items-center gap-1 truncate font-sans text-sm leading-5",
                    i === 0
                      ? "font-semibold text-text-primary"
                      : "text-text-secondary",
                  )}
                >
                  <span className="truncate">{row.name}</span>
                  {i === 0 && (
                    <Icon
                      name="verified"
                      size={14}
                      filled
                      className="shrink-0 text-status-success"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-sans text-sm leading-5 tabular-nums",
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
