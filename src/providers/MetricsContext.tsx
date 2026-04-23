import { createContext, useContext, type ReactNode } from "react";
import { useMetrics, type MetricsState } from "../hooks/useMetrics";

const MetricsContext = createContext<MetricsState>({
  current: {},
  history: {},
});

export function MetricsProvider({ children }: { children: ReactNode }) {
  const metrics = useMetrics();
  return (
    <MetricsContext.Provider value={metrics}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetricsContext(): MetricsState {
  return useContext(MetricsContext);
}
