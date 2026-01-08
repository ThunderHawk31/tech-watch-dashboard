const N8N_API_URL = 'https://primary-production-fa932.up.railway.app/webhook/api/articles';
export async function fetchArticles(filters = {}, page = 1) {
  try {
    const response = await fetch(N8N_API_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Récupérer les articles
    let articles = data.articles || [];
    
    // Filtrer côté client
    if (filters.search) {
      const search = filters.search.toLowerCase();
      articles = articles.filter(article =>
        article.analyse?.toLowerCase().includes(search) ||
        article.secteur?.toLowerCase().includes(search) ||
        article.actions?.toLowerCase().includes(search)
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
    
  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
}

export async function fetchStats() {
  try {
    const response = await fetch(N8N_API_URL);
    const data = await response.json();
    return data.stats || {};
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    return null;
  }
}
