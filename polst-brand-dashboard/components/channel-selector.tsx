'use client'

import {
  Camera,
  Check,
  Globe,
  Mail,
  QrCode,
  Smartphone,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  Globe,
  Camera,
  Mail,
  Users,
  Smartphone,
  QrCode,
}

const CHANNELS = [
  { id: 'website', name: 'Website', icon: 'Globe', desc: 'Embed on pages' },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'Camera',
    desc: 'Bio, story, caption',
  },
  { id: 'email', name: 'Email', icon: 'Mail', desc: 'Newsletter & lifecycle' },
  {
    id: 'influencers',
    name: 'Influencers',
    icon: 'Users',
    desc: 'Per-partner links',
  },
  { id: 'app', name: 'App', icon: 'Smartphone', desc: 'In-app placement' },
  { id: 'qr', name: 'QR', icon: 'QrCode', desc: 'In-store & print' },
]

export function ChannelSelector({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {CHANNELS.map((c) => {
        const Icon = ICONS[c.icon]
        const checked = selected.includes(c.id)
        return (
          <button
            key={c.id}
            onClick={() => onToggle(c.id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all',
              checked
                ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                : 'border-border bg-card hover:border-primary/40',
            )}
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
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.desc}</p>
            </div>
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
          </button>
        )
      })}
    </div>
  )
}
