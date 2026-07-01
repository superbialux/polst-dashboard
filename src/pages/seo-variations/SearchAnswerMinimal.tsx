import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import { Field, TextInput } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { Menu } from "@/components/Menu";
import { MultiPoll } from "@/components/MultiPoll";
import { PageShell } from "@/components/PageShell";
import { PollCard } from "@/components/PollCard";
import { useToast } from "@/components/Toast";
import { seoAnswerFor, pollSlug, type SeoAnswer } from "@/lib/data";
import { championOf, formatCompact, ladderSteps, type PollOption } from "@/lib/poll";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn, copyText } from "@/lib/utils";
import { NewPollModal, useChallengeFlow, VariationSwitcher } from "./shared";

/**
 * Variation 4 — "Quiet Focus".
 *
 * Linear-grade restraint: one narrow column, one thing at a time, lots of air.
 * The hero is not a photo but a typographic answer statement — a quiet eyebrow
 * ("Chicago says") above the winner's name, set large and confident. Separation
 * comes from whitespace and hairlines, never boxes. The champion ladder is the
 * calm interactive centerpiece; the leaderboard and links are understated lists.
 */
export function SearchAnswerMinimal() {
  const { variant = "minimal", slug = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const answer = seoAnswerFor(slug);
  const { signedIn } = useSession();
  const { openAuth, openNewPoll } = useUI();

  const askTheWorld = () => (signedIn ? openNewPoll() : openAuth("signup"));
  const go = (s: string, p?: string) =>
    navigate(`/seo/${variant}/${pollSlug(p ? `Best ${s} in ${p}` : `Best ${s}`)}`);

  if (!answer) {
    return (
      <PageShell className="lg:max-w-screen-md xl:max-w-[640px]">
        <VariationSwitcher />
        <h1 className="sr-only">No results</h1>
        <EmptyState
          icon="search_off"
          title="The world hasn't voted on this yet"
          body="No polls match this question — be the first to ask it."
          action={
            <button
              onClick={askTheWorld}
              className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg outline-none transition-colors hover:bg-btn-primary-bg-hover focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
            >
              Ask the world
            </button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="lg:max-w-screen-md xl:max-w-[640px]">
      <VariationSwitcher />

      <article className="flex flex-col">
        {/* Whisper-quiet ancestry. */}
        <Breadcrumbs items={answer.breadcrumbs} />

        {/* Editable keyword title — subject + place as inline chips. */}
        <h1 className="mt-1.5 font-sans text-sm leading-5 text-text-secondary">
          {answer.keywords ? (
            <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span>Best</span>
              <KeywordChip
                value={answer.keywords.subject}
                label="Subject"
                placeholder="burger, pizza…"
                suggestions={answer.keywords.subjectSuggestions}
                onCommit={(s) => go(s, answer.keywords?.place)}
              />
              {answer.keywords.place && (
                <>
                  <span>in</span>
                  <KeywordChip
                    value={answer.keywords.place}
                    label="Place"
                    placeholder="Chicago, Austin…"
                    suggestions={answer.keywords.placeSuggestions}
                    onCommit={(p) => go(answer.keywords!.subject, p)}
                  />
                </>
              )}
            </span>
          ) : (
            <span className="font-display text-base font-bold leading-6 text-text-primary">
              {answer.title}
            </span>
          )}
        </h1>

        {/* THE ANSWER — a typographic statement, not a hero photo. */}
        <AnswerStatement answer={answer} />

        {/* Champion ladder — the calm interactive centerpiece. */}
        <Ladder answer={answer} />

        {/* Understated standings. */}
        <Standings answer={answer} />

        {/* Quiet onward paths. */}
        <Related answer={answer} />

        {/* Quiet create CTA + share. */}
        <Hairline />
        <section className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-sm leading-5 text-text-secondary">
            Have a sharper take? Ask {answer.stats.place ?? "the world"} and watch
            the votes settle.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={async () =>
                toast(
                  (await copyText(window.location.href))
                    ? "Link copied"
                    : "Couldn't copy — try again",
                )
              }
              className="flex h-10 items-center gap-1.5 rounded-pill border border-btn-secondary-border bg-btn-secondary-bg px-4 font-display text-sm font-bold leading-5 text-btn-secondary-fg outline-none transition-colors hover:bg-btn-secondary-bg-hover focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
            >
              <Icon name="ios_share" size={18} />
              Share
            </button>
            <button
              onClick={askTheWorld}
              className="flex h-10 items-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg outline-none transition-colors hover:bg-btn-primary-bg-hover focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
            >
              <Icon name="add" size={20} weight={600} />
              Ask the world
            </button>
          </div>
        </section>
      </article>
    </PageShell>
  );
}

/** A subject/place keyword, rendered as a quiet underlined chip that opens a
 *  small editor (free text + suggestion quick-picks). Commit re-routes within
 *  this variation. */
function KeywordChip({
  value,
  label,
  placeholder,
  suggestions = [],
  onCommit,
}: {
  value: string;
  label: string;
  placeholder: string;
  suggestions?: string[];
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <Menu
      label={`Edit ${label.toLowerCase()}`}
      align="start"
      closeOnClick={false}
      className="min-w-64 p-3"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            toggle();
          }}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "rounded-sm font-display text-base font-bold leading-6 text-text-primary underline decoration-border-strong decoration-2 underline-offset-4 outline-none transition-colors hover:decoration-accent-default focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page",
            open && "decoration-accent-default text-text-accent",
          )}
        >
          {value}
        </button>
      )}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = draft.trim();
          if (next) onCommit(next);
        }}
        className="flex flex-col gap-3"
      >
        <Field label={label}>
          {(id) => (
            <TextInput
              id={id}
              autoFocus
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
            />
          )}
        </Field>
        {suggestions.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => onCommit(s)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 font-display text-sm font-semibold leading-5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface-raised",
                    s === value
                      ? "border-border-accent bg-accent-soft text-text-accent"
                      : "border-border-default text-text-primary hover:bg-surface-subtle",
                  )}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="submit"
          className="flex h-10 items-center justify-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg outline-none transition-colors hover:bg-btn-primary-bg-hover focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
        >
          See the answer
          <Icon name="arrow_forward" size={18} weight={600} />
        </button>
      </form>
    </Menu>
  );
}

/** The hero: a quiet eyebrow over the winner's name, set large, with one
 *  supporting line. No photo, no box — whitespace does the work. */
function AnswerStatement({ answer }: { answer: SeoAnswer }) {
  const { leader, stats } = answer;
  return (
    <section aria-label="The answer" className="pb-10 pt-7 lg:pb-12 lg:pt-9">
      <p className="font-display text-sm font-semibold uppercase leading-5 tracking-[0.12em] text-text-accent">
        {stats.place ? `${stats.place} says` : "The world says"}
      </p>
      <p className="mt-2 font-display text-[40px] font-bold leading-[44px] tracking-tight text-text-primary lg:text-6xl lg:leading-[64px]">
        {leader.name}
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-sans text-sm leading-5 text-text-secondary">
        <span className="font-semibold text-text-primary">{leader.share}%</span>
        <span>of {formatCompact(stats.totalVotes)} votes</span>
        <span aria-hidden className="text-text-tertiary">·</span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-status-success">
          <Icon name="north_east" size={14} weight={600} />
          {leader.trend}
        </span>
        <span aria-hidden className="text-text-tertiary">·</span>
        <span>updated {leader.updated}</span>
      </p>
    </section>
  );
}

/** Champion ladder — given room to breathe. Reuses MultiPoll + carryWinner.
 *  The final slide pits the champion (display only) against a ghost
 *  "create your own" tile that opens the challenge flow. */
function Ladder({ answer }: { answer: SeoAnswer }) {
  const { challenge, modal } = useChallengeFlow();
  const steps = answer.ladder ? ladderSteps(answer.ladder.contenders) : [];

  return (
    <section aria-label="Decide it yourself" className="border-t border-border-default pt-8">
      <header className="mb-5">
        <h2 className="font-display text-xl font-bold leading-7 text-text-primary">
          Settle it, one matchup at a time
        </h2>
        <p className="mt-1 font-sans text-sm leading-5 text-text-secondary">
          Your pick carries forward. Beat them all to crown your own champion.
        </p>
      </header>

      {answer.ladder ? (
        <>
          <MultiPoll
            steps={steps}
            carryWinner
            bleed="-mx-2.5 lg:-mx-4"
            pad="px-2.5 lg:px-4"
            counterLabel={(a, t) => `Round ${Math.min(a + 1, t)} of ${t}`}
            finalSlide={(answers) => {
              const champ = championOf(steps, answers);
              return <WinnerVsCreate champ={champ} onCreate={() => challenge(champ)} />;
            }}
          />
          <NewPollModal {...modal} />
        </>
      ) : (
        <div className="overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm">
          <PollCard {...answer.poll} />
        </div>
      )}
    </section>
  );
}

/** The final slide: champion (display only, green winner mark) beside a dashed
 *  ghost tile inviting a challenge. One 4:3 area split by a 4px seam — the same
 *  silhouette every other slide kept. */
function WinnerVsCreate({
  champ,
  onCreate,
}: {
  champ: PollOption;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
        Your champion: {champ.label}
      </h2>
      <div className="flex aspect-[4/3] w-full gap-1">
        {/* Champion — display only, crowned. */}
        <div className="relative flex-1 overflow-hidden rounded-l-md rounded-r-sm bg-option-bg">
          <img
            src={champ.image}
            alt={champ.label}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-status-success" />
          <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-pill bg-status-success text-text-on-accent shadow-sm">
            <Icon name="crown" size={16} weight={600} filled />
          </span>
          <span className="absolute inset-x-2 bottom-2 truncate rounded-sm bg-status-success px-2 py-1 text-center font-display text-sm font-bold leading-5 text-text-on-accent shadow-sm">
            {champ.label}
          </span>
        </div>
        {/* Create — the dashed ghost challenger. */}
        <button
          type="button"
          onClick={onCreate}
          className="group flex flex-1 flex-col items-center justify-center gap-2 rounded-l-sm rounded-r-md border-2 border-dashed border-border-strong px-3 text-center outline-none transition-colors hover:border-border-accent hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
        >
          <span className="grid h-9 w-9 place-items-center rounded-pill bg-surface-subtle text-icon-secondary transition-colors group-hover:bg-accent-default group-hover:text-text-on-accent">
            <Icon name="add" size={22} weight={600} />
          </span>
          <span className="font-display text-sm font-bold leading-5 text-text-primary">
            Know something better than {champ.label}?
          </span>
          <span className="font-sans text-xs leading-4 text-text-secondary">
            Create a Polst and challenge the champ.
          </span>
        </button>
      </div>
    </div>
  );
}

/** Understated standings: a clean list, modest type, generous line-height —
 *  no panel, no bars competing with the ladder above. */
function Standings({ answer }: { answer: SeoAnswer }) {
  return (
    <section
      aria-label="Standings"
      className="border-t border-border-default pt-8 mt-10"
    >
      <h2 className="font-display text-sm font-semibold uppercase leading-5 tracking-[0.08em] text-text-tertiary">
        Standings · {formatCompact(answer.stats.totalVotes)} votes
      </h2>
      <ol className="mt-3 flex flex-col">
        {answer.leaderboard.map((row, i) => (
          <li
            key={row.name}
            className={cn(
              "flex items-baseline gap-3 py-2.5",
              i > 0 && "border-t border-border-default",
            )}
          >
            <span
              className={cn(
                "w-5 shrink-0 font-display text-sm font-bold leading-5 tabular-nums",
                i === 0 ? "text-text-accent" : "text-text-tertiary",
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate font-display leading-6",
                i === 0
                  ? "text-base font-bold text-text-primary"
                  : "text-sm font-semibold text-text-secondary",
              )}
            >
              {row.name}
            </span>
            <span
              className={cn(
                "shrink-0 font-sans leading-5 tabular-nums",
                i === 0
                  ? "text-base font-bold text-text-primary"
                  : "text-sm text-text-secondary",
              )}
            >
              {row.share}%
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Quiet onward paths — trending nearby + related topics, folded into one
 *  calm section of plain links. */
function Related({ answer }: { answer: SeoAnswer }) {
  const hasTrending = answer.trendingNearby.length > 0;
  const hasTopics = answer.relatedTopics.length > 0;
  if (!hasTrending && !hasTopics) return null;

  return (
    <section
      aria-label="Keep exploring"
      className="border-t border-border-default pt-8 mt-10"
    >
      {hasTrending && (
        <>
          <h2 className="font-display text-sm font-semibold uppercase leading-5 tracking-[0.08em] text-text-tertiary">
            {answer.stats.place ? `Trending in ${answer.stats.place}` : "Trending"}
          </h2>
          <ul className="mt-3 flex flex-col">
            {answer.trendingNearby.map((item) => (
              <li key={item.label} className="border-t border-border-default first:border-t-0">
                <Link
                  to={item.to}
                  className="group flex items-center gap-3 rounded-sm py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-border-accent"
                >
                  <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold leading-5 text-text-primary group-hover:text-text-accent">
                    {item.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 font-sans text-xs font-semibold leading-4 text-status-success">
                    <Icon name="north_east" size={13} weight={600} />
                    {item.change}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {hasTopics && (
        <ul className={cn("flex flex-wrap gap-1.5", hasTrending && "mt-5")}>
          {answer.relatedTopics.map((topic) => (
            <li key={topic.label}>
              <Link
                to={topic.to}
                className="inline-flex items-center rounded-md border border-border-default px-2.5 py-1.5 font-display text-sm font-semibold leading-5 text-text-secondary outline-none transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-accent"
              >
                {topic.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Hairline() {
  return <div className="mt-10 border-t border-border-default" />;
}
