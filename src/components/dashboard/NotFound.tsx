import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardCard, DashboardPage } from "@/components/dashboard/kit";

/** The one missing-object pattern: the 404 route and every unknown entity id
 *  render this instead of silently falling back to another object's data. */
export function NotFoundCard({ kind = "page" }: { kind?: string }) {
  return (
    <DashboardPage>
      <DashboardCard>
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-base font-semibold text-text-primary">
            This {kind} doesn&rsquo;t exist
          </p>
          <p className="text-sm text-text-secondary">
            It may have been moved or deleted.
          </p>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </DashboardCard>
    </DashboardPage>
  );
}
