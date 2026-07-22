import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  MessagesSquare,
  MousePointerClick,
  Radio,
  Share2,
} from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { MetricCard } from '@/components/metric-card'
import { AreaLine, BarChart, DonutChart, HorizontalBars } from '@/components/charts'
import { getCampaign, getInfluencer, formatNumber } from '@/lib/data'

export default async function InfluencerDetailPage({
  params,
}: {
  params: Promise<{ slug: string; influencerId: string }>
}) {
  const { slug, influencerId } = await params
  const campaign = getCampaign(slug)
  if (!campaign) notFound()
  const inf = getInfluencer(influencerId)
  if (!inf) notFound()
  // Invited partners have no tracked data yet — send them back to the roster
  // rather than rendering empty breakdowns.
  if (inf.responses === 0) {
    redirect(`/brand/decision-campaigns/${slug}/influencers`)
  }

  const peakDay =
    inf.timeline.responses.length > 0
      ? inf.timeline.days[
          inf.timeline.responses.indexOf(Math.max(...inf.timeline.responses))
        ]
      : '—'

  const topGender = inf.demographics.gender.reduce(
    (top, g) => (g.value > top.value ? g : top),
    inf.demographics.gender[0] ?? { name: '', value: 0 },
  )

  return (
    <div className="space-y-6">
      <LinkButton
        variant="ghost"
        size="sm"
        href={`/brand/decision-campaigns/${slug}/influencers`}
        className="-ml-2"
      >
        <ArrowLeft className="size-4" />
        Back to Influencers
      </LinkButton>

      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-lg font-semibold text-primary">
          {inf.initials}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight">{inf.name}</h2>
            <StatusBadge status={inf.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {inf.handle} · {inf.reach} reach
            {inf.topChannel ? ` · Top channel: ${inf.topChannel}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Responses"
          value={formatNumber(inf.responses)}
          icon={MessagesSquare}
          accent
        />
        <MetricCard label="Click-Through Rate" value={`${inf.ctr}%`} icon={MousePointerClick} />
        <MetricCard label="Peak Day" value={peakDay} sub="Most responses" icon={CalendarDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="size-4 text-primary" />
              Channel Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBars
              suffix=""
              data={inf.channels.map((c) => ({
                label: c.label,
                value: c.value,
                sub: c.sub,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" />
              Responses Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AreaLine data={inf.timeline.responses} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {inf.timeline.days.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audience Demographics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Age</p>
            <BarChart data={inf.demographics.age} />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Gender</p>
            <DonutChart
              data={inf.demographics.gender}
              centerValue={`${topGender.value}%`}
              centerLabel={topGender.name}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Region</p>
            <HorizontalBars data={inf.demographics.regions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
