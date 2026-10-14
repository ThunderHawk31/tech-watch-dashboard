import { fetchArticles, fetchAllArticles, fetchStats } from '../api';

// On mocke fetch pour inspecter l'URL PostgREST réellement construite,
// sans dépendre d'un vrai Supabase. C'est le point qui a cassé l'export
// CSV/JSON : fetchAllArticles réutilisait fetchArticles(filters, 1), qui
// envoie toujours limit=15 — ces tests verrouillent que chaque fonction
// envoie (ou n'envoie pas) limit/offset comme elle le doit.
function mockFetchOnce({ body = [], contentRange = null, ok = true } = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    headers: { get: (name) => (name.toLowerCase() === 'content-range' ? contentRange : null) },
    json: async () => body
  });
}

function calledUrl() {
  return new URL(global.fetch.mock.calls[0][0]);
}

describe('fetchArticles (pagination serveur)', () => {
  it('envoie limit et offset calculés depuis la page demandée', async () => {
    mockFetchOnce({ body: [], contentRange: '0-14/42' });
    await fetchArticles({}, 3);

    const url = calledUrl();
    expect(url.searchParams.get('limit')).toBe('15');
    expect(url.searchParams.get('offset')).toBe('30'); // (page 3 - 1) * 15
  });

  it('lit le total depuis l\'en-tête Content-Range plutôt que la longueur de la page reçue', async () => {
    mockFetchOnce({ body: Array(15).fill({}), contentRange: '0-14/810' });
    const { total, articles } = await fetchArticles({}, 1);

    expect(total).toBe(810);
    expect(articles).toHaveLength(15);
  });

  it('traduit le filtre secteur multiple en sector=in.(...)', async () => {
    mockFetchOnce({ body: [], contentRange: '0-0/0' });
    await fetchArticles({ sectors: ['IA', 'Finance'] }, 1);

    const url = calledUrl();
    expect(url.searchParams.get('sector')).toBe('in.(IA,Finance)');
  });

  it('traduit le filtre ticker en tickers=ilike.*...* (il était silencieusement perdu avant la validation Joi)', async () => {
    mockFetchOnce({ body: [], contentRange: '0-0/0' });
    await fetchArticles({ ticker: 'AAPL' }, 1);

    const url = calledUrl();
    expect(url.searchParams.get('tickers')).toBe('ilike.*AAPL*');
  });

  it('envoie Prefer: count=exact', async () => {
    mockFetchOnce({ body: [], contentRange: '0-0/0' });
    await fetchArticles({}, 1);

    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers.Prefer).toBe('count=exact');
  });
});

describe('fetchAllArticles (export CSV/JSON)', () => {
  it('n\'envoie ni limit ni offset — régression du bug "export limité à 15 articles"', async () => {
    mockFetchOnce({ body: [] });
    await fetchAllArticles();

    const url = calledUrl();
    expect(url.searchParams.has('limit')).toBe(false);
    expect(url.searchParams.has('offset')).toBe(false);
  });

  it('retourne tous les articles renvoyés par Supabase, pas une page', async () => {
    const rows = Array.from({ length: 42 }, (_, i) => ({
      article_id: String(i), title: `A${i}`, sector: 'IA', sentiment: 'Positif',
      importance: 1, published_at: '2026-10-14T00:00:00Z', url: 'https://x', tickers: ''
    }));
    mockFetchOnce({ body: rows });

    const articles = await fetchAllArticles();
    expect(articles).toHaveLength(42);
  });
});

describe('fetchStats (agrégats globaux)', () => {
  it('ne demande que les colonnes nécessaires au calcul, sans limit', async () => {
    mockFetchOnce({ body: [] });
    await fetchStats();

    const url = calledUrl();
    expect(url.searchParams.get('select')).toBe('sector,sentiment,importance');
    expect(url.searchParams.has('limit')).toBe(false);
  });

  it('calcule total / parSecteur / sentimentPositif / importanceMoyenne', async () => {
    mockFetchOnce({
      body: [
        { sector: 'IA', sentiment: 'Positif', importance: 4 },
        { sector: 'IA', sentiment: 'Négatif', importance: 2 },
        { sector: 'Finance', sentiment: 'Positif', importance: 3 }
      ]
    });

    const stats = await fetchStats();
    expect(stats.total).toBe(3);
    expect(stats.parSecteur).toEqual({ IA: 2, Finance: 1 });
    expect(stats.sentimentPositif).toBe(2);
    expect(stats.importanceMoyenne).toBe('3.00');
  });
});
