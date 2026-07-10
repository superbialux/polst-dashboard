# Part 1 — System-Level Gaps Vs Shopify

1. **The system is consistent, but too uniform to feel instrument-grade.**  
   Evidence: nearly everything is built from `DashboardCard` with `rounded-card`, `border`, `bg-surface-raised`, `shadow-sm`, and `p-4` ([kit.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/kit.tsx:101)). Shopify varies density by object: KPI strip, chart card, table, and setup card do not all feel like the same box.

2. **The container model is too narrow on Home and too undifferentiated elsewhere.**  
   Evidence: `maxWidth.content: "1024px"` is the only named content width ([tailwind.config.js](/home/superbialux/polst-dashboard/tailwind.config.js:135)), while `DashboardPage` switches only between `max-w-content` and `max-w-full` ([kit.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/kit.tsx:47)). On 1705px screenshots, the app shell leaves a 240px sidebar and a 1453px main pane, but Home content is only 1024px, creating large dead side gutters.

3. **The typography lacks Shopify’s product-system precision.**  
   Evidence: both `sans` and `display` are Inter ([tailwind.config.js](/home/superbialux/polst-dashboard/tailwind.config.js:126)); page titles are always `text-2xl font-bold leading-8` ([kit.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/kit.tsx:56)); buttons are always `font-bold text-ui` at 13px/16px ([button.tsx](/home/superbialux/polst-dashboard/src/components/ui/button.tsx:7)). The result is readable but flatter than Shopify’s more tuned admin hierarchy.

4. **The color system is clean but over-relies on one purple accent.**  
   Evidence: brand purple `#6161c7` drives accent, charts, bars, selected poll state, focus, tabs, and progress ([index.css](/home/superbialux/polst-dashboard/src/index.css:43), [index.css](/home/superbialux/polst-dashboard/src/index.css:91)). Shopify uses blue sparingly for interactive data, not as a blanket product identity layer.

5. **`text-tertiary` is knowingly non-AA and still used broadly.**  
   Evidence: `--text-tertiary` maps to `#8f96a3` and the comment says it fails AA as body text ([index.css](/home/superbialux/polst-dashboard/src/index.css:74)). It appears in placeholders, empty messages, subdued dates, icons, and labels. Shopify’s muted labels remain legible under strain.

6. **Charts are decorative, not analytic.**  
   Evidence: `BarChart` has a fixed `h-40`, only three gridlines, no x ticks except page-level start/end labels, no hover state beyond native `title`, and all bars use `bg-accent-default` ([kit.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/kit.tsx:487)). Shopify Analytics feels sparse but instrumented; Polst feels like static mock charts.

7. **`MixBars` is mathematically misleading.**  
   Evidence: widths are normalized to the largest slice, not to 100%: `width: Math.round((slice.value / max) * 100)%` ([kit.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/kit.tsx:1377)). A `48%` source mix renders as a full-width bar. That alone is below Shopify-admin trust quality.

8. **Tables are visually close, but behaviorally thin.**  
   Evidence: `DataTable` uses `px-4 py-3`, uppercase `text-xs tracking-wide`, and row hover only when `onRowClick` is passed ([kit.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/kit.tsx:323)). Campaigns and Distribution tables have clickable names, not clickable rows, so they look interactive without Shopify-level row affordance.

9. **Poll imagery is uncontrolled and damages the product face.**  
   Evidence: every dashboard poll image is generated from `loremflickr.com/600/450/{food|snacks|packaging|grocery}` ([workspace.ts](/home/superbialux/polst-dashboard/src/lib/workspace.ts:849)). Screenshot `polish-04-campaign-chain.png` shows off-domain imagery inside a serious campaign decision surface. Shopify would not let arbitrary placeholder photography become the core product UI.

10. **The poll result component is over-scaled for cards and under-adapted by context.**  
   Evidence: `PollOptionsBlock` always uses `aspect-[4/3]`, `gap-1`, a 48px OR disc that becomes 64px on large screens, and result bars 44px/56px tall ([PollCard.tsx](/home/superbialux/polst-dashboard/src/components/PollCard.tsx:428)). In grid cards this dominates the card; in detail it is appropriate; in settings preview it feels nested and toy-like.

11. **Buttons are too samey.**  
   Evidence: `md` and `sm` are both `h-8 px-3` ([button.tsx](/home/superbialux/polst-dashboard/src/components/ui/button.tsx:20)). Primary, secondary, row actions, table actions, header actions, and form actions share almost identical physical weight. Shopify separates toolbar buttons, row actions, destructive actions, and primary creation actions more clearly.

12. **Borders, radii, and nesting are overused.**  
   Evidence: radius tokens are sane (`6px`, `8px`, `12px`) ([index.css](/home/superbialux/polst-dashboard/src/index.css:193)), but cards, detail lists, nested previews, code blocks, locked states, and inputs all add borders. `Settings` has card → preview well → inner preview card → poll result card anatomy, which creates boxes-in-boxes.

13. **Dark mode is a theme flip, not a fully audited product surface.**  
   Evidence: dark surfaces are `#14171e`, `#1b1f28`, `#242a35`, `#2e3543` ([index.css](/home/superbialux/polst-dashboard/src/index.css:228)). In `audit-polsts-dark.png`, the product cards gain drama, but purple bars, black photo crops, and white text compete harder than in light mode.

14. **States exist in code but are not applied at app depth.**  
   Evidence: `Skeleton` and `EmptyState` exist ([Skeleton.tsx](/home/superbialux/polst-dashboard/src/components/Skeleton.tsx:3), [EmptyState.tsx](/home/superbialux/polst-dashboard/src/components/EmptyState.tsx:51)), but pages mostly render static mock data or one-line empty labels. There are no real loading, error, no-results, saving, or async validation states.

15. **Accessibility foundation is decent, but product-specific semantics are weak.**  
   Evidence: focus-visible is global ([index.css](/home/superbialux/polst-dashboard/src/index.css:345)), modals trap focus ([Modal.tsx](/home/superbialux/polst-dashboard/src/components/Modal.tsx:20)), and menus rove focus ([Menu.tsx](/home/superbialux/polst-dashboard/src/components/Menu.tsx:57)). But poll option images use `alt=""` even when the image is the tested object ([PollCard.tsx](/home/superbialux/polst-dashboard/src/components/PollCard.tsx:511)), and post-vote non-selected options use `aria-disabled` without actually disabling the button ([PollCard.tsx](/home/superbialux/polst-dashboard/src/components/PollCard.tsx:491)).

# Part 2 — Screen-By-Screen Pixel Findings

**1. Shopify Home Reference — `task/visual-direction/home.png`, 2880×2048**  
The bar is not just polish; it is density discipline. Top chrome, sidebar, metric strip, assistant prompt, promo, and setup cards each have distinct roles. Polst copies the shell pattern but not the object-specific density. Shopify’s cards have tighter internal type hierarchy and clearer “what is actionable vs what is informational.”

**2. Shopify Analytics Reference — `task/visual-direction/analytics.png`, 2880×2048**  
Shopify’s charts are sparse but calibrated: axes, comparison lines, legends, dotted historical data, row-like breakdowns. Polst’s analytics use the same purple bar and progress components everywhere, with much weaker axis semantics.

**3. Shopify Products Table Reference — `task/visual-direction/table.png`, 2880×2048**  
The Products table has a true table-object feel: toolbar integrated into the table, row thumbnails, selection checkboxes, column density, action cluster, and large quiet empty space below. Polst’s tables are clean but generic; the toolbar, page title, and table often feel like separate blocks.

**4. Home Top — `shots/audit-home-top.png`, 1705×1281**  
The shell is sound: 48px header, 240px sidebar, 12px main radius from `DashboardShell` ([Shell.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/Shell.tsx:59)). The issue is inner rhythm: Home centers a 1024px column inside a 1453px main pane, leaving about 214px side air per side. The greeting `text-3xl leading-9` is oversized relative to the admin workload and creates a hero-page feeling Shopify avoids. Stats, campaigns, Polsts, recommendations, and checklist all use the same 16px card padding, so hierarchy comes from position only.

**5. Home Calendar Band — `shots/audit-home-calendar.png`**  
The calendar is too heavy for the 1024px column. Each cell is `min-h-28` or 112px ([Calendar.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/Calendar.tsx:199)), so the six-week grid consumes roughly 672px before headers. Grid lines, bars, date dots, labels, and event cards all compete. The “Plan ahead” heading sits as plain `text-lg` ([Home.tsx](/home/superbialux/polst-dashboard/src/pages/Home.tsx:128)) with insufficient separation from the massive calendar object.

**6. Campaigns List — `shots/audit-campaigns.png`**  
This is one of the strongest screens, but it still misses Shopify table quality. The table card starts cleanly, but the page has a lot of unused vertical space below 9 rows. Row actions are buttons inside the last column, while the row itself is not clickable because `onRowClick` is absent. Header labels are uppercase `text-xs tracking-wide`; acceptable, but the table lacks Shopify’s subtle column-specific alignment and hover treatment.

**7. Campaign Overview — `shots/audit-campaign-overview.png`**  
The `lg:col-span-7` / `lg:col-span-5` split is sensible, but the row heights are visually lopsided. The left “Voter journey” card becomes a large white field with thin 10px bars (`h-2.5`) and little explanatory structure. The “Source snapshot” table is nested in a side column and feels like a miniature table pasted into a card, not an analytic module.

**8. Campaign Create Wizard — `shots/audit-campaign-create.png`**  
The form grid is orderly, but the wizard lacks Shopify-level progression. Step badges are 36×36 (`h-9 w-9`) and visually loud compared with field labels. Step 2’s composer is a huge gray 4:3 placeholder (`aspect-[4/3]`) that dominates the page before the user has entered meaningful content. The right rail is not sticky, and the summary cards use `DetailList`, making them visually identical instead of a real readiness panel.

**9. Distribution — `shots/audit-distribution.png`**  
The summary cards are clear but generic `StatTile`s: label, 30px number, detail ([kit.tsx](/home/superbialux/polst-dashboard/src/components/dashboard/kit.tsx:1239)). The page tabs sit separate from the table, while Shopify usually integrates filters/search into the data object. There is no search, no channel filter, no row selection, and no visible bulk-action affordance despite the page being operational.

**10. Analytics Overview — `shots/audit-analytics.png`**  
The KPI row is readable, but the chart craft is the biggest gap. `Response trend` uses `BarChart` with no weekday/date ticks, no hover/crosshair, no previous-period layer, no selected range context inside the card, and max labels only at right. `Source mix`, `Devices`, and `Platforms` use misleading max-normalized bars. This screen looks like a dashboard mock, not a measurement tool.

**11. Audience — `shots/audit-audience.png`**  
Audience repeats Analytics’ components, so it inherits the same issues. The `New vs returning` card is useful, but the explanatory paragraph sits as generic 14px copy and does not connect visually to the bars. Locked demographic states are honest, but dashed cards (`border-dashed border-border-strong`) visually dominate the lower card more than the available Age data.

**12. Settings — `shots/audit-settings.png`**  
The embed appearance preview has too much nesting: outer `DashboardCard`, gray preview shell, inner white card, then `PollResults`. The live preview should be the hero of this screen, but it is boxed into a 6-column subpanel. Swatches are 32px circles with `border-2`; good hit target, but the selected state is only a border color shift. Team and pending invitation tables are functional, yet the page feels like stacked primitives rather than a polished settings IA.

**13. Polsts Dark — `shots/audit-polsts-dark.png`**  
Dark mode gives the product cards presence, but contrast and image dominance become uneven. The cards use the same 12px radius and border, while images carry uncontrolled brightness. The selected purple option bars and result pills fight with the photos. The top search and grid controls are legible, but the page is visually louder than Shopify dark surfaces would be.

**14. Polsts Grid Light — `shots/polish-01-polsts.png`**  
This is the most differentiated screen, but also where quality gaps are most visible. `PolstGridCard` uses `DashboardCard` plus `PollResults` ([Polsts.tsx](/home/superbialux/polst-dashboard/src/pages/Polsts.tsx:113)), so every grid item contains a full consumer mechanic. The OR disc and result bars are too large for a 3-column admin grid. Images vary wildly in crop, lighting, and relevance. The toolbar floats outside a table/card object, so filters/search/view toggle feel less integrated than Shopify Products.

**15. Polst Detail — `shots/polish-02-polst-detail.png`**  
The live preview is a smart idea: it shows the real consumer card. But the preview is too large relative to the summary rail. The image block consumes most of the first viewport, while the right rail ends early, creating a ragged vertical edge. `PollCard` has consumer actions, likes, reposts, share, and bookmark; useful for preview, but it competes with the operator tasks “Generate report” and “Add distribution.”

**16. Create Single Polst — `shots/polish-03-create-polst.png`**  
The composer is not Shopify-level because the empty state is too blank and too large. Two gray upload zones fill the viewport, with `Add image` buried at center. The placeholder “Ask a question…” is large `text-lg font-bold`, making an empty field feel like missing content. In the screenshot, Launch readiness marks question/options complete while the composer is visibly empty; that state mismatch is a trust hit.

**17. Campaign Polsts Tab — `shots/polish-04-campaign-chain.png`**  
The chain concept is strong, but the cards are too visually heavy for sequencing. Two `PollResults` blocks side by side create four large images plus two OR discs in one row. The drag handle is a tiny `drag_indicator` at 20px ([Campaigns.tsx](/home/superbialux/polst-dashboard/src/pages/Campaigns.tsx:269)) and does not feel like a serious reorder affordance. Because imagery is random, campaign logic feels less credible.

# Part 3 — Prioritized Fix Plan

1. **M, very high impact — Introduce real admin density variants.**  
   Add `DashboardCard` variants for `table`, `chart`, `form`, `preview`, and `compact`. Keep `rounded-card: 12px` for page cards, but use tighter 8px for inner modules and remove shadows from dense tables. Replace universal `p-4` with `p-3`, `p-4`, `p-5` by component role.

2. **S, very high impact — Fix `MixBars` to scale to 100%.**  
   Change width from `slice.value / max` to `slice.value / 100`. This immediately improves Analytics, Audience, Source mix, Devices, Platforms, Interests, and Age.

3. **M, very high impact — Rebuild chart primitives.**  
   Add real x-axis ticks, y-axis labels, comparison series, hover/crosshair, selected datum, empty/loading states, and annotation slots. Keep the sparse Shopify feel, but make the charts factual.

4. **M, very high impact — Create context-specific poll result sizes.**  
   Add `PollResults size="compact|card|detail|embed"` controlling OR disc, result bar height, label size, aspect ratio, and whether vote counts show. Grid cards should not use the same 64px OR disc and 56px result bars as detail.

5. **M, high impact — Replace uncontrolled `loremflickr` imagery.**  
   Use curated local fixtures or deterministic branded image sets with known crops. Add per-option alt text. Dashboard A/B decisions need reliable product, shelf, packaging, and creative images.

6. **S, high impact — Expand the typography ramp.**  
   Keep Inter if needed, but separate display/admin roles: page title 24/32, card title 15/22 or 16/24, table body 13/20, labels 12/16 with deliberate letter spacing. Reduce random `font-bold`; use 500/600 more often.

7. **S, high impact — Add a second container width.**  
   Keep `max-w-content: 1024px` for forms/settings, add `max-w-dashboard: 1200px` or `1240px` for Home. Use it for stats, campaign/polst cards, and calendar so Home does not look over-centered.

8. **S, high impact — Split button sizes.**  
   Make `sm` 28px high, `md` 32px, `lg` 36px. Keep row actions smaller than primary creation actions. Add danger and tertiary/link-button variants instead of using secondary plus red text.

9. **M, medium-high impact — Integrate table toolbars.**  
   Move filters/search/view toggles inside table cards consistently, like Shopify Products. Add row hover to all data rows, row click target, selected state, and bulk-action-ready checkbox patterns where appropriate.

10. **S, medium-high impact — Reduce nested borders.**  
   In Settings preview, remove one wrapper layer. In DetailList, consider borderless rows inside cards. Use dividers only when the card content needs row structure.

11. **M, medium impact — Make create flows progressive.**  
   Collapse empty image upload zones until question/options are entered, or show a compact live preview beside fields. Make the right readiness rail sticky and stateful.

12. **S, medium impact — Rework `text-tertiary`.**  
   Either darken light-mode tertiary or reserve it strictly for icons/decorative helper text. Do not use a documented non-AA token for empty states, placeholders, or dates that users must read.

13. **M, medium impact — Add real empty, loading, and error states.**  
   Wire existing `Skeleton` and `EmptyState` into pages. Add saving states to “Save draft,” invalid states to forms, empty chart states, and unavailable image states.

14. **S, medium impact — Improve chrome details.**  
   Header search is good at 576px, but account menu needs clearer workspace switching and notification panel needs unread/read grouping. Sidebar active state is clean; add better child indentation and section grouping when pages grow.

15. **S, medium impact — Accessibility cleanup.**  
   Disable post-vote no-op poll buttons, add meaningful alt text for tested images, ensure menu/dialog labels map to visible headings, and audit all 32px controls that are below 44px touch guidance.

# Part 4 — Verdict

**Score vs Shopify-admin-level quality: 6.4/10.**

Polst has a credible shell, a real token system, strong baseline component consistency, and a differentiated product idea. It falls short of Shopify quality because the inner surfaces are too generic, the charts are not trustworthy enough, and the poll imagery/result components are not yet adapted with the precision the product face needs.

The 3 changes that would move the score most:

1. Fix Analytics/Audience chart truth: `MixBars` scaling, real axes, hover, comparison states.
2. Create compact/detail/embed variants of the poll result component and control the image set.
3. Introduce role-based admin density: table/chart/form/preview card variants instead of one universal bordered 12px card.

---

# Audit trajectory (codex gpt-5.5, reasoning xhigh)

| Round | Score | Verdict |
|---|---|---|
| 1 | 6.4/10 | 15-item fix plan |
| 2 | 7.3/10 | NOT YET — 5-item shortest path |
| 3 | 8.2/10 | NOT YET — 3-item shortest path |
| 4 | **9.1/10** | **MATCHES SHOPIFY POLISH** |

Round-4 per-dimension: admin polish 9.0 · component precision 9.2 · hierarchy 9.1 · workflow clarity 9.0 · data credibility 9.0 · dark parity 9.2 · system consistency 9.3.

## What got it there (rounds 2–4)
- **Chart truth:** MixBars scale to 100% (never to the largest slice); BarChart gained a left y-axis, x-ticks, hover/focus states, per-bar values.
- **Product face tuned per context:** `PollOptionsBlock` dense variant (36px OR disc, 32px result bars, 16px counts, soft shadow) for admin grids; full-size on detail; presentation-only (`readOnly`, out of tab order) wherever the admin reads rather than votes.
- **Controlled imagery:** curated 20-photo food/packaging Unsplash library, round-robin assignment (even usage, no adjacent collisions), option-label alt text.
- **Calm type:** card titles 14px semibold, sentence-case table headers, zero uppercase/tracking admin labels, tabular-nums on all value columns, word-values in stat tiles at 20px (numbers keep 30px).
- **Physical controls:** button sizes split 28/32/36 with 150ms color+transform press; rows always hover; drag handles with real hit areas.
- **Machined create flow:** composer pair capped at 320px, dashed dropzones with raised icon discs + format hints, live readiness rail wired to actual composer state, sticky rails.
- **System-level:** Home on a 1240px container; AA-safe tertiary text (#6d7585); de-nested Settings preview.

## Accepted product decisions (declared as constraints, not debt)
Grid-first Polsts (the card IS the product), the Home greeting + calendar direction, Inter as the shared cross-app typeface, soft filled status chips (per the Shopify Products reference itself), curated placeholder imagery until real brand assets arrive.
