import { Clock, Mail, MoreHorizontal, ShieldCheck, UserPlus } from 'lucide-react'
import { Breadcrumb, PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  teamMembers,
  pendingInvitations,
  roleGuide,
  organization,
} from '@/lib/data'

const ROLE_VARIANT: Record<string, 'complete' | 'accent' | 'outline'> = {
  Owner: 'complete',
  Editor: 'accent',
  Viewer: 'outline',
}

export default function TeamPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Breadcrumb items={[{ label: 'Team' }]} />
        <PageHeader
          title="Team"
          subtitle={`Manage who has access to ${organization.name}.`}
        >
          <Button size="lg">
            <UserPlus className="size-4" />
            Invite Member
          </Button>
        </PageHeader>
      </div>

      {/* Team Members */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Team Members
        </h2>
        <Card>
          <ul className="divide-y divide-border">
            {teamMembers.map((m) => (
              <li
                key={m.email}
                className="flex flex-wrap items-center gap-4 px-5 py-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-primary">
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="size-3.5" />
                    {m.email}
                  </p>
                </div>
                <Badge variant={ROLE_VARIANT[m.role] ?? 'outline'}>
                  {m.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Manage ${m.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Pending Invitations */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pending Invitations
        </h2>
        <Card>
          <ul className="divide-y divide-border">
            {pendingInvitations.map((inv) => (
              <li
                key={inv.email}
                className="flex flex-wrap items-center gap-4 px-5 py-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <Clock className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{inv.email}</p>
                  <p className="text-sm text-muted-foreground">{inv.sentAt}</p>
                </div>
                <Badge variant={ROLE_VARIANT[inv.role] ?? 'outline'}>
                  {inv.role}
                </Badge>
                <Button variant="ghost" size="sm">
                  Resend
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Role Guide */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Role Guide
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              What each role can do
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {roleGuide.map((r) => (
              <div
                key={r.role}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4"
              >
                <span className="w-20 shrink-0">
                  <Badge variant={ROLE_VARIANT[r.role] ?? 'outline'}>
                    {r.role}
                  </Badge>
                </span>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {r.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
