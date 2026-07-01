import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { PageShell } from "@/components/PageShell";
import { useToast } from "@/components/Toast";
import { TOPICS, type Topic } from "@/lib/data";
import { formatCount } from "@/components/PollCard";
import { cn } from "@/lib/utils";

/** Topic directory: every category as a card — cover, description, volume,
 *  and its busiest subtopics — with follow as the primary action. */
export function Topics() {
  return (
    <PageShell>
      <header className="px-0.5 pb-4 lg:pb-6">
        <h1 className="font-display text-xl font-bold leading-7 text-text-primary lg:text-2xl lg:leading-8">
          Browse Topics
        </h1>
        <p className="mt-0.5 font-sans text-sm leading-5 text-text-secondary">
          Discover polls by category and follow the topics you care about.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOPICS.map((topic, i) => (
          <li key={topic.name}>
            <TopicCard topic={topic} aboveFold={i < 6} />
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

function TopicCard({
  topic,
  aboveFold = false,
}: {
  topic: Topic;
  /** Above-the-fold covers load eagerly so the grid never opens with gray
   *  holes. */
  aboveFold?: boolean;
}) {
  const [following, setFollowing] = useState(false);
  const toast = useToast();

  const toggleFollow = () => {
    setFollowing((v) => !v);
    toast(following ? `Unfollowed ${topic.name}` : `Following ${topic.name}`);
  };

  return (
    // relative: the title carries a stretched link covering the card, so
    // the whole tile opens the topic; buttons/chips sit above it on z-10.
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm transition-colors focus-within:border-border-strong hover:border-border-strong">
      <div className="relative h-28 overflow-hidden bg-surface-subtle">
        {/* Designed fallback behind the photo, so a slow or failed load
            reads as intentional rather than broken. */}
        <span className="absolute inset-0 grid place-items-center">
          <Icon name="tag" size={32} className="text-icon-tertiary" />
        </span>
        <img
          src={topic.image}
          alt=""
          loading={aboveFold ? "eager" : "lazy"}
          className="relative h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold leading-6 text-text-primary">
            <Link
              to={`/topic/${encodeURIComponent(topic.name)}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {topic.name}
            </Link>
          </h2>
          <button
            onClick={toggleFollow}
            aria-pressed={following}
            className={cn(
              "relative z-10 flex shrink-0 items-center justify-center rounded-md border px-2.5 py-1 font-display text-sm font-bold leading-5 transition-colors",
              following
                ? "border-transparent bg-surface-subtle text-text-secondary hover:text-text-primary"
                : "border-border-default text-text-primary hover:bg-surface-subtle",
            )}
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>

        <p className="mt-0.5 font-sans text-sm leading-5 text-text-secondary">
          {topic.description}
        </p>

        <p className="mt-2 flex items-center gap-1.5 font-sans text-xs leading-4 text-text-secondary">
          <span>
            <span className="font-semibold text-text-primary">
              {formatCount(topic.polls)}
            </span>{" "}
            Polls
          </span>
          <span aria-hidden className="h-0.5 w-0.5 rounded-full bg-current" />
          <span>
            <span className="font-semibold text-text-primary">
              {formatCount(topic.votes)}
            </span>{" "}
            Votes
          </span>
        </p>

        {/* Busiest subtopics — each a real hashtag page — trailing into
            the topic-page affordance. */}
        <div className="mt-auto flex items-center gap-1.5 pt-3">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
            {topic.subtopics.slice(0, 3).map((sub) => (
              <Link
                key={sub}
                to={`/tag/${encodeURIComponent(sub)}`}
                className="relative z-10 flex shrink-0 items-center gap-1 rounded-md bg-card-tag-bg px-2 py-1 font-sans text-xs font-medium leading-4 text-text-secondary transition-colors hover:bg-surface-strong hover:text-text-primary"
              >
                <Icon name="tag" size={14} className="text-icon-tertiary" />
                {sub}
              </Link>
            ))}
          </div>
          <span
            aria-hidden
            className="grid h-6 w-6 shrink-0 place-items-center text-icon-tertiary transition-transform group-hover:translate-x-0.5"
          >
            <Icon name="chevron_right" size={18} />
          </span>
        </div>
      </div>
    </article>
  );
}
