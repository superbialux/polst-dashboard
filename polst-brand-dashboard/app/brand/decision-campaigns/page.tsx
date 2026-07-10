'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CampaignCard } from '@/components/campaign-card'
import { RecommendationList } from '@/components/recommendation-card'
import {
  campaigns,
  formatNumber,
  portfolioStats,
  recommendations,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const tabs = ['Active', 'Draft', 'Completed', 'Archived'] as const

const tabFilter: Record<(typeof tabs)[number], (status: string) => boolean> = {
  Active: (s) => s === 'Live',
  Draft: (s) => s === 'Draft',
  Completed: (s) => s === 'Complete',
  Archived: (s) => s === 'Archived',
}

export default function CampaignsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Active')
  const [query, setQuery] = useState('')

  const filtered = campaigns.filter(
    (c) =>
      tabFilter[tab](c.status) &&
      (c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.goal.toLowerCase().includes(query.toLowerCase())),
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Decision Campaigns"
        subtitle="Manage the decisions your team is testing with Polsts."
      >
        <LinkButton size="lg" href="/brand/new-polst">
          <Plus className="size-4" />
          New Polst
        </LinkButton>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                    tab === t
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:w-56"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filtered.length} {tab.toLowerCase()} campaign
              {filtered.length === 1 ? '' : 's'}
            </span>
            <span>Sort: Last updated</span>
          </div>

          <div className="space-y-3">
            {filtered.length > 0 ? (
              filtered.map((c) => <CampaignCard key={c.slug} campaign={c} />)
            ) : (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                No {tab.toLowerCase()} campaigns found.
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Overview
                label="Active Campaigns"
                value={portfolioStats.activeCampaigns}
              />
              <Overview label="Completed" value={portfolioStats.completed} />
              <Overview label="Drafts" value={portfolioStats.drafts} />
              <Overview
                label="Total Responses"
                value={formatNumber(portfolioStats.totalResponses)}
              />
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold">Recent Recommendations</h2>
            <RecommendationList
              items={recommendations}
              href="/brand/decision-campaigns/holiday-creative/insights"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Overview({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
