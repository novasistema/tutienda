import { adminDb } from './_lib/firebaseAdmin.js';
import { type ApiRequest, type ApiResponse, queryParam, siteUrl, escapeHtml } from './_lib/http.js';

/**
 * GET /producto/:id (reescrito a /api/producto?id=:id por vercel.json)
 * Devuelve la misma página de la tienda, pero con título, descripción e imagen de la prenda
 * en el <head>. Así Google la indexa y WhatsApp/Instagram/Facebook muestran la vista previa.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  const base = siteUrl(req);
  const id = queryParam(req, 'id');

  let html: string;
  try {
    const page = await fetch(`${base}/index.html`);
    html = await page.text();
  } catch (e) {
    console.error('producto: no se pudo leer index.html', e);
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  try {
    if (/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
      const db = adminDb();
      const [prodSnap, settingsSnap] = await Promise.all([
        db.collection('products').doc(id).get(),
        db.doc('settings/company').get()
      ]);
      if (prodSnap.exists) {
        const p = prodSnap.data() as Record<string, any>;
        const brand = String(settingsSnap.data()?.companyName || '');
        const price = Number(p.priceUnit) || 0;
        const title = `${p.name}${brand ? ` | ${brand}` : ''}`;
        const description = `${p.hook ? `${p.hook}. ` : ''}$${price.toLocaleString('es-AR')}${
          Array.isArray(p.sizes) && p.sizes.length ? ` · Talles ${p.sizes.join(', ')}` : ''
        }`;
        const url = `${base}/producto/${encodeURIComponent(id)}`;
        const image = typeof p.image === 'string' && /^https?:\/\//.test(p.image) ? p.image : '';
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: p.hook || '',
          sku: p.sku || undefined,
          brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
          image: image || undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'ARS',
            price,
            availability: Number(p.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url
          }
        };
        const head = [
          `<title>${escapeHtml(title)}</title>`,
          `<meta name="description" content="${escapeHtml(description)}" />`,
          `<link rel="canonical" href="${escapeHtml(url)}" />`,
          `<meta property="og:type" content="product" />`,
          `<meta property="og:title" content="${escapeHtml(title)}" />`,
          `<meta property="og:description" content="${escapeHtml(description)}" />`,
          `<meta property="og:url" content="${escapeHtml(url)}" />`,
          image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '',
          `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
        ]
          .filter(Boolean)
          .join('\n    ');
        html = html
          .replace(/<title>[\s\S]*?<\/title>/, '')
          .replace(/<meta name="description"[^>]*>/, '')
          .replace(/<meta property="og:(title|description|type|url)"[^>]*>/g, '')
          .replace(/<meta property="og:image"[^>]*>/, image ? '' : `<meta property="og:image" content="${base}/og-image.jpg" />`)
          .replace('</head>', `    ${head}\n  </head>`);
      }
    }
  } catch (e) {
    console.error('producto', e);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.status(200).send(html);
}
