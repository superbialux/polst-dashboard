# SEO Answer Page — Drill-down & Editable Keywords

**Date:** 2026-06-19
**Scope:** Enhancements to the existing search/SEO answer page (`/q/:slug`, `src/pages/SearchAnswer.tsx`). Additive only. No other screen changes.

## Problem

A user searches Google ("best burger in Chicago") and lands on Polst's
aggregated answer for that question. The page must (1) answer the intent
immediately — who's winning — and (2) pull the visitor into the product:
drill down their own preference, then convert them into a poll creator.

The page already exists and already delivers the prominent winner
(`AnswerStrip`), a `Leaderboard`, trending-nearby, related topics, breadcrumbs,
and a create CTA. Today its interactive core is a single primary `PollCard`
plus a "Continue answering" list of follow-on mini-rows. This spec replaces
that core with a **champion-ladder drill-down** that ends in a **create-a-Polst
growth loop**, and makes the page title's keywords **editable**.

## Goals

- Replace the standalone primary `PollCard` + "Continue answering" list with a
  single interactive **champion ladder**.
- End the ladder on a final tile that crowns the user's pick and invites them
  to challenge it by creating a Polst (auth-gated).
- Make the title's subject and place **editable chips** that navigate to other
  SEO slugs.
- Reuse existing primitives. Extend by prop, never fork. Honor the design
  system (tokens in three layers, 4pt grid, green = success/verified,
  violet = interactive).

## Non-goals

- No new rail sections beyond what exists. Leaderboard, trending-nearby,
  related topics, and the create CTA stay as-is.
- No real backend / persistence. All data is mocked (`lib/data.ts`).
- No changes to the feed, onboarding, or any screen other than the SEO page.
- No new pairwise-polst graph: the ladder is a curated champion ladder, not an
  adaptive lookup against pre-authored pairings.

## Decisions (resolved during brainstorming)

1. **Drill-down logic = champion ladder.** Fixed ordered contenders from the
   leaderboard. Each step pits the user's running pick (champion) against the
   next challenger; the user's pick always advances. The champion is the
   *user's* pick, not the aggregate leader (matches the Pizza→Sushi→Candy
   example). Pairing data is mocked.
2. **Keyword UI = editable chips → new page.** Subject + place render as
   editable pill-chips; committing navigates to the rebuilt slug. Falls through
   to the existing `seoAnswerFor` synthesis when no curated page exists.
3. **Page composition = replace.** The ladder replaces both the standalone
   primary `PollCard` and the "Continue answering" rail list.
4. **Final-tile winner side = display only.** No vote, no result bar — it's the
   verdict. Only the right-side ghost CTA is interactive.
5. **Create seed = pre-seed the winner as one side.** `NewPollModal` opens with
   the champion pre-filled as option A; the user adds their challenger.

## Architecture

### Component map

```
SearchAnswer (page)
├── Title with editable keyword chips        [C] new — local to page
├── AnswerStrip                              unchanged
├── methodology/verdict caption              [optional, text only]
├── main
│   └── ChampionLadder card                  [A] new — local to page
│       └── MultiPoll (carryWinner)          [A] extend by prop
│           ├── PollOptionsBlock (per step)  reused
│           └── finalSlide → WinnerVsCreate  [B] new — local to page
│               ├── winner tile (display)    reuse option-tile geometry
│               └── ghost CTA tile (dashed)  [B] new — local to page
│                   └── opens NewPollModal    [D] reuse, seeded
└── aside (rail)                             unchanged
    ├── Leaderboard
    ├── trending-nearby
    ├── related topics ("Explore more")
    └── create CTA
```

### A. Champion-ladder drill-down

Rendered as a `PollCard`-shaped container (`rounded-card border bg-card-bg
shadow-sm`) below `AnswerStrip`, replacing the old primary `PollCard` block.

Contenders are taken in leaderboard order. Step semantics:

- Step 0: `contender[0]` vs `contender[1]` → user picks `W0`.
- Step *i* (i ≥ 1): `W(i-1)` (left) vs `contender[i+1]` (right) → `Wi`.
- Final champion = `W(last)`.

Each vote counts up the real aggregate shares via the existing
`PollOptionsBlock` animation, pauses (`ADVANCE_DELAY_MS`), then slides on — the
exact existing `MultiPoll` mechanic.

**`MultiPoll` extension (extend-by-prop, backward compatible):**

- New optional prop `carryWinner?: boolean`.
- When set, the slide map substitutes step *i*'s **left** option (i ≥ 1) with
  the option the user selected at step *i-1*, resolved down the chain from
  step 0. `steps[i].options[0]` for i ≥ 1 becomes a placeholder (ignored);
  authors only supply the challenger (`options[1]`) for those steps, plus the
  full pair for step 0.
- When absent, `MultiPoll` behaves exactly as today. No existing caller
  (feed `PollCard` `steps`, onboarding) passes the prop, so their behavior is
  unchanged.

**`lib/poll.ts` helper (new, pure):**

```ts
/** Resolve the carried winner across a champion ladder, given the user's
 *  per-step picks. Step 0 uses its own pair; each later step's left option
 *  is the prior step's winner. Returns the final champion option. */
export function championOf(steps: PollStep[], answers: number[]): PollOption
```

Used by both `MultiPoll` (to render carried left options) and the page's
final slide (to label the champion). Single source of truth for the carry
logic; no duplication.

### B. Final slide — winner vs "create your own"

Passed through `MultiPoll`'s **existing** `finalSlide` prop — no new slide
mechanic. It is a static option pair shaped like a poll (same `aspect-[4/3]`
split + OR disc geometry as `PollOptionsBlock`):

- **Left — the champion (display only):** the winning option tile with a green
  `status-success` border and a small "Winner" marker (e.g. a crown/check
  chip). Not a button; no vote, no result bar. Computed via
  `championOf(steps, answers)`.
- **Right — ghost CTA (dashed):** a tile reusing the option geometry but with
  no photo and a dashed border (`border-2 border-dashed border-border-strong`,
  tokenized). Copy: *"Know something better than {winner}? Create a Polst and
  see if people agree."* It is a button that opens the create flow (D).

The OR disc stays between them (reused), reinforcing the polst silhouette.

### C. Editable keyword chips in the title

The `<h1>` becomes **subject + connector + place**, where subject and place
render as editable pill-chips (styled from `tab-chip` / `rounded-pill`).

- Tapping a chip opens a small `Menu` popover containing a `Field`/`TextInput`
  plus a few suggested values.
- Committing a value rebuilds the slug `Best {subject} in {place}` →
  navigates to `/q/<slug>` (`encodeURIComponent`/kebab via existing slug
  helpers). Curated pages resolve directly; everything else falls through to
  the existing `seoAnswerFor` synthesis path, so there are never dead ends.

**Data (additive, optional):**

```ts
keywords?: {
  subject: string;
  place?: string;
  subjectSuggestions?: string[];
  placeSuggestions?: string[];
};
```

When `keywords` is absent (e.g. synthesized pages), the `<h1>` renders the
plain `title` string exactly as today.

### D. Create flow (ghost CTA → compose → auth)

Reuse `NewPollModal`, **pre-seeded** with the champion as option A. The SEO
page renders its **own** `<NewPollModal>` instance for this flow so the global
`openNewPoll` path stays untouched.

**`NewPollModal` extension (additive, backward compatible):**

- Optional `seed?: { question?: string; choices?: [Partial<Choice>,
  Partial<Choice>]; category?: string; tags?: string[] }` — seeds initial
  state; absent → current empty defaults.
- Optional submit override (e.g. `onSubmit?: () => void` and/or
  `submitLabel?: string`). When provided, the Create button calls it instead
  of the default `post()`.

**SEO page submit behavior:** on Create, if signed out → close the modal and
`openAuth("signup")` with copy *"Log in or sign up to set your Polst live"*;
if signed in → the existing publish toast.

## Data changes (`lib/data.ts`)

Extend `SeoAnswer` with two optional fields and mock them on the curated
burger page:

```ts
export type SeoAnswer = {
  // ...existing fields stay...
  keywords?: {
    subject: string;
    place?: string;
    subjectSuggestions?: string[];
    placeSuggestions?: string[];
  };
  ladder?: {
    /** Ordered contenders (≥ 3). Step 0 = [0],[1]; each later step adds the
     *  next contender as the challenger. Aggregate shares for the count-up
     *  ride on each option's `votes`. */
    contenders: PollOption[];
  };
};
```

Fallbacks:

- No `ladder` → the page keeps rendering the single `poll` as today (safe
  default for synthesized pages).
- No `keywords` → plain `title`.

## Files touched

| File | Change | Compatibility |
|------|--------|---------------|
| `src/pages/SearchAnswer.tsx` | New title chips, `ChampionLadder`, `WinnerVsCreate` final slide, seeded create flow. Remove primary `PollCard` + "Continue answering" list. | The page itself — primary work. |
| `src/components/MultiPoll.tsx` | Add optional `carryWinner` prop. | Backward compatible; no existing caller passes it. |
| `src/lib/poll.ts` | Add pure `championOf(steps, answers)` helper. | Pure addition. |
| `src/components/NewPollModal.tsx` | Add optional `seed` + submit-override props. | Defaults preserve current behavior. |
| `src/lib/data.ts` | Add optional `keywords` + `ladder` to `SeoAnswer`; mock on burger page. | Optional fields; existing pages unaffected. |

All other behavior, screens, and the global `openNewPoll` flow are unchanged.

## Design-system compliance

- **Tokens, three layers.** Consume semantic tokens (`status-success`,
  `border-strong`, `surface-raised`, `text-secondary`, `accent`). Green for the
  winner marker (= verified/majority), violet only for interactive states.
  Dark mode is a token flip — covered automatically.
- **4pt grid.** Reuse existing geometry (`aspect-[4/3]`, OR disc sizes, card
  insets `PAD_X`, `rounded-card`/`md`/`pill`). No new spacing or radius values.
- **Reuse over invention.** Ladder is `MultiPoll` + a prop; final tile reuses
  the option-pair geometry and OR disc; create flow reuses `NewPollModal`;
  chips reuse `Menu` + `Field`. Carry logic is one shared helper.
- **No dead ends.** Keyword edits always resolve (curated → synthesized).
  Missing `ladder`/`keywords` fall back gracefully.

## Accessibility

- Editable chips: real buttons with `aria-expanded`; popover input is labeled;
  committing announces navigation via the new page's `<h1>`.
- Final slide: the winner tile is non-interactive and labeled as the result;
  the ghost CTA is a button with a descriptive `aria-label`.
- Ladder inherits `MultiPoll`'s existing offscreen-`inert` + `aria-live`
  progress handling. Motion stays behind `prefers-reduced-motion` (inherited).

## Open risks

- **Shared-file edits vs "don't change existing stuff."** Mitigated by keeping
  every shared-file change additive and opt-in (the design system's
  "extend by prop, not fork"). Flagged and approved during brainstorming.
- **Champion-ladder framing.** Pairings are mocked, presented as existing
  matchups; we are not asserting a real per-pairing polst exists for every
  combination.

## Testing

- `championOf` unit tests: single step, multi-step carry, picking the
  challenger vs the carried winner, out-of-range guards.
- Ladder interaction: voting advances the carried winner to the next step's
  left; final slide shows the correct champion.
- Final tile: winner is display-only (no vote handler); ghost CTA opens the
  seeded `NewPollModal`.
- Create flow: signed-out Create routes to auth; signed-in Create publishes.
- Keyword chips: editing rebuilds the slug and navigates; curated vs
  synthesized resolution; absent `keywords` renders the plain title.
- Both light and dark themes; reduced-motion path.
