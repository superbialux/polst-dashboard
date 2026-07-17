# Design references — Mobbin research for the Polst dashboard redesign

Research date: 2026-07-17. Stack context: React + Tailwind + shadcn + Recharts, Inter, light theme, 4px grid.
Existing tokens to reconcile with: violet accent `#6161c7`, near-black sidebar `#0c0f14`, white cards on `#f4f6f9` canvas, 12px card radius, whisper shadows.

Every measurement below is read off the cited screenshots (normalized to a ~1440px desktop frame); treat them as targets, not gospel — round to our 4px grid.

---

## 1. App shell / sidebar — Vercel

Screens studied:
- Storage page, full nav: https://mobbin.com/screens/2017378e-39db-43ce-b33b-3b193543472f
- Observability drill-in nav: https://mobbin.com/screens/efa48f32-7ab7-4476-a583-00ecf2fa8726
- Projects overview: https://mobbin.com/screens/ee9c9ca1-d199-4d29-8532-eec6ed7b5ca0
- Speed Insights: https://mobbin.com/screens/7dfc3444-f1c0-415c-a48a-ea6c97e0bc7b
- Usage (filter-bar header): https://mobbin.com/screens/51ef7780-7659-4dae-a7fe-039d26fb20b7

What the screens actually do:

- **Width**: ~230–240px fixed. Vercel's sidebar is *light* (white/#fafafa) separated from the content canvas by a 1px hairline border, not a dark panel. Content column is fluid with a max-width, page header centered in the top bar.
- **Workspace switcher placement**: the very first row of the sidebar (~48px tall): 20px round avatar + workspace name (13px, medium, truncated) + plan badge (tiny blue "Pro Trial" pill, ~10px text) + a stacked up/down caret at the right edge. It is a button spanning the full sidebar width.
- **Search**: directly under the switcher — a bordered, rounded (~6px) input ~32px tall, placeholder "Find…", right-aligned single-key hint ("F") in a tiny keycap. Good pattern to copy for a command-palette trigger.
- **Nav items**: ~32px row height, 16px icons, 13px labels, 8px icon-to-label gap, ~8px horizontal padding inside the item, items inset ~8px from sidebar edges. Hover = light gray rounded fill (6px radius). **Active = filled gray pill (#eaeaea-ish) + darker text — no accent color, no left border bar.** Items with children get a right-aligned chevron (›) and expand or drill in.
- **Section grouping**: two techniques. (a) Whitespace gaps (~12–16px) between logical clusters in the flat list. (b) In drill-in views (Observability) the sidebar swaps to a sub-nav with a "‹ Observability" back header, then **uppercase micro-labels** ("COMPUTE", "CDN", "SERVICES") at ~10–11px, gray, tracking-wide, ~24px tall, above each group.
- **Pinned bottom area**: an alert card ("Action Required" — bordered, rounded, icon + 12px body + full-width secondary button) sits above a persistent identity row at the very bottom (avatar + name + "…" overflow). The bottom area is visually separated by a hairline.
- **Collapsed behavior**: Vercel doesn't collapse to icons; Dub (see §3) shows the better collapsed model — a permanent ~48px icon rail (workspace avatars, app-level icons) beside the label panel. For Polst: collapse the 240px panel down to a 56–64px icon-only rail, icons centered, active state = same pill shape square, tooltips on hover for labels.
- **Page header**: thin top bar (~48px) with breadcrumb/title; below it, list pages open with a full-width toolbar row: search input stretching, then filter icon, view toggles (grid/list segmented icon pair), and a solid-dark "Add New…" split button at the far right (ee9c9ca1).

Takeaways to port: 32px items / 16px icons / 13px labels; neutral-fill active pill (we'll do translucent white on our dark sidebar); uppercase 10–11px section labels; workspace switcher as sidebar row #1; identity row pinned bottom; search/⌘K as row #2.

---

## 2. Analytics page layout + KPI cards — Amplitude

Screens studied:
- Home dashboard w/ KPI chips + chart: https://mobbin.com/screens/d0eee203-09f5-43ca-a6c3-3edc74a0abdf
- Home w/ live-users gauge: https://mobbin.com/screens/dc112aff-0eda-4659-8447-9c88b516b2d1
- "What's happening" tile grid: https://mobbin.com/screens/0ace4767-cfad-4cd9-8144-7b8a06f3f77e
- Quick actions row: https://mobbin.com/screens/02906646-128e-4467-8350-a956d3ff59eb
- Chart builder (segmentation): https://mobbin.com/screens/87111671-74a3-4077-a007-a5b89c2ec31e

What the screens actually do:

- **KPI chips as chart selectors**: the hero card contains a row of small bordered chips (each ~150×60px, ~8px radius): 11px gray label on top ("Visitors (Uniques)"), below it an ~20px semibold value with an inline delta ("4  ▾300.0%") — delta colored red/green at ~11px, sitting on the same baseline row as the value. The **selected chip gets a blue border + pale blue tint** and drives which series the chart below renders. KPI row and chart share one card; card header row = 13px semibold title + ⓘ icon left, "Open Analysis →" text action right.
- **Tile grid**: below the hero, equal-height metric tiles (4-up): 12px semibold title, huge value (~28–32px) with "0%" delta + "from Jul 23" comparison caption in 11px gray, then a ~90px-tall mini line chart with its own micro y-axis. Tile footer: gray pill tag ("User Activity") + "Go To Template →" link. Cards are white, 1px #e5e7eb-ish border, ~8px radius, effectively **no shadow** — borders do the separation work.
- **Secondary widgets**: "Current live users" card uses a half-gauge + two label-over-value pairs beneath (label 11px gray, value 16px semibold). Realtime widgets marked with a small green dot next to the title.
- **Quick actions**: a row of 4 outlined cards (~44px tall), icon + 13px label, evenly stretched — good pattern for "Create campaign / Share / Invite / New poll" shortcuts atop our overview.
- **Chart builder chrome** (87111671): time-range as a compact segmented control (7d | 30d | 60d | 90d, selected = blue tint), granularity dropdown ("Daily"), chart-type dropdown ("Line chart") — all right-aligned above the chart. Legend = colored dots + 11px labels centered *below* the plot. Breakdown table below the chart: checkbox rows, colored series dot per row, per-bucket numeric columns, "Export CSV" top right.

Takeaways to port: KPI-chip-selects-series hero card (perfect for votes / views / completion-rate switching on one Recharts area chart); value 24–28px + 11px delta + 11px "vs previous period" caption; borders-not-shadows inside dense analytics zones; legend under chart; breakdown table with series dots.

---

## 3. Chart styling — Dub

Screens studied:
- Link analytics (hero reference): https://mobbin.com/screens/d0f6f9cb-db3a-43e1-ba0c-97950979f096
- Partner analytics (violet chart!): https://mobbin.com/screens/104187d7-5f59-49a5-b7c6-ec932f3e0ce1
- Partner program overview: https://mobbin.com/screens/cd862d93-2252-4c32-9e90-7e4cf2aff6b4
- Referral overview w/ sparkline tiles: https://mobbin.com/screens/5ff08352-abe7-43bf-a732-2a758d41ffeb
- Sparkline tiles w/ hover tooltips: https://mobbin.com/screens/287fb1b4-260c-4fef-bff0-458887c25ea9

What the screens actually do:

- **KPI tab bar fused to the chart**: one white card; the top strip is split into 3 equal columns (Clicks / Leads / Sales) divided by hairlines. Each cell: tiny colored square dot (~6px) + 12px gray label, then ~24–28px semibold value. **Active metric = 2px near-black underline across that cell's bottom edge** (tab semantics, not border-color semantics like Amplitude). Chart renders full-bleed inside the same card below.
- **Line + area treatment** (104187d7 is literally our palette — violet line on white): line weight ~1.5–2px; area fill is a vertical gradient of the line color from roughly **12–15% opacity at the line to 0% at the baseline**; no dots on data points at rest; a single small filled dot may mark the latest point.
- **Grid**: horizontal **dashed** hairlines only at y-ticks (2–4 of them, ~#e5e7eb, 3-4px dash), no vertical gridlines, no axis strokes. Y labels: 10–11px gray, 2–3 ticks max. X labels: only sparse anchors — first date, last date, maybe one middle ("Mon, Sep 1 … Wed, Oct 1"), 10–11px gray, aligned to the plot edges.
- **Hover state** (287fb1b4): thin vertical crosshair line, a dot on the series at the intersection, and a compact white tooltip pill (1px border, ~6px radius, whisper shadow): "Thu, Sep 11" 11px gray + value 12px semibold, dot-colored bullet if multi-series.
- **Chart-type toggle**: two tiny icon buttons (line / bar) top-right inside the card — low-ceremony, no dropdown.
- **Breakdown lists as bar-rows** (d0f6f9cb): below the chart, two half-width cards with internal tabs ("Short Links | Destination URLs", "Referrers | UTM Parameters") + tiny uppercase right-aligned column caption ("CLICKS"). Each row = favicon/icon + 13px label + right-aligned count, with a **proportional background bar fill** (soft tinted rectangle behind the row content, widest = 100%). This replaces horizontal bar charts entirely and is very cheap to build (a div with tinted width%).
- **Filter chrome**: "Filter ⑴" button with count badge + time-range select ("Last 24 hours") top-left; applied filters render as removable pills on a second row ("🔗 Link is asmobbin.link ×") with "Clear Filters ESC" at right.
- **Sparkline stat tiles** (5ff08352, 287fb1b4): grid of cards, 13px semibold label + 20px value top-left, ~60px sparkline area chart pinned to the card's bottom edge, full card width, x labels ("Aug 30 … Sep 29") in 10px gray at the corners. Each tile has its own hover crosshair + mini tooltip. Optional "View more" ghost button appears on hover, top-right.
- **Overview KPI card w/ dashed reference line** (cd862d93): big "Commissions $13.01" card with a dashed gridline labeled "$5.00" — dashed reference/threshold lines read clearly against the solid data line.
- **Dub's sidebar** (context): ~48px icon rail + ~200px light panel; group micro-labels ("Insights", "Engagement", "Configuration") 10-11px gray; active item = **white pill with 1px border** on the gray panel; "New" as tiny blue pill after the label.

Takeaways to port: this is our Recharts spec, near-verbatim (see synthesis §8 for exact Recharts props).

---

## 4. Area chart + stat tiles (general corroboration)

Screens studied:
- Vercel Web Analytics: https://mobbin.com/screens/172f9834-0e6a-4fa8-abd4-6e91b02b5ef4
- Lovable analytics (tooltip w/ definition): https://mobbin.com/screens/8165137a-b9f5-4c23-b36f-f6b8ebf5a6bf
- Chatbase agent analytics: https://mobbin.com/screens/bbbaa552-b1fe-4e07-a3d0-c05424186187
- Base44 traffic overview: https://mobbin.com/screens/4206bbf8-d9db-4f88-bd38-69811d10846d

What the screens actually do:

- **Vercel** confirms the Dub fused KPI-tab + chart card, adds two details: (a) a **dashed line segment for the incomplete current period** (projection styling — solid history, dashed today), and (b) delta pills — bounce rate shows "+69%" in a small red-tinted pill right next to the value, i.e. delta-as-chip rather than delta-as-inline-text. "Yesterday" is highlighted on the x-axis when hovered.
- **Lovable**: 5 KPI tiles in a row as separate bordered cards; the **selected tile gets an accent border + tint**; its black tooltip pill carries a *definition*: "1.21 views per visit — How many pages the average visitor viewed." → tooltips that teach, not just restate. Breakdown cards below use the same tinted bar-rows as Dub, in lavender.
- **Chatbase**: 4 outlined KPI tiles, 13px icon+label row, 24px value below, generous padding — clean minimum-viable KPI tile when there's no sparkline data.
- **Base44**: stat tile trio with label + ⓘ, 20px value, green ↗ arrow + % delta; country/OS breakdown as tinted bar-rows again (pattern is ubiquitous).

Takeaways to port: dashed "in-progress period" line ending; delta chips (tinted pill, not bare text) for at-a-glance polarity; definitional second line in tooltips for derived metrics (completion rate, votes/view).

---

## 5. Insight cards that explain data — Hotjar

Screens studied:
- Feedback insights (the key screen): https://mobbin.com/screens/feeaa340-871e-4e4d-a719-81e7dfdb0738
- Trends page: https://mobbin.com/screens/6428a590-7db7-4ef9-a5d3-3bf441a2f539 and https://mobbin.com/screens/d616b771-929c-4147-94db-25c27f9a92c2
- Dashboard widget grid: https://mobbin.com/screens/30994788-d649-4d72-b153-2385f6606054
- Site overview widgets: https://mobbin.com/screens/44d162f6-90e5-4386-b598-80657857c0cc

What the screens actually do:

- **Insight card anatomy** (feeaa340, "What do users say?" cards, 3-up): 
  1. header row: small icon (emoji-grade face) + 13px semibold question-phrased title;
  2. evidence row: **sentiment pill** (lowercase word "positive"/"neutral"/"negative" in a tinted pill — green/gray/red tint at ~8-10% opacity with matching text) + big 20px stat ("60%");
  3. a real user quote in quotes, 13px, 2–3 lines;
  4. CTA row: "→ View all positive answers" as a plain 13px link with leading arrow.
  Card = white, 1px border, ~8px radius. The whole card is scoped to ONE claim.
- **How Hotjar frames "what this means"**: headlines are *questions* ("How do users feel?", "What do users say?"), the chart/number answers, and the drill-down link closes the loop. Interpretation is delivered by structure (question → evidence → action), not by a paragraph of prose.
- **Data-to-action rows** (30994788): "Top clicked buttons & links" rows carry inline action icons (view heatmap ▣, play recording ▶) at the row's right end — every datum offers its next step. For Polst: each top-poll row should offer "view poll →" / "see responses".
- **Trends chrome** (6428a590): time range as a **segmented pill group with Custom first**: `Custom | 24h | 7d | 15d | 30d | 3m | 6m | 12m` (selected = darker gray pill), chart-type select at right; comparison affordance "+ Compare with…" under the primary series selector; legend centered below plot (dot + label).
- **Audience pill-tab row** (30994788): a scrollable row of preset segment pills above the widgets (All sessions / Direct traffic / Mobile users / New users…) — nice model for campaign-audience presets.
- KPI widgets here put a small red/blue **sparkline at the right side of the tile**, same baseline as the value — an alternative to Dub's bottom-bleed sparkline when tiles are short.

Takeaways to port: the 4-part insight card (icon + question headline + evidence stat/quote + arrow-link CTA); tinted lowercase sentiment/status pills; question-phrased section headers; per-row drill-down actions.

---

## 6. Trends pattern — Apple Fitness (iOS)

Screens studied:
- Trends 2×2 card: https://mobbin.com/screens/5b8d5290-6c52-436f-bac3-9d0a531db829 (also 2745a5a7…, 159f8961…)
- Trends coaching/onboarding card: https://mobbin.com/screens/ee3b91a4-8e03-46a4-8cec-48abe8322dfe
- Summary day detail: https://mobbin.com/screens/1bbc757a-175a-4687-9553-3d7fa287e9a1

What the screens actually do:

- **Trends card**: card titled "Trends" with a chevron (whole card navigates); inside, a 2×2 grid of metric entries. Each entry: a short colored line/arrow glyph at left, metric name in 15px white, and beneath it the value **rendered in that metric's signature color** with its unit fused in ("-/-CAL/DAY", "-/-KM/DAY"). Each metric owns a hue (Move pink, Distance blue, pace purple). Arrows (↗/↘) replace the dash glyph once there's ≥ ~90 days of data — arrow color = metric color, direction = trend vs long-term baseline.
- **Coaching card** (ee3b91a4): anatomy top-to-bottom — (1) a circular **arrow chip** (green pill circle containing a chevron-up), (2) an activity glyph, (3) a 2–3 sentence coaching paragraph, (4) an accent-colored text CTA ("Get Started"). 
- **Apple's coaching sentence formula** (visible here + canonical Fitness copy): `[arrow] + [metric] + [explicit comparison window] + [encouragement/instruction]` — e.g. "Trend arrows help you stay motivated by showing even more details"; in populated states Fitness renders lines like "Your 90-day walking pace of 14'02" is below your 365-day average of 13'30". A brisk 20-minute walk most days can turn this around." Structure: *fact with both numbers → single concrete suggestion*. Second person, present tense, one metric per sentence, no hedging, no exclamation unless positive ("Keep it up!").
- Metric tiles on Summary (1bbc757a): label 15px, value huge with unit in small caps fused to it ("5,227" / "3.60KM") — unit set ~40% smaller than the number, same baseline.

Takeaways to port (for a Polst "Trends" strip): one row of trend entries, each = arrow chip (↗ tinted green / ↘ tinted red / → gray, semantics by *desirability* not direction — falling bounce is green) + metric name + "7-day vs 30-day" comparison values + one plain-English coaching line, e.g. "Response rate is 34% this week, above your 30-day average of 28%. Your Tuesday sends keep outperforming — schedule the next campaign there." Unit fused to value, small-caps style.

---

## 7. Supporting patterns

### 7a. Empty states

Screens studied:
- OpenPhone analytics upsell: https://mobbin.com/screens/9e0a7991-3cae-44f7-801f-99e38aca9002
- Mixpanel "select to start": https://mobbin.com/screens/9c110c0a-8594-48e0-8284-c1f9b408ed70
- Mixpanel "no data for query": https://mobbin.com/screens/209a317b-b257-44a4-9ee0-cbacb8c0fe94
- Vapi "no data here": https://mobbin.com/screens/09275981-aeca-4550-b0ad-de53f05ae650
- Mixpanel choice-card empty dashboard: https://mobbin.com/screens/a2b97786-29a8-420d-8c74-5485cdc1e4da

Anatomy (consistent across all): vertically centered in the content region; small line-art illustration or single icon (~48–80px, tinted in a pale brand hue — Mixpanel uses pale lavender, directly reusable with our violet at ~20% ); headline 18–24px semibold; 1–3 line body 13px gray, max-width ~420px, centered; ONE primary action. Three registers to distinguish:
1. **First-run** (never had data): sell the value with question-phrased copy ("How much time did your team spend…?") + primary button (OpenPhone).
2. **No results for filters**: warning-neutral icon, "We couldn't find any data for that date range" + the *reason* + implicit fix ("expand your date range" — Vapi/Mixpanel). No illustration fanfare; keep it quiet, offer "Clear filters".
3. **Empty container** (dashboard with no widgets): two dashed-border **choice cards** side by side ("Add to Board" / "Use a Template"), each with illustration + label + caption (a2b97786) — empty state as a fork, not a dead end.

### 7b. Data tables with filters + pagination

Screens studied:
- Navattic visitors table (cleanest match): https://mobbin.com/screens/406b9908-584c-4f05-8432-abd77533bfa4
- Navattic row → side drawer: https://mobbin.com/screens/a99e7d4b-d709-4f0c-94b8-8ff2eb174f65
- HubSpot goals table: https://mobbin.com/screens/96ea82d0-be10-4785-af0b-e67dbd0439a5
- Mixpanel users w/ filter builder: https://mobbin.com/screens/d40e4a2b-b18a-4c7c-9de2-c69b3deec291
- Clay table w/ filter popover: https://mobbin.com/screens/dec4ef03-31ed-4486-92ab-dd94d4b3f8ad

Anatomy (Navattic as the template): page title (~24px) → toolbar row: search input (~240px) + "Filter" outline button with count left; "Sort: Name ▾" select + date-range picker + "Export" outline button right. Applied filters render as a second row of removable pills ("Events: Engaged ×", "+ Add filter", "× Clear"). Table itself: 12px gray header labels, sortable columns get an arrow on hover/active; rows ~52–56px, avatar/icon + stacked primary (13px medium) / secondary (12px gray) text; missing data as *italic gray* "Not identified" (never blank); numeric cells right-aligned; hover = full-row tint; row click opens a **right-side detail drawer** (~380px, own header + close ×, tabs, activity timeline) instead of navigating away. Footer: "25 ▾ rows per page" left; "1–6 of 6" + Previous/Next buttons right, disabled states visibly grayed. HubSpot adds checkbox column + bulk bar and in-cell progress bars (useful for poll completion columns).

---

## 8. Recommended synthesis for the Polst dashboard

One direction: **"quiet chrome, violet data."** The shell (sidebar, toolbars, tables, cards) is entirely neutral — cool blue-grays, hairlines, gray active-states — and `#6161c7` is spent almost exclusively on data ink (chart lines/fills, selected-state accents, links, primary buttons). That is exactly how Vercel (monochrome chrome, blue charts) and Dub (gray chrome, violet charts) achieve calm density, and it protects our whisper-shadow/white-card language.

### Adopt

- **Shell**: keep our near-black `#0c0f14` sidebar (it's our identity; none of the references have one, which makes it distinctive) but run Vercel's *metrics* inside it: 240px expanded; row 1 = workspace switcher (24px avatar + 13px name + plan pill + caret); row 2 = search/⌘K field; nav items 32px tall / 16px icons / 13px labels / 6–8px-radius pill; group micro-labels 10px uppercase tracking-wide at 45% white; pinned bottom identity row above a hairline (white at 8%). Active item = **white @ 8–10% fill pill + white text** (Vercel's gray pill translated to dark); hover = white @ 5%. NO violet fills in the sidebar — at most a 2px violet left notch on the active pill if testing shows the fill alone is too quiet. Collapse to a 60px icon rail (Dub's rail), tooltips for labels.
- **Canvas & cards**: keep white cards / 12px radius / whisper shadow for top-level page cards, but **inside analytics grids use 1px `#e4e8ee` borders and drop the shadow** (Amplitude/Dub) — shadows on 8 tiles at once read as noise; borders read as instrumentation.
- **KPI hero card** (Dub + Vercel fusion): one card; top strip of 3–5 metric cells separated by hairlines (6px violet-or-series dot + 12px gray label + 24px/semibold value + delta chip); active cell gets a **2px `#6161c7` underline** (Dub's black underline, in brand); the Recharts area chart below shares the card. Delta = tinted chip (green `#e7f6ee`/`#177245`-style, red equivalent), polarity by desirability.
- **Chart spec (Recharts)**: line `stroke=#6161c7 strokeWidth=1.75 dot=false`; `<Area>` fill = linearGradient `#6161c7` 14% → 0% opacity top-to-bottom; `CartesianGrid horizontal only, strokeDasharray="3 4", stroke=#e7eaf0`; 2–3 y-ticks, tickLine/axisLine=false, 11px `#8a93a6` labels; sparse x ticks (first/last/one middle); hover = 1px `#c9cfdb` crosshair cursor + white tooltip (1px border, 8px radius, shadow-sm, 11px gray date over 12px semibold value, violet dot bullet, plus a definitional second line for derived metrics à la Lovable); **dash the final in-progress bucket** (Vercel); dashed neutral reference line for goals/averages (Dub). Legend (multi-series only): dots + 11px labels centered below plot. Line/bar icon-toggle top-right of the card.
- **Sparkline stat tiles**: Dub's bottom-bleed 56–64px gradient sparkline pinned to the tile's bottom edge, label + value in the top-left, per-tile hover crosshair. Use violet for the primary metric tile and desaturated blue-gray (#93a3c4-ish) sparklines for secondary tiles so violet keeps meaning.
- **Breakdown lists = tinted bar-rows** (Dub/Vercel/Base44): half-width cards with internal tabs; rows = icon + label + right count over a proportional background fill in violet @ 8–10%. Add Hotjar's per-row action icons (open poll, view responses) on hover.
- **Insights section** (Hotjar anatomy + Apple Fitness voice): "Trends" strip of coaching rows/cards — arrow chip (↗ green-tint / ↘ red-tint / → gray circle, 24px, direction colored by desirability) + metric name + one sentence in the Apple formula: *current value + explicit comparison window + one concrete suggestion* ("Completion rate is 72% this week, above your 30-day average of 64%. Shorter polls are landing — keep them under 5 questions."). Below or beside: Hotjar-style question-headline cards ("What are people saying?") with tinted lowercase status pills, a representative response quote, and an "→ View all responses" arrow-link. One claim per card, always with a drill-down.
- **Tables** (Navattic template): toolbar = search + Filter-with-count left, sort/date/Export right; removable filter pills row; 52px rows, stacked two-line cells, italic-gray for missing values, right-aligned numerics, in-cell progress bars for completion; row click → right drawer (380px) not navigation; footer = rows-per-page select + "1–25 of n" + Prev/Next.
- **Empty states**: three registers (first-run sell w/ question copy + violet primary button; quiet "no data for this range" with the fix named; dashed choice-cards for empty containers). Illustration/icon tinted with violet at ~15–20% on `#eef0fa`. Always vertically centered, body max-width ~420px.
- **Time-range control**: Hotjar/Amplitude segmented pill group `24h | 7d | 30d | 3m | 12m | Custom`, selected = near-black text on gray pill (not violet — it's chrome, not data).

### Reject (would break cohesion)

- **Light sidebar** (Vercel/Dub/Hotjar): our `#0c0f14` panel is the brand move; translate the patterns, not the palette.
- **Amplitude's saturated blue chrome** (blue top bar, blue Create button, blue tab tints everywhere): accent-as-chrome is precisely what we're avoiding; violet stays data-side.
- **Dub's pastel rainbow gradient hero + pink/red gradient sparklines** (5ff08352): charming for a referral consumer surface, off-brand and polarity-confusing (red gradients under positive metrics) for us. One-hue gradients only.
- **Hotjar's full-width horizontal gridlines + centered plain charts** (6428a590): dated density; keep Dub's dashed sparse grid.
- **Apple Fitness dark cards / per-metric rainbow hues**: adopt the *sentence formula* and arrow chips only; metric-owns-a-color would explode our palette. All trend arrows use the green/red/gray desirability triad.
- **Vercel's zero-accent active nav** on our dark sidebar *if* it tests too quiet — fallback is the 2px violet notch, never a full violet fill.
- **HubSpot's chrome-heavy table** (orange CTAs, double tab rows, shaded header): keep Navattic's minimal version.
- **Mixpanel's dark-navy top-nav-only shell**: sidebar stays; no second nav row.

### Type & spacing recap (Inter, 4px grid)

- Page title 24/semibold; card title 13/semibold + optional ⓘ; section micro-labels 10–11/medium/uppercase/tracking-wide.
- KPI value 24 (hero) or 20 (tile) semibold, tabular-nums; label 12 gray; delta chip 11 medium; comparison caption 11 gray.
- Nav/table/body 13; secondary/meta 12; axis/tooltip-date 11; units fused to values at ~60% size, small-caps feel.
- Card padding 20; grid gap 16; toolbar height 40; nav item 32; table row 52; chart height 280–320 (hero), 56–64 (sparkline).
