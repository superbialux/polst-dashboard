import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Drawer } from "@/components/Drawer";
import { PolstWordmark } from "@/components/PolstLogo";
import { Menu, MenuItem } from "@/components/Menu";
import { useToast } from "@/components/Toast";
import { useModules } from "@/lib/modules";
import { relativeToToday } from "@/lib/canon";
import { useWorkspace } from "@/lib/store";
import { SegmentedControl } from "@/components/dashboard/kit";
import { IconButton, IconTile } from "@/components/dashboard/patterns";
import { WORKSPACE, WORKSPACES, attentionItems } from "@/lib/workspace";

type NavItem = {
  label: string;
  icon: string;
  to: string;
  children?: Array<{ label: string; to: string }>;
};

/** Nav rides in three bands: daily work (unlabeled, straight under
 *  search), learning surfaces ("Measure"), then workspace
 *  administration ("Workspace"). The desktop rail renders the labels
 *  as uppercase micro-headers; the mobile drawer keeps its dividers. */
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
    label: "Measure",
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
    label: "Workspace",
    items: [{ label: "Settings", icon: "settings", to: "/settings" }],
  },
];

/** The nav with module-flagged Analytics children resolved — off means gone. */
function useNavGroups() {
  const { modules } = useModules();
  return useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
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
      })),
    [modules],
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex h-8 items-center gap-2 rounded-sm px-2 text-ui font-medium transition-colors",
    isActive
      ? "bg-white/10 text-sidenav-fg"
      : "text-sidenav-muted hover:bg-white/5 hover:text-sidenav-fg",
  );

/** Every rail glyph occupies the same 16px column. */
function NavIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <span className="grid h-4 w-4 shrink-0 place-items-center">
      <Icon name={name} size={16} weight={400} filled={active} />
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
  const [navOpen, setNavOpen] = useState(false);

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
      <div className="lg:pl-60">
        <Header onActionsSlot={setActionsSlot} onMenu={() => setNavOpen(true)} />
        <HeaderActionsContext.Provider value={actionsSlot}>
          <main id="main-content" className="px-4 pb-10 pt-6 sm:px-5">
            {children}
          </main>
        </HeaderActionsContext.Provider>
      </div>
      <MobileNav
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onSearch={() => {
          setNavOpen(false);
          setSearchOpen(true);
        }}
      />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Sidebar({ onSearch }: { onSearch: () => void }) {
  const location = useLocation();
  const groups = useNavGroups();
  return (
    <aside className="scroll-subtle fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto bg-sidenav pb-2 lg:flex">
      <div className="flex h-12 shrink-0 items-center px-2">
        <WorkspaceMenu />
      </div>
      <div className="px-2 pb-3">
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search the workspace"
          aria-keyshortcuts="Meta+K Control+K"
          className="flex h-8 w-full items-center gap-2 rounded-sm border border-white/10 px-2 text-left text-ui font-medium text-sidenav-muted transition-colors hover:bg-white/5 hover:text-sidenav-fg"
        >
          <span className="grid h-4 w-4 shrink-0 place-items-center">
            <Icon name="search" size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate">Search</span>
          <kbd className="rounded-sm border border-white/10 px-1 py-0.5 font-sans text-micro font-medium text-sidenav-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col px-2">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-3" : undefined}>
            {group.label ? (
              <p className="flex h-6 items-center px-2 text-micro font-medium uppercase tracking-wide text-white/45">
                {group.label}
              </p>
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
                      <ul className="mt-1 space-y-px pl-6">
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              end={child.to === item.to}
                              className={({ isActive }) =>
                                cn(
                                  "flex h-7 items-center rounded-sm px-2 text-ui font-medium transition-colors",
                                  isActive
                                    ? "text-sidenav-fg"
                                    : "text-sidenav-muted hover:bg-white/5 hover:text-sidenav-fg",
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
          <div aria-hidden className="my-2 h-px bg-white/[0.08]" />
          <UserMenu />
        </div>
      </nav>
    </aside>
  );
}

/** Below lg the rail is gone, so the same nav rides a light drawer. */
function MobileNav({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}) {
  const groups = useNavGroups();
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <div className="px-4">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-10 w-full items-center gap-3 rounded-md border border-border-default bg-surface-subtle px-3 text-left text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <Icon name="search" size={20} />
          Search
        </button>
        <nav aria-label="Primary">
          {groups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 ? (
                <div aria-hidden className="my-2 h-px bg-border-default" />
              ) : (
                <div className="pt-3" />
              )}
              <ul className="space-y-px">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-surface-subtle text-text-primary"
                            : "text-text-secondary hover:text-text-primary",
                        )
                      }
                    >
                      <Icon name={item.icon} size={20} />
                      {item.label}
                    </NavLink>
                    {item.children ? (
                      <ul className="mt-px space-y-px pl-11">
                        {item.children.map((child) => (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              end={child.to === item.to}
                              onClick={onClose}
                              className={({ isActive }) =>
                                cn(
                                  "block rounded-sm px-2 py-1.5 text-sm font-medium transition-colors",
                                  isActive
                                    ? "text-text-primary"
                                    : "text-text-secondary hover:text-text-primary",
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
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </Drawer>
  );
}

function Header({
  onActionsSlot,
  onMenu,
}: {
  onActionsSlot: (el: HTMLElement | null) => void;
  onMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border-default bg-surface-raised px-4 sm:px-5">
      {/* Below lg the rail is hidden — a menu button opens the nav drawer
          and the wordmark rides the header. */}
      <IconButton onClick={onMenu} aria-label="Open navigation" className="-ml-1 lg:hidden">
        <Icon name="menu" size={20} />
      </IconButton>
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

/** The header's location line: quiet parents, the current page in ink.
 *  Ids resolve to object names through the store, so freshly created
 *  campaigns and Polsts read by name immediately. */
function Breadcrumbs() {
  const { pathname } = useLocation();
  const { campaignById, polstById } = useWorkspace();

  const crumbs: Crumb[] = (() => {
    if (pathname === "/") return [{ label: "Home" }];
    const seg = pathname.split("/").filter(Boolean);
    switch (seg[0]) {
      case "campaigns": {
        const list: Crumb[] = [{ label: "Campaigns", to: "/campaigns" }];
        if (seg[1] === "new") list.push({ label: "Create campaign" });
        else if (seg[1]) list.push({ label: campaignById(seg[1])?.name ?? "Campaign" });
        return list;
      }
      case "polsts": {
        const list: Crumb[] = [{ label: "Polsts", to: "/polsts" }];
        if (seg[1] === "new") list.push({ label: "Create a Polst" });
        else if (seg[1]) list.push({ label: polstById(seg[1])?.question ?? "Polst" });
        return list;
      }
      case "distribution":
        return [{ label: "Distribution" }];
      case "analytics": {
        const child: Record<string, string> = {
          acquisition: "Acquisition",
          retention: "Retention",
          insights: "Insights",
          reports: "Reports",
        };
        return [
          { label: "Analytics", to: "/analytics" },
          { label: seg[1] ? (child[seg[1]] ?? "Overview") : "Overview" },
        ];
      }
      case "audience":
        return [{ label: "Audience" }];
      case "settings":
        return [{ label: "Settings" }];
      default:
        return [{ label: "Page not found" }];
    }
  })();

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

type SearchEntity = "All" | "Campaigns" | "Polsts" | "Sources" | "Pages";
const SEARCH_ENTITIES: SearchEntity[] = ["All", "Campaigns", "Polsts", "Sources", "Pages"];

type SearchHit = {
  id: string;
  label: string;
  sublabel?: string;
  to: string;
  entity: Exclude<SearchEntity, "All">;
  icon: string;
};

/** Destinations, not data — the jump list an empty query offers. */
const PAGE_HITS: SearchHit[] = [
  { id: "page-home", label: "Home", to: "/", entity: "Pages", icon: "home" },
  { id: "page-campaigns", label: "Campaigns", to: "/campaigns", entity: "Pages", icon: "campaign" },
  { id: "page-polsts", label: "Polsts", to: "/polsts", entity: "Pages", icon: "ballot" },
  { id: "page-distribution", label: "Distribution", to: "/distribution", entity: "Pages", icon: "hub" },
  { id: "page-analytics", label: "Analytics", to: "/analytics", entity: "Pages", icon: "monitoring" },
  { id: "page-audience", label: "Audience", to: "/audience", entity: "Pages", icon: "groups" },
  { id: "page-settings", label: "Settings", to: "/settings", entity: "Pages", icon: "settings" },
];

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
 *  selection, Enter opens it, Escape closes. An empty query offers a
 *  labeled Jump-to list, never unlabeled default results. */
function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { campaigns, polsts, sources } = useWorkspace();
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

  // The searchable universe reads through the store, so objects created
  // this session are findable the moment they exist.
  const index = useMemo<SearchHit[]>(
    () => [
      ...PAGE_HITS,
      ...campaigns.map((c) => ({
        id: `campaign-${c.id}`,
        label: c.name,
        sublabel: c.decision || undefined,
        to: `/campaigns/${c.id}`,
        entity: "Campaigns" as const,
        icon: "campaign",
      })),
      ...polsts.map((p) => ({
        id: `polst-${p.id}`,
        label: p.question,
        sublabel: `${p.optionA} vs ${p.optionB}`,
        to: `/polsts/${p.id}`,
        entity: "Polsts" as const,
        icon: "ballot",
      })),
      ...sources.map((s) => ({
        id: `source-${s.id}`,
        label: s.name,
        sublabel: `${s.kind} · ${s.channel}`,
        to: "/distribution",
        entity: "Sources" as const,
        icon: "hub",
      })),
    ],
    [campaigns, polsts, sources],
  );

  const isJump = query.trim() === "";
  const q = query.trim().toLowerCase();
  const hits = index
    .filter((hit) => {
      if (entity !== "All" && hit.entity !== entity) return false;
      // An empty query on "All" jumps between pages; a chip narrows it to
      // that entity's list instead.
      if (isJump) return entity !== "All" || hit.entity === "Pages";
      return hit.label.toLowerCase().includes(q);
    })
    .slice(0, isJump ? 7 : 8);

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
            placeholder="Search campaigns, Polsts, sources, and pages"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded-sm border border-border-default px-1.5 py-0.5 font-sans text-xs font-medium text-text-tertiary">
            esc
          </kbd>
        </label>

        <div className="p-2">
          <div className="px-1 pb-2 pt-1">
            <SegmentedControl
              size="compact"
              tabs={SEARCH_ENTITIES}
              active={entity}
              onChange={(next) => {
                setEntity(next);
                setSelected(0);
              }}
            />
          </div>

          {hits.length ? (
            <>
              <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                {isJump ? "Jump to" : "Results"}
              </p>
              <ul id="workspace-search-results" role="listbox" aria-label="Search results">
                {hits.map((hit, i) => (
                  <li key={hit.id}>
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
                      <IconTile>
                        <Icon name={hit.icon} size={18} />
                      </IconTile>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm font-semibold text-text-primary">
                          <HighlightMatch label={hit.label} query={query} />
                        </span>
                        {hit.sublabel ? (
                          <span className="block truncate text-xs text-text-secondary">
                            {hit.sublabel}
                          </span>
                        ) : null}
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

/** Notification rows name their destination; the source label derives
 *  from it so the two can never disagree. */
const notificationSource = (to: string) =>
  to.startsWith("/campaigns")
    ? "Campaigns"
    : to.startsWith("/polsts")
      ? "Polsts"
      : to.startsWith("/distribution")
        ? "Distribution"
        : to.startsWith("/analytics")
          ? "Analytics"
          : "Workspace";

function NotificationsMenu() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } =
    useWorkspace();
  return (
    <Menu
      label="Notifications"
      className="w-96 p-0"
      trigger={({ toggle }) => (
        <IconButton
          onClick={toggle}
          aria-label={unreadCount ? `Notifications — ${unreadCount} unread` : "Notifications"}
          className="relative"
        >
          <Icon name="notifications" size={20} />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-pill bg-status-danger ring-2 ring-surface-raised" />
          ) : null}
        </IconButton>
      )}
    >
      <div className="flex items-center justify-between border-b border-border-default py-2 pl-4 pr-2">
        <p className="font-display text-base font-semibold text-text-primary">Notifications</p>
        <IconButton
          aria-label="Mark all as read"
          disabled={unreadCount === 0}
          onClick={(e) => {
            // Keep the panel open — marking read is not a navigation.
            e.stopPropagation();
            markAllNotificationsRead();
          }}
          className="disabled:pointer-events-none disabled:opacity-40"
        >
          <Icon name="done_all" size={20} />
        </IconButton>
      </div>

      <ul className="max-h-96 overflow-y-auto py-1">
        {notifications.map((alert) => (
          <li key={alert.id}>
            <button
              onClick={() => {
                markNotificationRead(alert.id);
                navigate(alert.to);
              }}
              className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-subtle"
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-pill",
                  alert.read ? "bg-transparent" : "bg-accent-default",
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-text-secondary">
                  {notificationSource(alert.to)} · {relativeToToday(alert.at)}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-text-primary">
                  {alert.title}
                </span>
                <span className="mt-0.5 block text-sm leading-5 text-text-secondary">
                  {alert.body}
                </span>
              </span>
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
  const toast = useToast();
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
          className="flex h-9 w-full items-center gap-2 rounded-sm px-2 text-left transition-colors hover:bg-white/5"
        >
          <WorkspaceMark initials={WORKSPACE.initials} size="xs" />
          <span className="min-w-0 flex-1 truncate text-ui font-medium text-sidenav-fg">
            {WORKSPACE.brand}
          </span>
          <Icon name="unfold_more" size={16} className="shrink-0 text-sidenav-muted" />
        </button>
      )}
    >
      {WORKSPACES.map((ws) => (
        <button
          key={ws.id}
          role="menuitem"
          onClick={
            ws.current
              ? undefined
              : () => toast(`Only ${WORKSPACE.brand} has data in this demo`)
          }
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

/** Compact, dismissible triage prompt anchored above the signed-in user.
 *  The review action lands on Home, where the full attention list lives.
 *  Derived from the live store, so fixing an item updates the nag too. */
function SidebarSuggestions() {
  const [visible, setVisible] = useState(true);
  const { campaigns, polsts, sources } = useWorkspace();
  const items = useMemo(
    () => attentionItems(campaigns, polsts, sources),
    [campaigns, polsts, sources],
  );
  if (!visible || items.length === 0) return null;
  const firstItem = items[0];

  return (
    <section
      aria-labelledby="sidebar-suggestions-title"
      className="rounded-sm border border-white/10 bg-white/5 p-3"
    >
      <p
        id="sidebar-suggestions-title"
        className="text-ui font-semibold text-sidenav-fg"
      >
        {items.length} {items.length === 1 ? "item needs" : "items need"} attention
      </p>
      <p className="mt-1 text-xs leading-5 text-sidenav-muted">
        {firstItem.title}{" "}
        {items.length > 1 ? (
          <span className="text-sidenav-fg">+{items.length - 1} more</span>
        ) : null}
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          to="/"
          className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-sm border border-white/10 bg-white/10 px-3 text-xs font-semibold text-sidenav-fg transition-colors hover:bg-white/15"
        >
          Review {items.length} {items.length === 1 ? "item" : "items"}
        </Link>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss suggestions"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-white/10 text-sidenav-muted transition-colors hover:border-white/25 hover:text-sidenav-fg"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
    </section>
  );
}

/** The bottom account menu intentionally exposes one action: log out. */
function UserMenu() {
  const toast = useToast();
  return (
    <Menu
      label="User account"
      align="start"
      side="top"
      rootClassName="w-full"
      // The portaled panel matches the trigger (rail row) width by itself.
      className="p-1.5"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex h-9 w-full items-center gap-2 rounded-sm px-2 text-left transition-colors hover:bg-white/5"
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-accent-default font-display text-micro font-semibold text-text-on-accent">
            {initialsOf(WORKSPACE.owner)}
          </span>
          <span className="min-w-0 flex-1 truncate text-ui font-medium text-sidenav-fg">
            {WORKSPACE.owner}
          </span>
          <Icon
            name={open ? "expand_more" : "more_horiz"}
            size={16}
            className="shrink-0 text-sidenav-muted"
          />
        </button>
      )}
    >
      <MenuItem
        icon="logout"
        label="Log out"
        onClick={() => toast("Logging out is disabled in this demo workspace")}
      />
    </Menu>
  );
}

function initialsOf(name: string) {
  return name.split(" ").map((w) => w[0]).join("");
}

/** The one workspace monogram: 20px `xs` (radius-xs) in the rail trigger,
 *  28px `sm` (radius-md) in the switcher menu. */
function WorkspaceMark({
  initials,
  size = "sm",
}: {
  initials: string;
  size?: "xs" | "sm";
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-accent-default font-display font-semibold text-text-on-accent",
        size === "xs" ? "h-5 w-5 rounded-xs text-micro" : "h-7 w-7 rounded-md text-xs",
      )}
    >
      {initials}
    </span>
  );
}
