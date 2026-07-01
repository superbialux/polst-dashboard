import { type ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileTabBar } from "./MobileTabBar";
import { PAGE_CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/utils";

/** Standard page frame for everything that isn't the feed: fixed header,
 *  one scrolling column with the page content and (on desktop) the site
 *  footer, mobile tab bar pinned below. Matches the feed's geometry — same
 *  container, same hidden scrollbar. */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
        <div className="flex min-h-full flex-col">
          <div
            className={cn(
              PAGE_CONTAINER,
              "w-full flex-1 px-2.5 pb-8 pt-4 lg:pt-6 xl:px-0",
              className,
            )}
          >
            {children}
          </div>
          <Footer className="hidden lg:flex" />
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}
