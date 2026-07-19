const N8N_URL = 'https://thunderwiz.app.n8n.cloud/webhook/5e4c965c-6c3a-473e-aad0-119e47ec845c/chat';

// Rate limiting en mémoire par IP. Réinitialisé quand l'instance serverless
// est recyclée — protection best-effort mais suffisante contre le scripting
// naïf qui drainerait les crédits Claude via le workflow n8n.
const RATE_LIMIT = 10;              // requêtes max par fenêtre
const RATE_WINDOW_MS = 60 * 1000;   // fenêtre d'1 minute
const MAX_MESSAGE_CHARS = 1000;

const hits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// Purge périodique pour éviter que la Map ne grossisse indéfiniment
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now - entry.start > RATE_WINDOW_MS) hits.delete(ip);
  }
}, RATE_WINDOW_MS).unref?.();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Trop de requêtes, réessayez dans une minute.' });
  }

  const message = req.body?.chatInput ?? req.body?.message ?? '';
  if (typeof message !== 'string' || message.length === 0) {
    return res.status(400).json({ error: 'Message manquant' });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(413).json({ error: `Message trop long (max ${MAX_MESSAGE_CHARS} caractères)` });
  }

  try {
    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[chat] n8n ${response.status}:`, text.slice(0, 300));
      return res.status(502).json({ error: `n8n returned ${response.status}` });
    }

    const data = await response.json();
    console.log('[chat] n8n raw response:', JSON.stringify(data));

    // n8n chatTrigger peut retourner [{output}] ou {output}
    const output = Array.isArray(data) ? data[0]?.output : data?.output;
    res.status(200).json({ output: output ?? null });

  } catch (error) {
    console.error('[chat] fetch error:', error.message);
    res.status(500).json({ error: 'Erreur de connexion au service de chat' });
  }
}
