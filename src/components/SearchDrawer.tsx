import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchPolls, searchSlug } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PollMiniRow } from "./Discover";
import { Drawer, DrawerRow, DrawerSection } from "./Drawer";
import { Icon } from "./Icon";

/** Terms people search most — tapping one runs the search. */
const MOST_SEARCHED = [
  "best burger in chicago",
  "smart devices",
  "pizza or tacos",
  "dogs vs cats",
  "summer travel",
  "2026 elections",
];

type Props = { open: boolean; onClose: () => void };

/** Mobile right drawer: search only — most-searched terms while the field is
 *  empty, live poll results once a query is typed. Enter opens the
 *  aggregated answer page. */
export function SearchDrawer({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  return (
    <Drawer open={open} onClose={onClose} side="right" title="Search">
      <div className="flex flex-col px-3 pt-1">
        <SearchField
          className="mx-2"
          value={query}
          onChange={setQuery}
          onSubmit={(value) => {
            if (value.trim()) navigate(`/q/${searchSlug(value)}`);
          }}
        />
        <SearchContent query={query} onQueryChange={setQuery} />
      </div>
    </Drawer>
  );
}

/** The search surface itself — most-searched suggestions or live results,
 *  topped by the aggregated-answer destination. Shared by the mobile
 *  drawer and the desktop header popover. */
export function SearchContent({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const results = q ? searchPolls(q).slice(0, 6) : [];

  if (q === "") {
    return (
      <DrawerSection title="Most Searched" seeAll={false}>
        {MOST_SEARCHED.map((term) => (
          <DrawerRow key={term} onClick={() => onQueryChange(term)}>
            <Icon
              name="search"
              size={20}
              className="shrink-0 text-icon-tertiary"
            />
            <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-text-primary">
              {term}
            </span>
            <Icon
              name="north_west"
              size={18}
              className="shrink-0 text-icon-tertiary"
            />
          </DrawerRow>
        ))}
      </DrawerSection>
    );
  }

  return (
    <DrawerSection title="Results" seeAll={false}>
      {/* The aggregated answer leads — the page that answers the question
          instead of listing rows. Enter goes there too. */}
      <DrawerRow to={`/q/${searchSlug(q)}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-accent-soft">
          <Icon name="query_stats" size={20} className="text-text-accent" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-bold text-text-primary">
            “{query.trim()}”
          </span>
          <span className="block font-sans text-xs leading-4 text-text-secondary">
            See the aggregated answer
          </span>
        </span>
        <Icon
          name="arrow_forward"
          size={18}
          className="shrink-0 text-icon-tertiary"
        />
      </DrawerRow>

      {results.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {results.map((p) => (
            <li key={p.question}>
              <PollMiniRow poll={p} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 py-3 font-sans text-sm text-text-secondary">
          No exact poll matches for “{query.trim()}”.
        </p>
      )}
    </DrawerSection>
  );
}

/** The pill search input — controlled in the search drawer and the desktop
 *  header popover. The keyword editor on the answer pages reuses it too, with
 *  its own placeholder/label, so every search field in the app reads the same. */
export function SearchField({
  className,
  value,
  onChange,
  onFocus,
  onSubmit,
  placeholder = "Search Polst",
  ariaLabel = "Search Polst",
  autoFocus = false,
}: {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  /** Enter — open the aggregated answer for the typed query. */
  onSubmit?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-pill bg-surface-subtle px-3 py-2.5",
        className,
      )}
    >
      <Icon name="search" size={20} className="shrink-0 text-icon-tertiary" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        autoFocus={autoFocus}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onFocus={onFocus}
        onKeyDown={
          onSubmit
            ? (e) => {
                if (e.key === "Enter") onSubmit(e.currentTarget.value);
              }
            : undefined
        }
        className="w-full bg-transparent font-sans text-base text-text-primary outline-none placeholder:text-text-tertiary lg:text-sm"
      />
    </div>
  );
}
