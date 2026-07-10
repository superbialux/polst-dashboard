# POLST Investor Overview — Product Truth, MVP Scope, and Platform Shape

## Reading stance

This is a CEO-level product overview for a knowledgeable investor/advisor with light development context. It intentionally avoids page-by-page dashboard requirements, code implementation, design direction, code structure, navigation, or detailed feature specifications.

The purpose is to explain what POLST is, what the MVP is trying to prove, how the customer and brand sides relate to each other, and where the real risks still are.

## Source basis

This overview is based on the uploaded POLST PDFs, with the following hierarchy:

1. **POLST Source of Truth — Current MVP v2** governs product scope, launch priority, positioning, and what ships when.
2. **POLST MVP Definition & Execution 2.0** supports deeper execution logic but is not used here for code-level or implementation detail.
3. **AskEverythingDecisions_May82026** and **Discussion Questions May 2 2026** clarify locked decisions, conflicts, and remaining open questions.
4. **Polst Master Internal Outline 3.28.26** explains the broader architecture and the public/private operating model.
5. **Polst Overview 4.0** is treated as positioning context, not as the governing MVP scope.

Where the documents conflict, this overview follows the active source-of-truth and the later locked decisions.

---

## 1. What POLST is

POLST is a real-time decision engine.

The simplest version: POLST lets someone ask a visual A-or-B question, collect structured audience input, and convert that input into a clearer decision.

It is not a generic polling app. It is not a long-form survey product. It is not a social network. It is not a comments product. It is not a creator marketplace. It is not a crypto or rewards product. It is not a generic analytics dashboard.

The company should not sell “polls.” It should not sell “engagement.” It should not sell “dashboards.” The commercial claim is narrower and more valuable: **fast, defensible decisions backed by real audience signal.**

That distinction matters. If POLST becomes a prettier polling tool or a lightweight SurveyMonkey clone, the company loses the point of the product. The core product is not the vote itself. The core product is the decision that follows from structured, trusted participation.

---

## 2. Core product loop

The active operating loop is:

**Intent → Polst → Vote → Decision → Memory**

That loop is the MVP filter.

A feature belongs in the MVP only if it helps create signal, route signal, validate signal, convert signal into a decision, or preserve signal so it becomes reusable. Anything outside that loop should be deferred unless it is needed for launch safety, billing, or basic operations.

What this means in plain terms:

- **Intent:** Someone has a question that matters.
- **Polst:** The question is reduced into a simple structured choice.
- **Vote:** An audience responds with low friction.
- **Decision:** The system returns a clear, directional, or inconclusive outcome.
- **Memory:** The result persists and can compound through SEO, canonical aggregation, campaign history, and future comparison.

The MVP succeeds only if this loop works in the wild, not just in a demo.

---

## 3. The atomic Polst

The atomic unit is a binary visual decision object.

The default Polst is:

- one question,
- two visual answer options,
- one-tap voting,
- results after voting,
- a path to continue or share.

This simplicity is not a design preference. It is a product constraint. The fewer decisions required from the voter, the more likely POLST can collect broad participation and preserve clean structured data.

Current behavioral rules:

- Guests should be able to vote before being forced to register.
- Users vote once; vote changes are excluded from V1.
- Public Polsts default to a short active lifespan, currently three days.
- Brands can have configurable campaign durations.
- After voting starts, the meaning of the Polst should not be changed.
- Closed public Polsts remain shareable and can continue to contribute to SEO and opinion memory where eligible.

The atomic Polst has two jobs at the same time: it is a consumer engagement unit and a structured data unit.

---

## 4. One platform, two sides

POLST has one underlying platform and two operating sides:

1. **Customer side:** the public, social-media-like POLST experience where people vote, create, share, follow, discover, and return.
2. **Brand side:** the business-facing workspace where brands launch decision campaigns, distribute Polsts through existing channels, and receive decision output.

These are not separate products pretending to share a logo. They are two operating modes of the same system.

The customer side creates participation, public memory, SEO surface area, creator distribution, and cultural relevance. The brand side monetizes decision clarity using the same underlying mechanics: simple choices, verified responses, attribution, confidence, and memory.

The hard strategic requirement is that both sides reinforce the same loop. If the customer side becomes pure social entertainment without decision value, it weakens the brand side. If the brand side becomes heavy enterprise analytics without public participation and distribution, it loses the organic engine.

---

## 5. Customer side overview: public, social-media-like POLST

The customer side is the public participation layer.

It should feel familiar to users because it borrows from social-media behavior: scrolling, voting, sharing, following topics, following creators, saving, and discovering related content. But it is not a full social network in V1.

The point is not to build another feed app. The point is to make structured opinion collection feel native, fast, and repeatable.

### What users can do

Guests can land on a Polst from search, social, QR, email, a website, an embed, or an influencer link; vote without an account wall; see the result; continue to another Polst; and share.

Registered users can create Polsts, vote, share, follow topics, follow creators, save Polsts, and maintain a public profile.

Creators and influencers can create and distribute Polsts through their normal channels. In V1, creators are primarily distribution partners and supply generators, not the main payer and not the center of a marketplace.

### What the customer side must prove

The customer side must prove that people will not only vote once, but continue voting, create Polsts, share Polsts, and come back through topics, creators, notifications, search, or external links.

The investor should view this side through four questions:

1. Do users understand the Polst format instantly?
2. Do they vote without friction?
3. Do they continue after seeing a result?
4. Do they create or share enough to expand supply and distribution?

### What the customer side is not in V1

The V1 customer side should not include a full friend graph, DMs, comments, contact import, creator payouts, a creator marketplace, rewards wallets, streak-driven gamification, or a heavy social graph.

This is important. “Social-media-like” means the product uses familiar participation and discovery patterns. It does not mean V1 should become a social network.

---

## 6. Brand side overview: campaign dashboard for decisions

The brand side is the revenue side.

A brand comes to POLST because it has a decision to make before committing spend, reputation, inventory, creative direction, pricing, product direction, event strategy, or campaign strategy.

The brand side should let a brand define an intent, launch a structured campaign or chain of Polsts, distribute it through channels the brand already controls, collect responses, and receive a decision summary. The commercial output is not “here are your charts.” The commercial output is “here is what the audience signal supports, with confidence and caveats.”

### What brands are buying

Brands are buying speed and defensibility.

They are not buying a dashboard for its own sake. They are not buying impressions. They are not buying social likes. They are paying because POLST can turn their existing channels into a real-time decision system.

### Brand operating reality at launch

The current launch posture is not open self-serve brand sign-up. The top of funnel is a lead form and admin-set credentials. After onboarding, brands can operate in the dashboard with customer-success support.

The launch version assumes one user per brand account. Multi-seat enterprise workflows, SSO, CRM integration, advanced roles, and full BI-style depth are not V1.

This is the right constraint. V1 should prove that brands will pay for decision clarity before the team invests in enterprise breadth.

### Brand campaigns vs. public Polsts

Brand campaigns are primarily distributed through existing channels: social, influencers, websites, email links, QR codes, embeds, events, and other owned or paid channels.

Brand campaigns may be private or semi-private and should not automatically become part of the public SEO graph. Public POLST and private brand decisioning can use the same underlying system while respecting different disclosure boundaries.

### What the brand side must prove

The brand side must prove:

- brands will run real campaigns,
- audiences will respond through existing distribution,
- channel attribution is clear enough to matter,
- the decision output is credible enough to act on,
- brands will pay or convert after pilots,
- brands will reuse the product for repeat decisions.

The central test is not whether the dashboard exists. The test is whether a brand can defend an action because of what POLST produced.

---

## 7. Shared platform mechanics

Both sides rely on the same shared platform mechanics:

- atomic Polsts,
- simple chains for structured intent,
- distribution and attribution,
- trust and valid-response filtering,
- confidence and decision labeling,
- moderation and policy controls,
- canonical memory,
- SEO for public surfaces,
- campaign history for brand-side reuse.

The public side provides scale, supply, and compounding public signal. The brand side provides monetization, sharper intent, and high-value use cases.

The architecture only matters commercially if it keeps those mechanics unified. If the company builds one system for public entertainment and another disconnected system for brand research, the strategic advantage weakens.

---

## 8. SEO and opinion memory

SEO is part of the product, not a marketing add-on.

Public Polsts should become persistent, searchable opinion assets when they have enough signal and are safe to index. The purpose is to turn short-lived participation into durable discovery and memory.

This is different from social polling, where results disappear into feeds and are not reusable. POLST’s public thesis is that many small structured opinion objects can compound into topic, brand, creator, location, and cultural memory over time.

The risk is fragmentation. If ten similar questions produce ten unrelated results, the platform creates noise instead of memory. The source documents repeatedly emphasize canonical aggregation, deduplication, and memory because without them, SEO and data quality both degrade.

For V1, this should stay lightweight and controlled. The company does not need the full future opinion graph before launch. It needs enough canonical handling to avoid obvious duplication, preserve useful results, and allow historical signal to compound.

---

## 9. Trust, privacy, and safety posture

Trust is MVP-critical. Complex fraud ML is not.

The launch-level trust posture is basic but necessary: duplicate vote prevention, device/session checks, IP rate limits, bot heuristics, suspicious burst detection, user reporting, and a moderation queue.

This is enough for MVP if the team is disciplined about what claims it makes. It is not enough to pretend the system is already a fully mature research-grade panel or enterprise-grade fraud platform.

Current privacy posture from the locked decisions:

- general users see aggregate vote totals, not individual voter details;
- creators can see handles, not full personal names or detailed voter identity;
- vote history is private;
- there is no address book grab;
- open/public Polsts are treated as exposed unless marked private.

The safety posture is post-publish takedown at launch, supported by flagging, removal, moderation queue, author notice, tiered bans, and 24/7 coverage as a requirement. Several governance questions remain open and should be owned before public scale.

---

## 10. AI posture

AI should not be the customer-facing promise at launch.

The docs are consistent that AI recommendations may exist internally or behind a feature flag, but customer-visible AI recommendations are not the initial product. Admin-only or assistive use is acceptable. Full auto-publishing, deep recommendations, predictive intelligence, and advanced sentiment should wait.

This is the correct stance. POLST should first prove that humans vote, brands pay, and the decision loop works. AI becomes more valuable after the platform has enough trusted structured outcomes.

AI-assisted content seeding can help reduce cold-start risk, but human approval remains important. The company should avoid generating large volumes of weak public content that dilute trust, harm SEO, or create moderation burden.

---

## 11. V1 scope in plain English

V1 is the launch system, not the full company.

At a high level, V1 should support:

- public voting and creation,
- guest voting without registration wall,
- binary visual Polsts,
- simple Polst chains for brands,
- sharing, QR, embeds, and source attribution,
- basic feed and discovery,
- creator participation and lightweight performance visibility,
- brand campaigns and decision output,
- SEO-indexable public surfaces,
- basic trust and moderation,
- billing or manual paid activation,
- lightweight live/event demos.

V1 should not ship the full opinion graph, full social graph, comments, DMs, creator marketplace, payouts, rewards wallet, advanced gamification, CRM integrations, SSO, advanced enterprise roles, deep sentiment, prediction models, global opinion index, non-English product, or long-form research-suite functionality.

The company should avoid starting with polish around dashboards, enterprise settings, AI, gamification, or integrations. Those can create the appearance of product maturity while delaying proof of the core machine.

---

## 12. Commercial truth

The commercial buyer is the brand or brand-like entity with budget and a decision need.

Agencies are an important channel because they already manage campaigns, influencers, recaps, and client justification. Influencers are important for distribution and proof of audience impact, but they are not the main payer in V1.

Pricing is not fully locked. The documents include pricing directions and ranges, but the current open questions still include exact small-brand pricing, campaign-pilot pricing, response caps, and packaging. An investor should treat pricing as a testable GTM assumption, not a finalized model.

The cleanest launch wedge is a small set of friendly B2B beta customers, likely with white-glove support and case-study intent. The documents reference roughly ten very friendly B2B beta customers and a free initial period for case-study development. That is a reasonable way to prove workflow, buyer language, and decision value before broader commercialization.

The commercial test is not “can we get people to try a poll.” The test is “will brands pay because this reduces uncertainty before they spend more money elsewhere.”

---

## 13. MVP success criteria

The MVP must prove five things:

1. **User behavior:** people vote, continue, create, and share.
2. **SEO:** public Polsts index, rank, and bring organic traffic.
3. **Brand value:** brands pay because POLST gives decision clarity.
4. **Distribution:** the product works through existing channels.
5. **Memory:** results persist, cluster, and become reusable.

The hard truth is that all five matter. Strong B2C voting without brand willingness to pay is not enough. Brand dashboards without public participation and distribution are not enough. SEO pages without trusted voting are not enough. Analytics without decisions are not enough.

---

## 14. MVP kill criteria

The MVP is failing if:

- users vote once and do not continue;
- public Polsts fail to index or rank;
- brands see results but not decisions;
- similar questions fragment signal instead of building memory;
- source attribution is weak;
- the team builds advanced features before the core loop works.

These are more useful than vanity launch metrics. They define what would invalidate the current product thesis.

---

## 15. Key open decisions and risks

Several items remain open or need tighter ownership before launch:

- exact pricing and packaging;
- authentication method;
- confidence threshold for the first brand decision output;
- whether brand campaign participants see results instantly or after completing a chain;
- which launch verticals and topic hubs get seeded first;
- moderation ownership, banned topics, politics, public figures, minors, and appeals;
- ToS, Privacy Policy, GDPR/CCPA, COPPA exposure, DMCA, FTC influencer rules, and insurance;
- brand verification and conflict policy;
- customer support ownership and launch-week incident operations;
- influencer pilot targeting, compensation, content rules, and off-ramp terms.

These are not reasons to reopen the product spine. They are launch governance issues. The product spine is already defined enough to move forward.

---

## 16. Investor/advisor feedback should focus here

The most useful investor feedback should not be about dashboard layout, page structure, code stack, or visual polish.

The useful questions are:

- Is the MVP still too large for the proof it needs to generate?
- Is the brand-side output defensible enough for a real business decision?
- Is the public side compelling enough to create repeat behavior without becoming a social network?
- Is the trust layer adequate for the claims the company will make at launch?
- Is the SEO/memory loop plausible with the planned level of content quality and moderation?
- Is the initial B2B beta structured to prove willingness to pay, not just interest?
- Are the open legal, safety, and ops risks owned by named people with deadlines?
- Is the team being honest about what is launch scope versus future ambition?

---

## 17. Final CEO read

POLST is strongest when described as a decision layer, not a polling product.

The customer side creates participation, cultural surface area, SEO supply, creator distribution, and structured public opinion memory. The brand side converts that same underlying system into paid decision infrastructure for companies that need to validate choices before spending more money.

The MVP should be smaller than the long-term vision because the long-term vision only matters if the core loop works. The company should prove the machine first:

**Intent → Polst → Vote → Decision → Memory**

Everything else is secondary until that loop is proven with real users, real search traffic, and real brand buyers.
