import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExternalLink, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { sectorConfig } from '../lib/config';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_BASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const sectorColor = (sector) => sectorConfig[sector]?.color ?? '#64748b';

const IMPORTANCE_LABEL = { 5: 'Systémique', 4: 'Majeur', 3: 'Notable' };

async function fetchRecentDigests() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/daily_digest?select=*&order=date.desc&limit=7`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

function renderSummary(text) {
  if (!text) return null;
  const cleaned = text.replace(/^#+\s+.+(\n|$)/m, '').trim();
  return cleaned.split('\n\n').filter(Boolean).map((para, i) => {
    const parts = para.split(/\*\*(.+?)\*\*/g);
    return (
      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3 last:mb-0">
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className="text-foreground font-medium">{part}</strong>
            : part
        )}
      </p>
    );
  });
}

function DigestCard({ digest, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sectors = digest.sectors || {};
  const topArticles = digest.top_articles || [];
  const totalArticles = Object.values(sectors).reduce((a, b) => a + b, 0);
  const topSector = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0];
  const date = new Date(digest.date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const isToday = digest.date === new Date().toISOString().split('T')[0];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isToday && (
              <span className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-primary tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Aujourd'hui
              </span>
            )}
            <span className="font-semibold capitalize">{date}</span>
          </div>
          <div className="flex gap-5">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold font-mono">{totalArticles}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">articles</span>
            </div>
            {topSector && (
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold font-mono" style={{ color: sectorColor(topSector[0]) }}>
                  {topSector[0]}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">dominant</span>
              </div>
            )}
          </div>
        </div>

        {/* Sector bar */}
        {Object.keys(sectors).length > 0 && (
          <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 mb-3">
            {Object.entries(sectors).sort((a, b) => b[1] - a[1]).map(([sector, count]) => (
              <div
                key={sector}
                className="h-full rounded-sm"
                style={{
                  width: `${(count / totalArticles) * 100}%`,
                  background: sectorColor(sector),
                  minWidth: 4,
                }}
                title={`${sector} → ${count} article${count > 1 ? 's' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Sector legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(sectors).sort((a, b) => b[1] - a[1]).map(([sector, count]) => (
            <span key={sector} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sectorColor(sector) }} />
              <span className="text-xs text-muted-foreground">{sector}</span>
              <span className="text-xs text-muted-foreground/60 font-mono">{count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-5">
        {renderSummary(digest.summary)}
      </div>

      {/* Top articles */}
      {topArticles.length > 0 && (
        <div className="border-t border-border">
          <button
            className="flex items-center justify-between w-full px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            onClick={() => setExpanded(e => !e)}
          >
            <span>Top articles · {topArticles.length}</span>
            {expanded
              ? <ChevronUp className="w-4 h-4" />
              : <ChevronDown className="w-4 h-4" />
            }
          </button>

          {expanded && (
            <div className="px-5 pb-5 flex flex-col gap-2">
              {topArticles.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/40 border border-border/50 hover:border-border transition-colors no-underline group"
                >
                  <span className={`text-[10px] font-medium border rounded px-1.5 py-0.5 font-mono shrink-0 ${
                    a.importance >= 4
                      ? 'text-red-400 border-red-400/20 bg-red-400/5'
                      : a.importance === 3
                      ? 'text-amber-400 border-amber-400/20 bg-amber-400/5'
                      : 'text-muted-foreground border-border bg-muted'
                  }`}>
                    {IMPORTANCE_LABEL[a.importance] || `${a.importance}/5`}
                  </span>
                  <span className="flex-1 text-sm text-foreground/80 overflow-hidden text-ellipsis whitespace-nowrap group-hover:text-foreground transition-colors">
                    {a.titre || a.title}
                  </span>
                  <span className="text-xs font-mono shrink-0" style={{ color: sectorColor(a.secteur || a.sector) }}>
                    {a.secteur || a.sector}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DigestSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse opacity-50 space-y-3">
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-1.5 w-full bg-muted rounded-full" />
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-4/5 bg-muted rounded" />
      <div className="h-3 w-11/12 bg-muted rounded" />
    </div>
  );
}

export default function DigestPage() {
  const navigate = useNavigate();
  const [digests, setDigests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDigests().then(setDigests).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Helmet>
        <title>Digest quotidien — Tech Watch</title>
        <meta name="description" content="Résumé quotidien de la veille technologique et financière." />
      </Helmet>

      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <h1 className="text-3xl font-bold mb-2">Digest quotidien</h1>
        <p className="text-muted-foreground">Synthèse automatique par IA des articles du jour.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <DigestSkeleton />
          <DigestSkeleton />
        </div>
      ) : digests.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Aucun digest disponible pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {digests.map((d, i) => (
            <DigestCard key={d.date} digest={d} defaultExpanded={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
