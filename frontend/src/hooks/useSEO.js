import { Helmet } from 'react-helmet-async';

const APP_NAME = 'Tech Watch';
const BASE_URL = 'https://techwatch-dashboard.vercel.app'; // à ajuster si besoin
const DEFAULT_DESC =
  'Veille technologique automatisée par IA — actualités IA, Tech, Finance, Crypto analysées 2×/jour.';
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`;

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
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : BASE_URL);

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
