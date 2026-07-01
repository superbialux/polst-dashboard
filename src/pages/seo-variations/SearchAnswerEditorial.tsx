import { useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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
import {
  championOf,
  formatCompact,
  ladderSteps,
  type PollOption,
} from "@/lib/poll";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn, copyText } from "@/lib/utils";
import {
  NewPollModal,
  useChallengeFlow,
  VariationSwitcher,
} from "./shared";

/**
 * Variation 1 — "Editorial Verdict".
 *
 * The page reads like a confident magazine ruling. One bold move — a
 * cinematic feature panel for the winning contender — answers the Google
 * intent before anything else. Everything below stays quiet and typographic:
 * a numbered ranking on hairline rules, a "settle it yourself" interlude that
 * lets the reader litigate the verdict, and disciplined onward links. The
 * single violet accent is reserved for interaction; green marks only the
 * winner.
 */
export function SearchAnswerEditorial() {
  const { slug = "" } = useParams();
  const answer = seoAnswerFor(slug);
  const { signedIn } = useSession();
  const { openAuth, openNewPoll } = useUI();

  const askTheWorld = () => (signedIn ? openNewPoll() : openAuth("signup"));

  if (!answer) {
    return (
      <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
        <VariationSwitcher />
        <div className="rounded-card border border-border-default bg-card-bg shadow-sm">
          <EmptyState
            icon="search_off"
            title="The world hasn't voted on this yet"
            body="No verdict has been ruled on this question. Be the one who calls it — ask the world and watch the votes settle it."
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
      <Breadcrumbs items={answer.breadcrumbs} />
      <EditableHeadline answer={answer} />

      {/* The verdict: the most dominant thing on the page. */}
      <FeaturePanel answer={answer} />

      <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_352px]">
        {/* The editorial ranking — restrained, numbered, hairline-ruled. */}
        <div className="min-w-0">
          <Ranking answer={answer} />
          <RelatedReading answer={answer} />
        </div>

        {/* The interactive interlude + the create call to action. */}
        <aside className="flex min-w-0 flex-col gap-6">
          <SettleItYourself answer={answer} />
          <CreateCta answer={answer} onAsk={askTheWorld} />
        </aside>
      </div>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/* Headline — an editable magazine cover line                          */
/* ------------------------------------------------------------------ */

/** The confident headline. With `keywords`, the subject and place are
 *  editable chips that rebuild the slug; otherwise the plain title renders. */
function EditableHeadline({ answer }: { answer: SeoAnswer }) {
  const { variant = "editorial" } = useParams();
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
      <h1 className="mt-1 max-w-3xl font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-text-primary lg:text-5xl">
        {answer.title}
      </h1>
    );
  }

  return (
    <h1 className="mt-1 flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-text-primary lg:text-5xl lg:leading-[1.05]">
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

/** A headline word the reader can rewrite — a dotted underline signals it is
 *  editable; clicking opens a small editor with a text field + quick picks. */
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
            "group -mx-1 inline-flex items-center gap-1.5 rounded-md px-1 underline decoration-dotted decoration-2 underline-offset-[6px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page",
            open
              ? "text-text-accent decoration-accent-default"
              : "text-text-accent decoration-soft-purple hover:decoration-accent-default",
          )}
        >
          {label}
          <Icon
            name="edit"
            size={20}
            className="text-text-accent opacity-60 transition-opacity group-hover:opacity-100 lg:text-[24px]"
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
          aria-label="Update verdict"
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
/* Feature panel — the cover subject                                   */
/* ------------------------------------------------------------------ */

/** The page's one bold move: the winning contender as an editorial cover. A
 *  cinematic banner, the name set heavy over it, the methodology stated in a
 *  single dek line. This is the answer Google came for. */
function FeaturePanel({ answer }: { answer: SeoAnswer }) {
  const { leader, stats } = answer;
  const heroImage = leaderImage(answer);
  const toast = useToast();

  const share = async () =>
    toast(
      (await copyText(window.location.href))
        ? "Link copied"
        : "Couldn't copy — try again",
    );

  return (
    <figure className="relative mt-5 overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm lg:mt-7">
      {/* Banner image with a bottom-anchored scrim so the type stays legible. */}
      <div className="relative aspect-[16/10] sm:aspect-[2/1] lg:aspect-[5/2]">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${leader.name}, the current pick for ${answer.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-surface-strong" />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-neutral-900/85 via-neutral-900/25 to-neutral-900/5"
        />

        {/* Eyebrow + share, pinned top. */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4 lg:p-6">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-neutral-900/55 px-3 py-1.5 font-sans text-xs font-semibold uppercase leading-4 tracking-[0.14em] text-neutral-50 backdrop-blur-sm">
            <Icon name="crown" size={16} filled className="text-neutral-50" />
            {stats.place ? `${stats.place}'s verdict` : "The verdict"}
          </span>
          <button
            onClick={share}
            aria-label="Share this verdict"
            className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-neutral-50/90 px-3.5 font-display text-sm font-bold leading-5 text-neutral-900 backdrop-blur-sm transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900/40"
          >
            <Icon name="ios_share" size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* The cover subject, set large at the foot of the banner. */}
        <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 lg:p-6">
          <p className="font-sans text-xs font-medium leading-4 text-neutral-50/80 lg:text-sm lg:leading-5">
            Leading the vote with {leader.share}%
          </p>
          <h2 className="font-display text-4xl font-extrabold leading-[0.95] tracking-tight text-neutral-50 sm:text-5xl lg:text-6xl">
            {leader.name}
          </h2>
        </figcaption>
      </div>

      {/* Methodology dek — the byline of the ruling. */}
      <figcaption className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 py-3.5 font-sans text-xs leading-5 text-text-secondary lg:px-6 lg:text-sm">
        <span className="font-semibold text-text-primary">
          Tallied from {formatCompact(stats.totalVotes)} votes
          {stats.place ? ` across ${stats.place}` : ""}
        </span>
        <Dot />
        <span className="inline-flex items-center gap-1 font-semibold text-status-success">
          <Icon name="trending_up" size={14} />
          {leader.trend}
        </span>
        <Dot />
        <span>updated {leader.updated}</span>
        <Dot />
        <span>{formatCompact(stats.answersToday)} new today</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* The ranking — numbered, typographic, hairline-ruled                 */
/* ------------------------------------------------------------------ */

/** The full field, ruled as an editorial chart: rank numeral, name, a thin
 *  share bar, the figure right-aligned. The leader is the only line carrying
 *  the violet accent; the rest stay neutral, so the order reads as facts. */
function Ranking({ answer }: { answer: SeoAnswer }) {
  return (
    <section aria-labelledby="ranking-title">
      <header className="mb-3 flex items-baseline justify-between border-b border-border-strong pb-2">
        <h2
          id="ranking-title"
          className="font-display text-xl font-extrabold leading-7 tracking-tight text-text-primary lg:text-2xl"
        >
          The full ranking
        </h2>
        <span className="font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-text-tertiary">
          {answer.leaderboard.length} contenders
        </span>
      </header>

      <ol>
        {answer.leaderboard.map((row, i) => {
          const lead = i === 0;
          return (
            <li
              key={row.name}
              className="flex items-center gap-4 border-b border-border-default py-3.5 last:border-0 lg:gap-5"
            >
              <span
                className={cn(
                  "w-7 shrink-0 text-center font-display text-2xl font-extrabold leading-none tabular-nums lg:text-3xl",
                  lead ? "text-text-accent" : "text-text-tertiary",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={cn(
                      "truncate font-display leading-6",
                      lead
                        ? "text-lg font-bold text-text-primary lg:text-xl"
                        : "text-base font-semibold text-text-primary",
                    )}
                  >
                    {row.name}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-display font-bold tabular-nums leading-6",
                      lead
                        ? "text-lg text-text-accent lg:text-xl"
                        : "text-base text-text-secondary",
                    )}
                  >
                    {row.share}%
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-pill bg-surface-strong">
                  <div
                    className={cn(
                      "h-full rounded-pill",
                      lead ? "bg-accent-default" : "bg-border-strong",
                    )}
                    style={{ width: `${row.share}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Settle it yourself — the interactive interlude                      */
/* ------------------------------------------------------------------ */

/** A boxed sidebar that frames the drill-down as an invitation: run the
 *  contenders head-to-head and reach your own verdict. The last slide pits
 *  the reader's champion against a ghost "create your own" tile. Falls back
 *  to the single poll when no ladder is authored. */
function SettleItYourself({ answer }: { answer: SeoAnswer }) {
  const { challenge, modal } = useChallengeFlow();
  const steps = answer.ladder ? ladderSteps(answer.ladder.contenders) : [];

  return (
    <RailBox className="px-3 py-3.5 lg:px-4 lg:py-4">
      <div className="mb-3 flex items-start gap-2.5 border-b border-border-default pb-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent-soft">
          <Icon name="trending_up" size={20} className="text-text-accent" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold leading-5 text-text-primary">
            Settle it yourself
          </h2>
          <p className="mt-0.5 font-sans text-xs leading-4 text-text-secondary">
            Don't take our word for it — pick a winner each round and see who
            you'd crown.
          </p>
        </div>
      </div>

      {steps.length > 0 ? (
        <MultiPoll
          steps={steps}
          carryWinner
          bleed="-mx-3 lg:-mx-4"
          pad="px-3 lg:px-4"
          counterLabel={(a, t) => `Round ${Math.min(a + 1, t)} of ${t}`}
          finalSlide={(answers) => {
            const champ = championOf(steps, answers);
            return (
              <WinnerVsCreate champ={champ} onChallenge={() => challenge(champ)} />
            );
          }}
        />
      ) : (
        <div className="-mx-3 overflow-hidden rounded-card lg:-mx-4">
          <PollCard {...answer.poll} />
        </div>
      )}

      <NewPollModal {...modal} />
    </RailBox>
  );
}

/** The final slide: the reader's champion as a winner (green mark, no vote)
 *  beside a dashed ghost tile that invites them to challenge it. Mirrors the
 *  option-pair geometry — same 4:3 area, same OR disc — so the ladder ends on
 *  a shape the reader already knows. */
function WinnerVsCreate({
  champ,
  onChallenge,
}: {
  champ: PollOption;
  onChallenge: () => void;
}) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
        Your pick: {champ.label}
      </h2>

      <div className="relative flex aspect-[4/3] items-stretch justify-center gap-1">
        {/* Left — the champion, display only, marked the winner. */}
        <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md border-2 border-status-success">
          <div className="flex items-center justify-between gap-2 px-2 py-2.5 lg:px-3 lg:py-3">
            <span className="truncate font-display text-sm font-semibold leading-5 text-text-primary lg:text-lg lg:leading-6">
              {champ.label}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-status-success px-2 py-0.5 font-display text-xs font-bold leading-4 text-text-on-accent">
              <Icon name="crown" size={14} filled />
              Winner
            </span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            {champ.image ? (
              <img
                src={champ.image}
                alt={champ.label}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface-strong" />
            )}
          </div>
        </div>

        {/* Right — the ghost: an invitation to challenge the verdict. */}
        <button
          type="button"
          onClick={onChallenge}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong px-3 text-center transition-colors hover:border-border-accent hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card-bg"
        >
          <span className="grid h-10 w-10 place-items-center rounded-pill bg-surface-subtle text-icon-secondary transition-colors group-hover:bg-accent-default group-hover:text-text-on-accent">
            <Icon name="add" size={22} weight={600} />
          </span>
          <span className="font-display text-sm font-bold leading-5 text-text-primary lg:text-base">
            Know something better than {champ.label}?
          </span>
          <span className="font-sans text-xs leading-4 text-text-secondary">
            Create a Polst and see if people agree.
          </span>
        </button>

        {/* OR disc — the signature, floating in the seam. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-12 -translate-x-1/2 -translate-y-1/2 lg:size-16">
          <span className="absolute inset-0 rounded-pill bg-surface-raised shadow-sm" />
          <span className="absolute inset-0 grid place-items-center font-display text-lg font-bold leading-none text-text-primary lg:text-2xl">
            OR
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Onward paths + create CTA                                            */
/* ------------------------------------------------------------------ */

/** Related questions and trending nearby, set as a quiet "Read on" column —
 *  navigation styled like an editorial sidebar, never decoration. */
function RelatedReading({ answer }: { answer: SeoAnswer }) {
  const hasTrending = answer.trendingNearby.length > 0;
  const hasTopics = answer.relatedTopics.length > 0;
  if (!hasTrending && !hasTopics) return null;

  return (
    <div className="mt-8 flex flex-col gap-6">
      {hasTrending && (
        <section aria-labelledby="trending-title">
          <h2
            id="trending-title"
            className="mb-2 border-b border-border-strong pb-2 font-display text-base font-bold leading-6 text-text-primary"
          >
            {answer.stats.place
              ? `Trending in ${answer.stats.place}`
              : "Trending now"}
          </h2>
          <ol>
            {answer.trendingNearby.map((item) => (
              <li key={item.label} className="border-b border-border-default last:border-0">
                <Link
                  to={item.to}
                  className="group flex items-center gap-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
                >
                  <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold leading-5 text-text-primary group-hover:text-text-accent group-hover:underline">
                    {item.label}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 font-sans text-xs font-semibold text-status-success">
                    <Icon name="trending_up" size={14} />
                    {item.change}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {hasTopics && (
        <section aria-labelledby="explore-title">
          <h2
            id="explore-title"
            className="mb-2.5 font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-text-tertiary"
          >
            Keep exploring
          </h2>
          <ul className="flex flex-wrap gap-2">
            {answer.relatedTopics.map((topic) => (
              <li key={topic.label}>
                <Link
                  to={topic.to}
                  className="inline-flex items-center rounded-pill border border-border-default px-3 py-1.5 font-display text-sm font-semibold leading-5 text-text-primary transition-colors hover:border-border-accent hover:bg-accent-soft hover:text-text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent"
                >
                  {topic.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Closing call: turn a reader into a poll creator. */
function CreateCta({
  answer,
  onAsk,
}: {
  answer: SeoAnswer;
  onAsk: () => void;
}) {
  return (
    <RailBox className="px-4 py-5">
      <p className="font-display text-lg font-bold leading-6 tracking-tight text-text-primary">
        Have a take of your own?
      </p>
      <p className="mt-1 font-sans text-sm leading-5 text-text-secondary">
        Ask the world a question and let the votes write the next verdict
        {answer.stats.place ? ` in ${answer.stats.place}` : ""}.
      </p>
      <button
        onClick={onAsk}
        className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card-bg"
      >
        <Icon name="add" size={20} weight={600} />
        Ask the world
      </button>
    </RailBox>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** The hero photo: the ladder's top contender, or the matching poll option,
 *  matched to the named leader so the cover never shows the wrong dish. */
function leaderImage(answer: SeoAnswer): string | undefined {
  const name = answer.leader.name;
  return (
    answer.ladder?.contenders.find((c) => c.label === name)?.image ??
    answer.ladder?.contenders[0]?.image ??
    answer.poll.options.find((o) => o.label === name)?.image ??
    answer.poll.options[0]?.image
  );
}

/** 2px round separator that inherits the current text color. */
function Dot(): ReactNode {
  return (
    <span aria-hidden className="h-0.5 w-0.5 shrink-0 rounded-full bg-current" />
  );
}
