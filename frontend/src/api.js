import { validateFilters, sanitizeSearch } from './validation/filters';

const SUPABASE_BASE     = process.env.REACT_APP_SUPABASE_BASE_URL;
const SUPABASE_URL      = `${SUPABASE_BASE}/rest/v1/techwatch_articles`;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const PAGE_SIZE = 15;
const ARTICLE_COLUMNS = 'article_id,title,title_en,published_at,url,analysis,importance,sentiment,tickers,sector,source,score_reason';

// Cache en mémoire pour les sources (valide toute la session)
let _sourcesCache = null;

export async function fetchSources() {
  if (_sourcesCache) return _sourcesCache;
  try {
    const res = await fetch(
      `${SUPABASE_BASE}/rest/v1/flux_sources?select=*&active=eq.true&order=type.asc,name.asc`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _sourcesCache = await res.json();
    return _sourcesCache;
  } catch {
    return [];
  }
}

// Cache en mémoire des stats globales (ne dépend pas des filtres/de la page,
// donc pas de raison de les refetcher à chaque clic pagination)
let _statsCache = null;
let _statsCacheTime = 0;
const STATS_CACHE_TTL = 5 * 60 * 1000;

export function invalidateCache() {
  _statsCache = null;
  _statsCacheTime = 0;
}

// Mapper les noms Supabase (anglais) → noms frontend (français)
function mapArticle(row) {
  return {
    id: row.article_id,
    titre: row.title || '',
    titre_en: row.title_en || '',
    date: row.published_at,
    url: row.url || '',
    analyse: row.analysis || '',
    importance: row.importance || 0,
    sentiment: row.sentiment || 'Neutre',
    actions: typeof row.tickers === 'string'
      ? row.tickers.split(',').map(a => a.trim()).filter(a => a)
      : [],
    secteur: row.sector || 'Autre',
    tokens: row.tokens || 0,
    source: row.source || '',
    scoreReason: row.score_reason || ''
  };
}

// Échappe une valeur pour un filtre PostgREST (protège virgules, parenthèses,
// points et guillemets qui ont un sens spécial dans la syntaxe de query PostgREST)
function pgQuote(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function orderParam(sort) {
  if (sort === 'importance') return 'importance.desc';
  if (sort === 'az') return 'title.asc';
  return 'published_at.desc';
}

// Traduit les filtres validés en query params PostgREST
function buildFilterParams(filters) {
  const params = new URLSearchParams();

  if (filters.search) {
    const term = pgQuote(`*${filters.search}*`);
    params.set('or', `(title.ilike.${term},sector.ilike.${term},analysis.ilike.${term})`);
  }

  const sectors = (filters.sectors && filters.sectors.length > 0)
    ? filters.sectors
    : (filters.sector && filters.sector !== 'Tous' ? [filters.sector] : []);
  if (sectors.length > 0) {
    params.set('sector', `in.(${sectors.map(pgQuote).join(',')})`);
  }

  if (filters.sentiment && filters.sentiment !== 'Tous') {
    params.set('sentiment', `eq.${filters.sentiment}`);
  }

  if (filters.minImportance && filters.minImportance !== '0') {
    params.set('importance', `gte.${filters.minImportance}`);
  }

  if (filters.ticker) {
    // tickers est stocké en texte "AAPL, MSFT" — on veut un token entier, pas une
    // sous-chaîne (ilike matcherait "AI" dans "WAIT"). imatch = ~* (regex insensible à la casse).
    const safe = String(filters.ticker).replace(/[^A-Za-z0-9.\-]/g, '').replace(/\./g, '\\.');
    if (safe) {
      params.set('tickers', `imatch.(^|,)\\s*${safe}\\s*(,|$)`);
    }
  }

  return params;
}

async function fetchPage(filters, page) {
  const params = buildFilterParams(filters);
  params.set('select', ARTICLE_COLUMNS);
  params.set('order', orderParam(filters.sort));
  const offset = (page - 1) * PAGE_SIZE;
  params.set('limit', String(PAGE_SIZE));
  params.set('offset', String(offset));

  const response = await fetch(`${SUPABASE_URL}?${params.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'count=exact'
    }
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const rows = await response.json();
  const contentRange = response.headers.get('content-range'); // format "0-14/615"
  const total = contentRange
    ? parseInt(contentRange.split('/')[1], 10) || 0
    : rows.length;

  return { articles: rows.map(mapArticle), total };
}

// Stats globales (toutes sections confondues, indépendant des filtres actifs) —
// colonnes légères sur tout le dataset, mises en cache 5 min en mémoire
async function fetchGlobalStats() {
  const now = Date.now();
  if (_statsCache && (now - _statsCacheTime) < STATS_CACHE_TTL) {
    return _statsCache;
  }

  const response = await fetch(
    `${SUPABASE_URL}?select=sector,sentiment,importance`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const rows = await response.json();

  const parSecteur = {};
  rows.forEach(r => { parSecteur[r.sector || 'Autre'] = (parSecteur[r.sector || 'Autre'] || 0) + 1; });

  const stats = {
    total: rows.length,
    parSecteur,
    sentimentPositif: rows.filter(r => r.sentiment === 'Positif').length,
    importanceMoyenne: rows.length > 0
      ? (rows.reduce((s, r) => s + (r.importance || 0), 0) / rows.length).toFixed(2)
      : '0'
  };

  _statsCache = stats;
  _statsCacheTime = now;
  return stats;
}

export async function fetchArticles(filters = {}, page = 1) {
  const validationResult = validateFilters({ ...filters, page });

  if (!validationResult.isValid) {
    console.error('❌ Validation errors:', validationResult.errors);
    const errorMessages = validationResult.errors
      .map(e => `${e.field}: ${e.message}`)
      .join(', ');
    throw new Error(`Filtres invalides: ${errorMessages}`);
  }

  const validFilters = validationResult.value;

  if (validFilters.search) {
    validFilters.search = sanitizeSearch(validFilters.search);
  }

  try {
    const [pageData, stats] = await Promise.all([
      fetchPage(validFilters, validFilters.page),
      fetchGlobalStats()
    ]);

    return {
      articles: pageData.articles,
      total: pageData.total,
      stats
    };
  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
}

export async function fetchSectorHeat() {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_SUPABASE_BASE_URL}/rest/v1/sector_heat?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('❌ Erreur sector_heat:', error);
    return [];
  }
}

export async function fetchArticleById(id) {
  if (!id || typeof id !== 'string') return null;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const INT_RE = /^\d{1,20}$/;
  if (!UUID_RE.test(id) && !INT_RE.test(id)) return null;

  try {
    const response = await fetch(
      `${SUPABASE_URL}?article_id=eq.${encodeURIComponent(id)}&select=${ARTICLE_COLUMNS}&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    if (!rows.length) return null;
    return mapArticle(rows[0]);
  } catch (error) {
    console.error('fetchArticleById error:', error);
    return null;
  }
}

export async function fetchArticleBySlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  try {
    const response = await fetch(
      `${SUPABASE_URL}?slug=eq.${encodeURIComponent(slug)}&select=${ARTICLE_COLUMNS}&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    if (!rows.length) return null;
    return mapArticle(rows[0]);
  } catch (error) {
    console.error('fetchArticleBySlug error:', error);
    return null;
  }
}

export async function fetchStats() {
  try {
    return await fetchGlobalStats();
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    return null;
  }
}

// Fetch complet non paginé, réservé à l'export CSV/JSON (StatsPage) — volontairement
// pas appelé ailleurs pour ne pas retomber sur un fetch de toute la table par défaut
export async function fetchAllArticlesForExport() {
  const response = await fetch(
    `${SUPABASE_URL}?select=${ARTICLE_COLUMNS}&order=published_at.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'count=exact'
      }
    }
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const rows = await response.json();
  const contentRange = response.headers.get('content-range');
  const total = contentRange
    ? parseInt(contentRange.split('/')[1], 10) || rows.length
    : rows.length;

  if (total > rows.length) {
    // db-max-rows côté PostgREST (ou une future volumétrie) peut tronquer sans erreur
    console.warn(`⚠️ Export tronqué : ${rows.length}/${total} articles récupérés`);
  }

  return { articles: rows.map(mapArticle), total };
}
