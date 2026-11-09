import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Search, ChevronDown, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatDate, parseAnalysis } from '../lib/appUtils';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

const PAGE_SIZE = 30;

// Portfolio BTS : uniquement IA/Tech/Cybersécurité, jamais Finance/Crypto.
const PORTFOLIO_SECTORS = ['IA', 'Tech', 'Cybersécurité'];

// Onglet "Portfolio" de /admin-review : contrairement à la notation (file qui
// se vide), c'est une liste cherchable et persistante — on doit pouvoir
// revenir sur un article déjà publié pour changer sa phrase perso.
const AdminPortfolioPanel = () => {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const savingRef = useRef({});

  const load = useCallback(async (term) => {
    setLoading(true);
    try {
      let query = supabase
        .from('techwatch_articles')
        .select('article_id,title,sector,published_at,interessant,portfolio_publie,portfolio_note,analysis,url,source')
        .in('sector', PORTFOLIO_SECTORS)
        .order('published_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (term) query = query.ilike('title', `%${term}%`);
      const { data, error } = await query;
      if (error) {
        toast.error('Chargement impossible', { description: error.message });
        return;
      }
      setArticles(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const updateFlag = async (articleId, patch) => {
    if (savingRef.current[articleId]) return;
    savingRef.current[articleId] = true;
    setArticles(prev => prev.map(a => (a.article_id === articleId ? { ...a, ...patch } : a)));
    try {
      const { error } = await supabase.rpc('set_portfolio_flag', {
        p_article_id: articleId,
        p_interessant: patch.interessant ?? null,
        p_publie: patch.portfolio_publie ?? null,
        p_note: patch.portfolio_note ?? null,
      });
      if (error) {
        toast.error('Non enregistré', { description: error.message });
      } else {
        toast.success('Enregistré', { duration: 1500 });
      }
    } finally {
      savingRef.current[articleId] = false;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un article par titre..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className="text-muted-foreground">Chargement…</p>}
      {!loading && articles.length === 0 && <p className="text-muted-foreground">Aucun article.</p>}

      <div className="flex flex-col gap-3">
        {articles.map((a) => {
          const { resume, pointsCles } = parseAnalysis(a.analysis);
          const hasPoints = Array.isArray(pointsCles) && pointsCles.length > 0;
          const hasDetails = !!resume || hasPoints || !!a.url;

          return (
          <div key={a.article_id} className="border border-border rounded-xl p-4 flex flex-col gap-3">
            <div>
              <p className="font-medium text-sm leading-tight">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.sector} · {formatDate(a.published_at)}</p>
            </div>

            {hasDetails && (
              <details className="group text-sm">
                <summary className="cursor-pointer select-none list-none flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                  Voir le résumé
                </summary>
                <div className="mt-2 flex flex-col gap-2 pl-5">
                  {resume && <p className="leading-relaxed">{resume}</p>}
                  {hasPoints && (
                    <ul className="flex flex-col gap-1">
                      {pointsCles.map((pt, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  )}
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs w-fit"
                    >
                      Lire l'article source <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </details>
            )}

            <div className="flex items-center gap-6 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`interessant-${a.article_id}`}
                  checked={!!a.interessant}
                  onCheckedChange={(checked) => updateFlag(a.article_id, { interessant: checked === true })}
                />
                <Label htmlFor={`interessant-${a.article_id}`} className="cursor-pointer font-normal">
                  Intéressant
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`publie-${a.article_id}`}
                  checked={!!a.portfolio_publie}
                  onCheckedChange={(checked) => updateFlag(a.article_id, { portfolio_publie: checked === true })}
                />
                <Label htmlFor={`publie-${a.article_id}`} className="cursor-pointer font-normal">
                  Publier sur le portfolio
                </Label>
              </div>
            </div>

            {a.portfolio_publie && (
              <Input
                placeholder="Ta phrase perso pour le portfolio..."
                defaultValue={a.portfolio_note || ''}
                onBlur={(e) => {
                  if (e.target.value !== (a.portfolio_note || '')) {
                    updateFlag(a.article_id, { portfolio_note: e.target.value });
                  }
                }}
              />
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPortfolioPanel;
