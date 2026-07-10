import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { pollCity } from "@/lib/data";
import { cn, copyText, prefersReducedMotion } from "@/lib/utils";
import {
  clamp,
  formatCompact,
  formatCount,
  voteShares,
  type PollOption,
  type PollStep,
} from "@/lib/poll";
import { ACCOUNT } from "@/lib/session";
import { TONE, type Tone } from "@/lib/tones";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Menu, MenuItem, MenuSeparator } from "./Menu";
// Render-time-only cycle: MultiPoll builds its slides from this module's
// PollOptionsBlock, and the card renders MultiPoll when `steps` is set.
import { MultiPoll, MultiPollResults } from "./MultiPoll";
import { useToast } from "./Toast";

/** How long the result bars/numbers take to fill, and the pause before the
 *  feed auto-advances to the next poll once they finish. */
export const RESULT_MS = 800;
const AUTOSCROLL_DELAY_MS = 1000;

/** Animates raw progress 0 → 1 over `duration` once `active`; consumers
 *  apply their own easing so the number and the bar can move differently. */
function useProgress(active: boolean, duration = RESULT_MS) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, duration]);
  return progress;
}

/** Shared ease for the results count-up and bar growth — one curve so the
 *  number and the bar move in lockstep, like a vote being counted. */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Poll math/formatting + shared types live in lib/poll; re-exported here so
// existing call sites keep one import path.
export {
  clamp,
  formatCompact,
  formatCount,
  voteShares,
  type PollOption,
  type PollStep,
} from "@/lib/poll";

export type PollCardProps = {
  author: string;
  authorColor?: string;
  authorBadge?: string;
  /** Author photo URL (overrides the colored initials avatar). */
  authorImage?: string;
  isFollowing?: boolean;
  /** Time since posting, e.g. "2h" → rendered "2h ago". */
  postedAgo?: string;
  /** Poster location, e.g. "Portland OR". */
  location?: string;
  /** Up to two category labels shown under the author. */
  categories?: string[];
  question: string;
  options: [PollOption, PollOption];
  /** Multi-step poll: the questions answered in sequence. Everything else
   *  about the card (author, meta, actions) stays a regular poll. */
  steps?: PollStep[];
  /** Champion-ladder mode for `steps` — each step carries the prior pick
   *  forward (passed through to MultiPoll). */
  carryWinner?: boolean;
  /** Custom final slide for `steps`; defaults to the multi-step results. */
  finalSlide?: (answers: number[]) => ReactNode;
  /** Fires once when this card is voted, with the chosen option index — lets a
   *  carousel advance and carry the pick forward. */
  onVote?: (index: number) => void;
  tags?: string[];
  likes: number;
  reposts: number;
  votes: number;
  /** Human time left, e.g. "2h". Rendered as "Ends 2h". */
  timeLeft?: string;
};

/** Content limits. */
const QUESTION_MAX = 48;
const ANSWER_MAX = 18;
const TAGS_MAX = 3;

/** Vote tallies only appear on options at or above this share — losing bars
    carry just their percentage, so their content floor stays narrow and the
    width gap between the two bars remains readable. */
const VOTES_PCT_MIN = 50;

/** Horizontal inset shared by every row of the card — 10px on mobile,
 *  16px on desktop to match the page's 1rem rhythm. Exported so sibling
 *  card types (the multi-step poll) keep the same gutters. */
export const PAD_X = "px-2.5 lg:px-4";

/** Shared type style for the footer stats and action counts. */
const STAT_TEXT =
  "font-sans text-xs font-semibold leading-4 lg:text-sm lg:leading-5";

/** Shared type style for the card's helper/meta lines (author location +
 *  date, categories, hashtags, vote count). */
export const META_TEXT =
  "font-sans text-xs leading-4 text-text-secondary lg:text-sm lg:leading-5";

export function PollCard({
  author,
  authorColor = "var(--avatar-bg-alert)",
  authorBadge,
  isFollowing = false,
  postedAgo,
  location,
  categories = [],
  question,
  options,
  steps,
  carryWinner,
  finalSlide,
  onVote,
  tags = [],
  likes,
  reposts,
  votes,
  timeLeft = "2h",
}: PollCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  const [saved, setSaved] = useState(false);
  /** The account's own polls drop follow/report affordances. */
  const isOwn = author === ACCOUNT.name;
  const hasVoted = selected !== null;
  const category = categories[0];
  const articleRef = useRef<HTMLElement>(null);
  const toast = useToast();

  /** First tap locks in the vote; later taps are ignored. */
  const vote = (i: number) => setSelected((cur) => (cur === null ? i : cur));

  /** After voting, let the result animate, pause, then scroll to the next
   *  poll (a plain jump under reduced motion). */
  useEffect(() => {
    if (!hasVoted) return;
    onVote?.(selected!);
    const t = setTimeout(() => {
      articleRef.current?.nextElementSibling?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    }, RESULT_MS + AUTOSCROLL_DELAY_MS);
    return () => clearTimeout(t);
  }, [hasVoted]);

  return (
    // relative: absolute children (the sr-only live region) must resolve
    // against the card — left static, they'd position against the viewport,
    // escape the feed's overflow clipping, and make the window scrollable.
    <article
      ref={articleRef}
      className="relative flex w-full scroll-mt-2 flex-col bg-card-bg"
    >
      {/* Author bar */}
      <header
        className={cn(
          "flex items-center justify-between gap-2.5 pb-2 pt-2.5",
          PAD_X,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Avatar diameter = author name line + meta line (34 = 18 + 16 on
              mobile, 40 = 20 + 20 on desktop). */}
          <Avatar
            color={authorColor}
            label={authorBadge}
            variant="badge"
            size={34}
            className="lg:h-10 lg:w-10"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-display text-sm font-bold leading-[18px] text-text-primary lg:text-base lg:leading-5">
              {author}
            </span>
            {(location || postedAgo) && (
              <span
                className={cn(
                  "flex min-w-0 items-center gap-1.5 font-normal",
                  META_TEXT,
                )}
              >
                {location && (
                  <Link
                    to={`/place/${encodeURIComponent(pollCity(location) ?? location)}`}
                    className="truncate transition-colors hover:text-text-primary hover:underline"
                  >
                    {location}
                  </Link>
                )}
                {location && postedAgo && <Dot />}
                {postedAgo && <span className="shrink-0">{postedAgo} ago</span>}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 self-start">
          {!isOwn && !following && (
            <button
              onClick={() => setFollowing(true)}
              className="-my-0.5 flex items-center justify-center rounded-md border border-border-default px-2.5 py-1.5 font-display text-sm font-bold leading-5 text-text-primary hover:bg-surface-subtle"
              aria-label={`Follow ${author}`}
            >
              Follow
            </button>
          )}
          <Menu
            label={`More from ${author}`}
            trigger={({ open, toggle }) => (
              <button
                aria-label={`More options for this poll by ${author}`}
                aria-expanded={open}
                onClick={toggle}
                className={cn(
                  "-m-1 grid h-10 w-10 place-items-center rounded-pill text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary",
                  open && "bg-surface-subtle text-icon-primary",
                )}
              >
                <Icon name="more_horiz" size={20} />
              </button>
            )}
          >
            {!isOwn && (
              <MenuItem
                icon={following ? "person_remove" : "person_add"}
                label={following ? `Unfollow ${author}` : `Follow ${author}`}
                onClick={() => {
                  setFollowing((v) => !v);
                  toast(
                    following ? `Unfollowed ${author}` : `Following ${author}`,
                  );
                }}
              />
            )}
            <MenuItem
              icon="link"
              label="Copy link"
              onClick={async () =>
                toast(
                  (await copyText(window.location.href))
                    ? "Link copied"
                    : "Couldn't copy — try again",
                )
              }
            />
            {!isOwn && (
              <>
                <MenuSeparator />
                <MenuItem
                  icon="flag"
                  label="Report"
                  danger
                  onClick={() => toast("Report submitted — thank you")}
                />
              </>
            )}
          </Menu>
        </div>
      </header>

      {/* Question + options + tags */}
      <div className={cn("flex flex-col", PAD_X)}>
        {steps ? (
          // Multi-step body: the slides carry the card's padding themselves
          // so the slide-in/out travels the card's full width.
          <MultiPoll
            steps={steps}
            carryWinner={carryWinner}
            bleed="-mx-2.5 lg:-mx-4"
            pad="px-2.5 lg:px-4"
            finalSlide={
              finalSlide ??
              ((answers) => <MultiPollResults steps={steps} answers={answers} />)
            }
          />
        ) : (
          <>
            <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
              {clamp(question, QUESTION_MAX)}
            </h2>

            <PollOptionsBlock
              options={options}
              selected={selected}
              onSelect={vote}
            />

            {/* Results announcement for screen readers (the bars are visual). */}
            <span aria-live="polite" className="sr-only">
              {hasVoted &&
                `You voted ${options[selected].label}. Results: ` +
                  options
                    .map((o, i) => `${o.label} ${voteShares(options)[i]}%`)
                    .join(", ")}
            </span>
          </>
        )}

        {/* Category + hashtags on the left, votes · time left on the right */}
        <div
          className={cn(
            "mt-1.5 flex items-center justify-between gap-3 font-normal lg:mt-2",
            META_TEXT,
          )}
        >
          {/* Category and hashtags lead to their pages. */}
          <p className="min-w-0 truncate">
            {category && (
              <Link
                to={`/topic/${encodeURIComponent(category)}`}
                className="transition-colors hover:text-text-primary hover:underline"
              >
                {category}
              </Link>
            )}
            {tags.slice(0, TAGS_MAX).map((tag) => (
              <Link
                key={tag}
                to={`/tag/${encodeURIComponent(tag)}`}
                className="ml-1.5 transition-colors first:ml-0 hover:text-text-primary hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </p>
          <p className="flex shrink-0 items-center gap-1.5">
            <span>{formatCount(votes)} votes</span>
            <Dot />
            <span>{timeLeft} left</span>
          </p>
        </div>
      </div>

      {/* Action bar — like + repost on the left, share + bookmark on the right */}
      <footer
        className={cn(
          "mt-1 flex items-center justify-between py-2.5 text-text-primary",
          PAD_X,
        )}
      >
        <div className="flex items-center gap-3 lg:gap-4">
          <Action
            icon="favorite"
            label="Like"
            count={formatCount(liked ? likes + 1 : likes)}
            tone="red"
            active={liked}
            onClick={() => setLiked((v) => !v)}
          />
          <Action
            icon="repeat"
            label="Repost"
            count={formatCount(reposted ? reposts + 1 : reposts)}
            tone="green"
            active={reposted}
            onClick={() => setReposted((v) => !v)}
          />
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <Action
            icon="ios_share"
            label="Share"
            onClick={async () =>
              toast(
                (await copyText(window.location.href))
                  ? "Link copied"
                  : "Couldn't copy — try again",
              )
            }
          />
          <Action
            icon="bookmark"
            label="Bookmark"
            tone="violet"
            active={saved}
            onClick={() => {
              setSaved((v) => !v);
              toast(saved ? "Removed from saved" : "Saved");
            }}
          />
        </div>
      </footer>
    </article>
  );
}

/** The voting block itself — the A/B option pair with the OR disc, the
 *  vote interaction, and the result bars. Controlled, so the feed card and
 *  the series flow share one mechanic. `dense` renders the admin-grid cut:
 *  smaller disc, shorter result bars, no desktop upscale. */
export function PollOptionsBlock({
  options,
  selected,
  onSelect,
  dense = false,
  readOnly = false,
}: {
  options: [PollOption, PollOption];
  selected: number | null;
  onSelect: (index: number) => void;
  dense?: boolean;
  /** Presentation-only rendering — no vote affordance at all. */
  readOnly?: boolean;
}) {
  const hasVoted = selected !== null;
  const shares = voteShares(options);

  return (
    <div className="relative flex aspect-[4/3] items-stretch justify-center gap-1">
      <PollOptionCard
        {...options[0]}
        side="left"
        pct={shares[0]}
        selected={selected === 0}
        hasVoted={hasVoted}
        dense={dense}
        readOnly={readOnly}
        onSelect={() => onSelect(0)}
      />
      <PollOptionCard
        {...options[1]}
        side="right"
        pct={shares[1]}
        selected={selected === 1}
        hasVoted={hasVoted}
        dense={dense}
        readOnly={readOnly}
        onSelect={() => onSelect(1)}
      />

      {/* OR badge — a raised disc floating in the gap; a hairline keeps it
          legible over dark photos in dark mode. */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2",
          dense ? "size-9" : "size-12 lg:size-16",
        )}
      >
        <span className="absolute inset-0 rounded-pill bg-surface-raised shadow-sm" />
        <span
          className={cn(
            "absolute inset-0 grid place-items-center font-display font-bold leading-none text-text-primary",
            dense ? "text-sm" : "text-lg lg:text-2xl",
          )}
        >
          OR
        </span>
      </div>
    </div>
  );
}

type PollOptionCardProps = PollOption & {
  selected: boolean;
  hasVoted: boolean;
  onSelect: () => void;
  /** Which half of the row this option occupies. */
  side: "left" | "right";
  /** This option's vote share (0–100), shown in the results state. */
  pct: number;
  /** Admin-grid cut: tighter label row, shorter result bars, no upscale. */
  dense?: boolean;
  /** Presentation-only: never focusable, never votable. */
  readOnly?: boolean;
};

function PollOptionCard({
  label,
  image,
  votes = 0,
  selected,
  hasVoted,
  onSelect,
  side,
  pct,
  dense = false,
  readOnly = false,
}: PollOptionCardProps) {
  const eased = easeOutCubic(useProgress(hasVoted));
  const count = Math.round(pct * eased);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={
        hasVoted ? `${label}: ${pct}% of votes` : `Vote for ${label}`
      }
      // After the vote the other option is genuinely inert, so it leaves the
      // tab order too (results are announced by the card's live region).
      disabled={readOnly || (hasVoted && !selected)}
      tabIndex={readOnly ? -1 : undefined}
      className={cn(
        "group relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md text-left transition-colors",
        selected ? "bg-accent-default" : "bg-option-bg",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          dense ? "px-2 py-2" : "px-2 py-2.5 lg:px-3 lg:py-3",
        )}
      >
        <RadioMark selected={selected} hasVoted={hasVoted} />
        <span
          className={cn(
            "truncate font-display text-sm font-semibold leading-5",
            !dense && "lg:text-lg lg:leading-6",
            selected ? "text-text-on-accent" : "text-text-primary",
          )}
        >
          {clamp(label, ANSWER_MAX)}
        </span>
      </div>
      {/* Desktop hover (pre-vote): the photo zooms in slightly while a purple
          vignette swells at the edges — a "pick me" cue. */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-accent-default">
        <img
          src={image}
          alt={label}
          className={cn(
            "h-full w-full object-cover",
            !hasVoted &&
              "transition-transform duration-500 ease-out lg:group-hover:scale-[1.04]",
          )}
        />
        {!hasVoted && (
          <span
            aria-hidden
            className="option-glow pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 lg:block lg:group-hover:opacity-100"
          />
        )}
      </div>

      {/* Results — bars at ~90% of the OR disc on the 4px grid grow from the
          centre seam outward. The settled width equals the option's vote
          share; min-w-max keeps the bar from ever being shorter than the
          numbers inside it. */}
      {hasVoted && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2",
            side === "left" ? "pl-1.5" : "pr-1.5",
          )}
        >
          <div
            className={cn(
              "flex items-center",
              dense ? "h-8 gap-1.5 shadow-sm" : "h-11 gap-2 shadow-md lg:h-14 lg:gap-2.5",
              selected
                ? "bg-accent-default text-text-on-accent"
                : "bg-option-bg text-text-primary",
              side === "left"
                ? "ml-auto min-w-max justify-start rounded-l-full rounded-r-none"
                : "mr-auto min-w-max flex-row-reverse justify-start rounded-l-none rounded-r-full",
              dense
                ? side === "left"
                  ? "pl-3 pr-6"
                  : "pl-6 pr-3"
                : side === "left"
                  ? "pl-4 pr-8 lg:pl-5 lg:pr-10"
                  : "pl-8 pr-4 lg:pl-10 lg:pr-5",
            )}
            style={{ width: `${pct * eased}%` }}
          >
            <span
              className={cn(
                "font-display font-bold leading-none",
                dense ? "text-base" : "text-2xl lg:text-3xl",
              )}
            >
              {count}%
            </span>
            {/* The tally takes up space from the start (no width pop) but only
                fades in once the count crosses the threshold. */}
            {pct >= VOTES_PCT_MIN && (
              <span
                className={cn(
                  "font-sans font-medium leading-none opacity-70 transition-opacity duration-300",
                  dense ? "text-xs" : "text-sm lg:text-base",
                  count < VOTES_PCT_MIN && "opacity-0",
                )}
              >
                {formatCompact(votes)}
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

function RadioMark({
  selected,
  hasVoted,
}: {
  selected: boolean;
  hasVoted: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full border bg-surface-raised",
        selected ? "border-accent-default" : "border-border-default",
      )}
    >
      {selected ? (
        <Icon
          name="check"
          size={14}
          weight={700}
          className="radio-pop text-accent-default"
        />
      ) : (
        !hasVoted &&
        [0, 880, 1760].map((delay) => (
          <span
            key={delay}
            aria-hidden
            style={{ animationDelay: `${delay}ms` }}
            className="radio-ping [grid-area:1/1] h-[18px] w-[18px] rounded-full bg-accent-default"
          />
        ))
      )}
    </span>
  );
}

/** 6px round separator that inherits the current text color. */
function Dot() {
  return (
    <span
      aria-hidden
      className="h-0.5 w-0.5 shrink-0 rounded-full bg-current"
    />
  );
}

/**
 * Footer action: an icon on a circular backdrop (the same treatment as the
 * category nav), with an optional count. When `active`, the icon + count take
 * the `tone` color over a soft tinted circle.
 */
export function Action({
  icon,
  label,
  count,
  tone = "neutral",
  active = false,
  disabled = false,
  onClick,
}: {
  icon: string;
  label: string;
  count?: string;
  tone?: Tone;
  active?: boolean;
  /** Inert, muted presentation — e.g. the actions on an unpublished draft. */
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={onClick && !disabled ? active : undefined}
      aria-label={count ? `${label}: ${count}` : label}
      className={cn(
        // Negative margin + equal padding grows the hit area toward the
        // 44px guideline without moving the visual icon.
        "group -m-2 flex items-center gap-1 p-2 lg:gap-1.5",
        disabled
          ? "cursor-default text-icon-tertiary"
          : cn("active:scale-[0.96]", active ? TONE[tone].text : "text-text-primary"),
      )}
    >
      {/* Desktop scale-up on the 4pt grid: icon 20 → 24, ring 26 → 32. */}
      <span className="relative grid h-5 w-5 place-items-center lg:h-6 lg:w-6">
        <span
          aria-hidden
          className={cn(
            "absolute left-1/2 top-1/2 h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors lg:h-8 lg:w-8",
            active ? TONE[tone].ring : !disabled && "group-hover:bg-surface-subtle",
          )}
        />
        <Icon
          name={icon}
          filled={active}
          className="relative text-[20px] lg:text-[24px]"
        />
      </span>
      {count && (
        <span aria-hidden className={STAT_TEXT}>
          {count}
        </span>
      )}
    </button>
  );
}
