import { useEffect, useState } from 'react';

/**
 * Enrutador mínimo basado en la URL del navegador (sin dependencias).
 * Rutas: /  ·  /producto/:id  ·  /admin  ·  /terminos  ·  /privacidad  ·  /arrepentimiento
 */
const EVENT = 'app:navigate';

export const navigate = (path: string, replace = false) => {
  if (typeof window === 'undefined') return;
  const current = window.location.pathname + window.location.search;
  if (current === path) return;
  if (replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
  window.dispatchEvent(new Event(EVENT));
};

export const usePathname = (): string => {
  const [path, setPath] = useState(() => (typeof window === 'undefined' ? '/' : window.location.pathname));
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener(EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(EVENT, update);
    };
  }, []);
  return path;
};

export const productIdFromPath = (path: string): string | null => {
  const m = path.match(/^\/producto\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
};

export type LegalPageId = 'terminos' | 'privacidad' | 'arrepentimiento';
export const legalPageFromPath = (path: string): LegalPageId | null => {
  const m = path.match(/^\/(terminos|privacidad|arrepentimiento)\/?$/);
  return m ? (m[1] as LegalPageId) : null;
};
