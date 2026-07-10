import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_ANALYTICS_FILTERS,
  queryAnalytics,
  type AnalyticsFilters,
} from "@/lib/analytics";

type AnalyticsContextValue = {
  filters: AnalyticsFilters;
  setFilters: (next: AnalyticsFilters) => void;
  rows: ReturnType<typeof queryAnalytics>;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState(DEFAULT_ANALYTICS_FILTERS);
  const rows = useMemo(() => queryAnalytics(filters), [filters]);

  return (
    <AnalyticsContext.Provider value={{ filters, setFilters, rows }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error("useAnalytics must be used inside AnalyticsProvider");
  return context;
}
