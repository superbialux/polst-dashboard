import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { PolstWordmark } from "@/components/PolstLogo";
import { Menu, MenuItem } from "@/components/Menu";
import { useModules } from "@/lib/modules";
import {
  CAMPAIGNS,
  ATTENTION_ITEMS,
  CHANNELS,
  CREATORS,
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

/** Nav rides in three bands split by hairline dividers: daily work,
 *  learning surfaces, then workspace administration. */
const NAV_GROUPS: Array<{ items: NavItem[] }> = [
  {
    items: [
      { label: "Home", icon: "home", to: "/" },
      { label: "Campaigns", icon: "campaign", to: "/campaigns" },
      { label: "Polsts", icon: "ballot", to: "/polsts" },
      { label: "Distribution", icon: "hub", to: "/distribution" },
    ],
  },
  {
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
  {
    items: [{ label: "Settings", icon: "settings", to: "/settings" }],
  },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-sidenav-active text-sidenav-fg"
      : "text-sidenav-muted hover:bg-sidenav-hover hover:text-sidenav-fg",
  );

/** Every rail glyph and identity mark occupies the same 20px column. */
function NavIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <span className="grid h-5 w-5 shrink-0 place-items-center">
      <Icon name={name} size={20} weight={400} filled={active} />
    </span>
  );
}

/* ── Header actions slot ─────────────────────────────────────────── */

/** The header's right side belongs to the current page. Pages teleport
 *  their actions (Create campaign, Export, View analytics…) into this
 *  slot; the bell stays put after it. */
const HeaderActionsContext = createContext<HTMLElement | null>(null);

export function HeaderActions({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderActionsContext);
  if (!slot) return null;
  return createPortal(children, slot);
}

/** The shell: one dark surface — the full-height sidebar rail — beside a
 *  light column that stacks a sticky 48px header over the working canvas.
 *  The page owns the document scroll; nothing nests a second scroller. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl-K opens the same workspace search as the sidebar control.
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
    <div className="min-h-dvh bg-app-content text-text-primary">
      <Sidebar onSearch={() => setSearchOpen(true)} />
      <div className="lg:pl-64">
        <Header onActionsSlot={setActionsSlot} />
        <HeaderActionsContext.Provider value={actionsSlot}>
          <main id="main-content" className="px-4 pb-10 pt-6 sm:px-5">
            {children}
          </main>
        </HeaderActionsContext.Provider>
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Sidebar({ onSearch }: { onSearch: () => void }) {
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
    <aside className="scroll-subtle fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto bg-sidenav pb-2 lg:flex">
      <div className="flex h-12 shrink-0 items-center border-b border-sidenav-active px-2">
        <WorkspaceMenu />
      </div>
      <div className="px-2 pb-3 pt-2">
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search the workspace"
          aria-keyshortcuts="Meta+K Control+K"
          className="flex h-9 w-full items-center gap-2 rounded-md border border-sidenav-active bg-sidenav-hover px-2 text-left text-sm font-medium text-sidenav-muted transition-colors hover:bg-sidenav-active hover:text-sidenav-fg"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center">
            <Icon name="search" size={20} />
          </span>
          <span className="min-w-0 flex-1 truncate">Search</span>
          <kbd className="rounded-sm border border-sidenav-active px-1.5 py-0.5 font-sans text-[10px] font-medium leading-none text-sidenav-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col px-2">
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 ? (
              <div aria-hidden className="my-2 h-px bg-sidenav-active" />
            ) : null}
            <ul className="space-y-px">
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
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>

                    {item.children && parentActive ? (
                      <ul className="mt-1 space-y-px pl-7">
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              end={child.to === item.to}
                              className={({ isActive }) =>
                                cn(
                                  "block rounded-sm px-2 py-1.5 text-sm font-medium text-sidenav-muted transition-colors hover:text-sidenav-fg",
                                  isActive && "text-sidenav-fg",
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
          <SidebarSuggestions />
          <div aria-hidden className="my-2 h-px bg-sidenav-active" />
          <UserMenu />
        </div>
      </nav>
    </aside>
  );
}

function Header({
  onActionsSlot,
}: {
  onActionsSlot: (el: HTMLElement | null) => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border-default bg-surface-raised px-4 sm:px-5">
      {/* Below lg the rail is hidden, so the wordmark rides the header */}
      <Link to="/" aria-label="Home" className="lg:hidden">
        <PolstWordmark className="h-6" />
      </Link>

      {/* Where you are — search moved entirely behind ⌘K */}
      <Breadcrumbs />

      {/* Right — the current page's actions teleport in, then the bell */}
      <div className="ml-auto flex items-center gap-2">
        <div ref={onActionsSlot} className="flex items-center gap-2" />
        <NotificationsMenu />
      </div>

    </header>
  );
}

/* ── Breadcrumbs ─────────────────────────────────────────────────── */

type Crumb = { label: string; to?: string };

/** Resolve the current route into named crumbs — ids become object names. */
function buildCrumbs(pathname: string): Crumb[] {
  if (pathname === "/") return [{ label: "Home" }];
  const seg = pathname.split("/").filter(Boolean);
  switch (seg[0]) {
    case "campaigns": {
      const crumbs: Crumb[] = [{ label: "Campaigns", to: "/campaigns" }];
      if (seg[1] === "new") crumbs.push({ label: "Create campaign" });
      else if (seg[1]) {
        const campaign = CAMPAIGNS.find((c) => c.id === seg[1]);
        crumbs.push({ label: campaign?.name ?? "Campaign" });
      }
      return crumbs;
    }
    case "polsts": {
      const crumbs: Crumb[] = [{ label: "Polsts", to: "/polsts" }];
      if (seg[1] === "new") crumbs.push({ label: "Create a Polst" });
      else if (seg[1]) {
        const polst = SINGLE_POLSTS.find((p) => p.id === seg[1]);
        crumbs.push({ label: polst?.question ?? "Polst" });
      }
      return crumbs;
    }
    case "distribution": {
      const crumbs: Crumb[] = [{ label: "Distribution", to: "/distribution" }];
      if (seg[1] === "channels" && seg[2]) {
        const channel = CHANNELS.find((c) => c.id === seg[2]);
        crumbs.push({ label: channel?.name ?? "Channel" });
      } else if (seg[1] === "creators" && seg[2]) {
        const creator = CREATORS.find((c) => c.id === seg[2]);
        crumbs.push({ label: creator?.name ?? "Creator" });
      }
      return crumbs;
    }
    case "analytics": {
      const crumbs: Crumb[] = [{ label: "Analytics", to: "/analytics" }];
      const child: Record<string, string> = {
        acquisition: "Acquisition",
        retention: "Retention",
        insights: "Insights",
        reports: "Reports",
      };
      crumbs.push({ label: seg[1] ? (child[seg[1]] ?? "Overview") : "Overview" });
      return crumbs;
    }
    case "audience":
      return [{ label: "Audience" }];
    case "settings":
      return [{ label: "Settings" }];
    default:
      return [{ label: "Page not found" }];
  }
}

/** The header's location line: quiet parents, the current page in ink. */
function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname);
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 md:flex">
      {crumbs.map((crumb, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 ? (
              <Icon name="chevron_right" size={16} className="shrink-0 text-icon-tertiary" />
            ) : null}
            {crumb.to && !last ? (
              <Link
                to={crumb.to}
                className="whitespace-nowrap text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className="truncate text-sm font-medium text-text-primary"
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
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

/** A 32×32 quiet icon control, sized to the 48px white header. */
const headerButton =
  "grid h-8 w-8 place-items-center rounded-md text-icon-secondary transition-colors hover:bg-surface-subtle hover:text-icon-primary";

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
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-pill bg-status-danger ring-2 ring-surface-raised" />
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

/** The rail starts with company context; account actions live at its foot. */
function WorkspaceMenu() {
  return (
    <Menu
      label="Switch company"
      align="start"
      rootClassName="w-full"
      className="w-72 p-1.5"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="grid h-9 w-full grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-2 rounded-md px-2 transition-colors hover:bg-sidenav-hover"
        >
          <span className="grid h-5 w-5 place-items-center rounded-xs bg-accent-default font-display text-[8px] font-bold leading-none text-text-on-accent">
            {WORKSPACE.initials}
          </span>
          <span className="min-w-0 truncate text-center text-sm font-medium leading-5 text-sidenav-fg">
            {WORKSPACE.brand}
          </span>
          <Icon name="unfold_more" size={20} className="text-sidenav-muted" />
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
          <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-text-primary">
            {ws.name}
          </span>
          {ws.current ? <Icon name="check" size={18} className="text-accent-default" /> : null}
        </button>
      ))}
    </Menu>
  );
}

/** Compact, dismissible triage prompt anchored above the signed-in user. */
function SidebarSuggestions() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  const firstItem = ATTENTION_ITEMS[0];

  return (
    <section
      aria-labelledby="sidebar-suggestions-title"
      className="rounded-md border border-sidenav-active bg-sidenav-hover p-3"
    >
      <p
        id="sidebar-suggestions-title"
        className="text-sm font-semibold text-sidenav-fg"
      >
        {ATTENTION_ITEMS.length} items need attention
      </p>
      <p className="mt-1 text-xs leading-5 text-sidenav-muted">
        {firstItem.title} <span className="text-sidenav-fg">+{ATTENTION_ITEMS.length - 1} more</span>
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          to={firstItem.to ?? "/"}
          className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-sm border border-sidenav-active bg-sidenav-active px-3 text-xs font-semibold text-sidenav-fg transition-colors hover:bg-surface-strong hover:text-text-primary"
        >
          Review items
        </Link>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss suggestions"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-sidenav-active text-sidenav-muted transition-colors hover:bg-sidenav-active hover:text-sidenav-fg"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
    </section>
  );
}

/** The bottom account menu intentionally exposes one action: log out. */
function UserMenu() {
  return (
    <Menu
      label="User account"
      align="start"
      side="top"
      rootClassName="w-full"
      className="w-full p-1.5"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-sidenav-hover"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-accent-default font-display text-[8px] font-bold leading-none text-text-on-accent">
            {initialsOf(WORKSPACE.owner)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium leading-5 text-sidenav-fg">
            {WORKSPACE.owner}
          </span>
          <Icon
            name={open ? "expand_more" : "more_horiz"}
            size={20}
            className="shrink-0 text-sidenav-muted"
          />
        </button>
      )}
    >
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
