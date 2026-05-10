import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Activity, AlertTriangle, Clock } from "lucide-react";

const SUPABASE_BASE = 'https://bdhggllidtuwtcygsupk.supabase.co/rest/v1';
const KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function apiFetch(path) {
  const r = await fetch(`${SUPABASE_BASE}${path}`, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const FLUX_BADGE = {
  ok:    { cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", label: "ok" },
  dead:  { cls: "bg-red-500/20 text-red-400 border-red-500/30",             label: "dead" },
  empty: { cls: "bg-amber-500/20 text-amber-400 border-amber-500/30",       label: "empty" },
};

function fluxBadge(status) {
  return FLUX_BADGE[status] || { cls: "bg-muted text-muted-foreground border-border", label: status || "?" };
}

function fmtDate(ts, opts) {
  return new Date(ts).toLocaleString('fr-FR', opts);
}

export default function MonitoringPage() {
  const [latest,  setLatest]  = useState(null);
  const [history, setHistory] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/techwatch_health?select=*&order=checked_at.desc&limit=1'),
      apiFetch('/techwatch_health?select=*&order=checked_at.desc&limit=7'),
      apiFetch('/techwatch_skipped?select=*&order=skipped_at.desc&limit=10'),
    ])
      .then(([h1, h7, sk]) => {
        setLatest(h1[0] ?? null);
        setHistory([...h7].reverse());
        setSkipped(sk);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const chartData = history.map(row => ({
    date:     fmtDate(row.checked_at, { day: '2-digit', month: '2-digit' }),
    Articles: row.articles_24h ?? 0,
    Skippés:  row.skipped_24h  ?? 0,
  }));

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-40 bg-muted rounded-xl" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto px-4 py-8 flex items-center gap-2 text-red-400">
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <span>Erreur de chargement : {error}</span>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">

      {/* En-tête */}
      <div className="flex items-center gap-3 flex-wrap">
        <Activity className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Monitoring</h1>
        {latest?.checked_at && (
          <span className="text-sm text-muted-foreground ml-auto flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Dernière vérif. : {fmtDate(latest.checked_at, {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        )}
      </div>

      {/* Statut des flux RSS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statut des flux RSS</CardTitle>
        </CardHeader>
        <CardContent>
          {latest?.flux_status
            ? (
              <div className="flex flex-wrap gap-4">
                {Object.entries(latest.flux_status).map(([flux, status]) => {
                  const b = fluxBadge(status);
                  return (
                    <div key={flux} className="flex items-center gap-2">
                      <span className="text-sm font-medium">{flux}</span>
                      <Badge variant="outline" className={b.cls}>{b.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )
            : <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
          }
        </CardContent>
      </Card>

      {/* Graphique ingestion 7 jours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingestion — 7 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0
            ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="transparent" tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="transparent" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="Articles" fill="hsl(var(--primary))"   radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Skippés"  fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
            : <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
          }
        </CardContent>
      </Card>

      {/* Table articles skippés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Derniers articles skippés</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {skipped.length > 0
            ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-left">
                    <th className="pb-2 pr-4 font-medium whitespace-nowrap">Date</th>
                    <th className="pb-2 pr-4 font-medium">URL / Titre</th>
                    <th className="pb-2 pr-4 font-medium">Raison</th>
                    <th className="pb-2 font-medium">Sortie brute</th>
                  </tr>
                </thead>
                <tbody>
                  {skipped.map(row => (
                    <tr key={row.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                        {fmtDate(row.skipped_at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 pr-4 max-w-[200px]">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors truncate block"
                          title={row.url}
                        >
                          {row.original_title || row.url}
                        </a>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="text-xs">{row.reason || '—'}</Badge>
                      </td>
                      <td className="py-2 text-muted-foreground font-mono text-xs max-w-[260px] truncate" title={row.raw_output ?? ''}>
                        {row.raw_output
                          ? row.raw_output.substring(0, 80) + (row.raw_output.length > 80 ? '…' : '')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
            : <p className="text-sm text-muted-foreground">Aucun article skippé récemment</p>
          }
        </CardContent>
      </Card>

    </div>
  );
}
