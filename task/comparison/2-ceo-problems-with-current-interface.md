# What the CEO's problem with the current (staging) interface is

*Sources: `task/misc/call-transcript-overview.txt` (the dashboard review call), `task/misc/proposed-structure.txt`, and the staging audit in `task/staging-dashboard-report.md`. Staging evidence refers to the `*--1-staging.png` screenshots in this folder.*

The CEO's verdict in one line: **"Current system is extremely powerful. Problem: feels enterprise-heavy."** And crucially: **the problem is presentation, not missing metrics** — "There is already enough information." The fixes he asks for are organization, hierarchy, readability, and workflow, not more charts.

## 1. It shows analytics instead of telling a story

The single most repeated instruction: *"Tell a story, not just show analytics."* The experience should read as **current status → what changed → why → what needs attention → recommended next action**, so that *"even a non-technical marketing employee should immediately understand what is happening."*

**Staging evidence:** the Dashboard page (`09-analytics--1-staging.png`) opens on a wall of stat cards and charts with no narrative, no prioritization, and no "so what." Nothing tells the user what to do next.

## 2. The object model is inverted — Campaign must be the primary entity

His rule: **Dashboard = one-glance health. Campaign = heavy analytics. Post (Polst) = minimal, a lightweight building block.** A campaign owns distribution, analytics, attribution, reporting, and optimization; it must work identically with one Polst or many.

**Staging evidence:** staging is Polst-first — the landing page is the Polsts list (`03-polsts-list--1-staging.png`), deep analytics hang off individual Polsts (`04-polst-detail--1-staging.png`), and campaigns (`07-campaign-detail--1-staging.png`) are a thin grouping layer rather than the home of distribution + attribution + reporting.

## 3. Campaign-level analytics leak onto the Dashboard

"Avoid putting campaign-level analytics onto the dashboard." The dashboard should answer *"How are things going?"*; the campaign should answer *"Why?"* — that split is what naturally separates complexity.

**Staging evidence:** `09-analytics--1-staging.png` is exactly this leak — per-campaign and per-poll visualizations dumped onto the top-level Dashboard.

## 4. Pages are too dense

"Spread information across multiple pages… more focused navigation, reduce visual overload, group related metrics." His observation from reviews: **more pages with less information each was preferred.**

## 5. Too many features for V1, and the technical plumbing is in the marketer's face

He wants a subtraction exercise ("What can we remove?", V1/V2/V3), progressive disclosure, and feature-flagged modules per pricing tier. Marketing users *"should never think about APIs"* — they should only see Distribution Channels, Integrations, Devices. The API belongs behind a Pro/Enterprise tier, advertised but locked.

**Staging evidence:** API keys, webhooks, and webhook logs sit as top-level settings tabs in front of a marketing user (`11-settings--1-staging.png` and staging shots 31–33, 45).

## 6. Charts don't answer decisions

"Analytics should always answer a business decision. Not: *here's a chart.* Instead: *based on this chart, you should…*" Every visualization must help answer: continue? stop? change something? what caused this?

## 7. Distribution and attribution are underpowered as a system

He wants **everything treated as a channel** (multiple QR codes for packaging/conference/poster/social, website, email, API, embedded devices), each producing separate attribution that all rolls up into Source Performance — and channels defined **once at the organization level**, then merely selected per campaign instead of recreated every time.

**Staging evidence:** distribution lives in one-off modals per Polst (`10-distribution--1-staging.png`), a single QR per object, no channel library, no cross-campaign source view.

## 8. No planning layer

Nothing in staging answers "what is running when, and what's coming up" — there is no calendar or schedule surface at all (which is why set `02-home-calendar` in this folder has no staging screenshot). The Home direction we've built (greeting, health, what's next, plan-ahead calendar) is the direct answer to this gap and to problem #1.

## Summary — the six main problems, ranked

1. **No story** — analytics dump instead of status → change → why → attention → next action.
2. **Inverted object model** — Polst-first instead of campaign-first.
3. **Wrong altitude** — deep analytics on the dashboard, thin campaigns.
4. **Enterprise-heavy density** — too much per page, technical features exposed to marketers.
5. **No channel/attribution system** — one-off share modals instead of reusable channels rolling up to Source Performance.
6. **No planning layer** — nothing shows the workspace's future.
