import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fmtDate } from "@/lib/canon";

/* ══════════════════════════════════════════════════════════════════
   TABLE CONTROLS — the list pages' shadcn layer.
   · DateRangePicker — Popover + Calendar range, the ONE date-range
     control (native date inputs retire).
   · TablePagination — shadcn pagination on a sticky footer bar, so
     the pager never scrolls away.
   ══════════════════════════════════════════════════════════════════ */

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISO = (iso: string): Date | undefined => {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** The one date-range control: a 32px secondary-button trigger stating
 *  the range (or its placeholder), a two-month range calendar in the
 *  popover, and an honest Clear. Values travel as ISO strings, empty
 *  meaning an open bound — the same contract the filters always had. */
export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder = "Date range",
  className,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo<DateRange | undefined>(() => {
    const f = fromISO(from);
    return f ? { from: f, to: fromISO(to) } : undefined;
  }, [from, to]);
  const label =
    from && to
      ? `${fmtDate(from)} – ${fmtDate(to)}`
      : from
        ? `From ${fmtDate(from)}`
        : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="md"
          className={cn("justify-start", !from && "text-text-tertiary", className)}
        >
          <Icon name="calendar_month" size={18} className="shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={selected?.from}
          selected={selected}
          onSelect={(range) =>
            onChange(range?.from ? toISO(range.from) : "", range?.to ? toISO(range.to) : "")
          }
        />
        <div className="flex justify-end border-t border-border-default p-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!from && !to}
            onClick={() => {
              onChange("", "");
              setOpen(false);
            }}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Status select ───────────────────────────────────────────────── */

/** The list status filter on shadcn Select — 32px trigger, filter glyph,
 *  one item per lifecycle view. */
export function StatusSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Status"
        className={cn("h-8 w-36 gap-1.5 text-sm font-medium", className)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon name="filter_list" size={16} className="shrink-0 text-icon-secondary" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/* ── View toggle ─────────────────────────────────────────────────── */

/** List ⇄ grid on shadcn ToggleGroup — 32px outline items, icon-only
 *  with accessible names. */
export function ViewToggle({
  value,
  onChange,
  className,
}: {
  value: "list" | "grid";
  onChange: (next: "list" | "grid") => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => next && onChange(next as "list" | "grid")}
      className={cn("gap-0 -space-x-px", className)}
    >
      <ToggleGroupItem value="list" aria-label="List view" className="h-8 w-9 rounded-r-none">
        <Icon name="table_rows" size={16} />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 w-9 rounded-l-none">
        <Icon name="grid_view" size={16} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

/* ── Pagination ──────────────────────────────────────────────────── */

/** Page numbers with a window around the current page; boundaries stay,
 *  gaps collapse to an ellipsis. */
const pageList = (page: number, pageCount: number): Array<number | "…"> => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i);
  const wanted = new Set([0, pageCount - 1, page - 1, page, page + 1]);
  const list: Array<number | "…"> = [];
  for (let i = 0; i < pageCount; i++) {
    if (wanted.has(i)) list.push(i);
    else if (list[list.length - 1] !== "…") list.push("…");
  }
  return list;
};

/** The list pager as a STICKY footer bar — its own raised card pinned
 *  to the scroller's bottom edge, so the count and the controls never
 *  scroll away. Left: the honest range ("1–8 of 17 polsts"); right:
 *  shadcn pagination. */
export function TablePagination({
  page,
  pageSize,
  total,
  onPage,
  noun,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  noun: string;
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const first = total === 0 ? 0 : safePage * pageSize + 1;
  const last = Math.min(total, (safePage + 1) * pageSize);

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-card border border-border-default bg-surface-raised px-4 py-2 shadow-sm",
        className,
      )}
    >
      <p className="text-sm text-text-secondary">
        <span className="font-semibold tabular-nums text-text-primary">
          {first}–{last}
        </span>{" "}
        of <span className="font-semibold tabular-nums text-text-primary">{total}</span> {noun}
      </p>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={safePage === 0}
              className={cn("h-8", safePage === 0 && "pointer-events-none opacity-50")}
              onClick={(e) => {
                e.preventDefault();
                onPage(safePage - 1);
              }}
            />
          </PaginationItem>
          {pageList(safePage, pageCount).map((p, i) =>
            p === "…" ? (
              <PaginationItem key={`gap-${i}`}>
                <span className="px-1.5 text-sm text-text-tertiary">…</span>
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === safePage}
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault();
                    onPage(p);
                  }}
                >
                  {p + 1}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={safePage >= pageCount - 1}
              className={cn("h-8", safePage >= pageCount - 1 && "pointer-events-none opacity-50")}
              onClick={(e) => {
                e.preventDefault();
                onPage(safePage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
