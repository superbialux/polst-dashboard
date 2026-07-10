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
  # Sidebar rail (dashboard) — the one dark surface, from the same neutral ramp
  sidenav-bg: "{colors.neutral-900}"
  sidenav-active: "{colors.neutral-800}"
  sidenav-muted: "{colors.neutral-500}"
typography:
  question:
    fontFamily: Inter
    fontSize: 1.125rem    # 1.5rem desktop
    fontWeight: 700
    lineHeight: 26px      # 32px desktop
  title:
    fontFamily: Inter
    fontSize: 1.25rem     # 1.5rem desktop
    fontWeight: 700
    lineHeight: 1.75rem
  answer-label:
    fontFamily: Inter
    fontSize: 0.875rem    # 1.125rem desktop
    fontWeight: 600
    lineHeight: 1.25rem
  author:
    fontFamily: Inter
    fontSize: 0.875rem    # 1rem desktop
    fontWeight: 700
    lineHeight: 18px
  label:
    fontFamily: Inter
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
   consume semantics; primitives are an escape hatch, never a habit.
   (There is no dark theme — the app is light-only, with one dark surface:
   the dashboard's sidebar rail, built from the same neutral ramp.)
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
  (`#21262f`), not `#000`; the dashboard sidebar rail sits on `neutral-900` —
  the same cool near-black, never a foreign gray.
- **Violet (`#6161c7`) is the only interaction color**: active states,
  selection, focus rings, links, the chosen option, unread marks. It is
  never decorative.
- **Red / green / yellow are tones, not alarms**: like (red), repost
  (green), and category identity. Each tone pairs an ink with a 10%-alpha
  ring tint (`lib/tones.ts`). Status semantics get their own slots:
  `status-success` for "Majority"/verified/available, `status-danger` for
  destructive menu items and spent character budgets. *Minority is neutral,
  not danger* — losing a poll isn't an error.
- **Contrast is documented at the token.** Body text ≥ AA everywhere
  (secondary 4.83:1, tertiary 4.6:1 on white; sidenav muted 6.6:1 on the
  rail); `text-tertiary` is for placeholders and decorative icons only.

## Typography

**Inter** for everything, with `cv11`/`ss01` features enabled. `font-display`
stays as a semantic alias (questions, names, labels, buttons, counts) but now
resolves to Inter too — one family across the app, no Inter Tight.

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
- Keep every size on the 4pt grid; every color rides a token, so a retune
  is a token edit, never a component sweep.
- Reuse the established primitives; extend by *prop*, not by fork
  (MultiPoll is a PollCard prop, not a second card).
- Gate motion behind `prefers-reduced-motion`; keep animations directional
  and physical (lockstep counting, push drawers, edge-to-edge slides).
- Make metadata navigable (category → topic, #tag → tag page,
  location → place) and every dead end survivable (fallbacks + create CTA).

**Don't**

- Hardcode a hex, a `#000`, or a bare `white` in a component — brand black
  is `text-primary`, and white-on-accent must be `text-on-accent`.
- Put borders on the OR disc, bounce an animation, or let a result bar
  drop below its content width.
- Use danger ink for non-errors (Minority is neutral) or violet for
  decoration (it means *interactive*).
- Add a second elevation system, a 5th radius meaning, or a one-off
  spacing value — if it isn't on the grid, it isn't in the design.
- Let the window scroll, a modal lose focus, or a toast claim success
  that didn't happen.

---

# Dashboard (Brand Workspace)

The dashboard is the same product, wearing work clothes. It is a **derivative**
of the consumer app: the exact same token architecture, the same 4pt grid, the
same calm blue-gray neutrals and single violet accent — re-composed for a brand
operator instead of a voter. Its structural DNA (sidebar sections, a compact
stat strip, action-first cards, a main-plus-rail editor, assign modals) is
borrowed from Shopify's *hierarchy*, never its *skin*: we keep our light,
border-led surfaces and reserve violet for interaction. Read
`task/polst_v1_dashboard_ux_structure.md` for the information architecture; this
section governs how it looks and how it is built.

The dashboard is **desktop-first**. It is a guided decision workspace, not an
analytics warehouse — every screen answers *what is next?* before *how much?*.

## The shell

Two columns, no frames-inside-frames: the **one dark surface is the
full-height sidebar rail** (`sidenav-*` tokens, our `neutral-900` — fixed,
`w-64`, collapsible to an 80px icon rail), and beside it a light column
stacks a **sticky 64px header** over the **working canvas** (`app-content`).
The page owns the **document scroll** — no surrounding card border, no
nested scrollbar. The ladder reads: **dark rail ▸ light header ▸ canvas ▸
white cards on it**. Every page shares the one `max-w-dashboard` (1152px)
container — no per-page widths — and lays out on the 12-column `SectionGrid`
at 16px gutters; the shell's `main` carries the page padding
(`px-8 pt-6 pb-10` at desktop).

- **Header** — `h-12` (48px), sticky, **white** (`surface-raised`) with a
  hairline `border-b`. Left: **breadcrumbs** — the route resolved to named
  crumbs (ids become object names: "Campaigns › Packaging Direction Test"),
  quiet parents as links, the current page in primary ink. There is no
  visible search field; the **⌘K command palette** carries all search.
  Right, `ml-auto`: the **primary Create button** (labeled, with menu), a
  quiet 32×32 bell, and the **account chip** (bordered, monogram + brand
  name + chevron). Below `lg` the wordmark rides the header since the rail
  is hidden.
- **Notifications** — a Shopify-style panel (see `alerts.png`): a titled header
  with filter / mark-all-read actions, then rows of **unread dot ·
  `source · time` · bold title · body** (no icon discs), and a "No more
  notifications" footer. All on page tokens, not chrome.
- **Account switcher** — even parent padding (`p-1.5`) so every row (workspaces,
  the signed-in person, Log out) shares the same inset — nothing sits flush to
  the edge. Workspaces are `menuitem`s so focus opens on the current one.
- **Sidebar** — the dark rail: fixed `inset-y-0`, `w-64`, no collapse. Top:
  the **wordmark alone**, inverted and generously sized (`h-8`) — no logo
  tile. Nav rides in **groups**: the daily work (Home, Campaigns, Polsts,
  Distribution), a labeled **LEARN** band (Analytics, Audience), and — pinned
  at the foot — Settings plus the **signed-in user card** (violet initials
  disc, name, role, on a `sidenav-hover` panel). Rows are **14px medium**,
  `h-9`, `rounded-md`: inactive `sidenav-muted`, hover a soft
  `sidenav-hover` wash, active a **`sidenav-active` panel in white ink**
  with the glyph filled (Material Symbols `FILL 1`). Analytics' children
  indent under the active parent. Statuses are **never** nav.
- **Canvas** — the page scrolls as a page (document scroll, no inner
  scroller, no rounded border frame). White cards lift straight off the
  `app-content` canvas. `body` matches the canvas so overscroll never
  flashes.

## Control type

- **One size for controls — `text-ui` (13px / 16px).** Every button, tab,
  selector, menu item, and search field runs at `text-ui`, so the chrome
  reads as one compact system. (Body copy, headings, and data keep the
  regular type scale.) The **rail nav is the one exception**: its rows run
  `text-sm font-medium` (14px), matching the reference shell's calmer,
  roomier navigation. `cn()` registers `text-ui` with tailwind-merge so it
  survives alongside a `text-{color}` class.
- **One height — 32px (`h-8`) in-page; 36px (`h-9`) in the chrome.**
  Buttons, tabs, and selectors inside the page are 32px; the shell's
  header controls (search, bell, account chip) and rail rows are 36px to
  match the 64px header's scale. Icons inside controls are **20px**.

## Type scale (dashboard)

Borrowed from the reference shell — larger, calmer headings; weight stays
at 500–650, never bold-black:

- **Pages carry no title or description.** The header breadcrumbs name
  where you are; content does the explaining. A slim top row holds the
  freshness stamp (left) and page actions (right) when a page has them.
- **Card / section title** — `text-base font-semibold` (16px).
- **Metric value** — `text-2xl font-semibold tracking-tight tabular-nums`
  (24px) on tiles and the stat strip alike.
- **Body 14px, metadata 12px** as before; rail nav 14px medium.
- **Card inset** — `p-5` (20px), still on the 4pt grid.

## Dashboard grid

- **12 columns.** Multi-panel layouts use the 12-col `SectionGrid` at **16px**
  gutters (`gap-4`) — a card spans `col-span-{n}` (7/5, 8/4, 3×4, 6×2…). Never
  hand-size a track with an arbitrary value; spend columns.
- **Two rhythms.** Major sections **stack at 24px** (`space-y-6`); cards hold
  a **20px** inset (`p-5`) with 8–12px nested gaps. Page padding lives on the
  shell's `main` — 32px desktop (`lg:px-8 pt-6 pb-10`), 16px below `sm`.
- **One container.** Every page — Home, tables, editors, analytics — caps at
  the same `max-w-dashboard` (1152px) centered column via `DashboardPage`.
  Any view on a second width is a bug to normalize.

## Surfaces & depth (dashboard)

Same four-tier elevation, same "borders carry separation, shadows whisper":

- **Page** = `page-feed` (neutral-150 in light) — the quiet backdrop.
- **Card** = `surface-raised` + 1px `border-default` + `shadow-sm`. The
  universal container; radius `card` (12px). Hover-liftable rows step to
  `shadow-md`.
- **Nested fill** = `surface-subtle` — stat cells, field wells, calendar
  markers, the AI prompt tray. Radius `md` (8px), or `sm` (6px) for rows.
- **Overlay** = Modal/Drawer on `shadow-lg` over the `black/50` + blur scrim,
  exactly as the consumer app.

## Status is a tone, never a decoration

State speaks in **two separate families with two separate grammars**, so a
lifecycle fact can never be misread as a verdict:

**Lifecycle** (`StatusBadge` — soft pill + dot) says where an object sits in
its workflow. It maps onto the status + accent slots and inherits the consumer
rule that **a neutral outcome is neutral, not danger**:

- **Success ink** (`status-success` on `-soft`) — *Active, Ready, Completed,
  Assigned*: healthy, live, or a call that can be made.
- **Accent** (`accent-default` on `-soft`) — *Scheduled*: planned, in motion.
  Violet because it is the interactive, "you can act on this" state.
- **Danger ink** (`status-danger` on `-soft`) — *Needs attention*: a real gap
  that blocks a launch or a decision. Never for "losing" or "low".
- **Warning ink** (`status-warning` on `-soft`) — eroding, not broken: a
  source losing voters, a caveat on a read. Amber ink (`--color-yellow-ink`),
  AA-dark on white.
- **Neutral** (`surface-subtle`/`text-secondary`) — *Draft, Archived,
  Unassigned, All*: parked, not wrong.

**Decision signal** (`SignalBadge` — icon + ink, **no pill fill**) says
whether the *evidence* can be trusted yet: *Decisive, Leading, Directional,
Too close, Inconclusive, Collecting, Not started* (`DecisionSignal` in
`workspace.ts`). Campaign tables carry **both** columns — Status and Signal —
never one string mixing the two.

`StatusBadge` and `SignalBadge` own their mappings in one place; pages pass a
string and get the right treatment for free.

## The dashboard component kit

Every screen is composed from this fixed set — extend by **prop**, never by
fork. New surface area should feel assembled, not authored:

- **`DashboardShell`** — the frame above. **`DashboardPage`** — the one
  centered 1152px column (the shell supplies the outer padding), topped by a
  slim optional row: `updated` freshness left, `actions` right. No titles,
  no descriptions — the header breadcrumbs own page identity.
  Pass `updated` ("2 min ago") and every page states its data recency —
  numbers without a freshness stamp are rumors.
- **`DecisionBrief`** — the **Decision Narrative** as one reusable object:
  `SignalBadge` + updated stamp → a 20px headline (the call) → what changed
  and why → an amber **caveat** line → an **evidence strip** (label/value
  pairs, each with an optional `InfoHint` definition) → one primary action.
  Anywhere a result is summarized — Home's briefing, the campaign overview —
  this pattern speaks first and charts sit under it as supporting evidence.
- **`SignalBadge`** — the decision-signal vocabulary (see "Status is a tone").
  **`InfoHint`** — a hoverable ⓘ that reveals a metric's definition (formula +
  denominator); the inspectable data contract behind every number.
- **`FlowSteps`** — the staged-workflow progress header (numbered chips,
  active raised, finished checked and clickable). Create Campaign runs
  **Decision → Polsts → Channels → Review**; Create Polst runs **Content →
  Schedule & sources → Review**. One dominant **Continue to {next}** action
  per step; dates land at Review. **`SavedChip`** — the quiet "Draft saved"
  line; saving is the system's job and never gets a primary button.
- **`DashboardCard`** — section container (optional header row with title,
  description, action). The atom every panel sits in. **No header rule** — the
  title sits flush above the body; cards read flat.
- **`StatsStrip`** — the mini-stats bar (Shopify `mini-stats`): a **padded
  parent** holding **borderless, rounded, hoverable** stat cards (inner radius =
  parent radius − padding), each with an eyebrow-weight label, a large value, a
  **filled-triangle** trend indicator (`arrow_drop_up/down`, up/down coloured) +
  delta, and a wide, smooth **accent (purple) `Sparkline`** — the mini charts
  echo the expanded chart rather than the trend colour. Click a card (or the
  chevron) to **expand a full `LineChart`** below with a **smooth grid-rows
  reveal**: a smooth accent line + soft area fill over a **faded dashed
  previous-period line**, a light y-axis and date ticks (no redundant title).
  The range is driven by a **`PageTabs` filter (7D / 30D / 90D / All)** above the
  strip — `DASHBOARD_STATS[range]` and `STAT_XTICKS[range]` swap the values,
  deltas, sparks, and axis labels together.
- **`DataTable<T>`** — the one list primitive: typed columns, status pills,
  right-aligned row actions, an honest empty label. Products/Campaigns/Sources
  /Reports all render through it.
- **`SegmentedControl`** — the **one** segmented select used everywhere (time
  ranges, status filters, page tabs). **32px tall** to match buttons, **white**
  (raised + bordered) so it reads against the page background, with a light
  active pill. `FilterTabs` and `PageTabs` are thin aliases so every select is
  identical. `SearchAndFilters` pairs it with search atop a list card.
- **`ActionCard`** — the **one** actionable-card shape (Home, bento, Insights):
  optional eyebrow / status / right-hand meta, a title, one 14/20 line of
  `reason`, and a CTA pinned **bottom-left**. No header rule, no item borders,
  consistent type — every actionable surface is this component. Pass `progress`
  for a `ProgressRing`. Give it **`media`** (`CardMedia`) for a **full-bleed
  image**: `placement: "side"` runs it full card-height down the right (authored
  **3:4**), `"bottom"` runs it full-width under the copy on tall/column cards
  (authored **16:9**) with the **CTA overlaid bottom-left over the image**.
  Until real art lands, `media` with no `src` renders a **tone-wash placeholder**
  (soft fill + glyph) via `MediaFill`. The image bleeds the edges it touches —
  no padding there. `visual` (`CardArt` icon tile) remains for the padded-glyph
  fallback. Height comes from the **grid** (`SectionGrid` stretches rows equal;
  add `items-start` for a natural-height bento so a hero card doesn't stretch its
  neighbours). Home's key-date bento: **World Cup is the main event** (col-8,
  bottom image); the rest are side-image tiles.
- **`NextStepsCard`** — the setup checklist (Shopify "Get your first N"): a
  header with a progress ring and a **collapse chevron** (the whole card folds
  to its header). Steps are a **click-to-expand accordion** — the open step
  shows its copy, CTA and a full-bleed 3:4 image; the rest are one line each.
  Every **bullet keeps the same x-position** open or closed, so expanding never
  shifts the checkboxes. Full width. Steps are `SetupStep[]`.
- **`CampaignRow` / `PolstMiniRow`** — the Home "Campaigns" and "Recent
  Polsts" list rows. `CampaignRow`: name, status, **run dates**, and metrics
  that say what they measure — "71% **completion rate** · 2 of 2 **Polsts
  live** · 0 finished", never a bare "71% complete". `PolstMiniRow`: the
  **mini-poll anatomy** (split image thumb + OR disc, question, status, and
  the current split). Campaigns take the wide column (col-8); Polsts support
  (col-4). Both filter by **Active / Queued** (`SegmentedControl`).
- **`ProgressRing`** — a small completion ring on setup cards; **hover reveals
  the remaining steps** (checked/unchecked list, "N steps left").
- **`WorkspaceCalendar`** — Home's month grid, **always six weeks (42 cells)**:
  the spill into adjacent months shows dimmed, and the month is **navigable**
  (prev / next / Today). Items carry ISO dates. Cells are seamless (hairline
  gridlines, no radius, edge-to-edge). Items are **colour-coded by type**, not
  status: campaigns (`cal-campaign`, violet) and single Polsts (`cal-polst`,
  green) render as **bars spanning their run** (lane-packed); completed items
  **fade**. **Key dates** sit at the *top* of each day as a hoverable dot +
  label, never a bar. Any cell opens a **floating day popover**
  (fixed-positioned, never clipped) with quick create actions.
- **`DetailList`** — the label→value pair list for summaries and settings.
  **`ProgressBar`** — completion/vote-split tracks on the pill radius.
- **`StatTile`** — the one KPI tile (Distribution summary, Analytics portfolio,
  Audience headline): quiet label, display number, toned detail line with an
  optional `trending_up/down` glyph.
- **`PollResults`** — the product's face: the REAL consumer `PollOptionsBlock`
  in its results state (leader selected, bars animating from the seam). Renders
  the Polst grid cards, campaign chain cards, and the Settings branding
  preview; the Polst detail page embeds the full consumer **`PollCard`** as a
  live, votable preview. One card anatomy across both apps.
- **`Funnel`** — the voter journey (Started → each question → Completed):
  pill bars scaled to the first step, per-step drop percentages, the largest
  loss tagged **"biggest drop"** in danger ink, the final step in success ink.
- **`MixBars`** — the one ranked-share list (source mix, devices, platforms,
  interests, age bands): label · bar · share, optional detail count.
- **`SnippetCard`** — a labeled code block (iframe/JS embeds) with a Copy
  button that raises a toast. **`LockedCard`** — the honest gated state (lock
  glyph, one promise line, a plan chip) for demographics we don't collect yet
  and the Pro-tier developer platform.
- **`PollComposer`** — the consumer "Ask the world" composer as an inline
  block (question with a character-budget ring, choice tiles split by the OR
  disc that mock-attach photos, category select, tag chips). Both create flows
  build the Polst inside the exact card voters will see.
- **Copy rule: show, don't tell.** Page and card headers carry no narrating
  descriptions — content, counts, and states do the explaining. Helper text
  survives only inside forms where it states a consequence.
- **`PollThumb`** — the split A/B mini-thumb with the OR disc, shared by Home's
  Polst rows and the select-from-library picker. All A/B imagery resolves
  through `polstImage()` so the placeholder source swaps in one place.
- **`Rail` / rail cards** — the operational right column on editors (Status,
  Schedule, Shareable assets, Launch readiness).
- **Overlays** — reuse the consumer **Modal**, **Drawer**, **Menu**; the
  Assign-Sources dialog and select-from-library picker are lists inside a
  `Modal`. The **⌘K workspace search** is a **command palette**: the same
  `Modal` with `placement="top"` + `bare` (no close chrome — Esc and the
  backdrop dismiss), an input that owns the top edge, entity filter chips,
  **arrow-key selection + Enter to open**, highlighted query matches, a
  labeled **Recent** list when the query is empty (never unlabeled default
  results), and a "View all results" tail row.
- **`TrendChart`** — the one line chart (extracted from the stat strip):
  smooth accent line, soft area fill, dashed previous period, left y-axis,
  hover crosshair with a pinned value chip. Takes a `format` for units
  (thousands, %). Every trend everywhere rides this, never a second style.
- **`SplitBar`** — the Polst signature for exactly two-part shares (paid vs
  organic, US vs international): one bar, two segments meeting at a seam —
  the echo of a vote result. Three or more slices → `MixBars`.
- **`CohortGrid`** — the retention triangle: weekly cohorts down, Day 1/7/14/30
  across, cells shaded by `color-mix(accent, value)`; cells a cohort hasn't
  reached yet render as quiet dashes (maturing, not missing).
- **`TimeHeatmap`** — day × 2-hour buckets in one hue (accent strength is the
  scale) with a Fewer→More legend; answers "when does our audience answer?"
  All heat surfaces stay single-hue — status colors never enter charts.
- **`FilterBar`** — the shared analytics filter row (date preset menu ·
  channel · vertical selects). Pass a controlled `vertical` to actually filter
  a table; the demo rule is filters must visibly do something.
- **`Switch` + module flags** — `lib/modules.tsx` holds feature-flagged
  modules (Acquisition, Retention) in context + localStorage; Settings ›
  Modules toggles them and the sidebar reacts instantly. Off means gone —
  no ghost nav items (`LockedCard` is only for teaser-tier content).
- **`ConnectCard`** — one integration (icon disc, name, what it feeds,
  Connected state or Connect button). Marketers see *integrations*; the word
  "API" stays inside the gated developer section.

## Do's and Don'ts (dashboard)

**Do**

- Compose pages from the kit and pay the 12-col / 24px-16px rhythm everywhere;
  a new page should reuse `DashboardPage` + `DashboardCard` + `DataTable`
  before it invents anything.
- Route status through `StatusBadge` and dates/counts through the shared
  `formatNumber`; keep both themes correct by staying on semantic tokens.
- Lead with the next action. Stats orient, the calendar plans, cards tell the
  user what to do — analytics lives under Analytics, never on Home.
- Honor the **metric contract**: every number states its exact window, its
  comparison window, and its scope (`StatsStrip scope`, `InfoHint`
  definitions, `updated` stamps), and the same metric reconciles across Home,
  Analytics, and campaign pages. A delta without a stated baseline is
  decoration.
- Separate lifecycle from decision signal — `StatusBadge` and `SignalBadge`
  are different questions, different components, different columns.

**Don't**

- Borrow Shopify's *palette* (its greens/blues) or its exact chrome — the
  structure is theirs to inform, the skin stays ours (our ink header, our cool
  neutrals, one violet accent).
- Hand-size a layout track (`[18rem]`, `min-h-[92px]`) when columns or the 4pt
  scale will do; no magic values reach a className.
- Turn a status into a sidebar item, put raw analytics on Home, or let a "low"
  / "losing" / "draft" state borrow danger ink.
- Build a backend. This is a mockup: buttons route, modals open, toasts can
  fake success — nothing persists.
