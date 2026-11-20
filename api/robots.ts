import { type ApiRequest, type ApiResponse, siteUrl } from './_lib/http.js';

/** GET /robots.txt */
export default function handler(req: ApiRequest, res: ApiResponse) {
  const demo = process.env.VITE_DEMO_MODE === 'true';
  const body = demo
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl(req)}/sitemap.xml\n`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  res.status(200).send(body);
}
