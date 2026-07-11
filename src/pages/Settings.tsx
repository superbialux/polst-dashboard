import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { CONTROL, Field, SelectMenu, TextInput } from "@/components/Field";
import {
  ConnectCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  InfoHint,
  LockedCard,
  NotFoundCard,
  PollResults,
  SectionGrid,
  SegmentedControl,
  StatTile,
  Switch,
  type DataColumn,
} from "@/components/dashboard";
import { MODULE_INFO, useModules } from "@/lib/modules";
import { METRIC_INFO, TODAY, fmtDate, fmtInt } from "@/lib/canon";
import { useWorkspace } from "@/lib/store";
import {
  INTEGRATIONS,
  PENDING_INVITES,
  TEAM,
  USAGE,
  WORKSPACE,
  polstOptions,
  type PendingInvite,
  type TeamMember,
  type TeamRole,
} from "@/lib/workspace";

const optionsOf = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value }));

/* ── Workspace (brand profile) ───────────────────────────────────── */

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

/** The label Field renders, for the two controls (avatar, preview) that
 *  aren't a single labellable input. */
const fieldLabelClass =
  "font-display text-sm font-semibold leading-5 text-text-primary";

/** The public brand identity: what voters see on embeds and the brand
 *  page. Avatar changes are real (local object URL); Save is a mock. */
function BrandProfileCard() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  return (
    <DashboardCard
      title="Brand profile"
      action={
        <Button size="sm" onClick={() => toast("Brand profile saved")}>
          Save changes
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <p className={fieldLabelClass}>Avatar</p>
          <div className="mt-1.5 flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${WORKSPACE.brand} avatar`}
                className="h-11 w-11 rounded-md object-cover"
              />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-md bg-accent-default font-display text-sm font-semibold text-text-on-accent">
                {WORKSPACE.initials}
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              Change avatar
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAvatarUrl(URL.createObjectURL(file));
              }}
            />
          </div>
          <p className="mt-1.5 text-xs leading-4 text-text-secondary">
            PNG or JPEG, up to 5 MB.
          </p>
        </div>

        <Field label="Display name">
          {(id) => <TextInput id={id} defaultValue={WORKSPACE.brand} maxLength={50} />}
        </Field>

        <Field label="Description">
          {(id) => (
            <textarea
              id={id}
              maxLength={500}
              placeholder="Tell people about your brand…"
              className={cn(CONTROL, "h-24 resize-none px-3 py-2")}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            {(id) => (
              <SelectMenu
                id={id}
                label="Location"
                placeholder="US state (optional)"
                options={optionsOf(US_STATES)}
              />
            )}
          </Field>
          <Field label="City">
            {(id) => <TextInput id={id} placeholder="e.g. Austin" />}
          </Field>
        </div>
      </div>
    </DashboardCard>
  );
}

/* ── Team & access ───────────────────────────────────────────────── */

const ASSIGNABLE_ROLES: TeamRole[] = ["Editor", "Viewer"];

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  Owner: "Full control, including billing and the team",
  Editor: "Creates and manages campaigns and Polsts",
  Viewer: "Read-only access to results and reports",
};

const ROLE_INFO = `Owner — ${ROLE_DESCRIPTIONS.Owner}. Editor — ${ROLE_DESCRIPTIONS.Editor}. Viewer — ${ROLE_DESCRIPTIONS.Viewer}. Only the owner can change access.`;

/** Members and pending invitations, mutated for real in local state:
 *  access edits reflect in the table, revokes remove the row, invites
 *  append one. Nothing toasts a change that isn't visible. */
function TeamSection() {
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>(TEAM);
  const [invites, setInvites] = useState<PendingInvite[]>(PENDING_INVITES);
  const [inviteOpen, setInviteOpen] = useState(false);

  const setRole = (member: TeamMember, role: TeamRole) => {
    if (member.role === role) return;
    setMembers((all) => all.map((m) => (m.id === member.id ? { ...m, role } : m)));
    toast(`${member.name} is now ${role === "Editor" ? "an Editor" : "a Viewer"}`);
  };

  const revoke = (invite: PendingInvite) => {
    setInvites((all) => all.filter((i) => i.id !== invite.id));
    toast(`Invitation to ${invite.email} revoked`);
  };

  const memberColumns: Array<DataColumn<TeamMember>> = [
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
      align: "right",
      cell: (row) =>
        row.role === "Owner" ? (
          <span className="pr-3 font-display text-ui font-semibold text-text-primary">
            Owner
          </span>
        ) : (
          <SelectMenu
            compact
            align="end"
            label={`Access for ${row.name}`}
            value={row.role}
            onValueChange={(next) => setRole(row, next as TeamRole)}
            options={optionsOf(ASSIGNABLE_ROLES)}
          />
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
      cell: (row) => (
        <Button variant="destructive-secondary" size="sm" onClick={() => revoke(row)}>
          Revoke
        </Button>
      ),
    },
  ];

  return (
    <>
      <DashboardCard
        title={
          <span className="flex items-center gap-1.5">
            Members
            <InfoHint label="Access roles" text={ROLE_INFO} />
          </span>
        }
        padded={false}
        action={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            Invite member
          </Button>
        }
      >
        <DataTable rows={members} columns={memberColumns} />
      </DashboardCard>

      <DashboardCard title="Pending invitations" padded={false}>
        <DataTable
          rows={invites}
          columns={inviteColumns}
          emptyLabel="No pending invitations"
        />
      </DashboardCard>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(email, role) => {
          setInvites((all) => [
            ...all,
            { id: `invite-${Date.now()}`, email, role, sent: fmtDate(TODAY) },
          ]);
          toast(`Invitation sent to ${email}`);
        }}
      />
    </>
  );
}

function InviteMemberModal({
  open,
  onClose,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: TeamRole) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Editor");

  // A fresh form every time the modal opens.
  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("Editor");
    }
  }, [open]);

  const valid = /\S+@\S+\.\S+/.test(email);

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Invite member"
      title="Invite member"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onInvite(email.trim(), role);
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Field label="Access">
          {(fieldId) => (
            <SelectMenu
              id={fieldId}
              label="Access"
              value={role}
              onValueChange={(next) => setRole(next as TeamRole)}
              options={optionsOf(ASSIGNABLE_ROLES)}
            />
          )}
        </Field>
        <ul className="space-y-1.5 rounded-md bg-surface-subtle p-3">
          {ASSIGNABLE_ROLES.map((r) => (
            <li key={r} className="text-xs leading-5 text-text-secondary">
              <span className="font-semibold text-text-primary">{r}</span> —{" "}
              {ROLE_DESCRIPTIONS[r]}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

/* ── Embed appearance ────────────────────────────────────────────── */

const RADIUS_CLASSES = {
  None: "rounded-none",
  Small: "rounded-sm",
  Medium: "rounded-md",
  Large: "rounded-lg",
  Full: "rounded-xl",
} as const;
type RadiusChoice = keyof typeof RADIUS_CLASSES;

const TITLE_PLACEMENTS = ["Above", "Below", "Hidden"] as const;
type TitlePlacement = (typeof TITLE_PLACEMENTS)[number];

const TYPEFACE_CLASSES = {
  "System UI": "font-sans",
  Serif: "font-serif",
  Monospace: "font-mono",
} as const;
type TypefaceChoice = keyof typeof TYPEFACE_CLASSES;

/** Every control here drives the live preview — accent, question
 *  placement, corner radius, typeface — so nothing on this card is
 *  decorative. The preview is the real PollResults block. */
function EmbedAppearanceCard() {
  const toast = useToast();
  const { polsts } = useWorkspace();
  const sample = polsts.find((p) => p.votes > 0) ?? polsts[0];

  const [accent, setAccent] = useState("#6161c7");
  const [titlePlacement, setTitlePlacement] = useState<TitlePlacement>("Above");
  const [radius, setRadius] = useState<RadiusChoice>("Medium");
  const [typeface, setTypeface] = useState<TypefaceChoice>("System UI");

  const question = (placement: TitlePlacement) =>
    titlePlacement === placement ? (
      <p
        className={cn(
          "text-sm font-semibold text-text-primary",
          placement === "Above" ? "mb-3" : "mt-3",
        )}
      >
        {sample.question}
      </p>
    ) : null;

  return (
    <DashboardCard
      title="Embed appearance"
      action={
        <Button size="sm" onClick={() => toast("Embed appearance saved")}>
          Save changes
        </Button>
      }
    >
      <SectionGrid>
        <div className="space-y-4 lg:col-span-5">
          <Field label="Accent">
            {(id) => (
              <div className="flex items-center gap-3">
                <input
                  id={id}
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  aria-label="Accent color"
                  className="h-10 w-14 cursor-pointer rounded-md border border-border-default bg-surface-raised p-1"
                />
                <span className="font-mono text-sm text-text-secondary">
                  {accent.toUpperCase()}
                </span>
              </div>
            )}
          </Field>
          <Field label="Question placement">
            {() => (
              <SegmentedControl
                size="form"
                tabs={TITLE_PLACEMENTS}
                active={titlePlacement}
                onChange={setTitlePlacement}
              />
            )}
          </Field>
          <Field label="Corner radius">
            {() => (
              <SegmentedControl
                size="form"
                tabs={Object.keys(RADIUS_CLASSES) as RadiusChoice[]}
                active={radius}
                onChange={setRadius}
              />
            )}
          </Field>
          <Field label="Typeface">
            {(id) => (
              <SelectMenu
                id={id}
                label="Typeface"
                value={typeface}
                onValueChange={(next) => setTypeface(next as TypefaceChoice)}
                options={optionsOf(Object.keys(TYPEFACE_CLASSES))}
              />
            )}
          </Field>
        </div>

        <div className="lg:col-span-7">
          <p className={fieldLabelClass}>Live preview</p>
          <div
            className={cn(
              "mt-1.5 border border-border-default bg-surface-subtle p-4",
              RADIUS_CLASSES[radius],
              TYPEFACE_CLASSES[typeface],
            )}
            style={{ "--accent-default": accent } as CSSProperties}
          >
            {question("Above")}
            <PollResults options={polstOptions(sample)} dense />
            {question("Below")}
          </div>
        </div>
      </SectionGrid>
    </DashboardCard>
  );
}

/* ── Modules & integrations ──────────────────────────────────────── */

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

/* ── Plan & usage ────────────────────────────────────────────────── */

const monthColumns: Array<DataColumn<{ id: string; month: string; views: number; votes: number }>> = [
  {
    header: "Month",
    cell: (row) => (
      <span className="font-display font-semibold text-text-primary">
        {row.month} 2026
      </span>
    ),
  },
  {
    header: "Views",
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtInt(row.views)}</span>,
  },
  {
    header: "Votes",
    align: "right",
    cell: (row) => <span className="tabular-nums">{fmtInt(row.votes)}</span>,
  },
];

/** The plan story is small on purpose: a free workspace, real usage
 *  numbers derived from the model, and the Pro-gated developer teaser. */
function PlanUsageSection() {
  return (
    <>
      <SectionGrid>
        <DashboardCard title="Plan" className="lg:col-span-5">
          <p className="font-display text-xl font-semibold text-text-primary">Free plan</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Campaigns, Polsts, sources, and analytics are all included.
          </p>
        </DashboardCard>
        <div className="lg:col-span-7">
          <LockedCard
            title="Developer platform"
            description="API keys, webhooks, and BI connectors — everything programmatic lives behind the Pro plan so the marketing workspace stays clean."
            chip="Pro"
            className="h-full"
          />
        </div>
      </SectionGrid>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Polsts created" value={fmtInt(USAGE.polstsCreated)} />
        <StatTile label="Campaigns created" value={fmtInt(USAGE.campaignsCreated)} />
        <StatTile
          label="Total views"
          value={fmtInt(USAGE.totalViews)}
          info={METRIC_INFO.views}
        />
        <StatTile
          label="Total votes"
          value={fmtInt(USAGE.totalVotes)}
          info={METRIC_INFO.votes}
        />
      </div>

      <DashboardCard title="Monthly history" padded={false}>
        <DataTable
          rows={USAGE.byMonth.map((m) => ({ ...m, id: m.month }))}
          columns={monthColumns}
        />
      </DashboardCard>
    </>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

const SETTINGS_SECTIONS = [
  { key: "Workspace", icon: "storefront" },
  { key: "Team & access", icon: "group" },
  { key: "Embed appearance", icon: "palette" },
  { key: "Modules & integrations", icon: "extension" },
  { key: "Plan & usage", icon: "credit_card" },
] as const;
type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["key"];

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
                    "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left transition-colors",
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
                  <span className="truncate font-display text-sm font-semibold text-text-primary">
                    {item.key}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4 lg:col-span-9">
          {section === "Workspace" ? <BrandProfileCard /> : null}
          {section === "Team & access" ? <TeamSection /> : null}
          {section === "Embed appearance" ? <EmbedAppearanceCard /> : null}
          {section === "Modules & integrations" ? <ModulesSection /> : null}
          {section === "Plan & usage" ? <PlanUsageSection /> : null}
        </div>
      </SectionGrid>
    </DashboardPage>
  );
}

/** The 404 route renders the shared missing-object pattern (`NotFoundCard`
 *  in the kit) — the same card unknown entity ids use on detail pages. */
export function NotFoundPage() {
  return <NotFoundCard />;
}
