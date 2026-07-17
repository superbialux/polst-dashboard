# Redesign program — component library, Recharts, insights layer

Directive (2026-07-17): redesign the dashboard using Mobbin references + the shadcn
skill; Recharts for all charts; DRY every view into reusable components first
(no one-offs left), then restyle per Mobbin (Amplitude = analytics layouts,
Dub/Origin = charts, Vercel = sidebar); unify via design/color tokens, 4px grid,
no magic values. Then an insights layer à la Hotjar (explains what data means)
and Apple Fitness Trends (interprets what you're looking at): the app should
tell the story, data → actionable insights, mock data layer first. Also cover
the remaining gaps in task/feedback-coverage.md. Polst previews must stay 1:1
with ~/polst (the voter app). UI/UX work only. Verify (tsc, verify:model,
build, browser) and commit+push after every pass — main only.

## Status

- [x] Pass 6a — foundation: components.json, shadcn HSL slot completion
      (popover/destructive/success/warning/chart-1..5+grid/sidebar),
      tailwindcss-animate enabled, 23 shadcn primitives added (button/badge
      kept custom), recharts+lucide-react+sonner installed.
- [ ] Pass 6b — DRY consolidation (raw components, replace call sites).
- [ ] Pass 6c — Recharts chart kit (dataviz skill first) replacing inline SVG.
- [ ] Pass 6d — Mobbin restyle: shell/sidebar (Vercel), analytics (Amplitude),
      charts polish (Dub/Origin), overlays → shadcn Dialog/DropdownMenu/Sheet,
      Toast → sonner, legibility sweep ("крупнее все").
- [ ] Pass 6e — Insights/Trends layer (mock data first: lib/insights.ts
      derivations), Hotjar/Fitness patterns, teaching layer.
- [ ] Pass 6f — remaining feedback gaps: geography map, interactions split,
      scheduled-Polst hero, PollThumb in Analytics tables, PollCard parity fix
      (restore `absolute inset-0` on option img — the one divergence vs ~/polst).
- [ ] Pass 6g — docs (DESIGN.md, feedback-coverage.md), final verify.

## DRY audit (from full read of all views, 2026-07-17)

Existing kit (kit.tsx): DashboardPage, DashboardCard, SectionGrid, StatusBadge,
InfoHint, DecisionBrief, SegmentedControl/FilterTabs/PageTabs, DurationField,
SearchAndFilters, filterByStatus/CreatedRange/filterByCreated, DataTable,
DetailList, ProgressBar, Sparkline, TrendChart, StatsStrip, ProgressRing,
ActionCard/CtaButton, PollThumb/ThumbStrip, NextStepsCard, StatTile,
PollResults, Funnel, MixBars, SnippetCard, LockedCard, SplitBar, TimeHeatmap,
Switch, ConnectCard, DateRangeMenu, FilterBar, useTabs.
Other: Calendar, ReportPreview, NotFoundCard, Field/TextInput/SelectMenu/
Checkbox, Modal, Menu, Drawer, Toast, EmptyState, Avatar, MiniPoll, PollCard,
PollComposer, DistributionActions (SocialShareModal/QrCodeModal), MultiPoll,
Chip (ui/badge.tsx), Button (ui/button.tsx).

One-off/duplicated patterns to consolidate (component ← occurrences):
- A. AssignSourceModal/SourceForm ← Polsts.tsx:826-953 ≡ Campaigns.tsx:1499-1626
     (+ dup SOURCE_KINDS/CHANNELS consts), third variant Distribution.tsx:500-694.
- B. AttentionList/AttentionRow + toneDot ← Home.tsx:61-82,
     Analytics.tsx:718-789, Shell.tsx:836-881 (SidebarSuggestions).
- C. ReadyDecisionRow ← Home.tsx:86-138, Analytics.tsx:377-418 (Insights
     already uses ActionCard — target shape for grids).
- D. ConfirmModal + ModalFooter ← Polsts.tsx:780-812, Campaigns.tsx:647-674,
     1142-1174, 1863-1896, Settings.tsx:849-881; footer recipe ~20 sites.
- E. ReviewPublishModal + LockNotice ← Polsts.tsx:1161-1221,
     Campaigns.tsx:579-646 (lock paragraph dup 1213-1219 / 637-644).
- F. RevealSecretModal + CopyableField ← Settings.tsx:270-308, 810-847;
     copy-row also Campaigns.tsx:1455-1470, DistributionActions.tsx:230-232.
- G. useCopyToClipboard ← Analytics.tsx:103-113, ReportPreview.tsx:222-230,
     Campaigns.tsx:95-97, Settings.tsx inline ×2 (lib/utils copyText exists).
- H. PolstListRow ← Polsts.tsx:192-205, Campaigns.tsx:611-634, 1321-1329,
     1050-1117.
- I. MiniStatGrid ← Home.tsx:112-124, Distribution.tsx:429-451 (QrTile).
- J. IconButton (32px grid recipe) ← Shell.tsx:694 const, Calendar.tsx:185-198,
     415-421, kit StatsStrip 969-975, NextStepsCard 1334-1342, Modal, Drawer.
- K. IconTile ← Distribution.tsx:410-412, Calendar.tsx:429-431, Shell.tsx:645-647,
     kit ConnectCard/LockedCard, Settings.tsx:107-109.
- L. ChecklistItem / CheckboxList ← Polsts.tsx:1140-1154,
     ReportPreview.tsx:138-173, Settings.tsx:946-962, 1114-1130.
- M. UnassignButton (voted-guard) ← Distribution.tsx:188-210,
     Campaigns.tsx:1386-1409.
- N. RateCell/PercentCell ← Distribution, Campaigns, Analytics, Audience,
     ReportPreview completion-rate cells.
- O. windowTileDelta() helper ← Analytics.tsx:452-459, Audience.tsx:40-54,
     Distribution.tsx:247-253.
- P. SectionNav ← Settings.tsx:1229-1256.
- Q. SectionTitle (in-card sub-header) ← ReportPreview.tsx:48 (private),
     Distribution.tsx:169-171, Campaigns.tsx:606-609.
- Pager (list pagination footer) ← Polsts.tsx inline; reuse for other lists.

Charts to rebuild in Recharts (kit.tsx): Sparkline 687, TrendChart 765,
ProgressRing 1078, Funnel 1518, MixBars 1578, SplitBar 1700, ProgressBar 651,
TimeHeatmap 1746 (may stay CSS grid but tokenized). Keep product surfaces:
PollCard result bars, CharRing, QR svg, Calendar bars.

Magic values worst offenders: kit.tsx chart consts, PollCard [Npx] type sizes
(product-canon: keep, they mirror ~/polst), Settings.tsx inline hex (#6161c7)
+ hex regex, DistributionActions QR hex, segmented h-[37px]/h-[29px],
Menu min-width 208, Calendar popover 320/300, Toast bottom-20.

## Token facts

- 3-layer CSS-var system (primitives → semantic → component) is the source of
  truth; shadcn HSL slots mirror primitives exactly (see index.css comments).
- Chart tokens: --chart-1 violet #6161c7, -2 bright teal #16ac93, -3 yellow
  #f2ba1c, -4 orange-red #e36133, -5 ink violet #332e78, --chart-grid.
- Sister app (~/polst) has a .dark remap + Inter Tight display; dashboard is
  deliberately Inter-only, light-only for now.
- 4pt grid is law (sister DESIGN.md); radius encodes nesting (12 card /
  8 control / 6 nested / pill identity); borders separate, shadows whisper.

## Mobbin reference plan (search right before each restyle)

- Vercel dashboard sidebar/nav → Shell sidebar.
- Amplitude dashboards → Analytics/Home layout, insight cards.
- Dub analytics charts, Origin charts → TrendChart/Sparkline/Bars styling.
- Hotjar trends/insights surfaces + Apple Fitness Trends (iOS) → insights layer:
  trend arrows with plain-language interpretation ("Weekday votes are trending
  up"), suggestion cards with one action, "what this means" explainers.

## Insights layer design notes (pass 6e)

Mock data first: new lib derivations (e.g. deriveTrends(), deriveInsights())
comparing current vs previous windows per metric/campaign/source; each insight
= { headline (plain language), evidence (numbers), interpretation (what it
means), action (CTA into the app), tone }. Views lead with the story
(Trends strip, insight feed), raw tables demoted below. Apple-Fitness-style
trend rows: metric, arrow, "keep it up / needs attention" coaching line.
Hotjar-style: every chart gets a "What this means" caption derived from data.
