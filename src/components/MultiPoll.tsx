import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { resolvedPairAt, voteShares, type PollStep } from "@/lib/poll";
import { Icon } from "./Icon";
import { MiniPoll } from "./MiniPoll";
import { PollOptionsBlock, RESULT_MS } from "./PollCard";

/** Pause on the filled result bars before the next question slides in. */
const ADVANCE_DELAY_MS = 1100;

/**
 * The multi-step poll mechanic: one question at a time, each on the
 * standard option pair. A vote counts up its results, pauses, then the
 * current slide exits left and the next enters from the right. The circles
 * underneath navigate back to anything already answered; the optional
 * final slide (results, completion) slides in after the last answer.
 *
 * Used by the feed's poll card (`steps` prop) and by onboarding's interest
 * step, so onboarding teaches the exact UI the product runs on.
 */
export function MultiPoll({
  steps,
  finalSlide,
  onProgress,
  counterLabel,
  bleed,
  pad,
  carryWinner,
}: {
  steps: PollStep[];
  /** Extra slide appended after the last question (results, completion). */
  finalSlide?: (answers: number[]) => ReactNode;
  /** Fires whenever another step is answered. */
  onProgress?: (answered: number, total: number) => void;
  /** Visible progress line above the circles; omitted → screen-reader only. */
  counterLabel?: (answered: number, total: number) => string;
  /** Negative margins cancelling the parent's inset so slides travel its
   *  full width; `pad` restores that inset inside each slide. */
  bleed?: string;
  pad?: string;
  /** Champion-ladder mode: step i's left option becomes the user's pick from
   *  step i-1 (resolved down the chain). The authored `options[0]` of steps
   *  after the first is a placeholder and is ignored. */
  carryWinner?: boolean;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    steps.map(() => null),
  );
  const [index, setIndex] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>();

  const answered = answers.filter((a) => a !== null).length;
  const finished = answered === steps.length;
  const slideCount = steps.length + (finalSlide ? 1 : 0);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const vote = (step: number, option: number) => {
    if (answers[step] !== null) return;
    const next = answers.map((a, i) => (i === step ? option : a));
    setAnswers(next);
    onProgress?.(next.filter((a) => a !== null).length, steps.length);
    // Let the count finish, hold on the result, then slide onward.
    const target = Math.min(
      step + 1,
      finalSlide ? steps.length : steps.length - 1,
    );
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      setIndex(target);
    }, RESULT_MS + ADVANCE_DELAY_MS);
  };

  return (
    <div className="flex flex-col">
      <SlideTrack index={index} count={slideCount} bleed={bleed} pad={pad}>
        {steps.map((step, i) => {
          const options = carryWinner
            ? resolvedPairAt(steps, answers, i)
            : step.options;
          return (
            <div key={step.question + i} className="flex flex-col">
              <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
                {step.question}
              </h2>
              <PollOptionsBlock
                options={options}
                selected={answers[i]}
                onSelect={(option) => vote(i, option)}
              />
            </div>
          );
        })}
        {finalSlide && (
          <div className="flex flex-col">
            {finished && finalSlide(answers as number[])}
          </div>
        )}
      </SlideTrack>

      {/* Progress — visible only when asked for (onboarding); the feed card
          lets the circles speak for themselves. */}
      <p
        aria-live="polite"
        className={cn(
          "mt-3 text-center font-sans text-xs leading-4 text-text-secondary",
          !counterLabel && "sr-only",
        )}
      >
        {(counterLabel ?? ((a, t) => `${a} of ${t} answered`))(
          answered,
          steps.length,
        )}
      </p>
      <div className={cn("flex items-center justify-center", counterLabel ? "mt-1.5" : "mt-3")}>
        {steps.map((step, i) => {
          const isAnswered = answers[i] !== null;
          const reachable = isAnswered || i <= answered;
          return (
            <button
              key={i}
              type="button"
              disabled={!reachable}
              onClick={() => setIndex(i)}
              aria-label={`Question ${i + 1}${isAnswered ? " (answered)" : ""}`}
              aria-current={index === i ? "step" : undefined}
              className="group grid h-8 w-8 place-items-center disabled:cursor-default"
            >
              {isAnswered ? (
                <span
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded-pill bg-accent-default transition-transform",
                    index === i && "scale-110",
                    index !== i && "group-hover:scale-110",
                  )}
                >
                  <Icon
                    name="check"
                    size={12}
                    weight={700}
                    className="text-text-on-accent"
                  />
                </span>
              ) : (
                <span
                  className={cn(
                    "h-4 w-4 rounded-pill border-2",
                    index === i
                      ? "border-accent-default"
                      : "border-border-strong",
                  )}
                />
              )}
            </button>
          );
        })}
        {finalSlide && finished && (
          <button
            type="button"
            onClick={() => setIndex(steps.length)}
            aria-label="Results"
            aria-current={index === steps.length ? "step" : undefined}
            className="grid h-8 w-8 place-items-center"
          >
            <span
              className={cn(
                "grid h-4 w-4 place-items-center rounded-pill border-2",
                index === steps.length
                  ? "border-accent-default text-text-accent"
                  : "border-border-strong text-icon-tertiary",
              )}
            >
              <Icon name="equalizer" size={10} weight={700} />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/** The default final slide, shaped exactly like a question slide — the
 *  verdict line in the question's slot, then one tile at the option pair's
 *  aspect ratio and background holding the answered questions as mini poll
 *  rows (the same rows as Highest Volume), scrolling vertically. */
export function MultiPollResults({
  steps,
  answers,
}: {
  steps: PollStep[];
  answers: number[];
}) {
  const majorityCount = answers.filter((answer, i) => {
    const shares = voteShares(steps[i].options);
    return shares[answer] >= shares[1 - answer];
  }).length;

  return (
    <div className="flex flex-col">
      <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
        You agreed with the majority on {majorityCount} of {steps.length}.
      </h2>

      <ul className="flex aspect-[4/3] flex-col gap-1 overflow-y-auto overscroll-contain rounded-md bg-option-bg p-2 lg:gap-1.5 lg:p-3">
        {steps.map((q, i) => {
          const shares = voteShares(q.options);
          const pick = q.options[answers[i]];
          const verdict =
            shares[0] === shares[1]
              ? "Split"
              : answers[i] === (shares[0] > shares[1] ? 0 : 1)
                ? "Majority"
                : "Minority";
          return (
            <li
              key={q.question}
              className="flex shrink-0 items-start gap-3 rounded-sm bg-surface-raised px-2 py-2"
            >
              <MiniPoll
                question={q.question}
                options={q.options}
                topLine={
                  <>
                    You voted{" "}
                    <span className="font-semibold text-text-primary">
                      {pick.label}
                    </span>{" "}
                    ·{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        verdict === "Majority"
                          ? "text-status-success"
                          : "text-text-secondary",
                      )}
                    >
                      {verdict}
                    </span>
                  </>
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Horizontal slide carousel: offscreen slides are inert and hidden from
 *  assistive tech; the container's height follows the active slide so the
 *  card never reserves the tallest slide's space. With `bleed`/`pad`, the
 *  track spans the parent's full width (slides enter and exit at the
 *  edges) while content keeps the parent's inset. */
export function SlideTrack({
  index,
  count,
  bleed,
  pad,
  children,
}: {
  index: number;
  count: number;
  bleed?: string;
  pad?: string;
  children: ReactNode;
}) {
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState<number>();

  // Track the active slide's height (images and wraps included).
  useEffect(() => {
    const el = slideRefs.current[index];
    if (!el) return;
    const update = () => setHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  // Offscreen slides must not take focus or be read.
  useEffect(() => {
    slideRefs.current.forEach((el, i) => {
      if (el?.parentElement) {
        el.parentElement.inert = i !== index;
        el.parentElement.setAttribute("aria-hidden", String(i !== index));
      }
    });
  }, [index, count]);

  const setRef = useCallback(
    (i: number) => (el: HTMLDivElement | null) => {
      slideRefs.current[i] = el;
    },
    [],
  );

  const slides = Children.toArray(children);

  return (
    <div
      className={cn(
        "overflow-hidden transition-[height] duration-500 ease-slide motion-reduce:transition-none",
        bleed,
      )}
      style={{ height }}
    >
      <div
        className="flex items-start transition-transform duration-500 ease-slide motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-full shrink-0">
            <div ref={setRef(i)} className={pad}>
              {slide}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
