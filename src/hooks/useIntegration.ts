import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface IntegrationState {
  data: Record<string, unknown>;
  loading: boolean;
  error: string | null;
  configured: boolean;
}

const refreshListeners = new Map<string, Set<() => void>>();

export function notifyIntegrationRefresh(provider: string) {
  const listeners = refreshListeners.get(provider);
  if (listeners) {
    for (const fn of listeners) fn();
  }
}

export function useIntegration(provider: string, pollIntervalMs = 60_000) {
  const [state, setState] = useState<IntegrationState>({
    data: {},
    loading: true,
    error: null,
    configured: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    try {
      const result = await invoke<Record<string, unknown>>("get_integration_data", { provider });
      const err = result.error as string | undefined;
      const configured = result.configured !== false;
      setState({
        data: result,
        loading: false,
        error: err ?? null,
        configured,
      });
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      }));
    }
  }, [provider]);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(intervalRef.current);
  }, [refresh, pollIntervalMs]);

  useEffect(() => {
    if (!refreshListeners.has(provider)) {
      refreshListeners.set(provider, new Set());
    }
    const set = refreshListeners.get(provider)!;
    set.add(refresh);
    return () => { set.delete(refresh); };
  }, [provider, refresh]);

  return { ...state, refresh };
}

export function openUrl(url: string) {
  invoke("open_url", { url }).catch(() => {});
}
