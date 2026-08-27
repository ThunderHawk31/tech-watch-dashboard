import { Helmet } from 'react-helmet-async';

const APP_NAME = 'Tech Watch';
export const BASE_URL = 'https://www.techwatch.fr'; // domaine de prod — doit matcher sitemap.js
const DEFAULT_DESC =
  "TechWatch agrège et analyse en temps réel l'actualité IA, Tech, Finance, Crypto et Cybersécurité grâce à l'intelligence artificielle — mis à jour deux fois par jour.";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`; // og-default.png n'existe pas dans /public

/**
 * useSEO — renvoie un élément <Helmet> prêt à l'emploi.
 *
 * @param {object} opts
 * @param {string}  opts.title        — titre de la page (sans le suffixe app)
 * @param {string}  [opts.description]
 * @param {string}  [opts.image]      — URL absolue d'une image OG
 * @param {string}  [opts.canonical]  — URL canonique absolue
 * @param {string}  [opts.type]       — "website" (défaut) | "article"
 */
export function useSEO({ title, description, image, canonical, type = 'website' }) {
  const fullTitle = title ? `${title} — ${APP_NAME}` : APP_NAME;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  // Ne jamais utiliser window.location.href ici : pendant le build de
  // prerender.js, Puppeteer visite le site sur un serveur local
  // (http://localhost:PORT), donc window.location.href pointerait vers
  // localhost dans le HTML statique généré. On ancre toujours sur le
  // domaine de prod et on n'emprunte que le chemin à window.location.
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const url = canonical || `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image"       content={img} />
      <meta property="og:url"         content={url} />
      <meta property="og:site_name"   content={APP_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={img} />

      {/* Canonical */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
