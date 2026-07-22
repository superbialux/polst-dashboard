import { ArrowLeft, ArrowRight } from 'lucide-react'
import { WizardShell } from '@/components/wizard-shell'
import { LinkButton } from '@/components/ui/link-button'
import { PolstChainBuilder } from '@/components/create/polst-chain-builder'

const STEPS = ['Decision', 'Build Chain', 'Distribution', 'Review']

export default function CampaignBuildPage() {
  return (
    <WizardShell
      step={2}
      steps={STEPS}
      title="Build Your Polst Chain"
      subtitle="Add up to 5 Polsts to support the same decision."
      footer={
        <>
          <div className="flex gap-2">
            <LinkButton
              variant="ghost"
              size="lg"
              href="/brand/new-polst/campaign/decision"
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
          <LinkButton size="lg" href="/brand/new-polst/campaign/distribution">
            Continue
            <ArrowRight className="size-4" />
          </LinkButton>
        </>
      }
    >
      <PolstChainBuilder />
    </WizardShell>
  )
}
