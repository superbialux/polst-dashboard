import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { WizardShell } from '@/components/wizard-shell'
import { LinkButton } from '@/components/ui/link-button'
import { Card } from '@/components/ui/card'
import { AssetScopeSelector } from '@/components/create/asset-scope-selector'

const STEPS = ['Decision', 'Build Chain', 'Distribution', 'Review']

export default function CampaignDistributionPage() {
  return (
    <WizardShell
      step={3}
      steps={STEPS}
      title="Choose Distribution Channels"
      subtitle="Select where the Decision Campaign will be distributed."
      footer={
        <>
          <div className="flex gap-2">
            <LinkButton
              variant="ghost"
              size="lg"
              href="/brand/new-polst/campaign/build"
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
          <LinkButton size="lg" href="/brand/new-polst/campaign/review">
            Continue
            <ArrowRight className="size-4" />
          </LinkButton>
        </>
      }
    >
      <div className="space-y-5">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Decision Campaign</p>
            <p className="text-sm font-semibold">Holiday Creative</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Polsts</p>
            <p className="text-sm font-semibold">3</p>
          </div>
        </Card>

        <p className="text-sm text-muted-foreground">
          These assets can point to the full Decision Campaign or to a specific
          starting Polst.
        </p>

        <AssetScopeSelector />

        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <Info className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            POLST does not automatically post, email, or publish externally in
            MVP. It creates tracked assets for your team to place into existing
            channels.
          </p>
        </div>
      </div>
    </WizardShell>
  )
}
