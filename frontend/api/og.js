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

// `analysis` est un blob JSON stocké en text (titre/resume/impact_marches/...,
// cf. api.js côté client) : on n'en garde que le résumé, le reste de l'article
// vient des colonnes dédiées déjà sélectionnées plus bas.
function extractResume(analysisRaw) {
  if (!analysisRaw) return '';
  const trimmed = analysisRaw.trimStart();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.resume) return String(parsed.resume).trim();
    } catch { /* pas du JSON valide, on retombe sur le texte brut */ }
  }
  return analysisRaw.trim();
}

function formatDateFr(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const slug = searchParams.get('slug');
  if (!slug || !SUPABASE_KEY) {
    res.status(400).send('Missing slug');
    return;
  }

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/techwatch_articles?slug=eq.${encodeURIComponent(slug)}&select=article_id,title,analysis,impact_marches,opportunites,points_cles,sector,tickers,published_at,url&limit=1`,
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

  // Contenu texte réel pour les crawlers IA (GPTBot, ClaudeBot, PerplexityBot...)
  // qui n'exécutent pas JS : sans ça, ils ne voient que les meta tags ci-dessus
  // et un body vide, jamais l'article lui-même.
  const resume = escapeHtml(extractResume(article.analysis));
  const impactMarches = escapeHtml((article.impact_marches || '').trim());
  const opportunites = escapeHtml((article.opportunites || '').trim());
  const pointsCles = Array.isArray(article.points_cles) ? article.points_cles : [];
  const dateStr = formatDateFr(article.published_at);
  const meta = [dateStr, article.sector, article.tickers].filter(Boolean).map(escapeHtml).join(' · ');
  const sourceUrl = article.url ? escapeHtml(article.url) : '';

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
<body>
  <article>
    <h1>${title}</h1>
    ${meta ? `<p>${meta}</p>` : ''}
    ${resume ? `<p>${resume}</p>` : ''}
    ${pointsCles.length ? `<ul>${pointsCles.map(p => `<li>${escapeHtml(String(p))}</li>`).join('')}</ul>` : ''}
    ${impactMarches ? `<h2>Impact marchés</h2><p>${impactMarches}</p>` : ''}
    ${opportunites ? `<h2>Opportunités</h2><p>${opportunites}</p>` : ''}
    ${sourceUrl ? `<p><a href="${sourceUrl}">Source originale</a></p>` : ''}
  </article>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(html);
}
