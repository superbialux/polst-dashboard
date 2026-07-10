import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Field, TextInput, Select } from "@/components/Field";
import {
  ConnectCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  LockedCard,
  PollResults,
  SectionGrid,
  Switch,
  type DataColumn,
} from "@/components/dashboard";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { MODULE_INFO, useModules } from "@/lib/modules";
import {
  INTEGRATIONS,
  PENDING_INVITES,
  SINGLE_POLSTS,
  TEAM,
  WORKSPACE,
  polstOptions,
  type PendingInvite,
  type TeamMember,
  type TeamRole,
} from "@/lib/workspace";

/* ── Team ────────────────────────────────────────────────────────── */

const ROLES: TeamRole[] = ["Owner", "Editor", "Viewer"];

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  Owner: "Full control, including billing and team",
  Editor: "Creates and manages campaigns and Polsts",
  Viewer: "Read-only access to results and reports",
};

const teamColumns: Array<DataColumn<TeamMember>> = [
  {
    header: "Member",
    cell: (row) => (
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-avatar-bg font-display text-xs font-bold text-text-inverse">
          {row.name.split(" ").map((w) => w[0]).join("")}
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-text-primary">{row.name}</p>
          <p className="truncate text-xs text-text-secondary">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    header: "Role",
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text-primary">{row.role}</span>
        {row.label ? (
          <span className="rounded-pill bg-surface-subtle px-2 py-0.5 font-display text-xs font-semibold text-text-secondary">
            {row.label}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    header: "Last active",
    cell: (row) => <span className="text-text-secondary">{row.lastActive}</span>,
  },
  {
    header: "",
    align: "right",
    cell: () => (
      <Button variant="secondary" size="sm">
        Manage
      </Button>
    ),
  },
];

const inviteColumns: Array<DataColumn<PendingInvite>> = [
  {
    header: "Invitation",
    cell: (row) => (
      <p className="font-display font-semibold text-text-primary">{row.email}</p>
    ),
  },
  {
    header: "Role",
    cell: (row) => <span className="text-text-secondary">{row.role}</span>,
  },
  {
    header: "Sent",
    cell: (row) => <span className="text-text-secondary">{row.sent}</span>,
  },
  {
    header: "",
    align: "right",
    cell: () => (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm">
          Resend
        </Button>
        <Button variant="secondary" size="sm" className="text-status-danger">
          Revoke
        </Button>
      </div>
    ),
  },
];

function InviteUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Invite user"
      title="Invite user"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast("Invitation sent");
              onClose();
            }}
          >
            Send invite
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <Field label="Email">
          {(fieldId) => (
            <TextInput
              id={fieldId}
              type="email"
              icon="mail"
              placeholder="teammate@northstarpantry.co"
            />
          )}
        </Field>
        <Field label="Role">
          {(fieldId) => (
            <Select id={fieldId} defaultValue="Editor">
              {ROLES.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </Select>
          )}
        </Field>
        <ul className="space-y-1.5 rounded-md bg-surface-subtle p-3">
          {ROLES.map((role) => (
            <li key={role} className="text-xs leading-5 text-text-secondary">
              <span className="font-semibold text-text-primary">{role}</span> —{" "}
              {ROLE_DESCRIPTIONS[role]}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

/* ── Branding (embed appearance) ─────────────────────────────────── */

/** Brand-palette accents for the embed — each swatch rides a primitive
 *  token, so the choices stay inside the design system. */
const ACCENT_SWATCHES = [
  { id: "violet", label: "Brand violet", cssVar: "--color-brand-purple" },
  { id: "green", label: "Teal green", cssVar: "--color-green" },
  { id: "red", label: "Orange red", cssVar: "--color-red" },
  { id: "yellow", label: "Yellow", cssVar: "--color-yellow" },
] as const;

function BrandingCard() {
  const toast = useToast();
  const [accent, setAccent] = useState<(typeof ACCENT_SWATCHES)[number]["id"]>("violet");
  return (
    <DashboardCard
      title="Embed appearance"
      action={
        <Button size="sm" onClick={() => toast("Branding saved")}>
          Save
        </Button>
      }
    >
      <SectionGrid>
        <div className="space-y-5 lg:col-span-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Accent</p>
            <div className="flex gap-2">
              {ACCENT_SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  title={swatch.label}
                  aria-pressed={accent === swatch.id}
                  onClick={() => setAccent(swatch.id)}
                  className={cn(
                    "h-8 w-8 rounded-pill border-2 transition-transform hover:scale-105",
                    accent === swatch.id ? "border-border-accent" : "border-border-default",
                  )}
                  style={{ backgroundColor: `var(${swatch.cssVar})` }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Typeface">
              {(fieldId) => (
                <Select id={fieldId} defaultValue="System UI">
                  <option>System UI</option>
                  <option>Serif</option>
                  <option>Brand font</option>
                </Select>
              )}
            </Field>
            <Field label="Corner radius">
              {(fieldId) => (
                <Select id={fieldId} defaultValue="Medium">
                  <option>None</option>
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </Select>
              )}
            </Field>
          </div>
        </div>
        <div className="lg:col-span-6">
          <p className="mb-2 text-sm font-semibold text-text-primary">Live preview</p>
          <div className="rounded-md bg-surface-subtle p-4">
            <p className="mb-3 font-display text-sm font-semibold text-text-primary">
              {SINGLE_POLSTS[0].question}
            </p>
            <PollResults options={polstOptions(SINGLE_POLSTS[0])} dense />
          </div>
        </div>
      </SectionGrid>
    </DashboardCard>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export function SettingsPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <DashboardPage
      title="Settings"
    >
      <SectionGrid>
        <DashboardCard title="Brand profile" className="lg:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label="Brand name" value={WORKSPACE.brand} />
            <LabeledField label="Website" value={WORKSPACE.domain} />
            <LabeledField label="Industry" value={WORKSPACE.industry} />
            <LabeledField label="Timezone" value={WORKSPACE.timezone} />
            <LabeledField label="Default campaign duration" value="10 days" />
            <div>
              <p className="mb-1.5 text-sm font-semibold text-text-primary">Logo</p>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-accent-default font-display text-sm font-bold text-text-on-accent">
                  {WORKSPACE.initials}
                </span>
                <Button variant="secondary" size="sm">
                  Upload logo
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button size="sm">Save changes</Button>
          </div>
        </DashboardCard>

        <DashboardCard title="Workspace preferences" className="lg:col-span-5">
          <div className="space-y-5">
            <AppearanceToggle />
            <LabeledField label="Default date range" value="Last 30 days" />
            <LabeledField label="Report format" value="Executive summary" />
            <LabeledField label="Visibility" value="Private workspace" />
          </div>
        </DashboardCard>
      </SectionGrid>

      <BrandingCard />

      <DashboardCard
        title="Team"
        padded={false}
        action={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            Invite user
          </Button>
        }
      >
        <DataTable rows={TEAM} columns={teamColumns} />
      </DashboardCard>

      <DashboardCard title="Pending invitations" padded={false}>
        <DataTable
          rows={PENDING_INVITES}
          columns={inviteColumns}
          emptyLabel="No pending invitations"
        />
      </DashboardCard>

      <SectionGrid>
        <ModulesCard />
        <DashboardCard title="Integrations" className="lg:col-span-7">
          <div className="grid gap-3">
            {INTEGRATIONS.map((integration) => (
              <ConnectCard key={integration.id} integration={integration} />
            ))}
          </div>
        </DashboardCard>
      </SectionGrid>

      <SectionGrid>
        <div className="lg:col-span-6">
          <LockedCard
            title="Developer platform"
            description="API keys, webhooks, and BI connectors — everything programmatic lives behind the Pro plan so the marketing workspace stays clean."
            chip="Pro"
            className="h-full"
          />
        </div>
        <DashboardCard title="Billing" className="lg:col-span-6">
          <div className="flex items-start gap-3 rounded-md border border-border-default bg-surface-subtle p-4">
            <Icon name="credit_card" size={20} className="mt-0.5 shrink-0 text-icon-secondary" />
            <div>
              <p className="font-display text-sm font-bold text-text-primary">
                Mock billing state
              </p>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Billing exists as a visual placeholder only — no payment logic,
                invoices, or plan changes are connected in this mockup.
              </p>
            </div>
          </div>
        </DashboardCard>
      </SectionGrid>

      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </DashboardPage>
  );
}

/** Analytics modules with live on/off switches. Turning one off removes
 *  its pages from the sidebar immediately — flags are product truth. */
function ModulesCard() {
  const { modules, setModule } = useModules();
  return (
    <DashboardCard title="Modules" className="lg:col-span-5">
      <ul className="divide-y divide-border-default">
        {MODULE_INFO.map((module) => (
          <li
            key={module.key}
            className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-text-primary">
                {module.name}
              </p>
              <p className="mt-1 text-sm leading-5 text-text-secondary">
                {module.description}
              </p>
            </div>
            <Switch
              checked={modules[module.key]}
              onChange={(on) => setModule(module.key, on)}
              label={module.name}
            />
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

/** A read-only labeled field styled like an editable input well. */
function LabeledField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-text-primary">{label}</p>
      <div className="flex h-10 items-center rounded-md border border-border-default bg-surface-raised px-3 text-sm text-text-primary">
        {value}
      </div>
    </div>
  );
}

const APPEARANCE: ThemePreference[] = ["system", "light", "dark"];

function AppearanceToggle() {
  const { preference, setPreference } = useTheme();
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-text-primary">Appearance</p>
      <div className="flex rounded-md bg-surface-subtle p-1">
        {APPEARANCE.map((option) => (
          <button
            key={option}
            onClick={() => setPreference(option)}
            aria-pressed={preference === option}
            className={cn(
              "h-8 flex-1 rounded-sm px-3 font-display text-sm font-semibold capitalize text-text-secondary transition-colors hover:text-text-primary",
              preference === option && "bg-surface-raised text-text-primary shadow-sm",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <DashboardPage
      title="Page not found"
      description="This route is not part of the V1 dashboard map."
      actions={
        <Button asChild>
          <a href="/">Back to Home</a>
        </Button>
      }
    >
      <DashboardCard>
        <p className="text-sm leading-6 text-text-secondary">
          Use the sidebar to return to Home, Campaigns, Polsts, Distribution,
          Analytics, Audience, or Settings.
        </p>
      </DashboardCard>
    </DashboardPage>
  );
}
