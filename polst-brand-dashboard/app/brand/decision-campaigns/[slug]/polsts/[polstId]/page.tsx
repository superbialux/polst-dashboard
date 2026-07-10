import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Copy,
  Lightbulb,
  MessagesSquare,
  Share2,
  Trophy,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/page-header'
import { LinkButton } from '@/components/ui/link-button'
import { PolstOptionCard } from '@/components/polst/polst-option-card'
import { OrDivider } from '@/components/polst/or-divider'
import { getCampaign, getPolstByRef, formatNumber } from '@/lib/data'

const referrers = [
  { source: 'instagram.com', share: 38 },
  { source: 'Direct / QR scan', share: 27 },
  { source: 'Email campaign', share: 21 },
  { source: 'nike.com', share: 14 },
]

export default async function PolstDetailPage({
  params,
}: {
  params: Promise<{ slug: string; polstId: string }>
}) {
  const { slug, polstId } = await params
  const campaign = getCampaign(slug)
  const polst = getPolstByRef(slug, polstId)
  if (!campaign || !polst || polst.campaignSlug !== slug) notFound()

  const base = `/brand/decision-campaigns/${slug}`
  const leftWins = polst.left.votePct >= polst.right.votePct

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Decision Campaigns', href: '/brand/decision-campaigns' },
          { label: campaign.name, href: `${base}/overview` },
          { label: 'Polst' },
        ]}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Polst Detail
          </p>
          <h2 className="mt-1 text-pretty text-xl font-semibold tracking-tight">
            {polst.question}
          </h2>
        </div>
        <StatusBadge status={polst.status} />
      </div>

      {/* Classic OR layout */}
      <Card className="p-5">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <PolstOptionCard
            option={polst.left}
            isWinner={leftWins}
            votes={Math.round((polst.left.votePct / 100) * polst.responses)}
          />
          <OrDivider className="shrink-0 sm:px-1" />
          <PolstOptionCard
            option={polst.right}
            isWinner={!leftWins}
            votes={Math.round((polst.right.votePct / 100) * polst.responses)}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
            <Trophy className="size-4" />
            Winner: {polst.winner}
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <MessagesSquare className="size-4" />
            {formatNumber(polst.responses)} responses
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {polst.channels.map((c) => (
              <Badge key={c} variant="accent">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {polst.byChannel.map((row) => (
              <div key={row.channel} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{row.channel}</span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {row.winner}
                    </span>{' '}
                    {row.pct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
              {polst.winner} won on every channel, so the result holds
              regardless of where people responded.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Referrer / Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {referrers.map((row) => (
              <div key={row.source} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{row.source}</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {row.share}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-chart-2"
                    style={{ width: `${row.share}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
              Most responses came from Instagram and QR scans — useful context
              for where to place the winning creative next.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="size-4 text-primary" />
            Why it mattered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{polst.whyItMattered}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <LinkButton variant="outline" href={`${base}/overview`}>
          <ArrowLeft className="size-4" />
          Back to Decision Campaign
        </LinkButton>
        <LinkButton variant="outline" href={`${base}/insights`}>
          <Lightbulb className="size-4" />
          View Insights
        </LinkButton>
        <LinkButton variant="outline" href={`${base}/distribution`}>
          <Share2 className="size-4" />
          Distribution Assets
        </LinkButton>
        <LinkButton variant="ghost" href="/brand/new-polst/single/build">
          <Copy className="size-4" />
          Duplicate Polst
        </LinkButton>
      </div>
    </div>
  )
}
