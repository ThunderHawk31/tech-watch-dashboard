import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Info, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchArticles as fetchArticlesAPI, fetchArticleById } from "../api";
import { sectorConfig } from "../lib/config";
import { Button } from "../components/ui/button";
import ArticleCard from "../components/ArticleCard";
import ArticleModal from "../components/ArticleModal";
import FiltersBar from "../components/FiltersBar";
import StatsOverview from "../components/StatsOverview";
import ArticlesSkeleton from "../components/ArticlesSkeleton";

const HomePage = () => {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialSectors = () => {
    const cats = searchParams.get("categories");
    if (!cats) return [];
    const validSectors = Object.keys(sectorConfig);
    return cats.split(",").map(s => s.trim()).filter(s => validSectors.includes(s));
  };

  const [filters, setFilters] = useState({
    search: "",
    sectors: getInitialSectors(),
    sentiment: "Tous",
    minImportance: "0",
    sort: "recent",
    ticker: ""
  });

  const handleTickerClick = (ticker) => {
    setFilters(f => ({ ...f, ticker: f.ticker === ticker ? "" : ticker }));
    setPage(1);
  };

  const handleOpenModal = (article) => {
    setSelectedArticle(article);
    if (article?.id) setSearchParams({ article: article.id });
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
    const sectors = filters.sectors || [];
    if (sectors.length > 0) {
      setSearchParams({ categories: sectors.join(',') });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    const sectors = filters.sectors || [];
    if (sectors.length > 0) {
      setSearchParams(prev => { prev.set('categories', sectors.join(',')); return prev; });
    } else {
      setSearchParams(prev => { prev.delete('categories'); return prev; });
    }
  }, [filters.sectors]); // eslint-disable-line

  const [displayTotal, setDisplayTotal] = useState(112);

  useEffect(() => {
    if (totalCount > 0) setDisplayTotal(totalCount);
  }, [totalCount]);

  useEffect(() => {
    const articleId = searchParams.get('article');
    if (!articleId) return;
    fetchArticleById(articleId).then(a => {
      if (a) setSelectedArticle(a);
    });
  }, []); // eslint-disable-line

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await fetchArticlesAPI(filters, page);
      setArticles(data.articles);
      setTotalCount(data.total);
      setStats(data.stats);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error("Erreur lors du chargement des articles");
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchArticles();
  }, [filters.sectors, filters.sentiment, filters.minImportance, filters.sort, filters.search, filters.ticker]); // eslint-disable-line

  useEffect(() => {
    fetchArticles();
  }, [page]); // eslint-disable-line

  const totalPages = Math.ceil(totalCount / 15);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          Veille Technologique
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            IA & Tech
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Analyses automatiques par IA — Mis à jour 2×/jour
        </p>
        {articles.length > 0 && (() => {
          const last = new Date(articles[0].date);
          const diff = Math.floor((Date.now() - last.getTime()) / 60000);
          const label = diff < 60
            ? `mise à jour il y a ${diff} min`
            : diff < 1440
            ? `mise à jour il y a ${Math.floor(diff / 60)}h`
            : `mise à jour il y a ${Math.floor(diff / 1440)}j`;
          return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em',
                color: '#4ade80', background: 'rgba(74,222,128,0.1)',
                border: '0.5px solid rgba(74,222,128,0.3)',
                borderRadius: '99px', padding: '3px 11px'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
                EN DIRECT · {label}
              </span>
            </div>
          );
        })()}
      </div>

      <StatsOverview stats={stats} />
      <FiltersBar filters={filters} setFilters={setFilters} />
      <h2 className="sr-only">Liste des articles</h2>

      {loading ? (
        <ArticlesSkeleton totalArticles={displayTotal} />
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <Info className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucun article trouvé</h3>
          <p className="text-muted-foreground mb-4">Essayez de modifier vos filtres de recherche</p>
          <Button onClick={fetchArticles} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Recharger
          </Button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <div
                key={article.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
              >
                <ArticleCard
                  article={article}
                  onOpenModal={handleOpenModal}
                  onTickerClick={handleTickerClick}
                  activeTicker={filters.ticker}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Page précédente">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-4" aria-live="polite">Page {page} sur {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} aria-label="Page suivante">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <ArticleModal article={selectedArticle} open={!!selectedArticle} onClose={handleCloseModal} />
    </div>
  );
};

export default HomePage;
