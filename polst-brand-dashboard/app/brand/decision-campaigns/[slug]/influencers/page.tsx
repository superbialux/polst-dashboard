import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronRight,
  Info,
  MessagesSquare,
  MousePointerClick,
  Plus,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { MetricCard } from '@/components/metric-card'
import { getCampaign, influencerTracking, formatNumber } from '@/lib/data'

export default async function InfluencersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = getCampaign(slug)
  if (!campaign) notFound()

  const d = influencerTracking

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Track responses driven by each influencer partner. Select a partner to
          drill into channel, timing, and demographic performance.
        </p>
        <Button variant="outline">
          <Plus className="size-4" />
          Invite Influencer
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Influencer Responses"
          value={formatNumber(d.totalResponses)}
          icon={MessagesSquare}
          accent
        />
        <MetricCard label="Total Reach" value={d.totalReach} icon={Radio} />
        <MetricCard
          label="Avg. CTR"
          value={`${d.avgCtr}%`}
          icon={MousePointerClick}
        />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4">
        <Info className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Each influencer gets a unique tracked link, so these responses are
          incremental and measured separately from your other channels.
        </p>
      </div>

      <Card>
        <div className="hidden grid-cols-12 gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
          <span className="col-span-5">Influencer</span>
          <span className="col-span-2 text-right">Reach</span>
          <span className="col-span-2 text-right">Responses</span>
          <span className="col-span-2 text-right">CTR</span>
          <span className="col-span-1 text-right">Status</span>
        </div>
        <ul className="divide-y divide-border">
          {d.roster.map((inf) => {
            const isActive = inf.responses > 0
            const RowInner = (
              <>
                <div className="col-span-2 flex items-center gap-3 sm:col-span-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {inf.initials}
                  </span>
                  <div>
                    <p className="font-medium">{inf.name}</p>
                    <p className="text-sm text-muted-foreground">{inf.handle}</p>
                  </div>
                </div>
                <div className="text-right text-sm sm:col-span-2">
                  <span className="text-muted-foreground sm:hidden">
                    Reach:{' '}
                  </span>
                  {inf.reach}
                </div>
                <div className="text-right text-sm font-medium sm:col-span-2">
                  <span className="font-normal text-muted-foreground sm:hidden">
                    Responses:{' '}
                  </span>
                  {formatNumber(inf.responses)}
                </div>
                <div className="text-right text-sm sm:col-span-2">
                  <span className="text-muted-foreground sm:hidden">CTR: </span>
                  {inf.ctr > 0 ? `${inf.ctr}%` : '—'}
                </div>
                <div className="col-span-2 flex items-center justify-start gap-1.5 sm:col-span-1 sm:justify-end">
                  <StatusBadge status={inf.status} />
                  {isActive && (
                    <ChevronRight className="hidden size-4 text-muted-foreground sm:block" />
                  )}
                </div>
              </>
            )

            return (
              <li key={inf.handle}>
                {isActive ? (
                  <Link
                    href={`/brand/decision-campaigns/${slug}/influencers/${inf.slug}`}
                    className="grid grid-cols-2 items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/40 sm:grid-cols-12"
                  >
                    {RowInner}
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 items-center gap-4 px-5 py-4 sm:grid-cols-12">
                    {RowInner}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
