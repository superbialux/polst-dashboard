# Polst Dashboard Redesign — Problem Analysis & Plan

**Scope:** Restructure + redesign of the **staging dashboard** (staging-dashboard.polst.app, audited screen-by-screen in `task/staging-dashboard-report.md`). **This repo is the redesign in progress** — the mockup-only workspace defined by `task/polst_v1_dashboard_ux_structure.md`. The Home direction (greeting → stat strip → lists → recommendations → setup → **Calendar** → key dates) is locked; it gets refined, not changed.

**Sources studied:** all of `task/misc/` (proposed structure, call transcript, dream list, b2b metric inventories, investor overview), `polst_v1_dashboard_ux_structure.md`, `task/visual-direction/` (14 reference shots), `task/current-dashboard/`, the leaderboard/polymarket references, the live staging dashboard (45 screenshots in `shots/`), and the local app's code + rendered pages (`shots/local-*.png`).

---

## 1. The quality bar — what the visual-direction references actually demonstrate

These are the patterns the references embody. Each is a concrete, stealable mechanic — this list doubles as our polish checklist:

| Reference | Pattern to hit |
|---|---|
| `mini-stats.png` / `mini-stats-opened.png` | One compact stat strip; **click a stat → it expands into a full comparison chart** (current vs previous period, dashed baseline). Orientation first, depth on demand. |
| `home.png` / `home-2.png` | Home = greeting + tiny stats + **action cards with illustration art and one clear CTA each**. Zero raw tables on Home. Personality without noise. |
| `steps.png` | Setup checklist card: progress ring, one expanded step with art + explanation, collapsed siblings. Progressive disclosure inside a single card. |
| `table.png` | Tables are quiet: generous row height, thumbnail + name, one status chip, plain columns, actions revealed contextually. No zebra, no heavy borders. |
| `analytics.png` | Analytics is its own deep page: KPI cards w/ hover-underlined metric names, chart grid, breakdown side-tables. Never on Home. |
| `growth.png` | A themed page can lead with a **narrative hero** ("Run your marketing on autopilot") followed by performance modules — page tells you what it's for before showing numbers. |
| `alerts.png` | Notifications = compact popover with source · timestamp, bold title, one-line body, mark-read affordances, "Last seen" divider. |
| `settings.png` / `klaviyo.png` / `team.png` | Settings = **two-pane** (searchable section nav left, card sections right), each card with title + helper sentence + per-card Save. Team table w/ role chips and filter tabs. |
| `shopify-search-opened.png` | ⌘K search modal with entity filter chips (Apps/Customers/Orders…) and a friendly empty state. |
| `profile-drawer-account-selector.png` | Account switcher popover: current workspace highlighted, other workspaces, create, user identity block, log out. |
| `calendar.png` / `google.png` / `calendar-pop-over.png` | Multi-day items as **continuous colored bars spanning cells**, "+N more" overflow, day-click **popover** for details/creation (Google-cal style). This is the Calendar View pattern people liked. |

The bar: every screen should look like it came from *one* system at this level of restraint — and each page should open by telling you **what it means**, not just what it counts.

---

## 2. Full problem inventory — the staging dashboard

### A. It shows analytics, it never tells a story
The CEO's rule — *status → what changed → why → what needs attention → what to do next* — fails on almost every screen:

1. **Home is a chart dump.** 7 KPI cards, 2 charts, 2 leaderboards, device/OS/browser splits. It answers "how many?" fifty ways and "what should I do?" zero ways. The one story-ish element ("What needs your attention") states facts ("Votes are up 76%") without a next action or a link to act.
2. **No "Ready to decide" concept anywhere.** The product sells decisions; nothing in the UI ever says "this test has enough signal — call it." Readiness/confidence language is entirely absent.
3. **Insights don't exist.** No recommendation layer, no "what changed", no caveats — the interpretation layer that justifies the price (b2b-dashboard.txt: "decision intelligence") is missing.
4. **Metrics without meaning.** "Engagement 53.57%", "View w/o Vote 60%", "Median Scroll Depth 42%" — no explanation of what's good, what changed, or what to do. Every chart violates "every visualization should support a decision."
5. **Math bugs destroy trust in a 'defensible decisions' product:** "1 of 0 people who started", step rates of "700%", drops of "-7 (-700%)" render straight into insight copy.

### B. Wrong object model & information architecture
6. **Polsts are treated as the primary entity; Campaigns should be** (call transcript: "Campaign is the first-class object; posts are building blocks"). Staging's richest features (Distribute, QR, per-item analytics) hang off individual polsts; the login even lands on `/polsts`.
7. **No Distribution concept.** Distribution is scattered across three per-object modals (Distribute-to-socials, QR, Share/Embed). There is no channel system, no named sources, **one generic QR per object** (transcript explicitly demands multiple named QRs — Packaging / Conference Booth / Poster — as separate attribution sources), and no Source Performance view at all. Attribution — the thing that makes brand campaigns measurable — has no home.
8. **No planning surface.** Nothing answers "what is scheduled, what is coming, what is uncovered." No calendar, no scheduled moments/events, no coverage status. A brand can't see that the World Cup is in 10 days and nothing is planned for it.
9. **Depth is in the wrong places.** The Dashboard carries deep analytics (platform splits belong in Analytics); the per-polst Analytics page is nearly empty (3 vote numbers + velocity); the campaign detail crams status, dates, QR, embed, add-polst, reorder, funnel, cross-tab into a page that's brilliant in places (the funnel) but has no Overview/Insights separation. "Dashboard = overview, Campaign = deep, Post = minimal" is inverted or muddled at every level.
10. **Statuses & structure quirks:** Drafts live as a tab *with its own sub-tabs* (Active/Archived) inside Polsts — a second navigation level hiding inside a filter. Campaign list mixes 11 junk drafts with real campaigns. No "Scheduled" status exists even though campaigns have future end dates.
11. **Marketing users see plumbing.** API keys, webhook logs, token-exchange curl examples are first-class Settings sections (transcript: "Marketing users should never think about APIs" — enterprise-tier, hidden in V1). Meanwhile the genuinely valuable Branding studio is buried at the same level.

### C. Screen-level problems (staging, page by page)
12. **Dashboard:** KPI sparklines are red/green noise (a red *views* sparkline next to a green delta); "vs prev 30D" cards mix with "last 30D" cards in the same row; leaderboards duplicate what Campaigns/Polsts lists already show; Export is the only action on the page.
13. **Polsts list:** Engagement column shows unexplained heart/repost icons; "—" for most rows; Views column is mostly 0 (data plumbing distrust); title links jump you *out* to the public site while the row's real action (Analytics) hides in hover icons; grid cards repeat the same three icon actions with no labels.
14. **Polst analytics:** A dead end — no trend, no sources, no devices, no link back to any campaign, no share/export. The page exists but answers nothing (staging report §9.1).
15. **Campaign detail:** Status changes hide inside a chip-dropdown ("Active ▾ → End campaign — can't be undone") with no confirmation modal; the end-date popover and Details tab duplicate each other; Lifecycle tab is 90% static diagram; the Polsts tab's per-polst analytics ("6 votes · 50/50") stop there — no drill-in.
16. **Create flows:** Create Polst is one long form with no step logic, no distribution step, no review step (doc demands Decision → Build → Distribution → Review); nothing tells you what happens after publish. Draft editor triggers a browser-native `beforeunload` alert even with no changes.
17. **Settings:** Five flat sections; Usage duplicates Analytics; Members shows 8 identical "Manager" rows with no roles story; the Branding live-preview studio — the best screen in staging — is invisible unless you stumble into it.
18. **Empty/edge states:** Search-no-results renders a blank table; empty tabs render nothing; new-account experience is nonexistent (doc §23 requires guided empty states everywhere).
19. **Chrome:** persistent 401 console spam from the session stream on every page; dead "Forgot password?"/"Request access" links; unknown routes render "Brand not found" (a public-site 404) inside the operator app.

### D. No visual system
20. **Template-grade look.** Default indigo-on-white, uniform card weight, no typographic hierarchy beyond bold/regular, no art or personality anywhere. Nothing looks *designed*; it looks generated.
21. **Component inconsistency:** three different tab/filter styles (pill tabs, sub-tab buttons, view toggles); two different QR modals; status chips styled differently between Polsts (dot chips), Campaigns (text chips), and Drafts ("Ready to publish" amber); breadcrumbs appear on some detail pages and not others; the campaign card's completion bar switches color semantics (green=100%, red=25%) without a scale.
22. **Density extremes:** the Dashboard packs ~10 modules; Polst Analytics has 3 tiles floating in white space. No rhythm, no consistent section spacing, no max content width.
23. **One-off values everywhere** (staging is unsalvageable on this front — which is exactly why this repo rebuilds on a token system).

---

## 3. THE MAIN PROBLEMS (the ones that matter)

Everything above collapses into six root causes. Fixing these *is* the redesign:

1. **No story.** Screens report numbers instead of guiding: *here's where you stand → here's what changed → here's what needs you → here's the next action.* The product's promise — fast, defensible decisions — never appears in the UI. This is the #1 stated priority (CEO: "everything should tell a STORY").
2. **The object model is inverted.** Polsts act as the primary object; Campaigns must be the decision workspace, Polsts lightweight building blocks, and the Dashboard a thin overview. Depth belongs inside Campaign detail, not on Home.
3. **Distribution/attribution has no home.** Modals instead of a channel system; one anonymous QR instead of multiple named sources; no Source Performance. Without attribution the brand can't defend the decision — the business model leaks here.
4. **No planning layer.** Nothing shows what's scheduled or uncovered. The Home **Calendar View + coverage story** (already built here, and the thing people liked) is the antidote — see a moment, see it's uncovered, create coverage in one step.
5. **Complexity in the wrong place, for the wrong audience.** Deep analytics on Home, empty analytics on Polsts, API plumbing in marketers' Settings, insight copy with broken math. Progressive disclosure is absent: everything is either dumped or missing.
6. **No design system.** Inconsistent components, magic values, template aesthetics. The fix is what this repo already started: a 3-layer token architecture + one component kit, with **zero one-off values** — and pushing every screen to the visual-direction bar.

---

## 4. Where the local redesign already stands

Honest assessment of this repo against the doc and the bar:

**Already solved (keep, don't churn):**
- **IA matches the V1 doc:** Home / Campaigns / Polsts / Distribution / Analytics (Overview·Insights·Reports) / Settings; statuses are in-page filter chips, never sidebar items.
- **Home tells the intended story** and its direction is locked: greeting → range tabs + stat strip → Campaigns/Polsts cards → three recommendation cards → Shopify-style setup checklist with progress ring → **month Calendar with multi-day campaign bars, polst chips, key-date dots, and a Google-style day popover** → key-date bento cards with art tones.
- **Campaign detail** has the doc's six tabs (Overview / Polsts / Distribution / Insights / Report / Settings) and the Overview leads with a decision: "Recommended: Option B +18 pts" + health card + next action.
- **Distribution page exists** with channels, multiple named QR sources ("QR — Packaging" ≠ "QR — Conference Booth"), source performance, and Assign-sources affordance.
- **Analytics Overview** leads with "Ready to decide: 2" and readiness language ("Leading", "Too close", "Decided") in the campaign table.
- **Token discipline is real:** 3-layer token architecture (primitives → semantic → component) with documented contrast ratios, dark theme, radius/shadow scales; component kit (`kit.tsx`) covers page scaffold, cards, tabs, tables, badges, sparklines, stat strip, action cards, checklist; arbitrary Tailwind values are near-zero.
- Chrome: centered ⌘K search field, Create menu, Notifications menu, Account menu, collapsible content card shell.

**Gaps to close (this is the work):**

*Home (refine only — direction unchanged):*
- **Section order doesn't follow the doc's Orient → Plan → Act → Review.** Today: stats → lists → recommendations → setup → calendar → key dates. The calendar (Plan) and the "what's next" recommendations (Act) sit *below* the review lists. Move recommendations directly under the stat strip framed as **"What's next"**, and lift the Calendar above the Campaigns/Polsts lists. Key-date benthos stay with the calendar as one planning band.
- **No coverage story on the calendar** — the doc's core mechanic. Key dates need Covered / Not covered / Partially covered states, an uncovered-moment visual cue in the cell, and the day popover should say "World Cup Kickoff — **Not covered**. Recommended: create a campaign" rather than just listing items.
- **Recommendations aren't grouped by narrative role.** Split into **Needs attention** (Conference Booth QR completing at 41%) vs **Ready to decide** (Packaging Direction Test) — the two lists §5.5/§5.6 demand. Same cards, clearer story.
- **Campaign/Polst rows are review-only.** Each row should carry its readiness/next-action ("Ready to review", "Add sources") like the Campaigns page already does, so even the Review section points forward.
- **Prettier:** stat strip should expand to the mini-stats-opened comparison chart on click (if not already); action cards need the illustration-art treatment consistently (only World Cup has art today); the setup checklist should collapse completed steps like `steps.png`; greeting could carry the v0 subtitle ("What decision do you need to make today?") for voice.
- Empty states for a new workspace (doc §23) don't exist yet.

*Other pages:*
- **Create Campaign wizard** (Decision → Build → Distribution → Review with right operational rail + launch-readiness checklist, §8) and **Create Single Polst** short flow (§21) — routes exist; verify/finish them to the doc, incl. missing-state guidance.
- **Polst Detail** (§10): summary, vote split, source breakdown, device split, schedule/linked moment, report access.
- **Campaign Insights/Report/Settings tabs** need full content (recommendation + confidence + caveats structure; client-ready report layout with mock export).
- **Analytics Insights** must not duplicate Overview stats — decision feed, watchlist, what-changed cards. **Reports** needs the report-card list + preview.
- **Distribution:** Assign Sources modal (§12 table w/ checkbox rows), QR-code sub-view, links & embeds, influencer links sections.
- **Alerts popover content, ⌘K search modal with entity chips, account switcher drawer** — chrome exists but content should match `alerts.png` / `shopify-search-opened.png` / `profile-drawer-account-selector.png`.
- **Scheduled Moment form** (§22) — "Add Scheduled Moment" in the Create menu.
- A **light Polsts grid/visual mode** — the A/B image pair is the product's face; the list page is currently table-only (staging's grid cards were its one good idea worth keeping in refined form).
- Consistency sweep: every list page shares SearchAndFilters + DataTable + StatusBadge; every detail page shares PageTabs; one Toast pattern for mock actions.

---

## 5. System rules (already in force — enforce everywhere)

1. **Tokens only.** All color/space/radius/shadow/type through the 3-layer system in `index.css` + `tailwind.config.js`. Adding a hex/px in a component is a defect. New needs → new semantic token, documented.
2. **DRY via the kit.** New UI = composition of `kit.tsx` / `components/` primitives. If a pattern appears twice (stat tile, filter row, status chip, popover, empty state), it's a kit component with variants — never re-styled inline.
3. **One scale.** Spacing on the 4px grid via section-level rhythm (`space-y-6` page sections, card padding from the card component); radius from `--radius-*`; elevation from `--shadow-*`; type from the display/body scale. No one-off values, no random values.
4. **Both themes always.** Every component reads semantic tokens so dark mode is free; no raw neutrals in components.
5. **Story scaffold per page:** eyebrow/breadcrumb → title → one-sentence meaning → status/what-changed → body → next action. The `DashboardPage` scaffold should make this the default shape.
6. **Mockup-only boundary** (§25): UI states, drawers, toasts — no backend, no real QR/PDF/persistence.

---

## 6. Proposed implementation order

1. **Home refinement** (order → Orient/Plan/Act/Review; coverage states + richer day popover; Needs-attention vs Ready-to-decide grouping; stat-strip expansion; card art; checklist collapse; empty states).
2. **Campaign detail completion** (Insights, Report, Settings tabs; Polsts tab drill-in affordance).
3. **Create flows** (Campaign wizard + Single Polst + Scheduled Moment form).
4. **Polst Detail page.**
5. **Distribution completion** (Assign Sources modal, QR/links/influencer sections).
6. **Analytics Insights + Reports content.**
7. **Chrome polish** (alerts popover, ⌘K modal, account drawer, toasts).
8. **Consistency + empty-state sweep, both themes, final visual QA against the visual-direction shots.**

Each step lands as composable kit components first, then page assembly — so the system stays DRY and every screen keeps telling the same story.

---

## 7. Build round 1 (transfer complete) + external review

**Transferred & restructured (all mock-only, token-driven, Material Symbols):** Campaigns list + detail (Overview w/ decision summary + voter-journey Funnel, visual Polsts chain w/ reorder + add-from-library modal, Distribution w/ embed snippets, Insights w/ findings & caveats, client-ready Report, Settings w/ lifecycle), 4-step Create Campaign wizard w/ operational rail; Polsts A/B image grid + list toggle, Polst detail, short create flow; Distribution with five tabs (Sources / Channels / QR cards / Links & embeds / Influencers) + Assign Sources modal; Analytics Overview (instrumented trend, device/platform mixes, export menu), Insights (decision feed + per-campaign recommendations + what changed), Reports; new Audience page (honest gated demographics — Age only, Gender/Income/Geo locked); Settings (branding studio w/ live OptionPair preview, team roles + labels + pending invites + invite modal, Pro-gated developer platform); chrome (⌘K search dialog w/ entity chips over a static index, wired Create menu, alerts popover). New kit components: `StatTile`, `OptionPair`, `Funnel`, `MixBars`, `SnippetCard`, `LockedCard`, `UploadWell`, exported `PollThumb`, central `polstImage()`.

**Codex visual review (screenshots vs Shopify references) — verdict 6.2/10.** Findings triage:

*Applied now:*
1. **Off-domain stock imagery hurt credibility** → `polstImage()` now serves keyword-seeded food/product photography (one-line swap, deterministic per Polst side).
2. **Charts read placeholder-grade** → `BarChart` gained dashed gridlines, y-axis ticks (0 / half / max), and per-bar value tooltips.
3. **Metric numbers too small for hierarchy** → `StatTile` values bumped to the 30px display step.
4. (Earlier in round) report exec-summary copy stutter fixed; upload wells capped and deduplicated into the kit.

*Deferred — needs the team's call (conflicts with locked direction or is a system-wide re-skin):*
- Remove the rounded "content card on frame" app shell (codex wants edge-to-edge like Shopify) — this is a deliberate signature of our shell; keep unless the team agrees.
- Re-sequence Home into "status summary → highest-priority decision → action queue → calendar" and make the stat strip action-first ("2 ready to decide") — Home direction is locked; revisit with the CEO.
- Move the calendar off Home / compress to an agenda — explicitly against the loved Calendar View; not doing.
- Stricter component-role differentiation (quieter card borders, stronger table rows, flatter secondary buttons) and a formal type ramp — a token-level pass worth doing as its own round.
- Campaign "decision banner" full-width lead — partially present (Decision summary card leads); consider promoting to a banner in round 2.
- Wizard stepper header + richer upload affordances — round 2 polish.

---

## 8. Polish round 2 — "show, don't tell" + the real product face

**What makes Shopify look good (our working definition):** content is the interface (product photos and real numbers on a quiet gray/white stage, near-zero explanatory copy); strict component roles (chrome ≠ canvas ≠ card ≠ table, color only means status); a tight type ramp (hierarchy from type and spacing, never boxes-in-boxes); density with air (compact rows, generous gutters, one column); verbs on buttons, nouns on labels.

**Applied:**
1. **Hard rule — show, don't tell.** Every narrating page/card description removed app-wide (Campaigns, Polsts, Distribution, Analytics ×3, Audience, Settings, Home band subtitles). Helper text survives only in forms where it states a consequence.
2. **The real product face everywhere.** New `polstOptions()` derives true `PollOption` pairs (label · image · votes) from every dashboard Polst; the kit's imitation `OptionPair` is deleted and replaced by `PollResults` — the consumer app's actual `PollOptionsBlock` in its results state (animated seam bars, winner plates, radio pings on unvoted states). Polst grid, campaign chains, and the branding preview all render it; the Polst detail page embeds the full consumer `PollCard` as a live votable preview.
3. **Creation = the consumer composer.** `PollComposer` ports the polished "Ask the world" dialog (character-budget rings with shake, choice tiles split by the OR disc, tag chips) into both create flows.
4. **One form system.** All raw `<input className={CONTROL}>` replaced by the shared `TextInput`/`Select` (identical files in the consumer repo); shadcn `Button`/`Badge` stay for dashboard chrome.
5. Placeholder imagery now single-keyword seeded (`food` / `snacks` / `packaging` / `grocery`) after the two-keyword URL began failing.

**Cross-app rule now in force:** the Polst card, composer, and form controls are the same components in both repos — the dashboard may not fork them.
