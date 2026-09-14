// frontend/api/sitemap.js
//
// Sitemap généré dynamiquement depuis Supabase, à la place du fichier
// statique public/sitemap.xml (supprimé — sinon le fichier statique prend
// le dessus sur cette fonction, cf. le rewrite /sitemap.xml -> /api/sitemap
// dans vercel.json). Même pattern que rss.js et og.js : toujours à jour,
// pas de désuétude.

const SUPABASE_URL = 'https://bdhggllidtuwtcygsupk.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (!SUPABASE_KEY) {
    res.status(500).send('Server configuration error');
    return;
  }

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/techwatch_articles?select=slug,published_at&slug=not.is.null&order=published_at.desc&limit=5000`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  if (!r.ok) {
    res.status(502).send('Supabase error');
    return;
  }

  const articles = await r.json();
  const today = isoDate(null);

  // Pages statiques publiques — mêmes routes que ROUTES dans
  // scripts/prerender.js (pages de contenu, pas les outils personnalisés
  // comme /favoris ou /watchlist).
  const staticUrls = [
    { loc: 'https://www.techwatch.fr/', lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: 'https://www.techwatch.fr/about', lastmod: today, changefreq: 'monthly', priority: '0.5' },
    { loc: 'https://www.techwatch.fr/tendances', lastmod: today, changefreq: 'daily', priority: '0.7' },
    { loc: 'https://www.techwatch.fr/stats', lastmod: today, changefreq: 'daily', priority: '0.6' },
    { loc: 'https://www.techwatch.fr/digest', lastmod: today, changefreq: 'daily', priority: '0.6' },
  ];

  const articleUrls = articles.map(a => ({
    loc: `https://www.techwatch.fr/article/${escapeXml(a.slug)}`,
    lastmod: isoDate(a.published_at),
    changefreq: 'never',
    priority: '0.6',
  }));

  const allUrls = [...staticUrls, ...articleUrls];

  const body = allUrls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
}
