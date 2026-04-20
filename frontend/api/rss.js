const SUPABASE_URL = 'https://bdhggllidtuwtcygsupk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/techwatch_articles?select=title,published_at,url,analysis,sector&order=published_at.desc&limit=50`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  if (!r.ok) {
    res.status(502).send('Supabase error');
    return;
  }

  const articles = await r.json();

  const items = articles.map(a => {
    const title = (a.title || 'Sans titre').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const link = a.url || '';
    const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : '';
    const description = (a.analysis || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const category = a.sector || '';
    return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <category>${category}</category>
      <guid isPermaLink="true">${link}</guid>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Tech Watch Dashboard</title>
    <link>https://techwatch.fr</link>
    <description>Veille technologique automatisée par IA — analyses en temps réel</description>
    <language>fr</language>
    <atom:link href="https://techwatch.fr/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
  res.status(200).send(xml);
}
