import fs from 'node:fs';
import { Offering, Setting } from '../models/index.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const STATIC_PAGES = {
  '/': { title: null, priority: '1.0' },
  '/about': { title: 'About us', description: 'Who we are, what we build and where we work.', priority: '0.8' },
  '/products': { title: 'Products & systems', description: 'Swimming pool systems, water softening, RO plants, fire protection, pumping, fountains and irrigation.', priority: '0.8' },
  '/services': { title: 'Our services', description: 'Pool construction, jacuzzi, mosaic tile, steam and sauna, heating, filtration, renovation and maintenance.', priority: '0.8' },
  '/brands': { title: 'Brands we work with', description: 'Equipment brands we supply and install.', priority: '0.6' },
  '/gallery': { title: 'Gallery', description: 'Photos and videos of our pools, fountains and water treatment work.', priority: '0.6' },
  '/contact': { title: 'Contact us', description: 'Tell us about your project and we will reply with next steps and a quote.', priority: '0.8' },
  '/terms': { title: 'Terms & conditions', description: 'Terms for using this website and requesting quotations.', priority: '0.3' },
};

// Old static-site URLs → new routes, so existing Google rankings and links keep working.
export const LEGACY = {
  '/index.html': '/', '/about.html': '/about', '/products.html': '/products', '/services.html': '/services',
  '/brands.html': '/brands', '/gallery.html': '/gallery', '/contact.html': '/contact', '/terms.html': '/terms', '/sitemap.html': '/',
};

const siteUrl = () => (process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function metaFor(urlPath) {
  const s = (await Setting.findOne({ key: 'site' }).lean()) || {};
  const brand = s.companyName || 'Al Amwaj Water Innovation';
  let title = s.seoTitle || brand;
  let description = s.seoDescription || s.heroText || '';
  let image = s.logo;
  let status = 200;
  const p = urlPath.replace(/\/+$/, '') || '/';

  const m = p.match(/^\/solutions\/([a-z0-9-]+)$/);
  if (m) {
    const o = await Offering.findOne({ slug: m[1], published: true }).lean();
    if (o) {
      title = o.seoTitle || `${o.title} in Sharjah, UAE | ${s.shortName || brand}`;
      description = o.seoDescription || o.summary;
      image = o.cover || image;
    } else {
      status = 404;
      title = `Page not found | ${brand}`;
    }
  } else if (STATIC_PAGES[p]) {
    if (STATIC_PAGES[p].title) title = `${STATIC_PAGES[p].title} | ${brand}`;
    if (STATIC_PAGES[p].description) description = STATIC_PAGES[p].description;
  } else if (!p.startsWith('/admin')) {
    status = 404;
    title = `Page not found | ${brand}`;
  }

  const url = siteUrl() + (p === '/' ? '/' : p);
  const img = image ? (image.startsWith('http') ? image : siteUrl() + image) : '';
  const ld = p === '/' ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: brand, url: siteUrl() + '/', logo: img, image: img,
    telephone: s.phone, email: s.email, foundingDate: s.foundedYear ? String(s.foundedYear) : undefined, description,
    address: s.address ? { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Sharjah', addressCountry: 'AE' } : undefined,
  }).replace(/</g, '\\u003c')}</script>` : '';

  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    p.startsWith('/admin') ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(brand)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    img && `<meta property="og:image" content="${esc(img)}">`,
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`,
    ld,
  ].filter(Boolean).join('');
  return { tags, status };
}

let shell = null;
export function renderShell(file, tags) {
  if (!shell || process.env.NODE_ENV !== 'production') shell = fs.readFileSync(file, 'utf8');
  return shell.replace(/<title>.*?<\/title>/s, '').replace('<!--seo-->', tags);
}

export async function sitemapXml() {
  const base = siteUrl();
  const offers = await Offering.find({ published: true }).select('slug updatedAt').lean();
  const urls = [
    ...Object.entries(STATIC_PAGES).map(([p, v]) => ({ loc: base + p, pr: v.priority })),
    ...offers.map((o) => ({ loc: `${base}/solutions/${o.slug}`, pr: '0.7', lastmod: o.updatedAt?.toISOString().slice(0, 10) })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.pr}</priority></url>`)
    .join('\n')}\n</urlset>`;
}
