import { FEED_POLLS } from "@/cards/variants";
import { pollSlug, TOPICS, trendingHashtags } from "@/lib/data";
import { formatCount } from "@/lib/poll";
import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { Drawer, DrawerRow, DrawerSection } from "./Drawer";
import { Icon } from "./Icon";
import { MiniPoll } from "./MiniPoll";
import { type PollCardProps } from "./PollCard";

/** Top topics by volume — the same numbers the Topics directory shows. */
const TRENDING_TOPICS = TOPICS.slice(0, 5);

/** The feed's polls, busiest first — mirrors the cards they link to. */
const HIGHEST_VOLUME: PollCardProps[] = [...FEED_POLLS].sort(
  (a, b) => b.votes - a.votes,
);

type DrawerProps = { open: boolean; onClose: () => void };

/** Mobile left drawer: the discover content — the same sections the desktop
 *  right rail shows, with creation's mobile doorway up top. */
export function TrendingDrawer({ open, onClose }: DrawerProps) {
  const { openAuth, openNewPoll } = useUI();
  const { signedIn } = useSession();
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Trending">
      <div className="flex flex-col px-3">
        <button
          onClick={() => {
            onClose();
            if (signedIn) openNewPoll();
            else openAuth("signup");
          }}
          className="mx-2 flex h-10 items-center justify-center gap-1.5 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
        >
          <Icon name="add" size={20} weight={600} />
          Ask the world
        </button>
        <TrendingTopicsSection />
        <HighestVolumeSection />
      </div>
    </Drawer>
  );
}

/** Ranked topics list. Stacked in the drawer and boxed on desktop. */
export function TrendingTopicsSection({ className }: { className?: string }) {
  return (
    <DrawerSection
      title="Trending Topics"
      seeAllTo="/topics"
      className={className}
    >
      <ul>
        {TRENDING_TOPICS.map((t, i) => (
          <li key={t.name}>
            <DrawerRow to={`/topic/${encodeURIComponent(t.name)}`}>
              <span className="w-4 shrink-0 text-center font-sans text-xs font-medium text-text-secondary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-text-primary">
                  {t.name}
                </p>
                <p className="font-sans text-xs font-medium text-text-secondary">
                  {formatCount(t.polls)} polls · {formatCount(t.votes)} votes
                </p>
              </div>
              <Icon
                name="chevron_right"
                size={20}
                className="shrink-0 text-icon-tertiary"
              />
            </DrawerRow>
          </li>
        ))}
      </ul>
    </DrawerSection>
  );
}

/** Busiest polls in miniature — the feed's by default, or any scoped list
 *  (a category's, a city's). Stacked in the drawer, boxed on desktop. */
export function HighestVolumeSection({
  className,
  title = "Highest Volume",
  polls,
  exclude,
}: {
  className?: string;
  title?: string;
  /** Scoped list; omitted → the whole feed ranked by volume. */
  polls?: PollCardProps[];
  /** Question to leave out (e.g. the poll already on screen). */
  exclude?: string;
}) {
  const ranked = (polls ? [...polls].sort((a, b) => b.votes - a.votes) : HIGHEST_VOLUME)
    .filter((p) => p.question !== exclude)
    .slice(0, 5);
  if (ranked.length === 0) return null;
  return (
    <DrawerSection title={title} seeAll={false} className={className}>
      <ul className="flex flex-col gap-1">
        {ranked.map((p) => (
          <li key={p.question}>
            <PollMiniRow poll={p} />
          </li>
        ))}
      </ul>
    </DrawerSection>
  );
}

/** Hashtags ranked by volume — across the app or within a scoped list of
 *  polls — each linking to its hashtag page. */
export function TrendingHashtagsSection({
  className,
  polls,
}: {
  className?: string;
  polls?: PollCardProps[];
}) {
  const hashtags = trendingHashtags(polls).slice(0, 5);
  if (hashtags.length === 0) return null;
  return (
    <DrawerSection title="Trending Hashtags" seeAll={false} className={className}>
      <ul>
        {hashtags.map((h, i) => (
          <li key={h.tag}>
            <DrawerRow to={`/tag/${encodeURIComponent(h.tag)}`}>
              <span className="w-4 shrink-0 text-center font-sans text-xs font-medium text-text-secondary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-text-primary">
                  #{h.tag}
                </p>
                <p className="font-sans text-xs font-medium text-text-secondary">
                  {h.polls} {h.polls === 1 ? "poll" : "polls"} ·{" "}
                  {formatCount(h.votes)} votes
                </p>
              </div>
              <Icon
                name="chevron_right"
                size={20}
                className="shrink-0 text-icon-tertiary"
              />
            </DrawerRow>
          </li>
        ))}
      </ul>
    </DrawerSection>
  );
}

/** Desktop rail CTA into poll creation (mobile reaches it from the trending
 *  drawer and the tab bar instead). Shared by the home feed's rail and the
 *  search/answer pages so the doorway into creation looks the same. */
export function AskTheWorldCard() {
  const { openAuth, openNewPoll } = useUI();
  const { signedIn } = useSession();
  return (
    <button
      onClick={() => (signedIn ? openNewPoll() : openAuth("signup"))}
      className="group flex items-center gap-3 rounded-card border border-border-default bg-card-bg px-4 py-4 text-left shadow-sm transition-colors hover:bg-surface-subtle"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-accent-soft">
        <Icon name="add" size={22} weight={600} className="text-text-accent" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-bold leading-5 text-text-primary">
          Ask the world
        </span>
        <span className="block font-sans text-xs leading-4 text-text-secondary">
          Start a poll and see where everyone lands.
        </span>
      </span>
      <Icon
        name="arrow_forward"
        size={20}
        className="shrink-0 text-icon-tertiary transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

/** One poll in miniature — thumb, votes, question, shares. Used by Highest
 *  Volume and by search results; links to the poll's page. */
export function PollMiniRow({ poll }: { poll: PollCardProps }) {
  return (
    <DrawerRow
      to={`/poll/${pollSlug(poll.question)}`}
      className="items-start py-2"
    >
      <MiniPoll
        question={poll.question}
        options={poll.options}
        topLine={`${formatCount(poll.votes)} votes`}
      />
    </DrawerRow>
  );
}
