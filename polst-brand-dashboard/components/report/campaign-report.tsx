import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Download,
  Filter,
  Info,
  Lock,
  Mail,
  QrCode,
  Share2,
  Smartphone,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PolstChain } from '@/components/polst/polst-chain'
import {
  formatNumber,
  type CampaignReport,
  type ReportChannel,
  type ReportQuestion,
  type ReportRecommendation,
} from '@/lib/data'

export function CampaignReportView({ report }: { report: CampaignReport }) {
  return (
    <div className="space-y-8">
      <ReportHeader report={report} />
      <ReportOverview report={report} />
      <PolstChain
        steps={report.keyResults.map((q) => ({
          question: q.question,
          options: q.options,
        }))}
        subtitle={`${report.keyResults.length} questions answered in sequence — the full Polst chain for this decision.`}
      />
      <KeyResults questions={report.keyResults} />
      <ChannelPerformance channels={report.channelPerformance} />
      <ExecutiveSummary report={report} />
      <Segmentation report={report} />
      <StrategicRecommendations items={report.recommendations} />
      {report.dataNotes && <DataNotes notes={report.dataNotes} />}
      <ReportFooter report={report} />
    </div>
  )
}

function ReportHeader({ report }: { report: CampaignReport }) {
  return (
    <div className="space-y-4 border-b border-border pb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <BadgeCheck className="size-3.5" />
            Client-ready report
          </span>
          <h2 className="text-balance text-xl font-semibold tracking-tight">
            {report.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {report.client} — Polst Campaign Report
          </p>
        </div>
        <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          Generated {report.generatedOn}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download className="size-4" />
          Export PDF
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Copy className="size-4" />
          Copy Summary
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Share2 className="size-4" />
          Share Read-Only Link
        </button>
      </div>
    </div>
  )
}

function DataNotes({ notes }: { notes: string }) {
  return (
    <section className="space-y-4">
      <SectionHeading title="Data Notes" />
      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {notes}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

function ReportFooter({ report }: { report: CampaignReport }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Lock className="size-3" />
        Confidential — {report.client} × Polst Enterprise
      </span>
      <span>{report.generatedOn}</span>
    </div>
  )
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

function ReportOverview({ report }: { report: CampaignReport }) {
  return (
    <section className="space-y-4">
      <SectionHeading title="Campaign Overview" />
      <div className="grid gap-4 sm:grid-cols-3">
        {report.overview.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {stat.value}
              </p>
              {stat.sub && (
                <p className="mt-1 text-xs font-medium text-primary">
                  {stat.sub}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function KeyResults({ questions }: { questions: ReportQuestion[] }) {
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Key Results"
        subtitle="Every question voters answered, with the winning option highlighted."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {questions.map((q, i) => {
          const winningPct = Math.max(...q.options.map((o) => o.pct))
          return (
            <Card key={q.question}>
              <CardHeader className="gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Question {i + 1}
                </span>
                <CardTitle className="text-base leading-snug text-pretty">
                  {q.question}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(q.responses)} responses
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {q.options.map((o) => {
                  const isWinner = o.pct === winningPct
                  return (
                    <div key={o.label} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span
                          className={
                            isWinner
                              ? 'font-semibold text-foreground'
                              : 'text-muted-foreground'
                          }
                        >
                          {o.label}
                        </span>
                        <span
                          className={
                            isWinner
                              ? 'font-semibold text-primary'
                              : 'text-muted-foreground'
                          }
                        >
                          {o.pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={
                            isWinner ? 'h-full bg-primary' : 'h-full bg-border'
                          }
                          style={{ width: `${o.pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

const CHANNEL_ICONS: { match: RegExp; icon: LucideIcon }[] = [
  { match: /app|push/i, icon: Smartphone },
  { match: /email/i, icon: Mail },
  { match: /qr/i, icon: QrCode },
  { match: /social/i, icon: Share2 },
]

function channelIcon(name: string): LucideIcon {
  return CHANNEL_ICONS.find((c) => c.match.test(name))?.icon ?? TrendingUp
}

function ChannelPerformance({ channels }: { channels: ReportChannel[] }) {
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Channel Performance"
        subtitle="Voter volume and completion rate by distribution channel."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((c) => {
          const Icon = channelIcon(c.name)
          return (
            <Card key={c.name}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {c.completion}% completion
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {c.voters}
                </p>
                <p className="text-sm text-muted-foreground">{c.name}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${c.completion}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function ExecutiveSummary({ report }: { report: CampaignReport }) {
  return (
    <Card className="border-primary/30 bg-primary/[0.04]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="size-4 text-primary" />
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="leading-relaxed text-pretty text-muted-foreground">
          {report.executiveSummary}
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-4 text-sm">
          <span>
            <span className="text-muted-foreground">Completed sessions: </span>
            <span className="font-semibold">{report.completedSessions}</span>
          </span>
          <span>
            <span className="text-muted-foreground">Margin of error: </span>
            <span className="font-semibold">{report.marginOfError}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function Segmentation({ report }: { report: CampaignReport }) {
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Response Segmentation by Source Channel"
        subtitle="Vote splits filtered by the UTM source parameter on the campaign link."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {report.segmentation.map((s) => (
          <Card key={s.utm}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <code className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  UTM: {s.utm}
                </code>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  <Filter className="size-3" />
                  {s.tag}
                </span>
              </div>
              <p className="text-2xl font-semibold tracking-tight">
                {s.voters}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

const PRIORITY_STYLES: Record<ReportRecommendation['priority'], string> = {
  High: 'bg-primary/10 text-primary',
  Medium: 'bg-accent text-accent-foreground',
  Efficiency: 'bg-secondary text-secondary-foreground',
}

function StrategicRecommendations({
  items,
}: {
  items: ReportRecommendation[]
}) {
  return (
    <section className="space-y-4">
      <SectionHeading
        title="Strategic Recommendations"
        subtitle="Cross-functional recommendations grounded in campaign data with implementation rationale."
      />
      <div className="space-y-4">
        {items.map((r, i) => (
          <Card key={r.title}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {r.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[r.priority]}`}
                  >
                    {r.priority}
                  </span>
                </div>
                <p className="text-pretty text-base font-semibold leading-snug">
                  {r.title}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Data Basis
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {r.dataBasis}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TrendingUp className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Strategic Rationale
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {r.rationale}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
