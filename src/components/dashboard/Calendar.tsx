import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/store";
import {
  CALENDAR_MONTH,
  KEY_DATES,
  type CalendarItem,
} from "@/lib/workspace";
import { DashboardCard, StatusBadge } from "./kit";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const KIND_ICON: Record<CalendarItem["kind"], string> = {
  campaign: "campaign",
  polst: "ballot",
  date: "flag",
};

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type Cell = { y: number; m: number; day: number; iso: string; inMonth: boolean };

/** Bars are colour-coded by type (campaign vs single Polst); completed
 *  items simply fade. Scheduled needs no distinct colour — its future
 *  date already says so. */
function barClasses(item: CalendarItem): string {
  const base =
    item.kind === "polst"
      ? "bg-cal-polst text-cal-polst-fg"
      : "bg-cal-campaign text-cal-campaign-fg";
  return cn(base, item.status === "Ended" && "opacity-60");
}

type PlacedBar = CalendarItem & { startCol: number; endCol: number; lane: number };

/** Lay a week's spanning items (campaigns + Polsts) into lanes so
 *  overlaps stack instead of colliding. */
function layoutWeek(items: CalendarItem[], week: Cell[]): PlacedBar[] {
  const weekStart = week[0].iso;
  const weekEnd = week[6].iso;
  const inWeek = items
    .filter((it) => it.start <= weekEnd && it.end >= weekStart)
    .sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));

  const laneEnds: number[] = [];
  return inWeek.map((it) => {
    let startCol = week.findIndex((c) => c.iso >= it.start);
    if (startCol === -1) startCol = 0;
    let endCol = week.reduce((acc, c, i) => (c.iso <= it.end ? i : acc), 0);
    if (endCol < startCol) endCol = startCol;
    let lane = laneEnds.findIndex((end) => end < startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(endCol);
    } else {
      laneEnds[lane] = endCol;
    }
    return { ...it, startCol, endCol, lane };
  });
}

type PopoverState = { cell: Cell; left: number; top: number };

/** A full-width month calendar: always six weeks (42 cells) with the spill
 *  into adjacent months shown dimmed, key dates as hoverable dots on top of
 *  each day, campaigns and Polsts as colour-coded bars across their run, and
 *  a floating card on any cell click. Months are navigable. */
export function WorkspaceCalendar() {
  const [view, setView] = useState({ y: CALENDAR_MONTH.year, m: CALENDAR_MONTH.month });
  const [pop, setPop] = useState<PopoverState | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const label = useMemo(
    () => new Date(view.y, view.m, 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
    [view],
  );

  /* Items derive from the live store (same rule as workspace's static
     CALENDAR_ITEMS): anything scheduled and not Draft/Archived draws a bar
     from start to end, so newly published objects appear in-session. Key
     dates stay the static planning layer. */
  const { campaigns, polsts } = useWorkspace();
  const items = useMemo<CalendarItem[]>(
    () => [
      ...campaigns
        .filter((c) => c.startAt && c.status !== "Draft" && c.status !== "Archived")
        .map((c) => ({
          id: c.id,
          title: c.name,
          kind: "campaign" as const,
          status: c.status,
          start: c.startAt!,
          end: c.endAt ?? c.startAt!,
          to: `/campaigns/${c.id}`,
        })),
      ...polsts
        .filter((p) => p.startAt && p.status !== "Draft" && p.status !== "Archived")
        .map((p) => ({
          id: p.id,
          title: p.question,
          kind: "polst" as const,
          status: p.status,
          start: p.startAt!,
          end: p.endAt ?? p.startAt!,
          to: `/polsts/${p.id}`,
        })),
      ...KEY_DATES.map((k) => ({
        id: k.id,
        title: k.title,
        kind: "date" as const,
        start: k.start,
        end: k.end,
      })),
    ],
    [campaigns, polsts],
  );
  const spanning = useMemo(() => items.filter((it) => it.kind !== "date"), [items]);
  const events = useMemo(() => items.filter((it) => it.kind === "date"), [items]);

  // Always six weeks: start on the Sunday on/before the 1st, run 42 days.
  const weeks = useMemo(() => {
    const firstWeekday = new Date(view.y, view.m, 1).getDay();
    const cells: Cell[] = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(view.y, view.m, 1 - firstWeekday + i);
      return {
        y: d.getFullYear(),
        m: d.getMonth(),
        day: d.getDate(),
        iso: toISO(d.getFullYear(), d.getMonth(), d.getDate()),
        inMonth: d.getMonth() === view.m,
      };
    });
    return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [view]);

  useEffect(() => {
    if (!pop) return;
    const onDown = (e: PointerEvent) => {
      if (!popRef.current?.contains(e.target as Node)) setPop(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPop(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pop]);

  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const openDay = (cell: Cell, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const width = 320;
    const estHeight = 300;
    const gap = 6;
    let left = Math.min(r.left, window.innerWidth - width - 8);
    left = Math.max(8, left);
    let top = r.bottom + gap;
    if (top + estHeight > window.innerHeight) top = Math.max(8, r.top - estHeight - gap);
    setPop({ cell, left, top });
  };

  return (
    <DashboardCard padded={false}>
      {/* Month header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="min-w-40 font-display text-lg font-semibold text-text-primary">{label}</h2>
          <div className="ml-1 flex items-center">
            {/* Icon buttons ride the shared 32px rounded-md control recipe. */}
            <button
              onClick={() => shift(-1)}
              className="grid h-8 w-8 place-items-center rounded-md text-icon-secondary transition-colors hover:bg-surface-subtle"
              aria-label="Previous month"
            >
              <Icon name="chevron_left" size={18} />
            </button>
            <button
              onClick={() => shift(1)}
              className="grid h-8 w-8 place-items-center rounded-md text-icon-secondary transition-colors hover:bg-surface-subtle"
              aria-label="Next month"
            >
              <Icon name="chevron_right" size={18} />
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="ml-1"
            onClick={() => setView({ y: CALENDAR_MONTH.year, m: CALENDAR_MONTH.month })}
          >
            Today
          </Button>
        </div>
        <Legend />
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-y border-border-default">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="border-r border-border-default px-2 py-2 text-xs font-medium text-text-secondary last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div>
        {weeks.map((week, wi) => {
          const bars = layoutWeek(spanning, week);
          const eventCells = week.flatMap((cell, col) =>
            events
              .filter((e) => e.start <= cell.iso && e.end >= cell.iso)
              .map((item, row) => ({ item, col, row, cell })),
          );
          const maxEventRows = eventCells.reduce((m, c) => Math.max(m, c.row + 1), 0);
          const barBase = 2 + maxEventRows;

          /* Lane cap: busy weeks never clip a run silently. When the
             lanes outgrow the cell, the last visible lane becomes a
             per-day "+N more" that opens the day popover (the truth). */
          const laneCount = bars.reduce((m, b) => Math.max(m, b.lane + 1), 0);
          const laneCap = maxEventRows > 0 ? 2 : 3;
          const visibleLanes = laneCount > laneCap ? laneCap - 1 : laneCount;
          const visibleBars = bars.filter((b) => b.lane < visibleLanes);
          const hiddenPerCol =
            laneCount > visibleLanes
              ? week.map(
                  (_, col) =>
                    bars.filter(
                      (b) => b.lane >= visibleLanes && b.startCol <= col && b.endCol >= col,
                    ).length,
                )
              : [];

          return (
            <div key={wi} className="relative border-b border-border-default last:border-b-0">
              {/* Click targets + gridlines. Each cell is a button, so each
                  carries its date (and what's on it) as its accessible
                  name — never 42 anonymous tab stops. */}
              <div className="grid grid-cols-7">
                {week.map((cell) => {
                  const dayCount = items.filter(
                    (it) => it.start <= cell.iso && it.end >= cell.iso,
                  ).length;
                  return (
                    <button
                      key={cell.iso}
                      onClick={(e) => openDay(cell, e.currentTarget)}
                      aria-label={`${MONTHS_SHORT[cell.m]} ${cell.day} — ${
                        dayCount === 0
                          ? "nothing scheduled"
                          : `${dayCount} ${dayCount === 1 ? "item" : "items"}`
                      }`}
                      className={cn(
                        // Sized so the capped lanes (day number + 3 bars,
                        // or events + 2) always fit uncut.
                        "min-h-32 border-r border-border-default transition-colors last:border-r-0",
                        cell.inMonth ? "hover:bg-surface-subtle/60" : "bg-surface-subtle/40",
                      )}
                    />
                  );
                })}
              </div>

              {/* Day numbers, key-date dots, and event bars */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-7 gap-y-1 overflow-hidden pb-1">
                {week.map((cell, ci) => (
                  <div key={cell.iso} style={{ gridColumn: ci + 1, gridRow: 1 }} className="px-2 pt-1.5">
                    <span
                      className={cn(
                        "inline-grid h-6 min-w-6 place-items-center rounded-pill px-1 font-display text-xs font-semibold tabular-nums",
                        cell.iso === CALENDAR_MONTH.today
                          ? "bg-accent-default text-text-on-accent"
                          : cell.inMonth
                            ? "text-text-secondary"
                            : "text-text-tertiary",
                      )}
                    >
                      {cell.day}
                    </span>
                  </div>
                ))}

                {eventCells.map(({ item, col, row, cell }) => (
                  <button
                    key={`${item.id}-${cell.iso}`}
                    title={item.title}
                    onClick={(e) => openDay(cell, e.currentTarget)}
                    style={{ gridColumn: col + 1, gridRow: 2 + row }}
                    className={cn(
                      "pointer-events-auto mx-1.5 flex h-5 items-center gap-1.5 truncate text-left text-xs font-semibold",
                      cell.inMonth ? "text-text-primary" : "text-text-tertiary",
                    )}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-pill bg-cal-event-dot" />
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}

                {visibleBars.map((bar) => (
                  <CalendarBar key={`${bar.id}-${wi}`} bar={bar} row={barBase + bar.lane} />
                ))}

                {hiddenPerCol.map((count, col) =>
                  count > 0 ? (
                    <button
                      key={`more-${week[col].iso}`}
                      onClick={(e) => openDay(week[col], e.currentTarget)}
                      style={{ gridColumn: col + 1, gridRow: barBase + visibleLanes }}
                      className="pointer-events-auto mx-1.5 flex h-5 items-center truncate text-left text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
                    >
                      +{count} more
                    </button>
                  ) : null,
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pop ? (
        <DayPopover
          ref={popRef}
          cell={pop.cell}
          items={items}
          left={pop.left}
          top={pop.top}
          onClose={() => setPop(null)}
        />
      ) : null}
    </DashboardCard>
  );
}

function CalendarBar({ bar, row }: { bar: PlacedBar; row: number }) {
  const className = cn(
    "pointer-events-auto mx-1 flex h-6 items-center truncate rounded-sm px-2 text-xs font-semibold",
    barClasses(bar),
  );
  const style = {
    gridColumn: `${bar.startCol + 1} / ${bar.endCol + 2}`,
    gridRow: row,
  };
  return bar.to ? (
    <Link to={bar.to} title={bar.title} style={style} className={cn(className, "hover:brightness-95")}>
      <span className="truncate">{bar.title}</span>
    </Link>
  ) : (
    <div style={style} title={bar.title} className={className}>
      <span className="truncate">{bar.title}</span>
    </div>
  );
}

function Legend() {
  const items = [
    ["bg-cal-campaign", "Campaign"],
    ["bg-cal-polst", "Single Polst"],
    ["bg-cal-event-dot", "Key date"],
  ] as const;
  return (
    <div className="flex items-center gap-3">
      {items.map(([dot, label]) => (
        <span key={label} className="flex items-center gap-1.5 text-xs text-text-secondary">
          <span className={cn("h-2.5 w-2.5 rounded-pill", dot)} />
          {label}
        </span>
      ))}
    </div>
  );
}

const DayPopover = forwardRef<
  HTMLDivElement,
  { cell: Cell; items: CalendarItem[]; left: number; top: number; onClose: () => void }
>(({ cell, items: allItems, left, top, onClose }, ref) => {
  const weekday = WEEKDAYS_FULL[new Date(cell.y, cell.m, cell.day).getDay()];
  const monthShort = new Date(cell.y, cell.m, 1).toLocaleString("en-US", { month: "short" });
  const items = allItems.filter((it) => it.start <= cell.iso && it.end >= cell.iso);

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-50 w-80 overflow-hidden rounded-card border border-border-default bg-surface-raised shadow-lg"
      role="dialog"
      aria-label={`${weekday}, ${monthShort} ${cell.day}`}
    >
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div>
          <p className="text-xs font-medium text-text-secondary">{weekday}</p>
          <p className="font-display text-base font-semibold text-text-primary">
            {monthShort} {cell.day}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-8 w-8 place-items-center rounded-md text-icon-secondary transition-colors hover:bg-surface-subtle"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto p-2">
        {items.length ? (
          items.map((item) => {
            const row = (
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-subtle text-icon-secondary">
                  <Icon name={KIND_ICON[item.kind]} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text-primary">
                    {item.title}
                  </span>
                  <span className="block text-xs capitalize text-text-secondary">
                    {item.kind === "date" ? "Key date" : item.kind}
                  </span>
                </span>
                {item.status ? <StatusBadge status={item.status} /> : null}
              </div>
            );
            return item.to ? (
              <Link
                key={item.id}
                to={item.to}
                onClick={onClose}
                className="block rounded-md p-2 transition-colors hover:bg-surface-subtle"
              >
                {row}
              </Link>
            ) : (
              <div key={item.id} className="rounded-md p-2">
                {row}
              </div>
            );
          })
        ) : (
          <p className="px-2 py-6 text-center text-sm text-text-secondary">
            Nothing scheduled on this day.
          </p>
        )}
      </div>

      <div className="flex gap-2 border-t border-border-default p-3">
        <Button size="sm" className="flex-1" asChild>
          <Link to="/campaigns/new" onClick={onClose}>
            New campaign
          </Link>
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" asChild>
          <Link to="/polsts/new" onClick={onClose}>
            New Polst
          </Link>
        </Button>
      </div>
    </div>
  );
});
DayPopover.displayName = "DayPopover";
