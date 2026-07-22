import { notFound } from 'next/navigation'
import {
  Award,
  Download,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaLine } from '@/components/charts'
import { PolstResultCard } from '@/components/polst/polst-result-card'
import { CampaignReportView } from '@/components/report/campaign-report'
import {
  getCampaign,
  getPolstsForCampaign,
  getReport,
  insights,
  holidayCreative,
} from '@/lib/data'

const FINDING_ICONS = {
  win: Award,
  segment: Users,
  channel: TrendingUp,
  watch: TriangleAlert,
} as const

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = getCampaign(slug)
  if (!campaign) notFound()

  const d = insights
  const report = getReport(slug)
  const campaignPolsts = getPolstsForCampaign(slug)

  const heroHeadline = report?.headline ?? d.headline
  const heroSummary = report?.summary ?? d.summary
  const heroConfidence = report?.confidence ?? d.confidence

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/30">
        <div className="bg-primary/[0.06] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              AI-Generated Recommendation
            </span>
          </div>
          <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {heroHeadline}
          </h2>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            {heroSummary}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <LinkButton size="lg" href="/brand/new-polst">
              <Sparkles className="size-4" />
              Create Follow-Up Polst
            </LinkButton>
            <LinkButton
              variant="outline"
              size="lg"
              href={`/brand/decision-campaigns/${slug}/overview`}
            >
              <Download className="size-4" />
              Export Report
            </LinkButton>
            <span className="ml-auto flex items-center gap-2 text-sm">
              <span className="font-semibold text-primary">
                {heroConfidence}%
              </span>
              <span className="text-muted-foreground">confidence</span>
            </span>
          </div>
        </div>
      </Card>

      {report ? (
        <CampaignReportView report={report} />
      ) : (
        <ResultsAnalysis
          insights={d}
          polsts={campaignPolsts}
          trend={holidayCreative.trend}
        />
      )}
    </div>
  )
}

function ResultsAnalysis({
  insights: d,
  polsts: campaignPolsts,
  trend,
}: {
  insights: typeof insights
  polsts: ReturnType<typeof getPolstsForCampaign>
  trend: number[]
}) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/[0.04]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Why confidence is {d.confidenceLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed text-muted-foreground">
            {d.confidenceExplanation}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Polsts Analyzed
          </h2>
          <p className="text-sm text-muted-foreground">
            {`${campaignPolsts.length} questions answered in sequence — the full Polst chain behind this recommendation.`}
          </p>
        </div>
        <div className="space-y-4">
          {campaignPolsts.map((p) => (
            <PolstResultCard key={p.id} polst={p} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Key Findings
          </h3>
          {d.keyFindings.map((f) => {
            const Icon = FINDING_ICONS[f.type as keyof typeof FINDING_ICONS]
            const watch = f.type === 'watch'
            return (
              <Card key={f.title}>
                <CardContent className="flex items-start gap-3 p-4">
                  <span
                    className={
                      watch
                        ? 'grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive'
                        : 'grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'
                    }
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-sm text-muted-foreground">{f.detail}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preference Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaLine data={trend} />
            </CardContent>
          </Card>

          <Card className="bg-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="size-4 text-primary" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {d.recommendations.map((r, i) => (
                  <li key={r} className="flex gap-3 text-sm">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/30">
        <div className="flex flex-col gap-4 bg-primary/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                {d.followUp.title}
              </span>
            </div>
            <p className="text-pretty text-lg font-semibold tracking-tight">
              {d.followUp.question}
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {d.followUp.reason}
            </p>
          </div>
          <LinkButton size="lg" href="/brand/new-polst" className="shrink-0">
            <Sparkles className="size-4" />
            Create Follow-Up Polst
          </LinkButton>
        </div>
      </Card>
    </div>
  )
}
