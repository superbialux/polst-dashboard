import { notFound } from 'next/navigation'
import {
  Award,
  Download,
  Lightbulb,
  MessagesSquare,
  ShieldCheck,
  Share2,
} from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/metric-card'
import { ChartCard } from '@/components/chart-card'
import { DonutChart, BarChart } from '@/components/charts'
import { RegionMap } from '@/components/region-map'
import { CampaignPolstsSection } from '@/components/polst/campaign-polsts-section'
import {
  getCampaign,
  getPolstsForCampaign,
  holidayCreative,
  formatNumber,
} from '@/lib/data'

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = getCampaign(slug)
  if (!campaign) notFound()

  const base = `/brand/decision-campaigns/${slug}`
  const d = holidayCreative
  const campaignPolsts = getPolstsForCampaign(slug)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Real-time results · updated 2m ago
        </p>
        <div className="flex flex-wrap gap-2">
          <LinkButton variant="outline" size="default" href={`${base}/insights`}>
            <Lightbulb className="size-4" />
            View Insights
          </LinkButton>
          <LinkButton
            variant="outline"
            size="default"
            href={`${base}/distribution`}
          >
            <Share2 className="size-4" />
            Distribution Assets
          </LinkButton>
          <LinkButton variant="ghost" size="default" href={`${base}/insights`}>
            <Download className="size-4" />
            Export
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Responses"
          value={formatNumber(d.responses)}
          icon={MessagesSquare}
        />
        <MetricCard label="Completion" value={`${d.completion}%`} />
        <MetricCard
          label="Winning Direction"
          value={d.winningOption}
          icon={Award}
          accent
        />
        <MetricCard
          label="Confidence"
          value={d.confidence}
          sub="Statistically significant"
          icon={ShieldCheck}
        />
      </div>

      <CampaignPolstsSection
        polsts={campaignPolsts}
        subtitle="Review the questions, creative options, and response splits that produced this recommendation."
      />

      <Card className="border-primary/30 bg-primary/[0.04]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Lightbulb className="size-4.5" />
          </span>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold">Executive Insight</p>
              <p className="mt-1 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground">
                Modern Holiday is the recommended direction. It won the core
                campaign Polst by 22 points, performed consistently across
                Instagram, Email, Website, and QR, and showed strongest
                preference among women 25–44.
              </p>
            </div>
            <LinkButton size="sm" href={`${base}/insights`}>
              View Full Recommendation
            </LinkButton>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="By Channel"
          interpretation="Instagram and Email drove the most responses, and Modern Holiday led the vote on every channel."
        >
          <DonutChart data={d.byChannel} />
        </ChartCard>

        <ChartCard
          title="By Geography"
          interpretation="Modern Holiday won in all four regions, with the West contributing the largest share of responses."
        >
          <RegionMap data={d.byRegion} />
        </ChartCard>
      </div>

      <ChartCard
        title="By Demographic"
        interpretation="Preference was strongest among 25–44 — the segment that aligns most closely with the premium creative direction."
      >
        <BarChart data={d.byDemographic} />
      </ChartCard>

      <Card className="overflow-hidden border-primary/30">
        <div className="flex flex-col gap-4 bg-primary/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Lightbulb className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Recommended Next Step
              </span>
            </div>
            <p className="max-w-2xl text-pretty text-base font-medium leading-relaxed">
              Create a follow-up Polst to test the final Modern Holiday headline
              before national rollout.
            </p>
          </div>
          <LinkButton size="lg" href="/brand/new-polst" className="shrink-0">
            Create Follow-Up Polst
          </LinkButton>
        </div>
      </Card>
    </div>
  )
}
