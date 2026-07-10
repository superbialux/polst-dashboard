# Polst Brand Dashboard Redesign Audit

**Scope:** Old staging dashboard, current redesign, and supplied reference screens  
**Evaluation stance:** Principal product design and design-systems audit  
**Core question:** Would the redesigned brand workspace, populated with real data, let a paying marketer reach and defend a decision with Shopify-grade confidence?

## Executive conclusion

No. The redesign changes the shell, introduces a planning layer, creates a global source library, and separates several previously compressed concerns. It does not yet complete the product transformation from “poll analytics” to “decision engine.”

The old interface fails because it treats metrics, Polsts, and sharing controls as the product. The redesign frequently changes their arrangement without consistently changing their meaning. The clearest examples are:

- Home replaces a chart wall with a greeting, a KPI strip, campaign rows, Polst rows, and action cards, but it still does not explain *why* performance changed or establish which evidence supports the proposed action.
- Navigation gives Campaigns, Polsts, Distribution, Analytics, and Audience equal top-level status. That is a portfolio of features, not a campaign-centered operating model.
- Individual Polsts receive the richest visual treatment in the product. Campaigns are mostly text rows. The visual hierarchy contradicts the stated object hierarchy.
- Distribution is promoted to a reusable system, but its taxonomy overlaps: a QR code is simultaneously a channel, a source, and a separately counted asset; an influencer is both a channel and a link type; website appears as both a channel and an embed.
- The redesigned analytics story is not evidenced by a complete current Analytics screen. The Home KPI strip uses deltas and sparklines without scope, denominators, comparison labels, refresh state, definitions, or confidence.
- The supplied current screens contain explicit mock language and internally implausible data scopes. Real data would remove the word “mock,” but it would not repair the missing data contract, evidence model, or decision semantics.
- The shell uses a viewport-locked inner scroller. At 1440 × 900, the “What’s next” section begins at the bottom edge of Home, so the screen’s claimed purpose is physically below the first view.

The redesign is therefore not one polish pass away. The shortest path is to define and build one canonical campaign decision experience, wire it to a trustworthy metric contract, make Home a compact portfolio triage surface, and demote standalone Polsts from co-equal product object to a clearly bounded exception.

**Overall score: 5.2/10.**

That score is not an average of visual attractiveness. It is weighted toward product truth, decision usefulness, and trust. The current surfaces would score higher as a static SaaS mockup and lower as a paid decision product.

---

## 1. Audit standard

### 1.1 Product truth taken from the context files

The context establishes five non-negotiable product facts:

1. Polst is a real-time decision engine, not a generic polling app, survey tool, social network, or analytics dashboard.
2. The atomic Polst is a binary visual decision object: one question, two visual choices, one-tap voting, results, and a continuation or sharing path.
3. The operating loop is **Intent → Polst → Vote → Decision → Memory**.
4. The brand side must be campaign-first. A campaign owns distribution, attribution, analytics, reporting, and optimization. Individual Polsts are lightweight building blocks, except for explicitly standalone single Polsts.
5. The interface must tell a marketer a story: **current status → what changed → why → what needs attention → recommended next action**.

The CEO’s critique adds a constraint that is easy to miss: the old product does not primarily lack metrics. It lacks organization, hierarchy, readability, workflow, and interpretation. Adding charts or adding modules is not a valid response unless the result reduces the marketer’s cognitive work.

### 1.2 Scoring rubric

Each product area is scored out of 10 using this weighting:

| Dimension | Weight | Test |
|---|---:|---|
| Product truth and object model | 25% | Does the screen reinforce Campaign → Polst → Source → Response → Decision → Memory? |
| Story and decision usefulness | 25% | Can a marketer understand status, change, cause, attention, and next action? |
| Information architecture and workflow | 20% | Are scope, ownership, navigation, and actions clear? |
| Trust and operational completeness | 20% | Are data, states, permissions, definitions, and failure modes credible? |
| Visual and interaction finish | 10% | Are density, typography, alignment, hierarchy, and interaction states controlled? |

This prevents a clean static frame from outranking a less decorative screen that supports a defensible decision.

### 1.3 Evidence limitation

The supplied assets do not form complete triplets for every product area. Team and Search have old/current/reference evidence. Calendar and Polsts have current/reference evidence, with only an indirect old-state comparison. Campaign Detail has only staging evidence. Distribution has only the redesign. Create Polst has only a consumer-side reference. Shopify Analytics is a reference without a matching redesigned Analytics screenshot.

Where a current screen is absent, this report does not infer that no design exists. It withholds credit because the requested behavior cannot be verified from the supplied evidence.

### 1.4 Screenshot inventory

| Figure | File | Role in audit |
|---:|---|---|
| 1 | `01-12-team-3-reference-shopify-users.png` | Team reference |
| 2 | `02-12-team-1-staging.png` | Old Team/Settings |
| 3 | `03-12-team-2-ours-1-.png` | Redesigned Team/Settings |
| 4 | `04-01-home-1-staging-1-.png` | Old Dashboard/Home |
| 5 | `05-09-analytics-3-reference-shopify-analytics-2-.png` | Analytics and shell reference |
| 6 | `06-10-distribution-2-ours-2-.png` | Redesigned Distribution |
| 7 | `07-13-search-1-staging.png` | Old inline Polsts search and no-results state |
| 8 | `08-02-home-calendar-3-reference-project-calendar.png` | Calendar reference |
| 9 | `09-02-home-calendar-2-ours.png` | Redesigned planning calendar |
| 10 | `10-13-search-2-ours-1-.png` | Redesigned global search |
| 11 | `11-13-search-3-reference-shopify-search-1-.png` | Search reference |
| 12 | `12-01-home-2-ours-2-.png` | Redesigned Home |
| 13 | `13-05-create-polst-3-reference-polst-consumer-composer-2-.jpeg` | Consumer composer reference |
| 14 | `14-03-polsts-list-3-reference-shopify-products-1-.png` | Dense object-library reference |
| 15 | `15-03-polsts-list-2-ours-2-.png` | Redesigned Polsts library |
| 16 | `16-07-campaign-detail-1-staging-1-.png` | Old Campaign Detail |

---

## 2. Set 01 — Home and portfolio health

**Evidence:** Figure 4 old staging, Figure 12 redesign, Figure 5 Shopify Analytics reference  
**Score: 5.8/10**  
**Type of fix:** Structural at the page level; incomplete at the decision-story level

### 2.1 What the old screen fails at

#### Story

The staging Dashboard opens with “What needs your attention,” but only one of its three lines is actually attention-worthy. “Votes are up 76%” and “Engagement is up 585%” are unqualified observations. The third item—one campaign has 92 views and 0.00% completion—is closer to an actionable exception. The module therefore mixes celebration, change detection, and risk without prioritizing them or explaining their consequences.

Below that, the screen becomes a long telemetry report: seven metric cards, Views & Votes, Avg Dwell Over Time, and additional charts below the captured area. The user is required to synthesize a story from unrelated surfaces. There is no visible chain from a changed metric to a cause, from cause to affected campaign, or from affected campaign to action.

#### Hierarchy

Every KPI card has nearly equal visual weight. Total views, total votes, engagement rate, completion rate, average dwell time, median scroll depth, and view-without-vote are treated as peers. They are not peers in a decision product. Response sufficiency and decision confidence should outrank scroll depth. Campaign risk should outrank a global percentage increase.

The “What needs your attention” card is visually large, but its contents are formatted as three similar rows. The dangerous condition receives no more space or stronger action affordance than the positive deltas.

#### Density

The issue is not merely that the page contains many numbers. It contains many numbers at the same interpretive level. The page uses large chart canvases for sparse, low-volume data. The first Views & Votes chart has long near-zero runs, yet it consumes most of the viewport width. The next chart continues below the fold. The result is vertically expensive and cognitively undifferentiated.

#### Object model

The old Dashboard collapses portfolio, campaign, and Polst analytics into one altitude. A top-level workspace screen reports campaign-specific problems and poll behavior without giving the user a campaign decision object to enter. This is the CEO’s “wrong altitude” problem in visible form.

#### Trust

Several values are immediately suspect without definitions:

- Engagement is shown as up 585% to 53.57%, but the baseline is omitted.
- Average dwell time is 428.7 seconds, an unusually high value that needs a median, distribution, or bot/outlier caveat.
- Completion rate and engagement rate are both shown without formulas.
- Sparklines have no axes, time labels, hover state, or comparison trace.
- “vs prev. 30D” does not tell the user whether both periods had comparable campaign volume and source mix.

The screen asks for confidence before earning it.

### 2.2 Does the redesign fix it?

#### What changes structurally

The redesigned Home removes the large chart wall from the first view. It introduces three portfolio layers:

1. a compact KPI strip;
2. active/queued Campaign and Polst summaries;
3. a “What’s next” action area.

This changes page architecture rather than only colors and borders. It also reduces the number of visible KPIs from seven to four and keeps deep trend charts out of Home.

#### Where the fix stops

The five-part story is still incomplete:

| Story step | Current evidence | Audit judgment |
|---|---|---|
| Current status | Four KPI values, active campaigns, active Polsts | Present but underspecified |
| What changed | Red/green percentage deltas and sparklines | Present without comparison context |
| Why | No causal, source, audience, or campaign explanation in the first view | Missing |
| What needs attention | “What’s next” begins below the fold; no ranked exception feed is visible | Weak |
| Recommended action | Action-card titles are visible at the bottom edge | Present too late and not visibly tied to evidence |

The result is a reorganized dashboard, not yet a decision narrative.

#### The greeting consumes the most valuable vertical space

At 1440 × 900, the content frame begins at y≈48. “Good afternoon, Max.” occupies the center of the first 100 pixels of content. The KPI strip starts around y≈205, campaign and Polst panels around y≈313, and “What’s next” around y≈792. Only the heading and the top of the action cards are visible before the viewport ends.

If Home’s purpose is to tell the user what to do next, the current geometry contradicts the purpose. A daily greeting should not displace the action queue.

#### The KPI strip still lacks a data contract

The redesigned metrics are visually more compact but semantically no stronger:

- “Total views 220 ↓62%” does not say versus which exact period.
- “Total votes 31 ↓47%” appears incompatible with other supplied screens showing hundreds of responses per Polst and per source unless scopes differ; the scope difference is not stated.
- “Engagement rate 14.09% ↑42%” and “Completion rate 40.00% ↑5.7%” lack formulas and denominators.
- Sparklines use the same purple line regardless of positive or negative movement and provide no baseline, ticks, tooltip, or comparison trace.
- The far-right chevron appears to expand the strip, but nothing labels what will be revealed.

The redesign reduces chart area while preserving interpretation debt.

#### Campaigns are not visually first-class

The Campaigns panel contains text rows with dates, a status pill, and ambiguous progress metadata such as “71% complete · 2 active · 2 started · 0 completed.” The adjacent Polsts panel contains thumbnails, question titles, option labels, vote splits, and status pills. The eye goes to Polsts because they carry image, contrast, and recognizable choices.

This is a direct contradiction: the information architecture says Campaigns are primary; the visual hierarchy says Polsts are primary.

#### “Complete” is undefined

Campaign completion can mean schedule elapsed, response target reached, number of constituent Polsts completed, distribution coverage achieved, or decision readiness. A percentage without a model is decorative precision. “71% complete” beside “0 completed” intensifies the ambiguity.

### 2.3 What the reference still does better

Shopify’s Analytics screen is not a product-model reference for Polst; copying its modular chart grid would recreate the CEO’s complaint. It is useful for operational cues and control hierarchy:

- The title sits beside “Last refreshed,” making data recency explicit.
- Date, comparison date, and currency controls are grouped before the metrics.
- Top actions are clearly separated from analytical filters.
- Zero-data states remain structurally honest rather than inventing activity.
- The metric strip starts immediately below the controls rather than after a greeting.
- Each analytical card has a stable title, value, comparison marker, and plot area.

Polst should borrow recency, scope, comparison, and empty-state discipline—not Shopify’s sales-dashboard object model.

### 2.4 Pixel-level and system observations

- The redesigned main surface uses a rounded, bordered container inside a gray app background, then repeats rounded bordered cards within it. Because the outer frame and inner modules use similar border strength and radius, depth levels flatten into “card inside card.”
- The 30D segmented control is visually detached from the KPI strip by alignment and spacing. A user can infer the relation, but the control does not read as the strip’s header.
- KPI labels use small muted text while deltas use saturated red/green. The change indicator can attract more attention than the value it qualifies.
- Campaign rows lack dividers. Four blocks separated only by vertical space become harder to scan when titles wrap or metadata grows.
- The Polst thumbnails are approximately 56 × 56 and contain a central OR disc; at that size, the underlying option imagery is barely identifiable. The visual payload is not worth the scanning cost unless the thumbnail opens a preview or carries a strong recognizable asset.
- Status pills appear on every row even when the panel itself is filtered to Active. Repeating “Active” adds noise without information.
- The inner scrollbar at the right edge of the content frame reveals viewport-locked scrolling. This makes the top bar and sidebar stable but creates a second application viewport and hides the amount of content below.

### 2.5 Required correction

Home should open with one compact row containing portfolio health, data recency, and scope; then a ranked “Needs attention” queue with evidence and action; then active campaign summaries. Polsts should appear only as subordinate evidence inside a campaign or in a clearly labeled standalone section. The greeting can be reduced to a small inline salutation or removed.

---

## 3. Set 02 — Planning calendar

**Evidence:** Figure 9 redesign, Figure 8 calendar reference; no old calendar screen exists  
**Score: 6.0/10**  
**Type of fix:** Structural addition; operational model remains shallow

### 3.1 What the old product fails at

The absence of an old calendar is itself evidence. Staging has no surface answering:

- What is active now?
- What launches next?
- Which business moments have no campaign coverage?
- Where do multiple Polsts overlap?
- Which deadline requires a decision before creative, packaging, media, or retail execution proceeds?

That absence forces marketers to maintain the actual campaign plan elsewhere. A dashboard that cannot represent future commitments becomes retrospective analytics, not an operating system.

### 3.2 Does the redesign fix it?

It creates a month view with three visible object types: Campaign, Single Polst, and Key date. It shows multi-day campaign bars, single-day or short Polsts, holidays, and business moments. This is a real structural addition.

It does not yet model the planning decisions implied by the calendar:

- Key dates are dots with text, not objects with owners, required decisions, readiness, or linked campaigns.
- “Product Launch Week” repeats as five separate orange entries instead of one spanning event. “Summer Fancy Food …” repeats across three cells and truncates in each. Repetition makes a range look like duplicate records.
- There is no visible uncovered-state treatment. A key date with no linked campaign should be the main exception, yet all key dates use the same orange styling.
- Campaign bars do not expose status, owner, completion, confidence, or deadline risk.
- There is no week/list view for dense periods, no filter by campaign/owner/status, and no search.
- No creation affordance appears in empty cells or in the page header.
- The selected day is a purple circle around 15, but no corresponding day detail panel is visible.
- The “Today” button and the selected day do not explain whether June 15 is today in the mock or simply selected.

The calendar shows the future; it does not yet help the user manage it.

### 3.3 What the reference still does better

The project-calendar reference handles dense time geometry more deliberately:

- Multi-day items span continuously across day columns.
- Overflow is explicit through “+15 more,” “+14 more,” and similar counts rather than silent clipping.
- Status and ownership appear within event bars through checkmarks, warning dots, and avatars.
- A people filter is placed in the calendar header.
- Color is tied to item state/type with enough contrast to distinguish overlapping work.
- The layout preserves a stable row rhythm even in dense weeks.

The reference also exposes a risk: its overflow counts imply very high density and can become a hidden backlog. Polst should not copy the density; it should copy the continuity, overflow, owner, and state semantics.

### 3.4 Pixel-level and system observations

- The Polst calendar fills almost the entire 1128 × 768 content card at 1440 × 900. This leaves no persistent space for selected-day detail, coverage warnings, or creation controls.
- Day cells are tall and empty in low-density weeks, while text truncates in denser cells. The layout spends height where no information exists and withholds width where information does.
- Campaign bars use a very light lavender fill with dark purple text; Single Polsts use light mint; Key dates use an orange dot. The first two are area encodings and the third is a point encoding, so their prominence is not comparable.
- The legend is right-aligned and remote from the month navigation. Its dots are small and use pale colors that will be less distinguishable on low-quality displays.
- Campaign bars have minimal vertical padding. Their text sits close to the top edge, making the bars look like labels laid over the grid rather than interactive objects.
- The container has rounded corners, but the calendar grid terminates into those curves. The outer card radius and internal cell grid create cramped corner geometry.
- Sunday-first ordering may be appropriate for a US brand; locale behavior is not evidenced. The global workspace should define week start and time zone.

### 3.5 Required correction

Make “coverage” the calendar’s decision layer. Every key date should show Covered, At risk, or Uncovered based on linked campaign readiness. Selecting a day or item should open a compact side panel with objective, owner, deadline, response target, current confidence, and next action. Multi-day key dates must be continuous bars, not repeated labels. Add week/list alternatives and an explicit “Create campaign for this date” action.

---

## 4. Set 03 — Polsts library and standalone object management

**Evidence:** Figure 15 redesign, Figure 14 Shopify Products reference, Figure 7 as old list-search/no-results evidence  
**Score: 5.6/10**  
**Type of fix:** Visually transformed; structurally conflicted

### 4.1 What the old screen fails at

The old Polsts screen uses tabs, a list/grid toggle, a right-aligned search field, and a large dashed empty state. When a search returns no results, almost the entire page becomes blank.

#### Story

“No polsts match your search” reports a condition but offers no recovery path. It does not suggest clearing the query, searching campaigns, checking archived items, or creating a new Polst with the searched phrase.

#### Hierarchy

The Create Polst button, tabs, view toggles, and search all compete in one header band. The no-results icon is a plus symbol, which implies creation rather than search failure and duplicates the create action.

#### Density

The empty state occupies roughly 190 vertical pixels but contains one icon and one sentence. The remainder of the 1281-pixel screenshot is unused. Empty space does not become clarity when the user has no next step.

#### Object model

The page describes every A/B poll the user has created and says “Click a title to view analytics,” reinforcing Polst-first analytics. It does not distinguish campaign-owned Polsts from truly standalone Polsts.

### 4.2 Does the redesign fix it?

The redesign makes the page explicitly create a “single Polst,” adds status filters, keeps grid/list controls, and uses realistic option imagery and result states. Those changes clarify that this library can represent standalone objects.

The screen still grants standalone Polsts top-level navigation, a full three-column visual library, and more visual weight than Campaigns. This is not a minor styling problem. The visual model says a Polst is a premium content object; the product model says it is usually a campaign building block.

#### Grid-first is the wrong operational default

At 1440 × 900, only the first row and part of the second row are visible. Each card is roughly 365 pixels wide and nearly 395 pixels tall. Large images dominate. A marketer comparing status, owner, response sufficiency, source mix, campaign association, or deadline cannot do so across more than three objects at once.

The grid works as a visual proof of the atomic Polst. It does not work as the default admin inventory once a workspace has dozens or hundreds of objects.

#### The current card mixes preview and analytics

Active and completed cards overlay percentages and counts on the option images. Scheduled and draft cards use the same visual footprint without result overlays. This creates several problems:

- Results are read before the question and sample context.
- Counts beside percentages are not labeled as votes, respondents, or weighted responses.
- Confidence, representativeness, and source quality are absent.
- A 57/43 split can appear decisive even if the sample is too small or biased.
- Completed and active states differ mainly by a small pill; their available actions differ in the footer, but the decision state does not.

#### Campaign association is missing

No card shows whether it belongs to a campaign. If this page is strictly standalone, the page should say so in its title or subtitle and prevent campaign-owned Polsts from appearing. If it includes both, the missing relationship invalidates the campaign-first model.

#### Administrative controls are missing

There is no visible bulk selection, sort, owner, last edited, created date, campaign, source, response target, decision status, duplicate, archive, or permission behavior. The list-view toggle may expose some of this, but the supplied evidence does not show it.

### 4.3 What the reference still does better

Shopify Products is useful because products are visually identifiable objects that still default to an administrative table. It supports:

- bulk selection;
- search and filter in the table header;
- stable columns;
- status scanning;
- thumbnail recognition without image dominance;
- import/export and more actions;
- row density appropriate to recurring operational work.

Polst should not copy Shopify’s product columns. It should copy its principle: the object’s visual identity is a thumbnail, while operational attributes control the row.

### 4.4 Pixel-level and system observations

- Three equal columns create consistent geometry, but titles with different line counts shift option headers and image starts. “Which packaging color feels more premium?” wraps while adjacent titles do not, reducing horizontal scan alignment.
- Option labels truncate aggressively (“Fuel your morni…”, “Mornings, hand…”), even though the card spends most of its area on images. The layout protects imagery at the expense of the choice text that defines the decision.
- The central OR disc overlaps both image panels and result chips. At small sizes, three layered white/purple shapes compete at the visual center.
- The selected-option header uses a filled purple surface; active status uses mint; scheduled uses lavender; draft uses gray; key dates elsewhere use orange. The system has several pale semantic surfaces with similar perceived strength.
- Footer actions use text plus arrows. Their hit areas appear much smaller than the 44-pixel target expected for reliable touch or trackpad use.
- Grid/list buttons are icon-only and do not visibly expose tooltips, selected-state labels, or keyboard state.
- The search field says “Search standalone Polsts,” while the page title says only “Polsts.” The scope clarification is placed in a control instead of the information architecture.

### 4.5 Required correction

Default to a dense table with a 48–56 pixel paired-image thumbnail. Columns should include Status, Campaign/Standalone, Decision state, Responses versus target, Confidence, Leading option, Sources, Owner, Deadline, and Last activity. Keep the card grid as Preview view. Rename the area “Standalone Polsts” if that is truly its scope. Campaign-owned Polsts should be managed inside Campaign Detail.

---

## 5. Set 04 — Global search

**Evidence:** Figure 7 old search, Figure 10 redesign, Figure 11 Shopify search reference  
**Score: 6.2/10**  
**Type of fix:** Structural; interaction semantics are incomplete

### 5.1 What the old screen fails at

Search is local to the Polsts page. It can only filter one object type, and the no-results state consumes a large content region. The query “zzzznotfound” remains in the field, but recovery is limited to a small clear icon. The screen does not search campaigns, sources, or other workspace objects, so it mirrors the old Polst-first model.

### 5.2 Does the redesign fix it?

The redesign introduces a command-bar-like global search in the top shell and a modal overlay with All, Campaigns, Polsts, and Sources filters. Results include an icon, title, descriptive question, and type label. This changes both scope and navigation behavior.

Several semantics remain unclear:

- The input is empty, but eight Campaign results are shown. They might be recent items, suggested items, or default results. The modal does not label them.
- Every visible result is a Campaign despite the All filter being active. This makes the cross-object promise unproven.
- There is no visible selected row, keyboard focus, arrow-key guidance, Enter action, result highlighting, or shortcut hint inside the modal.
- Matching text is not highlighted.
- No campaign status, owner, date, or workspace context appears, which will matter when titles repeat.
- No “view all results,” advanced filter, or zero-results recovery is shown.
- The type label is right-aligned but visually weak; result rows can be misread as one undifferentiated list.

The redesign solves discoverability and scope at the shell level. It does not yet prove a robust retrieval model.

### 5.3 What the reference still does better

Shopify’s reference modal is much shorter and begins near the top of the viewport. Before a query, it shows an explicit empty prompt: “Find anything in Grainify.” Category chips are adjacent to the input. The interface does not pretend that unlabelled default records are search results.

The reference also gives the search input the clearest focus outline in the modal, while secondary content remains visually quiet. Its height can expand when results exist; the initial state does not reserve a large blank results list.

### 5.4 Pixel-level and system observations

- The redesign modal is approximately 576 pixels wide and 600 pixels tall, centered around the middle of a 1440 × 900 viewport. For a global command surface, this creates a long eye movement from the fixed top search field to the modal center.
- The close control is a roughly 48-pixel outlined circle that protrudes into the top-right corner. It becomes the most saturated and geometrically distinctive element, competing with the input.
- The modal top contains a large blank band above the input because the close control occupies its own vertical space. That space provides no title, recency label, or instruction.
- Background blur plus a dark overlay reduces context recognition. Dimming is necessary; blur should be tested because it removes the spatial cue of where a result will open.
- Result icons are identical campaign glyphs in identical gray tiles. Repeated decoration consumes horizontal space without helping distinguish records.
- The result subtitle and type label use small muted text. On lower-contrast displays, the title becomes the only reliably readable datum.
- The top-shell placeholder and modal placeholder both say “Search campaigns, Polsts, and sources,” but the capitalization of Polsts inside a sentence reads like a brand rule that needs explicit content guidance.

### 5.5 Required correction

Use a top-anchored command palette. Label empty-input content as Recent, Pinned, or Suggested. Add keyboard navigation, highlighted matches, result-group headings, status/date context, and a clear zero-results state. The All view should visibly include more than one object type. Keep the close control subordinate to the search field.

---

## 6. Set 05 — Team and workspace settings

**Evidence:** Figure 2 old staging, Figure 3 redesign, Figure 1 Shopify Users reference  
**Score: 5.3/10**  
**Type of fix:** Partly structural; undermined by settings sprawl and explicit placeholders

### 6.1 What the old screen fails at

#### Story and hierarchy

The old Settings page presents Brand Profile, Members, Branding, Developer, and Usage as equal tabs. A marketer sees team management beside developer plumbing, exactly the exposure the CEO rejected.

The Members table contains raw email addresses, the same “Manager” pill for every person, and Joined dates. There is no name, avatar, activity, invitation state, permission explanation, or action column. It answers “which emails exist” but not “who can do what” or “does anyone need attention.”

The Add member button floats above the table at the far right rather than belonging to a table header. The relationship between action and object is visually weak.

#### Density

The table itself is not too dense; it is too low-information. Eight rows repeat the same role and almost the same join date. The surrounding page has a large amount of unused space. This is an example of why reducing density alone does not create usefulness.

#### Object model

Brand, members, developer, and usage are compressed into one flat Settings object. The absence of a permissions model means “Manager” becomes a catch-all rather than a durable role.

### 6.2 Does the redesign fix it?

The redesigned Team section adds display names, initials, email, access role, job/persona badge, last-active state, row actions, pending invitations, resend/revoke actions, and an Invite user button. These changes add operational meaning.

The redesign also exposes new problems:

#### Access role and organization title are conflated

Rows show Owner + Founder, Editor + Marketing Director, and Viewer + Analyst. The first label appears to be permission; the second appears to be job function. They use similar pill/inline treatments and no column labels distinguish access role from title. The user must infer the difference.

#### “Manage” is too generic

Every member, including the Owner, has a Manage button. Owner transfer, role change, suspension, removal, and profile editing are materially different actions with different risk. A sole owner should not be casually editable through the same control used for a viewer.

#### Team, developer platform, and billing share one scroll

Below Team and Pending invitations, the page shows a locked “Developer platform — Pro” panel and a Billing card containing the phrase “Mock billing state” and text explaining that no payment logic is connected. This is damaging in three ways:

1. It breaks the page’s focus.
2. It puts APIs, webhooks, and BI connectors back in the marketer’s face, even if locked.
3. It explicitly announces that the product is a mockup.

The CEO asked for technical plumbing behind tier and role boundaries. A locked advertisement can exist, but not as a peer to daily team management and not with implementation notes visible to customers.

#### Missing trust controls

There is still no evidence of:

- role definitions;
- permission preview;
- two-factor or SSO status;
- last sign-in device/location;
- invitation expiry;
- audit log;
- deactivation versus deletion;
- seat limits or billing impact;
- bulk actions;
- search/filter for a larger team;
- external collaborator status.

### 6.3 What the reference still does better

Shopify separates Users, Roles, and Security in navigation. Its Users screen adds:

- All, Active, Pending, POS app-only, and Requests filters;
- bulk-selection checkboxes;
- explicit Status and Role columns;
- search/filter and sort controls;
- import/export actions;
- an Add users primary action;
- roles that can contain multiple permission bundles without mixing in job titles.

The reference is also more honest about scale. It uses a compact table even with three users because the interaction model must survive thirty or three hundred.

### 6.4 Pixel-level and system observations

- The redesign’s Team rows are approximately 60 pixels tall. This supports two-line identity content but becomes expensive at larger team sizes.
- Initial avatars are black circles with white letters. The workspace avatar in the top bar is purple. The system does not establish whether black means person, placeholder, or neutral identity.
- “Founder,” “Marketing Director,” and “Analyst” use pale gray pills similar to status pills elsewhere. The same shape language represents titles, plan labels, statuses, and filters.
- Team and Pending invitations are separate bordered cards with approximately 24 pixels between them. This is adequate separation, but the cards’ identical radius/border treatment does not show that invitations are a subordinate state of the same member lifecycle.
- Resend and Revoke sit side by side with similar outline weight. Revoke is orange text, but destructive confirmation and disabled/loading behavior are not shown.
- Developer platform uses a dashed border and a lock tile, while Billing uses a normal card containing an inset gray callout. Two “not real/available” states use unrelated visual grammar.
- The screenshot begins mid-page with a cropped visual module above Team. Settings scope and page title are not visible, reducing orientation.

### 6.5 Required correction

Create separate Workspace, Team, Roles & security, Billing, and Developer settings destinations. Hide Developer from non-admin/non-Pro users except for a small plan-discovery link. Replace job-title pills with a labeled Title field or remove them from the access table. Add explicit user lifecycle states and risky-action flows. Remove all implementation-note copy from customer-facing screens.

---

## 7. Set 06 — Distribution and source attribution

**Evidence:** Figure 6 redesign; old-state behavior is described in the CEO critique; no like-for-like reference supplied  
**Score: 4.9/10**  
**Type of fix:** Correct system boundary; unresolved taxonomy and workflow

### 7.1 What the old product fails at

In staging, distribution is a one-off action attached to a Polst: generate a share link or QR code and use it. There is no organization-level library, reusable channel definition, multiple QR assets, cross-campaign source view, or durable attribution model. This forces marketers to recreate distribution for each object and prevents comparison over time.

The old model also makes distribution subordinate to the Polst rather than owned by a campaign and reusable across the workspace.

### 7.2 Does the redesign fix it?

The redesign creates an organization-level Distribution area with summary counts, asset-type tabs, a source-performance table, source assignment, and source creation. That changes the system boundary in the requested direction.

The underlying taxonomy is not coherent enough to support real attribution.

#### The summary counts overlap

The cards report:

- Channels: Website, Email, Instagram, QR, Influencer;
- QR codes: each with its own attribution;
- Links & embeds;
- Influencer links.

QR and Influencer are counted as channels and as separate asset families. Website can be a channel and a website embed. Instagram can be a channel implemented through a link. The cards are therefore not mutually exclusive inventory categories. A user cannot add the numbers or understand whether “5 Channels” means five types, five configured destinations, or five active sources.

#### Source, channel, asset, and assignment are blurred

The table uses Source, Channel, Linked object, Responses, Completion, Status, and Last activity. The page actions say Assign sources and Create source. The tabs say Sources, Channels, QR codes, Links & embeds, and Influencers.

A durable model needs explicit definitions:

- **Channel:** Email, web, Instagram, packaging, event, creator.
- **Source:** a named attributable origin, such as June newsletter or Booth QR.
- **Asset:** a generated URL, QR code, embed, or integration instance.
- **Destination:** the campaign or standalone Polst receiving traffic.
- **Assignment:** the relationship between source/asset and destination for a time window.

The current UI uses these terms as partially interchangeable.

#### Linked-object scope violates campaign-first ambiguity

Most rows link to names that appear to be campaigns, while “Which headline wins?” appears to be an individual Polst. Nothing identifies campaign versus standalone Polst. If a source assigned to a campaign automatically routes through its active Polst sequence, that inheritance must be explicit. If sources can attach directly to campaign-owned Polsts, the campaign ceases to own distribution.

#### The page reports inventory, not decisions

The four large cards state how many configured things exist. None answers:

- Which source is underperforming?
- Which campaign lacks distribution?
- Which source is driving biased or low-quality responses?
- Which QR code is inactive or points to an ended campaign?
- Which source should receive more spend or placement?

Completion percentages are shown without target or definition. An unassigned source is gray, not treated as a ranked setup issue.

#### It will not scale

Six rows fit comfortably, but there is no visible search, filter, sort, owner, bulk action, archived state, destination status, or date-range control. A source library becomes operationally valuable only when it survives hundreds of assets.

### 7.3 What a reference-level structure should do better

Because no direct reference was supplied, the correct comparison is to the product model rather than another brand’s pixels. A reference-level version would:

1. show coverage gaps and source health before inventory counts;
2. distinguish channel, source, asset, destination, and assignment;
3. make organization-level definitions reusable;
4. show campaign inheritance and standalone exceptions;
5. connect response quantity to response quality and decision confidence;
6. support expiration, redirects, ownership, and audit history;
7. let the user move from an underperforming source to the affected campaign and recommended action.

### 7.4 Pixel-level and system observations

- Four equal summary cards consume roughly 145 vertical pixels for four small counts. Their subtitles wrap inconsistently and create uneven visual density.
- “Channels 5” lists five comma-separated values over two lines; the other cards contain a short sentence. The cards use the same template for different content types.
- The tab strip occupies less than half the content width and leaves a large empty horizontal field. Search/filter controls could use this space.
- Table headers are muted and compact. Numeric columns are right-aligned, but Completion is visually close to Status, making percentage-to-pill scanning cramped.
- Assigned status uses mint; Unassigned uses gray. Unassigned is a setup failure or dormant state, not a neutral fact. Its severity depends on whether the source is expected to be live.
- Last activity mixes relative time (“2h ago,” “1d ago”) with calendar dates (“Feb 3,” “Feb 2,” “Feb 1”). This prevents reliable sorting by eye and hides the year/time zone.
- “Assign sources” and “Create source” are adjacent, but it is not obvious which is the primary workflow. Creating a source may naturally end with assignment; splitting them at the page level risks duplicate paths.

### 7.5 Required correction

Replace the summary inventory cards with Coverage, At-risk sources, Responses versus target, and Unattributed traffic. Define the channel/source/asset/destination model in both data and copy. Add an assignment flow that starts from a campaign and inherits to its Polsts. Mark direct-to-Polst assignments as Standalone. Add filters, expiry, owner, health, response quality, and destination state.

---

## 8. Set 07 — Campaign Detail

**Evidence:** Figure 16 old staging only  
**Score: 2.6/10, provisional because no redesigned Campaign Detail was supplied**  
**Type of fix evidenced:** None

### 8.1 What the old screen fails at

Campaign Detail is the most important screen in the product model and the thinnest object in the supplied staging evidence.

#### Story

The page shows “Summer test,” Active, an end date, 16 voters, +16 today, and three Polsts. It does not state:

- the business intent;
- the decision that must be made;
- the current answer;
- whether evidence is sufficient;
- what changed;
- why it changed;
- what requires attention;
- the recommended next action;
- who owns the decision;
- when the decision, not merely the campaign, is due.

The page therefore has activity without meaning.

#### Hierarchy

QR Code, Share / Embed, and Add polst are the most prominent controls. Distribution plumbing and content creation outrank campaign status and decision readiness. The raw staging URL is displayed in the same header band as core campaign metadata.

The Polsts tab is selected and its count is shown twice. Three large rows then repeat order number, title, choices, bar, votes, and split. The campaign itself has no summary card or decision header.

#### Density

The page is not visually dense. It is semantically sparse. Most of the viewport is blank, but the essential campaign dimensions are absent. “More pages with less information” does not mean “remove the information required to understand the object.”

#### Object model

Campaign is a grouping wrapper around three Polsts. Tabs named Details, Analytics, and Lifecycle imply deeper modules, but the visible overview does not own distribution, attribution, reporting, optimization, or decision output.

The add action reinforces the wrapper model: the campaign’s primary job appears to be collecting Polsts.

#### Trust

- Sixteen voters are divided into rows showing 6, 5, and 5 votes, but 50/50, 40/60, and 20/80 percentages are presented without small-sample caution.
- A single purple progress bar appears to encode one option’s share, but no legend identifies which option it represents.
- “+16 today” is shown as positive activity, not evaluated against target or source quality.
- “Ends Jul 12, 2026” lacks time zone and decision deadline.
- The raw URL exposes a staging UUID and implementation detail.
- Drag handles imply sequencing, but the consequence of order is not explained.

### 8.2 What the redesigned screen must prove

No current Campaign Detail screenshot is supplied, so claims that the redesign is campaign-first cannot be verified where they matter most. A credible current screen must show, above the fold:

1. business question and decision owner;
2. status and decision deadline;
3. response progress versus target;
4. current result: conclusive, directional, or inconclusive;
5. confidence and sample-quality caveats;
6. what changed and likely drivers;
7. the highest-priority issue;
8. one recommended next action;
9. linked sources and audience scope;
10. constituent Polsts as subordinate steps or evidence.

Tabs can then separate Overview, Polsts, Distribution, Insights, Report, and Settings. The Overview must still tell the complete story; it cannot force users to assemble it across six tabs.

### 8.3 Required correction

Build this screen before adding more secondary pages. It is the representative experience from which Home, Analytics, Distribution, reports, and component tokens should be derived. Until it is evidenced, “campaign-first” is an information-architecture claim, not a product reality.

---

## 9. Set 08 — Create Polst and the shared product face

**Evidence:** Figure 13 consumer composer reference only  
**Score: 3.4/10, provisional because no brand-dashboard creation screen was supplied**  
**Type of fix evidenced:** None on the brand side

### 9.1 What the reference establishes

The consumer composer establishes the recognizable atomic object:

- question at the top;
- two visual choices;
- central OR disc;
- category;
- options;
- a single Post action;
- a preview-like composition matching the consumer card.

This matters because the same Polst component must render in the consumer experience and brand dashboard. A separate dashboard-only representation would break “you see what your audience sees.”

### 9.2 Why the reference is insufficient for the brand workflow

The screenshot is a consumer creation modal, not a campaign decision workflow. It lacks:

- campaign or standalone scope;
- business intent;
- decision owner and deadline;
- response target;
- audience and geography;
- distribution selection;
- scheduling;
- moderation/compliance state;
- preview by placement;
- save draft and autosave;
- validation and upload failure;
- choice-label length guidance;
- post-launch immutability rules;
- success state and next step.

A marketer creating a campaign Polst should not be forced through every campaign field inside this compact modal. The correct pattern is a campaign workflow with the shared Polst composer embedded as one step.

### 9.3 Pixel-level observations in the reference

- The modal contains an inner scrollbar, indicating content exceeds its visible frame. The close button, modal frame, and inner scroll create three nested containment cues.
- “New Poll” conflicts with the branded term Polst.
- The central OR disc partially overlaps both image panels as intended, but the right empty image state and left filled image produce a strong visual imbalance.
- Choice title and image upload occupy the same card, but error, crop, alt text, and replacement states are absent.
- “Select Category” is visually prominent despite category being secondary to question validity and choice quality.
- The Post button is disabled gray, but the reason is not stated. The missing second image is inferable; an accessible validation message is still required.
- The background consumer screen remains visible through a strong blur/white veil. This creates product context but may reduce performance and focus clarity.

### 9.4 Required correction

Use one canonical `PolstCard` and one canonical `PolstComposer` across both sides. Wrap it in a brand flow that begins with campaign intent and ends with schedule/distribution. For a standalone Polst, use a shorter path but preserve response target, audience, deadline, preview, and post-launch rules.

---

## 10. Set 09 — Analytics and reporting

**Evidence:** Figure 5 Shopify reference, Figure 4 old dashboard as the known failure state; no redesigned Analytics screen supplied  
**Score: 3.8/10, provisional**  
**Type of fix evidenced:** Home removes some analytics; redesigned analytical depth is unverified

### 10.1 What the old analytical model fails at

The old model prioritizes counts, rates, and time series, then asks the marketer to interpret them. It does not distinguish:

- collection health;
- sample quality;
- source performance;
- audience representativeness;
- decision confidence;
- business outcome;
- recommendation.

Charts are treated as answers. In a decision engine, charts are evidence for an answer.

### 10.2 What the redesign proves and does not prove

The redesigned Home proves that global charts can be removed from the first view. The self-critique states that deeper chart components have real scales, axes, ticks, and hover values but remain div-based and lack mature tooltips, crosshairs, comparison periods, and export. No supplied screenshot verifies the redesigned Analytics overview, Insights, or Reports surfaces.

The evidence therefore does not support a Shopify-grade analytics claim. It supports only a reallocation of analytics away from Home.

### 10.3 What to borrow from Shopify—and what not to borrow

Borrow:

- explicit last-refreshed state;
- exact date and comparison controls;
- stable card anatomy;
- honest no-data states;
- filter scope that persists across modules;
- clear top actions;
- consistent plot padding, axes, and legends.

Do not borrow:

- a generic grid of independent metrics as the primary narrative;
- equal visual weight for all available measures;
- sales-domain breakdowns translated literally into poll-domain breakdowns;
- exploration features before the default decision story works.

### 10.4 The required analytical hierarchy

Campaign analytics should be ordered as:

1. **Decision status:** Conclusive / Directional / Inconclusive / Compromised.
2. **Evidence sufficiency:** responses versus target, confidence/uncertainty, audience fit, source concentration.
3. **Result:** leading option and interval, not only a percentage split.
4. **Change:** movement since the prior checkpoint or comparison period.
5. **Drivers:** source, audience, geography, time, placement, or creative differences that plausibly explain the change.
6. **Attention:** anomalies, bias, stalled sources, or uncovered segments.
7. **Action:** continue collecting, stop, rebalance distribution, rerun, choose an option, or declare inconclusive.
8. **Memory:** record the final decision, rationale, owner, date, and resulting business action.

Charts should sit under these questions. They should not define the page architecture.

### 10.5 Required correction

Design the default Campaign Insights page around a written decision brief with expandable evidence. Build SVG/canvas charts only for questions the brief cannot answer alone. Every chart needs scope, metric definition, denominator, comparison, tooltip, empty/loading/error state, export behavior, and a plain-language “so what.”

---

## 11. Whole-product assessment

### 11.1 Does the redesign tell the required story?

Not end to end.

| Required stage | Where it appears | What is missing |
|---|---|---|
| Current status | Home KPI strip, active campaign list, statuses | Data scope, recency, target, decision readiness |
| What changed | KPI deltas and sparklines | Exact comparison, magnitude context, affected object |
| Why | Not visible in supplied current screens | Source/audience/campaign drivers and causal caveats |
| What needs attention | Action cards begin below fold; Distribution shows Unassigned | Ranked severity, evidence, owner, due date |
| Recommended next action | “What’s next” titles | Direct connection to evidence, expected effect, completion state |
| Decision | Polst result splits | Confidence, sufficiency, explicit call, inconclusive state |
| Memory | Not evidenced | Recorded decision, rationale, outcome, later comparison |

The redesign covers status and activity. It gestures toward action. It does not yet cover explanation, decision quality, or memory.

### 11.2 Is Campaign truly the first-class object?

No.

#### Navigation test

Campaigns is one of six equal top-level items: Home, Campaigns, Polsts, Distribution, Analytics, and Audience. A first-class object normally owns or contextualizes several of these concerns. Here, Distribution and Analytics can be entered globally without a campaign context, and Polsts has an equally prominent independent library.

#### Home test

Campaigns and Polsts receive equal-width adjacent panels. Polsts include imagery and binary outcomes; campaigns are plain text. Visual priority goes to Polsts.

#### Creation test

A global plus icon exists, and the Polsts page has “Create single Polst.” The supplied evidence does not show a stronger campaign creation path or intent-first flow.

#### Distribution test

The source table’s Linked object can apparently be a campaign or a Polst. The difference and inheritance model are not labeled.

#### Analytics test

Home still presents portfolio KPIs, while redesigned Campaign Insights is not evidenced. Deep decision analytics cannot be verified as campaign-owned.

#### Library test

The Polsts grid is the most visually developed operational surface in the redesign. A product is perceived through what receives design depth, not only through its navigation labels.

To make Campaign first-class, Polsts, distribution assignments, analytics, reports, actions, and final decision memory must visibly belong to a campaign by default. Standalone Polsts and global source definitions must be explicit exceptions.

### 11.3 What would break a daily marketer’s trust first?

#### 1. Scope and arithmetic ambiguity

Home reports 31 total votes for 30D while other supplied screens show hundreds of responses for individual Polsts and sources. This may be explainable through date or object scope, but the UI does not state the explanation. “71% complete” beside “0 completed” creates a similar contradiction. Users will stop trusting every number after the first unexplained inconsistency.

#### 2. Percentages without sufficiency

57/43, 61/39, and 20/80 look decisive. Without sample size, confidence, source concentration, audience fit, and fraud/quality checks at the point of interpretation, the interface encourages overclaiming.

#### 3. Explicit mock and placeholder language

“Mock billing state” and implementation notes instantly collapse the fiction of a working paid product. Generic stock food imagery produces a slower version of the same effect.

#### 4. Actions that do not complete

The self-critique states that create flows compose but do not save and that several secondary modules are shallow or gated placeholders. The first failed save, dead button, or room-without-function will outweigh the visual system.

#### 5. Inconsistent object ownership

When a source can be linked to either “Packaging Direction Test” or “Which headline wins?” without type labels, users cannot predict where analytics, settings, and attribution live.

#### 6. Hidden next actions

Home’s action layer begins below the fold. A user who visits daily sees greeting, KPI deltas, and lists before seeing the work the product expects them to do.

#### 7. Missing recency and refresh behavior

“Now,” “2h ago,” and chart deltas appear throughout the workspace, but there is no global refresh state, ingestion delay, time zone, or stale-data warning.

#### 8. Permission uncertainty

Editor, Viewer, Founder, Marketing Director, and Analyst appear without a visible role model. Users cannot know whether “Manage” changes access, title, or membership.

### 11.4 Global shell and design-system audit

#### App frame

The redesign uses a 48-pixel top bar, 240-pixel left sidebar, and a rounded content viewport with its own vertical scrollbar. This gives every page a stable frame but creates nested scrolling and turns the content area into a large card. Shopify’s references use the page itself as the scrolling surface, reducing the “app inside app” effect.

The fixed global search is approximately 576 pixels wide. It dominates the top bar while the page title lives inside the content frame. On pages where search is not the user’s primary action, this allocation is excessive.

#### Navigation

Active sidebar items use white rounded rectangles on a light-gray rail. The difference between active and inactive depends on fill more than text/icon color. Settings is pinned to the bottom. There is no visible collapsed state in the current redesign despite the old interface exposing Collapse.

The icon family is broadly outline-based, but visual mass varies: Distribution’s network icon is heavier than Home or Campaigns. At 16–18 pixels, inconsistent node counts make some items appear more important.

#### Surfaces and radius

The system repeats pale gray page backgrounds, white cards, 1-pixel borders, and approximately 12–14 pixel radii. The same treatment appears on page frames, data panels, calendars, cards, metric strips, modals, and callouts. Because radius and border strength do not encode hierarchy, the interface becomes a sequence of similarly packaged rectangles.

Shopify’s references also use rounded cards, but vary containment: tables can be one surface with internal rows; controls sit in toolbars; some content is uncarded. Polst frequently cards the page and then cards every child.

#### Typography

Page titles are around 24 pixels, panel titles around 16, body around 14, and metadata around 12. The scale is workable, but too much operational meaning is pushed into 12-pixel muted text: dates, option labels, result context, type labels, and secondary roles. On a decision screen, evidence qualifiers cannot be tertiary decoration.

Several labels rely on title case or branded capitalization inconsistently: “Create single Polst,” “Search standalone Polsts,” “Links & embeds,” “QR codes,” “Influencer links,” and “Developer platform.” A content system should specify singular/plural branded usage and whether object types are capitalized mid-sentence.

#### Color semantics

Purple represents selected choices, brand accent, calendar selection, scheduled status, and some chart lines. Mint/teal represents Active, single Polsts in the calendar, and positive movement in some places. Orange represents negative/destructive text, notification dots, and key dates. Red represents negative KPI movement. Gray represents inactive, draft, unassigned, and unavailable.

These colors are individually understandable but not governed by one visible semantic map. Status, object type, severity, and brand emphasis should not reuse the same hue without a second cue.

#### Pills and segmented controls

The same rounded-pale shape appears as status, job title, plan badge, tab, and filter. Users must read every label because shape does not communicate component class. Standardize:

- status badge;
- object-type badge;
- metadata tag;
- segmented control;
- plan/lock badge.

Each needs distinct interaction and accessibility behavior.

#### Buttons

Primary buttons are near-black; secondary buttons are white outlines; destructive actions sometimes use orange text inside a neutral outline. Icon-only controls appear in the shell and view toggles. The system needs explicit variants for primary, secondary, tertiary, destructive, danger-confirm, icon, split, loading, and disabled states.

“Manage” is overused as a generic action. Object-specific verbs reduce uncertainty: Change access, Transfer ownership, Edit source, Assign, View decision, Resolve, or Archive.

#### Tables

Team and Distribution tables use different row anatomies, header weights, status placement, and action patterns. A design system should define density modes, sortable headers, selection, sticky headers, row navigation, overflow actions, inline edits, empty states, and responsive collapse.

#### Images

Stock food photography gives visual realism but not workspace realism. Crops vary in focal subject and scale. In Polst cards, paired images need controlled crop, brightness, and subject balance so option A does not win attention due to photography rather than preference. The product should either preserve the exact brand-uploaded asset or label preview imagery as demo content outside customer-facing builds.

#### Scroll and overflow

Home, Team, Calendar, and Polsts all use the inner content scroller. The calendar and grid are desktop-width compositions. No responsive or narrow-laptop behavior is evidenced. At 1280 pixels, the three-column Polst grid, fixed sidebar, and 576-pixel search will become constrained. At tablet width, the object model requires a different navigation pattern, not only smaller gaps.

### 11.5 State-completeness audit

The current evidence does not demonstrate a complete state model for any major workflow.

| State | Home | Campaign | Polsts | Distribution | Team/Search |
|---|---|---|---|---|---|
| Loading | Not shown | Not shown | Not shown | Not shown | Not shown |
| Empty/first run | Not shown | Not shown | Old search only | Not shown | Shopify reference only |
| Error | Not shown | Not shown | Not shown | Not shown | Not shown |
| Partial/stale data | Not shown | Not shown | Not shown | “Last activity” only | Not shown |
| Permission denied | Not shown | Not shown | Not shown | Not shown | Not shown |
| Save success | Not shown | Not shown | Not shown | Not shown | Invite pending only |
| Destructive confirmation | Not shown | Not shown | Not shown | Not shown | Revoke shown, confirmation absent |
| Offline/retry | Not shown | Not shown | Not shown | Not shown | Not shown |
| Large dataset | Not shown | Not shown | Six cards | Six rows | Three members/eight results |

Shopify-grade is largely the behavior between ideal states. Static default screens cannot establish that bar.

### 11.6 Accessibility audit from supplied evidence

The self-critique says focus states and ARIA labels exist directionally, but no keyboard-only or screen-reader pass has occurred. The screenshots expose additional risks:

- pale status surfaces may fail non-text contrast or become indistinguishable in forced-colors mode;
- status and object type rely partly on hue;
- icon-only grid/list, global plus, notification, search, and close controls require accessible names and tooltips;
- small footer actions may not meet target-size guidance;
- nested scroll areas can trap keyboard and screen-magnifier users;
- the calendar needs grid semantics, logical arrow-key navigation, event names, and non-color state cues;
- result percentages need a text alternative explaining option, count, denominator, and uncertainty;
- truncated option labels need accessible full text;
- destructive actions require focus restoration and confirmation semantics;
- modals need focus trap, Escape behavior, background inertness, and announcement of result count.

Accessibility is not verifiable from the current frames and should not be counted as solved.

---

## 12. Ten highest-leverage improvements

### 1. Build one canonical Campaign Decision Overview

This is the highest-leverage screen because it defines the product. Put business intent, owner, decision deadline, response progress, result, confidence, sample quality, change, drivers, attention, recommendation, and final decision memory in one narrative. Derive Home summaries, report blocks, and analytics modules from this model.

**Acceptance test:** A marketer can answer “What should we do, why, how sure are we, and what could invalidate it?” without opening another tab.

### 2. Enforce campaign ownership in the information architecture

Make campaign-owned Polsts, distribution assignments, analytics, reports, and decisions visibly subordinate to Campaign. Keep organization-level Source Library and Standalone Polsts as explicitly labeled exceptions. Remove Audience from primary navigation until reliable audience data and a campaign job justify it.

**Acceptance test:** For any object visible in search or a table, the user can identify its campaign or see “Standalone.”

### 3. Define the metric and evidence contract before wiring charts

For every KPI, specify formula, denominator, date scope, comparison scope, time zone, refresh latency, filters, response-quality exclusions, and empty/error behavior. Add confidence/uncertainty and source concentration to result interpretation.

**Acceptance test:** No number can appear without an inspectable definition and a consistent relationship to totals elsewhere.

### 4. Put ranked attention and action above the fold on Home

Compress or remove the greeting. Place a short portfolio health line and refresh state first, followed by three to five ranked issues. Each item should include affected campaign, evidence, severity, owner, due date, and one action. Move campaign inventory below this queue; remove the co-equal Polsts panel.

**Acceptance test:** At 1366 × 768, the first actionable issue and its action are fully visible.

### 5. Introduce decision states, not only campaign statuses

Active, Scheduled, Draft, and Completed describe workflow. Add Conclusive, Directional, Inconclusive, Compromised, and Not enough evidence to describe the decision. Require a recorded rationale when a campaign is called.

**Acceptance test:** A completed campaign cannot be mistaken for a trustworthy decision.

### 6. Rebuild Polsts management as an operational table

Default to table view with paired thumbnail, campaign/standalone scope, workflow status, decision state, responses/target, confidence, leader, sources, owner, deadline, and activity. Retain the current grid as Preview view. Use the same canonical Polst card in preview and composer.

**Acceptance test:** A user can compare at least 15 Polsts at 1440 × 900 without scrolling.

### 7. Normalize Distribution’s object model

Separate Channel, Source, Asset, Destination, and Assignment. Replace overlapping inventory cards with coverage and health. Start assignment from Campaign; inherit to constituent Polsts; label direct-to-Polst use as Standalone. Add expiry, redirects, owner, and audit trail.

**Acceptance test:** A QR code’s channel, source name, destination, campaign, active period, and responses can be explained without using one term for two concepts.

### 8. Complete real workflows and non-ideal states

Wire create, edit, save, invite, revoke, assign, archive, export, and call-decision flows. Design loading, first-run, empty, partial, stale, error, permission, destructive, and recovery states. Remove all mock/implementation-note copy from user-facing builds.

**Acceptance test:** A scripted end-to-end campaign can be created, launched, monitored, called, reported, and revisited without a dead end.

### 9. Replace decorative analytics with an evidence interaction system

Use SVG/canvas charts with shared tooltip, crosshair, comparison, annotations, thresholds, export, and accessible tabular fallback. Do not add a chart unless it answers a named business question. Put written interpretation and action before the plot.

**Acceptance test:** Every chart title can be rewritten as a question, and the screen states the answer or says evidence is insufficient.

### 10. Run a system pass on shell, density, semantics, and accessibility

Remove the nested-scroller pattern where possible. Define responsive navigation. Reduce repeated card containment. Separate badge, tag, status, type, and segmented-control components. Normalize icon weight, button verbs, table density, time formatting, color semantics, focus behavior, and target sizes. Test keyboard, screen reader, zoom, reduced motion, and forced colors.

**Acceptance test:** Core workflows pass at 1440 × 900, 1366 × 768, 1024 × 768, and 200% zoom without hidden actions or horizontal loss of meaning.

---

## 13. Recommended shortest path

The shortest path is not to finish every visible room. It is to prove the product with one vertical slice and then propagate the system.

### Step 1 — Freeze the object and data model

Define Campaign, Polst, Channel, Source, Asset, Assignment, Response, Audience segment, Decision, Recommendation, and Decision record. Define ownership and inheritance. Define every metric shown in the representative flow.

### Step 2 — Build the campaign vertical slice

Implement one real campaign from intent through decision memory:

1. create campaign;
2. compose one or more Polsts with the shared card;
3. select reusable distribution sources;
4. launch and ingest responses;
5. show response target, quality, result, and confidence;
6. explain change and drivers;
7. recommend an action;
8. call or mark the result inconclusive;
9. export and preserve the decision.

### Step 3 — Derive Home, Search, and libraries from that slice

Home becomes a portfolio of campaign attention states. Search returns typed objects with campaign context. Polsts becomes Standalone Polsts plus preview access. Distribution becomes the organization-level source library feeding campaign assignments.

### Step 4 — Complete states and run trust QA

Use real or contract-accurate data. Reconcile totals across every screen. Add refresh, stale, empty, loading, error, permission, and destructive states. Remove placeholder language and stock demo ambiguity. Test every claim a marketer might repeat in a meeting.

### Step 5 — Apply the visual-system correction

After the vertical slice works, reduce nested cards, rebalance density, remove the inner-scroll trap, normalize controls, and validate responsive/accessibility behavior. This order prevents another polished shell from freezing an unresolved object model.

---

## 14. Final scorecard

| Set / product area | Score | Main reason it is not higher |
|---|---:|---|
| Home and portfolio health | 5.8/10 | Story stops before cause; action is below fold; Campaign loses visual priority to Polsts |
| Planning calendar | 6.0/10 | Shows timing but not coverage, ownership, readiness, or decision risk |
| Polsts library | 5.6/10 | Grid-first visual dominance contradicts campaign-first admin work |
| Global search | 6.2/10 | Cross-object shell exists; unlabeled defaults and keyboard/result semantics are incomplete |
| Team and settings | 5.3/10 | Better member data, but roles remain unclear and developer/mock billing leak into the same page |
| Distribution | 4.9/10 | Correct global boundary; channel/source/asset/destination taxonomy is unresolved |
| Campaign Detail | 2.6/10 provisional | Only the old thin grouping screen is evidenced; the core redesign cannot be verified |
| Create Polst | 3.4/10 provisional | Only a consumer composer reference is supplied; brand intent-to-launch workflow is unverified |
| Analytics and reporting | 3.8/10 provisional | Home removes charts, but redesigned decision analytics are not evidenced |
| Global shell and system | 5.5/10 | Consistent static treatment cannot offset nested scrolling, repeated containment, incomplete states, and weak semantic differentiation |
| **Whole product** | **5.2/10** | **The shell is reorganized; the decision product is incomplete** |

---

## VERDICT

**Would this, filled with real data, read as Shopify-grade to a paying brand? No.**

Real data would eliminate one class of disbelief, but it would expose the more important gaps faster: unexplained scopes, missing confidence, ambiguous completion, source taxonomy, absent causal interpretation, unverified campaign ownership, and incomplete workflows. Shopify-grade is not the presence of rounded cards, restrained colors, compact tables, and a command bar. It is the feeling that every object has a stable home, every number has a definition, every state has been anticipated, every risky action behaves predictably, and the system becomes more trustworthy under real operational pressure.

The shortest path is:

1. make Campaign Detail the canonical decision brief;
2. define and enforce the metric/evidence contract;
3. wire one real campaign end to end, including failure and inconclusive states;
4. derive Home, Distribution, Search, Polsts, and Reports from that object model;
5. then perform the final density, interaction, responsive, and accessibility pass.

Until that sequence is complete, the product will read as a carefully styled dashboard concept for a polling tool—not a Shopify-grade decision system a brand can rely on.
