import { createContext, useContext } from "react";
import { type Notification } from "./data";

export type DrawerName = "trending" | "search";
export type AuthMode = "login" | "signup";

export type UIContextValue = {
  /** Mobile push drawers — owned globally so they work on every screen. */
  drawer: DrawerName | null;
  openDrawer: (drawer: DrawerName) => void;
  closeDrawer: () => void;
  /** Auth + creation dialogs. */
  openAuth: (mode: AuthMode) => void;
  openNewPoll: () => void;
  /** Notifications feed (shared by the header popover and mobile screen). */
  notifications: Notification[];
  markAllRead: () => void;
  clearNotifications: () => void;
};

export const UIContext = createContext<UIContextValue | null>(null);

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI requires the App UIContext provider");
  return ctx;
}
