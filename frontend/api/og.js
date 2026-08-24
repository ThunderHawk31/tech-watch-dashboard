const SUPABASE_URL = 'https://bdhggllidtuwtcygsupk.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const { URL } = require('url');

// techwatch_articles.sector holds: IA, Cybersécurité, Tech, Crypto, Finance,
// Énergie, Santé, Autre. og-image.js only has dedicated art for crypto/ia/
// semi-conducteurs (the last one has no matching sector value today), so
// everything else falls back to its generic sector-less design.
function mapSectorToImage(sector) {
  const s = (sector || '').toLowerCase();
  if (s === 'crypto') return 'crypto';
  if (s === 'ia') return 'ia';
  return 'default';
}

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const slug = searchParams.get('slug');
  if (!slug || !SUPABASE_KEY) {
    res.status(400).send('Missing slug');
    return;
  }

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/techwatch_articles?slug=eq.${encodeURIComponent(slug)}&select=article_id,title,impact_marches,opportunites,sector,tickers&limit=1`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  if (!r.ok) {
    res.status(502).send('Supabase error');
    return;
  }

  const [article] = await r.json();
  if (!article) {
    res.status(404).send('Article not found');
    return;
  }

  const title = escapeHtml(article.title || 'Tech Watch');
  let desc = String(article.impact_marches || article.opportunites || '').replace(/\s+/g, ' ').trim();
  if (desc.length > 155) desc = desc.slice(0, 155).replace(/\s+\S*$/, '') + '…';
  desc = escapeHtml(desc);
  const canonical = `https://techwatch.fr/article/${slug}`;

  const imageSector = mapSectorToImage(article.sector);
  const imageUrl = escapeHtml(
    `https://techwatch.fr/api/og-image?title=${encodeURIComponent(article.title || 'Tech Watch')}&sector=${imageSector}&tickers=${encodeURIComponent(article.tickers || '')}`
  );

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${title} — Tech Watch</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${imageUrl}" />
</head>
<body></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(html);
}
