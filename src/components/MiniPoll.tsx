import { type ReactNode } from "react";
import { voteShares, type PollOption } from "@/lib/poll";

/** A poll in miniature — split thumbnail with the OR disc beside a
 *  64px-tall text column (context line, question, shares). The Highest
 *  Volume rows and the multi-step results both render this. */
export function MiniPoll({
  question,
  options,
  topLine,
}: {
  question: string;
  options: [PollOption, PollOption];
  /** Context line above the question (votes, your verdict, …). */
  topLine: ReactNode;
}) {
  return (
    <>
      <PollThumb options={options} />
      {/* Text column matches the 64px thumb, rows spread to fill it. */}
      <div className="flex h-16 min-w-0 flex-1 flex-col justify-between">
        <p className="truncate font-sans text-xs font-medium text-text-secondary">
          {topLine}
        </p>
        <p className="truncate font-display text-sm font-bold leading-5 text-text-primary">
          {question}
        </p>
        <MiniResults options={options} />
      </div>
    </>
  );
}

/** Mini A/B poll thumbnail — the card's option pair + OR disc in miniature. */
function PollThumb({ options }: { options: [PollOption, PollOption] }) {
  return (
    <div className="relative grid h-16 w-16 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-md bg-surface-strong">
      <img
        src={options[0].image}
        alt=""
        className="h-full w-full object-cover"
      />
      <img
        src={options[1].image}
        alt=""
        className="h-full w-full object-cover"
      />
      <span className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-surface-raised font-display text-[10px] font-bold text-text-primary shadow-sm">
        OR
      </span>
    </div>
  );
}

/** Echoes the card's results: the shares meet at the centre divider (numbers
 *  at the seam, like the bars), labels on the outside. */
function MiniResults({ options }: { options: [PollOption, PollOption] }) {
  const [pct0, pct1] = voteShares(options);
  return (
    <div className="flex items-center gap-1.5 font-sans text-xs font-medium text-text-secondary">
      <span className="min-w-0 truncate">{options[0].label}</span>
      <span className="shrink-0 font-semibold text-text-primary">{pct0}%</span>
      <span aria-hidden className="h-3 w-px shrink-0 bg-border-strong" />
      <span className="shrink-0 font-semibold text-text-primary">{pct1}%</span>
      <span className="min-w-0 truncate">{options[1].label}</span>
    </div>
  );
}
