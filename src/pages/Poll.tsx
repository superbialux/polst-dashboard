import { useParams } from "react-router-dom";
import { HighestVolumeSection } from "@/components/Discover";
import { PageShell } from "@/components/PageShell";
import { PollCard } from "@/components/PollCard";
import { ALL_POLLS, pollSlug } from "@/lib/data";
import { NotFound } from "./NotFound";

/** Permalink for a single poll — where search results, discover rows, and
 *  notifications land. */
export function Poll() {
  const { slug } = useParams();
  const poll = ALL_POLLS.find((p) => pollSlug(p.question) === slug);

  if (!poll) return <NotFound />;

  return (
    <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
      <h1 className="sr-only">{poll.question}</h1>
      <div className="overflow-hidden rounded-card border border-border-default bg-card-bg shadow-sm">
        <PollCard {...poll} />
      </div>

      {/* Keep the session going — the busiest polls right below. */}
      <div className="mt-4 rounded-card border border-border-default bg-card-bg px-2.5 py-2.5 shadow-sm">
        <HighestVolumeSection className="pt-2" exclude={poll.question} />
      </div>
    </PageShell>
  );
}
