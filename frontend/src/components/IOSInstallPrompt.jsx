import { useState, useEffect } from 'react';
import { Share, X, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';

export const IOSInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Détecter iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Détecter si déjà installé (mode standalone)
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    // Afficher le prompt si iOS ET pas encore installé
    if (isIOS && !isInStandaloneMode) {
      // Vérifier si l'utilisateur a déjà dismissé le prompt
      const dismissed = localStorage.getItem('ios-install-prompt-dismissed');
      
      if (!dismissed) {
        // Attendre 3 secondes avant d'afficher
        setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
      } else {
        // Si déjà dismissé, vérifier si c'était il y a plus de 7 jours
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        const daysSinceDismissed = (now - dismissedDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceDismissed >= 7) {
          // Réafficher après 7 jours
          localStorage.removeItem('ios-install-prompt-dismissed');
          setTimeout(() => {
            setShowPrompt(true);
          }, 3000);
        }
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', new Date().toISOString());
  };

  // Ne rien afficher si le prompt n'est pas actif
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="relative overflow-hidden border-violet-500/30 bg-gradient-to-br from-slate-900/95 to-violet-900/95 backdrop-blur-lg shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
        
        <div className="relative p-4">
          {/* Bouton fermer */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="text-4xl">📱</div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1 pr-6">
                Installer Tech Watch sur iPhone
              </h3>
              <p className="text-sm text-gray-300">
                Accédez instantanément à votre veille tech depuis votre écran d'accueil
              </p>
            </div>
          </div>

          {/* Instructions étape par étape */}
          <div className="space-y-3 mb-4">
            {/* Étape 1 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500 text-white text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white font-medium mb-1">
                  Appuyez sur
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-500 text-white">
                    <Share className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Bouton Partager en bas de l'écran
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500 text-white text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1">
                <div className="text-white font-medium mb-1">
                  Sélectionnez "Sur l'écran d'accueil"
                </div>
                <p className="text-sm text-gray-400">
                  Faites défiler vers le bas si nécessaire
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            </div>

            {/* Étape 3 */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500 text-white text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1">
                <div className="text-white font-medium mb-1">
                  Appuyez sur "Ajouter"
                </div>
                <p className="text-sm text-gray-400">
                  En haut à droite de l'écran
                </p>
              </div>
            </div>
          </div>

          {/* Avantages */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 px-3">
            <span className="flex items-center gap-1">
              ⚡ Accès rapide
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              📵 Mode hors ligne
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              🚀 Comme une app
            </span>
          </div>

          {/* Bouton "Plus tard" */}
          <button
            onClick={handleDismiss}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-300 transition-colors py-2"
          >
            Plus tard
          </button>
        </div>
      </Card>
    </div>
  );
};

// Composant pour détecter si on est sur iOS (utile ailleurs dans l'app)
export const useIsIOS = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    setIsIOS(iOS);
    setIsInstalled(standalone);
  }, []);

  return { isIOS, isInstalled };
};
