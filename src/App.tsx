import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { DRAWER_WIDTH } from "@/components/Drawer";
import { TrendingDrawer } from "@/components/Discover";
import { NewPollModal } from "@/components/NewPollModal";
import { SearchDrawer } from "@/components/SearchDrawer";
import { ToastProvider } from "@/components/Toast";
import { NOTIFICATIONS } from "@/lib/data";
import { SessionProvider } from "@/lib/session";
import { ThemeProvider } from "@/lib/theme";
import { UIContext, type AuthMode, type DrawerName } from "@/lib/ui";
import { PlaceFeed, TagFeed, TopicFeed } from "@/pages/Discovery";
import { NotFound } from "@/pages/NotFound";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { Onboarding } from "@/pages/Onboarding";
import { Poll } from "@/pages/Poll";
import { Profile } from "@/pages/Profile";
import { SearchAnswer } from "@/pages/SearchAnswer";
import { SeoGallery, SeoVariationRoute } from "@/pages/seo-variations";
import { Settings } from "@/pages/Settings";
import { Topics } from "@/pages/Topics";
import { Trending } from "@/pages/Trending";

export function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

/** Owns the cross-screen UI state: the mobile push drawers, the auth and
 *  creation dialogs, and the notifications feed. The app frame slides
 *  sideways by the drawer's width (same curve as the panels) so drawers
 *  push the screen instead of covering it. */
function Shell() {
  const [drawer, setDrawer] = useState<DrawerName | null>(null);
  const [auth, setAuth] = useState<AuthMode | null>(null);
  const [newPoll, setNewPoll] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const location = useLocation();

  // Navigation closes any open drawer or dialog.
  useEffect(() => {
    setDrawer(null);
    setAuth(null);
    setNewPoll(false);
  }, [location.pathname]);

  const ui = useMemo(
    () => ({
      drawer,
      openDrawer: setDrawer,
      closeDrawer: () => setDrawer(null),
      openAuth: setAuth,
      openNewPoll: () => setNewPoll(true),
      notifications,
      markAllRead: () =>
        setNotifications((items) =>
          items.map((n) => ({ ...n, unread: false })),
        ),
      clearNotifications: () => setNotifications([]),
    }),
    [drawer, notifications],
  );

  const push =
    drawer === "trending"
      ? `translateX(${DRAWER_WIDTH})`
      : drawer === "search"
        ? `translateX(calc(-1 * ${DRAWER_WIDTH}))`
        : undefined;

  return (
    <UIContext.Provider value={ui}>
      <div className="h-[100dvh] overflow-hidden bg-page-feed">
        <div
          className="h-full transition-transform duration-300 ease-out"
          style={{ transform: push }}
        >
          <Routes>
            <Route path="/" element={<Trending />} />
            <Route path="/poll/:slug" element={<Poll />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/topic/:name" element={<TopicFeed />} />
            <Route path="/tag/:tag" element={<TagFeed />} />
            <Route path="/place/:city" element={<PlaceFeed />} />
            <Route path="/q/:slug" element={<SearchAnswer />} />
            <Route path="/seo" element={<SeoGallery />} />
            <Route path="/seo/:variant/:slug" element={<SeoVariationRoute />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <TrendingDrawer
          open={drawer === "trending"}
          onClose={() => setDrawer(null)}
        />
        <SearchDrawer
          open={drawer === "search"}
          onClose={() => setDrawer(null)}
        />
      </div>

      <AuthModal mode={auth} onClose={() => setAuth(null)} onSwitch={setAuth} />
      <NewPollModal open={newPoll} onClose={() => setNewPoll(false)} />
    </UIContext.Provider>
  );
}
