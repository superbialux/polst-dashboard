import { Icon } from "./Icon";

const TAGS = [
  "elections",
  "policy",
  "government",
  "democracy",
  "voting",
  "midterms",
  "campaigns",
  "china",
];

export function TopicChips({ topic = "Politics" }: { topic?: string }) {
  return (
    <section className="flex w-full flex-col gap-4">
      <header className="flex items-center gap-1.5 px-4">
        <h2 className="font-display text-lg font-bold leading-7 text-text-primary">
          {topic}
        </h2>
        <Icon name="chevron_right" size={20} className="text-icon-primary" />
      </header>
      <div className="flex items-start gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TAGS.map((tag, i) => (
          <Chip key={tag} label={tag} active={i === 0} />
        ))}
      </div>
    </section>
  );
}

function Chip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      aria-pressed={active}
      className={
        "flex shrink-0 items-center gap-2 rounded-md py-2 pl-2 pr-3 text-sm font-semibold leading-5 text-text-primary transition-colors " +
        (active
          ? "border border-chip-border-active bg-chip-bg-active"
          : "border border-transparent bg-chip-bg hover:bg-surface-strong")
      }
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-chip-icon-bg">
        <Icon name="tag" size={16} className="text-chip-icon-fg" weight={600} />
      </span>
      {label}
    </button>
  );
}
