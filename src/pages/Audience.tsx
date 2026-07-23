import { useState } from "react";
import {
  Chip,
  DashboardCard,
  DashboardPage,
  DataTable,
  DateRangeMenu,
  DonutChart,
  GeoMap,
  MixBars,
  SectionGrid,
  StatsStrip,
  TimeHeatmap,
  type DataColumn,
} from "@/components/dashboard";
import { RateCell } from "@/components/dashboard";
import { METRIC_INFO, fmtInt, fmtPct } from "@/lib/canon";
import { ratioDelta, windowDelta } from "@/lib/engine";
import {
  HEATMAP_BUCKETS,
  HEATMAP_DAYS,
  STAT_XTICKS,
  answerHeat,
  browserMix,
  countryMix,
  deviceMixCounts,
  platformMix,
  windowMetricSpark,
  workspaceWindow,
  type CountryRow,
  type Stat,
  type WindowRange,
} from "@/lib/workspace";

/* ── Audience — what anonymous voting can actually tell us ─────────
   Behavior (when people answer), technology (devices, platforms,
   browsers), geography (country mix), and volume (voters, views, votes
   per voter) — all derived from the workspace window. Age, gender, and
   income stay locked until respondent-level collection exists; nothing
   here is invented. */

/** A % change folded into the strip cell's chip anatomy. */
const stripDelta = (delta: number | null): Pick<Stat, "delta" | "trend"> => ({
  delta: delta === null ? "—" : `${Math.abs(delta)}%`,
  trend: delta === null || delta === 0 ? "flat" : delta > 0 ? "up" : "down",
});

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

const countryColumns: Array<DataColumn<CountryRow>> = [
  {
    header: "Country",
    sort: (row) => row.country,
    cell: (row) => (
      <span className="font-display font-semibold text-text-primary">{row.country}</span>
    ),
  },
  {
    header: "Share",
    align: "right",
    sort: (row) => row.share,
    cell: (row) => <span className="tabular-nums">{fmtPct(row.share, 0)}</span>,
  },
  {
    header: "Voters",
    align: "right",
    sort: (row) => row.voters,
    cell: (row) => (
      <span className="tabular-nums">{row.voters > 0 ? fmtInt(row.voters) : "—"}</span>
    ),
  },
  {
    header: "Completion",
    align: "right",
    sort: (row) => row.completionRate ?? -1,
    cell: (row) => RateCell(row.completionRate),
  },
];

export function AudiencePage() {
  const [range, setRange] = useState<WindowRange>("30D");
  const w = workspaceWindow(range);
  const heat = answerHeat(range);
  const countries = countryMix(range);

  const votesPerVoter = w.voters > 0 ? w.votes / w.voters : null;
  const prevVotesPerVoter =
    w.prev && w.prev.voters > 0 ? w.prev.votes / w.prev.voters : null;

  /* The Home stat-strip anatomy, folded by default (the quieter-page
     contract). Voters and views carry the window's real daily series;
     votes per voter is a ratio without a daily shape, so its cell stays
     sparkless and borrows the chart per the strip's built-in contract. */
  const stats: Stat[] = [
    {
      label: "Voters",
      value: fmtInt(w.voters),
      info: METRIC_INFO.voters,
      ...stripDelta(w.prev ? windowDelta(w.voters, w.prev.voters) : null),
      ...windowMetricSpark(range, "voters"),
    },
    {
      label: "Views",
      value: fmtInt(w.views),
      info: METRIC_INFO.views,
      ...stripDelta(w.prev ? windowDelta(w.views, w.prev.views) : null),
      ...windowMetricSpark(range, "views"),
    },
    {
      label: "Votes per voter",
      value: votesPerVoter !== null ? votesPerVoter.toFixed(1) : "—",
      info: METRIC_INFO.votesPerVoter,
      ...stripDelta(ratioDelta(votesPerVoter, prevVotesPerVoter)),
    },
  ];

  return (
    <DashboardPage>
      {/* Controls ride tight above the strip — the list pages' gap. The
          strip states the comparison window once at scope level. */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DateRangeMenu value={range} onChange={setRange} />
        </div>
        <StatsStrip
          stats={stats}
          xTicks={STAT_XTICKS[range]}
          scopeLabel={w.compareLabel ?? undefined}
          collapsible
        />
      </section>

      {/* ONE grid for all four cards: vertical gaps match the horizontal
          gap-4, and each row's cards stretch to equal height. */}
      <SectionGrid>
        <DashboardCard
          title="When your audience answers"
          action={w.votes > 0 ? <Chip>{peakLabel(heat)}</Chip> : undefined}
          className="lg:col-span-8"
        >
          <TimeHeatmap values={heat} days={HEATMAP_DAYS} buckets={HEATMAP_BUCKETS} />
        </DashboardCard>
        <DashboardCard title="Devices" className="lg:col-span-4">
          <DonutChart
            slices={deviceMixCounts(range)}
            centerValue={fmtInt(w.voters)}
            centerLabel="voters"
          />
        </DashboardCard>
        <DashboardCard
          title="Geography"
          description="Where the period's voters answered from."
          padded={false}
          className="lg:col-span-8"
        >
          {/* Map first for the glance; the table below stays the exact,
              accessible view of the same rows. */}
          <div className="px-4 pb-3 pt-4">
            <GeoMap
              countries={countries.map((c) => ({
                name: c.country,
                share: c.share,
                voters: c.voters,
              }))}
            />
          </div>
          <DataTable rows={countries} columns={countryColumns} />
        </DashboardCard>
        <DashboardCard title="Platforms" className="lg:col-span-4">
          <MixBars slices={platformMix(range)} />
          <p className="mt-5 border-t border-border-default pt-4 font-display text-sm font-semibold text-text-primary">
            Browsers
          </p>
          <MixBars className="mt-3" slices={browserMix(range)} />
        </DashboardCard>
      </SectionGrid>
    </DashboardPage>
  );
}
