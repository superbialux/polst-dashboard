import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Copy,
  Download,
  Globe,
  Info,
  Lightbulb,
  Link2,
  Mail,
  Plus,
  QrCode,
  Radio,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { CopyField } from '@/components/copy-field'
import {
  getCampaign,
  getPolstsForCampaign,
  distributionAssets,
} from '@/lib/data'

const ICONS: Record<string, LucideIcon> = {
  Globe,
  Camera,
  Mail,
  QrCode,
  Users,
}

export default async function DistributionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = getCampaign(slug)
  if (!campaign) notFound()

  const d = distributionAssets
  const campaignPolsts = getPolstsForCampaign(slug)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          POLST creates assets. You place them into your channels.
        </p>
        <Button variant="outline">
          <Plus className="size-4" />
          Add Channel
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4">
        <Info className="mt-0.5 size-4.5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          POLST does not automatically post to Instagram, send email, or publish
          to your website. These assets are live and tracked once you place them
          into your selected channels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Polsts Being Distributed</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {campaignPolsts.map((p, i) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-3"
            >
              <div className="flex items-center gap-1.5">
                <PolstThumb src={p.left.image} alt={p.left.label} />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  or
                </span>
                <PolstThumb src={p.right.image} alt={p.right.label} />
                <StatusBadge status={p.status} />
              </div>
              <p className="text-pretty text-sm font-medium leading-snug">
                <span className="text-muted-foreground">Polst {i + 1}: </span>
                {p.question}
              </p>
              <p className="text-xs text-muted-foreground">
                {p.channels.join(', ')}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {d.channels.map((c) => {
          const Icon = ICONS[c.icon] ?? Globe
          return (
            <Card key={c.id}>
              <CardContent className="flex items-start gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{c.name}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {c.detail}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    Scope: {c.scope}
                  </p>
                  <p className="mt-3 text-sm font-medium text-primary">
                    {c.metric}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      {c.lastAction}
                    </span>
                    <Button size="sm" variant="outline">
                      {c.action === 'Download' ? (
                        <Download className="size-3.5" />
                      ) : c.action === 'Manage Links' ? (
                        <Users className="size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      {c.action}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Placement Guidance</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {[
            {
              channel: 'Website',
              guidance: 'Place on your campaign landing page.',
            },
            { channel: 'Email', guidance: 'Use as the primary CTA.' },
            {
              channel: 'Instagram',
              guidance: 'Use in a story sticker or your bio link.',
            },
            {
              channel: 'QR',
              guidance: 'Use in store, on packaging, at events, or on printed collateral.',
            },
            {
              channel: 'Influencer',
              guidance: 'Send a unique tracked link to each creator.',
            },
          ].map((p) => (
            <div
              key={p.channel}
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="w-24 shrink-0 text-sm font-medium">
                {p.channel}
              </span>
              <span className="flex-1 text-sm text-muted-foreground">
                {p.guidance}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="size-4 text-primary" />
              Share Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this link anywhere to collect responses.
            </p>
            <CopyField value={d.shareLink} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4 text-primary" />
              Embed Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste this snippet into your site to embed the Polst.
            </p>
            <CopyField value={d.embedCode} mono />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] p-4">
        <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Your Polst is live. It will start collecting responses once these
          assets are placed into your channels — POLST does not post or send on
          your behalf.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <LinkButton variant="outline" href={`/brand/decision-campaigns/${slug}/insights`}>
          <Lightbulb className="size-4" />
          View Insights
        </LinkButton>
        <LinkButton
          variant="outline"
          href={`/brand/decision-campaigns/${slug}/influencers`}
        >
          <Radio className="size-4" />
          View Influencer Tracking
        </LinkButton>
        <LinkButton variant="ghost" href="/brand/decision-campaigns">
          <ArrowLeft className="size-4" />
          Back to Decision Campaigns
        </LinkButton>
      </div>
    </div>
  )
}

function PolstThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative size-9 overflow-hidden rounded-md bg-muted">
      <Image
        src={src || '/placeholder.svg'}
        alt={alt}
        fill
        sizes="36px"
        className="object-cover"
      />
    </div>
  )
}
