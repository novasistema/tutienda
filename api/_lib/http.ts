import type { IncomingMessage, ServerResponse } from 'node:http';

/** Tipos mínimos de las funciones de Vercel (evita depender de @vercel/node). */
export interface ApiRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}
export interface ApiResponse extends ServerResponse {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  send: (body: string) => void;
}

export const queryParam = (req: ApiRequest, key: string): string => {
  const v = req.query?.[key];
  return (Array.isArray(v) ? v[0] : v) || '';
};

export const readJsonBody = (req: ApiRequest): Record<string, unknown> => {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return typeof b === 'object' ? (b as Record<string, unknown>) : {};
};

/** URL pública del sitio: PUBLIC_SITE_URL o, si no está, el host de la petición. */
export const siteUrl = (req: ApiRequest): string => {
  const configured = process.env.PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, '');
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
  const proto = (req.headers['x-forwarded-proto'] as string) || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
};

export const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export const nowAr = (): string =>
  new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
