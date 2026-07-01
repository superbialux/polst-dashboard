import { useParams } from "react-router-dom";
import { DiscoveryPage } from "@/components/DiscoveryPage";
import {
  HighestVolumeSection,
  TrendingHashtagsSection,
  TrendingTopicsSection,
} from "@/components/Discover";
import { RailBox } from "@/components/RailBox";
import {
  pollsByCategory,
  pollsByCity,
  pollsByTag,
  popularPolls,
  searchPolls,
  TOPICS,
} from "@/lib/data";
import { formatCount } from "@/lib/poll";
import { type PollCardProps } from "@/components/PollCard";

/** Never-empty scope fill: exact matches, else related (token search),
 *  else the busiest polls overall — with the honest banner to match. */
function withFallback(
  exact: PollCardProps[],
  scope: string,
  emptyLabel: string,
): { polls: PollCardProps[]; notice?: string } {
  if (exact.length > 0) return { polls: exact };
  const related = searchPolls(scope);
  if (related.length > 0) {
    return {
      polls: related,
      notice: `${emptyLabel} yet — here's what's closest.`,
    };
  }
  return {
    polls: popularPolls(),
    notice: `${emptyLabel} yet — here's what's popular right now.`,
  };
}

/** /topic/:name — a category's feed, with its hashtags and busiest polls
 *  beside it. */
export function TopicFeed() {
  const { name = "" } = useParams();
  const { polls, notice } = withFallback(
    pollsByCategory(name),
    name,
    `No ${name} polls`,
  );
  const topic = TOPICS.find((t) => t.name.toLowerCase() === name.toLowerCase());

  return (
    <DiscoveryPage
      breadcrumbs={[{ label: "Topics", to: "/topics" }]}
      title={topic?.name ?? name}
      subtitle={
        topic
          ? `${topic.description} ${formatCount(topic.polls)} polls · ${formatCount(topic.votes)} votes.`
          : `Polls filed under ${name}.`
      }
      polls={polls}
      notice={notice}
      emptyTitle={`No ${name} polls yet`}
      rail={
        <>
          <RailBox>
            <TrendingHashtagsSection className="pt-2" polls={polls} />
          </RailBox>
          <RailBox>
            <HighestVolumeSection className="pt-2" polls={polls} />
          </RailBox>
        </>
      }
    />
  );
}

/** /tag/:tag — a hashtag's feed plus its busiest polls. */
export function TagFeed() {
  const { tag = "" } = useParams();
  const exact = pollsByTag(tag);
  const { polls, notice } = withFallback(exact, tag, `No #${tag} polls`);
  const votes = exact.reduce((sum, p) => sum + p.votes, 0);

  return (
    <DiscoveryPage
      title={`#${tag}`}
      subtitle={
        exact.length > 0
          ? `${exact.length} ${exact.length === 1 ? "poll" : "polls"} · ${formatCount(votes)} votes and counting.`
          : "A fresh hashtag — vote it into the charts."
      }
      polls={polls}
      notice={notice}
      emptyTitle={`No #${tag} polls yet`}
      rail={
        <RailBox>
          <HighestVolumeSection className="pt-2" polls={polls} />
        </RailBox>
      }
    />
  );
}

/** /place/:city — what a city is voting on: its topics and top polls. */
export function PlaceFeed() {
  const { city = "" } = useParams();
  const exact = pollsByCity(city);
  const { polls, notice } = withFallback(exact, city, `No polls from ${city}`);
  const votes = exact.reduce((sum, p) => sum + p.votes, 0);

  return (
    <DiscoveryPage
      title={city}
      subtitle={
        exact.length > 0
          ? `What ${city} is voting on right now — ${exact.length} ${exact.length === 1 ? "poll" : "polls"} · ${formatCount(votes)} votes.`
          : `Be the first to ask ${city} something.`
      }
      polls={polls}
      notice={notice}
      emptyTitle={`No polls from ${city} yet`}
      rail={
        <>
          <RailBox>
            <TrendingTopicsSection className="pt-2" />
          </RailBox>
          <RailBox>
            <HighestVolumeSection
              className="pt-2"
              title={exact.length > 0 ? `Top in ${city}` : "Top right now"}
              polls={polls}
            />
          </RailBox>
        </>
      }
    />
  );
}
