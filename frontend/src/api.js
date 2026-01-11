import { validateFilters, sanitizeSearch } from './validation/filters';

const N8N_API_URL = 'https://primary-production-fa932.up.railway.app/webhook/api/articles';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'tech_watch_cache';

// Récupère le cache depuis localStorage
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Vérifie si le cache est encore valide
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

export async function fetchArticles(filters = {}, page = 1) {
  // ✅ VALIDATION AVANT TOUTE REQUÊTE
  const validationResult = validateFilters({ ...filters, page });

  if (!validationResult.isValid) {
    console.error('❌ Validation errors:', validationResult.errors);

    // Affiche les erreurs de façon lisible
    const errorMessages = validationResult.errors
      .map(e => `${e.field}: ${e.message}`)
      .join(', ');

    throw new Error(`Filtres invalides: ${errorMessages}`);
  }

  // ✅ Utilise les valeurs VALIDÉES (pas les filtres bruts)
  const validFilters = validationResult.value;

  // ✅ Sanitize la recherche (couche supplémentaire)
  if (validFilters.search) {
    validFilters.search = sanitizeSearch(validFilters.search);
  }

  try {
    // Essaye d'utiliser le cache
    const cachedData = getCache();

    if (cachedData) {
      return filterAndPaginate(cachedData, validFilters, validFilters.page);
    }

    // Sinon fetch
    console.log('🔄 Récupération des données depuis n8n...');
    const response = await fetch(N8N_API_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Stocke en cache
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
      article.secteur?.toLowerCase().includes(search)
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

export async function fetchStats() {
  try {
    const cachedData = getCache();
    
    if (cachedData) {
      return cachedData.stats || {};
    }
    
    const response = await fetch(N8N_API_URL);
    const data = await response.json();
    setCache(data);
    return data.stats || {};
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    return null;
  }
}
