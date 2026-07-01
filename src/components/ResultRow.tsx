import { Icon } from "./Icon";
import {
  voteShares,
  type PollOption,
} from "./PollCard";
import { cn } from "@/lib/utils";

/** Compact after-vote summary for one poll: the question, both options as
 *  labelled track bars, and where your pick landed (Majority / Split /
 *  Minority). Shared by the series results screen and the profile Results
 *  tab. */
export function ResultRow({
  question,
  options,
  votedFor,
}: {
  question: string;
  options: [PollOption, PollOption];
  votedFor: string;
}) {
  const shares = voteShares(options);
  const votedIndex = options.findIndex((o) => o.label === votedFor);
  const verdict =
    shares[0] === shares[1]
      ? "Split"
      : votedIndex === (shares[0] > shares[1] ? 0 : 1)
        ? "Majority"
        : "Minority";

  return (
    <div className="flex flex-col gap-2.5 px-2.5 py-3">
      <h3 className="font-display text-sm font-bold leading-5 text-text-primary lg:text-base lg:leading-6">
        {question}
      </h3>

      {options.map((option, i) => {
        const isVote = i === votedIndex;
        return (
          <div key={option.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={cn(
                  "flex min-w-0 items-center gap-1 truncate font-sans text-sm leading-5",
                  isVote
                    ? "font-semibold text-text-primary"
                    : "text-text-secondary",
                )}
              >
                {option.label}
                {isVote && (
                  <Icon
                    name="check_circle"
                    size={14}
                    filled
                    className="shrink-0 text-accent-default"
                  />
                )}
              </span>
              <span
                className={cn(
                  "shrink-0 font-sans text-sm leading-5",
                  isVote
                    ? "font-semibold text-text-primary"
                    : "text-text-secondary",
                )}
              >
                {shares[i]}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-pill bg-surface-strong">
              <div
                className={cn(
                  "h-full rounded-pill",
                  isVote ? "bg-accent-default" : "bg-border-strong",
                )}
                style={{ width: `${shares[i]}%` }}
              />
            </div>
          </div>
        );
      })}

      <p className="flex items-center gap-1.5 font-sans text-xs leading-4 text-text-secondary">
        <span>
          You voted{" "}
          <span className="font-semibold text-text-primary">{votedFor}</span>
        </span>
        <span aria-hidden className="h-0.5 w-0.5 rounded-full bg-current" />
        {/* Majority earns the success ink; Minority isn't an error, so it
            stays neutral. */}
        <span
          className={cn(
            "font-semibold",
            verdict === "Majority" && "text-status-success",
          )}
        >
          {verdict}
        </span>
      </p>
    </div>
  );
}
