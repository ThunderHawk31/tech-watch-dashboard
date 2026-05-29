const N8N_URL = 'https://thunderhawk.app.n8n.cloud/webhook/5e4c965c-6c3a-473e-aad0-119e47ec845c/chat';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
