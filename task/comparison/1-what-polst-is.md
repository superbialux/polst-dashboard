# What Polst is

*Distilled from `task/misc/polst_investor_overview.md` and `task/misc/call-transcript-overview.txt`.*

## One sentence

Polst is a **real-time decision engine**: someone asks a visual A-or-B question, an audience answers with one tap, and the structured result becomes a clear, defensible decision.

It is deliberately **not** a generic polling app, a survey tool, a social network, or an analytics dashboard. The company doesn't sell polls, engagement, or dashboards — it sells **fast, defensible decisions backed by real audience signal**. The vote is not the product; the decision that follows from it is.

## The atomic unit

A Polst is a binary visual decision object:

- one question,
- two visual answer options split by the "OR" disc,
- one-tap voting (guests can vote before registering),
- results shown after voting,
- a path to continue or share.

This simplicity is a product constraint, not a style choice — the fewer decisions asked of the voter, the more participation and the cleaner the structured data. The Polst card is simultaneously a **consumer engagement unit** and a **structured data unit**, which is why the exact same card component must render identically in the consumer app and in this dashboard.

## The core loop

**Intent → Polst → Vote → Decision → Memory**

- **Intent:** a question that matters (usually a brand's real decision — packaging, flavor, creative, pricing).
- **Polst:** the question reduced to a simple structured choice.
- **Vote:** low-friction audience response.
- **Decision:** a clear, directional, or honestly inconclusive outcome, with confidence and caveats.
- **Memory:** the result persists — campaign history, SEO, comparison against future runs.

Anything that doesn't create, route, validate, convert, or preserve signal is out of MVP scope.

## One platform, two sides

1. **Customer side** — the public, social-media-like Polst app: people vote, create, share, follow topics, and discover. It supplies participation, distribution, SEO surface, and cultural relevance.
2. **Brand side (this dashboard)** — the workspace where a brand defines an intent, launches a **campaign** (one Polst or a chain), distributes it through channels it already owns (QR codes, embeds, links, email, influencers), watches attributed responses come in, and receives a decision summary.

Both sides run on the same mechanics; the shared Polst card is the visible proof. If the dashboard forked its own version of the card, the promise "you see exactly what your audience sees" would break.

## What brands are buying

Speed and defensibility. A brand pays because Polst turns channels it already controls into a real-time decision system — and because the output isn't "here are your charts" but **"here is what the audience signal supports, with confidence and caveats."** The central MVP test on this side: *can a brand defend an action because of what Polst produced?*

## What this dashboard must therefore be

- **Campaign-first:** the campaign is the first-class object (distribution + analytics + attribution + reporting live inside it). Polsts are lightweight, reusable building blocks.
- **Story-shaped:** current status → what changed → why → what needs attention → recommended next action. A non-technical marketer must understand it at a glance.
- **Decision-oriented:** every chart must help answer *continue / stop / change something / what caused this*.
- **Non-technical:** marketers see channels, integrations, and devices — never APIs and webhooks (those are Pro/Enterprise, behind flags).
