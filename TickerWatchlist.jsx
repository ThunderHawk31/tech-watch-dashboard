import { useState, useEffect } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function supabase(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

export default function TickerWatchlist() {
  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tickerInput, setTickerInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await supabase('GET', 'ticker_watchlist?order=created_at.desc&select=*');
      setTickers(data);
    } catch (e) {
      showToast('Erreur de chargement', true);
    } finally {
      setLoading(false);
    }
  }

  async function addTicker() {
    const t = tickerInput.trim().toUpperCase();
    if (!t) return;
    setAdding(true);
    try {
      await supabase('POST', 'ticker_watchlist', {
        ticker: t,
        label: labelInput.trim() || t,
        active: true,
      });
      setTickerInput('');
      setLabelInput('');
      await load();
      showToast(`✓ ${t} ajouté`);
    } catch {
      showToast('Ticker déjà existant ou erreur', true);
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(id, current) {
    await supabase('PATCH', `ticker_watchlist?id=eq.${id}`, { active: !current });
    await load();
    showToast(current ? 'Désactivé' : 'Activé');
  }

  async function deleteTicker(id, ticker) {
    if (!window.confirm(`Supprimer ${ticker} ?`)) return;
    await supabase('DELETE', `ticker_watchlist?id=eq.${id}`);
    setTickers(prev => prev.filter(t => t.id !== id));
    showToast('✓ Supprimé');
  }

  function showToast(msg, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 2500);
  }

  const activeCount = tickers.filter(t => t.active).length;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Ticker Watchlist</h1>
          <span style={styles.tag}>Alertes</span>
        </div>
        <p style={styles.subtitle}>
          Les articles mentionnant ces tickers déclenchent une alerte Gmail, quelle que soit leur importance.
        </p>
      </div>

      {/* Add form */}
      <div style={styles.addForm}>
        <input
          style={styles.tickerInput}
          value={tickerInput}
          onChange={e => setTickerInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && addTicker()}
          placeholder="TICKER"
          maxLength={10}
        />
        <input
          style={styles.labelInput}
          value={labelInput}
          onChange={e => setLabelInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTicker()}
          placeholder="Nom complet (ex: ASML Holding)"
        />
        <button
          style={{ ...styles.btn, opacity: adding ? 0.5 : 1 }}
          onClick={addTicker}
          disabled={adding || !tickerInput.trim()}
        >
          + Ajouter
        </button>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        {[
          { val: tickers.length, lbl: 'Total', color: '#e8edf4' },
          { val: activeCount, lbl: 'Actifs', color: '#22c55e' },
          { val: tickers.length - activeCount, lbl: 'Inactifs', color: '#64748b' },
        ].map(s => (
          <div key={s.lbl} style={styles.stat}>
            <div style={{ ...styles.statVal, color: s.color }}>{s.val}</div>
            <div style={styles.statLbl}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={styles.empty}>Chargement…</div>
      ) : tickers.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          Aucun ticker surveillé
        </div>
      ) : (
        <>
          <div style={styles.sectionLabel}>{tickers.length} ticker{tickers.length > 1 ? 's' : ''}</div>
          <div style={styles.list}>
            {tickers.map(t => (
              <div key={t.id} style={{ ...styles.row, opacity: t.active ? 1 : 0.45 }}>
                <span style={styles.badge}>{t.ticker}</span>
                <span style={styles.rowLabel}>{t.label || t.ticker}</span>
                <span style={styles.rowDate}>
                  {new Date(t.created_at).toLocaleDateString('fr-FR')}
                </span>
                <button
                  style={{ ...styles.toggle, background: t.active ? '#22c55e' : '#1e2d42' }}
                  onClick={() => toggleActive(t.id, t.active)}
                  title={t.active ? 'Désactiver' : 'Activer'}
                >
                  <span style={{
                    ...styles.toggleDot,
                    transform: t.active ? 'translateX(16px)' : 'translateX(0)',
                  }} />
                </button>
                <button
                  style={styles.deleteBtn}
                  onClick={() => deleteTicker(t.id, t.ticker)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          borderLeftColor: toast.error ? '#ef4444' : '#22c55e',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '32px 24px',
    fontFamily: "'DM Sans', sans-serif",
    color: '#e8edf4',
  },
  header: { marginBottom: 28 },
  headerLeft: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.3px', color: '#e8edf4' },
  tag: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: '#D4A853',
    background: 'rgba(212,168,83,0.1)',
    border: '1px solid rgba(212,168,83,0.2)',
    padding: '2px 8px',
    borderRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: { fontSize: 13, color: '#64748b', lineHeight: 1.5 },
  addForm: { display: 'flex', gap: 10, marginBottom: 24 },
  tickerInput: {
    width: 100,
    background: '#0d1a2d',
    border: '1px solid #1e2d42',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#e8edf4',
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    outline: 'none',
  },
  labelInput: {
    flex: 1,
    background: '#0d1a2d',
    border: '1px solid #1e2d42',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#e8edf4',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    outline: 'none',
  },
  btn: {
    background: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: "'DM Sans', sans-serif",
  },
  stats: { display: 'flex', gap: 12, marginBottom: 20 },
  stat: {
    background: '#0d1a2d',
    border: '1px solid #1e2d42',
    borderRadius: 8,
    padding: '10px 16px',
  },
  statVal: { fontSize: 18, fontWeight: 500, fontFamily: "'DM Mono', monospace" },
  statLbl: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginTop: 2,
    fontFamily: "'DM Mono', monospace",
  },
  sectionLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    background: '#0d1a2d',
    border: '1px solid #1e2d42',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    fontWeight: 500,
    color: '#D4A853',
    background: 'rgba(212,168,83,0.08)',
    border: '1px solid rgba(212,168,83,0.15)',
    padding: '3px 10px',
    borderRadius: 5,
    minWidth: 64,
    textAlign: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14, color: '#e8edf4' },
  rowDate: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: '#64748b',
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  toggleDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    background: 'white',
    borderRadius: '50%',
    top: 3,
    left: 3,
    transition: 'transform 0.2s',
    display: 'block',
  },
  deleteBtn: {
    background: 'none',
    border: '1px solid transparent',
    color: '#64748b',
    cursor: 'pointer',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    padding: '48px 0',
    color: '#64748b',
    fontSize: 14,
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    background: '#111f33',
    border: '1px solid #1e2d42',
    borderLeft: '3px solid #22c55e',
    color: '#e8edf4',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
};
