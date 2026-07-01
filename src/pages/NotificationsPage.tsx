import { NotificationsPanel } from "@/components/Notifications";
import { PageShell } from "@/components/PageShell";

/** Mobile notifications screen (the bell tab). Desktop reaches the same
 *  panel from the header bell popover, so this page stays narrow. */
export function NotificationsPage() {
  return (
    <PageShell className="lg:max-w-screen-md xl:max-w-[720px]">
      <h1 className="sr-only">Notifications</h1>
      <div className="rounded-card border border-border-default bg-card-bg px-2.5 py-2.5 shadow-sm">
        <NotificationsPanel className="pt-2" />
      </div>
    </PageShell>
  );
}
