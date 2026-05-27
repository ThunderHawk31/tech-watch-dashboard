import { createContext, useContext, useState, useEffect } from 'react';
import { fetchSources } from '../api';

const SourcesContext = createContext([]);

export function SourcesProvider({ children }) {
  const [sources, setSources] = useState([]);
  useEffect(() => { fetchSources().then(setSources); }, []);
  return <SourcesContext.Provider value={sources}>{children}</SourcesContext.Provider>;
}

export function useSources() {
  return useContext(SourcesContext);
}

export function getSourceInfo(url, sources) {
  if (!url || !sources.length) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    const source = sources.find(s => host.includes(s.domain)) ?? null;
    if (!source) return null;

    // Pour newsletter.techwatch.fr, extraire le nom depuis le path
    if (host === 'newsletter.techwatch.fr') {
      const segment = parsed.pathname.split('/').filter(Boolean)[0] || '';
      const name = segment
        .replace(/-newsletter$/i, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()) || source.name;
      return { ...source, name };
    }

    return source;
  } catch {
    return null;
  }
}
