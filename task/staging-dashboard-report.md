# Polst Staging Dashboard — Full Screen-by-Screen Report

**App:** https://staging-dashboard.polst.app (staging environment, "Polst Dashboard")
**Audited:** 2026-07-09, logged in as max@polst.io ("Maxwell", workspace "New Brand names", Free plan)
**Screenshots:** `shots/01` … `shots/45` (45 captures, referenced inline below)

Polst is a **brand-facing A/B polling platform**. A "polst" is a two-option (A vs B) poll, usually
with an image per option. Brands create polsts, bundle them into **campaigns** shared under one
public link (`staging.polst.app/campaign/<id>`), distribute them via link / QR / social / embed,
and track analytics. The dashboard is the brand's operator console.

---

## 1. Global layout & visual language

- **Chrome:** fixed left sidebar (~240px, white) + light-gray content canvas (`#f6f6f7`-ish).
  Content headers use a large bold H1 with a one-line gray subtitle.
- **Sidebar (top→bottom):** workspace switcher (brand avatar + "New Brand names / Free plan",
  opens a menu listing the user's brands — currently just one) · "WORKSPACE" nav group with
  **Dashboard, Polsts, Campaigns, Settings** (icon + label; active item gets a light-indigo pill
  with indigo text) · footer with user card (avatar-initial, name, email, log-out icon) and a
  **Collapse** toggle (collapses to an icon-only rail, `shots/41`).
- **Accent color:** indigo/violet (#4f46e5 range) for primary buttons, active states, links, chart
  lines. Status chips: green "active", gray "ended", amber "draft"/"Ready to publish".
  Engagement icons are red hearts and repost arrows.
- **Components:** rounded-xl white cards with hairline borders and subtle shadows, pill-shaped
  filter tabs, small pressed-state view-mode toggles (list/grid), dropdown menus with
  title+subtitle menu items, modal dialogs with dimmed backdrop, toast region ("Notifications
  alt+T") bottom-right.
- The UI is responsive-desktop oriented, clean, SaaS-standard, typographically restrained
  (system sans), with generous whitespace.

---

## 2. Authentication — Login (`/login`, shots/01)

Split-screen: left half white with the polst logo, "Log in to your workspace" heading, email +
password fields (icons inside), "Remember me" checkbox, "Forgot password?" link (dead `#`),
full-width indigo **Log In** button, and "Don't have an account? Request access" (also `#`).
Right half is a full-bleed indigo gradient marketing panel: "polst for brands", headline "Run A/B
polls your audience actually wants to answer." and three glass stat tiles (9.5% avg engagement,
2.4k votes this month, 3 live campaigns), footer "© 2026 polst · staging-dashboard.polst.app".
Any unauthenticated route redirects here with `?redirect=`.

## 3. Dashboard (`/dashboard`, shots/09–11)

Brand-wide performance overview. Header: "How your brand is performing across every Polst and
campaign", an **Export** button (menu: Download CSV / Download PDF — `shots/11`) and a time-range
segmented control **7D / 30D / 90D / All** (30D default).

- **"What needs your attention"** — an auto-generated insight panel comparing the last 30 days
  vs the previous 30: e.g. "Votes are up **76%**", "Engagement is up **585%** to 53.57%",
  "**voting campaign** has the most room to grow: 92 views but only 0.00% completion — your
  biggest lever." (green up-arrows / red down-arrow icons).
- **KPI cards, row 1 (with red/green sparklines and vs-prev deltas):** Total Views 112 (↓74%),
  Total Votes 60 (↑76%), Engagement Rate 53.57% (↑585%), Completion Rate 57.14% (↑86%).
- **KPI cards, row 2:** Avg Dwell Time 428.7s, Median Scroll Depth 42%, View w/o Vote 60%.
- **Charts:** "Views & Votes" dual-line daily chart (indigo views / teal votes) and
  "Avg Dwell Over Time" area chart (blue).
- **Leaderboards:** "Top campaigns by views" (ranked 1–5 with status chip, views·started,
  completion %) and "Top polsts by votes" (votes · option-split %), each with an "All →" link.
- **Audience breakdowns:** Device (desktop 90%, mobile 4.1%, unknown 6.4% of 172 events),
  Platform — Operating systems (macOS 56.98%, Unknown, iOS, Linux, Android, Other) and
  Browsers (Chrome 50.58%, Unknown, Safari, Mobile Safari, Mobile Chrome, Other) as bar lists.

## 4. Polsts

### 4.1 List (`/polsts`, shots/02) & Grid (shots/03)
"Every A/B poll you've created. Click a title to view analytics." Controls: tabs **All polsts /
Active / Drafts**, list⇄grid toggle, search box (empty query state `shots/44` shows a blank
table), and a top-right indigo **Create polst** button.

- **List view** is a table: Title (A/B thumbnail + linked title → public poll page
  `staging.polst.app/p/<slug>`), Status (active/ended), Views, Votes, Engagement (heart/repost
  counts or —), Created date, and hover row-actions: **Analytics** (→ `/polsts/<slug>/analytics`),
  **Distribute**, **QR Code**. ~19 test polsts exist (e.g. "to be or not to be" 228 views/9 votes,
  "Prefer homemade or takeaway food for lunch?" 178 views).
- **Grid view** shows rich cards: side-by-side A/B images with corner A/B badges and a status
  chip, title, "optionA vs optionB", an indigo vote-split progress bar with % / % and vote count,
  views, and the same three action icons.

### 4.2 Drafts tab (shots/04–05)
Sub-tabs **Active / Archived**. Draft cards ("Ready to publish", edited date) link to the draft
editor. Archived shows retired drafts.

### 4.3 Draft editor (`/polsts/drafts/<id>`, shots/08)
Breadcrumb Polsts / Drafts / Edit, "Edit draft" H1 with "Ready to publish" chip. Form: Title
(29/128 counter), Category multi-select chips (e.g. Politics), Option A/B text fields, two image
uploaders ("Replace image — click or drag"), Tags (up to 10 × 40 chars), Schedule (start/end
datetime pickers), "Private polst" toggle, and **Save Draft** / **Publish** buttons. Navigating
away triggers a browser "unsaved changes" confirm.

### 4.4 Create polst (`/polsts/create`, shots/35–38)
Single-page form, "Publishing as New Brand names": Title (0/70), Option A/B (0/30 each), two
image dropzones ("Upload both Option A and Option B images"), **Categories** dropdown
(searchable multi-select, max 3 — options incl. Science, Sports, Technology, Travel, Food & Drink,
Lifestyle…; `shots/36`), Tags, **Polst lifetime** (3/7/10 days or Custom date), optional Schedule
start date, **Save Draft** + **Create Polst**. I created "Claude test polst — coffee or tea?"
with two uploaded images — it published instantly and appeared at the top of the list as
"coffee vs tea … active" (`shots/38`), public URL `staging.polst.app/p/claude-test-polst-coffee-or-tea-FK106n`.

### 4.5 Polst analytics (`/polsts/<slug>/analytics`, shots/39)
Compact page: **Lifetime** card (status chip + 3/7/10-day / custom-date controls to change when
voting stops), **Overview** (Total Votes / Option A / Option B counts), **Vote Velocity**
(votes/hr over last 1h / 6h / 24h). Notably lighter than campaign analytics.

### 4.6 Distribute modal (shots/06)
"Distribute to Channels — Share this Polst across social channels": five buttons — Facebook,
Reddit, LinkedIn, X / Twitter, Discord.

### 4.7 QR Code modal (shots/07)
Generates a QR for the polst URL with `?utm_source=qr&utm_medium=offline`. Options: QR color
picker (hex), Brand Logo Overlay toggle, PNG/SVG format toggle, **Download**.

## 5. Campaigns

### 5.1 List (`/campaigns`, shots/12)
"Bundles of polsts shared under one link. Track reach and completion." Search, status filter
pills **All / Draft / Active / Ended**, **Date range** picker, count ("21 campaigns"), and
**Create campaign**. Each row-card: name + status chip, created date, **Polsts / Started /
Completed** counts, and a Completion % with a colored progress bar (green at 100%, red at low
values), chevron → detail.

### 5.2 Campaign detail (`/campaigns/<uuid>`, shots/13)
Header: breadcrumb, campaign name + status dropdown (**Active ▾** → Unpublish "take offline
temporarily" / **End campaign** "can't be undone", `shots/17`; a Draft campaign instead shows
**Publish** — disabled until it has ≥1 polst, `shots/21`), action buttons **QR Code**
(`shots/18`, same QR generator for the campaign link), **Share / Embed** (`shots/14`), and
**Add polst ▾** (`shots/15`: "Create new polst — build from scratch" or "Select from your
library" → full-height right-hand drawer listing all existing polsts with checkboxes,
`shots/16`). Meta row: Ends date (popover with 3/7/10-day presets, custom date, "No end";
`shots/22`), voter count, "+N today", and the public campaign URL.

Four tabs:
- **Polsts (N)** — orderable list (drag handles, #1/#2/#3 ranks) of member polsts: A/B thumbs,
  title, "A vs B", votes + split (e.g. "6 votes · 50/50"), **Preview as voter** link, remove
  button; list/grid toggle. Empty state: "No polsts yet — Use the 'Add polst' button above".
- **Details** (`shots/24`) — Brand (read-only, "ownership cannot be changed"), editable Name
  with Save, End date control.
- **Analytics** (`shots/23`) — the richest analytics screen: 7D/30D/90D/All range + Export;
  insight banners (amber "Completion is 100%…", red "Biggest drop: Q3 → Completed — 83%
  (5 voters) leave here — the highest-leverage fix is this step"); **Conversion funnel**
  (Started → Q1 → Q2 → Q3 → Completed horizontal bars with per-step drop annotations and a
  'Biggest drop-off' tag); an indigo **Completion-rate** hero card + Started / Completed /
  Avg. time (14s) tiles; **Step-by-step drop-off** table (Reached / Dropped / Drop rate);
  **Per-question results** cards (votes, A/B split bars, "Option A leads by 14%" / "Tied",
  drop-off %); **Cross-tabulation** ("Q1 × Q3 — 6 shared · Strong").
- **Lifecycle** (`shots/25`, draft variant `shots/43`) — a Draft → Active → Ended state
  diagram ("Hidden from voters / Voters can submit / Read-only") plus action cards:
  "Take this campaign offline temporarily" (**Unpublish**) and "End this campaign"
  (**End campaign**, irreversible). Draft campaigns show "Ready to publish?" with a disabled
  **Publish campaign** until a polst is added.

### 5.3 Create campaign (`/campaigns/create`, shots/19)
Simple form: Campaign name (0/255), "How long should this run?" (3/7/10 days, Custom date,
No end), "What happens next" explainer, Cancel / **Create campaign** (disabled until named).
Right rail: "About campaigns" explainer with a "You can" checklist (reorder polsts, pull from
library, share via link/QR/embed, end manually) and a **Drafts** "pick up where you left off"
list with Open buttons. Creating one lands directly on the new campaign's detail page in Draft
state with an empty polst list (`shots/20`). (I created "Claude test campaign" as a draft.)

### 5.4 Share / Embed modal (shots/14)
Copy-paste **iframe embed** and **JavaScript embed** snippets (pre-filled with
`staging.polst.app/embed/campaign/<id>`, 100% width, min 320px, height 600, sandboxed), with
per-block Copy Code buttons and a CSP note.

## 6. Settings (`/settings/*`)

Five sub-pages via a horizontal pill nav: **Brand Profile · Members · Branding · Developer · Usage**.

- **Brand Profile** (`shots/26`): avatar upload (PNG/JPEG ≤5MB), Display name (≤50), Description
  (≤500), Location (US state dropdown) + City, **Save changes**.
- **Members** (`shots/27–28`): team table (Email / Role / Joined) — 8 test members, all
  "Manager". **Add member** modal: "Provision a brand-only account for a teammate… independent
  of any consumer account with the same email"; email, Role select (Manager/Owner), optional
  "Set initial password" (otherwise a one-time password is generated and shown once).
- **Branding** (`shots/29–30`) — the standout screen: a full **embed theming studio** with a
  **live preview** of a real polst card ("This is your live embed. Unsaved changes apply here
  instantly and are not written until you save") and Revert / Reset / Save. Sections: Accent
  color; Title (color, size px, weight, placement Above/Below/Hidden); Labels (color, size,
  placement Header/Overlaid/Below/Hidden, alignment Left/Centre); Surfaces & header (card body,
  body text, header fill colors); OR badge (background, text color, diameter — "the one
  constant"); Image ratio (1 = square, 1.78 = 16:9, 0.56 = portrait); Shape & spacing (radius
  None→Full, Compact density toggle, elevation Flat/Lifted); Typeface (System UI / Serif /
  Monospace / Brand custom font URL); Logo & favicon uploads (light/dark logo, favicon
  auto-resized to 32/180 + .ico); **Advanced** collapsible with a Custom CSS textarea.
- **Developer** (`shots/31–33, 45`): two tabs. **API keys** — usage guide (exchange key for an
  access token, then call the REST API; curl examples), **Create API key**, "Secrets are shown
  exactly once at creation"; currently empty. **Webhooks** — "Endpoints — 1/10 configured",
  endpoint cards showing URL, subscribed events (Viewed / Voted / Completed), "Ping: success",
  and actions Disable / Ping / **Logs** (inline delivery log: event, HTTP 200, latency ms,
  timestamp — `shots/45`) / Edit / Secret / Delete. **Add webhook** form: URL, event toggles
  (Polst Viewed, Polst Voted, Campaign Completed), optional description.
- **Usage** (`shots/34`): plan-usage stat cards — Polsts created 21, Campaigns created 22,
  Total views 989, Total votes 113 — plus a **Monthly history** table.

## 7. Misc screens & states

- **Workspace switcher menu** (`shots/40`): lists the brands the account can operate (one here).
- **Collapsed sidebar** (`shots/41`): icon-only rail; Expand button.
- **Catch-all 404** (`shots/42`): unknown dashboard routes render a public-style "Brand not
  found" page ("The brand you were looking for doesn't exist, or its URL has changed") with a
  "Go to Polst" link — unmatched paths are treated as brand slugs.
- **Unsaved-changes guard** on the draft editor (native beforeunload confirm).
- **Dead links (staging):** "Forgot password?" and "Request access" are `#` placeholders.
- **Console noise:** recurring 401s from `staging-api.polst.app/api/v1/auth/session-stream`
  (SSE session stream) even while logged in — appears benign but is a persistent error in the
  console on every page.

## 8. Test data created during the audit (left in place, staging-safe)

- Polst **"Claude test polst — coffee or tea?"** (active, 3-day lifetime, categories
  Food & Drink + Lifestyle, generated placeholder images).
- Campaign **"Claude test campaign"** (draft, empty, 3-day duration). No UI delete for
  campaigns/polsts was found (only Unpublish / End for campaigns), so they were left as-is.

## 9. Observations

1. Polst-level analytics is thin (votes + velocity only) compared to the excellent
   campaign-level analytics (funnel, drop-off, cross-tab); views/engagement shown in the list
   aren't broken down per-polst anywhere.
2. Funnel math shows odd artifacts with tiny data ("1 of 0 who started", "700%" step rates,
   "-7 (-700%)" drops) — division-by-zero style edge cases surfaced directly in UI copy.
3. The session-stream 401 loop suggests the realtime channel isn't authenticating with the
   dashboard session.
4. No delete affordance exists for polsts or campaigns (lifecycle is publish/unpublish/end
   only); drafts can be archived.
5. Members are all "Manager"; role management beyond Manager/Owner (and per-member removal)
   isn't exposed in the table.
