import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Menu, MenuItem } from "@/components/Menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { Field, SelectMenu, TextInput } from "@/components/Field";
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
const optionsOf = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  Owner: "Full control, including billing and team",
  Editor: "Creates and manages campaigns and Polsts",
  Viewer: "Read-only access to results and reports",
};

/** Access (what they can do) and title (what they are) are different
 *  facts — they get separate columns and separate treatments. Removal is
 *  destructive, so it goes through an explicit confirmation. */
function TeamRowActions({ member }: { member: TeamMember }) {
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <Menu
        label={`Actions for ${member.name}`}
        trigger={({ toggle }) => (
          <Button variant="secondary" size="sm" onClick={toggle}>
            Actions
            <Icon name="arrow_drop_down" size={18} />
          </Button>
        )}
      >
        <MenuItem
          icon="manage_accounts"
          label="Change access"
          onClick={() => toast(`Access updated for ${member.name}`)}
        />
        <MenuItem
          icon="badge"
          label="Edit title"
          onClick={() => toast(`Title updated for ${member.name}`)}
        />
        {member.role !== "Owner" ? (
          <MenuItem
            icon="person_remove"
            label="Remove from workspace"
            danger
            onClick={() => setConfirmOpen(true)}
          />
        ) : (
          <MenuItem
            icon="swap_horiz"
            label="Transfer ownership"
            onClick={() => toast(`A confirmation email was sent to ${WORKSPACE.email}`)}
          />
        )}
      </Menu>
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        label={`Remove ${member.name}`}
        title={`Remove ${member.name}?`}
        footer={
          <div className="flex justify-end gap-2 p-4">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-status-danger hover:bg-status-danger"
              onClick={() => {
                setConfirmOpen(false);
                toast(`${member.name} was removed from the workspace`);
              }}
            >
              Remove member
            </Button>
          </div>
        }
      >
        <p className="p-4 text-sm leading-6 text-text-secondary">
          {member.name} ({member.email}) will lose access to every campaign,
          Polst, and report in {WORKSPACE.brand} immediately. Their past edits
          and decisions stay in the history. You can invite them back later.
        </p>
      </Modal>
    </>
  );
}

const teamColumns: Array<DataColumn<TeamMember>> = [
  {
    header: "Member",
    cell: (row) => (
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-avatar-bg font-display text-xs font-semibold text-text-inverse">
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
    header: "Access",
    cell: (row) => (
      <span className="font-semibold text-text-primary" title={ROLE_DESCRIPTIONS[row.role]}>
        {row.role}
      </span>
    ),
  },
  {
    header: "Title",
    cell: (row) => (
      <span className="text-text-secondary">{"—"}</span>
    ),
  },
  {
    header: "Last active",
    cell: (row) => <span className="text-text-secondary">{"—"}</span>,
  },
  {
    header: "",
    align: "right",
    cell: (row) => <TeamRowActions member={row} />,
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
    header: "Access",
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
        <Field label="Access">
          {(fieldId) => (
            <SelectMenu id={fieldId} label="Access" defaultValue="Editor" options={optionsOf(ROLES)} />
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
  const [typeface, setTypeface] = useState("System UI");
  const [cornerRadius, setCornerRadius] = useState("Medium");
  const activeSwatch = ACCENT_SWATCHES.find((swatch) => swatch.id === accent) ?? ACCENT_SWATCHES[0];
  const typeClass = typeface === "Serif" ? "font-serif" : typeface === "Brand font" ? "font-display" : "font-sans";
  const radiusClass = cornerRadius === "None" ? "rounded-none" : cornerRadius === "Small" ? "rounded-sm" : cornerRadius === "Large" ? "rounded-lg" : "rounded-md";
  return (
    <DashboardCard
      title="Embed appearance"
      description="How your Polsts look when embedded on your own site."
      action={
        <Button size="sm" onClick={() => toast("Embed appearance saved")}>
          Save changes
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
                <SelectMenu
                  id={fieldId}
                  label="Typeface"
                  value={typeface}
                  onValueChange={setTypeface}
                  options={optionsOf(["System UI", "Serif", "Brand font"])}
                />
              )}
            </Field>
            <Field label="Corner radius">
              {(fieldId) => (
                <SelectMenu
                  id={fieldId}
                  label="Corner radius"
                  value={cornerRadius}
                  onValueChange={setCornerRadius}
                  options={optionsOf(["None", "Small", "Medium", "Large"])}
                />
              )}
            </Field>
          </div>
        </div>
        <div className="lg:col-span-6">
          <p className="mb-2 text-sm font-semibold text-text-primary">Live preview</p>
          <div
            className={cn("bg-surface-subtle p-4", radiusClass)}
            style={{ "--accent-default": `var(${activeSwatch.cssVar})` } as CSSProperties}
          >
            <p className={cn("mb-3 text-sm font-semibold text-text-primary", typeClass)}>
              {SINGLE_POLSTS[0].question}
            </p>
            <PollResults options={polstOptions(SINGLE_POLSTS[0])} dense />
          </div>
        </div>
      </SectionGrid>
    </DashboardCard>
  );
}

/* ── Sections ────────────────────────────────────────────────────── */

const SETTINGS_SECTIONS = [
  { key: "Workspace", icon: "storefront", blurb: "Brand profile and defaults" },
  { key: "Embed appearance", icon: "palette", blurb: "How embedded Polsts look" },
  { key: "Modules & integrations", icon: "extension", blurb: "Optional analytics and connections" },
  { key: "Plan & developer", icon: "credit_card", blurb: "Subscription and API access" },
] as const;
type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["key"];

function WorkspaceSection() {
  const toast = useToast();
  return (
    <>
      <DashboardCard
        title="Brand profile"
        action={
          <Button size="sm" onClick={() => toast("Brand profile saved")}>
            Save changes
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand name">
            {(id) => <TextInput id={id} defaultValue={WORKSPACE.brand} />}
          </Field>
          <Field label="Website">
            {(id) => <TextInput id={id} defaultValue={WORKSPACE.domain} />}
          </Field>
          <Field label="Industry">
            {(id) => <TextInput id={id} defaultValue={WORKSPACE.industry} />}
          </Field>
          <Field label="Timezone">
            {(id) => (
              <SelectMenu
                id={id}
                label="Timezone"
                defaultValue={WORKSPACE.timezone}
                options={optionsOf(["America/Chicago", "America/New_York", "America/Los_Angeles", "Europe/London"])}
              />
            )}
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-text-primary">Logo</p>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-accent-default font-display text-sm font-semibold text-text-on-accent">
                {WORKSPACE.initials}
              </span>
              <Button variant="secondary" size="sm">
                Upload logo
              </Button>
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        title="Workspace defaults"
        action={
          <Button size="sm" onClick={() => toast("Workspace defaults saved")}>
            Save changes
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Default campaign duration">
            {(id) => (
              <SelectMenu id={id} label="Default campaign duration" defaultValue="10 days" options={optionsOf(["7 days", "10 days", "14 days", "30 days"])} />
            )}
          </Field>
          <Field label="Default date range">
            {(id) => (
              <SelectMenu id={id} label="Default date range" defaultValue="Last 30 days" options={optionsOf(["Last 7 days", "Last 30 days", "Last 90 days"])} />
            )}
          </Field>
          <Field label="Report format">
            {(id) => (
              <SelectMenu id={id} label="Report format" defaultValue="Executive summary" options={optionsOf(["Executive summary", "Full evidence"])} />
            )}
          </Field>
        </div>
      </DashboardCard>
    </>
  );
}

function TeamSection({ onInvite }: { onInvite: () => void }) {
  return (
    <>
      <DashboardCard
        title="Team"
        description="Access controls what a member can do; title is just who they are."
        padded={false}
        action={
          <Button size="sm" onClick={onInvite}>
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
    </>
  );
}

function ModulesSection() {
  return (
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
  );
}

function PlanSection() {
  const toast = useToast();
  return (
    <SectionGrid>
      <DashboardCard title="Plan" className="lg:col-span-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-xl font-semibold text-text-primary">Growth</p>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold tabular-nums text-text-primary">$79</span> / month
          </p>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm leading-5 text-text-secondary">
          <li>Unlimited campaigns and Polsts</li>
          <li>5 team seats — 3 in use</li>
          <li>All distribution channels</li>
        </ul>
        <p className="mt-3 text-xs text-text-tertiary">Renews Jul 1, 2026 · Visa ending 4412</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast("Plan management opens in the billing portal")}>
            Manage plan
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast("Invoice history opens in the billing portal")}>
            View invoices
          </Button>
        </div>
      </DashboardCard>
      <div className="lg:col-span-6">
        <LockedCard
          title="Developer platform"
          description="API keys, webhooks, and BI connectors — everything programmatic lives behind the Pro plan so the marketing workspace stays clean."
          chip="Pro"
          className="h-full"
        />
      </div>
    </SectionGrid>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>("Workspace");
  return (
    <DashboardPage>
      <SectionGrid>
        {/* Local settings navigation — settings are a map, not one scroll. */}
        <nav aria-label="Settings sections" className="self-start lg:sticky lg:top-16 lg:col-span-3">
          <ul className="space-y-0.5">
            {SETTINGS_SECTIONS.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => setSection(item.key)}
                  aria-current={section === item.key ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    section === item.key
                      ? "bg-surface-raised shadow-sm ring-1 ring-border-default"
                      : "hover:bg-surface-subtle",
                  )}
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    className={section === item.key ? "text-icon-primary" : "text-icon-secondary"}
                  />
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-semibold text-text-primary">
                      {item.key}
                    </span>
                    <span className="block truncate text-xs text-text-secondary">
                      {item.blurb}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4 lg:col-span-9">
          {section === "Workspace" ? <WorkspaceSection /> : null}
          {section === "Embed appearance" ? <BrandingCard /> : null}
          {section === "Modules & integrations" ? <ModulesSection /> : null}
          {section === "Plan & developer" ? <PlanSection /> : null}
        </div>
      </SectionGrid>
    </DashboardPage>
  );
}

export function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <DashboardPage>
      <TeamSection onInvite={() => setInviteOpen(true)} />
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

export function NotFoundPage() {
  return (
    <DashboardPage
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
