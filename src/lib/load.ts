import { useCallback, useEffect, useState } from "react";

/** Loads data for a page and reloads it when `deps` change or `reload()` is called. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    fn().then(
      (data) => live && setState({ data, loading: false }),
      (e: unknown) => live && setState({ error: e instanceof Error ? e.message : String(e), loading: false }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Greenzone Learning Hub` : "Greenzone Learning Hub";
  }, [title]);
}
