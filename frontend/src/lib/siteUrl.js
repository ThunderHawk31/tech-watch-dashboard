// URL publique du site, utilisée pour og:url / canonical / og:image.
// Ne jamais dériver ces valeurs de window.location.origin : pendant le
// prérendu (scripts/prerender.js) l'origine est celle du serveur local.
export const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://techwatch.fr').replace(/\/+$/, '');
