import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TONE } from "@/lib/tones";
import { useUI } from "@/lib/ui";
import { type Notification } from "@/lib/data";
import { EmptyState } from "./EmptyState";
import { Icon } from "./Icon";

/** Notification list + "Mark all read"/"Clear", shared by the desktop bell
 *  popover and the mobile notifications screen. */
export function NotificationsPanel({ className }: { className?: string }) {
  const { notifications, markAllRead, clearNotifications } = useUI();
  const hasUnread = notifications.some((n) => n.unread);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-baseline justify-between px-2 pb-1 lg:pb-2">
        <h3 className="font-display text-base font-bold text-text-primary">
          Notifications
        </h3>
        {notifications.length > 0 &&
          (hasUnread ? (
            <button
              onClick={markAllRead}
              className="font-sans text-xs font-semibold text-text-accent hover:underline"
            >
              Mark all read
            </button>
          ) : (
            <button
              onClick={clearNotifications}
              className="font-sans text-xs font-semibold text-text-accent hover:underline"
            >
              Clear
            </button>
          ))}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications"
          title="You're all caught up"
          body="New follows, likes, and poll results will land here."
        />
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationRow notification={n} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({ notification: n }: { notification: Notification }) {
  const body = (
    <>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-pill",
          TONE[n.tone].ring,
        )}
      >
        <Icon name={n.icon} size={20} className={TONE[n.tone].text} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block font-display text-sm leading-5 text-text-primary",
            n.unread ? "font-bold" : "font-semibold",
          )}
        >
          {n.text}
        </span>
        {n.detail && (
          <span className="block truncate font-sans text-xs leading-4 text-text-secondary">
            {n.detail}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
        <span className="font-sans text-xs leading-4 text-text-secondary">
          {n.ago}
        </span>
        {n.unread && (
          <span
            aria-label="Unread"
            className="h-1.5 w-1.5 rounded-full bg-accent-default"
          />
        )}
      </span>
    </>
  );

  // Unread rows take a faint accent wash on top of the dot + bold title.
  const rowClass = cn(
    "flex w-full items-start gap-3 rounded-sm px-2 py-2.5 text-left transition-colors hover:bg-surface-subtle",
    n.unread && "bg-accent-soft",
  );

  if (n.to) {
    return (
      <Link to={n.to} className={rowClass}>
        {body}
      </Link>
    );
  }
  return (
    <div className={rowClass}>{body}</div>
  );
}
