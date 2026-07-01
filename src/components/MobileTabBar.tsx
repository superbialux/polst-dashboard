import { Link, useLocation, useNavigate } from "react-router-dom";
import { ACCOUNT, useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

/** Bottom navigation on mobile: home, topics, create, notifications,
 *  profile. Create and profile gate on the session and fall back to the
 *  auth dialog. */
export function MobileTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { openNewPoll, openAuth, notifications } = useUI();
  const { signedIn } = useSession();
  const hasUnread = signedIn && notifications.some((n) => n.unread);

  return (
    // Mobile-only chrome — hidden on desktop alongside the rest of the bar.
    <nav
      aria-label="Main"
      className="w-full shrink-0 border-t border-border-default bg-surface-raised px-3 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="mx-auto flex max-w-screen-md items-center justify-around">
        <NavIcon label="Home" icon="home" to="/" active={pathname === "/"} />
        <NavIcon
          label="Topics"
          icon="tag"
          to="/topics"
          active={pathname === "/topics"}
        />

        <li>
          <button
            aria-label="Create poll"
            onClick={() => (signedIn ? openNewPoll() : openAuth("signup"))}
            className="grid h-10 w-14 place-items-center rounded-md bg-surface-subtle text-icon-primary transition-colors hover:bg-surface-strong"
          >
            <Icon name="add" size={26} weight={500} />
          </button>
        </li>

        <li>
          <button
            aria-label="Notifications"
            aria-current={pathname === "/notifications" ? "page" : undefined}
            onClick={() =>
              signedIn ? navigate("/notifications") : openAuth("login")
            }
            className="group grid h-11 w-11 place-items-center"
          >
            <span className="relative inline-grid place-items-center">
              <Icon
                name="notifications"
                size={26}
                filled={pathname === "/notifications"}
                weight={pathname === "/notifications" ? 600 : 400}
                className={cn(
                  "transition-colors",
                  pathname === "/notifications"
                    ? "text-icon-primary"
                    : "text-tabbar-inactive-icon group-hover:text-text-primary",
                )}
              />
              {hasUnread && (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent-default ring-2 ring-surface-raised"
                />
              )}
            </span>
          </button>
        </li>

        <li>
          <button
            aria-label="Profile"
            aria-current={pathname === "/profile" ? "page" : undefined}
            onClick={() =>
              signedIn ? navigate("/profile") : openAuth("login")
            }
            className={cn(
              "grid place-items-center rounded-pill",
              pathname === "/profile" &&
                "ring-2 ring-accent-default ring-offset-2",
            )}
          >
            <Avatar
              color="var(--color-purple-tint)"
              textColor="var(--color-brand-purple)"
              label={signedIn ? ACCOUNT.initials : undefined}
              size={34}
            >
              {!signedIn && (
                <Icon
                  name="person"
                  size={20}
                  className="text-accent-default"
                />
              )}
            </Avatar>
          </button>
        </li>
      </ul>
    </nav>
  );
}

function NavIcon({
  label,
  icon,
  to,
  active,
  dot,
}: {
  label: string;
  icon: string;
  to: string;
  active: boolean;
  dot?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className="group grid h-11 w-11 place-items-center"
      >
        <span className="relative inline-grid place-items-center">
          <Icon
            name={icon}
            size={26}
            filled={active}
            weight={active ? 600 : 400}
            className={cn(
              "transition-colors",
              active
                ? "text-icon-primary"
                : "text-tabbar-inactive-icon group-hover:text-text-primary",
            )}
          />
          {dot && (
            <span
              aria-hidden
              className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent-default ring-2 ring-surface-raised"
            />
          )}
        </span>
      </Link>
    </li>
  );
}
