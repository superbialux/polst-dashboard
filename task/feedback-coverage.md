# Feedback coverage — dev-team-feedback.txt · marketing-team-feedback.txt · transcript.txt

Status as of 2026-07-17, after unslop passes 5a–5g (`fd3ddc2`…`dd4bcd5`),
redesign passes 6a–6g (`08de916`…`1a42869`), and pass 7 (the audit's new
Insights & Campaigns spec — see task/redesign-plan.md).
Verdicts: **✅ covered** · **🟡 partial** · **⏸ deliberately deferred** (matches the
audit's sequencing but deviates from a feedback line — flag if you disagree).

## ✅ Covered

| Feedback | Source | Resolution |
|---|---|---|
| "What's points? votes? %?" | dev, transcript | `winnerLabel` now leads with both percentages ("Minimal label · 58% vs 42%"); `winnerEvidence` adds the response count in reports. No bare unit or bare margin survives (`workspace.ts`, pass 7). |
| "Ready to decide" reads wrong on live runs | dev | Ended → "Results ready"; live → "Target reached / Strong lead · … — collecting until {date}" (`readyTitle` / `decisionEyebrow`). |
| Confidence with no method | dev (implied), audit | Every stated confidence carries `METRIC_INFO.confidence` on hover — volume + source diversity, explicitly not a significance test. |
| Polst displays too big / waste of real estate | marketing, transcript | Compact detail; the full social card sits behind a "Preview as voter" toggle. |
| Remove "Coming Soon" tags | marketing, transcript | Demographics cards deleted; `LockedCard` now *requires* a factual chip ("Not connected") so "Coming soon" can't come back silently. |
| Hide Custom and No End; fixed durations | marketing, transcript | Creation offers **3/7/10 days** only. "Custom" survives solely to represent an already-saved non-preset schedule; "No end" is gone. |
| Robust review page before launch | marketing, transcript | Both publish flows open a review dialog: exact voter card / ordered chain, schedule, and the lock contract — Back to editing / Confirm & publish. |
| Social preview question too small, too close to options | marketing | Question is 24px bold on desktop with real spacing before the option pair (`PollCard`). |
| Character limits missing | dev | Always-on `n/70` and `n/40` counters; option budget corrected to staging's 40. |
| Required fields should be marked | dev | `Field`'s `required` prop + "(required)" composer placeholders; category gates publishing (never draft-saving). |
| Verticals — unexplained taxonomy | dev | Renamed to the **category** vocabulary users pick at creation; filter list derives from data. |
| Voter journey "useless funnel" | dev | Brand-wide two-step funnel removed; `Funnel` is campaign-scoped only. |
| "How is campaign result derived from 3–5 binary questions?" | dev | One decision model: the winner is the decision question's (`decisionIndex`) leader; verified by `verify-model.ts`. |
| Developer Platform plan-gate "не думаю что у нас будет такая хуйня" | dev | Real Settings › Developer: scoped API keys (secret shown once), webhooks with the ten-endpoint cap. No plan teaser. |
| Archived Polst "залупа какая-то" | dev | Read-only archived summary + Restore + confirmed Delete (voted records refuse deletion). |
| QR popup: show URL + what downloads | dev | Destination URL visible; explicit PNG/SVG choice; real download. |
| Decision report buried | dev | Ended campaign leads with the brief; "Export report" is its primary action; Reports library derives live. |
| Calendar: hover vs click, "today" click | dev | Any cell opens the day popover (the truth for overflow); month navigable with a Today button. |
| Attention items clickable / self-clearing | transcript | Derived from the live store — fixing the gap removes the row. |
| Home mini-charts unclear vs metric | dev | Sparkline lives inside its metric card with delta + trend triangle and a stated comparison window. |
| Campaign rows: bigger previews, informative states | dev | `ThumbStrip` minis per row; Status and "Result so far" are separate columns. |
| "Where do I go from this screen?" (campaign detail) | dev | DecisionBrief primary action + launch checklist own the next step per lifecycle. |
| Spend/Klaviyo data only after a platform connects | transcript | Honest `ConnectCard` / "Not connected" states; no fabricated dashboards. |
| Embed appearance at campaign level? | transcript | Deliberately workspace-level (the team deferred per-campaign theming as a future feature) — matches. |
| Reports: per-campaign? export button? | dev | Report attaches to its campaign; Reports page and ReportPreview both export (copy + CSV/print on Analytics). |
| Stale model clock (June "today" in July) | audit P0-1 | `TODAY` is the real date; the whole seed model (ISO dates **and** in-copy "Jun 17" mentions) shifts with it. |

## ✅ Closed by redesign passes 6a–6f

1. **Geography map** — Audience renders a d3-geo Natural Earth choropleth
   (sequential violet by voter share, house tooltip, legend) above the
   country table, which stays as the exact/accessible view (`GeoMap.tsx`).
2. **Interactions breakdown** — `interactionMix` (likes/shares/reposts,
   exact integer split) derives at load; the Polst detail Interactions tile
   reads "N likes · N shares · N reposts".
3. **Scheduled Polst hero** — a Scheduled run always leads with the big
   "Starts in N days" ActionCard: alarm cut when sources are missing, calm
   "N sources are ready" cut otherwise (`Polsts.tsx`).
4. **Thumbnails everywhere a Polst renders** — Analytics "Campaign
   performance" carries `ThumbStrip`, "Standalone Polsts" uses the shared
   `PolstListRow` — same recipes as the list pages.
5. **Teaching layer** — the header "How Polst works" drawer (`HelpGuide.tsx`):
   decision model, confidence provenance, canon metric definitions, the
   evidence-protection rules, and a worked example wired to the seeded
   report. Plus the interpretation layer itself (`lib/insights.ts`): Trends
   coaching rows and question-phrased insight cards that say what the data
   means and what to do next.
6. **"Крупнее все" (make everything bigger)** — 52px table rows, 24px hero
   KPI values, uniform 36px toolbar controls, roomier empty states. Residual
   headroom is taste, not a tracked gap.

## ✅ Closed by pass 7 — the audit's Insights & Campaigns spec

1. **Campaign index is funnel-factual** — columns are Campaign, Status,
   Polsts, **Started**, **Completed**, **Finish rate** (each with its ⓘ
   definition from `METRIC_INFO`); run dates plus "ends in 2 days"-style
   relative schedule sit under the name; **"Result so far" is gone** and
   the `1,486 / 1,200` shorthand no longer renders anywhere in a list.
   The participant goal is spoken only on detail/report as
   "1,486 — goal of 1,200 reached" (audit workflow 14, acceptance 44).
2. **Insights is a campaign insights index** — only Active/Ended campaigns
   with responses qualify (11 of the 16 seeded); each row carries name,
   category, run dates, lifecycle badge, insight state (**Needs review /
   Monitoring / Decision ready / Reviewed**), participants + finish rate,
   a computed plain-language readout, Polst/source counts, a data-through
   stamp, and one "View campaign insights" action. Eight rows per page
   with an explicit `1–8 of 11 campaigns` pager; filters/search reset to
   page one; a footer explains why Scheduled/Draft runs are excluded
   (acceptance 41).
3. **Campaign insight detail is a campaign tab** — readout (decision being
   tested, lifecycle + collection facts, computed one-liner), authored
   findings with a provenance hover (computed vs authored), next action,
   sample & limitations, ordered Polsts with both percentages + response
   count + participation change + a derived role (supports/contradicts —
   only when a question offers the decision question's option pair —
   else context/inconclusive), source contribution spoken with **both
   rates** and an explicit no-causal-claim note, and a recordable
   **marketer review** (Monitoring/Acted on/Dismissed/Resolved, owner +
   date, seeded for three ended campaigns) (acceptance 42).
4. **Standalone Polsts never generate a workspace insight** — the index
   reads campaigns only; Polst detail stays factual (acceptance 43).
5. **Language contract** — `winnerLabel` now leads with both percentages
   ("Minimal label · 58% vs 42%"); `winnerEvidence` gives reports the
   full sentence form with the response count; HelpGuide teaches the new
   form; no surface prints bare `pts`/`+N` any more (audit P0-3 follow-up).
6. **Division of responsibility** — the workspace-wide Trends rows and
   "What the data says" cards moved to Analytics **Overview** (comparison
   work); Insights no longer repeats Home's attention queue or the
   what-changed history.

## ⏸ Deliberately deferred (flag if you disagree)

- **Global search stays** despite "слишком продвинуто" — audit verdict:
  preserve as a scale feature rather than delete; list search remains primary.
- **Notifications** still show seeded example events; "what kinds of
  notifications?" has no event contract yet — defining one is backend-shaped
  (audit P1-25).
- **Custom analytics date range** — transcript: "we should be able to decide
  what date range". Kept staging's fixed 7/30/90/All presets per the audit's
  workflow-4 verdict.
- **Key dates aren't user-editable** — transcript: "decide which dates are
  actually important on that calendar". Key dates are static seeds; no
  create/edit/ownership UI (audit acceptance item 32).
- **Incremental decisioning / follow-up suggestions** ("51–49 — ask these
  other questions") — the transcript itself frames this as phase two; today it
  exists only as authored next-step copy in reports.
- **3/7/10 vs 3/5/7** — the marketing memo says "three, five, or seven days";
  the transcript's decision-maker says "three seven or ten days that's it
  done" and staging ships 3/7/10. Shipped 3/7/10; needs a conscious sign-off.

## Remaining

All six tracked gaps closed by passes 6a–6f. Still open by choice (see the
deferred list above): editable key dates, custom analytics ranges, a real
notification contract, follow-up suggestions phase two, and the 3/7/10 vs
3/5/7 sign-off.
