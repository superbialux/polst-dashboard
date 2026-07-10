import {
  Camera,
  CircleCheck,
  Globe,
  Link2,
  Mail,
  QrCode,
  Share2,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LinkButton } from '@/components/ui/link-button'
import { SuccessAssetPanel } from '@/components/create/success-asset-panel'

const createdAssets = [
  { icon: Link2, label: 'Live Polst URL', detail: 'polst.app/p/holiday-creative' },
  { icon: Globe, label: 'Website embed', detail: 'Paste into your landing page' },
  { icon: QrCode, label: 'QR code', detail: 'For packaging, store, or events' },
  { icon: Mail, label: 'Email link', detail: 'Drop into your newsletter' },
  { icon: Camera, label: 'Instagram link', detail: 'Story sticker or bio link' },
  { icon: Users, label: 'Influencer link set', detail: 'Unique tracked link per creator' },
]

const nextSteps = [
  'Copy the website embed into your landing page',
  'Add the email link to your newsletter',
  'Download the QR code for packaging, store, or event use',
  'Monitor responses in real time',
]

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <div className="space-y-3 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <CircleCheck className="size-7" />
        </span>
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Your Polst assets are ready
        </h1>
        <p className="mx-auto max-w-md text-pretty text-muted-foreground">
          Everything below is live and tracked. POLST does not post or send on
          your behalf — place these assets into your own channels to start
          collecting responses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What was created</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {createdAssets.map((a) => (
            <div
              key={a.label}
              className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-primary">
                <a.icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.detail}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <SuccessAssetPanel />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {nextSteps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkButton
          size="lg"
          href="/brand/decision-campaigns/holiday-creative/distribution"
        >
          <Share2 className="size-4" />
          View Distribution Assets
        </LinkButton>
        <LinkButton
          size="lg"
          variant="outline"
          href="/brand/decision-campaigns/holiday-creative/polsts/polst-1"
        >
          View Polst
        </LinkButton>
        <LinkButton size="lg" variant="ghost" href="/brand/home">
          Back to Home
        </LinkButton>
      </div>
    </div>
  )
}
