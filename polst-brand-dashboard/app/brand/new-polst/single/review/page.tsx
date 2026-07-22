import { ArrowLeft, Rocket, Square } from 'lucide-react'
import { WizardShell } from '@/components/wizard-shell'
import { LinkButton } from '@/components/ui/link-button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STEPS = ['Decision', 'Build', 'Distribution', 'Review']

const summary = [
  { label: 'Decision', value: 'Package design' },
  { label: 'Asset Scope', value: 'Single Polst' },
  { label: 'Channels', value: '4' },
  { label: 'Estimated Reach', value: '12,000' },
]

const channels = ['Website', 'Instagram', 'Email', 'QR']

export default function SingleReviewPage() {
  return (
    <WizardShell
      step={4}
      steps={STEPS}
      title="Review Your Polst"
      subtitle="Confirm the Polst and create live distribution assets."
      footer={
        <>
          <div className="flex gap-2">
            <LinkButton
              variant="ghost"
              size="lg"
              href="/brand/new-polst/single/distribution"
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
          <LinkButton size="lg" href="/brand/new-polst/success">
            <Rocket className="size-4" />
            Create Polst Assets
          </LinkButton>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">
                {s.value}
              </p>
            </Card>
          ))}
        </div>

        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Square className="size-4 text-primary" />
            <p className="text-sm font-medium">Single Polst preview</p>
          </div>
          <p className="text-pretty text-base font-semibold">
            Which package design should we use?
          </p>
          <div className="flex items-center gap-2">
            <span className="grid flex-1 place-items-center rounded-lg border border-border bg-secondary/50 py-8 text-sm font-medium">
              Package A
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-xs font-extrabold uppercase text-foreground shadow-sm">
              or
            </span>
            <span className="grid flex-1 place-items-center rounded-lg border border-border bg-secondary/50 py-8 text-sm font-medium">
              Package B
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium">Selected channels</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {channels.map((c) => (
              <Badge key={c} variant="accent">
                {c}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </WizardShell>
  )
}
