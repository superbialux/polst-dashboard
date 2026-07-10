# What I think our dashboard's problems are

*An honest self-assessment of the redesign in this repo (the `*--2-ours.png` screenshots), written after four codex gpt-5.5 (xhigh) audit rounds took it from 6.4 to 9.1/10 ("MATCHES SHOPIFY POLISH"). The full audit record is in `task/shopify-gap-audit.md`. Polish debt is largely paid; what remains is a different class of problem.*

## 1. It's a mockup wearing a product's clothes

Everything is hardcoded in `src/lib/workspace.ts`. There is no backend, no persistence, and therefore **no real states**: no loading skeletons, no error states, almost no empty states, no first-run experience. The create flows compose but don't save. A dashboard's credibility lives in how it behaves when data is slow, missing, or wrong — we have never had to answer any of those questions. This is the single biggest gap between "looks like Shopify" and "is like Shopify."

## 2. Believability of the data story

The imagery is a curated Unsplash library, not North Star Pantry's actual products; the numbers are plausible but invented. Codex flagged this correctly: at demo time, a viewer's trust hinges on the mock workspace feeling like a real brand mid-campaign. The round-robin image system killed the collisions, but "generic nice food photos" still reads as placeholder to anyone who looks twice.

## 3. Brand character — polished, but whose polish?

Codex's final verdict said the remaining difference from Shopify is "mainly brand character, not polish debt." That cuts both ways: the system is calm, consistent, and tokenized, but little about the admin chrome is distinctly *Polst* besides the shared card and the accent. Shopify's admin is unmistakably Shopify; ours could belong to several well-built SaaS tools. The product face (PollCard, composer, OR disc) carries the identity — the chrome around it doesn't yet.

## 4. Charts are honest but shallow

BarChart/MixBars/Funnel/Sparkline are div-based. They now tell the truth (real scales, left axes, ticks, hover values), but there are no real tooltips, no crosshairs, no comparison periods, no export. Fine for a mock; below bar for the "decision intelligence" tier the pricing story depends on. When this goes real, the chart layer should be rebuilt on SVG with a proper interaction model.

## 5. Depth is uneven across the map

Campaign detail (six tabs, funnel, chain, report) is far deeper than Audience (mostly gated placeholders), Distribution (assets exist, but no "add channel" flow behind the button), and Analytics Insights/Reports (thin). The proposed structure is fully present as navigation, but a user who clicks two levels down finds rooms with furniture and rooms with paint still drying. An investor demo should be routed through the deep paths.

## 6. Desktop-only

The shell is a viewport-locked desktop layout. There has been no responsive pass, no mobile navigation model, and the calendar/table components would not survive a narrow screen. Marketers live on laptops, so this is acceptable for V1 validation — but it's undecided, not solved.

## 7. Accessibility is directionally right, unaudited

Focus states, aria-labels, contrast-checked tertiary text, and sentence-case labels are in place, but there's been no keyboard-only walkthrough, no screen-reader pass, and the calendar/drag interactions are mouse-first.

## 8. Watch-list on locked decisions

Two deliberate choices are worth revisiting with real users, not because they're wrong but because audits kept snagging on them: the greeting-first Home pushes health metrics below the first glance (Shopify leads with the stat strip), and the grid-first Polsts library favors the product face over admin scanning (Shopify Products defaults to a dense table). Both are defensible — Polsts are visual objects and the CEO wants story over spreadsheet — but they're bets, and the list view / calendar toggle should stay one click away.

## Summary

The redesign has solved what the CEO asked for — story, campaign-first structure, calm hierarchy, channel system, planning layer — and reached reference-level visual polish. Its real problems are now **truthfulness problems** (mock data, missing states, placeholder assets) and **depth problems** (uneven second-level pages, shallow charts), not layout or style. The next unit of work that changes its fate is wiring it to real data, not another coat of polish.
