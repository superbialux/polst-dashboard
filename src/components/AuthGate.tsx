import { useSession } from "@/lib/session";
import { useUI } from "@/lib/ui";
import { type ReactNode } from "react";
import { EmptyState } from "./EmptyState";

/** Wraps account-only screens: signed out, the content is replaced by a
 *  sign-in prompt instead of leaking another user's mock state. */
export function AuthGate({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  const { signedIn } = useSession();
  const { openAuth } = useUI();

  if (signedIn) return <>{children}</>;

  return (
    <div className="rounded-card border border-border-default bg-card-bg shadow-sm">
      <EmptyState
        icon="lock"
        title={title}
        body={body}
        action={
          <button
            onClick={() => openAuth("login")}
            className="h-10 rounded-pill bg-btn-primary-bg px-4 font-display text-sm font-bold leading-5 text-btn-primary-fg transition-colors hover:bg-btn-primary-bg-hover"
          >
            Log In
          </button>
        }
      />
    </div>
  );
}
