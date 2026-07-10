# Visualization Spec — how the dream-list data gets displayed

*Companion to `task/analytics-expansion-plan.md` (which decides WHERE data lives; this decides WHAT IT LOOKS LIKE). Audience for the result: thousands of brand directors seeing the mock as a product demo.*

## The uniqueness thesis

Generic BI dashboards visualize *quantities*. Polst visualizes *choices*. The signature visual language derives from the product's atomic unit — a binary A/B decision — and shows up as a family trait across every new surface:

1. **The split.** Any two-part share (paid vs organic, new vs returning, US vs non-US) renders as a single **SplitBar** — one bar, two segments meeting at a seam, labels at the ends, the echo of a vote result. Never a pie, never two stacked rows.
2. **Heat, not walls.** Density questions (when does the audience answer, do cohorts come back) render as **heatmaps** — a time heatmap and a cohort grid — in one hue: accent at varying strength. Heatmaps are the "feels full and serious" moment a brand director remembers, and they stay calm because they add zero new colors.
3. **Tables are the workhorse.** Anything with more than four rows and more than two measures is a DataTable with tabular numbers and an optional spark — the Shopify move. Charts are reserved for *shape* questions (trend, distribution, drop-off).
4. **Findings before charts.** The starred hard items (journey mapping, audience overlap, ad frequency) enter as written findings with a confidence chip — a sentence the CEO's "story" rule would approve of — not as speculative sankeys.
5. **One accent, opacity as the scale.** All new visualizations derive color from `--accent-default` via opacity/color-mix. Status hues stay reserved for status.

## Component decisions (build exactly four)

| Component | What it is | Why not something else |
|---|---|---|
| **TrendChart** | The existing StatsStrip line chart (smooth accent line, soft area fill, dashed previous period, y-axis, x-ticks) extracted and exported, plus a hover crosshair with a value chip | It already matches the house style; comparison-vs-previous is the single most requested trend need (ratios "by channel and campaign" all reduce to trend + table) |
| **CohortGrid** | Retention triangle: rows = weekly cohorts (label + size), columns = Day 1/7/14/30, cells filled `color-mix(accent, N%)` with the exact % as text, hover ring | The canonical retention display; a bar chart of D7 alone would hide the cohort-over-cohort story |
| **TimeHeatmap** | 7 days × 12 two-hour buckets, accent-opacity cells, hover value, "Peak" callout chip | Answers "peak engagement times" and "best send times" in one glance; a line per weekday would be seven lines of noise |
| **SplitBar** | One horizontal bar, two segments (accent / surface-strong) meeting at a hairline seam, end labels with % | The Polst signature; MixBars is for 3+ slices, this is for exactly two |

Plus one non-chart: **ConnectCard** (integration tile: icon disc, name, what it feeds, Connected/Connect state) — because the CEO's rule is marketers see *integrations*, never APIs.

Explicitly **not** building: pies/donuts (shares read worse than bars), sankey/journey graphs (P3 finding cards instead), geo choropleth (geography is honestly gated until collection is real — a fake map would undermine the "honest data" principle).

## Surface-by-surface display plan

**Analytics › Acquisition ⚑** — four StatTiles (new accounts + spark · creation rate · cost per account · paid share); TrendChart of account creations vs previous period; SplitBar paid/organic; **channel economics DataTable** (visits, signups, conv %, CPC, CPA per channel — the money table); creative-format MixBars (video/static/carousel/story with CTR detail); two **finding cards** for the starred asks (influencer×paid overlap, frequency-to-conversion) with confidence chips.

**Analytics › Retention ⚑** — four StatTiles (D7 retention · repeat vote rate · gone-quiet count · notification return rate); **CohortGrid** as the hero; post-vote **Funnel** (voted → viewed result → shared → signed up → returned); return-path MixBars (push/email/direct/social); **churn list** styled like Home's attention list, each row with a re-engage action (toast); cohort feature-usage compact table (starred → last, smallest).

**Analytics › Overview (extended)** — gains the **FilterBar** (date · channel · vertical; vertical actually filters the campaign table — filters must visibly work in a demo); a **vertical comparison DataTable** (responses, completion, drop-off, time-to-vote, share rate per vertical — the side-by-side ask); the **TimeHeatmap** card ("When your audience answers"); a compact cross-campaign Funnel. Existing trend/source/device cards stay.

**Distribution** — Sources table gains **Signups** (when Acquisition module on) and **Bounce** columns (traffic quality); Channels rows open a **channel detail** (template: header stats, TrendChart, its slice of sources, its assets) with **Email** fully built (performance-by-campaign-type table: open/CTR/click-to-conversion/unsubscribe; list-growth TrendChart; best-send-time strip from the heatmap data); Influencers table gains **CTR and eCPC** columns and creator names open a **creator detail** (tier chip + followers, StatTiles, clicks TrendChart, per-link table, tier benchmark comparison, and the one manual field in the product: **story views**, editable, saves to a toast); tier benchmarking replaces its LockedCard with a real by-tier table + MixBars.

**Campaign detail** — seventh tab **Influencers** (per-creator table scoped to the campaign + summary tiles); Overview funnel gains a **by-source SegmentedControl** (All · QR · Website · Email) that re-renders the funnel with per-source numbers — drop-off by channel, answered where the decision lives.

**Audience** — stats row gains **polls per session**; new **OS mix** MixBars; Demographics gains the **US vs non-US SplitBar**. Geography stays honestly gated.

**Settings** — **Modules** card: two switches (Acquisition analytics, Retention analytics) driving real feature flags (context + localStorage; nav and tabs appear/disappear live — the "we can always turn features off" demo moment). **Integrations** card grid: GA4, Google Tag Manager, Meta Ads, TikTok Ads, LinkedIn Ads, Klaviyo — two connected, four connectable.

## Why this feels full without feeling busy

Every page keeps the same skeleton (stat row → one hero visualization → tables → findings), so "full" comes from *depth of content*, not variety of widgets. The two heatmaps and the SplitBar carry the memorable identity; everything else is deliberately familiar. A brand director should leave thinking "they measure everything, and I understood all of it."

---

## Implementation status — SHIPPED (mock)

Everything above is built and verified (tsc + vite build green, light and dark themes screenshotted — `shots/dream-01…10`). The dream list is fully represented: every line item renders somewhere reachable, with the starred hard items shipped as findings. New surfaces: `/analytics/acquisition`, `/analytics/retention` (both flag-gated from Settings › Modules — toggling off removes them from the sidebar live), `/distribution/channels/:id` (Email fully built), `/distribution/creators/:id` (with the manual story-views field), the campaign **Influencers** tab, and the funnel **by-source** toggle. New kit members documented in `DESIGN.md`: TrendChart, SplitBar, CohortGrid, TimeHeatmap, FilterBar, Switch, ConnectCard.
