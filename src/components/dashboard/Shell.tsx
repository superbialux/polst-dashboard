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

/** Nav rides in three bands: the daily work (campaign-first), the learning
 *  surfaces, and — pinned at the bottom — administration. */
const NAV_GROUPS: Array<{ label?: string; items: NavItem[] }> = [
  {
    items: [
      { label: "Home", icon: "home", to: "/" },
      { label: "Campaigns", icon: "campaign", to: "/campaigns" },
      { label: "Polsts", icon: "ballot", to: "/polsts" },
      { label: "Distribution", icon: "hub", to: "/distribution" },
    ],
  },
  {
    label: "Learn",
    items: [
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
    ],
  },
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

/** Three shell layers, no frames-inside-frames: the black bar is global and
 *  sticky, the sidebar rail is persistent, and the page itself is the working
 *  canvas — it owns the document scroll, with no surrounding card border. */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-app-content text-text-primary">
      <div className="sticky top-0 z-40">
        <Header />
      </div>
      <div className="flex items-start">
        <Sidebar />
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();
  const { modules } = useModules();
  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) =>
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
    ),
  }));
  return (
    <aside className="sticky top-12 hidden h-[calc(100dvh-3rem)] w-60 shrink-0 flex-col border-r border-border-default bg-app-header p-3 lg:flex">
      <nav aria-label="Primary" className="scroll-subtle flex flex-1 flex-col overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={group.label ?? gi} className={cn(gi > 0 && "mt-5")}>
            {group.label ? (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-app-header-muted">
                {group.label}
              </p>
            ) : null}
            <ul className="space-y-1">
              {group.items.map((item) => {
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
          </div>
        ))}

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

/** Wrap the matched span of a result label so the eye lands on why it hit. */
function HighlightMatch({ label, query }: { label: string; query: string }) {
  const q = query.trim().toLowerCase();
  const at = q ? label.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, at)}
      <mark className="rounded-sm bg-accent-soft text-inherit">
        {label.slice(at, at + q.length)}
      </mark>
      {label.slice(at + q.length)}
    </>
  );
}

/** The command palette: top-anchored, keyboard-first. Arrow keys move the
 *  selection, Enter opens it, Escape closes. An empty query shows labeled
 *  Recent items, never unlabeled default results. */
function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState<SearchEntity>("All");
  const [selected, setSelected] = useState(0);

  // Reset on every open so the dialog always starts fresh.
  useEffect(() => {
    if (open) {
      setQuery("");
      setEntity("All");
      setSelected(0);
    }
  }, [open]);

  const isRecent = query.trim() === "";
  const hits = SEARCH_INDEX.filter(
    (hit) =>
      (entity === "All" || hit.entity === entity) &&
      (isRecent || hit.label.toLowerCase().includes(query.trim().toLowerCase())),
  ).slice(0, isRecent ? 5 : 7);

  const openHit = (hit: SearchHit) => {
    onClose();
    navigate(hit.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(hits.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter" && hits[selected]) {
      e.preventDefault();
      openHit(hits[selected]);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Search the workspace"
      placement="top"
      bare
      className="lg:max-w-2xl"
    >
      <div onKeyDown={onKeyDown}>
        {/* The input owns the top edge; dismissal is Esc or the backdrop. */}
        <label className="relative block border-b border-border-default">
          <span className="sr-only">Search the workspace</span>
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-icon-secondary"
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="workspace-search-results"
            aria-activedescendant={hits[selected] ? `search-hit-${selected}` : undefined}
            className="h-12 w-full bg-transparent pl-12 pr-14 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="Search campaigns, Polsts, and sources"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded-sm border border-border-default px-1.5 py-0.5 font-sans text-xs font-medium text-text-tertiary">
            esc
          </kbd>
        </label>

        <div className="p-2">
          <div className="flex gap-1.5 px-1 pb-2 pt-1">
            {SEARCH_ENTITIES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={entity === option}
                onClick={() => {
                  setEntity(option);
                  setSelected(0);
                }}
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
            <>
              <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {isRecent ? "Recent" : "Results"}
              </p>
              <ul id="workspace-search-results" role="listbox" aria-label="Search results">
                {hits.map((hit, i) => (
                  <li key={`${hit.entity}-${hit.id}`}>
                    <button
                      type="button"
                      id={`search-hit-${i}`}
                      role="option"
                      aria-selected={i === selected}
                      onMouseEnter={() => setSelected(i)}
                      onClick={() => openHit(hit)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors",
                        i === selected && "bg-surface-subtle",
                      )}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-subtle text-icon-secondary">
                        <Icon
                          name={ENTITY_ICON[hit.entity as Exclude<SearchEntity, "All">]}
                          size={18}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm font-semibold text-text-primary">
                          <HighlightMatch label={hit.label} query={query} />
                        </span>
                        <span className="block truncate text-xs text-text-secondary">
                          {hit.sublabel}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-text-tertiary">{hit.entity}</span>
                      {i === selected ? (
                        <Icon
                          name="keyboard_return"
                          size={16}
                          className="shrink-0 text-icon-tertiary"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              {!isRecent ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-1 flex w-full items-center gap-3 rounded-md border-t border-border-default p-2 pt-3 text-left text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  <Icon name="manage_search" size={18} className="ml-1.5 text-icon-secondary" />
                  View all results for “{query.trim()}”
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Icon name="search_off" size={32} className="text-icon-tertiary" />
              <p className="text-sm text-text-secondary">
                Nothing in {WORKSPACE.brand} matches “{query}”.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-sm font-semibold text-text-accent hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
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
    body: "It launches Jun 10, but nothing is collecting responses yet.",
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
