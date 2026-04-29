import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('🔍 InstallPrompt: Démarrage...');
    
    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ App déjà installée (standalone mode)');
      setIsInstalled(true);
      return;
    }
    
    console.log('📱 App pas encore installée');

    // Vérifier si l'utilisateur a déjà refusé
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = (now - dismissedDate) / (1000 * 60 * 60 * 24);
      
      console.log(`⏰ Prompt refusé il y a ${daysSinceDismissed.toFixed(1)} jours`);
      
      if (daysSinceDismissed < 7) {
        console.log('⏸️ Prompt masqué (< 7 jours)');
        return;
      }
    }

    // Écouter l'événement d'installation
    const handleBeforeInstall = (e) => {
      console.log('🎉 Événement beforeinstallprompt déclenché !');
      e.preventDefault();
      setDeferredPrompt(e);
      
      setTimeout(() => {
        console.log('📣 Affichage du banner PWA');
        setShowPrompt(true);
      }, 3000);
    };

    console.log('👂 Écoute de beforeinstallprompt...');
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Détecter quand l'app est installée
    const handleAppInstalled = () => {
      console.log('✅ App installée !');
      setIsInstalled(true);
      setShowPrompt(false);
      toast.success('✅ App installée avec succès !', {
        description: 'Tech Watch est maintenant sur votre appareil'
      });
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    
    const result = await deferredPrompt.userChoice;

    if (result.outcome === 'accepted') {
      toast.success('🎉 Installation en cours...', {
        description: 'Tech Watch sera bientôt sur votre écran d\'accueil'
      });
    } else {
      toast.info('Installation annulée', {
        description: 'Vous pourrez installer l\'app plus tard'
      });
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', new Date().toISOString());
    toast.info('Prompt masqué', {
      description: 'Il réapparaîtra dans 7 jours'
    });
  };

  // Badge "Installé" dans le header
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30">
        <Download className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-medium text-violet-400">App installée</span>
      </div>
    );
  }

  // Banner d'installation
  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="relative overflow-hidden border-violet-500/30 bg-gradient-to-br from-slate-900/95 to-violet-900/95 backdrop-blur-lg shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
        
        <div className="relative p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Download className="w-6 h-6 text-violet-400" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">
                Installer Tech Watch
              </h3>
              <p className="text-sm text-gray-300">
                Accédez à votre veille tech instantanément depuis votre écran d'accueil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Installer
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-white/5"
            >
              Plus tard
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              ⚡ Accès instantané
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              📵 Fonctionne hors ligne
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Composant pour afficher un message hors ligne
export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('🌐 Connexion rétablie !', {
        description: 'Vous êtes de nouveau en ligne'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('📵 Mode hors ligne', {
        description: 'Vous naviguez avec le contenu en cache',
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
      <div className="px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-lg">
        <span className="text-sm font-medium text-amber-400">
          📵 Mode hors ligne
        </span>
      </div>
    </div>
  );
};
