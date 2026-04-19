import { useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export const ShareButton = ({ article, variant = 'default', size = 'sm', showText = true }) => {
  const [copied, setCopied] = useState(false);

  // Formater le texte de partage
  const formatShareText = () => {
    // Extraire le titre de l'analyse
    const titleMatch = article.analyse?.match(/#{1,3}\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Article intéressant';
    
    // Créer le texte de partage
    const text = `📰 ${title}

⭐ Importance: ${'★'.repeat(article.importance || 0)}
🏷️ ${article.secteur || 'Tech'}
${article.sentiment === 'Positif' ? '📈' : article.sentiment === 'Négatif' ? '📉' : '➡️'} ${article.sentiment || 'Neutre'}

${article.actions ? `💼 Actions: ${article.actions}` : ''}

Via Tech Watch - Veille IA & Tech automatisée`;

    return text;
  };

  // Générer l'URL de partage — lien direct vers l'article sur TechWatch
  const getShareUrl = () => {
    if (article?.id) {
      return `${window.location.origin}/?article=${article.id}`;
    }
    return window.location.origin;
  };

  // Web Share API (natif mobile/desktop moderne)
  const handleNativeShare = async () => {
    const shareData = {
      title: 'Tech Watch - Article',
      text: formatShareText(),
      url: getShareUrl(),
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        
        toast.success('🎉 Article partagé !', {
          description: 'Merci d\'avoir partagé cet article'
        });
        
        return true;
      }
      return false;
    } catch (error) {
      // Utilisateur a annulé le partage
      if (error.name !== 'AbortError') {
        console.error('Erreur partage:', error);
      }
      return false;
    }
  };

  // Fallback : Copier le lien dans le presse-papier
  const handleCopyLink = async () => {
    const url = getShareUrl();

    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API non disponible');
      }

      await navigator.clipboard.writeText(url);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast.success('🔗 Lien copié !', {
        description: 'Le lien a été copié dans votre presse-papier'
      });
    } catch (error) {
      console.error('Erreur copie:', error);

      toast.error('❌ Erreur de copie', {
        description: 'Clipboard nécessite HTTPS ou localhost'
      });
    }
  };

  // Partage sur LinkedIn (fallback si Web Share API pas dispo)
  const shareOnLinkedIn = () => {
    const url = getShareUrl();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
    
    toast.success('📱 Ouverture LinkedIn...', {
      description: 'Nouvelle fenêtre de partage'
    });
  };

  // Partage sur Twitter/X (fallback)
  const shareOnTwitter = () => {
    const text = formatShareText();
    const url = getShareUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=600');
    
    toast.success('🐦 Ouverture Twitter...', {
      description: 'Nouvelle fenêtre de partage'
    });
  };

  // Handler principal
  const handleShare = async (e) => {
    e?.stopPropagation(); // Empêcher la propagation pour ne pas ouvrir la modale

    // Essayer Web Share API d'abord (meilleur UX mobile)
    const shared = await handleNativeShare();

    // Si Web Share API pas disponible, copier le lien
    if (!shared) {
      await handleCopyLink();
    }
  };

  // Rendu conditionnel de l'icône
  const ShareIcon = copied ? Check : Share2;

  return (
    <div className="flex items-center gap-2">
      {/* Bouton principal (Web Share ou Copie) */}
      <Button
        onClick={handleShare}
        variant={variant}
        size={size}
        className="gap-2"
      >
        <ShareIcon className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
        {showText && (
          <span>{copied ? 'Copié !' : 'Partager'}</span>
        )}
      </Button>

      {/* Boutons secondaires (desktop uniquement) */}
      {variant === 'default' && (
        <div className="hidden md:flex items-center gap-1">
          <Button
            onClick={shareOnLinkedIn}
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            title="Partager sur LinkedIn"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </Button>
          
          <Button
            onClick={shareOnTwitter}
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            title="Partager sur Twitter/X"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
};

// Version compacte pour les cartes
export const ShareButtonCompact = ({ article }) => {
  return (
    <ShareButton 
      article={article} 
      variant="ghost" 
      size="sm" 
      showText={false}
    />
  );
};

// Hook pour vérifier si Web Share API est disponible
export const useWebShareSupport = () => {
  const [isSupported, setIsSupported] = useState(false);

  useState(() => {
    setIsSupported('share' in navigator);
  }, []);

  return isSupported;
};
