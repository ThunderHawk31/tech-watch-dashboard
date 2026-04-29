const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export async function fetchArticles(filters = {}, page = 1) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}?select=*&order=published_at.desc`,
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
    
    // Mapper Supabase → format frontend
    let articles = rows.map(row => ({
      id: row.article_id,
      titre: row.title || '',
      titre_en: row.title_en || '',
      date: row.published_at || new Date().toISOString(),
      url: row.url || '',
      analyse: row.analysis || '',
      importance: row.importance || 0,
      sentiment: row.sentiment || 'Neutre',
      actions: typeof row.tickers === 'string'
        ? row.tickers.split(',').map(a => a.trim()).filter(a => a && a !== 'AUCUN')
        : [],
      secteur: row.sector || 'Autre',
      tokens: row.tokens || 0
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
    
    // Trier
    if (filters.sort === "recent") {
      articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (filters.sort === "importance") {
      articles.sort((a, b) => b.importance - a.importance);
    }
    
    // Stats
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
    
    // Pagination
    const limit = 15;
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);
    
    return {
      articles: paginatedArticles,
      total: articles.length,
      stats
    };
    
  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
}

export async function fetchStats() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}?select=*&order=published_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const rows = await response.json();
    
    const parSecteur = {};
    rows.forEach(r => { parSecteur[r.sector || 'Autre'] = (parSecteur[r.sector || 'Autre'] || 0) + 1; });
    
    return {
      total: rows.length,
      parSecteur,
      sentimentPositif: rows.filter(r => r.sentiment === 'Positif').length,
      importanceMoyenne: rows.length > 0
        ? (rows.reduce((s, r) => s + (r.importance || 0), 0) / rows.length).toFixed(2)
        : '0'
    };
  } catch (error) {
    console.error('❌ Erreur stats:', error);
    return null;
  }
}
