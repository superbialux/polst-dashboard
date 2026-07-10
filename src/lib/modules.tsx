import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** Feature-flagged analytics modules. The CEO rule: entire modules toggle
 *  per workspace (pricing tiers, staged rollouts) — when a module is off,
 *  its nav items and tabs simply don't exist. Mock: flags persist locally. */

export type ModuleKey = "acquisition" | "retention";

export const MODULE_INFO: {
  key: ModuleKey;
  name: string;
  description: string;
}[] = [
  {
    key: "acquisition",
    name: "Acquisition analytics",
    description:
      "Account creations, cost per account, paid vs organic, and channel economics.",
  },
  {
    key: "retention",
    name: "Retention analytics",
    description:
      "Weekly cohorts, repeat voting, churn risk, and notification returns.",
  },
];

type ModuleState = Record<ModuleKey, boolean>;

const STORAGE_KEY = "polst-modules";
const DEFAULT_STATE: ModuleState = { acquisition: true, retention: true };

function readStored(): ModuleState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

const ModulesContext = createContext<{
  modules: ModuleState;
  setModule: (key: ModuleKey, on: boolean) => void;
}>({ modules: DEFAULT_STATE, setModule: () => {} });

export function ModulesProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<ModuleState>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
  }, [modules]);

  const setModule = (key: ModuleKey, on: boolean) =>
    setModules((cur) => ({ ...cur, [key]: on }));

  return (
    <ModulesContext.Provider value={{ modules, setModule }}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules() {
  return useContext(ModulesContext);
}
