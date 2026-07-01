import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

/** The signed-in account every screen mocks against. */
export const ACCOUNT = {
  name: "MaxPolst",
  handle: "maxpolst",
  initials: "MP",
  email: "max@polst.io",
  gender: "Male",
  dateOfBirth: "5/20/1986",
  city: "Chicago",
  state: "Illinois",
  country: "United States",
  location: "Chicago, IL",
  joined: "May 2026",
  following: 1504,
  followers: 1204,
  polls: 326,
  votes: 43648,
} as const;

type SessionContextValue = {
  signedIn: boolean;
  signIn: () => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/** Mock auth: a boolean that the header, tab bar, and gated tabs read.
 *  Starts signed in so the default experience is the full app. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(true);
  return (
    <SessionContext.Provider
      value={{
        signedIn,
        signIn: () => setSignedIn(true),
        signOut: () => setSignedIn(false),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession requires SessionProvider");
  return ctx;
}
