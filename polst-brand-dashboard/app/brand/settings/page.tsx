import { BadgeCheck, Trophy } from 'lucide-react'
import { Breadcrumb, PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SettingsToggle } from '@/components/settings-toggle'
import { organization } from '@/lib/data'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumb items={[{ label: 'Settings' }]} />
        <PageHeader
          title="Settings"
          subtitle="Manage organization profile, plan, billing, and workspace defaults."
        />
      </div>

      {/* 1. Organization */}
      <Section title="Organization">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-foreground text-lg font-semibold text-background">
            {organization.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="font-medium">{organization.name}</p>
            <p className="text-sm text-muted-foreground">Organization logo</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto">
            Replace
          </Button>
        </div>
        <Field label="Organization name" value={organization.name} />
        <Field label="Default domain" value={organization.domain} />
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Brand colors</p>
          <div className="flex items-center gap-2">
            <Swatch color={organization.primaryColor} />
            <Swatch color={organization.accentColor} />
          </div>
        </div>
      </Section>

      {/* 2. Brand Appearance */}
      <Section title="Brand Appearance">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">Logo</p>
              <Button variant="outline" size="sm">
                Upload
              </Button>
            </div>
            <ColorField label="Primary color" color={organization.primaryColor} />
            <ColorField label="Accent color" color={organization.accentColor} />
            <p className="text-sm text-muted-foreground">
              These colors are applied to your branded Polsts, embeds, and
              shared reports.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Branded Polst preview</p>
            <BrandedPolstPreview primary={organization.primaryColor} />
          </div>
        </div>
      </Section>

      {/* 3. Domain */}
      <Section title="Domain">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <code className="rounded-md bg-secondary px-2 py-1 text-sm font-medium text-secondary-foreground">
              {organization.domain}
            </code>
            <Badge variant="complete">
              <BadgeCheck className="size-3.5" />
              Verified
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Custom domain</p>
          <Badge variant="outline">Coming Later</Badge>
        </div>
      </Section>

      {/* 4. Billing & Plan */}
      <Section title="Billing &amp; Plan">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Current plan</p>
            <p className="text-sm text-muted-foreground">
              Billed annually · renews {organization.nextInvoice}
            </p>
          </div>
          <Badge variant="complete">{organization.plan}</Badge>
        </div>
        <Field label="Billing owner" value={organization.billingOwner} />
        <div className="flex items-center justify-between gap-4">
          <Field label="Next invoice" value={organization.nextInvoice} inline />
          <Button variant="outline" size="sm">
            Manage billing
          </Button>
        </div>
      </Section>

      {/* 5. Notifications */}
      <Section title="Notifications" noPadding>
        <div className="divide-y divide-border">
          <SettingsToggle
            label="Campaign result alerts"
            description="Get notified when a Polst reaches statistical significance."
            defaultChecked
          />
          <SettingsToggle
            label="Weekly summaries"
            description="A digest of all active Decision Campaigns every Monday."
            defaultChecked
          />
          <SettingsToggle
            label="Asset activity alerts"
            description="Alerts when distribution assets are copied, downloaded, or go live."
          />
        </div>
      </Section>

      {/* 6. Security */}
      <Section title="Security">
        <SettingsRow
          label="Two-factor authentication"
          description="Require a second step when signing in."
        >
          <Button variant="outline" size="sm">
            Enable
          </Button>
        </SettingsRow>
        <SettingsRow
          label="Team access"
          description="Manage who can access this workspace."
        >
          <Button variant="outline" size="sm">
            Manage
          </Button>
        </SettingsRow>
        <SettingsRow label="SSO" description="Single sign-on for your organization.">
          <Badge variant="outline">Coming Later</Badge>
        </SettingsRow>
      </Section>

      {/* 7. Embed Defaults */}
      <Section title="Embed Defaults" noPadding>
        <div className="divide-y divide-border">
          <SettingsToggle
            label="Show “Powered by POLST”"
            description="Display POLST attribution on embedded Polsts."
            defaultChecked
          />
          <div className="flex items-center justify-between gap-4 px-1 py-4">
            <div>
              <p className="text-sm font-medium">Silent enterprise embed</p>
              <p className="text-sm text-muted-foreground">
                Remove all POLST branding from embeds.
              </p>
            </div>
            <Badge variant="outline">Enterprise only · Coming Later</Badge>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
  noPadding,
}: {
  title: string
  children: React.ReactNode
  noPadding?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className={noPadding ? '' : 'space-y-5'}>
        {children}
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  inline,
}: {
  label: string
  value: string
  inline?: boolean
}) {
  if (inline) {
    return (
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  )
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="size-6 rounded-md ring-1 ring-border"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  )
}

function ColorField({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <Swatch color={color} />
        <code className="text-sm text-muted-foreground">{color}</code>
      </div>
    </div>
  )
}

function BrandedPolstPreview({ primary }: { primary: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="px-4 py-3" style={{ backgroundColor: primary }}>
        <p className="text-sm font-semibold text-white">
          Which colorway should we launch?
        </p>
      </div>
      <div className="space-y-3 p-4">
        {[
          { label: 'Option A', pct: 58, win: true },
          { label: 'Option B', pct: 42, win: false },
        ].map((o) => (
          <div key={o.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                {o.win && <Trophy className="size-3.5" style={{ color: primary }} />}
                {o.label}
              </span>
              <span className="tabular-nums text-muted-foreground">{o.pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${o.pct}%`,
                  backgroundColor: o.win ? primary : 'var(--border)',
                }}
              />
            </div>
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">
          Powered by POLST · {organization.name}
        </p>
      </div>
    </div>
  )
}
