import { useState } from "react";
import { TOPICS } from "@/lib/data";
import { TONE, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type TabDef = { label: string; icon?: string; tone?: Tone };

const PRIMARY: TabDef[] = [
  { label: "Trending", icon: "local_fire_department", tone: "red" },
  { label: "For You", icon: "sentiment_satisfied", tone: "violet" },
  { label: "Following", icon: "favorite", tone: "green" },
];

/** Topic chips mirror the Topics directory so the two surfaces agree. */
const TOPIC_TABS: TabDef[] = TOPICS.slice(0, 6).map((t) => ({
  label: t.name,
}));

export function CategoryTabs({
  active = "Trending",
  onSelect,
}: {
  active?: string;
  onSelect?: (label: string) => void;
}) {
  const [scrolledX, setScrolledX] = useState(false);

  return (
    // Alignment is owned by the page container (it left-aligns the tabs with
    // the feed card); px drops on desktop where the card edge is the
    // container edge.
    // Desktop: no own padding — a 1rem top margin matches the 1rem the feed
    // leaves below the row, so the rhythm is gap / tabs / gap / feed.
    <nav
      aria-label="Categories"
      className="w-full bg-page-feed py-2 lg:mt-4 lg:py-0"
    >
      {/* Overflowing chips fade out at the right edge instead of cutting
          hard; once scrolled, the left edge fades too. The end padding
          keeps fully-scrolled (or fully fitting) chips clear of the fade
          zone. */}
      <ul
        onScroll={(e) => setScrolledX(e.currentTarget.scrollLeft > 4)}
        className={cn(
          "flex items-center gap-2 overflow-x-auto px-2.5 pr-8 [scrollbar-width:none] lg:pl-0 lg:pr-10 [&::-webkit-scrollbar]:hidden",
          scrolledX
            ? "[mask-image:linear-gradient(to_right,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent)]"
            : "[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]",
        )}
      >
        <li className="flex shrink-0 items-center gap-1.5">
          {PRIMARY.map((t) => (
            <TabChip
              key={t.label}
              {...t}
              active={t.label === active}
              onSelect={onSelect}
            />
          ))}
        </li>
        <li
          aria-hidden
          className="h-[9px] w-px shrink-0 self-center bg-border-strong"
        />
        <li className="flex shrink-0 items-center gap-1.5">
          {TOPIC_TABS.map((t) => (
            <TabChip
              key={t.label}
              {...t}
              active={t.label === active}
              onSelect={onSelect}
            />
          ))}
        </li>
      </ul>
    </nav>
  );
}

function TabChip({
  label,
  icon,
  tone = "neutral",
  active,
  onSelect,
}: TabDef & { active: boolean; onSelect?: (label: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(label)}
      aria-pressed={active}
      className={
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border font-display text-sm font-bold leading-5 text-tabchip-fg transition-colors " +
        (icon ? "pl-2 pr-2.5 py-2" : "px-2.5 py-2") +
        " " +
        (active
          ? "border-border-default bg-tabchip-bg-active"
          : "border-border-default bg-transparent hover:bg-surface-strong")
      }
    >
      {icon && (
        <span className="relative inline-grid shrink-0 place-items-center">
          {active && (
            <span
              aria-hidden
              className={
                "absolute left-1/2 top-1/2 h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full " +
                TONE[tone].ring
              }
            />
          )}
          <Icon
            name={icon}
            size={20}
            className={
              "relative " + (active ? TONE[tone].text : "text-tabchip-fg")
            }
          />
        </span>
      )}
      {label}
    </button>
  );
}
