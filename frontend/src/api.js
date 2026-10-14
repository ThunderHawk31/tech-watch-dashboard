import { validateFilters, sanitizeSearch } from './validation/filters';

const SUPABASE_BASE     = process.env.REACT_APP_SUPABASE_BASE_URL;
const SUPABASE_URL      = `${SUPABASE_BASE}/rest/v1/techwatch_articles`;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const ARTICLE_COLUMNS = 'article_id,slug,title,title_en,published_at,url,analysis,importance,sentiment,tickers,sector,source,score_reason';
const PAGE_SIZE = 15;

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra
  };
}

// Cache en mémoire pour les sources (valide toute la session)
let _sourcesCache = null;

export async function fetchSources() {
  if (_sourcesCache) return _sourcesCache;
  try {
    const res = await fetch(
      `${SUPABASE_BASE}/rest/v1/flux_sources?select=*&active=eq.true&order=type.asc,name.asc`,
      { headers: supabaseHeaders() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _sourcesCache = await res.json();
    return _sourcesCache;
  } catch {
    return [];
  }
}

// Mapper les noms Supabase (anglais) → noms frontend (français)
function mapArticle(row) {
  return {
    id: row.article_id,
    slug: row.slug || '',
    titre: row.title || '',
    titre_en: row.title_en || '',
    date: row.published_at,
    url: row.url || '',
    analyse: row.analysis || '',
    importance: row.importance || 0,
    sentiment: row.sentiment || 'Neutre',
    actions: typeof row.tickers === 'string'
      ? row.tickers.split(',').map(a => a.trim()).filter(Boolean)
      : (Array.isArray(row.tickers) ? row.tickers : []),
    secteur: row.sector || 'Autre',
    tokens: row.tokens || 0,
    source: row.source || '',
    scoreReason: row.score_reason || ''
  };
}

// Traduit les filtres validés en opérateurs PostgREST (ilike/in/eq/gte),
// partagé entre fetchArticles (paginé) et fetchAllArticles (export complet).
function buildFilterParams(filters) {
  const params = new URLSearchParams();

  if (filters.sectors && filters.sectors.length > 0) {
    params.set('sector', `in.(${filters.sectors.join(',')})`);
  } else if (filters.sector && filters.sector !== 'Tous') {
    params.set('sector', `eq.${filters.sector}`);
  }

  if (filters.sentiment && filters.sentiment !== 'Tous') {
    params.set('sentiment', `eq.${filters.sentiment}`);
  }

  const minImp = Number(filters.minImportance) || 0;
  if (minImp > 0) {
    params.set('importance', `gte.${minImp}`);
  }

  if (filters.ticker) {
    params.set('tickers', `ilike.*${filters.ticker}*`);
  }

  if (filters.search) {
    // Les parenthèses/virgules cassent la syntaxe or=(...) de PostgREST et
    // '*' est le joker ilike — on les retire du terme plutôt que de les
    // échapper, une recherche reste utile sans ces caractères.
    const term = filters.search.replace(/[,()*]/g, ' ').trim();
    if (term) {
      params.set('or', `(title.ilike.*${term}*,analysis.ilike.*${term}*,sector.ilike.*${term}*)`);
    }
  }

  const order = filters.sort === 'importance' ? 'importance.desc'
    : filters.sort === 'az' ? 'title.asc'
    : 'published_at.desc';
  params.set('order', order);

  return params;
}

function parseTotalFromContentRange(contentRange) {
  // Supabase renvoie "0-14/810" (ou "*/0" si vide)
  if (!contentRange) return null;
  const total = contentRange.split('/')[1];
  return total === '*' ? null : parseInt(total, 10);
}

// Pagination côté serveur : Supabase ne renvoie que la page demandée,
// filtrée/triée/comptée par PostgREST — plus de téléchargement du dataset
// entier dans le navigateur.
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

  const params = buildFilterParams(validFilters);
  params.set('select', ARTICLE_COLUMNS);
  params.set('limit', String(PAGE_SIZE));
  params.set('offset', String((validFilters.page - 1) * PAGE_SIZE));

  try {
    const response = await fetch(`${SUPABASE_URL}?${params.toString()}`, {
      headers: supabaseHeaders({ Prefer: 'count=exact' })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rows = await response.json();
    const total = parseTotalFromContentRange(response.headers.get('content-range'));

    return { articles: rows.map(mapArticle), total: total ?? rows.length };
  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
}

// Calculer les stats à partir des articles
function computeStats(articles) {
  const total = articles.length;

  // Comptage par secteur
  const parSecteur = {};
  articles.forEach(a => {
    const s = a.secteur || 'Autre';
    parSecteur[s] = (parSecteur[s] || 0) + 1;
  });

  // Nombre de sentiments positifs
  const sentimentPositif = articles.filter(a => a.sentiment === 'Positif').length;

  // Importance moyenne
  const importanceMoyenne = total > 0
    ? (articles.reduce((sum, a) => sum + (a.importance || 0), 0) / total).toFixed(2)
    : '0';

  return { total, parSecteur, sentimentPositif, importanceMoyenne };
}

// Agrégats globaux (toujours sur l'ensemble des articles, indépendamment des
// filtres/pagination affichés) : colonnes minimales pour rester léger même
// avec beaucoup d'articles. Comme fetchAllArticles, plafonné au max_rows
// Supabase (1000 lignes par défaut) — au-delà il faudra une vue/fonction
// Postgres dédiée plutôt que de tout rapatrier côté client.
export async function fetchStats() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}?select=sector,sentiment,importance`,
      { headers: supabaseHeaders() }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    return computeStats(rows.map(r => ({
      secteur: r.sector || 'Autre',
      sentiment: r.sentiment || 'Neutre',
      importance: r.importance || 0
    })));
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    return null;
  }
}

// Date du tout dernier article ingéré, tous secteurs/filtres confondus —
// pour le badge "EN DIRECT". Une seule colonne, une seule ligne : ne pas
// réutiliser articles[0].date d'une page paginée/filtrée, qui ne reflète
// que ce qui est affiché à l'écran, pas l'état réel du pipeline.
export async function fetchLatestArticleDate() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}?select=published_at&order=published_at.desc&limit=1`,
      { headers: supabaseHeaders() }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    return rows[0]?.published_at || null;
  } catch (error) {
    console.error('❌ Erreur dernière date:', error);
    return null;
  }
}

// Tous les articles correspondant aux filtres, sans pagination — réservé à
// l'export CSV/JSON (StatsPage), appelé à la demande au clic plutôt qu'au
// chargement de la page. Même plafond Supabase 1000 lignes que fetchStats().
export async function fetchAllArticles(filters = {}) {
  const validationResult = validateFilters(filters);
  if (!validationResult.isValid) {
    throw new Error('Filtres invalides');
  }

  const validFilters = validationResult.value;
  if (validFilters.search) {
    validFilters.search = sanitizeSearch(validFilters.search);
  }

  const params = buildFilterParams(validFilters);
  params.set('select', ARTICLE_COLUMNS);

  const response = await fetch(`${SUPABASE_URL}?${params.toString()}`, {
    headers: supabaseHeaders()
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const rows = await response.json();
  return rows.map(mapArticle);
}

export async function fetchSectorHeat() {
  try {
    const response = await fetch(
      `${SUPABASE_BASE}/rest/v1/sector_heat?select=*`,
      { headers: supabaseHeaders() }
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
      { headers: supabaseHeaders() }
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
      { headers: supabaseHeaders() }
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
