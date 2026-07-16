import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ANALYTICS_DEFAULTS,
  analyticsRows,
  type AnalyticsFilters,
  type SegmentRow,
} from "@/lib/analytics";

/** One analytics scope shared across Overview, Insights, and Reports —
 *  a filter chosen on one page persists on the others. */
type AnalyticsContextValue = {
  filters: AnalyticsFilters;
  setFilters: (next: AnalyticsFilters) => void;
  /** Restore the default 30-day, all-channels, all-categories scope. */
  resetFilters: () => void;
  rows: SegmentRow[];
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<AnalyticsFilters>(ANALYTICS_DEFAULTS);
  const resetFilters = useCallback(() => setFilters(ANALYTICS_DEFAULTS), []);
  const rows = useMemo(() => analyticsRows(filters), [filters]);
  const value = useMemo(
    () => ({ filters, setFilters, resetFilters, rows }),
    [filters, resetFilters, rows],
  );

  return (
    <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error("useAnalytics must be used inside AnalyticsProvider");
  return context;
}
