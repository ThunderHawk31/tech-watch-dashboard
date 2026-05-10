// Utilitaires pour le partage d'articles

/**
 * Extrait le titre d'une analyse
 */
export const extractTitle = (analyse) => {
  if (!analyse) return 'Article Tech Watch';

  if (analyse.trimStart().startsWith('{')) {
    try {
      const j = JSON.parse(analyse);
      const text = (j.resume || '').split('\n')[0].trim();
      if (text) return text.length > 80 ? text.substring(0, 77) + '...' : text;
    } catch { /* fall through */ }
  }

  // Chercher le titre dans le markdown (# Titre)
  const titleMatch = analyse.match(/#{1,3}\s*(.+)/);
  if (titleMatch) {
    return titleMatch[1].trim().replace(/[#*`📰🏷️📊🔑💼⚡📈💹]/g, '');
  }
  
  // Sinon, prendre la première ligne non vide
  const lines = analyse.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/[#*`📰🏷️📊🔑💼⚡📈💹]/g, '').trim();
    return firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
  }
  
  return 'Article Tech Watch';
};

/**
 * Génère un résumé court pour le partage
 */
export const generateSummary = (analyse, maxLength = 200) => {
  if (!analyse) return '';

  if (analyse.trimStart().startsWith('{')) {
    try {
      const j = JSON.parse(analyse);
      const text = (j.resume || '').trim();
      return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
    } catch { /* fall through */ }
  }

  // Nettoyer le markdown et les emojis
  const cleaned = analyse
    .replace(/[#*`📰🏷️📊🔑💼⚡📈💹]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength - 3) + '...';
};

/**
 * Génère les hashtags basés sur le secteur et les actions
 */
export const generateHashtags = (secteur, actions) => {
  const hashtags = ['#TechWatch'];
  
  // Hashtag secteur
  if (secteur) {
    const sectorMap = {
      'IA': '#AI #ArtificialIntelligence',
      'Tech': '#Tech #Technology',
      'Finance': '#Finance #FinTech',
      'Crypto': '#Crypto #Blockchain',
      'Énergie': '#Energy #CleanTech',
      'Santé': '#HealthTech #MedTech'
    };
    
    const sectorHashtag = sectorMap[secteur] || `#${secteur}`;
    hashtags.push(sectorHashtag);
  }
  
  // Hashtags des actions (entreprises)
  if (actions) {
    const actionList = Array.isArray(actions) ? actions : actions.split(',');
    const companyHashtags = actionList
      .slice(0, 3) // Max 3 entreprises
      .map(action => `$${action.trim()}`)
      .join(' ');
    
    if (companyHashtags) {
      hashtags.push(companyHashtags);
    }
  }
  
  return hashtags.join(' ');
};

/**
 * Formatte le texte complet de partage
 */
export const formatShareText = (article) => {
  const title = extractTitle(article.analyse);
  const summary = generateSummary(article.analyse, 150);
  const hashtags = generateHashtags(article.secteur, article.actions);
  
  const importanceStars = '⭐'.repeat(article.importance || 0);
  const sentimentEmoji = 
    article.sentiment === 'Positif' ? '📈' : 
    article.sentiment === 'Négatif' ? '📉' : '➡️';
  
  return `📰 ${title}

${summary}

${importanceStars} | ${sentimentEmoji} ${article.sentiment || 'Neutre'} | 🏷️ ${article.secteur || 'Tech'}

${hashtags}

Via Tech Watch - Veille IA automatisée`;
};

/**
 * Génère l'URL de partage LinkedIn
 */
export const getLinkedInShareUrl = (url) => {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
};

/**
 * Génère l'URL de partage Twitter/X
 */
export const getTwitterShareUrl = (text, url) => {
  const tweetText = text.length > 280 ? text.substring(0, 277) + '...' : text;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
};

/**
 * Génère l'URL de partage Facebook
 */
export const getFacebookShareUrl = (url) => {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
};

/**
 * Génère l'URL de partage WhatsApp
 */
export const getWhatsAppShareUrl = (text, url) => {
  const message = `${text}\n\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

/**
 * Génère l'URL de partage Email
 */
export const getEmailShareUrl = (article) => {
  const title = extractTitle(article.analyse);
  const summary = generateSummary(article.analyse, 300);
  const url = article.url || window.location.origin;
  
  const subject = `📰 ${title}`;
  const body = `${summary}

Lire l'article complet : ${url}

---
Partagé depuis Tech Watch - Veille IA & Tech automatisée
${window.location.origin}`;
  
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

/**
 * Copie le texte dans le presse-papier
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erreur copie presse-papier:', error);
    
    // Fallback pour anciens navigateurs
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } catch (fallbackError) {
      console.error('Erreur fallback copie:', fallbackError);
      return false;
    }
  }
};

/**
 * Vérifie si Web Share API est disponible
 */
export const isWebShareSupported = () => {
  return 'share' in navigator;
};

/**
 * Vérifie si l'appareil est mobile
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
