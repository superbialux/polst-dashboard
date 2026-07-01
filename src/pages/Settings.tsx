import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AuthGate } from "@/components/AuthGate";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { PageShell } from "@/components/PageShell";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useToast } from "@/components/Toast";
import { DEVICES } from "@/lib/data";
import { ACCOUNT, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "appearance", label: "Appearance", icon: "routine" },
  { id: "devices", label: "Devices", icon: "devices" },
  { id: "security", label: "Security", icon: "shield" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Account settings: profile facts, appearance (System/Light/Dark), signed
 *  in devices, and security. Sidebar on desktop, chip row on mobile. */
export function Settings() {
  const [section, setSection] = useState<SectionId>("profile");

  return (
    <PageShell>
      <h1 className="px-0.5 pb-4 font-display text-xl font-bold leading-7 text-text-primary lg:pb-6 lg:text-2xl lg:leading-8">
        Settings
      </h1>

      <AuthGate
        title="Sign in to manage your account"
        body="Profile, appearance, devices, and security settings live here."
      >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* Desktop: stacked sidebar. Mobile: scrollable chip row with an
            edge fade so offscreen sections read as scrollable. */}
        <nav aria-label="Settings sections">
          <ul className="flex gap-1.5 overflow-x-auto pr-6 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-2rem),transparent)] lg:flex-col lg:pr-0 lg:[mask-image:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map(({ id, label, icon }) => (
              <li key={id} className="shrink-0">
                <button
                  onClick={() => setSection(id)}
                  aria-current={id === section ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-3 py-2 font-display text-sm font-bold leading-5 transition-colors",
                    id === section
                      ? "bg-surface-strong text-text-primary"
                      : "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
                  )}
                >
                  <Icon name={icon} size={20} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* max-w keeps label→value scan distances sane on wide screens. */}
        <div className="flex min-w-0 max-w-2xl flex-col gap-6">
          {section === "profile" && <ProfileSection />}
          {section === "appearance" && <AppearanceSection />}
          {section === "devices" && <DevicesSection />}
          {section === "security" && <SecuritySection />}
        </div>
      </div>
      </AuthGate>
    </PageShell>
  );
}

/* ── Shared section building blocks ──────────────────────────── */

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <h2 className="px-0.5 pb-2 font-display text-base font-bold leading-6 text-text-primary">
        {title}
      </h2>
      <div className="flex flex-col divide-y divide-border-default rounded-card border border-border-default bg-card-bg shadow-sm">
        {children}
      </div>
    </section>
  );
}

/** Label on the left, value/control on the right — every settings row. */
function SettingsRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 font-display text-sm font-bold leading-5 text-text-primary">
        {label}
      </span>
      <div className="flex min-w-0 items-center justify-end gap-2 font-sans text-sm leading-5 text-text-secondary">
        {children}
      </div>
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────── */

function ProfileSection() {
  const toast = useToast();
  const [username, setUsername] = useState<string>(ACCOUNT.name);
  const [draft, setDraft] = useState<string | null>(null);

  const copyLink = () => {
    navigator.clipboard?.writeText(`polst.com/${username}`).catch(() => {});
    toast("Profile link copied");
  };

  return (
    <>
      <SettingsGroup title="Account">
        <SettingsRow label="Profile Picture">
          <button
            aria-label="Change profile picture"
            className="rounded-pill transition-opacity hover:opacity-80"
          >
            <Avatar
              color="var(--color-purple-tint)"
              textColor="var(--color-brand-purple)"
              label={ACCOUNT.initials}
              size={40}
            />
          </button>
        </SettingsRow>

        <SettingsRow label="Username">
          {draft === null ? (
            <>
              <span className="truncate text-text-primary">{username}</span>
              <button
                aria-label="Edit username"
                onClick={() => setDraft(username)}
                className="grid h-8 w-8 place-items-center rounded-pill text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
              >
                <Icon name="edit" size={18} />
              </button>
            </>
          ) : (
            <>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Username"
                autoFocus
                className="h-9 w-44 rounded-md border border-border-accent bg-surface-raised px-2.5 font-sans text-sm text-text-primary outline-none"
              />
              <button
                aria-label="Cancel"
                onClick={() => setDraft(null)}
                className="grid h-8 w-8 place-items-center rounded-pill text-icon-secondary transition-colors hover:bg-surface-subtle"
              >
                <Icon name="close" size={18} />
              </button>
              <button
                aria-label="Save username"
                onClick={() => {
                  if (draft.trim()) {
                    setUsername(draft.trim());
                    toast("Username updated");
                  }
                  setDraft(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-pill bg-accent-default text-text-on-accent transition-colors hover:bg-accent-hover"
              >
                <Icon name="check" size={18} weight={600} />
              </button>
            </>
          )}
        </SettingsRow>

        <SettingsRow label="Profile Link">
          <span className="truncate">polst.com/{username}</span>
          <button
            aria-label="Copy profile link"
            onClick={copyLink}
            className="grid h-8 w-8 place-items-center rounded-pill text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
          >
            <Icon name="content_copy" size={18} />
          </button>
        </SettingsRow>

        <SettingsRow label="Email">
          <span className="truncate">{ACCOUNT.email}</span>
          {/* Read-only on purpose — the badge says why there's no pencil. */}
          <span className="flex shrink-0 items-center gap-1 rounded-pill bg-status-success-soft px-2 py-0.5 font-sans text-xs font-semibold leading-4 text-status-success">
            <Icon name="check_circle" size={14} filled />
            Verified
          </span>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Information">
        {(
          [
            ["Gender", ACCOUNT.gender],
            ["Date of Birth", ACCOUNT.dateOfBirth],
          ] as const
        ).map(([label, value]) => (
          <SettingsRow key={label} label={label}>
            <span className="truncate">{value}</span>
            <button
              aria-label={`Edit ${label.toLowerCase()}`}
              className="grid h-8 w-8 place-items-center rounded-pill text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
            >
              <Icon name="edit" size={18} />
            </button>
          </SettingsRow>
        ))}
      </SettingsGroup>

      <SettingsGroup title="Location">
        {(
          [
            ["City", ACCOUNT.city],
            ["State", ACCOUNT.state],
            ["Country", ACCOUNT.country],
          ] as const
        ).map(([label, value]) => (
          <SettingsRow key={label} label={label}>
            <span className="truncate">{value}</span>
            <button
              aria-label={`Edit ${label.toLowerCase()}`}
              className="grid h-8 w-8 place-items-center rounded-pill text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
            >
              <Icon name="edit" size={18} />
            </button>
          </SettingsRow>
        ))}
      </SettingsGroup>
    </>
  );
}

/* ── Appearance ──────────────────────────────────────────────── */

function AppearanceSection() {
  const { preference, setPreference } = useTheme();

  return (
    <SettingsGroup title="Appearance">
      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="font-sans text-sm leading-5 text-text-secondary">
          Choose how Polst looks. System follows your device setting.
        </p>
        <SegmentedControl
          label="Theme"
          value={preference}
          onChange={setPreference}
          className="max-w-96"
          options={[
            { value: "system", label: "System", icon: "routine" },
            { value: "light", label: "Light", icon: "light_mode" },
            { value: "dark", label: "Dark", icon: "dark_mode" },
          ]}
        />
      </div>
    </SettingsGroup>
  );
}

/* ── Devices ─────────────────────────────────────────────────── */

function DevicesSection() {
  const toast = useToast();
  return (
    <SettingsGroup title="Devices">
      {DEVICES.map((device) => (
        <div
          key={device.name}
          className="flex items-center gap-3 px-4 py-3"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-surface-subtle">
            <Icon name={device.icon} size={22} className="text-icon-secondary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-display text-sm font-bold leading-5 text-text-primary">
              {device.name}
              {device.current && (
                <span className="rounded-pill bg-accent-soft px-2 py-0.5 font-sans text-xs font-semibold leading-4 text-text-accent">
                  This device
                </span>
              )}
            </p>
            <p className="truncate font-sans text-xs leading-4 text-text-secondary">
              {device.meta}
            </p>
          </div>
          {!device.current && (
            <button
              onClick={() => toast(`Signed out of ${device.name}`)}
              className="shrink-0 rounded-md px-2.5 py-1 font-display text-sm font-bold leading-5 text-status-danger transition-colors hover:bg-status-danger-soft"
            >
              Log out
            </button>
          )}
        </div>
      ))}
    </SettingsGroup>
  );
}

/* ── Security ────────────────────────────────────────────────── */

function SecuritySection() {
  const toast = useToast();
  const navigate = useNavigate();
  const { signOut } = useSession();
  const [twoFactor, setTwoFactor] = useState(true);

  return (
    <>
      <SettingsGroup title="Security">
        <SettingsRow label="Password">
          <button
            onClick={() => toast("Password reset email sent")}
            className="rounded-md px-2.5 py-1 font-display text-sm font-bold leading-5 text-text-accent transition-colors hover:bg-accent-soft"
          >
            Change password
          </button>
        </SettingsRow>
        <SettingsRow label="Two-factor authentication">
          <button
            role="switch"
            aria-checked={twoFactor}
            onClick={() => setTwoFactor((v) => !v)}
            className={cn(
              "relative h-6 w-11 rounded-pill transition-colors",
              twoFactor ? "bg-accent-default" : "bg-border-strong",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-pill bg-white shadow-sm transition-[left]",
                twoFactor ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        </SettingsRow>
        {/* The only mobile-reachable way out of the account. */}
        <SettingsRow label="Session">
          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 font-display text-sm font-bold leading-5 text-text-primary transition-colors hover:bg-surface-subtle"
          >
            <Icon name="logout" size={18} />
            Log out
          </button>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Danger zone">
        <SettingsRow label="Delete account">
          <button
            onClick={() => toast("Account deletion requires email confirmation")}
            className="rounded-md px-2.5 py-1 font-display text-sm font-bold leading-5 text-status-danger transition-colors hover:bg-status-danger-soft"
          >
            Delete…
          </button>
        </SettingsRow>
      </SettingsGroup>
    </>
  );
}
