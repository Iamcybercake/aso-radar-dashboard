import { useCallback, useEffect, useState } from 'react';

// Load async data with loading/error state and a reload() for retries and after mutations
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps);
  const reload = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await load();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }));
    }
  }, [load]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}

// Map Apple image URL -> our Supabase Storage copy. Falls back to the Apple URL.
export const makeImg = (assets) => {
  const map = new Map((assets || []).map((a) => [a.apple_url, a.public_url]));
  return (url) => (url ? map.get(url) || url : null);
};
