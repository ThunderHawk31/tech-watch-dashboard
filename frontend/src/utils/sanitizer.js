// ============================================================
// XSS PROTECTION UTILITY - SANITIZATION COMPLÈTE
// ============================================================
// 🔐 SÉCURITÉ #7 : Protection XSS sur TOUS les affichages
// ============================================================

import DOMPurify from 'dompurify';

// ============================================================
// CONFIGURATION DOMPURIFY
// ============================================================

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'blockquote', 'code', 'pre', 'span'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],  // tableau plat requis par DOMPurify
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'form'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i
};

// ============================================================
// SANITIZATION FUNCTIONS
// ============================================================

/**
 * 🔐 Sanitize HTML complet (pour dangerouslySetInnerHTML)
 * Utilise DOMPurify avec config stricte
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

/**
 * 🔐 Sanitize texte simple (enlève TOUT le HTML)
 * Pour affichage dans {}, sans dangerouslySetInnerHTML
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Enlever complètement le HTML
  const stripped = text.replace(/<[^>]*>/g, '');
  
  // Enlever les caractères spéciaux dangereux
  return stripped
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

/**
 * 🔐 Sanitize URL (protection contre javascript:, data:, etc.)
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return '#';
  }
  
  // Autoriser uniquement HTTP(S) et mailto
  const urlLower = url.toLowerCase().trim();
  
  if (urlLower.startsWith('http://') || 
      urlLower.startsWith('https://') || 
      urlLower.startsWith('mailto:')) {
    return url;
  }
  
  // Bloquer javascript:, data:, vbscript:, etc.
  console.warn('🔐 URL bloquée (protocole dangereux):', url);
  return '#';
}

/**
 * 🔐 Sanitize attribut (pour className, id, etc.)
 */
export function sanitizeAttribute(attr) {
  if (!attr || typeof attr !== 'string') {
    return '';
  }
  
  // Autoriser uniquement alphanumeric + tirets + underscores + espaces
  return attr.replace(/[^a-zA-Z0-9\-_ ]/g, '');
}

/**
 * 🔐 Sanitize JSON stringify (éviter injection via JSON)
 */
export function sanitizeJSON(obj) {
  try {
    // Stringify puis parse pour enlever fonctions, undefined, etc.
    const jsonStr = JSON.stringify(obj, (key, value) => {
      // Bloquer fonctions
      if (typeof value === 'function') {
        return undefined;
      }
      // Sanitize strings
      if (typeof value === 'string') {
        return sanitizeText(value);
      }
      return value;
    });
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('❌ Erreur sanitization JSON:', error);
    return {};
  }
}

/**
 * 🔐 Sanitize article object complet
 */
export function sanitizeArticle(article) {
  if (!article || typeof article !== 'object') {
    return null;
  }

  return {
    // IDs et métadata (pas de sanitization)
    id: article.id,
    date: article.date,
    importance: article.importance,
    
    // Textes affichés (sanitization stricte)
    titre: sanitizeText(article.titre || ''),
    secteur: sanitizeText(article.secteur || ''),
    sentiment: sanitizeText(article.sentiment || ''),
    
    // HTML riche (sanitization DOMPurify)
    analyse: sanitizeHTML(article.analyse || ''),
    
    // URL (validation protocole)
    url: sanitizeURL(article.url || ''),
    
    // Arrays
    actions: Array.isArray(article.actions) 
      ? article.actions.map(action => sanitizeText(action))
      : []
  };
}

/**
 * 🔐 Sanitize array d'articles
 */
export function sanitizeArticles(articles) {
  if (!Array.isArray(articles)) {
    return [];
  }
  return articles.map(sanitizeArticle).filter(Boolean);
}

// ============================================================
// REACT HOOKS - SANITIZATION AUTOMATIQUE
// ============================================================

/**
 * Hook pour sanitizer automatiquement un texte
 * Usage: const cleanText = useSanitizedText(dirtyText);
 */
export function useSanitizedText(text) {
  return sanitizeText(text);
}

/**
 * Hook pour sanitizer automatiquement du HTML
 * Usage: const cleanHTML = useSanitizedHTML(dirtyHTML);
 */
export function useSanitizedHTML(html) {
  return sanitizeHTML(html);
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Vérifier si string contient du HTML suspect
 */
export function containsSuspiciousHTML(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,  // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(text));
}

/**
 * Logger une tentative XSS détectée
 */
export function logXSSAttempt(source, content) {
  console.warn('🔐 TENTATIVE XSS DÉTECTÉE:', {
    source,
    content: content.substring(0, 100) + '...',
    timestamp: new Date().toISOString()
  });
  
  // TODO: En production, envoyer à un service de logging
  // fetch('/api/security/log-xss', { 
  //   method: 'POST', 
  //   body: JSON.stringify({ source, content }) 
  // });
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeURL,
  sanitizeAttribute,
  sanitizeJSON,
  sanitizeArticle,
  sanitizeArticles,
  containsSuspiciousHTML,
  logXSSAttempt,
  useSanitizedText,
  useSanitizedHTML
};
