const N8N_URL = process.env.N8N_CHAT_WEBHOOK_URL;
// Optionnel : "utilisateur:motdepasse" du Basic Auth activé sur le Chat Trigger
// n8n. Sans lui, quiconque connaît l'URL du webhook contourne ce rate limit.
const N8N_AUTH = process.env.N8N_CHAT_AUTH;

// Rate limiting en mémoire par IP. Réinitialisé quand l'instance serverless
// est recyclée — protection best-effort mais suffisante contre le scripting
// naïf qui drainerait les crédits Claude via le workflow n8n.
const RATE_LIMIT = 10;              // requêtes max par fenêtre
const RATE_WINDOW_MS = 60 * 1000;   // fenêtre d'1 minute
const MAX_MESSAGE_CHARS = 1000;
// Plafond global par instance : filet contre un attaquant qui varie les IP.
// Le vrai plafond doit être posé côté Vercel (WAF) et Anthropic (limite de dépense).
const GLOBAL_LIMIT = 200;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const SESSION_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

const hits = new Map();
let globalHits = { start: Date.now(), count: 0 };

function isGloballyLimited() {
  const now = Date.now();
  if (now - globalHits.start > GLOBAL_WINDOW_MS) globalHits = { start: now, count: 0 };
  globalHits.count += 1;
  return globalHits.count > GLOBAL_LIMIT;
}

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
  if (!N8N_URL) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip) || isGloballyLimited()) {
    return res.status(429).json({ error: 'Trop de requêtes, réessayez dans une minute.' });
  }

  const message = req.body?.chatInput ?? req.body?.message ?? '';
  if (typeof message !== 'string' || message.length === 0) {
    return res.status(400).json({ error: 'Message manquant' });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(413).json({ error: `Message trop long (max ${MAX_MESSAGE_CHARS} caractères)` });
  }

  // On ne transmet que les champs attendus : tout le reste du corps est ignoré.
  const rawSession = req.body?.sessionId;
  const sessionId = typeof rawSession === 'string' && SESSION_ID_RE.test(rawSession) ? rawSession : undefined;
  const headers = { 'Content-Type': 'application/json' };
  if (N8N_AUTH) headers.Authorization = `Basic ${Buffer.from(N8N_AUTH).toString('base64')}`;

  try {
    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ chatInput: message, sessionId }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[chat] n8n ${response.status}:`, text.slice(0, 300));
      return res.status(502).json({ error: 'Service de chat indisponible' });
    }

    const data = await response.json();

    // n8n chatTrigger peut retourner [{output}] ou {output}
    const output = Array.isArray(data) ? data[0]?.output : data?.output;
    res.status(200).json({ output: output ?? null });

  } catch (error) {
    console.error('[chat] fetch error:', error.message);
    res.status(500).json({ error: 'Erreur de connexion au service de chat' });
  }
}
