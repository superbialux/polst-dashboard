import {
  BarChart,
  DashboardCard,
  DashboardPage,
  LockedCard,
  MixBars,
  SectionGrid,
  SplitBar,
  StatTile,
} from "@/components/dashboard";
import {
  AGE_MIX,
  AUDIENCE_STATS,
  AUDIENCE_TREND,
  DEVICE_MIX,
  NEW_VS_RETURNING,
  PLATFORM_MIX,
  TOP_INTERESTS,
  US_SPLIT,
} from "@/lib/workspace";

/** Audience shows only what we actually collect. Everything else is an
 *  honest locked state — no invented demographics. */
export function AudiencePage() {
  return (
    <DashboardPage
    >
      <SectionGrid>
        {AUDIENCE_STATS.map((stat) => (
          <StatTile
            key={stat.label}
            className="lg:col-span-3"
            label={stat.label}
            value={stat.value}
            detail={stat.detail}
            trend={stat.trend}
          />
        ))}
        <StatTile
          className="lg:col-span-3"
          label="Polls per session"
          value="3.2"
          detail="+0.4 vs prev. 30 days"
          trend="up"
        />
      </SectionGrid>

      <SectionGrid>
        <DashboardCard
          title="Engagement trend"
          description="Engaged respondents per week, trailing 12 weeks."
          className="lg:col-span-8"
        >
          <BarChart values={AUDIENCE_TREND} xTicks={["12 weeks ago", "6 weeks ago", "This week"]} />
        </DashboardCard>
        <DashboardCard title="New vs returning" className="lg:col-span-4">
          <MixBars
            slices={[
              { label: "New respondents", value: NEW_VS_RETURNING.new },
              { label: "Returning", value: NEW_VS_RETURNING.returning },
            ]}
          />
          <p className="mt-4 text-sm leading-6 text-text-secondary">
            Almost two in five voters have answered one of your Polsts before —
            a returning audience you can re-ask.
          </p>
        </DashboardCard>
      </SectionGrid>

      <SectionGrid>
        <DashboardCard
          title="Top interests"
          className="lg:col-span-4"
        >
          <MixBars slices={TOP_INTERESTS} />
        </DashboardCard>
        <DashboardCard
          title="Devices"
          className="lg:col-span-4"
        >
          <MixBars slices={DEVICE_MIX} />
        </DashboardCard>
        <DashboardCard
          title="Operating systems"
          className="lg:col-span-4"
        >
          <MixBars slices={PLATFORM_MIX} />
        </DashboardCard>
      </SectionGrid>

      <DashboardCard
        title="Demographics"
      >
        <SectionGrid>
          <div className="space-y-6 lg:col-span-6">
            <div>
              <p className="mb-3 font-display text-sm font-bold text-text-primary">Age</p>
              <MixBars slices={AGE_MIX} />
            </div>
            <div>
              <p className="mb-3 font-display text-sm font-bold text-text-primary">Region</p>
              <SplitBar split={US_SPLIT} />
            </div>
          </div>
          <div className="space-y-4 lg:col-span-6">
            <LockedCard
              title="Gender"
              description="Unlocks once respondent-level collection is live."
            />
            <LockedCard
              title="Income"
              description="Unlocks once respondent-level collection is live."
            />
            <LockedCard
              title="City-level geography"
              description="Regional split is live above; city-level maps arrive once collection supports them."
              chip="Next phase"
            />
          </div>
        </SectionGrid>
      </DashboardCard>
    </DashboardPage>
  );
}
