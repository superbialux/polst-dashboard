# Polst Brand Dashboard product audit and future-proof redesign plan

Audit date: 2026-07-17  
Compared products:

- Authenticated staging dashboard: `https://staging-dashboard.polst.app/`
- Local UI counterpart: `http://127.0.0.1:5176/`
- Product feedback: `dev-team-feedback.txt`, `marketing-team-feedback.txt`, and `transcript.txt`
- Product metric ideas: `dashboard-metrics.txt`
- Historical CEO prototype prompt supplied during product review

No credentials are reproduced in this document.

## Executive verdict

The local app is not merely a visual redesign of staging. It is a broader product direction layered over a staging-shaped core. That is appropriate: staging proves several important workflows, but it is a baseline, not the intended ceiling of the product.

Its best work is genuinely better than staging: the local campaign overview tells a decision story, makes urgent work actionable, shows a useful readiness checklist, gives richer empty states, presents reports in a comprehensible order, and introduces a useful planning calendar. Those patterns should survive and become clearer.

The main problem is not that the local app introduces new ideas. The problem is that concepts at very different maturity levels are presented with the same certainty. An unexplained points label, a manually owned key date, an inferred recommendation, and a verified response count currently look equally authoritative. The redesign must preserve useful ideas while making their source, readiness, and limitations legible.

The recommended direction is:

1. Treat staging as the verified core for Polsts, campaigns, publishing, distribution assets, workspace administration, and basic analytics—not as the final information architecture.
2. Keep and simplify the local app's decision-first hierarchy, homepage planning calendar, richer analytics views, reports, source concepts, and audience direction.
3. Classify each capability as **core now**, **progressive module**, or **research horizon** based on user value, instrumentation, and data quality.
4. Replace ambiguous decision language with factual results or clearly sourced statistical/editorial interpretation.
5. Add robust pre-publish review, explicit immutability rules, and data-quality states.
6. Make every date, metric, count, status, recommendation, and alert derive from one authoritative model with visible provenance.

The local app should become the clearest expression of where the product is going: grounded in today's real workflows, but designed to grow into marketing performance, audience intelligence, planning, and decision support without another structural rewrite.

## Audit method and evidence quality

The staging environment was authenticated with the supplied account. I inspected all primary routes, list and grid states, status filters, searches, pagination, creation forms, validation states, settings subsections, campaign lifecycle tabs, Polst analytics, QR and share/embed dialogs, public voter pages, and representative active/draft/ended records.

Repeated row-level actions were sampled by behavior rather than needlessly activating the same control on every record. Destructive confirmations were opened but not confirmed. One staging “Remove Polst” control removed an item immediately, without confirmation; the exact item was restored and reordered to its original position. That incident is itself evidence for a high-severity workflow defect.

The local app was run at desktop and narrow widths. Every declared route was rendered, all lifecycle variants were inspected, settings modules were opened, the feature-flagged analytics modules were temporarily enabled and then restored to off, and representative overlays and interactive states were exercised.

Important evidence caveats:

- Staging is real but not automatically correct. For example, its 30-day dashboard contains data while 90-day and all-time views show zero, so staging cannot be copied blindly.
- The local app's model date is June 15, 2026, while the audit date is July 17, 2026. “Today,” relative dates, upcoming campaigns, and calendar urgency are therefore stale by more than a month.
- The local app is intentionally UI-only and seeded, but seeded data still needs internal truth. A static prototype that contradicts the current date or its own metrics teaches the wrong product.

## Verified staging baseline and product horizon

The staging experience proves a small and coherent core:

- A **Polst** is one A/B question with two labels, two images, categories, optional tags, a lifetime, and an optional scheduled start.
- A **campaign** is an ordered sequence of Polsts under one public URL. The public campaign presents the sequence one question at a time.
- A Polst can be active, ended, or exist as a draft. Drafts can be active or archived in the draft library.
- A campaign can be draft, active, or ended.
- A brand workspace owns Polsts, campaigns, members, appearance settings, API credentials, webhooks, and usage records.
- Distribution currently exists contextually through share links, iframe/JavaScript embeds, social-share actions, and UTM-attributed QR codes. Staging does not expose a standalone source inventory.
- Analytics currently exists at brand, campaign, and Polst levels, though campaign analytics is incomplete in the observed build.

This baseline establishes real object and lifecycle semantics, but it does not settle the final navigation or product scope. The local app and `dashboard-metrics.txt` point toward a broader system with planning, acquisition, attribution, audience, retention, decision intelligence, and exports/integrations.

Those additions should be judged by four tests:

1. Does the capability help a brand plan, distribute, understand, or act on a Polst?
2. Is its data source and calculation defined?
3. Can the UI degrade honestly when data is missing or an integration is disconnected?
4. Can it be introduced progressively without disrupting the core Polst and campaign workflows?

Passing those tests is the bar for promotion into the shipped product. Absence from staging is not, by itself, a reason to remove a good idea.

## Using the CEO prototype prompt in the unslopification pass

The CEO prompt is useful evidence of product intent, not an implementation specification. Its strongest idea is that every part of the dashboard should reinforce one understandable learning loop:

**Decision → Polsts → Distribution → Participation → Evidence → Action → Next Polst**

Use **Recommendation** in place of **Evidence → Action** only when a documented statistical, rule-based, or human-authored process supports it. The product must not manufacture certainty merely to complete the loop.

This explains much of the CEO prototype's appeal: it repeatedly names the decision, keeps the contributing Polsts visible, connects distribution to evidence, and ends with a next action. The current local app has more functionality, but it sometimes loses that narrative under workspace metrics, generic cards, repeated summaries, and mixed-purpose screens.

### Authority and conflict resolution

| Concern | Authority |
|---|---|
| Product semantics, information architecture, metric meaning, eligibility, privacy, and workflow behavior | This audit plus subsequently approved product decisions and data contracts |
| Verified existing capability | Staging evidence, treated as a baseline rather than a ceiling |
| Product horizon and desired measurement | `dashboard-metrics.txt`, sequenced by instrumentation readiness |
| Visual system, layout, typography, spacing, color, component styling, responsive behavior, and tokens | `DESIGN.md` and the existing semantic token implementation |
| Historical CEO prompt | Product intent, content hierarchy, boundary conditions, and acceptance ideas only |

If `DESIGN.md` contains older product semantics that conflict with an approved rule in this audit—for example campaign-list **Result so far**, workspace-wide Insights, or older metric vocabulary—the audit governs product behavior and `DESIGN.md` continues to govern how the corrected behavior is expressed. The two documents should eventually be reconciled, but an implementation agent must not preserve a known product defect because it appears in a design-system document.

Do not copy any visual prescription from the CEO prompt into implementation tickets. Any question about page width, card treatment, imagery, hierarchy styling, chart presentation, responsive layout, or interaction styling must be resolved through `DESIGN.md`, existing semantic tokens, and the existing component APIs.

### Durable product doctrine to preserve

1. **The dashboard is decision infrastructure.** It is not survey software, a CRM, a marketing-automation platform, or a generic campaign/project tracker.
2. **Polsts are the evidence units.** A campaign must make it possible to see which ordered Polsts contributed to the decision and how each affected the read.
3. **Distribution means tracked handoff to existing channels.** Polst creates links, QR codes, embeds, and other tracked assets; it does not claim to publish posts, send email, or operate those channels.
4. **Evidence precedes interpretation.** Any finding or recommendation must expose the supporting response split, participant count, comparison, source context, limitations, and data-through time.
5. **Every interpretation closes a loop.** A finding should offer a valid next action such as create a follow-up Polst, create a variation, inspect distribution, record the decision, or export/share the evidence.
6. **Campaign context owns campaign learning.** Insights are campaign-driven, and the campaign's Polsts are analyzed inside that campaign rather than ranked as unrelated standalone findings.
7. **Creation ends in review and operational handoff.** The user reviews the real final object, understands what locks, creates or publishes it, receives the relevant distribution assets, and is told what to do next.
8. **Reports are decision artifacts.** They should read as a traceable narrative—decision, Polsts, evidence, sources, caveats, action—not as another analytics dashboard.
9. **Audience remains aggregate decision support.** It answers who responds, what behavior differs, and what may be worth asking next without exposing individual profiles or becoming a segmentation CRM.
10. **A first-time marketer should understand the product loop within 60 seconds.** The interface must teach what a Polst is, what a campaign adds, how distribution works, what was learned, and where the next action lives.

### What the prompt expects the dashboard to communicate

The prompt does not need to become a new set of screen contracts. Its useful contribution is a consistent set of questions the product should answer wherever the relevant evidence exists:

1. What business or creative decision is being made?
2. Which Polsts contributed to that decision, and in what order?
3. What did participants choose, based on how many starts and completions?
4. Which tracked sources or placements produced the participation?
5. What conclusion is supported, how strong is the support, and what are its limitations?
6. What should the marketer do next: follow up, create a variation, distribute, record the decision, or share the evidence?
7. What is running or scheduled now, and what needs attention next?
8. Which assets were created, where do they lead, and what must the marketer place manually?
9. What aggregate audience behavior may inform the next question without exposing individual respondents?
10. Can the evidence be turned into a clear, traceable decision record for a stakeholder?

These are comprehension expectations, not mandatory sections on every page. A surface should answer only the questions relevant to its scope and supported by its data.

### Ideas to adapt rather than copy

| CEO-prompt idea | Adapted rule |
|---|---|
| “Winning Direction” on Home and campaign cards | Keep conclusions out of factual list tables. Surface a decision readout on campaign Overview/Insights only when the campaign defines a decision question and the evidence contract supports it. |
| Every referenced Polst shows its full visual result | Keep every Polst identifiable through the existing Polst component family. Use the context-appropriate existing full, compact, or thumbnail representation defined by `DESIGN.md`; do not make every reference a large card. |
| Every chart includes interpretation | Preserve the content rule: state the supported takeaway and baseline near the evidence. Use existing chart and interpretation components. Drop the row entirely when the data cannot support a claim. |
| Every insight has a next action | Preserve. The action must be valid for the campaign state and must not imply unsupported automation. |
| Distribution assets show scope and destination | Preserve. Also state that Polst does not auto-publish and make post-activity attribution immutable/versioned. |
| Influencer tracking shows quality, not only volume | Preserve as a later Distribution/Analytics capability: tracked link status, reach/clicks when imported, Started, Completed, Finish rate, and campaign result by creator. Exclude marketplace, payment, contract, payout, and CRM functionality. |
| Create a follow-up or variation | Preserve as campaign/Polst next actions, with copied context and a fresh evidence record rather than mutation of the completed run. |
| Audience recommends what to ask next | Preserve only when the recommendation cites aggregate evidence, eligibility, privacy limits, and provenance. |
| Product-loop acceptance checks | Preserve as a comprehension and evidence QA pass across the current application, not as a mandate to recreate the old `/brand/*` screens. |

### Instructions from the CEO prompt that do not carry forward

- The old `/brand/*` route list and command to preserve that sitemap.
- Any exact layout, width, spacing, card, placeholder-image, or visual-treatment instruction; `DESIGN.md` owns those decisions.
- Literal sample counts, percentages, campaign winners, demographics, topics, and claims. They are examples, not requirements or seed truth.
- Bare “points,” “winning direction,” High confidence, or “statistically significant” language without the raw split, sample, method, and decision contract.
- A campaign result in the campaign-list table. The list remains factual; campaign interpretation belongs in campaign Insights.
- “Estimated reach” unless a connected source provides a defined reach metric.
- Individual demographic or influencer conclusions without collection provenance, privacy eligibility, and sufficient sample.
- “Coming Later” promises used as interface content.
- The proposed Owner/Editor/Viewer role taxonomy when it conflicts with verified workspace provisioning and approved access rules.
- The instruction to omit Developer/API or integrations solely because the old prototype considered them out of scope; staging and the metrics horizon establish legitimate future workflows.

### Implementation guardrails: reuse before invention

Before changing a screen, the implementing agent must read `DESIGN.md` and inventory the existing components in `src/components/dashboard`, `src/components/ui`, and relevant page-local modules.

Use this order:

1. Reuse an existing component without modification when its data and states already fit.
2. Compose existing components when the screen is a new arrangement of known patterns.
3. Extend an existing component through typed props, slots, or variants when the underlying data structure and interaction remain the same.
4. Create a new shared component only when existing components cannot represent the required data structure, interaction semantics, accessibility behavior, or state model without distortion.

A new component proposal must document:

- The required data shape and states.
- Which existing components were evaluated.
- Why composition or a typed extension is insufficient.
- Where the new component will be reused, or why its distinct semantics justify a single use.

Do not fork a component for different styling, copy an existing pattern into a page, create page-specific tokens, hard-code visual values, or introduce a second metric/status vocabulary. New and extended components must consume existing semantic tokens, formatters, metric definitions, status mappings, overlays, feedback, loading, empty, error, and accessibility patterns.

## Staging application overview

### 1. Login

The login screen accepts email and password, includes “Remember me,” and exposes “Forgot password?” and “Request access” links. The latter two currently point to `#`, so they are visual promises without working destinations.

Purpose: authenticate a brand workspace member.

### 2. Global shell

The staging shell contains:

- Workspace selector with current plan.
- Primary navigation: Dashboard, Polsts, Campaigns, Settings.
- Current member identity and logout.
- Collapsible sidebar and a mobile navigation button.

The collapsed desktop rail preserves only icons. The workspace selector showed only the current workspace in the audited account.

### 3. Dashboard

The Dashboard is the brand-wide analytics surface. It provides:

- Export menu with CSV and PDF choices.
- Fixed date presets: 7D, 30D, 90D, All.
- “What needs your attention” narrative comparing the selected period with the preceding period.
- Total views, total votes, engagement rate, completion rate, average dwell time, median scroll depth, and view-without-vote rate.
- Views/votes and dwell-time time-series charts.
- Top campaigns by views.
- Top Polsts by votes.
- Device, operating-system, and browser breakdowns.

What it is supposed to do: answer “How is the brand performing?” using factual measurement and direct navigation to the objects behind the numbers.

Observed defects:

- 90D and All showed zero even though 30D contained data.
- Votes can exceed views in list data, but the definitions are not explained.
- Engagement displayed 100% while the underlying view/vote relationship was not self-evident.
- Some metric cards have sparklines and others do not.
- The narrative block is useful but visually dominates the actual metrics.

### 4. Polsts list

The Polsts surface provides:

- Create Polst.
- All, Active, and Drafts filters.
- List and grid views for published/ended Polsts.
- Search.
- Pagination.
- Title, status, views, votes, engagement, created date, social distribution, and QR actions.
- Draft library with Active and Archived subfilters and “Move to archive.”

The list title opens the public voter URL; a separate icon opens dashboard analytics. This split is not visually explicit enough.

What it is supposed to do: find, inspect, share, and manage the lifecycle of individual A/B questions.

Observed defects:

- Engagement is mostly an em dash, making the column look broken.
- Preview images did not reliably render in the list during the audit.
- Draft and published records use substantially different layouts inside the same top-level filter.
- Archived drafts can exist, but the empty archive does not teach why archiving matters.

### 5. Create Polst

The creation form includes:

- Title with a visible `0/70` counter.
- Option A and B labels with visible `0/40` counters.
- Required image upload for both options.
- Required categories.
- Up to 10 optional tags, 40 characters each.
- Fixed lifetimes of 3, 7, or 10 days plus Custom date.
- Optional start date.
- Save Draft and Create Polst.
- Inline and summary validation when submitting empty.

What it is supposed to do: create a complete A/B question that can be published immediately or saved for later.

Best aspect: staging has the clearest constraints and validation of either app.

Missing aspect: there is no robust final review that shows the voter-facing result and warns what becomes immutable.

### 6. Polst analytics

The observed active Polst analytics page contains:

- Current lifecycle and lifetime controls.
- Total votes and per-option totals.
- Vote velocity for the last hour, six hours, and 24 hours.

An ended record returned “Failed to load polst data,” demonstrating that error and ended-state coverage are incomplete.

What it is supposed to do: show how an individual A/B question is performing and allow valid lifetime changes.

### 7. Campaigns list

The Campaigns surface provides:

- Create campaign.
- All, Draft, Active, and Ended filters.
- Search.
- Created-from and created-to date range.
- Campaign cards with status, creation date, Polst count, started count, completed count, and completion.

What it is supposed to do: browse campaign runs and quickly understand their lifecycle and participation.

Observed defects:

- Some sample records report completed counts greater than started counts.
- Cards are repetitive and do not clearly distinguish “needs setup,” “collecting,” “ready to end,” and “ended.”
- Completion alone cannot explain the result of an ordered chain.

### 8. Create campaign

The staging flow begins with:

- Required campaign name.
- Duration: 3, 7, 10 days, Custom date, or No end.
- Explanation of what happens next.
- Links to recent drafts.

After creation, the user lands on the campaign detail to add Polsts, reorder them, and publish.

What it is supposed to do: create a campaign shell first, then compose its ordered voter journey.

This staging flow is simpler and more grounded than the local form, but Custom date and No end conflict with explicit marketing feedback.

### 9. Campaign detail — Polsts

The default campaign tab shows:

- Campaign status, end date, voter count, public URL, QR, share/embed, and Add Polst.
- Ordered Polst rows with option labels, vote totals, and A/B split.
- List and grid view.
- Drag-to-reorder.
- Remove.
- Add menu with “Create new Polst” and “Select from your library.”

Active, draft, and ended states were all inspected. Ended campaigns disable editing and state that they are read-only.

Critical defect: Remove acted immediately with no confirmation or undo.

### 10. Campaign detail — Details

The Details tab exposes brand ownership, editable campaign name, and end date. Brand ownership cannot change after creation.

What it is supposed to do: manage basic campaign metadata without mixing it with the ordered Polst composition.

### 11. Campaign detail — Analytics

The observed Analytics tab rendered no meaningful content for the active campaign.

What it is supposed to do: provide campaign-level journey, participation, and outcome analysis. This is a major missing staging view and a place where the local concept can contribute—once the metrics are real.

### 12. Campaign detail — Lifecycle

Lifecycle explains Draft, Active, and Ended, then exposes:

- Unpublish: temporarily take a campaign offline while retaining votes.
- End campaign: permanently stop submissions while retaining analytics.

What it is supposed to do: make reversible and irreversible state changes explicit.

### 13. Campaign QR and share/embed

QR dialog:

- Shows the full UTM-attributed URL.
- Allows QR color and brand logo overlay.
- Offers PNG and SVG.
- Downloads the selected format.

Share/embed dialog:

- Provides iframe and JavaScript snippets.
- Explains width, minimum width, height, and CSP use.
- Provides copy actions.

These are real, useful staging capabilities and should be retained contextually.

### 14. Public Polst and campaign voter pages

The public Polst page includes brand identity, question, two visual choices, OR connector, category, vote/time metadata, and social actions. The public campaign opens the first Polst in the ordered chain and advances through later questions after votes.

The page also includes the broader consumer Polst chrome—trending, search, follow, like, repost, bookmark, and comments—which may not be appropriate for every embed or brand campaign context.

What it is supposed to do: collect a low-friction binary response while preserving campaign order and attribution.

### 15. Settings — Brand Profile

Brand profile includes avatar, display name, description, US state, city, character limits, and save.

### 16. Settings — Members

Members lists email, role, and joined date. Add Member provisions a brand-only account with Manager or Owner role and can generate an initial password.

### 17. Settings — Branding

Branding is substantially richer than the local counterpart. It includes:

- Accent color.
- Title color, size, weight, and placement.
- Label color, size, placement, and alignment.
- Card, body text, and header surfaces.
- OR badge background, text, and diameter.
- Image ratio.
- Radius, density, elevation, and typeface.
- Light/dark logo and favicon uploads.
- Custom font URL.
- Advanced custom CSS and watermark entitlement.
- Live unsaved preview, revert, reset, and save.

### 18. Settings — Developer

Developer contains API keys and webhooks. It explains token exchange, links to the REST reference, supports scoped key creation, and supports up to ten webhook endpoints.

### 19. Settings — Usage

Usage contains Polsts created, campaigns created, total views, total votes, and monthly history.

## Local application overview and scope assessment

### Home

The local Home combines brand metrics, an expandable metric chart, a decision card, a five-item attention queue, active/queued campaign summaries, a three-step launch checklist, a full month calendar, and key-date planning cards.

What works:

- Strong initial hierarchy at desktop width.
- “Need attention” items contain reason plus next action.
- Campaign readiness is presented as a checklist instead of raw metadata.
- The decision card is more useful than an undifferentiated analytics summary.

What does not:

- The page is too long because the calendar, attention queue, campaign blocks, checklist, and key-date cards repeat the same planning information.
- The model believes June 15 is today during a July 17 audit.
- Key dates, participant goals, source gaps, and recommendations do not identify whether they are manually entered, computed, or imported.
- “Ready to decide” is used for an active campaign with two days remaining; that is not the same as “campaign ended, results ready.”
- Sparklines do not show a visible comparison or consistent trend semantics.
- The same attention information is repeated in the sidebar, top card, readiness block, and calendar cards.

Recommendation: keep the calendar on Home. It is a genuinely useful bridge between publishing and marketing work. Simplify it into a compact planning section with month/agenda views, campaign and Polst dates, manually owned key dates, filters, and a day-detail drawer. Remove the separate repeated key-date cards, not the calendar itself. A full planning workspace can grow from this section later without changing the homepage's core mental model.

### Campaigns

The local campaign table adds scheduled and archived statuses, previews, voter targets, completion, and “Result so far.” The detail adds Overview, Polsts, Sources, and Settings.

What works:

- Campaign detail has the best information hierarchy in the local app.
- The recommendation, caveat, target/completion/source summary, journey, and source table are easy to scan.
- Draft campaigns have useful empty states and readiness tasks.
- End and unpublish actions have confirmation dialogs.

What does not:

- “+16 pts” is undefined. It means a percentage-point margin in seed code, but users reasonably read it as votes or a score.
- One campaign-level winner cannot be inferred from three to five unrelated binary questions without an explicit decision model.
- “Confidence” has no documented algorithm.
- Voter targets are not yet defined, but can become useful campaign objectives when their owner and decision purpose are explicit.
- “Result so far” creates false precision for incomplete sequential journeys.
- Key date and decision question need clear ownership and validation; their absence from staging is not enough reason to discard them.
- No created-date range exists on the local campaign table, while staging has one.
- The active campaign's Polst results are large relative to the information they convey.

Recommendation: bring the campaign index closer to staging and make it factual. Replace the current columns with **Campaign**, **Status**, **Polsts**, **Started**, **Completed**, and **Finish rate**. Keep the run dates or relative schedule beneath the campaign name. Remove **Result so far** from the list; interpretation belongs in campaign Insights, where the decision question, other Polsts, sources, sample, and caveats can be read together.

The metric language must be explicit:

- **Started:** unique participants who submitted the first Polst in the campaign.
- **Completed:** unique participants who submitted every Polst in the campaign.
- **Finish rate:** Completed ÷ Started. It is a participant-funnel metric, not the percentage of campaign time elapsed.
- **End date/time remaining:** display separately as “Ends in 2 days,” “Ended Jun 10,” or “Starts Jul 20.”
- **Participant goal:** if retained, this is an optional planning target, never a hard limit. A campaign continues collecting until its scheduled/manual end and may exceed the goal.

Do not render an ambiguous value such as `1,486 / 1,200` in the list. If the future participant-goal concept survives product validation, show it on campaign detail as “1,486 participants · Goal of 1,200 reached.”

### Polsts

The local Polst list is visually stronger than staging: thumbnails, option summaries, status, and metrics are readable in one row. The detail provides factual results, schedule, velocity, a large voter preview, and contextual distribution/source actions.

What works:

- Better list thumbnails and row hierarchy.
- Clear status differentiation.
- Scheduled state has an actionable “starts in” warning.
- Draft state explains that voters cannot see it.

What does not:

- “Interactions” is ambiguous and combines likes/reposts.
- Active detail wastes space on a very large social preview.
- “+22 pts” repeats the undefined points problem.
- Vote velocity and schedule are small tables that do not establish priority.
- The social preview question is too small and too close to the options.
- The archived Polst detail is effectively empty, yet hidden distribution/QR/source structures still exist in the component tree.
- Create Polst has `maxLength` attributes but no visible title/option counters. Its option limit is 30, while staging allows 40.
- Required fields are not visibly marked.
- No final review warns what locks after publishing.
- No end and Custom remain available despite explicit feedback.

### Distribution

The local Distribution area is an entire future product: active/unassigned sources, source attribution, scan counts, completion, QR inventory, tracked links, embed snippets, Klaviyo, and influencer tracking.

What works:

- The table and asset inventory form a coherent source-management concept.
- Preventing unassignment after a source has collected voters is the correct data-integrity instinct.

What does not:

- No equivalent primary area exists in staging.
- “Source,” “channel,” “placement,” and “linked to” are not taught before use.
- The team transcript explicitly struggled to explain assign/unassign.
- The page promises integrations and attribution behaviors that may not be buildable yet.
- It duplicates campaign/Polst share and QR actions.

Recommendation: preserve Distribution as a strategic product area because the metrics brief depends on UTM, channel, creator, paid/organic, email, and cost attribution. Simplify the current page to a source registry plus asset/link management, while keeping quick share, QR, and embed actions contextual on campaigns and Polsts. Show integration connection and data-quality states explicitly. Promote the area in navigation only when at least one attribution source is active; until then, it can remain a progressive module rather than being deleted.

### Analytics — Overview

The local Analytics Overview combines decision cards, totals, source mix, generic voter journey, interactions, verticals, campaign performance, and standalone Polsts.

What works:

- Useful date/channel/vertical controls.
- Decision work is placed above raw analytics.
- Campaign and standalone Polst rows link back to objects.

What does not:

- It duplicates Home and staging Dashboard.
- “Verticals” has no customer-facing taxonomy contract.
- The generic brand-wide voter journey is too abstract to drive action.
- “Campaign performance” repeats unsupported result summaries.
- “Standalone Polsts” is a secondary inventory with no clear decision.

Recommendation: keep Analytics as a durable destination for cross-campaign analysis, but make Home a concise operational summary. Analytics Overview should focus on comparison, segmentation, attribution, and trends that do not fit the homepage. Campaign journey remains campaign-specific, while reusable cross-campaign views—channel, vertical, content topic, and cohort—belong here once their taxonomies are defined.

### Analytics — Insights

The current page repeats weekly trends, decided/ready cards, the Home attention queue, cross-workspace Polst/source comparisons, and change history. A marketer cannot tell whether this is another dashboard, a task list, or an analysis product.

Recommendation: refactor Insights into a **campaign insights index**. Every insight must belong to one campaign. The page helps a marketer find campaigns with meaningful findings, then opens the evidence in that campaign's context. It does not analyze standalone Polsts, repeat Home tasks, or provide another workspace-wide metric overview.

#### Product promise

> Understand what each campaign learned, which Polsts shaped that learning, and what the marketer should do next.

The division of responsibility becomes:

- **Home:** what needs attention today, what is ready, and what is coming up.
- **Analytics Overview:** workspace totals, comparisons, charts, filters, channels, and longer-term performance patterns.
- **Insights:** campaign-by-campaign interpretations and learning history.
- **Campaign detail:** the full evidence and actions for one campaign.
- **Standalone Polst detail:** factual performance only; it does not generate a workspace Insight.

#### Insights index

The default view is a searchable, filterable campaign list rather than a grid of unrelated cards. Only Active and Ended campaigns with enough response data appear. Scheduled and Draft campaigns remain on Home/Campaigns because they do not have findings yet.

Each campaign row contains:

1. Campaign name, category, run dates, and lifecycle status.
2. Participants and completion rate.
3. A plain-language campaign readout, such as “The packaging preference is clear, but the shelf-read question favors the alternative.”
4. Insight state: **Needs review**, **Monitoring**, **Decision ready**, or **Reviewed**.
5. Number of Polsts and sources included in the analysis.
6. Data-through timestamp.
7. One action: **View campaign insights**.

Do not place a campaign “winner” in the index unless the campaign explicitly defines a decision question. Even then, show the response split as evidence rather than a bare points label.

#### Campaign insight detail

Selecting a row opens the campaign's Insights view, preferably as a campaign tab or anchored campaign section rather than a second copy of campaign analytics.

1. **Campaign readout**
   - Business decision being tested.
   - Current lifecycle state and collection progress.
   - Two or three evidence-backed findings.
   - One next action.
   - Data quality, sample limitations, and data-through time.
2. **Polsts in this campaign**
   - Ordered question number and question text.
   - Both option response percentages and response count.
   - Change in participation from the previous question.
   - Plain-language role in the campaign: supports the decision, adds context, contradicts the decision, or remains inconclusive.
   - Link to the Polst's factual detail when deeper inspection is necessary.
3. **Source contribution**
   - Participants and completion by source.
   - Clear differences expressed with both rates, for example: “QR visitors completed at 54%; the campaign completed at 71%.”
   - No causal claim unless the data supports it.
4. **Audience and timing**
   - Add only when the campaign has eligible data and privacy-safe groups.
5. **Marketer notes and resolution**
   - Record the decision taken, owner, date, and optional follow-up.
   - States: New, Monitoring, Acted on, Dismissed, or Resolved.

The Polsts section is not a second standalone-Polst leaderboard. It explains how the ordered Polsts collectively shaped one campaign's result. A standalone Polst remains factual on its own detail page; if it is later included in a campaign, it becomes part of that campaign's insight record.

#### Language contract

- Never display bare `pts`, `points`, or `+N` differences.
- Show the underlying percentages and name the metric.
- Prefer “58% selected Minimal Label; 42% selected Bold Label” over “16-point lead.”
- Prefer “32.6% of views became responses, compared with 30.4% for this campaign” over “2.2 pts above baseline.”
- State the comparison population and sample size.
- Label conclusions as computed or human-authored.
- Use “inconclusive” when the available data does not justify a recommendation.

#### Pagination and scale

Use eight campaigns per page so each row can carry a meaningful readout without making the page endless. The footer should be explicit:

`1–8 of 11 campaigns` &nbsp;&nbsp; `Previous` &nbsp; `1` `2` &nbsp; `Next`

- Hide pagination when eight or fewer eligible campaigns remain.
- Preserve search, filters, and sort while paging.
- Reset to page one when a filter changes and clamp the page when results shrink.
- Default sort: latest meaningful campaign activity, not campaign creation time.
- Mobile uses the same eight-item pages with stacked campaign rows.
- Empty search and insufficient-data states must explain why no campaigns qualify.

The mock workspace now contains 16 campaigns: 11 Active or Ended campaigns with response data qualify for this index, producing two pages at eight rows per page. The remaining Scheduled and Draft campaigns exercise the excluded and insufficient-data states without pretending they already have insights.

### Analytics — Reports

Reports lists ready and draft reports and can preview a decision report.

The report structure is valuable, but the separate inventory is premature and the contents are seeded interpretation. The most important report should be visible from the campaign outcome, not buried behind Analytics > Reports.

Recommendation: attach the primary report to an ended campaign, and preserve a central Reports library as a later cross-campaign workspace for saved, scheduled, shared, and exported reports. The current standalone inventory should be simplified until versioning, authorship, generation triggers, and export formats are real.

### Audience

Audience adds time-of-day heatmap, devices, geography, platforms, browsers, and “Coming soon” demographics.

What works:

- Device/platform/browser breakdowns have staging precedent.
- The activity heatmap could be useful if the data exists.

What does not:

- Geography is a table where a map would communicate distribution faster.
- “Coming soon” commits the company to unsupported demographics.

Recommendation: keep Audience as a future-proof analysis area because the metrics brief explicitly calls for device, OS, geography, new/returning, demographics, and cross-Polst behavior. Remove the visible “Coming soon” cards, not the product direction. Start with verified device/platform/browser and privacy-safe geography; unlock demographic, overlap, and cohort modules only when collection, consent, minimum-group, and privacy rules are in place.

### Settings

The local settings contain Workspace, Team & access, Embed appearance, Modules & integrations, and Plan & usage.

What works:

- Workspace and team map reasonably to staging.
- Embed appearance has a live preview.

What does not:

- Embed appearance exposes far fewer controls than staging.
- Modules and ad-platform integrations do not yet show credible connection, permissions, freshness, or error states.
- Feature-flagged Acquisition and Retention pages are only “not connected” empty states.
- “Developer platform — Pro” contradicts the observed staging Developer section, which exposes API keys and webhooks in this workspace.
- Settings omits the actual staging Developer workflow.

Recommendation: restore staging's Brand Profile, Members, full Branding, Developer, and Usage capabilities. Keep Modules & integrations as a progressive configuration area because acquisition, influencer, email, and retention reporting depend on it, but show only supported connectors and honest connection states. Commercial gating must come from the real entitlement model rather than a seeded “Pro” teaser.

### Global search, notifications, and calendar

These are reasonable cross-product systems at different maturity levels.

- Global search indexes campaigns, Polsts, sources, and pages. Staging only has local list search. Team feedback calls the global version too advanced.
- Notifications contain campaign thresholds, source degradation, and report readiness, but no event contract exists in staging.
- Calendar/key dates have strong planning value, but currently dominate Home and do not disclose date ownership or source.

Recommendation: keep the homepage calendar and simplify its composition. Preserve global search as a scale feature: list search is sufficient initially, while command search can activate when workspaces contain enough campaigns, Polsts, sources, and reports to justify it. Preserve notifications as a model but surface only event types with durable state, clear recipients, deduplication, and a concrete CTA.

## Metric coverage and product opportunities

`dashboard-metrics.txt` is an idea bank, not an implementation specification. It is valuable because it clarifies the intended direction: Polst should connect content response data to acquisition, audience, retention, campaign efficiency, and decision confidence. The right response is to organize and sequence these ideas, not to copy every metric into the interface or discard them because staging does not yet expose them.

| Metric family | What the application already covers | Promising gaps to preserve | Recommended treatment |
|---|---|---|---|
| Core brand performance | Views, votes/responses, engagement, date ranges, trends, top campaigns/Polsts | Clear comparison periods, paid vs organic, account creation from engagers | **Core now.** Fix definitions and period correctness before adding more cards. |
| Per-Polst engagement | Responses, A/B split, velocity, schedule, interactions | Completion/drop-off, time to vote, time to first response, time to significance, geo/device/channel cuts | **Core next.** Add to Polst analytics progressively and keep the summary compact. |
| Campaign journey | Started/completed concepts, ordered Polsts, completion, local step journey | Precise step drop-off, bounce before first vote, reach, cost per response, campaign ROI | **Core next.** Requires consistent participant identity and campaign event semantics. |
| Source and acquisition | QR UTM parameters, share/embed assets, local source/channel views | New vs returning by channel, account creation by source, CPC, CTR, CPA, paid/organic, frequency, overlap | **Strategic module.** Preserve Distribution and Acquisition; build on an attribution contract and cost imports. |
| Influencer performance | Local influencer/source concept | Creator clicks, CTR, eCPC, manual story views, creator-tier benchmarks | **Pilot module.** Support manual inputs with visible provenance before automating platform ingestion. |
| Email performance | Klaviyo appears as an integration concept | Opens, CTR to Polst, click-to-conversion, unsubscribe, list growth by source | **Progressive integration.** Do not show empty metric dashboards before a provider is connected. |
| Content and vertical performance | Categories/tags exist; local vertical filters and rows exist | Topic/hook performance, format comparison, Sports/Food/Lifestyle cuts, share/virality | **Preserve and define.** Start with configurable categories/tags; avoid a hard-coded unexplained taxonomy. |
| Retention and cohort health | Feature-flagged local module only | D1/D7/D30, repeat engagement, frequency, churn indicators, notification engagement, feature usage | **Later module.** Depends on identity resolution and cohort definitions, not merely more UI. |
| Audience composition | Device, OS/browser/platform; local geography and activity heatmap | New/returning, privacy-safe demographics, city drilldown, cross-Polst behavior, audience overlap | **Progressive Audience area.** Release dimensions only when consent and minimum-group rules are met. |
| Decision intelligence | Local result summary, confidence label, findings/caveats, “what changed” pattern | Statistical significance, confidence intervals, category benchmarks, rerun shifts, time to significance | **High-value horizon.** Preserve the experience; replace seeded certainty with a documented analysis service or human-authored provenance. |
| Reports and interoperability | CSV/PDF affordances, staging API keys/webhooks, local report structure | Raw CSV/JSON, scheduled reports, API access, real-time webhooks, BI connectors | **Durable platform layer.** Keep campaign reports and later add a cross-campaign library. Restore Developer rather than hiding it behind a mock plan. |

The application already covers the core collection layer better than the brief might imply: Polst results, campaign composition, basic funnel concepts, dates, distribution assets, and device/platform reporting all exist in some form. The missing foundation is not another dashboard grid; it is a reliable event, identity, attribution, cost, consent, and metric-definition layer.

### Metric hierarchy for the interface

To prevent the broader metric set from becoming “analytics vomit,” every metric should live at the level where a user can act on it:

- **Home:** a small operational summary, current decisions, attention items, and calendar.
- **Polst detail:** response split, completion, velocity, time-to-vote/significance, and relevant audience/source cuts.
- **Campaign detail:** reach, journey/drop-off, source efficiency, per-Polst results, optional participant-goal progress, and outcome report.
- **Analytics:** comparisons across campaigns, content, channels, verticals, cohorts, and time.
- **Distribution:** sources, tracked assets, attribution health, spend imports, and connector status.
- **Audience:** composition, timing, geography, returning behavior, and privacy-safe overlap.
- **Reports:** saved or scheduled decision artifacts and exports, after report semantics exist.

This placement preserves the good metric ideas while avoiding a single page that attempts to show all of them at once.

## Workflow-by-workflow comparison

| # | Workflow | Staging behavior | Local behavior | Future-proof direction and required action |
|---|---|---|---|---|
| 1 | Sign in | Real email/password workspace login; two dead help links | No login | **Staging.** Keep real auth; fix help links. |
| 2 | Scan brand performance | Factual period presets, trends, charts, rankings, device/platform data | Cleaner first viewport but seeded/stale metrics and an unproven decision layer | **Hybrid foundation.** Use verified core metrics with local hierarchy, then expand through the metric roadmap as data contracts mature. |
| 3 | Find what needs action | Three factual trend/lever statements | Five actionable items with contextual CTAs | **Local pattern.** Support computed, rule-based, and human-owned actions with visible provenance. |
| 4 | Change dashboard date range | 7D/30D/90D/All; 90D/All currently incorrect | Same useful presets in a popover | **Local control, staging contract.** Add correctness tests. |
| 5 | Export analytics | CSV/PDF menu exists | Export affordances appear on analytics/report pages | **Staging.** Make format and downloaded scope explicit and verify files. |
| 6 | Browse/search/filter Polsts | All/Active/Drafts, search, pagination, list/grid | More lifecycle filters, clearer thumbnails, no pagination | **Local row design + staging state model.** Add date range and pagination. |
| 7 | Create a Polst | Strong counters, constraints, categories, validation | Better compositional feel, but missing visible limits/required marks | **Staging form rules + local live preview.** Add review step. |
| 8 | Review before publishing a Polst | Missing | Missing; only a readiness checklist | **New required workflow.** Show final voter preview and immutability warning. |
| 9 | Inspect active Polst results | Sparse totals and velocity | Rich results, schedule, velocity, and oversized preview | **Local factual summary**, compressed; move preview behind “Preview as voter.” |
| 10 | Understand a scheduled Polst | Schedule data is present | Strong “starts in N days/no source” hero | **Local pattern** if source data exists; otherwise factual schedule-only warning. |
| 11 | Handle an archived Polst | Archived draft library exists | Dead-end detail with little content | **Improved library pattern.** Replace the dead end with a compact read-only summary plus Restore or Delete. |
| 12 | Share a Polst socially | Channel modal | Same channel modal | **Staging/local parity.** Keep contextual, not a top-level module. |
| 13 | Generate a Polst QR | Full URL, color, logo, PNG/SVG | Similar, but download intent is less clear | **Staging.** Label “Download PNG/SVG QR” and show destination URL. |
| 14 | Browse/search/filter campaigns | All/Draft/Active/Ended, search, created date range; cards show started, completed, and completion | More statuses and richer rows, but no date range; “Voters,” target shorthand, “Completion,” and “Result so far” are unclear | **Staging semantics + local hierarchy.** Use Campaign, Status, Polsts, Started, Completed, and Finish rate; keep run dates under the name; remove Result so far and move interpretation to campaign Insights. |
| 15 | Create a campaign | Name and duration, then compose | Adds decision question, start, voter target, key date | **Local direction on top of staging.** Keep optional objective, participant goal, and planning date with definitions, ownership, and sensible defaults; use advanced disclosure for non-core fields. The goal never caps collection. |
| 16 | Compose campaign Polsts | Add new/library, reorder, remove, list/grid | Polsts tab and library flow, but result cards are oversized | **Staging interaction, local empty states.** Add removal confirmation/undo. |
| 17 | Review campaign before launch | Missing | Readiness checklist, but no final immutable review | **Local checklist + new review screen.** Derive every check from real data. |
| 18 | Understand an active campaign | Basic count/list; analytics tab incomplete | Excellent decision-first hierarchy, but interpretation is seeded | **Local structure using factual data.** Preserve confidence/recommendation positions, but show them only when computed or authored with visible provenance. |
| 19 | Inspect ordered-question drop-off | Not available in observed analytics tab | Campaign-specific voter journey | **Local pattern** once backend supplies per-step starts/completes. |
| 20 | Inspect sources/attribution | QR UTM and share/embed only | Full source platform and completion comparisons | **Local strategic direction.** Start with UTM-aware assets and a simple source registry; expand into cost, creator, paid, and email attribution as connectors come online. |
| 21 | Share/embed a campaign | Real iframe/JS copy and QR | Similar in Sources/detail | **Staging.** Keep in campaign detail. |
| 22 | Change campaign lifecycle | Unpublish and irreversible End explained in Lifecycle | Confirmations exist under Settings/header | **Hybrid.** Use staging semantics with local confirmations. |
| 23 | Review ended results | No strong decision report in observed build | Strong report hierarchy with findings/caveats/next step | **Local structure.** Make it a first-class outcome with computation/editorial provenance and preserve a path to saved, scheduled, and cross-campaign reports. |
| 24 | Manage brand profile/team | Real profile and member provisioning | Comparable mock views | **Staging.** Match fields, roles, validation, and account semantics. |
| 25 | Customize embeds | Extensive real branding handles and live preview | Small subset | **Staging.** Local is missing major parity. |
| 26 | Manage API keys/webhooks | Real developer flows | Replaced by an unsupported Pro teaser | **Staging.** Restore Developer. |
| 27 | Review usage | Real object counts and monthly table | Similar, but different columns and invented plan story | **Staging.** Align definitions. |
| 28 | Review audience/device data | Device/OS/browser on Dashboard | Separate Audience with geo/heatmap/demographic promises | **Progressive Audience area.** Start with verified dimensions; add geography, demographics, cohorts, and overlap under privacy/data-readiness gates. |
| 29 | Search the whole workspace | Not present | Full command search | **Preserve for scale.** Keep list search as the default and activate command search when workspace volume justifies it. |
| 30 | Plan via calendar/key dates | Not present | Full month planner and key-date CTAs | **Keep and simplify.** Make the Home calendar a compact operational planning view with owned date types, filters, and day detail; add external sync later. |

## What makes the best versions best

The best staging workflows are best because they are real, constrained, and understandable:

- Fixed objects and statuses.
- Direct creation validation.
- Real share/embed snippets.
- Clear lifecycle distinction between reversible unpublish and irreversible end.
- Rich branding and developer settings backed by actual controls.

The best local workflows are best because they answer a user's next question:

- “What should I do now?” through attention items.
- “Can I publish?” through readiness checks.
- “What happened?” through a decision-first result summary.
- “Why?” through journey and source context.
- “What next?” through findings, caveats, and a next step.

The redesign should combine staging's verified product truth, the local app's explanatory hierarchy and planning ideas, and the metrics brief's longer-term marketing/decision horizon. None of those sources is sufficient alone.

## Prioritized product risks and opportunities

### P0 — trust, correctness, and core workflow safety

1. **Stale local clock and urgency.** Local “Today” is June 15 during a July 17 audit. Every relative date, alert, and calendar state becomes untrustworthy.
2. **Metrics lack a shared semantic layer.** Define views, responses, participants, completion, engagement, time windows, attribution, and identity before multiplying charts.
3. **Ambiguous points.** Remove bare `+N pts` and lead with the underlying A/B percentages and response count. A percentage-point difference may appear only as secondary explanation with a named metric and baseline. A campaign-level result still needs an explicit decision question.
4. **Unproven confidence presented as fact.** Keep confidence in the product direction, but require a documented method, sample rules, uncertainty display, and provenance before showing a grade.
5. **Recommendations lack provenance.** Distinguish computed, rule-based, and human-authored findings; include evidence and last-updated time.
6. **Missing immutable review.** Users need a final review before content locks.
7. **Undefined lock boundary.** Decide what locks at publish and what locks after the first response.
8. **Immediate destructive removal in staging.** Add confirmation or undo before removing a Polst from a campaign.
9. **Attribution is not yet a system.** Preserve Distribution, but define source identity, UTM precedence, reassignment, cost imports, and historical reporting before trusting comparisons.
10. **Archived dead end.** Replace the empty archived detail with a useful read-only summary and clear Restore/Delete actions.
11. **Metric integrity.** Do not copy staging's 90D/All zero-data bug or impossible started/completed examples.
12. **Privacy and consent are prerequisites.** Audience demographics, geography, cross-Polst behavior, and overlap need collection purpose, retention, consent, and minimum-group rules.

### P1 — future-proof hierarchy and comprehension

13. **Home repeats itself.** Keep the calendar, but combine the attention queue, campaign readiness, dates, and key-date cards into one coherent operational flow.
14. **“Ready to decide” is semantically wrong for active runs.** Use “Target reached; collecting until…” for active and “Results ready” for ended.
15. **Sparklines are ambiguous.** Put each sparkline inside its metric card with explicit delta and comparison window.
16. **Campaign table mixes lifecycle, funnel, target, and interpretation.** Add created/run date range; replace Voters with Started, add the Completed count, rename Completion to Finish rate, remove Result so far, and keep time remaining separate from funnel completion.
17. **Ambiguous Interactions.** Split Likes, Reposts, and Shares when those events are real; otherwise use a defined aggregate with a breakdown.
18. **Oversized Polst detail.** Put outcome and status first; collapse social preview and secondary tables.
19. **Scheduled state under-emphasized.** Make start date/status the dominant hero, not one row in Schedule.
20. **Creation constraints are invisible.** Show required marks and live counters.
21. **Duration complexity needs progressive disclosure.** Use approved fixed presets by default; retain Custom/No end only as explicit advanced or entitled policies once lifecycle semantics are agreed.
22. **No robust campaign review.** Add ordered previews, duration, objective/target summary, lock warning, and confirmation.
23. **Geography needs the right representation.** Use a map for meaningful geographic distribution, a ranked table for precision, and a clear unavailable state when coverage/privacy thresholds are not met.
24. **Roadmap placeholders weaken trust.** Remove visible “Coming soon” demographic cards while keeping those modules in the product horizon.
25. **Notifications need a durable event model.** Start with result-ready, scheduled-start, threshold, integration-failure, and source-anomaly events only when each has a clear owner and CTA.
26. **Global search should scale with the workspace.** Keep the architecture and activate it when object volume makes list-level search insufficient.
27. **Verticals need an understandable taxonomy.** Build on configurable categories/tags or an agreed content taxonomy; do not hard-code unexplained verticals.
28. **Funnels belong near their scope.** Campaign step drop-off belongs on campaign detail; acquisition and account-creation funnels belong in Analytics when identity/attribution data exists.
29. **Reports need two homes.** Attach the immediate report to the ended campaign and preserve a later library for saved, scheduled, shared, and cross-campaign reporting.
30. **QR download is unclear.** Name the actual format and show the destination URL.
31. **Settings need both parity and extensibility.** Restore Developer and full Branding while retaining a connector/module area grounded in real integrations and entitlements.
32. **Public preview comprehension is weak.** The current preview does not make the question and choices easy enough to understand. Correct it through the existing Polst preview component family and `DESIGN.md`, not through a page-specific treatment.

### P2 — design-system and component conformance

33. Treat `DESIGN.md`, existing semantic tokens, and established component APIs as the authority for all visual, responsive, and interaction implementation.
34. Reuse or compose existing components before extending them; extend a component through typed data/state APIs before considering a new component.
35. Require the documented data-structure, interaction, accessibility, or state-model exception described above before creating any new shared component.
36. Keep campaign navigation and Polst references semantically consistent by using the established component family and status vocabulary.
37. Support empty, loading, error, disconnected, partial-data, stale-data, keyboard, focus, screen-reader, reduced-motion, and mobile states as functional requirements.
38. Make export, copy, and download outcomes verifiable and name the artifact created.
39. Explain metric definitions, data freshness, filters, unavailable dimensions, and provenance at the point where a user could otherwise misread the evidence.

## Preserve, simplify, sequence, and retire

### Preserve as product strengths

- The established local design system and stronger product hierarchy; `DESIGN.md` governs their visual expression.
- Local attention-item pattern and campaign readiness checklist.
- Homepage calendar as the operational planning surface.
- Local campaign decision-summary and report structure.
- Local Polst thumbnails, row hierarchy, richer statuses, and contextual empty states.
- Local confirmation patterns and staging lifecycle semantics.
- Distribution/source, Audience, Analytics, Reports, Acquisition, Retention, notifications, search, and integration concepts as a modular product horizon.
- Staging Polst constraints, campaign composition/reorder, share/embed, QR, branding, Developer, and Usage workflows.

### Simplify now

- Home: one attention flow plus one compact calendar; remove duplicate readiness and key-date cards.
- Analytics Overview: reserve it for cross-object comparison; do not repeat Home or object inventories.
- Campaign index: use staging's Started/Completed funnel semantics with the local row hierarchy; remove the interpreted Result so far column.
- Insights: replace the mixed dashboard with a paginated campaign insights index; keep Polst interpretation inside its campaign.
- Reports: campaign-local first; central library only for saved/scheduled/shared reports.
- Distribution: simple source registry and asset management first; advanced attribution after instrumentation.
- Audience: verified device/platform/geography first; no visible roadmap placeholders.
- Settings: working sections first, connector catalog second, honest entitlements throughout.
- Global search: retain the architecture but default to list-level search until scale justifies it.

### Sequence behind data or workflow readiness

- Source assignment/reassignment and spend attribution.
- Optional participant goals and threshold-based alerts. A goal is never a collection limit and should remain on campaign detail rather than the list.
- Confidence intervals, statistical significance, recommendations, and benchmarks.
- External calendar synchronization; the internal Home calendar does not wait on it.
- Demographics, audience overlap, cross-Polst behavior, and fine-grained geography.
- Acquisition, retention, ad-platform, Klaviyo/email, and influencer integrations.
- Scheduled reports, JSON exports, webhooks, and BI connectors.
- Advanced duration policies such as Custom and No end.

These capabilities should use honest states such as “Connect data source,” “Insufficient sample,” “Not collected,” or “Available to eligible workspaces.” They should not appear as populated seeded dashboards before their inputs exist.

### Retire or rename now

- Bare `pts`, `points`, and `+N` result language; show both percentages, metric name, baseline, and sample instead.
- Campaign-list **Result so far**; move all interpretation into campaign Insights.
- Ambiguous **Voters** and **Completion** labels in the campaign list; use **Started**, **Completed**, and **Finish rate**.
- Visible “Coming soon” demographics and other roadmap promises.
- Empty archived Polst detail; replace it with a summary plus Restore/Delete.
- Developer Platform “Pro” teaser that contradicts the available Developer workflow.
- Duplicate Home key-date/readiness blocks around the calendar.
- Seeded recommendations, confidence labels, and plan gates presented as live truth.
- Hard-coded verticals that cannot be configured or explained.

### Add to the foundation

- Campaign created/run date range filters.
- Visible required markers and live character counters.
- A pre-publish review for Polsts and campaigns.
- Explicit lock rules and read-only messaging.
- Confirmation/undo for removing a campaign Polst.
- Compact “Preview as voter.”
- Factual results-first ended state.
- Working Settings parity: Brand Profile, Members, Branding, Developer, Usage.
- Analytics definitions, provenance, freshness, partial-data, disconnected, and privacy-threshold states.
- Shared event, identity, attribution, cost, taxonomy, consent, and clock contracts.

## Proposed future-proof information architecture

The architecture should have a stable core and capability-aware modules. It should not collapse back to staging's four routes, and it should not show every empty future module to every workspace.

### Home

1. Results ready and important changes.
2. Needs attention, each with one concrete CTA.
3. Four to six factual brand metrics with date range and comparison.
4. Compact campaign/Polst status summary.
5. Planning calendar with month/agenda modes, filters, and day detail.

Home answers “What matters now?” It does not attempt to be the full analytics workspace.

### Campaigns

1. Search, status, created/run date range.
2. Factual index columns: Campaign, Status, Polsts, Started, Completed, and Finish rate.
3. Run dates or relative schedule appear beneath the campaign name; finish rate never communicates time remaining.
4. No Result so far column. Result interpretation lives in campaign Insights.
5. An optional participant goal appears only in campaign planning/detail as a non-blocking target, not a collection limit.
6. Detail areas:
   - Overview: objective, status, optional participant-goal progress, key dates, and next action.
   - Composition: ordered Polsts, add, reorder, remove.
   - Analytics: journey, source performance, and per-question factual results.
   - Report: findings, caveats, significance/provenance, share/export.
   - Settings/Lifecycle: dates, publishing, unpublish/end/archive rules.
7. Contextual QR and share/embed.

### Polsts

1. Search, lifecycle filter, created-date range, list/grid, pagination.
2. Consistent thumbnail, title, option labels, status, views, responses, created date.
3. Contextual share, tracked link, and QR.
4. Drafts and Archive as library states.
5. Detail: result/status hero, response split, completion/velocity, relevant source/audience cuts, schedule/lifetime, Preview as voter.
6. Create/edit/review/publish flow.

### Analytics

1. Overview: time comparison and change detection across the workspace.
2. Content: campaigns, Polsts, categories/verticals, topics, and formats.
3. Acquisition: channel/campaign performance, account creation, cost, and paid/organic.
4. Retention: cohorts, repeat engagement, frequency, churn indicators.
5. Insights: paginated campaign-by-campaign findings; each campaign contains its ordered Polst evidence, source context, caveats, next action, and review history.

Only Overview and the dimensions backed by current data need to appear initially. The navigation can expand as modules connect.

### Distribution

1. Sources and attribution health.
2. Tracked links, QR codes, embeds, and destinations.
3. Creator, paid media, email, and partner connections.
4. Spend/manual-input provenance and connector freshness.

Quick creation remains contextual on Campaigns and Polsts; Distribution is the management and comparison workspace.

### Audience

1. Devices/platforms/browser.
2. Geography and activity timing.
3. New versus returning and cohort behavior.
4. Demographics and cross-Polst overlap when privacy-safe and available.

### Reports

Reports are primarily reached from a campaign. A central library becomes useful for saved, scheduled, shared, cross-campaign, and executive reports; it can remain hidden until those workflows exist.

### Settings

1. Brand Profile.
2. Members and access.
3. Branding and embed appearance.
4. Modules & integrations.
5. Developer: API keys and webhooks.
6. Usage, billing, and entitlements.

### Capability-aware navigation

- Home, Campaigns, Polsts, and Settings are always present.
- Analytics appears when the workspace has analyzable activity.
- Distribution appears when tracked assets or a connector exists, with contextual entry points available earlier.
- Audience appears when at least one eligible audience dimension is collected.
- Reports appears as a top-level library only when saved or scheduled reports exist.
- Search and notifications graduate from lightweight controls to global systems as object count and event coverage grow.

## Required review and lock workflow

### Polst

Draft → Edit → Review → Publish/Schedule → Active → Ended → Archive

Review must show:

- Final question and both option labels/images.
- Categories/tags.
- Start and fixed duration.
- Public/embed preview at realistic size.
- Explicit warning: question, options, and images cannot change after publish.
- Back to edit and Confirm publish actions.

### Campaign

Draft shell → Add/reorder Polsts → Set duration → Review → Publish → Active → End → Results

Review must show:

- Campaign name and public URL behavior.
- Ordered Polst thumbnails with question and options.
- Fixed duration and start.
- Missing requirements.
- Exact lock rule.
- Back to edit and Confirm publish actions.

Recommended lock contract for product review:

- Polst content locks on publish.
- Campaign order/composition can change until the first vote, then locks.
- End date may be extended while active but not shortened below “now.”
- Unpublish is reversible and retains data.
- End is irreversible and retains analytics.
- Removing an item always requires confirmation or offers undo.

This recommendation must be confirmed by product and engineering before implementation.

## Data contracts that let the interface grow safely

| Concept | Required definition |
|---|---|
| View | Exactly what event and deduplication window counts as a view? |
| Vote | Per-question choice, campaign participant, or both? |
| Started | Unique participant who submitted the first campaign Polst. A campaign view alone does not count. Define anonymous/account deduplication. |
| Completed | Unique participant who submitted every eligible campaign Polst. Define how skipped, removed, or conditionally hidden questions behave. |
| Finish rate | Completed ÷ Started. This measures participant funnel completion and never represents elapsed campaign time. |
| Engagement | Formula and eligible denominator. |
| Interaction | Exact event types; do not combine unexplained social actions. |
| Dwell | Card-visible time rules and bot/background-tab filtering. |
| Scroll depth | Page or embed scope and aggregation method. |
| Percentage-point lead | Only a single A/B result unless a campaign decision model is defined. |
| Confidence | Sample threshold, statistical method, bias controls, and label boundaries. |
| Recommendation | Deterministic rules or human-authored workflow, provenance, and update timing. |
| Participant goal | Optional planning goal set by a workspace member. It never caps collection or ends a campaign; define whether it affects alerts or decision readiness. |
| Campaign end | Scheduled/manual lifecycle boundary shown separately from Finish rate and participant goal. |
| Source | Creation, attribution parameter, immutability, reassignment, and historical reporting rules. |
| Key date | Origin, ownership, editability, and relationship to campaigns/Polsts. |
| Notification | Event, recipient, deduplication, read state, and CTA. |
| Vertical | Taxonomy, assignment mechanism, and customer value. |
| Report | Generation trigger, editable narrative, export formats, and versioning. |
| Participant identity | Anonymous/account linkage, cross-device rules, reset window, consent, and deletion behavior. |
| New vs returning | Identity basis and lookback window. |
| Account creation | Which event counts and how it is attributed back to a Polst/source. |
| Cost metrics | Spend source, currency/timezone, attribution window, refunds, and formulas for CPC/CPA/eCPC/cost per response. |
| Cohort/retention | Cohort entry event, D1/D7/D30 windows, return event, and timezone. |
| Demographics | Collection source, consent, accuracy, privacy thresholds, allowed breakdowns, and retention. |
| Statistical significance | Test choice, confidence interval, multiple-comparison policy, minimum sample, and stopping rules. |
| Benchmark | Comparison population, eligibility, recency, normalization, and anonymity rules. |
| Integration | Permissions, sync scope, freshness, backfill, failure state, disconnect behavior, and ownership. |

An undefined concept does not need to be deleted from the product model. Its UI should instead remain absent, clearly unavailable, or limited to setup/manual-input states until it can make an honest claim. This distinction lets the architecture remain future-proof without teaching users false metrics.

## Implementation plan

### Phase 0 — establish truth and repair trust

1. Replace the static “today” dependency with a single injectable clock; seed dates relative to it.
2. Add data invariants: completed ≤ started, nonnegative metrics, valid date ranges, consistent campaign/Polst totals.
3. Define core events and metrics in one semantic layer, with tooltips and tests.
4. Replace ambiguous `pts` displays with raw percentages, named comparisons, and sample sizes; give confidence, recommendations, targets, key dates, and verticals defined language and provenance states.
5. Remove visible roadmap placeholders and contradictory seeded plan claims.
6. Add confirmation/undo to campaign Polst removal.
7. Read `DESIGN.md` and complete a component inventory for each affected flow before proposing UI changes; record reuse, composition, or extension choices and the data-structure gap behind any genuinely new component.

Exit criterion: every visible value is factual, manually attributed, or clearly labeled as unavailable/estimated; no screen is internally contradictory; and no implementation begins from a duplicate component or page-specific visual specification.

### Phase 1 — make the verified core excellent

1. Complete Polst create/edit/review/publish and Campaign create/compose/reorder/review/publish.
2. Preserve the local product hierarchy while restoring missing staging capabilities in Branding, Developer, Usage, filters, pagination, and lifecycle; implement all presentation through `DESIGN.md` and existing components.
3. Rebuild the campaign index around Campaign, Status, Polsts, Started, Completed, and Finish rate; remove Result so far and separate run dates from funnel metrics.
4. Keep optional participant goals off the list and define them as non-blocking planning targets.
5. Add compact active/scheduled/draft/ended/archived views and explicit lock rules.
6. Keep share/QR/embed actions contextual and ensure Distribution can inventory the same assets without duplicating their source of truth.
7. Add strong empty, error, loading, stale, and partial-data states.

Exit criterion: a new user can complete both core creation flows, predict what will lock, distribute the result, and understand its factual response data.

### Phase 2 — simplify Home without losing planning

1. Keep the calendar and support useful month/agenda switching.
2. Define date types: campaign run, scheduled Polst, manually owned key date, deadline, and imported event.
3. Combine attention, readiness, and planning into a single non-repetitive flow.
4. Make each event open a concise day/object detail with a direct action.
5. Keep the first viewport focused on current results, attention, and four to six metrics.

Exit criterion: Home answers “what matters today and what is coming next?” without excessive length or duplicate cards.

### Phase 3 — decision-first campaign and Polst analytics

1. Put ended results first and active factual collection status second.
2. Add campaign step journey from real per-step data.
3. Add Polst completion, velocity, time-to-vote/first-response, and eligible source/audience breakdowns.
4. Keep findings, caveats, confidence, and next step only when generated with visible computation or human-authored provenance.
5. Attach the primary report to the ended campaign and define raw/export scopes.

Exit criterion: the UI tells a coherent decision story and lets a reviewer trace every conclusion back to evidence.

### Phase 4 — attribution and marketing performance

1. Define source, channel, campaign, placement, UTM precedence, participant identity, and account-creation attribution.
2. Launch a simple Distribution registry around existing tracked links, QR, and embeds.
3. Add manual spend/creator inputs with clear provenance for pilots.
4. Add paid media, influencer, and email connectors one at a time with freshness and failure states.
5. Introduce acquisition metrics—new/returning, CPC, CTR, CPA, cost per response, paid/organic, and ROI—only where inputs are complete.

Exit criterion: a user can trace a metric from connector/manual input through attribution to a campaign or Polst and explain missing data.

### Phase 5 — audience, retention, and decision intelligence

1. Expand Audience from device/platform into privacy-safe geography, activity timing, new/returning, demographics, and overlap.
2. Add identity-backed D1/D7/D30 retention, repeat engagement, frequency, and churn indicators.
3. Add configurable content/vertical taxonomy and category benchmarks.
4. Build statistical confidence, significance, time-to-significance, rerun comparison, and “what changed” on a reviewed analysis model.
5. Graduate campaign Insights, notifications, and global search when their evidence/state and scale thresholds are met.

Exit criterion: advanced views provide a meaningful, privacy-safe answer—not merely a populated chart—and degrade honestly with insufficient samples.

### Phase 6 — reporting, interoperability, and system conformance

1. Add saved/scheduled/shared reports and cross-campaign report templates.
2. Support explicit CSV/JSON/PDF scopes, API access, webhooks, and later BI connectors.
3. Audit every changed surface against `DESIGN.md`, the semantic token system, and the existing component inventory.
4. Resolve requirements by reuse, composition, or typed extension first; document the exceptional data/state gap for any new component.
5. Test keyboard, focus, screen reader, reduced motion, empty, disconnected, error, loading, partial-data, and mobile states.
6. Verify downloaded and copied artifacts with clear success feedback.

Exit criterion: supported workflows pass desktop, mobile, keyboard, and data-quality-state checks, and exported artifacts match the visible filters and definitions.

## Acceptance workflow checklist

The verified core is not complete until the first 30 workflows pass. Progressive modules must also pass the relevant later checks before they become visible to a workspace. Staging is a comparison point for the core workflows, not the definition of success for new ones.

1. Sign in and sign out.
2. Change dashboard date range and understand deltas.
3. Export dashboard data in each supported format.
4. Find an active Polst by search/filter/date.
5. Switch Polst list/grid view.
6. Create and validate a Polst draft.
7. Review and publish/schedule a Polst.
8. Inspect an active Polst's factual results.
9. Understand and act on a scheduled Polst.
10. Archive and restore a draft.
11. Share a Polst and generate/download its QR.
12. Find a campaign by search/status/date.
13. Create a campaign shell.
14. Add existing and new Polsts.
15. Reorder campaign Polsts.
16. Remove a Polst with confirmation/undo.
17. Review and publish the campaign.
18. Preview the ordered public voter journey.
19. Inspect per-question results and drop-off.
20. Copy campaign link, iframe, and JavaScript embed.
21. Generate/download campaign QR.
22. Unpublish and republish while retaining data.
23. End a campaign with irreversible confirmation.
24. Review an ended campaign's results/report.
25. Edit brand profile.
26. Add a workspace member.
27. Customize embed appearance and preview it.
28. Create/revoke API credentials and configure a webhook.
29. Review usage history.
30. Navigate and complete all supported workflows on mobile and keyboard.
31. Scan the Home calendar, change month/agenda mode, filter event types, and open a day/object detail.
32. Create or edit a manually owned key date and distinguish it from a campaign run or scheduled Polst.
33. Create a tracked source/asset, follow its destination, and understand attribution/freshness state.
34. Connect, fail, refresh, and disconnect an integration without leaving stale metrics presented as current.
35. Trace an acquisition/cost metric back to its source, formula, time window, and missing inputs.
36. Review Audience dimensions with privacy thresholds and a clear unavailable/insufficient-sample state.
37. Inspect a retention cohort and understand its entry event, return event, and date windows.
38. Inspect a confidence/significance result and understand sample, interval, method, and stopping state.
39. Save, schedule, share, and export a report with visible filters, data timestamp, authorship, and version.
40. Use global search and notifications only when the workspace meets their scale/event-readiness thresholds.
41. Filter and search the campaign Insights index, move between its pages, and retain the selected filters and sort.
42. Open one campaign insight and trace every finding through its ordered Polsts, response counts, source context, and caveats.
43. Confirm that a standalone Polst never appears as a workspace Insight unless it becomes part of a campaign.
44. Read the campaign index without help and correctly distinguish Started, Completed, Finish rate, participant goal, and time remaining; confirm no interpreted result appears in the list.
45. Ask a first-time marketer to explain the Decision → Polsts → Distribution → Participation → Evidence → Action loop in under 60 seconds.
46. Confirm that every recommendation or finding exposes its evidence, provenance, limitations, data-through time, and a valid next action.
47. Confirm that changed surfaces use `DESIGN.md`, existing semantic tokens, and existing components; every new component has a documented unsupported data structure and cannot be replaced by composition or a typed extension.
48. Confirm that distribution language describes tracked assets and manual placement without implying that Polst posts, sends, or publishes through external channels.

## Feedback traceability

This plan directly incorporates the supplied feedback:

- “Polst displays too big / waste of real estate” → retain the product requirement for context-appropriate Polst representations; resolve presentation through the existing component family and `DESIGN.md`.
- “Lacks hierarchy or urgency” → prioritize factual result, attention, and lifecycle meaning; resolve its visual expression through `DESIGN.md`.
- “Remove Coming Soon” → remove roadmap placeholders while preserving the underlying Audience roadmap.
- “Hide Custom and No End” → fixed-duration defaults; retain advanced duration policy as a later capability.
- “Robust review page” → mandatory Polst and campaign review workflows.
- “Question too small in social preview” → preview comprehension requirement, implemented through the existing preview components and `DESIGN.md`.
- “Points?” → remove bare points language; show the two percentages and response count first, with a named percentage-point difference only as optional supporting context.
- “Result so far?” → remove it from the campaign index; campaign interpretation belongs in campaign Insights.
- “Voters?” → use Started for unique participants who submitted the first campaign Polst.
- “Completion?” → show Completed as a count and Finish rate as Completed ÷ Started; display time remaining separately.
- “Do we limit voters?” → no hard limit; retain only an optional participant goal on campaign planning/detail if product validation supports it.
- “Interactions?” → define the aggregate and expose its component events, or use the factual components directly.
- “Grid view?” → retain only when the existing component system can provide a useful scan-and-find mode under `DESIGN.md`.
- “Notifications?” → preserve the model and activate only actionable, durable event types.
- “Verticals?” → build on a configurable category/content taxonomy rather than unexplained hard-coded labels.
- “Voter journey useless” → keep only campaign-specific step drop-off.
- “How is campaign result derived?” → no campaign recommendation without a model.
- “Report export” → attach working export to ended campaign result.
- “Key date?” → keep in planning, with visible type, owner, origin, and editability.
- “Scheduled Polst should emphasize start” → scheduled hero.
- “Decision report should be first” → report attached to outcome and result-first hierarchy.
- “Calendar behavior?” → keep it on Home, simplify it, and define month/agenda, filters, event types, and day-detail behavior.
- “QR URL/download?” → show URL and explicit PNG/SVG artifact.
- “Geography needs a map” → require both meaningful geographic pattern recognition and exact accessible values when coverage and privacy thresholds permit it; `DESIGN.md` governs the representation.
- “Character limits missing” → visible counters.
- “Archived Polst makes no sense” → replace the dead-end detail with a useful summary and Restore/Delete.
- “Search too advanced” → keep list search initially and preserve global search as a scale-triggered capability.
- “Teach users how to use Polst” → fixed constraints, review, examples, and next-step language rather than unlimited configuration.

The metric brief is incorporated as a product horizon rather than a literal screen specification:

- Acquisition, paid, influencer, and email ideas → sequenced through Distribution, Analytics, and connector readiness.
- Completion, velocity, time-to-vote, and content performance → progressive Polst and campaign analytics.
- D1/D7/D30, repeat engagement, and churn → identity-backed Retention module.
- Device, geography, demographics, and overlap → privacy-aware Audience module.
- Confidence, significance, benchmarks, and “what changed” → evidence-backed Decision Intelligence.
- CSV/JSON, API, webhooks, and BI connectors → reporting and interoperability platform.

The historical CEO prompt is incorporated even more narrowly: it supplies the decision loop, the expectation that contributing Polsts remain traceable, the distinction between tracked distribution assets and external publishing, evidence-backed interpretation, explicit next actions, decision-record reporting, aggregate audience guidance, and the under-60-second comprehension test. Its route inventory, screen-by-screen layouts, sample data, role model, and visual instructions are not part of this plan.

## Final product principle

Polst should not be “analytics vomit,” but it also should not be constrained to today's staging surface. Every screen or progressive module should answer at least one of five questions:

1. What am I planning or trying to decide?
2. What is collecting or distributing evidence for it?
3. What does the evidence factually show, and how reliable is it?
4. What changed or deserves attention?
5. What is the next valid action?

If an element cannot answer one of those questions honestly today, preserve the concept only when it has a credible future role—and represent it through capability-aware navigation, setup, or unavailable states rather than invented data. Staging supplies the verified foundation; the product plan supplies the direction.
