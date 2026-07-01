# Standings Board (SEO Dashboard) — Polish Pass

**Page:** `/seo/dashboard/best-burger-in-chicago` → `src/pages/seo-variations/SearchAnswerDashboard.tsx`

**What the page is for** (per `polst-search-feed-mockup.pdf`): a pre-published,
indexable answer page Google surfaces for queries like "best burger in chicago".
It opens into a prefilled Polst feed: the crowd-ranked answer, trending keyword
chips, a ranked leaderboard, and head-to-head matchups that pull the visitor into
voting and creating.

## Guiding constraints
- Reuse pre-existing components + tokens. No one-off values, no random colors,
  no DRY breaks. Lean on what the other 4 variations already do.

## Work items

### 1. Keyword dropdown (the `KeywordChip` editor) — refactor to reuse header search
The bespoke `TextInput` + hand-rolled suggestion list reads as off-system (square
`rounded-md` field vs. the header's `rounded-pill`; search glyph sits high).
- Extend the shared `SearchField` (Header/SearchDrawer) with optional
  `placeholder`, `ariaLabel`, `autoFocus` props (defaults preserve header use).
- `KeywordChip` renders `<SearchField>` + suggestion rows built from the shared
  `DrawerRow` (search icon · label · trailing `north_west`, `check` when active) —
  the exact "Most Searched" pattern from `SearchContent`. Panel chrome matches the
  header popover.

### 2. "See where you stand" — real preference drill-down (keeps `StandCarousel`)
Today it's a carousel of unrelated follow-on polls + a create card. Add the
carry-the-winner drill-down logic WITHOUT collapsing it into `MultiPoll`.

**Key distinction (owner-stated):** `MultiPoll` = one brand's single multi-step
post. "See where you stand" = a *collection of separate poll posts from different
brands*. So each round must stay a full `<PollCard>` (author, Follow, social
actions, meta) in a `SlideTrack`, with the step indicator top-right and the
`CreatePollCard` finale — the earlier presentation.
- Reuse the pure helpers `ladderSteps(contenders)` + `resolvedPairAt(steps, picks,
  i)` for the logic; render each round as `<PollCard {...brand} options={pair}
  onVote={...}/>` from a distinct brand (dedup authors of poll + followOns).
- `PollCard.onVote` extended to report the picked index so the winner carries
  forward into the next round's matchup.
- Finale: `CreatePollCard` with the drilled champion — "Know something better than
  {champion.label}?" — wired to `useChallengeFlow().challenge(champion)`.

### 3. Leaderboard — color parity with Trend + context for the numbers
- Each row's share bar + a leading thumbnail use the SAME `SERIES_COLORS[i]` ramp
  as the trend lines, so a contender reads as one color across both tabs.
- Thumbnail: contender photo (matched from `ladder.contenders` by label), ringed
  in its series color; colored-initial fallback when no photo.
- Label the numbers with a quiet column header (Share · Votes · 24h) so the
  figures mean something. Keep rank, name, %, votes, 24h delta.

### 4. Trend tab — keep (already Polymarket-like); add endpoint dots
- Add a small filled dot in the series color at each line's current value, so the
  "now" reading is legible (Polymarket's right-edge anchor). Color mapping already
  shared with the leaderboard after #3.

### 5. Verticality — related SEO pages on the rail (internal linking)
- Replace the generic app-wide "Trending topics" rail box (off-topic for an answer
  page) with **"Most searched in {place}"** built from `relatedTopics` /
  `trendingNearby` — `DrawerSection` + `DrawerRow` rows linking to other answer
  pages. Keeps `HaveATakeCta` + `ExploreHashtags`.
- Featured related card (Polymarket "…Odds & Predictions" style): the hottest
  related search resolved via `seoAnswerFor`, showing its top contender thumbnails
  with a gentle pulse (reuse a token-driven animation, reduced-motion safe). Keep
  it tasteful, not gamey.

## Out of scope
- Data-model changes beyond reading existing `SeoAnswer` fields.
- The other 4 variations (already aligned).
