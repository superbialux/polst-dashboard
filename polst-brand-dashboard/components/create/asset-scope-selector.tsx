'use client'

import { useState } from 'react'
import { Check, Globe, Mail, Camera, QrCode, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Channel = {
  id: string
  name: string
  icon: LucideIcon
  fixedScope?: string
  defaultScope?: string
}

const CHANNELS: Channel[] = [
  { id: 'website', name: 'Website Embed', icon: Globe, defaultScope: 'full' },
  { id: 'email', name: 'Email Link', icon: Mail, defaultScope: 'full' },
  {
    id: 'instagram',
    name: 'Instagram Link',
    icon: Camera,
    defaultScope: 'polst-1',
  },
  { id: 'qr', name: 'QR Code', icon: QrCode, defaultScope: 'full' },
  {
    id: 'influencers',
    name: 'Influencer Links',
    icon: Users,
    fixedScope: 'Unique tracked links per influencer',
  },
]

const SCOPE_OPTIONS = [
  { value: 'full', label: 'Full Decision Campaign' },
  { value: 'polst-1', label: 'Starts with Polst 1' },
  { value: 'polst-2', label: 'Starts with Polst 2' },
  { value: 'polst-3', label: 'Starts with Polst 3' },
]

const DEFAULT_SELECTED = ['website', 'instagram', 'email', 'qr']

export function AssetScopeSelector() {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED)
  const [scopes, setScopes] = useState<Record<string, string>>(
    Object.fromEntries(
      CHANNELS.filter((c) => c.defaultScope).map((c) => [c.id, c.defaultScope!]),
    ),
  )

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  return (
    <div className="space-y-3">
      {CHANNELS.map((c) => {
        const checked = selected.includes(c.id)
        const Icon = c.icon
        return (
          <div
            key={c.id}
            className={cn(
              'rounded-2xl border p-4 transition-all',
              checked
                ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                : 'border-border bg-card',
            )}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggle(c.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-lg',
                    checked
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{c.name}</span>
                  {c.fixedScope && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.fixedScope}
                    </span>
                  )}
                </span>
              </button>

              {!c.fixedScope && checked && (
                <select
                  value={scopes[c.id] ?? 'full'}
                  onChange={(e) =>
                    setScopes((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                  className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {SCOPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}

              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
                  checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border',
                )}
              >
                {checked && <Check className="size-3.5" />}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
