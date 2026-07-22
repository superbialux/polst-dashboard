import { notFound } from 'next/navigation'
import { CampaignTabs } from '@/components/campaign-tabs'
import { Breadcrumb } from '@/components/page-header'
import { StatusBadge } from '@/components/ui/badge'
import { getCampaign } from '@/lib/data'

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = getCampaign(slug)
  if (!campaign) notFound()

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'Decision Campaigns', href: '/brand/decision-campaigns' },
            { label: campaign.name },
          ]}
        />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-pretty text-2xl font-semibold tracking-tight">
            {campaign.name}
          </h1>
          <StatusBadge status={campaign.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Decision Campaign · {campaign.goal} ·{' '}
          <span className="font-medium text-foreground">
            {campaign.polsts} {campaign.polsts === 1 ? 'Polst' : 'Polsts'}
          </span>
        </p>
        <CampaignTabs slug={slug} />
      </div>
      {children}
    </div>
  )
}
