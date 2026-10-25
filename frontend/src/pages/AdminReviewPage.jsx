import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Download, LogOut } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';
import { parseAnalysis, formatDate } from '../lib/appUtils';
import { exportNotesToCSV } from '../lib/exportUtils';
import { Button } from '../components/ui/button';

// Route volontairement non liée dans la nav. Flux de notation rapide :
// un article non noté à la fois, raccourcis clavier 1-5, passage automatique
// au suivant après chaque note.
const AdminReviewPage = () => {
  const { isAdmin, loading, signOut } = useAdmin();
  const [queue, setQueue] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [exporting, setExporting] = useState(false);
  const savingRef = useRef(false);

  const loadBatch = useCallback(async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.rpc('list_unrated_articles', { p_limit: 20 });
      if (error) {
        toast.error('Chargement impossible', { description: error.message });
        setQueue([]);
        return;
      }
      setQueue(data || []);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadBatch();
  }, [isAdmin, loadBatch]);

  const current = queue[0] || null;

  const rate = useCallback(async (note) => {
    if (!current || savingRef.current) return;
    savingRef.current = true;
    try {
      const { error } = await supabase.rpc('set_note_perso', {
        p_article_id: current.article_id,
        p_note: note,
      });
      if (error) {
        toast.error('Note non enregistrée', { description: error.message });
        return;
      }
      toast.success(`Noté ${note}/5`);
      setQueue(prev => {
        const next = prev.slice(1);
        if (next.length === 0) loadBatch();
        return next;
      });
    } finally {
      savingRef.current = false;
    }
  }, [current, loadBatch]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        rate(Number(e.key));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rate]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = [];
      let offset = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase.rpc('export_notes_dataset', {
          p_limit: pageSize, p_offset: offset,
        });
        if (error) {
          toast.error('Export impossible', { description: error.message });
          return;
        }
        all.push(...data);
        if (data.length < pageSize) break;
        offset += pageSize;
      }
      exportNotesToCSV(all);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Accès réservé.</p>
        <Link to="/admin-login" className="text-primary underline">Se connecter</Link>
      </div>
    );
  }

  const { resume, pointsCles } = current ? parseAnalysis(current.analysis) : {};
  const hasPoints = Array.isArray(pointsCles) && pointsCles.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Notation — {queue.length} en attente</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      {fetching && !current && <p className="text-muted-foreground">Chargement…</p>}

      {!fetching && !current && (
        <p className="text-muted-foreground">Tous les articles sont notés. 🎉</p>
      )}

      {current && (
        <div className="border border-border rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
            {current.source && <span>{current.source}</span>}
            {current.source && <span aria-hidden="true">·</span>}
            <span>{formatDate(current.published_at)}</span>
          </div>
          <h2 className="text-lg font-medium leading-tight">{current.title}</h2>
          {(hasPoints || resume) && (
            // key = article_id : le menu se referme à chaque nouvel article
            <details key={current.article_id} className="text-sm">
              <summary className="cursor-pointer text-muted-foreground select-none">
                Plus de contexte
              </summary>
              {hasPoints ? (
                <ul className="flex flex-col gap-1 mt-2">
                  {pointsCles.map((pt, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 leading-relaxed">{resume}</p>
              )}
            </details>
          )}

          <div className="flex gap-2 justify-center pt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => rate(n)}
                className="w-12 h-12 rounded-lg border border-input text-base font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground">Raccourci clavier : touches 1 à 5</p>
        </div>
      )}
    </div>
  );
};

export default AdminReviewPage;
