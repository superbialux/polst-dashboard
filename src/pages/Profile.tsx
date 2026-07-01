import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { PageShell } from "@/components/PageShell";
import { PollCard, formatCompact } from "@/components/PollCard";
import { ResultRow } from "@/components/ResultRow";
import { useUI } from "@/lib/ui";
import {
  PROFILE_ACTIVITY,
  PROFILE_LIKES,
  PROFILE_RESULTS,
  PROFILE_SAVED,
  type ActivityKind,
} from "@/lib/data";
import { ACCOUNT } from "@/lib/session";
import { cn } from "@/lib/utils";

const TABS = ["Activity", "Drafts", "Likes", "Saved", "Results"] as const;
type Tab = (typeof TABS)[number];

/** The signed-in account's profile: identity card, audience stats, and the
 *  account's footprint (activity, drafts, likes, saves, vote results). */
export function Profile() {
  const [tab, setTab] = useState<Tab>("Activity");

  return (
    <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
      <h1 className="sr-only">{ACCOUNT.name} — profile</h1>

      <AuthGate
        title="Sign in to see your profile"
        body="Your polls, votes, likes, and saves live here."
      >
      <ProfileCard />

      {/* Tab chips — the card stack below swaps per tab. */}
      <nav aria-label="Profile sections" className="mt-4">
        <ul className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <li key={t}>
              <button
                onClick={() => setTab(t)}
                aria-pressed={t === tab}
                className={cn(
                  "inline-flex shrink-0 items-center rounded-md border border-border-default px-2.5 py-2 font-display text-sm font-bold leading-5 text-tabchip-fg transition-colors",
                  t === tab
                    ? "bg-tabchip-bg-active"
                    : "bg-transparent hover:bg-surface-strong",
                )}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4 flex w-full flex-col divide-y divide-border-default overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm">
        <TabContent tab={tab} />
      </div>
      </AuthGate>
    </PageShell>
  );
}

function ProfileCard() {
  return (
    <section
      aria-label="Account"
      className="rounded-card border border-border-default bg-card-bg px-4 py-4 shadow-sm lg:px-5 lg:py-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4">
          <Avatar
            color="var(--color-purple-tint)"
            textColor="var(--color-brand-purple)"
            label={ACCOUNT.initials}
            size={56}
            className="lg:h-[72px] lg:w-[72px] [&>span]:text-lg lg:[&>span]:text-xl"
          />
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold leading-[26px] text-text-primary lg:text-2xl lg:leading-8">
              {ACCOUNT.name}
            </h2>
            <p className="truncate font-sans text-sm leading-5 text-text-secondary">
              @{ACCOUNT.handle}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-sans text-xs leading-4 text-text-secondary lg:text-sm lg:leading-5">
              <span className="flex items-center gap-0.5 whitespace-nowrap">
                <Icon name="location_on" size={14} />
                {ACCOUNT.location}
              </span>
              <span
                aria-hidden
                className="hidden h-0.5 w-0.5 rounded-full bg-current sm:block"
              />
              <span className="whitespace-nowrap">Joined {ACCOUNT.joined}</span>
            </p>
          </div>
        </div>

        <Link
          to="/settings"
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border-default px-2.5 py-1.5 font-display text-sm font-bold leading-5 text-text-primary transition-colors hover:bg-surface-subtle lg:self-center"
        >
          <Icon name="edit" size={16} />
          Edit Profile
        </Link>
      </div>

      {/* flex-wrap: at 390px and below the four stats break onto two lines
          instead of clipping off the right edge. */}
      <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border-default pt-3.5 lg:gap-x-7">
        {(
          [
            ["Following", ACCOUNT.following],
            ["Followers", ACCOUNT.followers],
            ["Polls", ACCOUNT.polls],
            ["Votes", ACCOUNT.votes],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-1.5">
            <dd className="font-display text-sm font-bold leading-5 text-text-primary lg:text-base">
              {formatCompact(value)}
            </dd>
            <dt className="font-sans text-xs leading-4 text-text-secondary lg:text-sm lg:leading-5">
              {label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

const ACTIVITY_COPY: Record<ActivityKind, { icon: string; text: string }> = {
  started: { icon: "add_circle", text: "started a poll" },
  shared: { icon: "repeat", text: "shared a poll" },
  voted: { icon: "how_to_vote", text: "voted" },
  liked: { icon: "favorite", text: "liked a poll" },
};

function TabContent({ tab }: { tab: Tab }) {
  const { openNewPoll } = useUI();

  switch (tab) {
    case "Activity":
      return (
        <>
          {PROFILE_ACTIVITY.map((item, i) => {
            const copy = ACTIVITY_COPY[item.kind];
            return (
              <article key={i} className="flex flex-col">
                <p className="flex items-center gap-1.5 px-2.5 pt-2.5 font-sans text-xs leading-4 text-text-secondary lg:text-sm lg:leading-5">
                  <Icon name={copy.icon} size={16} className="text-icon-tertiary" />
                  <span className="min-w-0 truncate">
                    <span className="font-semibold text-text-primary">
                      {ACCOUNT.name}
                    </span>{" "}
                    {copy.text}
                    {item.kind === "voted" && item.votedFor && (
                      <>
                        {" "}
                        <span className="font-semibold text-text-primary">
                          {item.votedFor}
                        </span>
                      </>
                    )}{" "}
                    · {item.ago} ago
                  </span>
                </p>
                <PollCard {...item.poll} />
              </article>
            );
          })}
        </>
      );

    case "Drafts":
      return (
        <EmptyState
          icon="edit_note"
          title="No drafts yet"
          body="Polls you start but don't post will wait for you here."
          action={
            <button
              onClick={openNewPoll}
              className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
            >
              Ask the world
            </button>
          }
        />
      );

    case "Likes":
      return (
        <>
          {PROFILE_LIKES.map((poll) => (
            <PollCard key={poll.question} {...poll} />
          ))}
        </>
      );

    case "Saved":
      return (
        <>
          {PROFILE_SAVED.map((poll) => (
            <PollCard key={poll.question} {...poll} />
          ))}
        </>
      );

    case "Results":
      return (
        <>
          {PROFILE_RESULTS.map(({ poll, votedFor }) => (
            <ResultRow
              key={poll.question}
              question={poll.question}
              options={poll.options}
              votedFor={votedFor}
            />
          ))}
        </>
      );
  }
}
