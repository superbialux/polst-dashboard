import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { searchSlug } from "@/lib/data";
import { PAGE_CONTAINER } from "@/lib/layout";
import { ACCOUNT, useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { Menu, MenuItem, MenuSeparator } from "./Menu";
import { NotificationsPanel } from "./Notifications";
import { PolstWordmark } from "./PolstLogo";
import { SearchContent, SearchField } from "./SearchDrawer";

/** App chrome shared by every screen: the mobile drawer header below lg,
 *  the full nav header on desktop. */
export function Header({ scrolled = false }: { scrolled?: boolean }) {
  return (
    <>
      <MobileHeader scrolled={scrolled} />
      <DesktopHeader />
    </>
  );
}

/** Mobile chrome: trending + wordmark + search, opens the push drawers. */
function MobileHeader({ scrolled }: { scrolled: boolean }) {
  const { openDrawer } = useUI();
  const iconSize = scrolled ? "text-[22px]" : "text-[24px]";

  return (
    <header className="z-20 w-full shrink-0 bg-page-feed pt-[env(safe-area-inset-top)] lg:hidden">
      <div
        className={cn(
          "mx-auto flex max-w-screen-md items-center justify-between px-2.5 transition-[height] duration-200 ease-out",
          scrolled ? "h-12" : "h-[60px]",
        )}
      >
        <button
          aria-label="Open trending"
          onClick={() => openDrawer("trending")}
          className="grid h-9 w-9 place-items-center rounded-pill text-icon-primary transition-colors hover:bg-surface-subtle"
        >
          <Icon
            name="menu"
            className={cn("transition-[font-size] duration-200", iconSize)}
          />
        </button>

        <Link to="/" aria-label="Polst home" className="inline-flex">
          <PolstWordmark
            className={cn(
              "w-auto transition-[height] duration-200 ease-out dark:invert",
              scrolled ? "h-[26px]" : "h-[30px]",
            )}
          />
        </Link>

        <button
          aria-label="Open search"
          onClick={() => openDrawer("search")}
          className="grid h-9 w-9 place-items-center rounded-pill text-icon-primary transition-colors hover:bg-surface-subtle"
        >
          <Icon
            name="search"
            className={cn("transition-[font-size] duration-200", iconSize)}
          />
        </button>
      </div>
    </header>
  );
}

const NAV = [
  { label: "Explore", to: "/" },
  { label: "Topics", to: "/topics" },
];

/** Desktop chrome: wordmark + nav links, the shared search field in the
 *  middle, and the CTA + notifications + account on the right (or Log In
 *  when signed out). */
function DesktopHeader() {
  const { openAuth, openNewPoll, notifications } = useUI();
  const { signedIn, signOut } = useSession();
  const navigate = useNavigate();
  const hasUnread = notifications.some((n) => n.unread);

  return (
    <header className="z-20 hidden w-full shrink-0 border-b border-border-default bg-page-feed lg:block">
      <div className={cn("flex h-16 items-center gap-8", PAGE_CONTAINER)}>
        <div className="flex shrink-0 items-center gap-6">
          <Link to="/" aria-label="Polst home" className="inline-flex">
            <PolstWordmark className="h-[30px] w-auto dark:invert" />
          </Link>
          {/* The current page sits on a flat neutral wash (surface-strong —
              above the page bg, below pressed), the rest are quiet
              primary-ink links. All at the header's shared 40px height. */}
          <nav aria-label="Primary" className="flex items-center gap-1">
            {NAV.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center rounded-md px-3 font-display text-sm font-bold leading-5 text-tabchip-fg transition-colors",
                    isActive ? "bg-surface-strong" : "hover:bg-surface-subtle",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* One shared control height (40px) across the row — search, CTA,
            bell, and avatar all sit on the same centerline. */}
        <HeaderSearch />

        <div className="flex shrink-0 items-center gap-3">
          {!signedIn && (
            <button
              onClick={() => openAuth("login")}
              className="h-10 rounded-pill border border-btn-secondary-border bg-btn-secondary-bg px-4 font-display text-sm font-bold leading-5 text-btn-secondary-fg transition-colors hover:bg-btn-secondary-bg-hover"
            >
              Log In
            </button>
          )}
          <button
            onClick={() => (signedIn ? openNewPoll() : openAuth("signup"))}
            className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
          >
            Ask the world
          </button>

          {signedIn && (
            <>
              <Menu
                label="Notifications"
                closeOnClick={false}
                className="w-96 max-w-[calc(100vw-2rem)] p-2"
                trigger={({ open, toggle }) => (
                  <button
                    aria-label={
                      hasUnread ? "Notifications (unread)" : "Notifications"
                    }
                    aria-expanded={open}
                    onClick={toggle}
                    className={cn(
                      "relative grid h-10 w-10 place-items-center rounded-pill text-icon-primary transition-colors hover:bg-surface-subtle",
                      open && "bg-surface-subtle",
                    )}
                  >
                    <Icon name="notifications" size={24} />
                    {hasUnread && (
                      <span
                        aria-hidden
                        className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-default ring-2 ring-page-feed"
                      />
                    )}
                  </button>
                )}
              >
                <NotificationsPanel className="max-h-[28rem] overflow-y-auto pt-1" />
              </Menu>

              <Menu
                label="Account"
                trigger={({ open, toggle }) => (
                  <button
                    aria-label="Account menu"
                    aria-expanded={open}
                    onClick={toggle}
                    className="rounded-pill"
                  >
                    <Avatar
                      color="var(--color-purple-tint)"
                      textColor="var(--color-brand-purple)"
                      label={ACCOUNT.initials}
                      size={40}
                    />
                  </button>
                )}
              >
                <MenuItem
                  icon="person"
                  label="View profile"
                  onClick={() => navigate("/profile")}
                />
                <MenuItem
                  icon="settings"
                  label="Settings"
                  onClick={() => navigate("/settings")}
                />
                <MenuSeparator />
                <MenuItem icon="logout" label="Log out" onClick={signOut} />
              </Menu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Desktop search: the shared field with the shared search surface
 *  (most-searched / live results) in a popover underneath, so desktop and
 *  mobile run on one search experience. */
function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-md">
      <SearchField
        className="h-10 border border-border-default bg-surface-raised py-0"
        value={query}
        onChange={(next) => {
          setQuery(next);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onSubmit={(value) => {
          if (!value.trim()) return;
          setOpen(false);
          navigate(`/q/${searchSlug(value)}`);
        }}
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-1 max-h-[28rem] overflow-y-auto rounded-card border border-border-default bg-surface-raised p-2 pt-0 shadow-lg">
          <SearchContent query={query} onQueryChange={setQuery} />
        </div>
      )}
    </div>
  );
}
