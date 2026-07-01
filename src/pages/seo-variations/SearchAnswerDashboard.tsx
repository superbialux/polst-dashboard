import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  HighestVolumeSection,
  TrendingHashtagsSection,
} from "@/components/Discover";
import { DrawerRow, DrawerSection } from "@/components/Drawer";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { Menu } from "@/components/Menu";
import { SlideTrack } from "@/components/MultiPoll";
import { PageShell } from "@/components/PageShell";
import {
  Action,
  META_TEXT,
  PollCard,
  RESULT_MS,
  type PollCardProps,
} from "@/components/PollCard";
import { RailBox } from "@/components/RailBox";
import { SearchField } from "@/components/SearchDrawer";
import {
  seoAnswerFor,
  pollSlug,
  TOPICS,
  trendingHashtags,
  type SeoAnswer,
} from "@/lib/data";
import {
  formatCompact,
  formatCount,
  ladderSteps,
  resolvedPairAt,
  type PollOption,
} from "@/lib/poll";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { NewPollModal, useChallengeFlow } from "./shared";

/** Shared horizontal inset — the same 10/16px the poll card uses. */
const PAD_X = "px-2.5 lg:px-4";
/** Pause on the settled result before the carousel slides on. */
const ADVANCE_DELAY_MS = 900;
/** Standings time ranges — the pills in the board's header. */
const RANGES = ["1D", "1W", "1M", "3M", "ALL"] as const;
type Range = (typeof RANGES)[number];
/** Per-range mock shaping: how much of the all-time vote the window holds, how
 *  far shares have drifted within it, and the x-axis tick labels. */
const RANGE_META: Record<Range, { voteShare: number; drift: number; ticks: string[] }> = {
  "1D": { voteShare: 0.06, drift: 3, ticks: ["12a", "6a", "12p", "6p", "now"] },
  "1W": { voteShare: 0.3, drift: 6, ticks: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  "1M": { voteShare: 0.6, drift: 11, ticks: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"] },
  "3M": { voteShare: 0.85, drift: 16, ticks: ["Apr", "May", "Jun"] },
  ALL: { voteShare: 1, drift: 24, ticks: ["2024", "2025", "2026"] },
};
/** Contender colours for the trend chart's lines, dots, and legend — assigned
 *  by base rank so a contender keeps its colour even when a window reorders the
 *  board. On-brand: violet leads. */
const SERIES_COLORS = [
  "var(--accent-default)",
  "var(--color-green)",
  "var(--color-yellow)",
  "var(--color-red)",
  "var(--color-soft-purple)",
];

/** One contender resolved for a selected time window. */
type RangedRow = {
  name: string;
  share: number;
  votes: number;
  change: number;
  color: string;
};

/**
 * Shape the base standings for a selected window: shares drift (and can
 * reorder) by range, vote totals scale down for shorter windows, and the change
 * grows with the window — all deterministic, so renders stay stable.
 */
function rangedRows(
  base: { name: string; share: number }[],
  totalVotes: number,
  range: Range,
): RangedRow[] {
  const ri = RANGES.indexOf(range);
  const meta = RANGE_META[range];
  const adjusted = base.map((row, i) => ({
    name: row.name,
    baseIndex: i,
    raw: Math.max(1, row.share + Math.round(Math.sin((i + 1) * 1.3 + ri * 1.7) * ri)),
  }));
  const sum = adjusted.reduce((a, b) => a + b.raw, 0) || 1;
  const shared = adjusted
    .map((a) => ({ ...a, share: Math.round((a.raw / sum) * 100) }))
    .sort((x, y) => y.share - x.share);
  // Absorb rounding drift into the window's leader so shares total 100.
  shared[0].share += 100 - shared.reduce((s, r) => s + r.share, 0);
  const windowVotes = Math.max(1, Math.round(totalVotes * meta.voteShare));
  return shared.map((r) => ({
    name: r.name,
    share: r.share,
    votes: Math.round((r.share / 100) * windowVotes),
    change: Math.sin((r.baseIndex + 2) * (ri + 2)) * meta.drift,
    color: SERIES_COLORS[r.baseIndex] ?? "var(--border-strong)",
  }));
}

export function SearchAnswerDashboard() {
  const { slug = "" } = useParams();
  const answer = seoAnswerFor(slug);
  const { signedIn } = useSession();
  const { openAuth, openNewPoll } = useUI();
  const askTheWorld = () => (signedIn ? openNewPoll() : openAuth("signup"));

  if (!answer) {
    return (
      <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
        <h1 className="sr-only">No standings yet</h1>
        <div className="rounded-card border border-border-default bg-card-bg shadow-sm">
          <EmptyState
            icon="search_off"
            title="No standings for this matchup yet"
            body="The board is empty until the world weighs in. Ask the question and start the count."
            action={
              <button
                onClick={askTheWorld}
                className="flex h-10 items-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
              >
                <Icon name="add" size={20} weight={600} />
                Ask the world
              </button>
            }
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <header className="px-0.5 pb-5 lg:pb-6">
        <Breadcrumbs items={answer.breadcrumbs} />
        {answer.keywords ? (
          <KeywordTitle answer={answer} />
        ) : (
          <h1 className="mt-2 font-display text-3xl font-bold leading-9 text-text-primary lg:text-5xl lg:leading-[1.05]">
            {answer.title}
          </h1>
        )}
      </header>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_304px] lg:items-start xl:grid-cols-[minmax(0,1fr)_352px]">
        <main className="flex min-w-0 flex-col gap-4">
          <StandingsBoard answer={answer} />
          <StandCarousel answer={answer} />
          {answer.followOns.length > 0 && (
            <RailBox>
              <HighestVolumeSection
                title={answer.stats.place ? `Trending in ${answer.stats.place}` : "Trending now"}
                polls={answer.followOns}
                className="pt-2"
              />
            </RailBox>
          )}
        </main>

        <aside aria-label="Related" className="flex flex-col gap-4">
          <HaveATakeCta answer={answer} onCreate={askTheWorld} />
          <SearchPageCtas answer={answer} />
          <RailBox>
            <TrendingTopics />
          </RailBox>
          <ExploreHashtags answer={answer} />
        </aside>
      </div>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ *
 * Editable question — subject + place open a search menu.
 * ------------------------------------------------------------------ */

function KeywordTitle({ answer }: { answer: SeoAnswer }) {
  const k = answer.keywords!;
  const { variant = "dashboard" } = useParams();
  const navigate = useNavigate();
  const go = (subject: string, place?: string) =>
    navigate(
      `/seo/${variant}/${pollSlug(place ? `Best ${subject} in ${place}` : `Best ${subject}`)}`,
    );

  return (
    <h1 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-3xl font-bold leading-9 text-text-primary lg:text-5xl lg:leading-[1.05]">
      <span>Best</span>
      <KeywordChip
        label={k.subject}
        suggestions={k.subjectSuggestions ?? []}
        editorLabel="Search a subject"
        placeholder="Burger, pizza…"
        onCommit={(value) => go(value, k.place)}
      />
      {k.place && (
        <>
          <span>in</span>
          <KeywordChip
            label={k.place}
            suggestions={k.placeSuggestions ?? []}
            editorLabel="Search a place"
            placeholder="Chicago, Austin…"
            onCommit={(value) => go(k.subject, value)}
          />
        </>
      )}
    </h1>
  );
}

function KeywordChip({
  label,
  suggestions,
  editorLabel,
  placeholder,
  onCommit,
}: {
  label: string;
  suggestions: string[];
  editorLabel: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(label);
  useEffect(() => setDraft(label), [label]);
  const commit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) onCommit(trimmed);
  };

  return (
    <Menu
      label={editorLabel}
      align="start"
      closeOnClick={false}
      rootClassName="inline-flex min-w-0 leading-none"
      className="w-72 max-w-[calc(100vw-2rem)] p-2"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={cn(
            "rounded-card border-2 border-dashed px-2.5 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent",
            open
              ? "border-border-accent bg-accent-soft text-text-accent"
              : "border-border-strong text-text-primary hover:border-border-accent hover:text-text-accent",
          )}
        >
          {label}
        </button>
      )}
    >
      {/* The same search field + suggestion rows as the global header search,
          so editing a keyword reads like searching the site. */}
      <div className="flex flex-col gap-1">
        <SearchField
          value={draft}
          placeholder={placeholder}
          ariaLabel={editorLabel}
          autoFocus
          onChange={setDraft}
          onSubmit={() => commit(draft)}
        />
        {suggestions.length > 0 && (
          <ul className="flex flex-col">
            {suggestions.map((s) => {
              const active = s.toLowerCase() === label.toLowerCase();
              return (
                <li key={s}>
                  <DrawerRow onClick={() => commit(s)}>
                    <Icon
                      name={active ? "check" : "search"}
                      size={20}
                      className={cn(
                        "shrink-0",
                        active ? "text-text-accent" : "text-icon-tertiary",
                      )}
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate font-display text-sm font-semibold leading-5",
                        active ? "text-text-accent" : "text-text-primary",
                      )}
                    >
                      {s}
                    </span>
                    <Icon
                      name="north_west"
                      size={18}
                      className="shrink-0 text-icon-tertiary"
                    />
                  </DrawerRow>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Menu>
  );
}

/* ------------------------------------------------------------------ *
 * The standings — two tabs: the ranked leaderboard (default) and a
 * polymarket-style trend chart. Both read from one colour ramp + share set.
 * ------------------------------------------------------------------ */

function StandingsBoard({ answer }: { answer: SeoAnswer }) {
  const { leaderboard, stats } = answer;
  const contenders = answer.ladder?.contenders ?? [];
  const [tab, setTab] = useState<"board" | "trend">("board");
  const [range, setRange] = useState<Range>("1W");
  const rows = rangedRows(leaderboard, stats.totalVotes, range);

  // Floor the panel at the leaderboard's height so switching to the (shorter)
  // trend never jumps the page — measure the board whenever it's on screen.
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardHeight, setBoardHeight] = useState<number>();
  useEffect(() => {
    const el = boardRef.current;
    if (tab !== "board" || !el) return;
    const measure = () => setBoardHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab, range]);

  const tabs = [
    { value: "board" as const, label: "Leaderboard" },
    { value: "trend" as const, label: "Trend" },
  ];

  return (
    <section
      aria-label="Standings"
      className="overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm"
    >
      {/* Header mirrors the "See where you stand" card: bold text tabs on the
          left, a time-range control on the right. */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-default py-3",
          PAD_X,
        )}
      >
        <div role="tablist" aria-label="Standings view" className="flex items-center gap-4">
          {tabs.map((t) => {
            const selected = t.value === tab;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.value)}
                className={cn(
                  "relative font-display text-base font-bold leading-6 transition-colors",
                  selected ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                )}
              >
                {t.label}
                {/* Accent underline the width of the word, dropped onto the
                    header's bottom border (−bottom-3 cancels the py-3). */}
                {selected && (
                  <span className="absolute inset-x-0 -bottom-3 h-0.5 rounded-pill bg-accent-default" />
                )}
              </button>
            );
          })}
        </div>
        <RangePills value={range} onChange={setRange} />
      </div>

      <div className="flex flex-col" style={{ minHeight: boardHeight }}>
        {tab === "board" ? (
          <div ref={boardRef}>
            <Leaderboard rows={rows} contenders={contenders} />
          </div>
        ) : (
          <TrendChart rows={rows} range={range} />
        )}
      </div>
    </section>
  );
}

/** Time-range control — rectangular pills with a gap, one active. */
function RangePills({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Time range">
      {RANGES.map((r) => {
        const active = r === value;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            aria-pressed={active}
            className={cn(
              "rounded-md px-2 py-1 font-sans text-xs font-semibold leading-4 tabular-nums transition-colors",
              active
                ? "bg-accent-soft text-text-accent"
                : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
            )}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

/** Two initials for the photo-less fallback chip (e.g. "Kuma's Corner" → KC). */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/** The live standings — a "spotlight" board: the leader is featured (larger
 *  photo, verified check, a tier-larger share), the chasing pack ranked 2..n
 *  beneath. Every share sits in the same right-hand column, so the numbers read
 *  straight down one line. */
function Leaderboard({ rows, contenders }: LeaderboardProps) {
  const [leader, ...rest] = rows;
  if (!leader) return null;

  return (
    <div className="flex flex-col gap-1 p-2">
      {/* The leader is the page's answer — featured on a neutral option-bg
          card, share a tier larger, the verified check its only flourish. */}
      <div className="flex items-center gap-3 rounded-md bg-option-bg p-3">
        <ContenderThumb contenders={contenders} name={leader.name} size="h-14 w-14" textClass="text-base" />
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1.5 font-display text-base font-bold leading-5 text-text-primary lg:text-lg lg:leading-6">
            <span className="truncate">{leader.name}</span>
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-pill bg-accent-default">
              <Icon name="check" size={11} weight={700} className="text-text-on-accent" />
            </span>
          </p>
          <p className={META_TEXT}>{formatCompact(leader.votes)} votes</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-display text-2xl font-bold tabular-nums text-text-primary lg:text-3xl">
            {leader.share}%
          </span>
          <ChangeChip change={leader.change} />
        </div>
      </div>

      {/* The chasing pack — ranked 2..n, shares aligned to the leader's column. */}
      <ol className="flex flex-col">
        {rest.map((row, i) => (
          <li key={row.name} className="flex items-center gap-3 rounded-sm px-3 py-2">
            <span className="w-4 shrink-0 text-center font-sans text-sm font-semibold tabular-nums text-text-tertiary">
              {i + 2}
            </span>
            <ContenderThumb contenders={contenders} name={row.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold leading-[18px] text-text-primary lg:text-base lg:leading-5">
                {row.name}
              </p>
              <p className={META_TEXT}>{formatCompact(row.votes)} votes</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-display text-lg font-bold tabular-nums text-text-primary lg:text-xl">
                {row.share}%
              </span>
              <ChangeChip change={row.change} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Shared standings bits — the contender thumbnail and the change chip used by
 * the leaderboard above.
 * ------------------------------------------------------------------ */

const contenderImage = (contenders: PollOption[], name: string) =>
  contenders.find((c) => c.label === name)?.image;

/** Square contender thumbnail with an initials fallback, sized by class. */
function ContenderThumb({
  contenders,
  name,
  size = "h-10 w-10",
  textClass = "text-xs",
}: {
  contenders: PollOption[];
  name: string;
  size?: string;
  textClass?: string;
}) {
  const image = contenderImage(contenders, name);
  return image ? (
    <img src={image} alt="" className={cn("shrink-0 rounded-md object-cover", size)} />
  ) : (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-md bg-surface-strong font-display font-bold uppercase leading-none text-text-secondary",
        size,
        textClass,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/** The 24h change, as Polymarket's filled up/down triangle + rounded percent. */
function ChangeChip({ change }: { change: number }) {
  const up = change >= 0;
  return (
    <span
      className={cn(
        "flex items-center font-sans text-xs font-semibold tabular-nums",
        up ? "text-status-success" : "text-status-danger",
      )}
    >
      <Icon
        name={up ? "arrow_drop_up" : "arrow_drop_down"}
        size={20}
        filled
        className="-ml-1.5 -mr-0.5"
      />
      {Math.round(Math.abs(change))}%
    </span>
  );
}

type LeaderboardProps = {
  rows: RangedRow[];
  contenders: PollOption[];
};

/** Polymarket-style multi-line trend — each contender's share across the
 *  selected window, drifting (with mock volatility) to its current value.
 *  Pure SVG: %-axis on the right, time-axis on the bottom, a gridded plot. */
function TrendChart({ rows, range }: { rows: RangedRow[]; range: Range }) {
  const series = rows.slice(0, 5);
  const W = 320;
  // Short, wide aspect: the SVG height follows the (wide) column width, so a
  // low viewBox height keeps the trend just under the leaderboard's height —
  // the panel's min-height then floors the two equal, and tabs don't jump.
  const H = 116;
  const N = 48; // sample count — denser than before for a jaggier, market read
  const GUTTER = 26; // right column for the % axis labels
  const TOP = 8;
  const BOT = 8;
  const plotW = W - GUTTER;
  const max = Math.max(10, ...series.map((r) => r.share));
  const yMax = Math.max(10, Math.ceil((max + 2) / 10) * 10);
  const step = yMax <= 20 ? 5 : 10;
  const yticks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, i) => i * step);
  const y = (v: number) => TOP + (1 - v / yMax) * (H - TOP - BOT);
  const xticks = RANGE_META[range].ticks;

  // Each line lands on its current share, having travelled `change` across the
  // window, with two-frequency noise (easing out near "now") for a real feel.
  const line = (end: number, change: number, seed: number) => {
    const start = Math.max(1, end - change);
    return Array.from({ length: N }, (_, t) => {
      const k = t / (N - 1);
      const trend = start + (end - start) * k;
      const noise =
        (Math.sin(t * 0.9 + seed * 2.3) + Math.sin(t * 2.7 + seed * 1.1) * 0.5) *
        2 *
        (1 - k * 0.25);
      const v = t === N - 1 ? end : Math.max(0.5, trend + noise);
      return `${((t / (N - 1)) * plotW).toFixed(1)},${y(v).toFixed(1)}`;
    }).join(" ");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className={cn("pt-3", PAD_X)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Share over ${range}`}>
          {/* Horizontal gridlines + % axis on the right. */}
          {yticks.map((tk) => (
            <g key={`y${tk}`}>
              <line
                x1="0"
                x2={plotW}
                y1={y(tk)}
                y2={y(tk)}
                stroke="var(--border-default)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={W}
                y={y(tk)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--text-tertiary)"
                fontSize="9"
                fontFamily="var(--font-sans)"
              >
                {tk}%
              </text>
            </g>
          ))}
          {/* Faint vertical gridlines at each time tick. */}
          {xticks.map((_, idx) => {
            const x = (idx / (xticks.length - 1)) * plotW;
            return (
              <line
                key={`x${idx}`}
                x1={x}
                x2={x}
                y1={TOP}
                y2={H - BOT}
                stroke="var(--border-default)"
                strokeWidth="1"
                opacity="0.5"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {series.map((row, i) => (
            <polyline
              key={row.name}
              points={line(row.share, row.change, i)}
              fill="none"
              stroke={row.color}
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* The "now" value, anchored with a haloed dot. */}
          {series.map((row) => (
            <circle
              key={row.name}
              cx={plotW}
              cy={y(row.share)}
              r="2.6"
              fill={row.color}
              stroke="var(--card-bg)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {/* Time axis. */}
        <div
          className="mt-1.5 flex justify-between font-sans text-[0.625rem] leading-4 text-text-tertiary"
          style={{ paddingRight: `${(GUTTER / W) * 100}%` }}
        >
          {xticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      {/* Legend doubles as the key for each contender's colour. */}
      <ul className={cn("mt-auto flex flex-wrap gap-x-4 gap-y-1.5 py-3", PAD_X)}>
        {series.map((row) => (
          <li key={row.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-pill" style={{ backgroundColor: row.color }} />
            <span className="font-sans text-xs leading-4 text-text-secondary">{row.name}</span>
            <span className="font-sans text-xs font-semibold tabular-nums text-text-primary">
              {row.share}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * "See where you stand" — a carousel of real poll posts from DIFFERENT brands
 * that together drill down to the visitor's pick: each round is a full poll
 * card (author, social actions, meta) whose winner carries into the next
 * round's matchup, ending on a create card against their narrowed favourite.
 * (Distinct from MultiPoll, which is one brand's single multi-step post.)
 * ------------------------------------------------------------------ */

function StandCarousel({ answer }: { answer: SeoAnswer }) {
  const { challenge, modal } = useChallengeFlow();
  const contenders = answer.ladder?.contenders ?? [];
  const steps = ladderSteps(contenders);
  // One distinct brand per round, so the sequence reads as posts from across
  // the city rather than one author's quiz — the whole point of this card.
  const brands = [answer.poll, ...answer.followOns].filter(
    (p, i, arr) => arr.findIndex((x) => x.author === p.author) === i,
  );

  const count = steps.length + 1; // matchups + the create card
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => steps.map(() => null));
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const onVote = (round: number, option: number) => {
    setPicks((prev) => prev.map((p, i) => (i === round ? option : p)));
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setIndex((cur) => (cur === round ? Math.min(round + 1, count - 1) : cur)),
      RESULT_MS + ADVANCE_DELAY_MS,
    );
  };

  // The running favourite: walk the answered rounds, carrying each pick forward.
  const lastPick = picks[steps.length - 1];
  const finalPair = resolvedPairAt(steps, picks, Math.max(0, steps.length - 1));
  const champion =
    steps.length === 0
      ? contenders[0] ?? answer.poll.options[0]
      : lastPick == null
        ? finalPair[0]
        : finalPair[lastPick];
  const subject = answer.keywords?.subject ?? "pick";
  const voted = new Set(picks.flatMap((p, i) => (p !== null ? [i] : [])));

  // No ladder (rare synthesized pages) → just the primary poll, unwrapped.
  if (steps.length === 0) {
    return (
      <section
        aria-label="See where you stand"
        className="overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm"
      >
        <PollCard {...answer.poll} />
        <NewPollModal {...modal} />
      </section>
    );
  }

  return (
    <section
      aria-label="See where you stand"
      className="overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm"
    >
      <div className={cn("flex items-center justify-between gap-3 border-b border-border-default py-3", PAD_X)}>
        <h2 className="font-display text-base font-bold leading-6 text-text-primary">
          See where you stand
        </h2>
        <StepIndicator count={count} index={index} voted={voted} onJump={setIndex} />
      </div>

      <SlideTrack index={index} count={count}>
        {steps.map((step, i) => {
          const pair = resolvedPairAt(steps, picks, i);
          const brand = brands[i % brands.length];
          return (
            <PollCard
              key={i}
              {...brand}
              question={`${pair[0].label} or ${pair[1].label}?`}
              options={pair}
              onVote={(option) => onVote(i, option)}
            />
          );
        })}
        <CreatePollCard
          subject={subject}
          winner={champion}
          onCreate={() => challenge(champion)}
        />
      </SlideTrack>

      <NewPollModal {...modal} />
    </section>
  );
}

function StepIndicator({
  count,
  index,
  voted,
  onJump,
}: {
  count: number;
  index: number;
  voted: Set<number>;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex items-center" role="tablist" aria-label="Polls">
      {Array.from({ length: count }).map((_, i) => {
        const isCreate = i === count - 1;
        const current = i === index;
        const isVoted = voted.has(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-label={isCreate ? "Create your own" : `Poll ${i + 1}`}
            aria-current={current ? "step" : undefined}
            className="group grid h-6 w-6 place-items-center"
          >
            {isCreate ? (
              <span
                className={cn(
                  "grid h-4 w-4 place-items-center rounded-pill border-2",
                  current ? "border-accent-default text-text-accent" : "border-border-strong text-icon-tertiary",
                )}
              >
                <Icon name="add" size={10} weight={700} />
              </span>
            ) : isVoted ? (
              <span
                className={cn(
                  "grid h-4 w-4 place-items-center rounded-pill bg-accent-default transition-transform",
                  current && "scale-110",
                )}
              >
                <Icon name="check" size={12} weight={700} className="text-text-on-accent" />
              </span>
            ) : (
              <span
                className={cn(
                  "h-4 w-4 rounded-pill border-2",
                  current ? "border-accent-default" : "border-border-strong",
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** The carousel's final slide: the visitor's narrowed favourite vs. a dashed
 *  "create" tile that opens the challenge flow — their drilled-down pick
 *  against "know something better?". */
function CreatePollCard({
  subject,
  winner,
  onCreate,
}: {
  subject: string;
  winner: PollOption;
  onCreate: () => void;
}) {
  return (
    <article className="flex w-full flex-col bg-card-bg">
      <header className={cn("flex items-center gap-2.5 pb-2 pt-2.5", PAD_X)}>
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-pill bg-surface-strong text-icon-secondary lg:h-10 lg:w-10">
          <Icon name="person" size={20} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="font-display text-sm font-bold leading-[18px] text-text-primary lg:text-base lg:leading-5">
            You
          </span>
          <span className="font-sans text-xs leading-4 text-text-secondary lg:text-sm lg:leading-5">
            Add a contender
          </span>
        </div>
      </header>

      <div className={cn("flex flex-col", PAD_X)}>
        <h2 className="mb-2 font-display text-lg font-bold leading-[26px] text-text-primary lg:mb-3 lg:text-2xl lg:leading-8">
          Know something better than {winner.label}?
        </h2>

        <div className="relative grid aspect-[4/3] grid-cols-2 gap-1">
          <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-md bg-status-success">
            <div className="flex items-center gap-2 px-2 py-2.5 lg:px-3 lg:py-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-raised">
                <Icon name="check" size={14} weight={700} className="text-status-success" />
              </span>
              <span className="truncate font-display text-sm font-semibold leading-5 text-text-on-accent lg:text-lg lg:leading-6">
                {winner.label}
              </span>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <img src={winner.image} alt="" className="h-full w-full object-cover" />
            </div>
          </div>

          <button
            type="button"
            onClick={onCreate}
            className="group flex h-full min-w-0 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-option-bg px-8 py-3 text-center transition-colors hover:border-border-accent hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-accent lg:px-10"
          >
            <span className="grid h-10 w-10 place-items-center rounded-pill bg-surface-raised text-text-accent transition-colors group-hover:bg-accent-default group-hover:text-text-on-accent">
              <Icon name="add" size={22} weight={600} />
            </span>
            <span className="font-display text-sm font-semibold leading-5 text-text-primary lg:text-base lg:leading-6">
              Create a poll
            </span>
            <span className="font-sans text-xs leading-4 text-text-secondary">
              Put your {subject.toLowerCase()} up against {winner.label}.
            </span>
          </button>

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-12 -translate-x-1/2 -translate-y-1/2 lg:size-16">
            <span className="absolute inset-0 rounded-pill bg-surface-raised shadow-sm" />
            <span className="absolute inset-0 grid place-items-center font-display text-lg font-bold leading-none text-text-primary lg:text-2xl">
              OR
            </span>
          </div>
        </div>

        {/* Meta line mirrors a poll card's category/votes row. */}
        <div className="mt-1.5 flex items-center justify-between gap-3 font-sans text-xs leading-4 text-text-secondary lg:mt-2 lg:text-sm lg:leading-5">
          <span className="min-w-0 truncate">Your pick · {winner.label}</span>
          <span className="shrink-0">Draft</span>
        </div>
      </div>

      {/* The poll card's action bar, inert — keeps the draft the same height and
          shape as every matchup before it, just dimmed until it's published. */}
      <footer className={cn("mt-1 flex items-center justify-between py-2.5", PAD_X)}>
        <div className="flex items-center gap-3 lg:gap-4">
          <Action icon="favorite" label="Like" count="0" tone="red" disabled />
          <Action icon="repeat" label="Repost" count="0" tone="green" disabled />
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <Action icon="ios_share" label="Share" disabled />
          <Action icon="bookmark" label="Bookmark" tone="violet" disabled />
        </div>
      </footer>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * Rail.
 * ------------------------------------------------------------------ */

function HaveATakeCta({ answer, onCreate }: { answer: SeoAnswer; onCreate: () => void }) {
  const faces = [
    ...(answer.ladder?.contenders.map((c) => c.image) ?? []),
    ...answer.followOns.flatMap((p) => p.options.map((o) => o.image)),
  ]
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 5);

  return (
    <RailBox className="px-4 py-4">
      <p className="font-display text-base font-bold leading-6 text-text-primary">
        Have a take of your own?
      </p>
      <p className="mt-0.5 font-sans text-sm leading-5 text-text-secondary">
        Add your pick and see if {answer.stats.place ?? "the world"} agrees.
      </p>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex -space-x-2">
          {faces.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="h-8 w-8 rounded-pill object-cover ring-2 ring-card-bg"
            />
          ))}
        </div>
        <span className="font-sans text-xs leading-4 text-text-secondary">
          {formatCompact(answer.stats.totalVotes)} have voted
        </span>
      </div>
      <button
        onClick={onCreate}
        className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card-bg"
      >
        <Icon name="add" size={20} weight={600} />
        Ask the world
      </button>
    </RailBox>
  );
}

/** Trending topics — the home rail's list, each with its (rounded) picture. */
function TrendingTopics() {
  return (
    <DrawerSection title="Trending topics" seeAllTo="/topics" className="pt-2">
      <ul>
        {TOPICS.slice(0, 5).map((t) => (
          <li key={t.name}>
            <DrawerRow to={`/topic/${encodeURIComponent(t.name)}`}>
              <img src={t.image} alt="" className="h-9 w-9 shrink-0 rounded-pill object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-text-primary">{t.name}</p>
                <p className="font-sans text-xs font-medium text-text-secondary">
                  {formatCount(t.polls)} polls · {formatCount(t.votes)} votes
                </p>
              </div>
              <Icon name="chevron_right" size={20} className="shrink-0 text-icon-tertiary" />
            </DrawerRow>
          </li>
        ))}
      </ul>
    </DrawerSection>
  );
}

/**
 * Polymarket-style promo cards for nearby answer pages — the "…Odds &
 * Predictions" treatment: a designed card whose contenders float as a little
 * cluster (the leader's pulsing), the whole thing a link into that page. Extra
 * navigation that keeps the internal-link web Google follows.
 */
function SearchPageCtas({ answer }: { answer: SeoAnswer }) {
  const pages = answer.relatedTopics
    .map((t) => {
      const slug = t.to.match(/^\/q\/(.+)$/)?.[1];
      const page = slug ? seoAnswerFor(slug) : null;
      return page && (page.ladder?.contenders.length ?? 0) > 0
        ? { to: t.to, page }
        : null;
    })
    .filter((r): r is { to: string; page: SeoAnswer } => r !== null)
    .slice(0, 2);
  if (pages.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {pages.map(({ to, page }) => (
        <SearchPageCta key={to} to={to} page={page} />
      ))}
    </div>
  );
}

function SearchPageCta({ to, page }: { to: string; page: SeoAnswer }) {
  const thumbs = (page.ladder?.contenders ?? []).slice(0, 3);
  const title = page.keywords
    ? `Best ${page.keywords.subject}${page.keywords.place ? ` in ${page.keywords.place}` : ""}`
    : page.title;
  // Scatter angles for the floating cluster — a hand-placed "flag pile".
  const tilt = [-8, 6, -4];

  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-card border border-border-default  p-4 shadow-sm transition-colors hover:border-border-accent"
    >
      {/* The contenders, floated top-right; the frontrunner breathes. */}
      <div aria-hidden className="pointer-events-none absolute right-3 top-3 flex -space-x-3">
        {thumbs.map((c, i) => (
          <span
            key={c.label}
            className="relative"
            style={{ transform: `rotate(${tilt[i] ?? 0}deg)` }}
          >
            <img
              src={c.image}
              alt=""
              className="h-10 w-10 rounded-md object-cover shadow-sm ring-2 ring-surface-strong"
            />
            {i === 0 && (
              <span className="absolute inset-0 animate-pulse rounded-md motion-reduce:hidden" />
            )}
          </span>
        ))}
      </div>

      <p className="relative mt-10 max-w-[100%] font-display text-base font-bold leading-tight text-text-primary lg:text-lg">
        {title}
        {/* Inline so it trails the last line; align-middle keeps it on that line. */}
        <Icon
          name="arrow_forward"
          size={15}
          className="ml-1 inline-block align-middle transition-transform group-hover:translate-x-0.5"
        />
      </p>
    </Link>
  );
}

/** Popular hashtags — the home rail's "Trending Hashtags" list, scoped to
 *  this question's polls (rank · #tag · counts · chevron). */
function ExploreHashtags({ answer }: { answer: SeoAnswer }) {
  const pool = [answer.poll, ...answer.followOns];
  if (trendingHashtags(pool).length === 0) return null;
  return (
    <RailBox>
      <TrendingHashtagsSection polls={pool} className="pt-2" />
    </RailBox>
  );
}
