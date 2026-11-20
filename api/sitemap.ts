import { adminDb } from './_lib/firebaseAdmin.js';
import { type ApiRequest, type ApiResponse, siteUrl, escapeHtml } from './_lib/http.js';

/** GET /sitemap.xml — lista la portada y una dirección por cada prenda, para Google. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const base = siteUrl(req);
  const urls: string[] = [`${base}/`, `${base}/terminos`, `${base}/privacidad`, `${base}/arrepentimiento`];
  try {
    const snap = await adminDb().collection('products').select('id').get();
    snap.forEach((d) => urls.push(`${base}/producto/${encodeURIComponent(d.id)}`));
  } catch (e) {
    console.error('sitemap', e);
  }
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
