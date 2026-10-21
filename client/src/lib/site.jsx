import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const SiteCtx = createContext(null);

export function SiteProvider({ children }) {
  const [state, setState] = useState({ settings: null, offerings: [], ready: false, error: null });

  const load = useCallback(async () => {
    try {
      const [settings, offerings] = await Promise.all([api.get('/settings'), api.get('/offerings?lite=1')]);
      setState({ settings, offerings, ready: true, error: null });
    } catch (e) {
      setState((s) => ({ ...s, ready: true, error: e.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const products = state.offerings.filter((o) => o.isProduct);
  const services = state.offerings.filter((o) => o.isService);
  return <SiteCtx.Provider value={{ ...state, s: state.settings || {}, products, services, reload: load }}>{children}</SiteCtx.Provider>;
}

export const useSite = () => useContext(SiteCtx);

/** Fetch helper for public pages. */
export function useFetch(url, deps = []) {
  const [st, setSt] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let live = true;
    setSt((s) => ({ ...s, loading: true }));
    api.get(url).then(
      (data) => live && setSt({ data, loading: false, error: null }),
      (e) => live && setSt({ data: null, loading: false, error: e })
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);
  return st;
}

/** Update <title> and description on client-side navigation (the server sets them on first load). */
export function usePageMeta(title, description) {
  const { s } = useSite() || {};
  useEffect(() => {
    const brand = s?.companyName || 'Al Amwaj Water Innovation';
    document.title = title ? `${title} | ${brand}` : s?.seoTitle || brand;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
      m.content = description;
    }
  }, [title, description, s]);
}
