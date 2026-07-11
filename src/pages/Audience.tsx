import { useState } from "react";
import {
  Chip,
  DashboardCard,
  DashboardPage,
  DateRangeMenu,
  LockedCard,
  MixBars,
  SectionGrid,
  StatTile,
  TimeHeatmap,
} from "@/components/dashboard";
import { METRIC_INFO, fmtInt } from "@/lib/canon";
import { windowDelta } from "@/lib/engine";
import {
  HEATMAP_BUCKETS,
  HEATMAP_DAYS,
  answerHeat,
  deviceMix,
  platformMix,
  workspaceWindow,
  type WindowRange,
  type WorkspaceWindow,
} from "@/lib/workspace";

/* ── Audience — what anonymous voting can actually tell us ─────────
   Behavior (when people answer), technology (devices, platforms), and
   volume (voters, views, votes per voter) — all derived from the
   workspace window. Demographics stay locked until respondent-level
   collection exists; nothing here is invented. */

type TileDelta = { detail: string; trend: "up" | "down" | "flat" };

/** Delta line with its baseline stated, or the window itself when there
 *  is no comparable previous period (All time, near-empty baselines). */
const vsPrevious = (w: WorkspaceWindow, delta: number | null): TileDelta => {
  if (delta === null || !w.compareLabel) return { detail: w.label, trend: "flat" };
  if (delta === 0) return { detail: `No change ${w.compareLabel}`, trend: "flat" };
  return {
    detail: `${Math.abs(delta)}% ${w.compareLabel}`,
    trend: delta > 0 ? "up" : "down",
  };
};

/** % change for small-base ratios (votes per voter), where windowDelta's
 *  low-volume guard would always suppress the comparison. */
const ratioDelta = (current: number | null, previous: number | null) =>
  current !== null && previous !== null && previous > 0
    ? Math.round(((current - previous) / previous) * 100)
    : null;

/** The busiest day × 2-hour cell, spoken in the heatmap's own labels. */
const peakLabel = (heat: number[][]): string => {
  let best = { day: 0, slot: 0, value: -1 };
  heat.forEach((row, day) =>
    row.forEach((value, slot) => {
      if (value > best.value) best = { day, slot, value };
    }),
  );
  const end = HEATMAP_BUCKETS[(best.slot + 1) % HEATMAP_BUCKETS.length];
  return `Peak · ${HEATMAP_DAYS[best.day]} ${HEATMAP_BUCKETS[best.slot]}–${end}`;
};

export function AudiencePage() {
  const [range, setRange] = useState<WindowRange>("30D");
  const w = workspaceWindow(range);
  const heat = answerHeat(range);

  const votesPerVoter = w.voters > 0 ? w.votes / w.voters : null;
  const prevVotesPerVoter =
    w.prev && w.prev.voters > 0 ? w.prev.votes / w.prev.voters : null;

  const tiles = [
    {
      label: "Voters",
      value: fmtInt(w.voters),
      info: METRIC_INFO.voters,
      ...vsPrevious(w, w.prev ? windowDelta(w.voters, w.prev.voters) : null),
    },
    {
      label: "Views",
      value: fmtInt(w.views),
      info: METRIC_INFO.views,
      ...vsPrevious(w, w.prev ? windowDelta(w.views, w.prev.views) : null),
    },
    {
      label: "Votes per voter",
      value: votesPerVoter !== null ? votesPerVoter.toFixed(1) : "—",
      info: "Total votes ÷ voters for the period. A voter answering a three-question campaign counts as three votes.",
      ...vsPrevious(w, ratioDelta(votesPerVoter, prevVotesPerVoter)),
    },
  ];

  return (
    <DashboardPage actions={<DateRangeMenu value={range} onChange={setRange} />}>
      <SectionGrid>
        {tiles.map((tile) => (
          <StatTile key={tile.label} className="lg:col-span-4" {...tile} />
        ))}
      </SectionGrid>

      <SectionGrid>
        <DashboardCard
          title="When your audience answers"
          action={w.votes > 0 ? <Chip>{peakLabel(heat)}</Chip> : undefined}
          className="lg:col-span-8"
        >
          <TimeHeatmap values={heat} days={HEATMAP_DAYS} buckets={HEATMAP_BUCKETS} />
        </DashboardCard>
        <DashboardCard title="Devices" className="lg:col-span-4">
          <MixBars slices={deviceMix(range)} />
        </DashboardCard>
      </SectionGrid>

      <SectionGrid>
        {/* DOM order keeps Devices → Platforms adjacent when stacked;
            at lg the order classes put Demographics on the left. */}
        <DashboardCard title="Platforms" className="lg:order-2 lg:col-span-4">
          <MixBars slices={platformMix(range)} />
        </DashboardCard>
        <DashboardCard title="Demographics" className="lg:order-1 lg:col-span-8">
          <div className="space-y-3">
            <LockedCard
              title="Age & gender"
              description="Voting is anonymous today — these arrive with respondent-level collection."
            />
            <LockedCard
              title="Household income"
              description="Needs voters who link a profile; nothing is inferred from anonymous votes."
            />
            <LockedCard
              title="Geography"
              description="Country and city breakdowns ship once vote location is captured."
            />
          </div>
        </DashboardCard>
      </SectionGrid>
    </DashboardPage>
  );
}
