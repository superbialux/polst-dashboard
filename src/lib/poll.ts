/** Pure poll math/formatting shared by cards, mini rows, and results.
 *  (Lives outside the components so they can share it without cycles.) */

export type PollOption = { label: string; image: string; votes?: number };

/** One question of a multi-step poll (same anatomy as a single poll). */
export type PollStep = {
  question: string;
  options: [PollOption, PollOption];
};

/** Clamp copy to a hard character budget with an ellipsis. */
export function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Vote shares for the two options (sum to 100; 50/50 when empty). */
export function voteShares(
  options: [PollOption, PollOption],
): [number, number] {
  const v0 = options[0].votes ?? 0;
  const v1 = options[1].votes ?? 0;
  const total = v0 + v1;
  const pct0 = total ? Math.round((v0 / total) * 100) : 50;
  return [pct0, 100 - pct0];
}

/**
 * A champion ladder resolves each step's left option from the user's running
 * pick: step 0 uses its authored pair; every later step puts the prior step's
 * winner on the left and keeps its authored challenger on the right.
 * `answers[i]` is the option index (0 | 1) chosen at step i, or null if that
 * step is unanswered. Returns the [left, right] pair to display at `index`.
 */
export function resolvedPairAt(
  steps: PollStep[],
  answers: (number | null)[],
  index: number,
): [PollOption, PollOption] {
  if (index === 0) return steps[0].options;
  const prev = answers[index - 1];
  // Upstream step not answered yet — fall back to the authored pair so the
  // slide still renders something valid.
  if (prev == null) return steps[index].options;
  const prevPair = resolvedPairAt(steps, answers, index - 1);
  return [prevPair[prev], steps[index].options[1]];
}

/**
 * The final champion of a fully-answered ladder: the option carried out of the
 * last step. `answers` must hold an index for every step.
 */
export function championOf(steps: PollStep[], answers: number[]): PollOption {
  const last = steps.length - 1;
  const pair = resolvedPairAt(steps, answers, last);
  return pair[answers[last]];
}

/**
 * Build a champion ladder's steps from ordered contenders (strongest first):
 * step 0 is the first pair; each later step adds the next contender as the
 * challenger. The authored left option of steps after the first is a
 * placeholder — `MultiPoll`'s `carryWinner` replaces it with the running pick.
 */
export function ladderSteps(contenders: PollOption[]): PollStep[] {
  return contenders.slice(0, -1).map((_, i) => ({
    question: "Which one wins?",
    options: (i === 0
      ? [contenders[0], contenders[1]]
      : [contenders[0], contenders[i + 1]]) as [PollOption, PollOption],
  }));
}

/** Compact count: 532 → "532", 1000 → "1K", 13485 → "13K". */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`;
  return `${Math.round(n / 1_000_000)}M`;
}

/** Compact count with one decimal: 8100 → "8.1K", 31000 → "31K". */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
}
