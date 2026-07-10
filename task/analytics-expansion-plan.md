# Analytics Expansion Plan — mapping the dream list into the dashboard

*Sources: `task/misc/dream-list.txt` (the consumer-marketing lead's requests), `task/misc/b2b-dashboard.txt` / `analytics-initial.txt` (brand-facing asks), `task/misc/call-transcript-overview.txt` (the CEO's placement rules). Current IA verified against `src/pages/*` as of this writing.*

---

## 1. Reading the dream list correctly

The dream list is written by the **consumer-marketing lead about growing the Polst app itself** — the micro-influencer and paid-media pilots, future email program, and user retention. That gives every line item one of two natures:

- **Universal decision-marketing metrics** — channel performance, funnel drop-off, vote split, time-to-vote, share rate, demographics, creator-level performance. Every brand workspace wants these. They map into the existing IA.
- **Consumer-growth metrics** — account creation rate, CPA per signup, paid-vs-organic spend, email list growth, unsubscribe rate, push-notification returns, D1/D7/D30 cohorts. These matter to *Polst's own workspace* (dogfooding the dashboard) and eventually to enterprise brands with ad budgets — but they must not bloat a small brand's V1 view.

**Resolution: one system, flag-gated modules** — exactly the CEO's rule ("entire modules should be controlled via feature flags; different brands can have different feature availability"). Universal metrics ship in the shared surfaces. Growth metrics ship as two gated modules — **Acquisition** and **Retention** — on for Polst's own workspace first, sellable as tier upgrades later. Nothing gets a second dashboard; nothing gets invented navigation.

## 2. The placement contract (where any metric is allowed to live)

Every metric attaches to **the object whose owner can act on it**. The altitude rules, extended from the CEO's notes:

| Surface | Question it answers | What's allowed |
|---|---|---|
| **Home** | "How are things going?" | Portfolio-level stats, what changed, what needs attention. Never per-campaign charts. |
| **Campaign detail** | "Why? And what should I do?" | Everything about one decision: funnel, split, sources, insights, report. The deep end. |
| **Polst detail** | "How is this one card doing?" | Minimal: live preview, summary numbers, source breakdown. A building block, not a report. |
| **Analytics** | "How does the whole workspace perform over time?" | Cross-campaign trends, comparisons, funnels, retention. |
| **Distribution** | "Where does signal come from, and what do I hand out?" | Channels, assets, **Source Performance** (the CEO's canonical attribution home), creator links. |
| **Audience** | "Who answers us?" | Composition, demographics, interests, returning behavior. |
| **Settings → Integrations** | "What feeds the data?" | GA4/UTM, ad platforms, email provider — named as integrations, never as APIs. |

Two hard rules on top: **a metric appears in exactly one canonical place** (other surfaces may summarize and link to it, never duplicate it), and **no chart ships without the decision it answers** (continue / stop / change / what caused this).

## 3. The map — every dream-list item, placed

Phases follow the CEO's roadmap: **P1 critical, P2 useful, P3 advanced.** Items the author starred as complex (*) are P3 unless noted. "⚑" marks flag-gated module content.

### 3.1 Acquisition → gated module: **Analytics › Acquisition** ⚑

| Ask | Where it goes | Phase |
|---|---|---|
| New vs returning ratio by channel/campaign | Analytics › Acquisition — trend + channel table (summary tile on Audience links here) | P1 ⚑ |
| Account creation rate (% engagers → registered) | Analytics › Acquisition — headline stat + funnel step | P1 ⚑ |
| Account creation by source | Distribution › Source Performance gains a "Signups" column when module is on | P1 ⚑ |
| Channel CPC / CTR / cost per new user | Analytics › Acquisition — channel economics table | P2 ⚑ |
| Cost per account (CPA) by channel/campaign | Same table, CPA column | P2 ⚑ |
| Paid vs organic split | Analytics › Acquisition — one stacked MixBar, all views | P1 ⚑ |
| Campaign-level ROI (spend vs accounts + engaged) | Campaign detail › Overview gains an ROI row *only when the workspace has spend data* | P2 ⚑ |
| Campaign frequency before conversion * | Analytics › Insights, as a finding — not a chart | P3 ⚑ |
| Influencer × paid audience overlap * | Analytics › Insights, as a finding | P3 ⚑ |

### 3.2 Paid media → **Distribution channel type + Integrations**

| Ask | Where it goes | Phase |
|---|---|---|
| Meta / TikTok / LinkedIn + GA4/UTM integration * | Settings › Integrations (connect cards); data lands in Source Performance | P2 ⚑ |
| Creative-format performance by channel * | Campaign detail › Distribution — per-creative rows under the paid channel | P3 ⚑ |
| UTM + vertical filters on all views from day one | **Global filter bar** on Analytics, Audience, Distribution: date · channel · campaign · vertical. This is infrastructure, not a page. | **P1** |

### 3.3 Influencer → **Distribution › Influencers** (already half-built; the pilots are live, so this is P1)

| Ask | Where it goes | Phase |
|---|---|---|
| Creator-level clicks, CTR, effective CPC | Distribution › Influencer links table gains CTR + eCPC columns; row opens a creator detail | P1 |
| Manual story-view input | Creator detail — editable "story views" field (the one manual-entry cell in the product) | P1 |
| Tier benchmarking (10–25k / 25–50k / 50–75k) | Distribution › Influencer tier benchmarking (exists — keep) | P1 |
| Per-campaign creator performance | Campaign detail gains the **Influencers tab** (in `proposed-structure.txt`, currently missing from the six tabs) | P1 |

### 3.4 Email → **Distribution › Channels › Email** (channel drill-down pattern)

Every channel row in Distribution opens a detail page; Email is the first full one. This creates the pattern paid/QR/embed details reuse.

| Ask | Where it goes | Phase |
|---|---|---|
| Open rate by campaign type & segment | Email channel detail — performance table | P2 |
| CTR back into product | Same table; summarized in Source Performance | P2 |
| Click-to-conversion rate | Same table | P2 |
| Unsubscribe rate by campaign type | Same table, health column | P2 |
| List growth rate by source | Email channel detail — trend card | P2 ⚑ |

### 3.5 Engagement & product behavior → **Analytics › Overview + Campaign/Polst detail** (mostly universal, mostly P1)

| Ask | Where it goes | Phase |
|---|---|---|
| Completion rate + drop-off by vertical | Campaign detail › Overview funnel (exists); Analytics › Overview gains a compact cross-campaign funnel with the vertical filter | P1 |
| A/B vote split per poll | Polst detail (exists — the card itself shows it; that's show-don't-tell) | done |
| Time-to-vote | Polst detail › Summary row; campaign Overview shows the median | P1 |
| Vertical performance side-by-side | Analytics › Overview — the global vertical filter + one comparison table row-per-vertical | P1 |
| Content-level performance (topics/hooks) | Analytics › Insights — "what's working" findings | P2 |
| Share / virality rate by vertical | Polst detail › Summary + Analytics › Overview column | P2 |
| Session depth (polls per session) | Audience › Engagement trend card gains "polls per session" stat | P2 ⚑ |

### 3.6 Retention → gated module: **Analytics › Retention** ⚑

| Ask | Where it goes | Phase |
|---|---|---|
| D1 / D7 / D30 by acquisition channel | Analytics › Retention — cohort grid (new component) | P2 ⚑ |
| Repeat engagement (% voting again, frequency) | Analytics › Retention headline stats; brand-safe version ("returning respondents") already on Audience | P1 (Audience) / P2 (module) |
| Churn indicators (gone-quiet actives) | Home › What's next feeds from this ("audience cooling" alert); detail lives in Retention | P2 ⚑ |
| Notification engagement (push/email returns) | Analytics › Retention — return-path table | P2 ⚑ |
| Conversion events after voting (signup, share, return) * | Analytics › Retention — post-vote actions funnel | P3 ⚑ |
| Feature usage by cohort * | Analytics › Retention | P3 ⚑ |

### 3.7 User journey & behavior → **Analytics › Insights** (findings, not new pages)

| Ask | Where it goes | Phase |
|---|---|---|
| Journey mapping first-touch → account * | Analytics › Insights — narrative finding with a small path viz; never a raw sankey dump | P3 ⚑ |
| Peak engagement times (days/hours, best send times) | Analytics › Overview — "best time" callout card; email detail repeats send-time slice | P2 |
| Traffic quality (bounce, time-on-site) | Distribution › Source Performance — quality columns | P2 |
| Funnel drop-off by channel & creative | Campaign detail › Overview funnel gains a "by source" toggle | P1 |

### 3.8 Audience → **Audience page** (exists; extend)

| Ask | Where it goes | Phase |
|---|---|---|
| Age, device, OS, geo with US/non-US split | Audience › Demographics (age/device exist; add OS slice and the US/non-US toggle; geography stays gated per proposed-structure: regional P2, city P3) | P1–P2 |

## 4. What this actually adds (the complete build list)

**New surfaces (4):**
1. **Analytics › Acquisition** ⚑ — signups, CPA, paid/organic, channel economics.
2. **Analytics › Retention** ⚑ — cohort grid, repeat engagement, churn, return paths.
3. **Distribution › channel detail** — one template (header stats, performance table, assets); Email first, paid/QR/embed reuse it.
4. **Distribution › creator detail** — per-creator performance + manual story views.

**Extended surfaces (5):** Campaign detail gains the **Influencers tab** and funnel "by source" toggle; Analytics Overview gains the vertical comparison + compact funnel + best-time card; Audience gains OS/US-split and session depth; Source Performance gains signups/quality columns; Home's What's next learns to surface churn/attention alerts (it renders them, the module computes them).

**Infrastructure (2):** the **global filter bar** (date · channel · campaign · vertical — P1, day one per the request) and the **feature-flag module system** (Acquisition/Retention on for Polst's workspace, off by default elsewhere).

**New kit components (3, reused everywhere):** a **line/trend chart** with comparison period and real tooltips (Response trend, engagement trend, list growth, AOV-style trends — the current Sparkline/BarChart can't do comparisons), a **cohort grid** (Retention), and a **connect-integration card** (Settings). Journey path viz is P3 — do not build it early. Everything else (StatTile, DataTable, MixBars, Funnel) already exists and must be reused, not duplicated.

## 5. Data reality (what feeds each phase)

- **P1** needs only what Polst already produces: votes, sessions, sources/UTM, creator links, verticals — plus the one manual field (story views).
- **P2** needs connections: GA4/UTM import, email provider, ad platforms — all presented in **Settings › Integrations** as marketer-named connect cards. The words API/webhook never appear outside the developer section, which stays enterprise-gated.
- **P3** needs identity stitching across touches (journey mapping, overlap, frequency capping) — genuinely complex, which is why the author starred them; they enter as **Insights findings** first (a sentence with confidence, not a dashboard) so the product can say something useful before the plumbing is perfect.

## 6. Guardrails (carried from the CEO's notes, applied to this plan)

1. **No metric without a decision.** Each new card names its action in the design doc before it's built: churn card → "re-engage or let the campaign end"; CPA table → "shift budget between channels"; drop-off funnel → "shorten the chain / change the hook."
2. **Summaries link, never duplicate.** Home and Audience may show one number from a module; the chart lives in the module.
3. **More pages, less each.** Acquisition and Retention are separate tabs precisely so Analytics Overview stays a one-glance surface.
4. **Show, don't tell.** New surfaces get real (mock) data and empty states that invite the connect action — no explainer paragraphs.
5. **Flags are product truth.** A workspace without the Acquisition module never sees a locked-out ghost page; the nav item simply isn't there. (LockedCard is for teaser-tier items only, e.g. Income demographics.)

## 7. Build order

| Phase | Ships |
|---|---|
| **P1** | Global filter bar · Influencers tab (campaign) · creator detail + manual story views · time-to-vote + drop-off by source · vertical comparison · Audience OS/US split · Acquisition tab v1 (signups, by-source, paid/organic) ⚑ |
| **P2** | Trend-chart component · Email channel detail (the drill-down template) · Retention tab (cohort grid, churn → Home alerts) ⚑ · Integrations connect cards · Source Performance quality/signup columns · best-time card · share rate · session depth |
| **P3** | Everything starred: journey mapping, audience overlap, campaign frequency, creative-format performance, post-vote conversion events, cohort feature usage — each entering as an Insights finding before it earns a chart |
