'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function CampaignTabs({ slug }: { slug: string }) {
  const pathname = usePathname()
  const base = `/brand/decision-campaigns/${slug}`
  const tabs = [
    { label: 'Overview', href: `${base}/overview` },
    { label: 'Insights', href: `${base}/insights` },
    { label: 'Distribution', href: `${base}/distribution` },
    { label: 'Influencers', href: `${base}/influencers` },
  ]

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'relative whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
