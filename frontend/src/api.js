import { validateFilters, sanitizeSearch } from './validation/filters';

// ✅ Supabase REST API (remplace n8n/Google Sheets)
const SUPABASE_URL = 'https://bdhggllidtuwtcygsupk.supabase.co/rest/v1/techwatch_articles';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkaGdnbGxpZHR1d3RjeWdzdXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTg4MDUsImV4cCI6MjA4ODQ3NDgwNX0.ou14ziQMriVW3X9xKchH4wJ8YfKWWh_vQkXy6O3hgSI';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'tech_watch_cache';

// Récupère le cache depuis localStorage
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp < CACHE_DURATION) {
      console.log('✅ Cache valide (âge: ' + Math.round((now - timestamp) / 1000) + 's)');
      return data;
    } else {
      console.log('⏰ Cache expiré');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  } catch (e) {
    return null;
  }
}

// Stocke en cache
function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log('💾 Données mises en cache pour 5 minutes');
  } catch (e) {
    console.error('Erreur cache:', e);
  }
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
    actions: row.tickers || '',
    secteur: row.sector || 'Autre',
    tokens: row.tokens || 0
  };
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

// Fetch tous les articles depuis Supabase
async function fetchFromSupabase() {
  console.log('🔄 Récupération des données depuis Supabase...');
  
  const response = await fetch(
    `${SUPABASE_URL}?select=article_id,title,title_en,published_at,url,analysis,importance,sentiment,tickers,sector&order=published_at.desc`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const rows = await response.json();
  const articles = rows.map(mapArticle);
  const stats = computeStats(articles);

  return { articles, stats };
}

export async function fetchArticles(filters = {}, page = 1) {
  // Validation
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
    // Cache
    const cachedData = getCache();
    if (cachedData) {
      return filterAndPaginate(cachedData, validFilters, validFilters.page);
    }

    // Fetch depuis Supabase
    const data = await fetchFromSupabase();
    setCache(data);

    return filterAndPaginate(data, validFilters, validFilters.page);

  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
}

function filterAndPaginate(data, filters, page) {
  let articles = data.articles || [];
  
  // Convertir actions en tableau
  articles = articles.map(article => ({
    ...article,
    actions: typeof article.actions === 'string' 
      ? article.actions.split(',').map(a => a.trim()).filter(a => a)
      : (Array.isArray(article.actions) ? article.actions : [])
  }));
  
  // Filtrer
  if (filters.search) {
    const search = filters.search.toLowerCase();
    articles = articles.filter(article =>
      article.analyse?.toLowerCase().includes(search) ||
      article.secteur?.toLowerCase().includes(search) ||
      article.titre?.toLowerCase().includes(search)
    );
  }
  
  if (filters.sector && filters.sector !== "Tous") {
    articles = articles.filter(article => article.secteur === filters.sector);
  }
  
  if (filters.sentiment && filters.sentiment !== "Tous") {
    articles = articles.filter(article => article.sentiment === filters.sentiment);
  }
  
  if (filters.minImportance && filters.minImportance !== "0") {
    const minImp = parseInt(filters.minImportance);
    articles = articles.filter(article => article.importance >= minImp);
  }

  if (filters.ticker) {
    articles = articles.filter(article =>
      (article.actions || []).some(t => t.toUpperCase() === filters.ticker.toUpperCase())
    );
  }

  // Trier
  if (filters.sort === "recent") {
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (filters.sort === "importance") {
    articles.sort((a, b) => b.importance - a.importance);
  }
  
  // Pagination
  const limit = 15;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedArticles = articles.slice(startIndex, endIndex);
  
  return {
    articles: paginatedArticles,
    total: articles.length,
    stats: data.stats || {}
  };
}

export async function fetchSectorHeat() {
  try {
    const response = await fetch(
      'https://bdhggllidtuwtcygsupk.supabase.co/rest/v1/sector_heat?select=*',
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

export async function fetchStats() {
  try {
    const cachedData = getCache();
    
    if (cachedData) {
      return cachedData.stats || {};
    }
    
    const data = await fetchFromSupabase();
    setCache(data);
    return data.stats || {};
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    return null;
  }
}
