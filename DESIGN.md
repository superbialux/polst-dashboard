---
version: 1.0
name: Polst
description: >
  Trending-polls social app — A/B questions the whole world votes on.
  Cool blue-gray calm, one violet accent, Threads-grade consumer polish.
colors:
  # Neutral ramp (cool ~218° hue; contrast ratios vs white in src/index.css)
  neutral-50: "#fafbfc"
  neutral-100: "#f4f6f9"
  neutral-150: "#eff1f5"
  neutral-200: "#ebedf2"
  neutral-250: "#e0e3e9"
  neutral-300: "#d5d9e0"
  neutral-400: "#c7cbd1"
  neutral-500: "#8f96a3"
  neutral-600: "#6a7180"
  neutral-700: "#444a57"
  neutral-800: "#21262f"
  neutral-900: "#0c0f14"
  # Brand
  ink-purple: "#332e78"
  brand-purple: "#6161c7"
  soft-purple: "#b3b3e4"
  purple-tint: "#e6e6f6"
  # Secondary accents (tones, not decoration)
  red: "#e36133"
  yellow: "#f2ba1c"
  green: "#128c78"
  # Semantic (light)
  surface-page: "{colors.neutral-50}"
  surface-raised: "#ffffff"
  surface-subtle: "{colors.neutral-150}"
  surface-strong: "{colors.neutral-250}"
  text-primary: "{colors.neutral-800}"
  text-secondary: "{colors.neutral-600}"
  text-tertiary: "{colors.neutral-500}"
  text-accent: "{colors.brand-purple}"
  text-on-accent: "#ffffff"
  border-default: "{colors.neutral-300}"
  border-strong: "{colors.neutral-400}"
  accent: "{colors.brand-purple}"
  accent-hover: "#5252a9"
  status-success: "{colors.green}"
  status-danger: "{colors.red}"
  # Semantic (dark — only this layer flips; primitives never change)
  dark-surface-page: "#14171e"
  dark-surface-raised: "#1b1f28"
  dark-surface-subtle: "#242a35"
  dark-surface-strong: "#2e3543"
  dark-text-primary: "#edeff4"
  dark-text-secondary: "#a3acbc"
  dark-text-tertiary: "#7e8798"
  dark-accent: "#8585dd"
  dark-text-on-accent: "#14171e"
typography:
  question:
    fontFamily: Inter Tight
    fontSize: 1.125rem    # 1.5rem desktop
    fontWeight: 700
    lineHeight: 26px      # 32px desktop
  title:
    fontFamily: Inter Tight
    fontSize: 1.25rem     # 1.5rem desktop
    fontWeight: 700
    lineHeight: 1.75rem
  answer-label:
    fontFamily: Inter Tight
    fontSize: 0.875rem    # 1.125rem desktop
    fontWeight: 600
    lineHeight: 1.25rem
  author:
    fontFamily: Inter Tight
    fontSize: 0.875rem    # 1rem desktop
    fontWeight: 700
    lineHeight: 18px
  label:
    fontFamily: Inter Tight
    fontSize: 0.875rem
    fontWeight: 700
    lineHeight: 1.25rem
  body:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.25rem
    fontFeature: '"cv11", "ss01"'
  meta:
    fontFamily: Inter
    fontSize: 0.75rem     # 0.875rem desktop
    fontWeight: 400
    lineHeight: 1rem
  stat:
    fontFamily: Inter
    fontSize: 0.75rem     # 0.875rem desktop
    fontWeight: 600
    lineHeight: 1rem
rounded:
  sm: 6px        # nested hover rows inside cards
  md: 8px        # controls: chips, buttons, inputs, option tiles
  card: 12px     # page-level containers: feed, rail boxes, modals
  lg: 20px
  xl: 28px
  2xl: 36px
  pill: 9999px   # identity & primary CTAs: avatars, search, buttons
spacing:
  unit: 4px      # everything sits on the 4pt grid
  xs: 4px
  sm: 8px
  card-inset: 10px   # 16px at desktop
  md: 16px           # the desktop rhythm: gutters, stack gaps
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.text-primary}"   # brand black = the text ink
    textColor: "{colors.text-on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    size: 40px height, 16px horizontal padding
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    border: "1px {colors.border-default}"
    rounded: "{rounded.pill}"
    size: 40px height
  card:
    backgroundColor: "{colors.surface-raised}"
    border: "1px {colors.border-default}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-inset}"
  option-tile:
    backgroundColor: "{colors.neutral-200}"    # via --option-bg (flips dark)
    rounded: "{rounded.md}"
  result-bar:
    backgroundColor: "{colors.accent}"         # loser: option-bg
    textColor: "{colors.text-on-accent}"
    rounded: half-pill toward the centre seam
    size: 44px height (56px desktop) ≈ 90% of the OR disc
  tab-chip:
    backgroundColor: transparent               # active: surface-raised
    border: "1px {colors.border-default}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.surface-raised}"
    border: "1px {colors.border-default}"
    rounded: "{rounded.md}"
    size: 40px height, 16px font on mobile (no iOS zoom), 14px desktop
  avatar:
    rounded: "{rounded.pill}"
    size: 34px (40px desktop) = author line-height + meta line-height
---

## Overview

Polst is a trending-polls social app — every post is a two-option question
("Smarter devices OR Better software?") the whole world votes on. The tagline
and primary CTA are the same three words: **Ask the world**.

The visual language is *calm consumer*: cool blue-gray neutrals on a soft
off-white page, photography doing the emotional work, and one violet accent
reserved for interaction. The quality bar is Threads/Instagram/Linear. The
signature moments are the **OR disc** floating between two photos and the
**vote-counting animation** — the result bars and percentages grow in
lockstep, like ballots being tallied.

Three rules govern everything:

1. **Tokens in three layers.** Primitives (raw palette) → semantic (purpose:
   surface, text, border, accent) → component (per-widget slots). Components
   consume semantics; primitives are an escape hatch, never a habit. Dark
   mode exists *only* as a re-mapping of the semantic + component layers
   under a `.dark` class — primitives never change.
2. **The 4pt grid is law.** Sizes, insets, gaps, icons, radii — all multiples
   of 4 (10px card insets on mobile are the lone, documented exception).
3. **Reuse over invention.** Every screen is composed from the same
   primitives (PollCard, Modal, Menu, Drawer sections, MiniPoll rows,
   EmptyState, RailBox…). A new screen should feel inevitable, not new.

## Colors

The neutral ramp runs a single cool hue (~218°) from `#fafbfc` to `#0c0f14`.
Surfaces step *upward* in tone (page < raised < subtle < strong) while
borders hold at neutral-300/400 so separation never depends on shadows.

- **Brand black is the text ink.** Primary buttons use `neutral-800`
  (`#21262f`), not `#000`. In dark mode the primary button inverts to light
  ink on dark text — the "ink" identity survives the flip.
- **Violet (`#6161c7`) is the only interaction color**: active states,
  selection, focus rings, links, the chosen option, unread marks. It is
  never decorative. In dark mode it brightens one step to `#8585dd`, and
  because white fails AA on that lighter accent, `text-on-accent` flips to
  dark ink (`#14171e`) — accent fills read like the light theme's primary
  button, inverted.
- **Red / green / yellow are tones, not alarms**: like (red), repost
  (green), and category identity. Each tone pairs an ink with a 10%-alpha
  ring tint (`lib/tones.ts`). Status semantics get their own slots:
  `status-success` for "Majority"/verified/available, `status-danger` for
  destructive menu items and spent character budgets. *Minority is neutral,
  not danger* — losing a poll isn't an error.
- **Contrast is documented at the token.** Body text ≥ AA in both themes
  (dark secondary `#a3acbc` = 7.4:1, tertiary `#7e8798` = 4.6:1 on cards);
  `text-tertiary` is for placeholders and decorative icons only.

## Typography

Two families: **Inter Tight** (display — questions, names, labels, buttons,
counts) and **Inter** (body and meta), with `cv11`/`ss01` features enabled.

The desktop ladder is **24 / 18 / 16 / 14** (question / answer labels /
author / meta-actions); mobile runs 18 / 14 / 14 / 12. The title step is a
1.333 ratio. Two invariants:

- **Avatar diameter = adjacent line-heights.** Author avatar is 34px on
  mobile (18px name + 16px meta) and 40px on desktop (20 + 20).
- **Counts are compact and tabular.** `13500 → "14K"` in feeds,
  one-decimal (`1.5K`) where precision matters (profile stats, tallies).
  Character-budget rings use `tabular-nums`.

Content is budgeted, not wrapped: questions clamp at 48 characters
(40 at creation), answer labels at 18 (20 at creation), 3 visible hashtags.

## Layout

- **Two 12-column desktop grids, both on the 4pt rule.**
  `lg` (≥1024): 12×64px + 11×16px gutters = **944px** (feed 624 / rail 304).
  `xl` (≥1280): 12×76px + 11×16px = **1088px** (feed 720 / rail 352).
  Below `lg`, content caps at 768px, single column. There is no dead band:
  the rail and every entry point exist from 1024 up.
- **16px is the rhythm.** Header → tabs → feed → rail gaps, rail box stacks,
  column gutters — all 1rem. Card insets are 10px on mobile, 16px on
  desktop, shared by every row of a card (`PAD_X`).
- **The window never scrolls.** The app is a viewport-locked shell
  (`html { overflow: clip }`); each page scrolls its own column with hidden
  scrollbars on desktop. On the feed, wheel input anywhere — header, rail,
  gutters — forwards to the feed column.
- **Drawers push, modals float.** Mobile drawers slide the entire app frame
  sideways by exactly their width (300ms ease-out); they never overlay.
  Dialogs center over a dimmed, blurred scrim; creation flows become
  full-screen sheets below `lg` with safe-area insets and a pinned footer.

## Elevation & Depth

Borders carry separation; shadows whisper. Four tiers:

- `sm` — `0 1px 2px rgba(33,38,47,0.04)`: resting cards, rail boxes.
- `md` — `+ 0 4px 16px 0.06`: hover lift.
- `lg` — `0 12px 32px 0.08`: drawers, popovers, dialogs.
- `pop` — `0 8px 10px 0.18`: the floating layer — toasts and **both result
  bars**, which must lift off photography in their own hue (purple bar over
  purple imagery separates by depth, not outline).

Dark mode keeps the same tiers but deepens them (`rgba(0,0,0,0.3–0.5)`) and
lets borders do more of the work. The pre-vote hover cue is the
`option-glow` vignette — a violet radial swelling at a photo's edges, "like
low HP in a video game" — paired with a 1.04 image zoom (desktop only).

## Shapes

A radius expresses **nesting depth**, not taste:

- **12px (`card`)** — page-level containers: feed wrapper, rail boxes,
  dialogs, banners.
- **8px (`md`)** — controls inside them: buttons, chips, inputs, option
  tiles, menus' parents.
- **6px (`sm`)** — interactive rows nested inside cards (drawer rows,
  menu items).
- **Pill** — identity and primary actions: avatars, search, CTAs, toasts,
  progress tracks.

Signature geometry: the option pair is always a 4:3 area split by a 4px
seam, with the 48px (64px desktop) **OR disc** floating at its center —
raised surface, `shadow-sm`, **no border in either theme**. Result bars are
half-pills rounded toward the seam, sized ≈90% of the disc. Multi-step
results render as *one* tile at the same 4:3 ratio, so the card's silhouette
never changes.

## Components

- **PollCard** — the atom of the product. Anatomy: author bar (avatar,
  name, location · age, Follow, ⋯ menu) → question → option pair → meta
  line (category, #hashtags ←→ votes · time left) → action bar (like,
  repost / share, bookmark). Category, hashtags, and location are
  navigation. One tap votes; results animate in 800ms with a shared
  ease-out-cubic driving number and bar width together; tallies appear only
  on options ≥50% so short bars stay readable (`min-w-max` content floor).
  Actions use *invisible hit-slop* (`-m-2 p-2`) to reach 44px targets
  without growing visually.
- **MultiPoll** — a multi-step poll *is* a PollCard (`steps` prop): same
  chrome, the body cycles questions. After the count settles, the slide
  exits left and the next enters from the right, **edge-to-edge across the
  card** (the track bleeds past the inset; each slide re-applies it), 500ms
  on `cubic-bezier(0.22, 1, 0.36, 1)` — fast exit, long glide, never a
  bounce. Circle steps beneath fill into checks and navigate back; the
  results summary is simply the last slide. Onboarding's interest picker
  reuses this component verbatim — onboarding teaches the product by being
  the product.
- **MiniPoll row** — the 64px split-thumb + OR disc miniature with a
  three-line column (context, question, shares at a center divider). Used
  by Highest Volume, search results, and multi-step results.
- **Overlays** — Modal (focus-trapped, Escape, restores focus, scrim
  `black/50` + 2px blur), Drawer (push pattern, inert when closed), Menu
  (roving arrow-key focus; `side="top"` for footers). All stay mounted for
  their transitions and go `inert` when closed.
- **Feedback** — one Toast at a time, `aria-live`, pill on the primary ink;
  toasts never lie (clipboard failures say so). Skeletons mirror the
  card's bones during loads. EmptyStates pair an icon disc with one action.
  Discovery pages are **never empty**: exact matches → related → popular,
  with an honest notice banner.
- **Forms** — every control is 40px tall on the shared chrome (16px text on
  mobile to stop iOS zoom, 14px desktop). Character budgets render as a
  ring that fills and blushes toward danger over the last 30%, counts down
  the final 10 digits, and shakes when a keystroke lands on zero.

## Do's and Don'ts

**Do**

- Consume **semantic** tokens (`text-secondary`, `surface-subtle`); reach
  for primitives only when retuning a component slot.
- Keep every size on the 4pt grid, and check both themes — dark is a token
  flip, so if you used tokens, it's already done.
- Reuse the established primitives; extend by *prop*, not by fork
  (MultiPoll is a PollCard prop, not a second card).
- Gate motion behind `prefers-reduced-motion`; keep animations directional
  and physical (lockstep counting, push drawers, edge-to-edge slides).
- Make metadata navigable (category → topic, #tag → tag page,
  location → place) and every dead end survivable (fallbacks + create CTA).

**Don't**

- Hardcode a hex, a `#000`, or a bare `white` in a component — brand black
  is `text-primary`, and white-on-accent must be `text-on-accent` (it flips
  in dark mode for contrast).
- Put borders on the OR disc, bounce an animation, or let a result bar
  drop below its content width.
- Use danger ink for non-errors (Minority is neutral) or violet for
  decoration (it means *interactive*).
- Add a second elevation system, a 5th radius meaning, or a one-off
  spacing value — if it isn't on the grid, it isn't in the design.
- Let the window scroll, a modal lose focus, or a toast claim success
  that didn't happen.
