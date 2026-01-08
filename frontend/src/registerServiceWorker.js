// Import toast depuis le module global (sera disponible via window.toast)
// Assurez-vous que Sonner est bien importé dans App.js

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✅ Service Worker enregistré:', registration);
          
          // Vérifier les mises à jour toutes les heures
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Écouter les mises à jour
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // Nouvelle version disponible
                    console.log('🆕 Nouvelle version disponible !');
                    
                    // Afficher un toast élégant au lieu de window.confirm
                    if (window.toast) {
                      window.toast.info('🆕 Nouvelle version disponible !', {
                        description: 'Cliquez pour recharger et mettre à jour',
                        action: {
                          label: 'Mettre à jour',
                          onClick: () => {
                            window.location.reload();
                          }
                        },
                        duration: 10000, // 10 secondes
                      });
                    }
                  } else {
                    // Premier chargement - cache prêt
                    console.log('✅ Contenu mis en cache pour une utilisation hors ligne');
                    
                    if (window.toast) {
                      window.toast.success('✅ App prête !', {
                        description: 'Le contenu est en cache pour une utilisation hors ligne',
                        duration: 3000
                      });
                    }
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('❌ Erreur Service Worker:', error);
          
          if (window.toast) {
            window.toast.error('❌ Erreur d\'installation', {
              description: 'Le mode hors ligne n\'est pas disponible',
              duration: 5000
            });
          }
        });
    });
  } else {
    console.warn('⚠️ Service Worker non supporté par ce navigateur');
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('🗑️ Service Worker désinstallé');
        
        if (window.toast) {
          window.toast.info('Service Worker désinstallé', {
            description: 'Le mode hors ligne a été désactivé'
          });
        }
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Fonction pour forcer la mise à jour
export function forceUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.update();
        console.log('🔄 Vérification de mise à jour forcée');
        
        if (window.toast) {
          window.toast.info('🔄 Vérification des mises à jour...', {
            duration: 2000
          });
        }
      });
  }
}
