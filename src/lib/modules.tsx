import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** Feature-flagged analytics modules. The CEO rule: entire modules toggle
 *  per workspace (pricing tiers, staged rollouts) — when a module is off,
 *  its nav items and tabs simply don't exist. Both ship OFF: they only have
 *  data to show once an external platform is connected, and none are.
 *  Mock: flags persist locally. */

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
      "Spend, reach, and cost per voter by channel. Shows data only after an ad platform is connected — Meta, TikTok, or Google Analytics.",
  },
  {
    key: "retention",
    name: "Retention analytics",
    description:
      "Repeat voting and returning voters. Shows data only after a platform that recognizes voters across visits is connected, like Klaviyo.",
  },
];

type ModuleState = Record<ModuleKey, boolean>;

const STORAGE_KEY = "polst-modules-v2";
const DEFAULT_STATE: ModuleState = { acquisition: false, retention: false };

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
