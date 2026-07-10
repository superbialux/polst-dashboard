import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { PolstWordmark } from "@/components/PolstLogo";
import { Menu, MenuItem } from "@/components/Menu";
import { useModules } from "@/lib/modules";
import {
  CAMPAIGNS,
  DISTRIBUTION_SOURCES,
  SINGLE_POLSTS,
  WORKSPACE,
  WORKSPACES,
} from "@/lib/workspace";

type NavItem = {
  label: string;
  icon: string;
  to: string;
  children?: Array<{ label: string; to: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "home", to: "/" },
  { label: "Campaigns", icon: "campaign", to: "/campaigns" },
  { label: "Polsts", icon: "ballot", to: "/polsts" },
  { label: "Distribution", icon: "hub", to: "/distribution" },
  {
    label: "Analytics",
    icon: "monitoring",
    to: "/analytics",
    children: [
      { label: "Overview", to: "/analytics" },
      { label: "Insights", to: "/analytics/insights" },
      { label: "Reports", to: "/analytics/reports" },
    ],
  },
  { label: "Audience", icon: "groups", to: "/audience" },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex h-8 items-center gap-3 rounded-md px-3 font-display text-ui font-semibold text-app-header-fg transition-colors hover:bg-app-content",
    isActive && "bg-app-header-field text-app-header-fg shadow-sm",
  );

/** Sidebar icons are always brand ink; the active row alone fills the glyph. */
function NavIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <Icon name={name} size={20} weight={500} filled={active} className="text-app-header-fg" />
  );
}

/** The whole app is one dark frame: the top row and sidebar sit directly on
 *  it (no separate header bar), and the page content is a single rounded card
 *  floating inside with an even gap — the only thing that scrolls. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-app-header text-app-header-fg">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main
          id="main-content"
          className="scroll-subtle mx-3 mb-3 min-w-0 flex-1 overflow-y-auto rounded-card border border-border-default bg-app-content text-text-primary shadow-sm lg:ml-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();
  const { modules } = useModules();
  const navItems = NAV_ITEMS.map((item) =>
    item.label === "Analytics"
      ? {
          ...item,
          children: [
            { label: "Overview", to: "/analytics" },
            ...(modules.acquisition
              ? [{ label: "Acquisition", to: "/analytics/acquisition" }]
              : []),
            ...(modules.retention
              ? [{ label: "Retention", to: "/analytics/retention" }]
              : []),
            { label: "Insights", to: "/analytics/insights" },
            { label: "Reports", to: "/analytics/reports" },
          ],
        }
      : item,
  );
  return (
    <aside className="hidden w-60 shrink-0 flex-col pb-3 pl-3 pr-3 pt-[var(--radius-card)] lg:flex">
      <nav aria-label="Primary" className="flex flex-1 flex-col overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const parentActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname === item.to ||
                  location.pathname.startsWith(`${item.to}/`);
            return (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === "/"} className={navLinkClass}>
                  {({ isActive }) => (
                    <>
                      <NavIcon name={item.icon} active={isActive} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>

                {item.children && parentActive ? (
                  <ul className="mt-1 space-y-0.5 pl-11">
                    {item.children.map((child) => (
                      <li key={child.to}>
                        <NavLink
                          to={child.to}
                          end={child.to === item.to}
                          className={({ isActive }) =>
                            cn(
                              "block rounded-sm px-3 py-1.5 text-ui font-medium text-app-header-muted transition-colors hover:text-app-header-fg",
                              isActive && "font-semibold text-app-header-fg",
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="mt-auto pt-4">
          <NavLink to="/settings" className={navLinkClass}>
            {({ isActive }) => (
              <>
                <NavIcon name="settings" active={isActive} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}

function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl-K opens the workspace search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 bg-topbar px-3 text-topbar-fg lg:px-4">
      {/* Left — mirrors the right side's width so the search stays centered */}
      <div className="flex flex-1 items-center">
        <Link to="/" aria-label="Home" className="px-1">
          <PolstWordmark className="h-[1.625rem] brightness-0 invert" />
        </Link>
      </div>

      {/* Center — search (a button styled as a field; the real input lives in the dialog) */}
      <div className="hidden w-full max-w-xl md:block">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="relative block h-8 w-full rounded-md bg-topbar-field pl-10 pr-14 text-left text-ui text-topbar-muted outline-none transition-colors hover:bg-topbar-field-hover"
        >
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-topbar-muted"
          />
          Search campaigns, Polsts, and sources
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 font-sans text-xs font-semibold text-topbar-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right — actions */}
      <div className="flex flex-1 items-center justify-end gap-1.5">
        <CreateMenu />
        <NotificationsMenu />
        <AccountMenu />
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}

/* ── Workspace search (⌘K) ───────────────────────────────────────── */

type SearchEntity = "All" | "Campaigns" | "Polsts" | "Sources";
const SEARCH_ENTITIES: SearchEntity[] = ["All", "Campaigns", "Polsts", "Sources"];

type SearchHit = { id: string; label: string; sublabel: string; to: string; entity: SearchEntity };

/** The searchable universe: every campaign, Polst, and source by name. */
const SEARCH_INDEX: SearchHit[] = [
  ...CAMPAIGNS.map((c) => ({
    id: c.id,
    label: c.name,
    sublabel: c.decision,
    to: `/campaigns/${c.id}`,
    entity: "Campaigns" as const,
  })),
  ...SINGLE_POLSTS.map((p) => ({
    id: p.id,
    label: p.question,
    sublabel: `${p.optionA} vs ${p.optionB}`,
    to: `/polsts/${p.id}`,
    entity: "Polsts" as const,
  })),
  ...DISTRIBUTION_SOURCES.map((s) => ({
    id: s.id,
    label: s.name,
    sublabel: `${s.channel} · ${s.linkedObject}`,
    to: "/distribution",
    entity: "Sources" as const,
  })),
];

const ENTITY_ICON: Record<Exclude<SearchEntity, "All">, string> = {
  Campaigns: "campaign",
  Polsts: "ballot",
  Sources: "hub",
};

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState<SearchEntity>("All");

  // Reset on every open so the dialog always starts fresh.
  useEffect(() => {
    if (open) {
      setQuery("");
      setEntity("All");
    }
  }, [open]);

  const hits = SEARCH_INDEX.filter(
    (hit) =>
      (entity === "All" || hit.entity === entity) &&
      (query.trim() === "" ||
        hit.label.toLowerCase().includes(query.trim().toLowerCase())),
  ).slice(0, 8);

  return (
    <Modal open={open} onClose={onClose} label="Search the workspace" className="lg:max-w-xl">
      <div className="p-3">
        <label className="relative block">
          <span className="sr-only">Search the workspace</span>
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-icon-secondary"
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border-default bg-surface-raised pl-10 pr-3 text-ui text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-border-accent"
            placeholder="Search campaigns, Polsts, and sources"
          />
        </label>
        <div className="mt-3 flex gap-1.5">
          {SEARCH_ENTITIES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={entity === option}
              onClick={() => setEntity(option)}
              className={cn(
                "h-7 rounded-pill px-3 font-display text-xs font-semibold transition-colors",
                entity === option
                  ? "bg-accent-soft text-accent-default"
                  : "bg-surface-subtle text-text-secondary hover:text-text-primary",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {hits.length ? (
          <ul className="mt-3 space-y-0.5">
            {hits.map((hit) => (
              <li key={`${hit.entity}-${hit.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(hit.to);
                  }}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-surface-subtle"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-subtle text-icon-secondary">
                    <Icon name={ENTITY_ICON[hit.entity as Exclude<SearchEntity, "All">]} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold text-text-primary">
                      {hit.label}
                    </span>
                    <span className="block truncate text-xs text-text-secondary">
                      {hit.sublabel}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-text-tertiary">{hit.entity}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Icon name="search" size={32} className="text-icon-tertiary" />
            <p className="text-sm text-text-secondary">
              Nothing in {WORKSPACE.brand} matches “{query}”.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** A 32×32 header control, sized to sit within the 48px black bar. */
const headerButton =
  "grid h-8 w-8 place-items-center rounded-md text-topbar-fg transition-colors hover:bg-topbar-field";

function CreateMenu() {
  const navigate = useNavigate();
  return (
    <Menu
      label="Create"
      trigger={({ toggle }) => (
        <button onClick={toggle} className={headerButton} aria-label="Create">
          <Icon name="add" size={20} />
        </button>
      )}
    >
      <MenuItem
        icon="campaign"
        label="Create campaign"
        onClick={() => navigate("/campaigns/new")}
      />
      <MenuItem
        icon="ballot"
        label="Create single Polst"
        onClick={() => navigate("/polsts/new")}
      />
      <MenuItem icon="event" label="Add scheduled moment" onClick={() => navigate("/")} />
    </Menu>
  );
}

type Alert = {
  source: string;
  time: string;
  title: string;
  body: string;
  unread: boolean;
};

const ALERTS: Alert[] = [
  {
    source: "Campaigns",
    time: "12m ago",
    title: "Packaging Direction Test is ready to review",
    body: "Option B is ahead by 18 points — enough to make a call.",
    unread: true,
  },
  {
    source: "Distribution",
    time: "1h ago",
    title: "Game Day Creative Test has no sources",
    body: "It's scheduled for Feb 6, but nothing is collecting responses yet.",
    unread: true,
  },
  {
    source: "Distribution",
    time: "3h ago",
    title: "Conference Booth QR passed 100 responses",
    body: "Scans are steady, but completion is sitting at 41%.",
    unread: false,
  },
];

function NotificationsMenu() {
  return (
    <Menu
      label="Notifications"
      closeOnClick={false}
      className="w-96 p-0"
      trigger={({ toggle }) => (
        <button onClick={toggle} aria-label="Notifications" className={cn(headerButton, "relative")}>
          <Icon name="notifications" size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-pill bg-status-danger ring-2 ring-topbar" />
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <p className="font-display text-base font-bold text-text-primary">Notifications</p>
        <div className="flex items-center gap-1">
          <button
            aria-label="Filter"
            className="grid h-8 w-8 place-items-center rounded-sm text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
          >
            <Icon name="tune" size={20} />
          </button>
          <button
            aria-label="Mark all as read"
            className="grid h-8 w-8 place-items-center rounded-sm text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary"
          >
            <Icon name="done_all" size={20} />
          </button>
        </div>
      </div>

      <ul className="max-h-96 overflow-y-auto py-1">
        {ALERTS.map((alert) => (
          <li key={alert.title}>
            <button className="group flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-subtle">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-pill",
                  alert.unread ? "bg-accent-default" : "bg-transparent",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-text-secondary">
                  {alert.source} · {alert.time}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-text-primary">
                  {alert.title}
                </span>
                <span className="mt-0.5 block text-sm leading-5 text-text-secondary">
                  {alert.body}
                </span>
              </span>
              <Icon
                name="check_circle"
                size={18}
                className="mt-0.5 shrink-0 text-icon-tertiary opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-border-default py-3 text-center text-sm text-text-secondary">
        No more notifications
      </div>
    </Menu>
  );
}

function AccountMenu() {
  return (
    <Menu
      label="Account"
      className="w-72 p-1.5"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className="flex h-8 items-center gap-2 rounded-md pl-1 pr-2.5 text-topbar-fg transition-colors hover:bg-topbar-field"
        >
          <WorkspaceMark initials={WORKSPACE.initials} size="sm" />
          <span className="hidden font-display text-ui font-semibold sm:inline">
            {WORKSPACE.brand}
          </span>
        </button>
      )}
    >
      {WORKSPACES.map((ws) => (
        <button
          key={ws.id}
          role="menuitem"
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface-subtle"
        >
          <WorkspaceMark initials={ws.initials} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display text-sm font-semibold text-text-primary">
              {ws.name}
            </span>
            <span className="block truncate text-xs text-text-secondary">{ws.domain}</span>
          </span>
          {ws.current ? <Icon name="check" size={18} className="text-accent-default" /> : null}
        </button>
      ))}

      <div className="my-1.5 h-px bg-border-default" />

      <div className="flex items-center gap-3 rounded-md px-2.5 py-2">
        <span className="grid h-8 w-8 place-items-center rounded-pill bg-avatar-bg font-display text-xs font-bold text-text-inverse">
          {initialsOf(WORKSPACE.owner)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-text-primary">
            {WORKSPACE.owner}
          </span>
          <span className="block truncate text-xs text-text-secondary">{WORKSPACE.email}</span>
        </span>
      </div>

      <MenuItem icon="logout" label="Log out" />
    </Menu>
  );
}

function initialsOf(name: string) {
  return name.split(" ").map((w) => w[0]).join("");
}

/** The rounded workspace monogram used in the header and switcher. */
function WorkspaceMark({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-md bg-accent-default font-display font-bold text-text-on-accent",
        size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm",
      )}
    >
      {initials}
    </span>
  );
}
