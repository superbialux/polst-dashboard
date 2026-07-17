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
- [x] Pass 6b — DRY consolidation: patterns.tsx (19 shared components) +
      ui/icon-button.tsx leaf module + useCopyToClipboard + windowTileDelta;
      all 7 pages + Shell/Calendar/ReportPreview/kit/Modal/Drawer swapped
      (~-830 lines of duplication); PollCard option-img parity restored.
      MiniPoll's PollThumb kept — genuinely different variant (64px/24px).
      Note: kit's private SectionTitle-ish headers largely gone; Audience.tsx
      "Browsers" header still inline (audit ref had moved) — fold into 6d.
- [x] Pass 6c — Recharts: charts.tsx (TrendChart/Sparkline, same APIs),
      validated chart palette (chart-2 #b98a00, chart-3 #128c78, chart-5
      #47409f; amber never adjacent to orange-red), MixBars → Dub bar-rows.
      Funnel/ProgressRing/ProgressBar/TimeHeatmap stay HTML (meters/lists).
- [ ] Pass 6d — Mobbin restyle (spec: task/design-references.md §8):
      6d1 Shell sidebar Vercel metrics; 6d2 Dub KPI hero (StatsStrip→fused
      metric-cell tabs + chart, delta chips); 6d3 overlay internals → shadcn
      (Modal→Dialog, Menu→DropdownMenu, Drawer→Sheet, Toast→sonner, same
      external APIs); 6d4 DataTable/toolbar/empty-state registers +
      legibility sweep ("крупнее все").
- [x] Pass 6e (core) — lib/insights.ts (deriveTrends 7D-vs-30D coaching rows
      w/ peak-window + biggest-drop derivations; deriveInsights question
      cards: standout source / drop-off / standout Polst) + insight-cards.tsx
      (TrendGrid/InsightCard) wired into Analytics Insights. All computed
      from live store; rows drop when data can't support them.
- [~] Pass 6f — done: scheduled-Polst hero (both cuts), interactionMix
      (workspace+store+Polst detail tile), PollThumb/ThumbStrip in both
      Analytics tables, PollCard parity fix. In flight: GeoMap (Audience).
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

## patterns.tsx API contract

New file `src/components/dashboard/patterns.tsx` (re-exported from
`src/components/dashboard/index.ts`). All presentational/data-driven —
callers pass derived facts and own store writes + toasts.

- `ModalFooter` — { children, start?: ReactNode (left helper), className? } → the `flex justify-end gap-2 p-4` action row.
- `ConfirmModal` — { open, onClose, title, label? (a11y name if ≠ title), children (body copy), confirmLabel, cancelLabel?="Cancel", tone?: "danger"|"default", onConfirm, confirmDisabled? }; caller closes in onConfirm.
- `LockNotice` — { children, className? } → lock-icon paragraph on the subtle wash.
- `ReviewModal` — { open, onClose, title, label?, children (preview), facts: Array<[string, ReactNode]>, factsFirst? (campaign review = true), lockText, confirmLabel, confirmDisabled?, onConfirm, backLabel?="Back to editing", className? (width, e.g. "lg:max-w-xl") }.
- `CopyableField` — { value, label?="Copy", successMessage?, size?: "sm"|"xs" (mono size), onCopied?, className? }; copies via useCopyToClipboard.
- `RevealSecretModal` — { open, onClose, title, intro, secret, secretSize?, copyMessage?, hint?, doneLabel?="Done" }.
- `SOURCE_KINDS: Array<Source["kind"]>`, `CHANNELS: Channel[]` — the one source vocabulary.
- `SourceForm` — controlled { name/onNameChange, kind/onKindChange, channel/onChannelChange, namePlaceholder?, gridClassName? } fieldset (kind/channel may be "").
- `AssignSourceModal` — { open, onClose, title?="Assign source", confirmLabel?="Create & assign", unlinked?: UnlinkedSource[], onAssign?: (source)=>void (enables list+headings — Polsts/Campaigns shape), targets?: SourceTargetOption[] (enables "Link to" select — Distribution Add shape), targetLabel?/targetHelper?, onCreate: (SourceDraft)=>void, defaultKind?="QR code" / defaultChannel?="Website" (pass "" for Distribution), namePlaceholder?, gridClassName? }. Field state + double-click guard live inside; resets on open.
- `AssignTargetModal` — { source: {name}|null (open while non-null), onClose, targets, onAssign: (linked, targetName)=>void, title?, targetLabel?="Assign to", targetHelper? } — Distribution's assign-existing flow.
- `toneDot` — Record<"danger"|"warning"|"neutral", dot class>; `AttentionRow` — { item: AttentionItem { id?, tone, title, reason, action:{label, to?|onClick?} }, variant?: "compact" (Home) | "spacious" (Insights) }; `AttentionList` — { items, variant?, className? } (divide-y ul).
- `ReadyDecisionRow` — { layout?: "card"|"row", eyebrow (readyTitle), title (name), to, confidence? (omit when "—"), confidenceInfo?, note? (card), sublabel? (row), stats?: MiniStat[] (card), cta:{label,to}, more?:{label,to} (card), className? }.
- `PolstListRow` — { options: [PollOption, PollOption], question, sublabel? (defaults "{A} vs {B}"), to? (links + hover accent), meta? (trailing slot), className? }.
- `MiniStatGrid` — { items: {label, value}[], cols?: 2|3, tone?: "bordered" (hairlines, Home) | "subtle" (inset wash, QrTile), className? }.
- `IconButton` — button props + required aria-label, size?: "sm"(28)|"md"(32), shape?: "rounded"|"pill"; children = the Icon.
- `IconTile` — { size?: 8|9|10|11|12, className? (override wash/ink), children } icon disc.
- `ChecklistItem` — { tone: "done"|"todo"|"warning", align?: "center" (publish checks) | "start" (findings/caveats), children }; `CheckboxList` — { items: {id,label,description?,checked}[], onToggle(id,next), mono?, className? }.
- `UnassignButton` — { voters, onClick, className? }; disables with the attribution-record title when voters > 0.
- `RateCell(rate: number|null): ReactNode` — tabular `fmtPct(rate,0)` or "—".
- `SectionNav` — { items: {id,label,icon}[], active, onSelect, label?="Sections", className? }; sticky/col-span stays at call site.
- `Pager` — { page, pageSize, total, onPage, noun, className? }; null when total ≤ pageSize, clamps to the last page.
- `SectionTitle` — { children, className? } in-card sub-header (ReportPreview keeps its private copy untouched).

Also:
- `useCopyToClipboard()` (src/components/Toast.tsx) — returns `(text, successMsg?="Copied to clipboard") => Promise<void>`; toasts honestly via copyText.
- `windowTileDelta(current, previous, compareLabel?, opts?: { basis?: "window"|"ratio", fallbackDetail?, zeroDetail? }): TileDelta` and `ratioDelta(current, previous)` (src/lib/engine.ts) — the shared StatTile delta computation (Analytics tileDelta, Audience vsPrevious/ratioDelta, Distribution voters tile).
