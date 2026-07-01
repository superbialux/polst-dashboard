import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DrawerSection } from "@/components/Drawer";
import { EmptyState } from "@/components/EmptyState";
import { Field, TextInput } from "@/components/Field";
import { Icon } from "@/components/Icon";
import { Menu, MenuItem, MenuSeparator } from "@/components/Menu";
import { MultiPoll } from "@/components/MultiPoll";
import { PageShell } from "@/components/PageShell";
import { PollCard } from "@/components/PollCard";
import { RailBox } from "@/components/RailBox";
import { seoAnswerFor, pollSlug, type SeoAnswer } from "@/lib/data";
import { championOf, formatCompact, ladderSteps, type PollOption } from "@/lib/poll";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { NewPollModal, useChallengeFlow, VariationSwitcher } from "./shared";

/**
 * Variation 3 — "Showdown". The drill-down is the hero: the page frames the
 * answer as a head-to-head tournament. A bracket rail tracks the running
 * champion advancing toward the trophy as the user picks; the aggregate
 * crowd answer sits below as supporting evidence. Violet is the only
 * interaction colour; green is reserved for the crowned champion.
 */
export function SearchAnswerShowdown() {
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
            title="No bracket yet"
            body="No one has faced these off. Be the first to ask — and let the world settle it."
            action={
              <button
                onClick={askTheWorld}
                className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent"
              >
                Ask the world
              </button>
            }
          />
        </div>
      </PageShell>
    );
  }

  return <Showdown answer={answer} />;
}

function Showdown({ answer }: { answer: SeoAnswer }) {
  const { variant = "showdown", slug } = useParams();
  const navigate = useNavigate();
  const { signedIn } = useSession();
  const { openAuth, openNewPoll } = useUI();
  const askTheWorld = () => (signedIn ? openNewPoll() : openAuth("signup"));

  const go = (s: string, p?: string) =>
    navigate(`/seo/${variant}/${pollSlug(p ? `Best ${s} in ${p}` : `Best ${s}`)}`);

  const { challenge, modal } = useChallengeFlow();
  const steps = answer.ladder ? ladderSteps(answer.ladder.contenders) : [];
  const contenders = answer.ladder?.contenders ?? [];
  const totalRounds = steps.length;

  // The running champion drives the bracket rail above MultiPoll.
  const [answered, setAnswered] = useState(0);

  return (
    <PageShell>
      <VariationSwitcher />

      <header className="px-0.5">
        <Breadcrumbs items={answer.breadcrumbs} />
        <p className="mb-1.5 flex items-center gap-1.5 font-sans text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-text-accent">
          <Icon name="sports_mma" size={15} weight={600} />
          The showdown
        </p>
        <h1 className="font-display text-text-primary">
          <KeywordTitle answer={answer} go={go} />
        </h1>
        <p className="mt-1.5 max-w-2xl font-sans text-sm leading-5 text-text-secondary">
          {answer.intro}
        </p>
      </header>

      {/* THE HERO — bracket framing around the live champion ladder. */}
      <section
        aria-label="Pick your winner"
        className="mt-4 overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm lg:mt-5"
      >
        {steps.length > 0 ? (
          <div className="flex flex-col gap-3 p-2.5 lg:gap-4 lg:p-4">
            <ShowdownHeader
              answered={answered}
              total={totalRounds}
              place={answer.stats.place}
            />
            <BracketRail contenders={contenders} answered={answered} />

            <MultiPoll
              steps={steps}
              carryWinner
              bleed="-mx-2.5 lg:-mx-4"
              pad="px-2.5 lg:px-4"
              onProgress={(a) => setAnswered(a)}
              counterLabel={(a, t) => `Round ${Math.min(a + 1, t)} of ${t}`}
              finalSlide={(answers) => (
                <WinnerVsCreate
                  champion={championOf(steps, answers)}
                  onChallenge={() => challenge(championOf(steps, answers))}
                />
              )}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-card">
            <PollCard {...answer.poll} />
          </div>
        )}
      </section>

      <NewPollModal {...modal} />

      {/* WHAT EVERYONE ELSE PICKED — the crowd answer supports the showdown. */}
      <section aria-label="The crowd's verdict" className="mt-4 lg:mt-5">
        <div className="mb-2.5 flex items-baseline justify-between gap-3 px-0.5">
          <h2 className="flex items-center gap-1.5 font-display text-base font-bold leading-6 text-text-primary">
            <Icon name="groups" size={18} className="text-icon-secondary" />
            What everyone else picked
          </h2>
          <span className="shrink-0 font-sans text-xs leading-4 text-text-secondary">
            {formatCompact(answer.stats.totalVotes)} votes ·{" "}
            {formatCompact(answer.stats.answersToday)} today
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_304px] lg:items-start xl:grid-cols-[minmax(0,1fr)_352px]">
          <RailBox className="px-4 py-3.5">
            <Standings answer={answer} />
          </RailBox>

          <div className="flex flex-col gap-4">
            {answer.trendingNearby.length > 0 && (
              <RailBox>
                <DrawerSection
                  title={
                    answer.stats.place
                      ? `Heating up in ${answer.stats.place}`
                      : "Heating up"
                  }
                  seeAll={false}
                  className="pt-2"
                >
                  <ol>
                    {answer.trendingNearby.map((item, i) => (
                      <li key={item.label}>
                        <Link
                          to={item.to}
                          className="flex items-center gap-3 rounded-sm px-2 py-2 transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-border-accent"
                        >
                          <span className="w-4 shrink-0 text-center font-sans text-xs font-medium tabular-nums text-text-secondary">
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
                <DrawerSection title="More showdowns" seeAll={false} className="pt-2">
                  <ul className="flex flex-wrap gap-1.5 px-2 pb-1 pt-1">
                    {answer.relatedTopics.map((topic) => (
                      <li key={topic.label}>
                        <Link
                          to={topic.to}
                          className="inline-flex items-center gap-1 rounded-md border border-border-default px-2.5 py-1.5 font-display text-sm font-semibold leading-5 text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent"
                        >
                          {topic.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </DrawerSection>
              </RailBox>
            )}

            {/* Create CTA */}
            <RailBox className="px-4 py-4">
              <p className="flex items-center gap-1.5 font-display text-sm font-bold leading-5 text-text-primary">
                <Icon name="bolt" size={18} className="text-text-accent" />
                Start your own showdown
              </p>
              <p className="mt-1 font-sans text-xs leading-4 text-text-secondary">
                Pit two takes against each other and let{" "}
                {answer.stats.place ?? "the world"} settle it.
              </p>
              <button
                onClick={askTheWorld}
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent"
              >
                <Icon name="add" size={20} weight={600} />
                Ask the world
              </button>
            </RailBox>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

/** Round counter + intent line above the ladder — the showdown's scoreboard. */
function ShowdownHeader({
  answered,
  total,
  place,
}: {
  answered: number;
  total: number;
  place?: string;
}) {
  const done = answered >= total;
  const round = Math.min(answered + 1, total);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-display text-lg font-bold leading-[26px] text-text-primary lg:text-xl">
          {done ? "Your champion" : "Pick your winner"}
        </p>
        <p className="truncate font-sans text-xs leading-4 text-text-secondary">
          {done
            ? "One left standing — see how the crowd agrees below."
            : `Tap a side to advance it. ${place ?? "The world"} is watching.`}
        </p>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 font-sans text-xs font-semibold uppercase leading-4 tracking-wide transition-colors",
          done
            ? "bg-status-success-soft text-status-success"
            : "bg-accent-soft text-text-accent",
        )}
      >
        <Icon name={done ? "emoji_events" : "swords"} size={14} weight={600} />
        <span className="tabular-nums">
          {done ? "Final" : `Round ${round} of ${total}`}
        </span>
      </span>
    </div>
  );
}

/**
 * Signature element: the bracket rail. Contenders sit on a track that fills
 * with the user's running pick as each round resolves; a trophy seat caps
 * the line. Purely a visual frame — it never replaces MultiPoll's mechanic.
 */
function BracketRail({
  contenders,
  answered,
}: {
  contenders: PollOption[];
  answered: number;
}) {
  if (contenders.length === 0) return null;
  // Each answered round advances one challenger; the running champion is the
  // strongest seed still on the rail (data carries strongest-first).
  const total = contenders.length;
  const done = answered >= total - 1;
  // Fraction of the track lit: rounds done out of rounds total (n-1 rounds).
  const litTo = Math.min(answered, total - 1);

  return (
    <div
      aria-hidden
      className="rounded-md border border-border-default bg-surface-subtle px-2.5 py-2.5 lg:px-3"
    >
      <ol className="flex items-stretch gap-1">
        {contenders.map((c, i) => {
          const isAdvanced = i < litTo;
          const isActive = i === litTo && !done;
          return (
            <li key={c.label} className="flex min-w-0 flex-1 items-center gap-1">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-pill text-[11px] font-bold tabular-nums transition-colors duration-300 motion-reduce:transition-none",
                  isAdvanced
                    ? "bg-accent-default text-text-on-accent"
                    : isActive
                      ? "ring-2 ring-border-accent text-text-accent"
                      : "bg-surface-strong text-text-secondary",
                )}
              >
                {isAdvanced ? (
                  <Icon name="check" size={13} weight={700} />
                ) : (
                  i + 1
                )}
              </span>
              {i < contenders.length - 1 && (
                <span className="relative h-0.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-surface-strong">
                  <span
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-pill bg-accent-default transition-[width] duration-500 ease-slide motion-reduce:transition-none",
                      i < litTo ? "w-full" : "w-0",
                    )}
                  />
                </span>
              )}
            </li>
          );
        })}
        {/* Trophy seat caps the bracket. */}
        <li className="flex items-center pl-1">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-pill transition-colors duration-300 motion-reduce:transition-none",
              done
                ? "bg-status-success text-text-on-accent"
                : "bg-surface-strong text-icon-tertiary",
            )}
          >
            <Icon name="emoji_events" size={16} weight={600} filled={done} />
          </span>
        </li>
      </ol>
    </div>
  );
}

/**
 * The final slide: the crowned champion (display only, green winner border +
 * "Champion" badge, a celebratory scale/fade reveal gated behind reduced
 * motion) faced off against a dashed ghost "create your own" tile that opens
 * the challenge flow. Mirrors the option-pair geometry: 4:3, 4px seam.
 */
function WinnerVsCreate({
  champion,
  onChallenge,
}: {
  champion: PollOption;
  onChallenge: () => void;
}) {
  const [revealed, setRevealed] = useState(prefersReducedMotion());
  const raf = useRef<number>();
  useEffect(() => {
    if (prefersReducedMotion()) {
      setRevealed(true);
      return;
    }
    raf.current = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(raf.current!);
  }, []);

  return (
    <div className="flex flex-col">
      <h2 className="mb-2 flex items-center gap-1.5 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
        <Icon
          name="emoji_events"
          size={22}
          weight={600}
          filled
          className="text-status-success"
        />
        Champion!
      </h2>

      <div className="relative flex aspect-[4/3] items-stretch justify-center gap-1">
        {/* Left — the champion, display only, green winner frame. */}
        <div
          className={cn(
            "relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md border-2 border-status-success bg-option-bg transition-all duration-500 ease-slide motion-reduce:transition-none",
            revealed ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
          )}
        >
          <div className="flex items-center justify-between gap-2 px-2 py-2.5 lg:px-3 lg:py-3">
            <span className="truncate font-display text-sm font-semibold leading-5 text-text-primary lg:text-lg lg:leading-6">
              {champion.label}
            </span>
            <span className="flex shrink-0 items-center gap-1 rounded-pill bg-status-success px-2 py-0.5 font-sans text-[11px] font-bold uppercase leading-4 tracking-wide text-text-on-accent">
              <Icon name="emoji_events" size={12} weight={700} filled />
              Winner
            </span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <img src={champion.image} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Right — dashed ghost "create your own" challenge tile. */}
        <button
          type="button"
          onClick={onChallenge}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-surface-subtle px-3 py-3 text-center transition-colors hover:border-border-accent hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent"
        >
          <span className="grid size-10 place-items-center rounded-pill bg-card-bg text-text-accent shadow-sm transition-colors group-hover:bg-accent-default group-hover:text-text-on-accent lg:size-12">
            <Icon name="add" size={24} weight={600} />
          </span>
          <span className="font-display text-sm font-bold leading-5 text-text-primary lg:text-base">
            Know something better than {champion.label}?
          </span>
          <span className="font-sans text-xs leading-4 text-text-secondary">
            Create a Polst and put it up against the champ.
          </span>
        </button>

        {/* VS disc — mirrors the OR disc geometry; no border in either theme. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-12 -translate-x-1/2 -translate-y-1/2 lg:size-16">
          <span className="absolute inset-0 rounded-pill bg-surface-raised shadow-sm" />
          <span className="absolute inset-0 grid place-items-center font-display text-base font-bold leading-none text-text-primary lg:text-xl">
            VS
          </span>
        </div>
      </div>
    </div>
  );
}

/** The aggregate leaderboard — ranked contenders with share bars. The leader
 *  carries the violet bar; the rest stay neutral (a minority isn't a loss). */
function Standings({ answer }: { answer: SeoAnswer }) {
  const { leader } = answer;
  return (
    <div>
      <div className="mb-3 flex items-center gap-3 border-b border-border-default pb-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-status-success-soft">
          <Icon name="crown" size={22} className="text-status-success" filled />
        </span>
        <div className="min-w-0">
          <p className="font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-status-success">
            Crowd favourite
          </p>
          <p className="truncate font-display text-lg font-bold leading-[26px] text-text-primary">
            {leader.name}
          </p>
          <p className="font-sans text-xs leading-4 text-text-secondary">
            {leader.share}% of votes ·{" "}
            <span className="font-semibold text-status-success">{leader.trend}</span>{" "}
            · updated {leader.updated}
          </p>
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {answer.leaderboard.map((row, i) => (
          <li key={row.name} className="flex items-center gap-2.5">
            <span className="w-4 shrink-0 text-center font-sans text-xs font-medium tabular-nums text-text-secondary">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "truncate font-sans text-sm leading-5",
                    i === 0 ? "font-semibold text-text-primary" : "text-text-secondary",
                  )}
                >
                  {row.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-sans text-sm leading-5 tabular-nums",
                    i === 0 ? "font-semibold text-text-primary" : "text-text-secondary",
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
    </div>
  );
}

/** Editable keyword title: subject + place chips opening a Menu editor with
 *  quick-pick suggestions. Commits navigate within this variation. */
function KeywordTitle({
  answer,
  go,
}: {
  answer: SeoAnswer;
  go: (subject: string, place?: string) => void;
}) {
  const kw = answer.keywords;
  if (!kw) {
    return (
      <span className="text-xl font-bold leading-7 lg:text-2xl lg:leading-8">
        {answer.title}
      </span>
    );
  }
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-xl font-bold leading-7 lg:text-2xl lg:leading-8">
      <span>Best</span>
      <KeywordChip
        label={kw.subject}
        kind="subject"
        suggestions={kw.subjectSuggestions}
        current={kw.subject}
        onPick={(next) => go(next, kw.place)}
      />
      {kw.place !== undefined && (
        <>
          <span className="font-normal text-text-secondary">in</span>
          <KeywordChip
            label={kw.place}
            kind="place"
            suggestions={kw.placeSuggestions}
            current={kw.place}
            onPick={(next) => go(kw.subject, next)}
          />
        </>
      )}
    </span>
  );
}

function KeywordChip({
  label,
  kind,
  suggestions = [],
  current,
  onPick,
}: {
  label: string;
  kind: "subject" | "place";
  suggestions?: string[];
  current: string;
  onPick: (next: string) => void;
}) {
  const [draft, setDraft] = useState(current);
  const noun = kind === "subject" ? "category" : "place";

  const commit = (value: string) => {
    const next = value.trim();
    if (next) onPick(next);
  };

  return (
    <Menu
      align="start"
      closeOnClick={false}
      label={`Edit ${noun}`}
      className="w-72"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={() => {
            setDraft(current);
            toggle();
          }}
          aria-expanded={open}
          className={cn(
            "group inline-flex items-center gap-1 rounded-md border px-2 py-0.5 align-baseline font-display text-xl font-bold leading-7 transition-colors lg:text-2xl lg:leading-8",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent",
            open
              ? "border-border-accent bg-accent-soft text-text-accent"
              : "border-border-default text-text-accent hover:bg-accent-soft",
          )}
        >
          {label}
          <Icon
            name="edit"
            size={16}
            className="opacity-60 transition-opacity group-hover:opacity-100"
          />
        </button>
      )}
    >
      <form
        className="p-1"
        onSubmit={(e) => {
          e.preventDefault();
          commit(draft);
        }}
      >
        <Field label={kind === "subject" ? "What's the contest?" : "Where?"}>
          {(id) => (
            <TextInput
              id={id}
              autoFocus
              value={draft}
              placeholder={kind === "subject" ? "Burger" : "Chicago"}
              onChange={(e) => setDraft(e.target.value)}
            />
          )}
        </Field>
        <button
          type="submit"
          className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent"
        >
          <Icon name="swords" size={18} weight={600} />
          See the showdown
        </button>
      </form>

      {suggestions.length > 0 && (
        <>
          <MenuSeparator />
          <p className="px-2.5 pb-1 pt-0.5 font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-text-tertiary">
            Popular {kind === "subject" ? "contests" : "cities"}
          </p>
          {suggestions.map((s) => (
            <MenuItem
              key={s}
              icon={s === current ? "check" : kind === "subject" ? "swords" : "location_on"}
              label={s}
              onClick={() => commit(s)}
            />
          ))}
        </>
      )}
    </Menu>
  );
}
