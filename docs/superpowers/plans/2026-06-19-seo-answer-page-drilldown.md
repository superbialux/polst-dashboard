# SEO Answer Page — Drill-down & Editable Keywords Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the SEO answer page (`/q/:slug`) into a champion-ladder drill-down that ends in a create-a-Polst growth loop, with editable keyword chips in the title.

**Architecture:** Additive, reuse-first changes. A pure ladder helper in `lib/poll.ts` drives a new opt-in `carryWinner` prop on the existing `MultiPoll`. The page (`SearchAnswer.tsx`) composes `MultiPoll` directly with a custom final slide (winner vs dashed create-CTA), seeds its own `NewPollModal` instance, and renders editable subject/place chips in the `<h1>`. No other screen changes.

**Tech Stack:** React 18 + TypeScript, React Router 7, Vite, Tailwind (three-layer design tokens). No test runner is installed.

## Global Constraints

- **Reuse over invention.** Extend by prop, never fork. `MultiPoll` is reused, not duplicated; the create flow reuses `NewPollModal`; chips reuse `Menu` + `TextInput`.
- **Additive & backward-compatible only.** Every shared-file change is opt-in; absent the new prop/field, existing behavior is byte-for-byte unchanged. Do **not** modify `PollCard.tsx`, the feed, onboarding, or the global `openNewPoll` flow.
- **Design tokens, three layers.** Consume semantic tokens only: `status-success` (winner/verified), `accent`/`accent-default` (interactive only), `border-strong`, `border-default`, `surface-subtle`, `surface-strong`, `surface-raised`, `option-bg`, `card-bg`, `text-primary`, `text-secondary`, `text-on-accent`, `icon-secondary`. No raw hex, no `#000`, no bare `white`.
- **4pt grid + existing geometry.** Reuse `aspect-[4/3]`, `gap-1`, the `size-12 lg:size-16` OR disc, `rounded-md`/`rounded-card`/`rounded-pill`, card insets (`px-2.5 lg:px-4`). No new spacing or radius values.
- **No dead ends.** Keyword edits always resolve (curated → synthesized via existing `seoAnswerFor`). Missing `ladder`/`keywords` fall back to today's rendering.
- **Testing approach (deviation, by design):** The repo has **no test framework** (scripts are only `dev`/`build`/`preview`; zero test files) and is a visually-verified mockup. Adding a harness would violate the user's "don't change existing stuff" rule. Verification per task is therefore: **`npx tsc --noEmit` must pass**, plus `npm run build` and **Playwright MCP** interaction/screenshot checks for UI tasks. Pure logic (Task 1) is verified by typecheck + a documented trace and exercised live in Task 5.

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/lib/poll.ts` | Pure poll math + the new ladder-carry helpers. | Add `resolvedPairAt`, `championOf`. |
| `src/components/MultiPoll.tsx` | Multi-step poll mechanic. | Add opt-in `carryWinner` prop. |
| `src/lib/data.ts` | Mock data + `SeoAnswer` type. | Add optional `keywords` + `ladder`; mock on burger page. |
| `src/components/NewPollModal.tsx` | Compose-a-poll dialog. | Add optional `seed`, `onSubmit`, `submitLabel`. |
| `src/pages/SearchAnswer.tsx` | The SEO answer page. | Champion ladder + winner/create final slide + seeded create flow + editable title chips; remove primary `PollCard` + "Continue answering". |

---

## Task 1: Ladder-carry helpers (`lib/poll.ts`)

**Files:**
- Modify: `src/lib/poll.ts` (append after `voteShares`, before `formatCount`)

**Interfaces:**
- Consumes: existing `PollStep`, `PollOption` from this module.
- Produces:
  - `resolvedPairAt(steps: PollStep[], answers: (number | null)[], index: number): [PollOption, PollOption]`
  - `championOf(steps: PollStep[], answers: number[]): PollOption`

- [ ] **Step 1: Add the two helpers**

Append to `src/lib/poll.ts` (after the `voteShares` function, around line 26):

```ts
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
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit`
Expected: no errors.

Manual trace to confirm correctness (contenders C0,C1,C2,C3 → steps `[[C0,C1],[*,C2],[*,C3]]`):
- `resolvedPairAt(steps, [0,null,null], 1)` → prev=0 → prevPair=[C0,C1] → `[C0, C2]`. ✓ (picked C0, now C0 vs C2)
- `resolvedPairAt(steps, [1,null,null], 1)` → `[C1, C2]`. ✓ (picked C1, now C1 vs C2)
- `championOf(steps, [1,1,0])` → last=2, pair=resolvedPairAt(.,.,2): prev=answers[1]=1 → prevPair=resolvedPairAt(.,.,1)=[C1,C2] → [C2,C3]; pair[answers[2]=0]=C2. ✓

- [ ] **Step 3: Commit**

```bash
git add src/lib/poll.ts
git commit -m "Add champion-ladder carry helpers (resolvedPairAt, championOf)"
```

---

## Task 2: `carryWinner` prop on `MultiPoll` (`MultiPoll.tsx`)

**Files:**
- Modify: `src/components/MultiPoll.tsx` (import, props type, render map)

**Interfaces:**
- Consumes: `resolvedPairAt` from Task 1.
- Produces: `MultiPoll` accepts optional `carryWinner?: boolean`. When set, step `i`'s left option (i ≥ 1) is the user's pick from step `i-1`. Default/absent → unchanged.

- [ ] **Step 1: Import the helper**

In `src/components/MultiPoll.tsx`, update the import from `@/lib/poll` (currently `import { voteShares, type PollStep } from "@/lib/poll";`) to:

```ts
import { resolvedPairAt, voteShares, type PollStep } from "@/lib/poll";
```

- [ ] **Step 2: Add the prop to the signature**

In the `MultiPoll` props object type, add after `pad?: string;`:

```ts
  /** Champion-ladder mode: step i's left option becomes the user's pick from
   *  step i-1 (resolved down the chain). The authored `options[0]` of steps
   *  after the first is a placeholder and is ignored. */
  carryWinner?: boolean;
```

And add `carryWinner,` to the destructured params (next to `pad,`).

- [ ] **Step 3: Use the resolved pair when rendering each step**

In the `steps.map((step, i) => ...)` body inside `<SlideTrack>`, replace the `<PollOptionsBlock .../>` block so the options come from the resolver when `carryWinner` is on:

```tsx
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
```

(The `answers` state is already `(number | null)[]`, matching `resolvedPairAt`'s signature.)

- [ ] **Step 4: Verify typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 5: Verify existing callers are unaffected**

Confirm no existing caller passes `carryWinner` (so feed/onboarding behavior is unchanged):

Run: `grep -rn "carryWinner" src/`
Expected: matches only in `src/components/MultiPoll.tsx` (and later `SearchAnswer.tsx` once Task 5 lands).

- [ ] **Step 6: Commit**

```bash
git add src/components/MultiPoll.tsx
git commit -m "MultiPoll: opt-in carryWinner mode for champion ladders"
```

---

## Task 3: `keywords` + `ladder` data on `SeoAnswer` (`lib/data.ts`)

**Files:**
- Modify: `src/lib/data.ts` (`SeoAnswer` type ~line 611; `BEST_BURGER_PAGE` ~line 630)

**Interfaces:**
- Consumes: existing `PollOption`, `img()`, `BEST_BURGER_PAGE`.
- Produces: `SeoAnswer.keywords?` and `SeoAnswer.ladder?` (both optional); `BEST_BURGER_PAGE` populated with both.

- [ ] **Step 1: Extend the `SeoAnswer` type**

In `src/lib/data.ts`, inside `export type SeoAnswer = { ... }`, add before the closing brace (after `trendingNearby`):

```ts
  /** Editable title keywords. Absent → the plain `title` renders. */
  keywords?: {
    subject: string;
    place?: string;
    subjectSuggestions?: string[];
    placeSuggestions?: string[];
  };
  /** Champion-ladder contenders (≥ 3), ordered strongest-first. Absent → the
   *  page keeps showing the single `poll`. Aggregate shares for the per-step
   *  count-up ride on each option's `votes`. */
  ladder?: {
    contenders: PollOption[];
  };
```

- [ ] **Step 2: Populate the burger page**

In `const BEST_BURGER_PAGE: SeoAnswer = { ... }`, add these two fields (e.g. right after the `stats: {...}` line):

```ts
  keywords: {
    subject: "Burger",
    place: "Chicago",
    subjectSuggestions: ["Burger", "Deep Dish Pizza", "Hot Dog", "Italian Beef"],
    placeSuggestions: ["Chicago", "New York", "Los Angeles", "Austin"],
  },
  ladder: {
    contenders: [
      { label: "Au Cheval", image: img("burger-aucheval"), votes: 4640 },
      { label: "Small Cheval", image: img("burger-smallcheval"), votes: 2744 },
      { label: "The Loyalist", image: img("burger-loyalist"), votes: 1880 },
      { label: "Redhot Ranch", image: img("burger-redhot"), votes: 1104 },
    ],
  },
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/data.ts
git commit -m "SeoAnswer: optional keywords + ladder; mock the burger page"
```

---

## Task 4: Seed + submit override on `NewPollModal` (`NewPollModal.tsx`)

**Files:**
- Modify: `src/components/NewPollModal.tsx` (imports, props, seed effect, Post button)

**Interfaces:**
- Consumes: existing `Choice` type, `EMPTY_CHOICES`.
- Produces: `NewPollModal` accepts optional `seed?: { question?: string; choices?: [Choice, Choice]; category?: string; tags?: string[] }`, `onSubmit?: () => void`, `submitLabel?: string`. Absent → unchanged behavior.

- [ ] **Step 1: Add `useEffect` to the React import**

The file already imports `{ useEffect, useRef, useState }` from "react" (line 1) — no change needed; confirm `useEffect` is present.

- [ ] **Step 2: Extend the props**

Change the `NewPollModal` signature:

```tsx
export function NewPollModal({
  open,
  onClose,
  seed,
  onSubmit,
  submitLabel,
}: {
  open: boolean;
  onClose: () => void;
  /** Pre-fill the composer (e.g. challenge a winning option). */
  seed?: {
    question?: string;
    choices?: [Choice, Choice];
    category?: string;
    tags?: string[];
  };
  /** Replaces the default publish when provided (e.g. gate behind auth). */
  onSubmit?: () => void;
  /** Overrides the Post button label. */
  submitLabel?: string;
}) {
```

- [ ] **Step 3: Apply the seed when the dialog opens**

Add this effect right after the `questionShake` line (after the `useState` declarations):

```tsx
  // Seeded opens (the SEO challenge flow) pre-fill the composer each time the
  // dialog transitions open. Unseeded opens (the global "Ask the world"
  // button) leave state untouched — existing behavior is preserved.
  useEffect(() => {
    if (open && seed) {
      setQuestion(seed.question ?? "");
      setChoices(seed.choices ?? EMPTY_CHOICES);
      setCategory(seed.category ?? "");
      setTags(seed.tags ?? []);
    }
  }, [open, seed]);
```

- [ ] **Step 4: Route the Post button through the override**

Change the footer Post button's `onClick` and label:

```tsx
          <button
            onClick={onSubmit ?? post}
            disabled={!canPost}
            className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitLabel ?? "Post"}
          </button>
```

- [ ] **Step 5: Verify typecheck + that the global modal is unchanged**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. The global instance in `App.tsx` passes no `seed`/`onSubmit`/`submitLabel`, so the effect's `seed` guard is falsy and `onClick` falls back to `post` — behavior preserved.

- [ ] **Step 6: Commit**

```bash
git add src/components/NewPollModal.tsx
git commit -m "NewPollModal: optional seed, submit override, and label"
```

---

## Task 5: Champion ladder + winner/create final slide + create flow (`SearchAnswer.tsx`)

**Files:**
- Modify: `src/pages/SearchAnswer.tsx` (imports; replace the primary `PollCard` + "Continue answering" block with `ChampionLadder`; add `WinnerVsCreate`, `ladderSteps`, and a seeded `NewPollModal`)

**Interfaces:**
- Consumes: `MultiPoll` (`carryWinner`), `championOf`, `ladderSteps` (local), `NewPollModal` (`seed`/`onSubmit`/`submitLabel`), `PollOption`, `useSession`, `useUI`.
- Produces: the page renders the ladder as the centerpiece; no longer renders `answer.poll` as a standalone `PollCard` nor `answer.followOns` as "Continue answering".

- [ ] **Step 1: Update imports**

In `src/pages/SearchAnswer.tsx`, add/adjust imports:

```ts
import { useState } from "react";
import { MultiPoll } from "@/components/MultiPoll";
import { NewPollModal } from "@/components/NewPollModal";
import { championOf, type PollOption, type PollStep } from "@/lib/poll";
```

Remove the now-unused `PollMiniRow` import if nothing else uses it after this task (verify with grep in Step 7). Keep `PollCard` imported only if still referenced; the fallback below still uses it.

- [ ] **Step 2: Add the ladder-step builder and the final slide (module scope, below the page component)**

```tsx
/** Build the ladder's steps from ordered contenders: step 0 is the first
 *  pair; each later step adds the next contender as the challenger (its left
 *  option is a placeholder — MultiPoll's carryWinner replaces it with the
 *  user's running pick). */
function ladderSteps(contenders: PollOption[]): PollStep[] {
  return contenders.slice(0, -1).map((_, i) => ({
    question: "Which one wins?",
    options:
      i === 0
        ? [contenders[0], contenders[1]]
        : [contenders[0], contenders[i + 1]],
  }));
}

/** The ladder's final slide: the crowned pick (display only, green winner
 *  border) beside a dashed create-a-Polst CTA — the growth loop. */
function WinnerVsCreate({
  champion,
  onCreate,
}: {
  champion: PollOption;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
        Your pick: {champion.label}
      </h2>
      <div className="relative flex aspect-[4/3] items-stretch justify-center gap-1">
        {/* Winner — display only. */}
        <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-md border-2 border-status-success bg-option-bg">
          <div className="flex items-center gap-2 px-2 py-2.5 lg:px-3 lg:py-3">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-status-success">
              <Icon
                name="check"
                size={14}
                weight={700}
                className="text-text-on-accent"
              />
            </span>
            <span className="truncate font-display text-sm font-semibold leading-5 text-text-primary lg:text-lg lg:leading-6">
              {champion.label}
            </span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <img
              src={champion.image}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute left-2 top-2 rounded-pill bg-status-success px-2 py-0.5 font-sans text-xs font-semibold leading-4 text-text-on-accent shadow-sm">
              Winner
            </span>
          </div>
        </div>
        {/* Create CTA — dashed ghost option. */}
        <button
          type="button"
          onClick={onCreate}
          className="group flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-surface-subtle px-4 text-center transition-colors hover:border-accent-default hover:bg-surface-strong"
        >
          <span className="grid h-10 w-10 place-items-center rounded-pill bg-surface-raised text-icon-secondary transition-colors group-hover:text-text-accent">
            <Icon name="add" size={22} weight={600} />
          </span>
          <span className="font-display text-sm font-bold leading-5 text-text-primary lg:text-base">
            Know something better than {champion.label}?
          </span>
          <span className="font-sans text-xs leading-4 text-text-secondary">
            Create a Polst and see if people agree.
          </span>
        </button>
        {/* OR disc — same geometry as the option pair. */}
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
```

- [ ] **Step 3: Add the `ChampionLadder` card (module scope)**

```tsx
/** The page centerpiece: a titled card wrapping the carry-forward MultiPoll,
 *  ending in the winner-vs-create slide. */
function ChampionLadder({
  contenders,
  onChallenge,
}: {
  contenders: PollOption[];
  onChallenge: (champion: PollOption) => void;
}) {
  const steps = ladderSteps(contenders);
  return (
    <div className="overflow-hidden rounded-card border border-border-default bg-card-bg px-2.5 py-3 shadow-sm lg:px-4 lg:py-4">
      <p className="mb-0.5 font-sans text-xs font-semibold uppercase leading-4 tracking-wide text-text-accent">
        Find your pick
      </p>
      <MultiPoll
        steps={steps}
        carryWinner
        bleed="-mx-2.5 lg:-mx-4"
        pad="px-2.5 lg:px-4"
        counterLabel={(answered, total) =>
          `Round ${Math.min(answered + 1, total)} of ${total}`
        }
        finalSlide={(answers) => (
          <WinnerVsCreate
            champion={championOf(steps, answers)}
            onCreate={() => onChallenge(championOf(steps, answers))}
          />
        )}
      />
    </div>
  );
}
```

- [ ] **Step 4: Wire create-flow state into the page component**

Inside `export function SearchAnswer()`, after the existing hooks (`const { signedIn } = useSession();` etc.), add:

```tsx
  const [challengeFor, setChallengeFor] = useState<PollOption | null>(null);

  const submitChallenge = () => {
    setChallengeFor(null);
    if (!signedIn) openAuth("signup");
    else toast("Poll published");
  };
```

- [ ] **Step 5: Replace the `<main>` content**

Replace the existing `<main>` block (the `<div>` wrapping `<PollCard {...answer.poll} />` and the `followOns` `RailBox`) with the ladder when present, falling back to today's single poll otherwise:

```tsx
        <main className="flex min-w-0 flex-col gap-4">
          {answer.ladder ? (
            <ChampionLadder
              contenders={answer.ladder.contenders}
              onChallenge={setChallengeFor}
            />
          ) : (
            <div className="overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm">
              <PollCard {...answer.poll} />
            </div>
          )}
        </main>
```

- [ ] **Step 6: Render the seeded `NewPollModal`**

Just before the closing `</PageShell>` of the main return, add:

```tsx
      <NewPollModal
        open={challengeFor !== null}
        onClose={() => setChallengeFor(null)}
        onSubmit={submitChallenge}
        submitLabel={signedIn ? "Post" : "Sign up to publish"}
        seed={
          challengeFor
            ? {
                question: `Better than ${challengeFor.label}?`,
                choices: [
                  { label: challengeFor.label, image: challengeFor.image },
                  { label: "", image: null },
                ],
                category: "Food",
                tags: ["chicago", "burgers"],
              }
            : undefined
        }
      />
```

- [ ] **Step 7: Verify typecheck, build, and no dead imports**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed (no "unused import" hard error, but remove any genuinely unused `PollMiniRow`/`PollCard` import flagged by tsc).
Run: `grep -n "PollMiniRow\|followOns" src/pages/SearchAnswer.tsx`
Expected: no remaining references to `followOns`; remove the `PollMiniRow` import if unreferenced.

- [ ] **Step 8: Verify behavior with Playwright MCP**

Start the dev server (`npm run dev`), then with the Playwright MCP:
1. Navigate to `http://localhost:5173/q/best-burger-in-chicago`.
2. Confirm the ladder card shows "Au Cheval OR Small Cheval", "Round 1 of 3".
3. Click an option → results count up → slides to the next round with your pick carried to the **left** tile.
4. Finish all rounds → final slide shows your pick with a green "Winner" border + the dashed "Know something better than …?" CTA.
5. Click the CTA → `NewPollModal` opens pre-filled with your pick as choice A and Post labeled "Sign up to publish".
6. Click Post → the auth (sign-up) modal opens.
Capture a screenshot of the final slide for the record.

- [ ] **Step 9: Commit**

```bash
git add src/pages/SearchAnswer.tsx
git commit -m "SEO page: champion-ladder drill-down + winner/create growth loop"
```

---

## Task 6: Editable keyword chips in the title (`SearchAnswer.tsx`)

**Files:**
- Modify: `src/pages/SearchAnswer.tsx` (imports; the `<h1>` in the page header; add `KeywordTitle` + `KeywordChip`)

**Interfaces:**
- Consumes: `answer.keywords`, `useNavigate`, `pollSlug`, `Menu`, `TextInput`.
- Produces: the `<h1>` renders editable subject/place chips when `keywords` exists; otherwise the plain `title` (unchanged).

- [ ] **Step 1: Update imports**

Add to `src/pages/SearchAnswer.tsx`:

```ts
import { useNavigate } from "react-router-dom";
import { Menu } from "@/components/Menu";
import { TextInput } from "@/components/Field";
import { pollSlug, seoAnswerFor, type SeoAnswer } from "@/lib/data";
```

(`useParams`/`Link` are already imported from `react-router-dom`; add `useNavigate` to that line. `seoAnswerFor`/`SeoAnswer` are already imported — keep one import line, just add `pollSlug`.)

- [ ] **Step 2: Add `KeywordChip` and `KeywordTitle` (module scope)**

```tsx
/** One editable keyword in the SEO title: a pill that opens a small editor
 *  (free text + suggestions). Committing calls `onCommit` with the new value. */
function KeywordChip({
  value,
  suggestions = [],
  onCommit,
}: {
  value: string;
  suggestions?: string[];
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <Menu
      label={`Edit "${value}"`}
      closeOnClick={false}
      className="w-72 p-3"
      trigger={({ open, toggle }) => (
        <button
          onClick={() => {
            setDraft(value);
            toggle();
          }}
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-pill border border-border-default bg-surface-raised px-3 py-0.5 text-text-accent underline decoration-dotted underline-offset-4 transition-colors hover:bg-surface-subtle"
        >
          {value}
          <Icon name="edit" size={16} className="text-icon-secondary" />
        </button>
      )}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = draft.trim();
          if (next) onCommit(next);
        }}
        className="flex flex-col gap-2"
      >
        <TextInput
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Edit keyword"
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onCommit(s)}
                className="rounded-md border border-border-default px-2.5 py-1 font-sans text-xs font-medium leading-4 text-text-secondary transition-colors hover:bg-surface-subtle"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <button
          type="submit"
          className="h-9 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
        >
          Go
        </button>
      </form>
    </Menu>
  );
}

/** The SEO `<h1>` with editable subject/place keywords. Editing rebuilds the
 *  slug and navigates; curated pages resolve directly, others fall through to
 *  the synthesized answer. */
function KeywordTitle({ keywords }: { keywords: NonNullable<SeoAnswer["keywords"]> }) {
  const navigate = useNavigate();
  const go = (subject: string, place?: string) => {
    const phrase = place ? `Best ${subject} in ${place}` : `Best ${subject}`;
    navigate(`/q/${pollSlug(phrase)}`);
  };
  return (
    <h1 className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-xl font-bold leading-7 text-text-primary lg:text-2xl lg:leading-8">
      <span>Best</span>
      <KeywordChip
        value={keywords.subject}
        suggestions={keywords.subjectSuggestions}
        onCommit={(next) => go(next, keywords.place)}
      />
      {keywords.place && (
        <>
          <span>in</span>
          <KeywordChip
            value={keywords.place}
            suggestions={keywords.placeSuggestions}
            onCommit={(next) => go(keywords.subject, next)}
          />
        </>
      )}
    </h1>
  );
}
```

- [ ] **Step 3: Use `KeywordTitle` in the header**

In the page header, replace the existing `<h1>{answer.title}</h1>` with a conditional:

```tsx
          {answer.keywords ? (
            <KeywordTitle keywords={answer.keywords} />
          ) : (
            <h1 className="font-display text-xl font-bold leading-7 text-text-primary lg:text-2xl lg:leading-8">
              {answer.title}
            </h1>
          )}
```

- [ ] **Step 4: Verify typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 5: Verify behavior with Playwright MCP**

With the dev server running:
1. Navigate to `/q/best-burger-in-chicago`.
2. Confirm the `<h1>` reads "Best [Burger] in [Chicago]" with the two words as editable pills.
3. Click "Burger" → editor opens → click the "Deep Dish Pizza" suggestion → URL becomes `/q/best-deep-dish-pizza-in-chicago` and the page renders a synthesized answer (no crash, never empty).
4. Use the browser back button → returns to the burger page.
Capture a screenshot of the editable title.

- [ ] **Step 6: Commit**

```bash
git add src/pages/SearchAnswer.tsx
git commit -m "SEO page: editable subject/place keyword chips in the title"
```

---

## Self-Review

**Spec coverage:**
- Champion-ladder drill-down → Tasks 1, 2, 5. ✓
- Winner-vs-create final slide (display-only winner, dashed CTA) → Task 5. ✓
- Editable keyword chips → Tasks 3, 6. ✓
- Seeded create flow + auth gate → Tasks 4, 5. ✓
- Replace primary poll + "Continue answering" → Task 5 Step 5/7. ✓
- Data fields + fallbacks → Task 3 (+ fallbacks in Tasks 5/6). ✓
- DS compliance / tokens / 4pt grid → Global Constraints + concrete classes. ✓
- A11y (aria-expanded chips, display-only winner, labeled inputs) → Tasks 5/6. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N" — every code step shows complete code. ✓

**Type consistency:** `resolvedPairAt`/`championOf` signatures match across Tasks 1, 2, 5. `seed`/`onSubmit`/`submitLabel` names match across Tasks 4 and 5. `PollOption`/`PollStep`/`SeoAnswer` used as defined. `ladderSteps`/`WinnerVsCreate`/`ChampionLadder`/`KeywordTitle`/`KeywordChip` referenced consistently. ✓

**Note on testing:** Unit tests from the spec's testing section are realized as typecheck + documented trace (Task 1) and live Playwright interaction checks (Tasks 5, 6), because the repo has no test runner and adding one is out of scope. Flagged in Global Constraints.
