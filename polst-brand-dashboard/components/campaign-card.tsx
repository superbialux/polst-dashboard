import { Award, LayoutGrid, MessagesSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/link-button'
import { PolstThumbnailStrip } from '@/components/polst/polst-thumbnail-strip'
import {
  type Campaign,
  formatNumber,
  getPolstsForCampaign,
} from '@/lib/data'

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const base = `/brand/decision-campaigns/${campaign.slug}`
  const campaignPolsts = getPolstsForCampaign(campaign.slug)

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base font-semibold tracking-tight">
              {campaign.name}
            </h3>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Decision: {campaign.goal}
          </p>

          {campaignPolsts.length > 0 && (
            <PolstThumbnailStrip polsts={campaignPolsts} />
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <LayoutGrid className="size-3.5" />
              {campaign.polsts} {campaign.polsts === 1 ? 'Polst' : 'Polsts'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessagesSquare className="size-3.5" />
              {campaign.responses ? formatNumber(campaign.responses) : '—'}{' '}
              responses
            </span>
            {campaign.winningOption && (
              <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                <Award className="size-3.5" />
                Winning Direction: {campaign.winningOption}
              </span>
            )}
            <span>Updated {campaign.lastUpdated}</span>
          </div>

          {campaign.currentLearning && (
            <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Current Learning:{' '}
              </span>
              {campaign.currentLearning}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <CardActions campaign={campaign} base={base} />
        </div>
      </div>
    </Card>
  )
}

function CardActions({ campaign, base }: { campaign: Campaign; base: string }) {
  if (campaign.status === 'Draft') {
    return (
      <>
        <LinkButton
          size="sm"
          variant="outline"
          href="/brand/new-polst/campaign/build"
        >
          Edit Polst
        </LinkButton>
        <LinkButton size="sm" href="/brand/new-polst/campaign/review">
          Continue Setup
        </LinkButton>
      </>
    )
  }
  return (
    <>
      <LinkButton size="sm" href={`${base}/overview`}>
        View Polsts
      </LinkButton>
      <LinkButton size="sm" variant="outline" href={`${base}/insights`}>
        Insights
      </LinkButton>
      <LinkButton size="sm" variant="ghost" href={`${base}/distribution`}>
        Distribution Assets
      </LinkButton>
    </>
  )
}
