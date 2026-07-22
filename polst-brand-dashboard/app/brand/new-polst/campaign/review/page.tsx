import { ArrowLeft, Rocket } from 'lucide-react'
import { WizardShell } from '@/components/wizard-shell'
import { LinkButton } from '@/components/ui/link-button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PolstPreviewCard } from '@/components/polst/polst-preview-card'
import { getPolstsForCampaign } from '@/lib/data'

const STEPS = ['Decision', 'Build Chain', 'Distribution', 'Review']

const summary = [
  { label: 'Decision', value: 'Holiday campaign' },
  { label: 'Campaign Name', value: 'Holiday Creative' },
  { label: 'Polsts', value: '3' },
  { label: 'Estimated Reach', value: '42,000' },
]

const channels = ['Website', 'Instagram', 'Email', 'QR']

export default function CampaignReviewPage() {
  const polsts = getPolstsForCampaign('holiday-creative').slice(0, 3)

  return (
    <WizardShell
      step={4}
      steps={STEPS}
      title="Review Your Decision Campaign"
      subtitle="Confirm the decision, Polst chain, and distribution channels before creating live assets."
      footer={
        <>
          <div className="flex gap-2">
            <LinkButton
              variant="ghost"
              size="lg"
              href="/brand/new-polst/campaign/distribution"
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
          <LinkButton
            size="lg"
            href="/brand/decision-campaigns/holiday-creative/distribution"
          >
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

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Polsts in this Decision Campaign
            </h2>
            <p className="text-sm text-muted-foreground">
              {polsts.length} Polsts grouped around one business decision.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {polsts.map((p, i) => (
              <PolstPreviewCard key={p.id} polst={p} index={i} compact />
            ))}
          </div>
        </div>
      </div>
    </WizardShell>
  )
}
