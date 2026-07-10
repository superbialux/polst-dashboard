'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Box,
  CalendarDays,
  Palette,
  Megaphone,
  MoreHorizontal,
  Tag,
} from 'lucide-react'
import { WizardShell } from '@/components/wizard-shell'
import { LinkButton } from '@/components/ui/link-button'
import { cn } from '@/lib/utils'

const STEPS = ['Decision', 'Build', 'Distribution', 'Review']

const types = [
  { id: 'creative', label: 'Creative', icon: Palette },
  { id: 'product', label: 'Product', icon: Box },
  { id: 'promotion', label: 'Promotion', icon: Tag },
  { id: 'event', label: 'Event', icon: CalendarDays },
  { id: 'sponsorship', label: 'Sponsorship', icon: Megaphone },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
]

export default function SingleDecisionPage() {
  const [selected, setSelected] = useState('product')
  const [description, setDescription] = useState(
    'Which package design should we use?',
  )

  return (
    <WizardShell
      step={1}
      steps={STEPS}
      title="What decision are you trying to make?"
      subtitle="Frame the single question this Polst should answer."
      footer={
        <>
          <div className="flex gap-2">
            <LinkButton variant="ghost" size="lg" href="/brand/new-polst">
              Back
            </LinkButton>
            <LinkButton
              variant="ghost"
              size="lg"
              href="/brand/decision-campaigns"
            >
              Save Draft
            </LinkButton>
          </div>
          <LinkButton size="lg" href="/brand/new-polst/single/build">
            Continue
            <ArrowRight className="size-4" />
          </LinkButton>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {types.map((t) => {
            const active = selected === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                  active
                    ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/40',
                )}
              >
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-lg',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <t.icon className="size-4.5" />
                </span>
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          <label htmlFor="decision" className="text-sm font-medium">
            Decision
          </label>
          <textarea
            id="decision"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Which package design should we use?"
            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </div>
      </div>
    </WizardShell>
  )
}
