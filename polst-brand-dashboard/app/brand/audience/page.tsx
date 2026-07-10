import {
  Activity,
  ArrowRight,
  Repeat,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { Breadcrumb, PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { MetricCard } from '@/components/metric-card'
import { ChartCard } from '@/components/chart-card'
import { BarChart, AreaLine } from '@/components/charts'
import { audience, formatNumber } from '@/lib/data'

export default function AudiencePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <Breadcrumb items={[{ label: 'Audience' }]} />
          <PageHeader
            title="Audience"
            subtitle="Understand who is responding to your Polsts and what topics drive the strongest decision signal."
          />
        </div>
        <LinkButton href="/brand/new-polst" size="lg" className="shrink-0">
          <Sparkles className="size-4" />
          Create Audience-Informed Polst
        </LinkButton>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Followers"
          value={formatNumber(audience.followers)}
          sub="Following your brand or Polsts"
          icon={Users}
          accent
        />
        <MetricCard
          label="Previous Respondents"
          value={formatNumber(audience.previousRespondents)}
          sub="Answered at least one Polst"
          icon={UserRound}
        />
        <MetricCard
          label="Response Reach"
          value={audience.responseReach}
          sub="Reach beyond your followers"
          icon={Repeat}
        />
        <MetricCard
          label="Repeat Respondents"
          value={formatNumber(audience.repeatRespondents)}
          sub="Answered more than one Polst"
          icon={Activity}
        />
      </div>

      {/* Audience signal quality */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Audience Signal Quality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold tracking-tight text-primary">
              {audience.signalQuality.rating}
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {audience.signalQuality.explanation}
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {audience.signalQuality.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Top topics driving response */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Top Topics Driving Response
          </h2>
          <p className="text-sm text-muted-foreground">
            The themes producing your strongest decision signal — and what to
            ask next.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {audience.topTopics.map((t) => (
            <Card key={t.topic}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{t.topic}</span>
                  <span className="text-lg font-semibold tabular-nums text-primary">
                    {t.value}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${t.value}%` }}
                  />
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      What it means:{' '}
                    </span>
                    {t.meaning}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Suggested next Polst:{' '}
                    </span>
                    {t.nextPolst}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Source mix + behavior */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Audience Source Mix"
          interpretation={audience.sourceInterpretation}
        >
          <div className="flex flex-col gap-4">
            {audience.sourceMix.map((s) => {
              const max = Math.max(...audience.sourceMix.map((m) => m.value))
              return (
                <div key={s.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.value}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(s.value / max) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audience Behavior</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {audience.behavior.map((b) => (
              <div
                key={b.label}
                className="rounded-lg border border-border bg-secondary/30 p-4"
              >
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className="mt-1 font-semibold">{b.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Demographic + engagement */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Demographic Snapshot"
          interpretation="The strongest audience concentration is 25–34 and 35–44, which aligns with campaign decision quality for premium product and creative tests."
        >
          <BarChart
            data={audience.ageGroups.map((a) => ({
              group: a.group,
              value: a.value,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Engagement Trend"
          icon={Activity}
          interpretation="Engagement is increasing across recent campaigns, suggesting repeat participation and stronger audience familiarity with Polst interactions."
        >
          <AreaLine data={audience.engagement} />
        </ChartCard>
      </div>

      {/* Recommended audience actions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Recommended Audience Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {audience.recommendedActions.map((a) => (
            <Card key={a}>
              <CardContent className="flex items-start gap-3 pt-6">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <ArrowRight className="size-4" />
                </span>
                <p className="text-sm leading-relaxed">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* MVP guardrail */}
      <p className="rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
        POLST shows aggregate audience signal. It does not expose individual
        respondent profiles or operate as a CRM.
      </p>
    </div>
  )
}
