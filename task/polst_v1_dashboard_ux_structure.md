don't build actual functional backend this is a mockup only dashboard created to prioritize Ui/UX and be reference/interface ideal for developers.

# POLST V1 Dashboard UX Structure

## Purpose of this document

This document defines the V1 dashboard structure for the POLST brand workspace. It is meant to guide a UI/UX mockup and developer-facing interface reference, not a working product build.

The goal is to create a dashboard that is intuitive, compartmentalized, and action-oriented. The dashboard should not feel like a dense analytics warehouse. It should guide a brand user through what is happening, what is scheduled, what is uncovered, what needs attention, and what to do next.

The working principle is:

> POLST should help brands make fast, defensible decisions backed by real audience signal.

That means the dashboard should not lead with raw analytics. It should lead with operational clarity.

## Source basis

This structure is based primarily on:

- `proposed-structure.txt` as the main working file.
- `polst_investor_overview.md` for the core product thesis and V1 scope.
- `call-transcript-overview.txt` for dashboard philosophy, feature subtraction, channel logic, multiple QR codes, and progressive disclosure.
- `analytics-initial.txt`, `b2b-dashboard.txt`, and `dream-list.txt` as supporting metric inventories.
- The Shopify screenshots as navigation and workflow references, not visual references.

The Shopify screenshots are useful for the following structural patterns:

- A simple sidebar with meaningful parent sections.
- Nested navigation only where the children are truly different work areas.
- A Home page that gives users actionable next steps instead of only charts.
- Compact stats at the top for orientation.
- Cards that guide the user toward setup, growth, recovery, testing, or optimization actions.
- A creation/editing page with a main work area and a right-side operational rail.
- Modals for assigning or attaching sources/activities to a campaign.

The screenshots should not be copied visually. They should inform hierarchy, compartmentalization, and workflow.

---

# 1. Core V1 product framing

POLST V1 should be treated as a guided decision workspace.

The core product loop is:

```text
Intent → Polst → Vote → Decision → Memory
```

Every V1 dashboard feature should support at least one of these jobs:

```text
Create signal
Route signal
Validate signal
Convert signal into a decision
Preserve signal for reporting and memory
```

Features that do not support one of those jobs should be deferred.

## V1 should feel like this

```text
Here is what is active.
Here is what is scheduled.
Here is what is uncovered.
Here is what needs attention.
Here is what you should do next.
Here is where to go if you want deeper analytics.
```

## V1 should not feel like this

```text
Here are 25 charts.
Here are every possible metric and source table.
Here are audience, analytics, reports, team, integrations, API, and enterprise settings all at once.
Good luck figuring out what matters.
```

The dashboard should tell a story. The user should not have to interpret a wall of data before knowing what to do.

---

# 2. Final V1 navigation recommendation

## Primary sidebar

Recommended V1 sidebar:

```text
Home
Campaigns
Polsts
Distribution
Analytics
  Overview
  Insights
  Reports
Settings
```

## Why this structure works

### Home

Home is the action center. It answers:

```text
What is next?
```

### Campaigns

Campaigns are the main decision workspace. Campaigns can contain one or multiple Polsts.

### Polsts

Polsts is for standalone single Polsts. This is useful because V1 includes both campaigns and individual Polsts.

A standalone Polst should not require the user to create a full campaign. It should still be trackable, schedulable, and reportable at a lightweight level.

### Distribution

Distribution manages where signal comes from: channels, QR codes, share links, embeds, influencer links, and source attribution.

### Analytics

Analytics contains deeper performance and interpretation. It should not be the Home page.

Analytics has three children:

```text
Overview = overall performance
Insights = meaning, recommendations, what changed
Reports = exportable summaries and PDF/CSV mockups
```

### Settings

Settings contains account/admin items only.

Settings can include:

```text
Brand Profile
Team, if needed
Billing, if needed
Basic account preferences
```

Team should not be a primary V1 sidebar item unless multi-user workflows are required immediately.

---

# 3. Important navigation rule: statuses are filters, not sidebar items

Active, Scheduled, Drafts, Completed, and Archived should not be left-sidebar subnavs.

They should be filters or tabs inside the relevant page.

For example:

```text
Campaigns page
  Filter chips:
    All
    Active
    Scheduled
    Drafts
    Completed
    Archived
```

Same for Polsts:

```text
Polsts page
  Filter chips:
    All
    Active
    Scheduled
    Drafts
    Completed
    Archived
```

## Why statuses should not be sidebar children

Status filters are not different work areas. They are different views of the same object list.

The left sidebar should answer:

```text
What part of the product am I in?
```

It should not be overloaded with temporary states.

Good sidebar children:

```text
Analytics → Overview
Analytics → Insights
Analytics → Reports
```

Weak sidebar children:

```text
Campaigns → Active
Campaigns → Scheduled
Campaigns → Drafts
Campaigns → Completed
```

Those should stay as in-page filters.

---

# 4. V1 object model

The dashboard should be organized around a small number of V1 objects.

## Primary objects

```text
Brand Workspace
Campaign
Single Polst
Scheduled Event / Moment
Distribution Channel
Source / Attribution Asset
Report
```

## Calendar objects

For the V1 Home calendar, only show these three object types:

```text
Campaigns
Single Polsts
Scheduled Events / Moments
```

Do not put every operational activity on the calendar in V1.

Avoid putting these on the V1 calendar:

```text
QR activation dates
Influencer link dates
Email send dates
UTM changes
Internal analytics events
Source assignment events
Team activity logs
Billing events
API/webhook events
```

Those can appear elsewhere if needed, but not in the V1 Home calendar.

## Terminology note

Use **Scheduled Event** or **Moment** carefully.

A Scheduled Event / Moment means a date-based opportunity, such as:

```text
Super Bowl
World Cup
Eurovision
Holiday
Awards show
Product launch date
Brand event
Conference day
Cultural moment
```

It does not mean an analytics event like `vote_submitted`, `qr_scanned`, or `link_clicked`.

For UI clarity, the better product label is probably:

```text
Scheduled Moments
```

But if the team prefers simpler language, use:

```text
Scheduled Events
```

---

# 5. Home page V1 structure

Home is the most important page in V1.

The Home page should answer:

```text
Okay, what is next?
```

It should not primarily answer:

```text
How many analytics charts can we show?
```

## Recommended Home layout

```text
Home
  1. Compact stats bar
  2. What's Next summary
  3. Calendar overview
  4. Selected day / coverage panel
  5. Action cards
  6. Needs attention
  7. Ready to decide
  8. Recent campaigns and Polsts
```

The calendar should be on the Home page, not hidden only inside Campaigns.

The reason is strategic: users should see an upcoming event or moment, notice it is not covered, and immediately think:

```text
I should create a campaign for that.
```

That makes the Home page proactive rather than passive.

---

## 5.1 Compact stats bar

The stats bar should sit at the top of Home.

It should provide orientation only.

Recommended stats:

```text
Active campaigns
Scheduled items
Responses last 7 days
Ready to decide
Needs attention
```

Optional stats if space allows:

```text
Completion rate
Top source
Open reports
```

Avoid overloading the stats bar. The stats bar should not become the main dashboard.

## Stats bar example

```text
Active Campaigns: 3
Scheduled Items: 6
Responses Last 7 Days: 1,248
Ready to Decide: 2
Needs Attention: 4
```

Each stat should be clickable in the mockup, but clicking only routes to a UI state or page placeholder. It should not query real backend data.

---

## 5.2 What's Next summary

This should be the top action-oriented section.

It can appear above or beside the calendar.

It should summarize the most important next action in plain language.

Examples:

```text
Your next scheduled moment is uncovered.
Create a campaign for Eurovision before Friday.

Two campaigns are ready to decide.
Review the winning direction and export reports.

Your first campaign is drafted but has no distribution.
Add a QR code, share link, or embed before launch.
```

This should not be a generic checklist.

Each card should have:

```text
Title
Reason it matters
Status
Primary action
Optional secondary action
```

Example card:

```text
Create coverage for Super Bowl Sunday
No Campaign or Single Polst is scheduled for this moment yet.

Primary CTA: Create Campaign
Secondary CTA: Create Single Polst
```

---

## 5.3 Home calendar overview

The calendar should be a core Home module.

Recommended structure:

```text
Calendar Overview
  Month / Week toggle, optional for mockup
  Date cells
  Campaign markers
  Single Polst markers
  Scheduled Moment markers
  Coverage status indicators
  Selected day panel
```

For V1, a month view is likely the most useful default because it lets users see upcoming coverage gaps.

A week view can be included as a mock toggle if desired, but it is not required.

## Calendar should show

```text
Campaigns
Single Polsts
Scheduled Events / Moments
```

Each date cell can show a compact count:

```text
2 Campaigns
1 Polst
1 Moment
```

Or a simplified label:

```text
Covered
Uncovered
Active
Scheduled
Completed
```

## Coverage statuses

Use coverage language because it supports action.

Recommended statuses:

```text
Covered
Not Covered
Partially Covered
Active
Scheduled
Completed
```

Definitions:

```text
Covered
A campaign or single Polst is linked to the scheduled moment.

Not Covered
A scheduled moment exists, but there is no linked campaign or single Polst.

Partially Covered
A draft exists, but it is not scheduled or launched yet.

Active
A campaign or single Polst is live on that date.

Scheduled
A campaign or single Polst is planned for that date.

Completed
The date has passed and associated campaign/Polst activity is closed.
```

## Selected day panel

Clicking a day should open a day-detail panel.

This can be a right-side panel, drawer, or card beside the calendar.

Example:

```text
Selected Day: February 9

Scheduled Moments
- Super Bowl Sunday — Not Covered

Campaigns
- Game Day Creative Test — Draft

Single Polsts
- Which halftime concept wins? — Scheduled

Recommended Next Action
- Finish and schedule Game Day Creative Test.
- Or create a single Polst for quick coverage.

Primary CTA: Create Campaign
Secondary CTA: Create Single Polst
```

This is the heart of the Home page story.

---

## 5.4 Action cards

Action cards should feel like Shopify's Home cards structurally: clear, practical, and task-oriented.

They should not look like a generic task checklist.

## New account action cards

For a new account, show cards such as:

```text
Set up your brand profile
Add your brand name, logo, website, and default timezone.
CTA: Complete Profile

Create your first campaign
Turn one decision into a structured campaign with one or more Polsts.
CTA: Create Campaign

Create a single Polst
Ask one visual A/B question without setting up a full campaign.
CTA: Create Polst

Add your first distribution source
Prepare a share link, QR code, or embed so responses are attributed.
CTA: Set Up Distribution

Schedule coverage for an upcoming moment
Pick a date and make sure your brand has a campaign or Polst attached.
CTA: View Calendar
```

## Active account action cards

For an account with activity, show cards such as:

```text
Review a campaign that is ready to decide
This campaign has enough response signal to support a decision.
CTA: Review Insight

Cover an uncovered scheduled moment
There is an upcoming moment on your calendar without a campaign or Polst.
CTA: Create Coverage

Add distribution to a draft campaign
This campaign is scheduled, but no channel is attached yet.
CTA: Add Channel

Generate a report
A completed campaign is ready for a client-ready export.
CTA: Open Report

Check a source performance issue
One source is producing traffic but low completion.
CTA: View Distribution
```

## Card behavior for mockup

Buttons should navigate to relevant mock pages, drawers, or modal states.

They should not perform actual backend actions.

---

## 5.5 Needs Attention

Needs Attention should be a focused list.

Examples:

```text
Scheduled moment is not covered
Campaign starts tomorrow with no distribution
Draft has incomplete Polst options
Campaign has enough responses but no report generated
Active campaign has low completion rate
Single Polst is live but has no share source
```

Each item should include:

```text
Issue
Why it matters
Recommended action
Primary CTA
```

Example:

```text
Campaign starts tomorrow with no distribution
No QR code, share link, or embed has been attached yet.
CTA: Add Distribution
```

---

## 5.6 Ready to Decide

This is where POLST demonstrates value.

Examples:

```text
Packaging Direction Test is ready to decide
Option B leads with enough signal for a directional decision.
CTA: View Insights

Single Polst: Which headline wins?
Option A is ahead, but response volume is still low.
CTA: Keep Running

Flavor Campaign is inconclusive
The vote split is too close. Add another source or extend the campaign.
CTA: Review Recommendation
```

The goal is to connect analytics to action.

---

## 5.7 Recent Campaigns and Polsts

Recent items should be lightweight.

Recommended fields:

```text
Name
Type: Campaign or Single Polst
Status
Scheduled date or active dates
Responses
Readiness / next action
```

Do not show deep charts here.

---

# 6. Campaigns page V1 structure

Campaigns should be a focused list and management page.

It should not duplicate the Home calendar.

The Home page owns the date-based overview. Campaigns owns campaign management.

## Campaigns page layout

```text
Campaigns
  Header
  Create Campaign button
  Search
  Status filters
  Type/date/source filters
  Campaign list/table/cards
  Empty state
```

## Campaign status filters

These are filters, not sidebar subnavs.

```text
All
Active
Scheduled
Drafts
Completed
Archived
```

Add `Scheduled` because the Home calendar requires scheduled campaign states.

## Campaign list fields

Recommended fields:

```text
Campaign name
Decision question
Status
Start date
End date
Linked scheduled moment, if any
Number of Polsts
Responses
Completion rate
Winning direction
Readiness
Needs attention flag
Primary action
```

## Campaign card example

```text
Game Day Creative Test
Decision: Which creative direction should we launch?
Status: Scheduled
Moment: Super Bowl Sunday
Polsts: 3
Primary action: Review Distribution
```

## Campaign page empty state

For a new account:

```text
Create your first decision campaign
Campaigns help you test a decision across one or more visual Polsts, distribute it through your channels, and turn responses into a recommendation.

CTA: Create Campaign
Secondary CTA: Create Single Polst
```

---

# 7. Campaign detail structure

A campaign detail page should have local tabs.

Recommended campaign-level tabs:

```text
Overview
Polsts
Distribution
Insights
Report
Settings
```

Do not put every campaign detail on one page.

Each tab should have one job.

---

## 7.1 Campaign Overview

Question answered:

```text
What is happening in this campaign right now?
```

Recommended compartments:

```text
Decision Summary
Campaign Health
Winning Direction
Signal Readiness
Upcoming / Schedule
Source Snapshot
Audience Snapshot, lightweight only
Next Action
```

## Campaign Overview should include

```text
Campaign name
Decision question
Status
Dates
Linked scheduled moment, if any
Current winning direction
Response count
Completion rate
Confidence/readiness label
Top source
Main caveat
Primary next action
```

## Campaign Overview should not include

```text
Full demographic dashboard
Every source table
Full report builder
Detailed export configuration
Deep audience cohorts
Advanced benchmarks
API/integration settings
```

---

## 7.2 Campaign Polsts tab

Question answered:

```text
Which Polsts are part of this campaign, and how is each one performing?
```

Recommended compartments:

```text
Polst chain overview
Individual Polst cards
Polst order
Status per Polst
Vote split per Polst
Response count per Polst
Completion/drop-off summary
Open Polst Detail action
```

## Polst card fields

```text
Question
Option A
Option B
Status
Responses
Vote split
Completion rate
Drop-off flag
Primary source
Open Detail
```

## V1 rule

Polsts inside a campaign should be visible but not overwhelming. Detailed per-Polst analytics should live in Polst Detail.

---

## 7.3 Campaign Distribution tab

Question answered:

```text
Where is this campaign's signal coming from?
```

Recommended compartments:

```text
Campaign channels
Share links
QR codes
Embeds
Influencer links
Source performance
Attribution assignment
```

## Campaign Distribution should include

```text
Channel name
Source name
Source type
Responses
Completion rate
Vote split
Created date
Status
Primary action
```

## Multiple QR codes

V1 should support multiple QR codes per campaign in the mockup.

Examples:

```text
QR — Packaging
QR — Conference Booth
QR — Poster
QR — Social Graphic
```

Each QR code should appear as a separate attribution source.

Example:

```text
QR — Conference Booth: 120 responses
QR — Packaging: 80 responses
QR — Poster: 40 responses
```

Do not collapse all QR response data into one generic `QR` source.

## Campaign Distribution actions

```text
Create share link
Create QR code
Create embed
Add influencer link
Assign existing source
View source performance
```

For the mockup, these actions can open drawers or modals with fake state. They should not generate real links, real QR images, or real embed code.

---

## 7.4 Campaign Insights tab

Question answered:

```text
What does this campaign mean?
```

Campaign Insights is the interpretation layer.

Recommended compartments:

```text
Recommended decision
Confidence/readiness
Key findings
What changed
Caveats
Recommended next action
```

## Example insight structure

```text
Recommended decision
Option B is currently supported.

Why
Option B leads by 18 points and performs consistently across QR and website traffic.

Confidence
Directional, not final. Response count is below target.

Caveat
Instagram traffic is skewing younger than other sources.

Next action
Keep the campaign open for 24 more hours and increase distribution through email or QR.
```

## V1 AI posture

Do not over-position this as AI in the V1 interface.

Use terms like:

```text
Recommendation
Decision Summary
Key Findings
Confidence
Caveats
```

Avoid making visible AI the core promise of V1.

---

## 7.5 Campaign Report tab

Question answered:

```text
What can I send to a client, manager, founder, or stakeholder?
```

Reports should exist in V1, but lightly.

Do not build a complex report builder in V1.

Recommended Campaign Report sections:

```text
Executive summary
Campaign objective
Decision question
Polsts included
Response summary
Winning direction
Confidence/readiness
Key findings
Source performance
Audience snapshot, if reliable
Caveats
Recommended action
Export PDF mock button
Export CSV mock button
```

For the mockup:

```text
PDF export button = interface only
CSV export button = interface only
No real file generation
No backend report history
```

---

## 7.6 Campaign Settings tab

Question answered:

```text
How is this campaign configured?
```

Settings should contain operational details that should not clutter analytics.

Recommended fields:

```text
Campaign name
Decision question
Status
Start date
End date
Linked scheduled moment
Privacy / visibility
Owner
Archive campaign
Delete campaign, mock only
```

---

# 8. Create Campaign page / wizard

The Shopify Create Campaign screenshot is useful for structure.

The POLST Create Campaign experience should avoid showing analytics panels before the campaign exists. Instead, it should focus on setup and launch readiness.

## Recommended create flow

Use the four-step wizard from `proposed-structure.txt`:

```text
Decision
Build
Distribution
Review
```

This can be a true stepper or a single editing page with sections.

For V1 mockup, either is acceptable, but the hierarchy should remain the same.

---

## 8.1 Create Campaign header

Recommended header elements:

```text
Breadcrumb: Campaigns / Create Campaign
Status pill: Draft
Unsaved changes bar, mock only
Discard button, mock only
Save button, mock only
Preview button, optional
```

The unsaved changes interaction can be mocked visually. It should not persist real data.

---

## 8.2 Main create area

Recommended main content:

```text
Step 1: Decision
  Campaign name
  Decision question
  Business context
  Desired outcome
  Linked scheduled moment, optional
  Start date
  End date

Step 2: Build
  Add Polst
  Add multiple Polsts
  Arrange Polst order
  Question
  Option A
  Option B
  Visual placeholders

Step 3: Distribution
  Select channels
  Create mock share link
  Create mock QR code
  Create mock embed
  Add mock influencer link

Step 4: Review
  Readiness checklist
  Missing items
  Launch mock button
```

---

## 8.3 Create Campaign right rail

The right rail should contain operational context, inspired by Shopify's create/edit page pattern.

Recommended right rail cards:

```text
Status
  Draft / Scheduled / Active / Completed

Schedule
  Start date
  End date
  Linked scheduled moment

Shareable assets
  Mock share link
  Mock QR code count
  Mock embed status

Attribution
  Assigned sources
  Missing source warning

Launch readiness
  Decision complete
  At least one Polst added
  Distribution selected
  Dates set
```

This right rail keeps setup details visible without crowding the main build flow.

---

## 8.4 Create Campaign empty/missing states

The create page should guide users through missing information.

Examples:

```text
No Polsts added yet
Add at least one Polst before launch.
CTA: Add Polst

No distribution selected
Add a share link, QR code, embed, or influencer link before launch.
CTA: Add Distribution

No scheduled moment linked
Optional: attach this campaign to an upcoming moment for calendar coverage.
CTA: Link Moment
```

---

# 9. Polsts page V1 structure

Polsts is for standalone single Polsts.

This page should not become a second Campaigns page.

## Question answered

```text
What standalone Polsts exist, and what is their status?
```

## Polsts page layout

```text
Polsts
  Header
  Create Single Polst button
  Search
  Status filters
  Polst list/table/cards
  Empty state
```

## Polst status filters

These are filters, not sidebar subnavs.

```text
All
Active
Scheduled
Drafts
Completed
Archived
```

## Single Polst list fields

```text
Polst question
Status
Scheduled date
Active dates
Linked scheduled moment, if any
Responses
Vote split
Completion rate
Top source
Primary action
```

## Single Polst actions

```text
Open Detail
Schedule
Add Distribution
View Insight
Generate Report
Archive
```

For mockup, these actions should navigate or open fake UI states only.

---

# 10. Polst Detail page

Question answered:

```text
What happened on this specific Polst?
```

This page can be reached from:

```text
Campaign → Polsts tab
Polsts page
Home calendar selected day
Home recent items
Analytics pages
Reports
```

## Recommended sections

```text
Polst summary
Vote split
Response count
Completion rate
Source breakdown
Device breakdown
Light audience snapshot
Schedule / linked moment
Actions
```

## V1 Polst Detail metrics

Keep this lightweight.

Include:

```text
Total responses
Vote split
Completion rate
Response velocity, optional
Top source
Device split
New vs returning, if available
Broad geography, if reliable
```

Avoid:

```text
Deep demographic dashboard
Income
City-level heatmaps
Audience overlap modeling
Advanced cohort behavior
Predictive intelligence
```

---

# 11. Distribution V1 structure

Distribution is where users manage how response signal gets routed and attributed.

Question answered:

```text
Where does signal come from, and how do we track it?
```

## Distribution page sections

```text
Distribution
  Channels
  QR Codes
  Links & Embeds
  Influencer Links
  Source Performance
```

These can be in-page tabs or sections. They do not all need to be sidebar children in V1.

## 11.1 Channels

Channels are broad distribution types.

Examples:

```text
Website
Email
Instagram
TikTok
QR
Influencer
Event
Embed
```

Channel fields:

```text
Channel name
Scope: global or campaign-specific
Active campaigns using it
Total responses
Completion rate
Status
```

## 11.2 QR Codes

The mockup should support multiple QR codes per campaign.

Fields:

```text
QR name
Campaign or Single Polst
Placement
Status
Responses
Completion rate
Vote split
Created date
```

Example QR names:

```text
QR — Packaging
QR — Conference Booth
QR — Retail Poster
QR — Social Graphic
```

## 11.3 Links & Embeds

Fields:

```text
Asset name
Type: Share link or Embed
Campaign or Single Polst
Status
Responses
Completion rate
Last copied, mock only
```

No real embed code is required for the mockup.

## 11.4 Influencer Links

For V1, influencers should live under Distribution, not as a top-level sidebar item.

Fields:

```text
Creator name
Campaign or Single Polst
Tracked link
Responses
Completion rate
Vote split
Manual notes, optional
```

Do not build influencer benchmarking in V1.

## 11.5 Source Performance

Everything should eventually appear in source performance.

Examples:

```text
Website Embed
Email
Instagram
QR — Packaging
QR — Conference Booth
Influencer — @creatorname
Share Link — Newsletter
```

V1 table fields:

```text
Source
Channel
Linked object
Responses
Completion rate
Vote split
Status
Last activity
```

---

# 12. Assign Sources / Campaign Activities modal

The Shopify `Assign campaign activities` modal is structurally useful.

POLST can use a similar pattern for assigning existing attribution sources to a campaign or single Polst.

## Recommended modal name

```text
Assign Sources
```

or:

```text
Attach Distribution Sources
```

Avoid the phrase `Campaign Activities` unless the team already uses that terminology.

## Modal structure

```text
Assign Sources
  Search field
  Filters
    Channel
    Type
    Source
    Status
  Table
    Checkbox
    Source name
    Channel
    Type
    Linked object
    Last observed
    Responses
  Footer
    Cancel
    Save, disabled until a row is selected
```

## Example rows

```text
QR — Conference Booth | QR | Offline | Unassigned | Today | 0 responses
Website Embed | Website | Embed | Assigned | Yesterday | 42 responses
Instagram Story Link | Social | Link | Unassigned | Jun 29 | 18 responses
Influencer — @creator | Influencer | Link | Assigned | Jun 28 | 34 responses
```

For the mockup, selecting sources should only update the UI state locally or visually. It should not persist anywhere.

---

# 13. Analytics V1 structure

Analytics should be a top-level parent with three children:

```text
Analytics
  Overview
  Insights
  Reports
```

This solves the overlap between Home, Insights, and Reports.

## Clear distinction

```text
Home
What should I do next?

Analytics Overview
How is everything performing overall?

Analytics Insights
What does the signal mean across campaigns and Polsts?

Analytics Reports
What can I export, send, or save?

Campaign Overview
What is happening inside this one campaign?

Campaign Insights
What does this one campaign mean?
```

---

## 13.1 Analytics Overview

Question answered:

```text
How is the workspace performing overall?
```

Recommended sections:

```text
Portfolio stats
Response trend
Campaign performance
Single Polst performance
Source performance
Completion trend
Top and bottom performers
```

Recommended V1 metrics:

```text
Total campaigns
Active campaigns
Total single Polsts
Total responses
Average completion rate
Top source
Ready-to-decide count
Reports generated, mock only
```

This is the appropriate place for overall analytics.

Do not put this full analytics view on Home.

---

## 13.2 Analytics Insights

Question answered:

```text
What does the signal mean, and what should we do?
```

Recommended sections:

```text
Decision-ready items
Watchlist
What changed
Recommendations
Caveats
```

Example insight cards:

```text
Campaign ready to decide
Packaging Direction Test has enough response signal for a directional decision.
CTA: Open Campaign Insights

Uncovered moment
Eurovision is on the calendar, but no Campaign or Single Polst is scheduled.
CTA: Create Coverage

Source issue
QR — Conference Booth has high scans but low completion.
CTA: View Source Performance
```

This page should not duplicate raw stats from Analytics Overview.

---

## 13.3 Analytics Reports

Question answered:

```text
What can I export, send, or save?
```

Reports should exist in V1 because B2B buyers need something defensible to share.

But V1 Reports should be lightweight.

Recommended sections:

```text
Generated reports
Draft reports
Completed campaign reports
Single Polst reports
Export actions
```

Recommended report card fields:

```text
Report name
Linked campaign or Polst
Status
Created date
Last updated
Primary action
```

Report actions:

```text
Preview Report
Export PDF, mock only
Export CSV, mock only
```

No actual PDF/CSV export needs to be built.

---

# 14. Audience in V1

Do not include Audience as a primary sidebar item in V1.

Audience should appear only as a lightweight snapshot inside:

```text
Campaign Overview
Campaign Report
Polst Detail
Analytics Overview, optional summary only
```

## V1 Audience Snapshot

Include only reliable data.

Recommended fields:

```text
Total respondents
New vs returning
Device split
Broad location, if reliable
Age, if actually collected
Source/channel mix
```

Avoid in V1:

```text
Full Audience dashboard
Income
Gender, unless actually collected
City-level geography
Audience overlap modeling
Advanced retention/cohort analysis
```

Audience can become a full section later, but not in the V1 mockup unless the team has a very specific launch use case for it.

---

# 15. Reports in V1

Reports should be included under Analytics.

They should also be accessible from Campaign Detail and Polst Detail.

## Why Reports are useful

POLST is selling decision confidence. A report makes the decision shareable and defensible.

The report should translate signal into a stakeholder-friendly summary.

## V1 report structure

```text
Executive Summary
Decision Question
Campaign or Polst Setup
Response Summary
Winning Direction
Readiness / Confidence
Key Findings
Source Performance
Audience Snapshot
Caveats
Recommended Action
Export Buttons, mock only
```

## V1 report rule

Reports are interface mockups only.

Do not generate real PDFs.
Do not generate real CSVs.
Do not store report history.
Do not connect to email or sharing APIs.

---

# 16. Settings V1 structure

Settings should be minimal.

Recommended sections:

```text
Brand Profile
Workspace Preferences
Team, if needed
Billing, if needed
```

## Brand Profile

```text
Brand name
Logo placeholder
Website
Industry / vertical
Timezone
Default campaign duration
```

## Team

Only include if needed.

If included:

```text
Member list
Role label
Invite user, mock only
Pending invitations, mock only
```

Do not build SSO, advanced permissions, or enterprise roles in V1.

## Billing

Only include if needed for the mockup.

No real payment logic.

---

# 17. Recommended V1 sitemap

```text
POLST Brand Workspace V1

Home
  - Compact Stats Bar
  - What's Next Summary
  - Calendar Overview
  - Selected Day / Coverage Panel
  - Action Cards
  - Needs Attention
  - Ready to Decide
  - Recent Campaigns and Polsts

Campaigns
  - Search
  - Filters: All, Active, Scheduled, Drafts, Completed, Archived
  - Campaign List
  - Create Campaign

  Campaign Detail
    - Overview
    - Polsts
    - Distribution
    - Insights
    - Report
    - Settings

  Create Campaign
    - Decision
    - Build
    - Distribution
    - Review

Polsts
  - Search
  - Filters: All, Active, Scheduled, Drafts, Completed, Archived
  - Single Polst List
  - Create Single Polst

  Polst Detail
    - Summary
    - Vote Split
    - Source Breakdown
    - Lightweight Audience Snapshot
    - Schedule / Linked Moment
    - Report Access

Distribution
  - Channels
  - QR Codes
  - Links & Embeds
  - Influencer Links
  - Source Performance
  - Assign Sources Modal

Analytics
  Overview
    - Portfolio Stats
    - Response Trends
    - Campaign Performance
    - Single Polst Performance
    - Source Performance

  Insights
    - Decision-Ready Items
    - Watchlist
    - What Changed
    - Recommendations
    - Caveats

  Reports
    - Campaign Reports
    - Single Polst Reports
    - PDF Export Mock
    - CSV Export Mock

Settings
  - Brand Profile
  - Workspace Preferences
  - Team, if needed
  - Billing, if needed
```

---

# 18. Home page detailed wireframe structure

This is the most important mockup page.

```text
Home

Header
  - Greeting or workspace title
  - Date range selector, optional mock
  - Create button dropdown
    - Create Campaign
    - Create Single Polst
    - Add Scheduled Moment

Stats Bar
  - Active Campaigns
  - Scheduled Items
  - Responses Last 7 Days
  - Ready to Decide
  - Needs Attention

What's Next
  - Top priority action card
  - Secondary action card
  - Optional setup progress card for new accounts

Calendar Overview
  Left: Month calendar
  Right: Selected Day / Coverage Panel

Selected Day Panel
  - Date
  - Scheduled Moments
  - Campaigns
  - Single Polsts
  - Coverage Status
  - Recommended Action

Action Cards
  - Create coverage for uncovered moment
  - Review ready-to-decide campaign
  - Add distribution to draft
  - Create first single Polst
  - Generate report

Needs Attention
  - Issues with reason and CTA

Ready to Decide
  - Campaigns and Polsts with decision readiness

Recent Items
  - Recent Campaigns
  - Recent Single Polsts
```

## Home page hierarchy

The order should be:

```text
Orient → Plan → Act → Review
```

That means:

```text
Stats orient the user.
Calendar helps the user plan.
Action cards tell the user what to do.
Ready-to-decide and recent items help the user review outcomes.
```

---

# 19. Calendar detailed behavior

## Calendar date cell content

Each date cell should support:

```text
Date number
Campaign marker
Single Polst marker
Scheduled Moment marker
Coverage status
```

Example cell:

```text
Feb 9
Moment: Super Bowl
1 Campaign
Covered
```

Another example:

```text
May 17
Moment: Eurovision
Not Covered
```

## Selected day panel example

```text
May 17

Scheduled Moments
- Eurovision Final — Not Covered

Campaigns
- None

Single Polsts
- None

Recommended Action
Create a campaign or single Polst to cover this moment.

Primary CTA: Create Campaign
Secondary CTA: Create Single Polst
```

## Calendar states

Recommended states:

```text
Empty calendar
Calendar with scheduled moments only
Calendar with campaigns only
Calendar with Polsts only
Calendar with mixed coverage
Selected day with no items
Selected day with uncovered moment
Selected day with covered moment
```

Developers should mock all of these states if possible.

---

# 20. Create dropdown

A global Create button can simplify the experience.

Recommended options:

```text
Create Campaign
Create Single Polst
Add Scheduled Moment
```

For V1 mockup:

```text
Create Campaign → opens Create Campaign page
Create Single Polst → opens Create Single Polst page or modal
Add Scheduled Moment → opens mock scheduled moment form
```

No real saving is required.

---

# 21. Create Single Polst flow

Single Polst creation should be shorter than Campaign creation.

Recommended fields:

```text
Question
Option A
Option B
Visual placeholders
Scheduled date, optional
Linked scheduled moment, optional
Distribution, optional but recommended
Review
```

Recommended page sections:

```text
Build Polst
Schedule
Distribution
Review
```

This should not require the full Campaign wizard.

---

# 22. Scheduled Moment form

Scheduled Moments are date-based opportunities.

Recommended fields:

```text
Moment name
Date
Category / vertical
Region, optional
Description, optional
Recommended action, optional mock text
```

Example:

```text
Moment name: Super Bowl Sunday
Date: February 9
Category: Sports / Culture
Recommended action: Create a campaign or single Polst before this date.
```

For V1 mockup, scheduled moments can be static sample data.

No external event APIs are required.

---

# 23. Empty states

Empty states are critical because POLST is a new platform.

New users need guidance.

## Home empty state

```text
Welcome to your POLST workspace
Start by creating a campaign, launching a single Polst, or adding a scheduled moment to your calendar.

Primary CTA: Create Campaign
Secondary CTA: Create Single Polst
```

## Campaigns empty state

```text
No campaigns yet
Campaigns help you test a bigger decision across one or more Polsts.
CTA: Create Campaign
```

## Polsts empty state

```text
No single Polsts yet
Create a quick visual A/B question without setting up a full campaign.
CTA: Create Single Polst
```

## Distribution empty state

```text
No distribution sources yet
Add a share link, QR code, embed, or influencer link so responses can be attributed.
CTA: Add Source
```

## Analytics empty state

```text
No analytics yet
Launch a campaign or single Polst to start collecting response signal.
CTA: Create Campaign
```

## Reports empty state

```text
No reports yet
Reports become available after a campaign or Polst has response signal.
CTA: View Campaigns
```

---

# 24. Mock data requirements

The mockup should include enough fake data to demonstrate the workflow.

## Recommended fake data set

```text
3 campaigns
  - 1 active
  - 1 scheduled
  - 1 completed

4 single Polsts
  - 1 active
  - 1 scheduled
  - 1 draft
  - 1 completed

5 scheduled moments
  - 2 covered
  - 2 not covered
  - 1 partially covered

6 distribution sources
  - Website Embed
  - QR — Packaging
  - QR — Conference Booth
  - Instagram Story Link
  - Influencer — @creatorname
  - Share Link — Newsletter

3 reports
  - 1 campaign report ready
  - 1 single Polst report ready
  - 1 draft report
```

## Fake campaign examples

```text
Game Day Creative Test
Status: Scheduled
Moment: Super Bowl Sunday
Polsts: 3
Next action: Add distribution

Packaging Direction Test
Status: Active
Moment: None
Polsts: 2
Next action: Review source performance

Flavor Launch Recap
Status: Completed
Moment: Product Launch Week
Polsts: 4
Next action: Export report
```

## Fake single Polst examples

```text
Which headline wins?
Status: Active
Responses: 428
Next action: View insight

Which packaging color feels more premium?
Status: Scheduled
Moment: Product Launch Week
Next action: Add QR

Which event hook should we use?
Status: Draft
Moment: Eurovision
Next action: Finish Polst
```

## Fake scheduled moments

```text
Super Bowl Sunday — Not Covered
Eurovision Final — Partially Covered
Product Launch Week — Covered
Back-to-School Window — Not Covered
Conference Day 1 — Covered
```

---

# 25. Mockup-only development rules

This is critical.

The V1 mockup should not include real backend functionality.

## Do build

```text
Static routes
Clickable navigation
Mock cards
Mock tables
Mock charts or placeholders
Mock calendar
Mock drawers
Mock modals
Mock selected states
Mock empty states
Mock loading states, optional
Mock export buttons
Mock save/discard bars
```

## Do not build

```text
Database
Authentication
Real user accounts
Real campaign creation
Real Polst creation
Real QR generation
Real PDF export
Real CSV export
Real analytics processing
Real event ingestion
Real integrations
Real API calls
Real file uploads
Real team invitations
Real billing
Real scheduled jobs
Real webhooks
Real persistence beyond local UI state
```

## Acceptable mock behavior

```text
Buttons can route to pages.
Buttons can open modals.
Forms can show filled states.
Save buttons can display a fake success toast.
Calendar days can show static sample items.
Filters can visually change selected chips.
Tables can show static filtered examples if simple.
```

## Not acceptable for this phase

```text
Building the backend because the UI implies data.
Connecting calendar to real external events.
Generating actual QR codes.
Exporting actual PDFs.
Persisting created campaigns in a database.
Requiring login/auth to view the mockup.
```

---

# 26. What should be deferred out of V1

Do not include these as functional V1 features:

```text
Full Audience dashboard
City-level geography
Income demographics
Advanced gender demographics unless collected
Audience overlap modeling
Influencer tier benchmarking
Ad platform API integrations
CRM integrations
Salesforce
SSO
Advanced team roles
BI connectors
Webhook/API dashboards
Predictive intelligence
Complex AI recommendations
Full report builder
Automated external event ingestion
Real trend provider integrations
```

Some of these can be represented as disabled or future placeholders only if needed for stakeholder context, but they should not be central to the V1 mockup.

---

# 27. Page-by-page compartmentalization summary

## Home

```text
Purpose: Tell the user what is next.
Primary modules: Stats, calendar, coverage, action cards, attention items.
Depth: Shallow.
```

## Campaigns

```text
Purpose: Manage campaign objects.
Primary modules: Search, filters, list, create campaign.
Depth: Medium.
```

## Campaign Detail

```text
Purpose: Understand and manage one campaign.
Primary modules: Overview, Polsts, Distribution, Insights, Report, Settings.
Depth: Deep.
```

## Polsts

```text
Purpose: Manage standalone single Polsts.
Primary modules: Search, filters, list, create single Polst.
Depth: Medium.
```

## Polst Detail

```text
Purpose: Understand one Polst.
Primary modules: Vote split, responses, source breakdown, schedule, report.
Depth: Medium.
```

## Distribution

```text
Purpose: Manage response routing and source attribution.
Primary modules: Channels, QR codes, links, embeds, influencer links, source performance.
Depth: Medium.
```

## Analytics Overview

```text
Purpose: Show overall performance.
Primary modules: Portfolio stats, trends, source performance.
Depth: Medium.
```

## Analytics Insights

```text
Purpose: Explain what the signal means.
Primary modules: Decision feed, watchlist, what changed, recommendations.
Depth: Medium.
```

## Analytics Reports

```text
Purpose: Preview and export stakeholder summaries.
Primary modules: Report list, preview, PDF/CSV mock buttons.
Depth: Medium.
```

## Settings

```text
Purpose: Manage workspace basics.
Primary modules: Brand profile, preferences, team/billing if needed.
Depth: Low.
```

---

# 28. V1 acceptance criteria

The mockup is successful if a stakeholder can open it and understand:

```text
What POLST is for.
What is active.
What is scheduled.
Which upcoming moments are covered or uncovered.
How to create a campaign.
How to create a single Polst.
Where distribution sources live.
Where multiple QR codes live.
Where analytics live.
Where insights live.
Where reports live.
Why Home is action-oriented instead of analytics-heavy.
```

The mockup is not successful if:

```text
Home becomes a chart dump.
Statuses become sidebar clutter.
Audience becomes a full V1 section without reliable data.
Reports become a complex builder.
The calendar becomes a full event-management product.
Developers start building backend functionality instead of UI structure.
```

---

# 29. Final V1 recommendation

Build the V1 dashboard mockup around this story:

```text
Home tells the user what is next.
The calendar shows what is scheduled and what is uncovered.
Campaigns manage multi-Polst decision initiatives.
Polsts manage standalone single-question decisions.
Distribution shows where signal comes from.
Analytics explains performance, meaning, and reports.
Settings stays minimal.
```

The strongest structural decision is to keep Home action-first and put the calendar directly on Home. That lets the user see upcoming moments, identify coverage gaps, and immediately create a Campaign or Single Polst.

The second strongest structural decision is to make Active, Scheduled, Drafts, Completed, and Archived into in-page filters, not sidebar subnavs.

The third strongest structural decision is to place Insights and Reports under Analytics, so Home does not become confusing or duplicative.

The fourth strongest structural decision is to include Polsts as a separate V1 workspace only for standalone single Polsts, while keeping campaign Polsts inside Campaign Detail.

The fifth strongest structural decision is to keep Audience out of primary V1 navigation and use lightweight audience snapshots only where they support a decision.

---

# 30. Developer handoff checklist

Use this checklist before building the mockup.

## Navigation

```text
[ ] Sidebar includes Home, Campaigns, Polsts, Distribution, Analytics, Settings.
[ ] Analytics has nested children: Overview, Insights, Reports.
[ ] Campaign status filters are in-page filters, not sidebar items.
[ ] Polst status filters are in-page filters, not sidebar items.
```

## Home

```text
[ ] Home includes compact stats bar.
[ ] Home includes What's Next section.
[ ] Home includes calendar overview.
[ ] Calendar shows Campaigns, Single Polsts, and Scheduled Moments only.
[ ] Selected day panel shows coverage status and recommended action.
[ ] Home includes action cards, not only charts.
```

## Campaigns

```text
[ ] Campaigns page includes list/search/filter structure.
[ ] Campaigns page includes Create Campaign CTA.
[ ] Campaign detail has Overview, Polsts, Distribution, Insights, Report, Settings.
[ ] Create Campaign uses Decision, Build, Distribution, Review.
```

## Polsts

```text
[ ] Polsts page is for standalone single Polsts.
[ ] Polsts page includes list/search/filter structure.
[ ] Polst Detail shows vote split, responses, source breakdown, and schedule.
```

## Distribution

```text
[ ] Distribution includes Channels, QR Codes, Links & Embeds, Influencer Links, Source Performance.
[ ] Multiple QR codes per campaign are represented.
[ ] QR codes appear as separate attribution sources.
[ ] Assign Sources modal is mocked.
```

## Analytics

```text
[ ] Analytics Overview is for overall performance.
[ ] Analytics Insights is for recommendations and decision feed.
[ ] Analytics Reports is for report preview and mock exports.
```

## Mockup-only boundaries

```text
[ ] No backend.
[ ] No database.
[ ] No auth.
[ ] No real QR generation.
[ ] No real PDF export.
[ ] No real CSV export.
[ ] No integrations.
[ ] No external calendar/event APIs.
[ ] No real persistence.
```

don't build actual functional backend this is a mockup only dashboard created to prioritize Ui/UX and be reference/interface ideal for developers.
