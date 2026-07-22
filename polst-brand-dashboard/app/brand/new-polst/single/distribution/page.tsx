'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { WizardShell } from '@/components/wizard-shell'
import { LinkButton } from '@/components/ui/link-button'
import { ChannelSelector } from '@/components/channel-selector'

const STEPS = ['Decision', 'Build', 'Distribution', 'Review']

export default function SingleDistributionPage() {
  const [selected, setSelected] = useState<string[]>([
    'website',
    'instagram',
    'email',
    'qr',
  ])

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  return (
    <WizardShell
      step={3}
      steps={STEPS}
      title="Choose Distribution Channels"
      subtitle="Select where this Polst will be shared."
      footer={
        <>
          <div className="flex gap-2">
            <LinkButton
              variant="ghost"
              size="lg"
              href="/brand/new-polst/single/build"
            >
              <ArrowLeft className="size-4" />
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
          <LinkButton size="lg" href="/brand/new-polst/single/review">
            Continue
            <ArrowRight className="size-4" />
          </LinkButton>
        </>
      }
    >
      <div className="space-y-5">
        <ChannelSelector selected={selected} onToggle={toggle} />

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <Info className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            POLST creates tracked assets. You place them into your own channels.
            It does not automatically post, email, or publish externally in MVP.
          </p>
        </div>
      </div>
    </WizardShell>
  )
}
