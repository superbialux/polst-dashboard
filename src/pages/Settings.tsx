import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { CONTROL, Checkbox, Field, FieldHelper, SelectMenu, TextInput } from "@/components/Field";
import {
  ConnectCard,
  DashboardCard,
  DashboardPage,
  DataTable,
  NotFoundCard,
  PollResults,
  SectionGrid,
  SegmentedControl,
  StatTile,
  Switch,
  type DataColumn,
} from "@/components/dashboard";
import { MODULE_INFO, useModules } from "@/lib/modules";
import { METRIC_INFO, fmtDate, fmtInt } from "@/lib/canon";
import { useWorkspace } from "@/lib/store";
import {
  API_SCOPES,
  INTEGRATIONS,
  USAGE,
  WEBHOOK_EVENTS,
  WEBHOOK_LIMIT,
  WORKSPACE,
  polstOptions,
  type ApiKey,
  type ApiScope,
  type TeamMember,
  type Webhook,
  type WebhookEvent,
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
 *  page. Avatar changes are real (local object URL); the profile fields
 *  save nowhere (the rail wordmark reads the WORKSPACE constant), so the
 *  fields dirty-track like every other save in the app — the button only
 *  wakes once something changed — and the click still tells the truth:
 *  toasts never claim what the store didn't do. */
function BrandProfileCard() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(WORKSPACE.brand);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");

  const dirty =
    displayName !== WORKSPACE.brand ||
    description !== "" ||
    location !== "" ||
    city !== "";

  return (
    <DashboardCard
      title="Brand profile"
      action={
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() => toast("Saving the brand profile is disabled in this demo workspace")}
        >
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
          {(id) => (
            <TextInput
              id={id}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
          )}
        </Field>

        <Field label="Description">
          {(id) => (
            <textarea
              id={id}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                value={location}
                onValueChange={setLocation}
              />
            )}
          </Field>
          <Field label="City">
            {(id) => (
              <TextInput
                id={id}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Austin"
              />
            )}
          </Field>
        </div>
      </div>
    </DashboardCard>
  );
}

/* ── Team & access ───────────────────────────────────────────────── */

/** The team model: members are provisioned brand-only accounts — no
 *  invite emails — and everyone besides the owner is a Manager. Members
 *  live in the workspace store like every other in-session creation, so
 *  an added row survives navigating away; "Joined" fills at first sign-in. */
function TeamSection() {
  const toast = useToast();
  const { members, addMember } = useWorkspace();
  const [addOpen, setAddOpen] = useState(false);

  const memberColumns: Array<DataColumn<TeamMember>> = [
    {
      header: "Member",
      cell: (row) => (
        <div className="flex items-center gap-3">
          {/* The shared Avatar, on the same accent tone as the rail's
              account row — one monogram treatment per person, app-wide. */}
          <Avatar
            color="var(--accent-default)"
            textColor="var(--text-on-accent)"
            label={row.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            size={32}
          />
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
        <span
          className={
            row.role === "Owner"
              ? "font-display font-semibold text-text-primary"
              : "text-text-secondary"
          }
        >
          {row.role}
        </span>
      ),
    },
    {
      header: "Joined",
      cell: (row) =>
        row.joined ? (
          <span className="whitespace-nowrap text-text-secondary">{fmtDate(row.joined)}</span>
        ) : (
          <span className="whitespace-nowrap text-text-tertiary">Awaiting first sign-in</span>
        ),
    },
  ];

  const [provisioned, setProvisioned] = useState<{ email: string; password: string } | null>(
    null,
  );

  return (
    <>
      <DashboardCard
        title="Members"
        description="Members are provisioned brand-only accounts with a Manager or Owner role. Only an owner can add or remove members."
        padded={false}
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            Add member
          </Button>
        }
      >
        <DataTable rows={members} columns={memberColumns} />
      </DashboardCard>

      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(name, email, role) => {
          const { password } = addMember(name, email, role);
          setProvisioned({ email, password });
        }}
      />

      {/* The one place the initial password ever appears (staging's
          provisioning contract: no invite email, a generated first
          password handed to the teammate out of band). */}
      <Modal
        open={provisioned !== null}
        onClose={() => setProvisioned(null)}
        label="Account created"
        title="Account created"
        footer={
          <div className="flex justify-end p-4">
            <Button onClick={() => setProvisioned(null)}>Done</Button>
          </div>
        }
      >
        {provisioned ? (
          <div className="space-y-3 p-4">
            <p className="text-sm leading-6 text-text-secondary">
              <span className="font-semibold text-text-primary">{provisioned.email}</span> can
              sign in now with this initial password. It is shown once — share it with your
              teammate directly; they should change it at first sign-in.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-border-default bg-surface-subtle p-3">
              <code className="min-w-0 flex-1 break-all font-mono text-sm text-text-primary">
                {provisioned.password}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  navigator.clipboard
                    ?.writeText(provisioned.password)
                    .then(() => toast("Password copied to clipboard"))
                    .catch(() => toast("Copy failed — the browser blocked clipboard access"))
                }
              >
                Copy
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function AddMemberModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, email: string, role: TeamMember["role"]) => void;
}) {
  const { members } = useWorkspace();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("Manager");

  // A fresh form every time the modal opens.
  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setRole("Manager");
    }
  }, [open]);

  // One email is one account — a duplicate can't be provisioned twice
  // (the store refuses too; this surfaces the reason before the click).
  const duplicate = members.some(
    (m) => m.email.toLowerCase() === email.trim().toLowerCase(),
  );
  const valid = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email) && !duplicate;

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Add member"
      title="Add member"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onAdd(name.trim(), email.trim(), role);
              onClose();
            }}
          >
            Create account
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <Field label="Name">
          {(fieldId) => (
            <TextInput
              id={fieldId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Reyes"
            />
          )}
        </Field>
        <Field
          label="Email"
          helper={
            duplicate ? (
              <FieldHelper tone="danger">
                That email already has an account in this workspace.
              </FieldHelper>
            ) : undefined
          }
        >
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
        <Field label="Role">
          {() => (
            <SegmentedControl
              size="form"
              tabs={["Manager", "Owner"] as const}
              active={role}
              onChange={setRole}
            />
          )}
        </Field>
        <p className="rounded-md bg-surface-subtle p-3 text-xs leading-5 text-text-secondary">
          Creates a brand-only account with a generated initial password — no invite email is
          sent. Managers run campaigns, Polsts, and analytics; owners can also manage members,
          billing, and the developer platform.
        </p>
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

/* The four choices persist in localStorage — the module-flags pattern
   (lib/modules) — so "Save changes" is a real write: the card round-trips
   section switches and reloads, and the toast never claims what didn't
   happen. Unknown stored values fall back to the defaults. */
type EmbedAppearance = {
  accent: string;
  titlePlacement: TitlePlacement;
  radius: RadiusChoice;
  typeface: TypefaceChoice;
};

const EMBED_APPEARANCE_KEY = "polst-embed-appearance-v1";
const EMBED_APPEARANCE_DEFAULT: EmbedAppearance = {
  accent: "#6161c7",
  titlePlacement: "Above",
  radius: "Medium",
  typeface: "System UI",
};

function readEmbedAppearance(): EmbedAppearance {
  try {
    const raw = localStorage.getItem(EMBED_APPEARANCE_KEY);
    if (!raw) return EMBED_APPEARANCE_DEFAULT;
    const stored = { ...EMBED_APPEARANCE_DEFAULT, ...JSON.parse(raw) };
    return {
      accent: /^#[0-9a-f]{6}$/i.test(stored.accent)
        ? stored.accent
        : EMBED_APPEARANCE_DEFAULT.accent,
      titlePlacement: (TITLE_PLACEMENTS as readonly string[]).includes(stored.titlePlacement)
        ? stored.titlePlacement
        : EMBED_APPEARANCE_DEFAULT.titlePlacement,
      radius:
        stored.radius in RADIUS_CLASSES ? stored.radius : EMBED_APPEARANCE_DEFAULT.radius,
      typeface:
        stored.typeface in TYPEFACE_CLASSES ? stored.typeface : EMBED_APPEARANCE_DEFAULT.typeface,
    };
  } catch {
    return EMBED_APPEARANCE_DEFAULT;
  }
}

/** Every control here drives the live preview — accent, question
 *  placement, corner radius, typeface — so nothing on this card is
 *  decorative. The preview is the real PollResults block. Saving writes
 *  localStorage; the button dirty-tracks against the saved state, like
 *  every other save in the app. */
function EmbedAppearanceCard() {
  const toast = useToast();
  const { polsts } = useWorkspace();
  const sample = polsts.find((p) => p.votes > 0) ?? polsts[0];

  const [saved, setSaved] = useState<EmbedAppearance>(readEmbedAppearance);
  const [accent, setAccent] = useState(saved.accent);
  const [titlePlacement, setTitlePlacement] = useState<TitlePlacement>(saved.titlePlacement);
  const [radius, setRadius] = useState<RadiusChoice>(saved.radius);
  const [typeface, setTypeface] = useState<TypefaceChoice>(saved.typeface);

  const dirty =
    accent !== saved.accent ||
    titlePlacement !== saved.titlePlacement ||
    radius !== saved.radius ||
    typeface !== saved.typeface;

  const save = () => {
    const next: EmbedAppearance = { accent, titlePlacement, radius, typeface };
    localStorage.setItem(EMBED_APPEARANCE_KEY, JSON.stringify(next));
    setSaved(next);
    toast("Embed appearance saved");
  };

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
        <Button size="sm" disabled={!dirty} onClick={save}>
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

/* ── Developer (API keys & webhooks) ─────────────────────────────────
   Staging's Developer section is real — scoped API keys and up to ten
   webhook endpoints — so this one works too, against the store. The
   full secret appears once at creation and is never recoverable. */

function ApiKeysSection() {
  const toast = useToast();
  const { apiKeys, createApiKey, revokeApiKey } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [minted, setMinted] = useState<{ name: string; secret: string } | null>(null);

  const keyColumns: Array<DataColumn<ApiKey>> = [
    {
      header: "Key",
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-display font-semibold text-text-primary">{row.name}</p>
          <p className="mt-0.5 font-mono text-xs text-text-secondary">{row.tokenPreview}</p>
        </div>
      ),
    },
    {
      header: "Scopes",
      cell: (row) => <span className="text-text-secondary">{row.scopes.join(", ")}</span>,
    },
    {
      header: "Created",
      cell: (row) => (
        <span className="whitespace-nowrap text-text-secondary">{fmtDate(row.createdAt)}</span>
      ),
    },
    {
      header: "Last used",
      cell: (row) =>
        row.lastUsed ? (
          <span className="whitespace-nowrap text-text-secondary">{fmtDate(row.lastUsed)}</span>
        ) : (
          <span className="whitespace-nowrap text-text-tertiary">Never</span>
        ),
    },
    {
      header: "",
      align: "right",
      cell: (row) => (
        <Button variant="secondary" size="sm" onClick={() => setRevokeTarget(row)}>
          Revoke
        </Button>
      ),
    },
  ];

  return (
    <>
      <DashboardCard
        title="API keys"
        description="Server-to-server access to this workspace's Polsts, campaigns, and analytics. Keys exchange for short-lived tokens; scope each key to what the caller needs."
        padded={false}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            Create API key
          </Button>
        }
      >
        <DataTable
          rows={apiKeys}
          columns={keyColumns}
          emptyLabel="No API keys yet — create one to call the REST API"
        />
      </DashboardCard>

      <CreateApiKeyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(name, scopes) => {
          const { secret } = createApiKey(name, scopes);
          setMinted({ name, secret });
        }}
      />

      {/* The one place the full secret ever appears. */}
      <Modal
        open={minted !== null}
        onClose={() => setMinted(null)}
        label="API key created"
        title="API key created"
        footer={
          <div className="flex justify-end p-4">
            <Button onClick={() => setMinted(null)}>Done</Button>
          </div>
        }
      >
        {minted ? (
          <div className="space-y-3 p-4">
            <p className="text-sm leading-6 text-text-secondary">
              Copy the secret for <span className="font-semibold text-text-primary">{minted.name}</span> now
              — it is shown once and can't be recovered. A lost secret means revoking the key
              and creating a new one.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-border-default bg-surface-subtle p-3">
              <code className="min-w-0 flex-1 break-all font-mono text-xs text-text-primary">
                {minted.secret}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  navigator.clipboard
                    ?.writeText(minted.secret)
                    .then(() => toast("Secret copied to clipboard"))
                    .catch(() => toast("Copy failed — the browser blocked clipboard access"))
                }
              >
                Copy
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        label="Revoke API key"
        title="Revoke this key?"
        footer={
          <div className="flex justify-end gap-2 p-4">
            <Button variant="secondary" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (revokeTarget) {
                  revokeApiKey(revokeTarget.id);
                  toast(`${revokeTarget.name} revoked — its requests fail from now on`);
                }
                setRevokeTarget(null);
              }}
            >
              Revoke key
            </Button>
          </div>
        }
      >
        {revokeTarget ? (
          <p className="p-4 text-sm leading-6 text-text-secondary">
            <span className="font-semibold text-text-primary">{revokeTarget.name}</span>{" "}
            ({revokeTarget.tokenPreview}) stops working immediately. Anything calling the API
            with it starts failing. This can't be undone.
          </p>
        ) : null}
      </Modal>
    </>
  );
}

function CreateApiKeyModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, scopes: ApiScope[]) => void;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiScope[]>(["Read analytics"]);

  useEffect(() => {
    if (open) {
      setName("");
      setScopes(["Read analytics"]);
    }
  }, [open]);

  const toggleScope = (scope: ApiScope) =>
    setScopes((all) =>
      all.includes(scope) ? all.filter((s) => s !== scope) : [...all, scope],
    );

  const valid = name.trim().length > 0 && scopes.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Create API key"
      title="Create API key"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onCreate(name.trim(), scopes);
              onClose();
            }}
          >
            Create key
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <Field label="Name" helper={<FieldHelper tone="neutral">What will use this key — e.g. “Warehouse sync”.</FieldHelper>}>
          {(id) => (
            <TextInput
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Warehouse sync"
              maxLength={60}
            />
          )}
        </Field>
        <div>
          <p className={fieldLabelClass}>Scopes</p>
          <ul className="mt-1.5 space-y-2">
            {API_SCOPES.map((scope) => (
              <li key={scope}>
                <Checkbox
                  checked={scopes.includes(scope)}
                  onCheckedChange={() => toggleScope(scope)}
                  label={scope}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

function WebhooksSection() {
  const toast = useToast();
  const { webhooks, addWebhook, removeWebhook } = useWorkspace();
  const [addOpen, setAddOpen] = useState(false);

  const webhookColumns: Array<DataColumn<Webhook>> = [
    {
      header: "Endpoint",
      cell: (row) => (
        <span className="break-all font-mono text-xs text-text-primary">{row.url}</span>
      ),
    },
    {
      header: "Events",
      cell: (row) => (
        <span className="font-mono text-xs text-text-secondary">{row.events.join(", ")}</span>
      ),
    },
    {
      header: "Last delivery",
      cell: (row) =>
        row.lastDelivery ? (
          <span
            className={cn(
              "whitespace-nowrap",
              row.lastDelivery.ok ? "text-text-secondary" : "text-status-danger",
            )}
          >
            {fmtDate(row.lastDelivery.at)} · {row.lastDelivery.ok ? "delivered" : "failing"}
          </span>
        ) : (
          <span className="whitespace-nowrap text-text-tertiary">No events yet</span>
        ),
    },
    {
      header: "",
      align: "right",
      cell: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            removeWebhook(row.id);
            toast("Endpoint removed — no further events are sent to it");
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <>
      <DashboardCard
        title="Webhooks"
        description={`Polst POSTs each subscribed event to your endpoint as it happens. Up to ${WEBHOOK_LIMIT} endpoints per workspace — ${webhooks.length} in use.`}
        padded={false}
        action={
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={webhooks.length >= WEBHOOK_LIMIT}>
            Add endpoint
          </Button>
        }
      >
        <DataTable
          rows={webhooks}
          columns={webhookColumns}
          emptyLabel="No endpoints yet — add one to receive events"
        />
      </DashboardCard>

      <AddWebhookModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(url, events) => {
          const result = addWebhook(url, events);
          toast(result.ok ? "Endpoint added — events start on the next occurrence" : result.reason);
        }}
      />
    </>
  );
}

function AddWebhookModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (url: string, events: WebhookEvent[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(["campaign.ended"]);

  useEffect(() => {
    if (open) {
      setUrl("");
      setEvents(["campaign.ended"]);
    }
  }, [open]);

  const toggleEvent = (event: WebhookEvent) =>
    setEvents((all) =>
      all.includes(event) ? all.filter((e) => e !== event) : [...all, event],
    );

  const valid = /^https:\/\/\S+\.\S+/.test(url.trim()) && events.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Add webhook endpoint"
      title="Add webhook endpoint"
      footer={
        <div className="flex justify-end gap-2 p-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onAdd(url.trim(), events);
              onClose();
            }}
          >
            Add endpoint
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-4">
        <Field
          label="Endpoint URL"
          helper={<FieldHelper tone="neutral">HTTPS only — events are signed POST requests.</FieldHelper>}
        >
          {(id) => (
            <TextInput
              id={id}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/hooks/polst"
            />
          )}
        </Field>
        <div>
          <p className={fieldLabelClass}>Events</p>
          <ul className="mt-1.5 space-y-2">
            {WEBHOOK_EVENTS.map((event) => (
              <li key={event}>
                <Checkbox
                  checked={events.includes(event)}
                  onCheckedChange={() => toggleEvent(event)}
                  label={event}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

function DeveloperSection() {
  return (
    <>
      <ApiKeysSection />
      <WebhooksSection />
    </>
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

/** The plan story is small on purpose: a free workspace and real usage
 *  numbers derived from the model. The old "Pro" developer teaser is
 *  gone — the Developer section is a working capability, not a plan gate. */
function PlanUsageSection() {
  const { campaigns, polsts } = useWorkspace();
  // Live counts mirror USAGE's formula (workspace.ts) against store state,
  // so in-session creations tick immediately. The views/votes totals and
  // monthly history stay on the static model snapshot.
  const campaignsCreated = campaigns.length;
  const polstsCreated =
    campaigns.reduce((total, c) => total + c.chain.length, 0) + polsts.length;
  return (
    <>
      <DashboardCard title="Plan">
        <p className="font-display text-xl font-semibold text-text-primary">Free plan</p>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Campaigns, Polsts, sources, analytics, and the developer platform are all included.
        </p>
      </DashboardCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Polsts created" value={fmtInt(polstsCreated)} />
        <StatTile label="Campaigns created" value={fmtInt(campaignsCreated)} />
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
  { key: "Developer", icon: "code" },
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
          {section === "Developer" ? <DeveloperSection /> : null}
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
