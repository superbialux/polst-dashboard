import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle2,
  LayoutGrid,
  MessageSquare,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { LinkButton } from '@/components/ui/link-button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { RecommendationList } from '@/components/recommendation-card'
import {
  campaigns,
  formatNumber,
  portfolioStats,
  recommendations,
  recommendedNextAction,
} from '@/lib/data'

export default function HomePage() {
  const active = campaigns.filter((c) => c.status !== 'Draft')

  return (
    <div className="space-y-8">
      <PageHeader
        title="Good morning, Nike"
        subtitle="What decision do you need to make today?"
      >
        <LinkButton size="lg" href="/brand/new-polst">
          <Plus className="size-4" />
          New Polst
        </LinkButton>
      </PageHeader>

      <Card className="overflow-hidden border-primary/30">
        <div className="flex flex-col gap-4 bg-primary/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Recommended Next Action
              </span>
            </div>
            <p className="text-pretty text-lg font-semibold tracking-tight">
              {recommendedNextAction.title}
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              {recommendedNextAction.reason}
            </p>
          </div>
          <LinkButton size="lg" href="/brand/new-polst" className="shrink-0">
            <Sparkles className="size-4" />
            Create Follow-Up Polst
          </LinkButton>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>You have 3 active decision campaigns</CardTitle>
              </div>
              <Link
                href="/brand/decision-campaigns"
                className="hidden text-sm font-medium text-primary hover:underline sm:block"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="hidden grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                  <span>Decision Campaign</span>
                  <span>Status</span>
                  <span className="text-right">Responses</span>
                  <span className="text-right">Last Updated</span>
                </div>
                <ul className="divide-y divide-border">
                  {active.map((c) => {
                    const cover = c.cover
                    return (
                    <li key={c.slug}>
                      <Link
                        href={`/brand/decision-campaigns/${c.slug}/overview`}
                        className="grid grid-cols-2 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40 sm:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] sm:gap-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {cover ? (
                            <span
                              className="relative flex shrink-0 items-center"
                              title={cover.question}
                            >
                              <span className="relative size-10 overflow-hidden rounded-lg border border-border bg-muted">
                                <Image
                                  src={cover.left.image || '/placeholder.svg'}
                                  alt={`${cover.left.label} option`}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </span>
                              <span className="z-10 -mx-1.5 grid size-5 place-items-center rounded-full border border-border bg-card text-[9px] font-extrabold uppercase tracking-wider text-foreground shadow-sm">
                                or
                              </span>
                              <span className="relative size-10 overflow-hidden rounded-lg border border-border bg-muted">
                                <Image
                                  src={cover.right.image || '/placeholder.svg'}
                                  alt={`${cover.right.label} option`}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </span>
                            </span>
                          ) : (
                            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
                              <LayoutGrid className="size-4" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {c.goal}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end sm:justify-start">
                          <StatusBadge status={c.status} />
                        </div>
                        <span className="hidden text-right text-sm tabular-nums sm:block">
                          {c.responses ? formatNumber(c.responses) : '—'}
                        </span>
                        <span className="hidden text-right text-sm text-muted-foreground sm:block">
                          {c.lastUpdated}
                        </span>
                      </Link>
                    </li>
                    )
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent Recommendations</h2>
            </div>
            <RecommendationList
              items={recommendations}
              href="/brand/decision-campaigns/holiday-creative/insights"
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Portfolio at a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Stat
                icon={TrendingUp}
                label="Total Responses"
                value={formatNumber(portfolioStats.totalResponses)}
              />
              <Stat
                icon={CheckCircle2}
                label="Avg Completion Rate"
                value={`${portfolioStats.avgCompletionRate}%`}
              />
              <Stat
                icon={Sparkles}
                label="Recommendations"
                value={portfolioStats.recommendations}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <CardTitle className="text-base">Team notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Sarah Pike</span>{' '}
                — Holiday Creative is trending toward Modern Holiday. Let&apos;s
                prep the national rollout assets.
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Mike Wilson</span>{' '}
                — Packaging test ready to launch once legal signs off.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-lg font-semibold tabular-nums">
        {value}
      </span>
    </div>
  )
}
