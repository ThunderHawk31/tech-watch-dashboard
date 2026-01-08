import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('✅ beforeinstallprompt déclenché');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        toast.success('🎉 Installation en cours...');
      }
      setDeferredPrompt(null);
    } else {
      toast.info('📱 Installation manuelle', {
        description: 'Chrome : Menu ⋮ → Caster, enregistrer, partager → Installer Tech Watch',
        duration: 6000
      });
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
    >
      <Download className="w-4 h-4 mr-2" />
      Installer
    </Button>
  );
};
