import { useState } from "react";
import {
  Chip,
  DashboardCard,
  DashboardPage,
  DataTable,
  DateRangeMenu,
  GeoMap,
  MixBars,
  SectionGrid,
  StatTile,
  TimeHeatmap,
  type DataColumn,
} from "@/components/dashboard";
import { RateCell } from "@/components/dashboard";
import { METRIC_INFO, fmtInt, fmtPct } from "@/lib/canon";
import { windowTileDelta } from "@/lib/engine";
import {
  HEATMAP_BUCKETS,
  HEATMAP_DAYS,
  answerHeat,
  browserMix,
  countryMix,
  deviceMix,
  platformMix,
  workspaceWindow,
  type CountryRow,
  type WindowRange,
} from "@/lib/workspace";

/* ── Audience — what anonymous voting can actually tell us ─────────
   Behavior (when people answer), technology (devices, platforms,
   browsers), geography (country mix), and volume (voters, views, votes
   per voter) — all derived from the workspace window. Age, gender, and
   income stay locked until respondent-level collection exists; nothing
   here is invented. */

/** The tile's delta line rides the shared windowTileDelta. The window and
 *  its comparison period are stated ONCE at band level — tiles never repeat
 *  the dates, so the compare label stays generic. */
const VS_PREVIOUS = "vs the previous period";
const NO_CHANGE = { zeroDetail: `No change ${VS_PREVIOUS}` };

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
    cell: (row) => (
      <span className="font-display font-semibold text-text-primary">{row.country}</span>
    ),
  },
  {
    header: "Share",
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtPct(row.share, 0)}</span>,
  },
  {
    header: "Voters",
    align: "right",
    cell: (row) => (
      <span className="tabular-nums">{row.voters > 0 ? fmtInt(row.voters) : "—"}</span>
    ),
  },
  {
    header: "Completion",
    align: "right",
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

  const tiles = [
    {
      label: "Voters",
      value: fmtInt(w.voters),
      info: METRIC_INFO.voters,
      ...windowTileDelta(w.voters, w.prev?.voters, VS_PREVIOUS, NO_CHANGE),
    },
    {
      label: "Views",
      value: fmtInt(w.views),
      info: METRIC_INFO.views,
      ...windowTileDelta(w.views, w.prev?.views, VS_PREVIOUS, NO_CHANGE),
    },
    {
      label: "Votes per voter",
      value: votesPerVoter !== null ? votesPerVoter.toFixed(1) : "—",
      info: METRIC_INFO.votesPerVoter,
      ...windowTileDelta(votesPerVoter, prevVotesPerVoter, VS_PREVIOUS, {
        ...NO_CHANGE,
        basis: "ratio",
      }),
    },
  ];

  return (
    <DashboardPage actions={<DateRangeMenu value={range} onChange={setRange} />}>
      {/* The window and its comparison period, said once for the band. */}
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          {w.label}
          {w.compareLabel ? ` · compared with ${w.compareLabel.slice(3)}` : ""}
        </p>
        <SectionGrid>
          {tiles.map((tile) => (
            <StatTile key={tile.label} className="lg:col-span-4" {...tile} />
          ))}
        </SectionGrid>
      </div>

      {/* items-start: short cards (Devices, Geography) keep their natural
          height beside tall neighbours instead of stretching into dead space. */}
      <SectionGrid className="items-start">
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

      <SectionGrid className="items-start">
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
