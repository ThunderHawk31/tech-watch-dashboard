# Frontend - Tech Watch Dashboard

Interface React du système de veille technologique automatisé par IA.

## 🎨 Fonctionnalités

### ✅ Implémenté
- **Dashboard interactif** : Consultation des articles analysés par IA (Claude)
- **Filtres avancés** : Par secteur (IA, Tech, Finance, Crypto, etc.), importance (1-5⭐), sentiment (Positif/Négatif/Neutre), recherche textuelle
- **PWA** : Installation sur mobile/desktop, mode offline, icônes optimisées
- **Statistiques** : Visualisations graphiques des tendances tech avec Recharts
- **Favoris** : Sauvegarde locale des articles importants (localStorage)
- **Partage** : Partage natif d'articles via Web Share API
- **Thème** : Mode clair/sombre avec persistance
- **Responsive** : Design mobile-first avec Tailwind CSS
- **Sécurité** : Protection XSS avec DOMPurify, validation Joi

### 🔜 Améliorations futures
- Notifications push pour articles hautement prioritaires ou nouveaux articles sortis
- Synchronisation des favoris entre appareils
- Historique de lecture
- Recommandations personnalisées par IA


## 📱 PWA

L'application est installable comme PWA sur :
- **iOS** : Safari > Partager > Sur l'écran d'accueil
- **Android** : Chrome > Menu > Installer l'application
- **Desktop** : Chrome > Icône d'installation dans la barre d'adresse

## 🔧 Structure du projet

```
frontend/
├── public/
│   ├── icons/           # Icônes PWA (192x192, 512x512, etc.)
│   └── manifest.json    # Configuration PWA
├── src/
│   ├── components/      # Composants React réutilisables
│   ├── contexts/        # Context API (Theme, Favorites)
│   ├── hooks/           # Custom hooks
│   ├── validation/      # Schémas de validation Joi
│   ├── api.js          # Appels API
│   ├── App.js          # Composant principal
│   └── index.js        # Point d'entrée
```

## 📊 Fonctionnement

1. L'application récupère les articles analysés par Claude via l'API n8n
2. Les données sont filtrées et triées côté client
3. Les favoris sont sauvegardés en localStorage
4. Le Service Worker permet le mode offline avec cache

## 🎨 Personnalisation

Les couleurs principales du projet sont définies dans [tailwind.config.js](tailwind.config.js) :
- **Primary** : `#8B5CF6` (Violet)
- **Secondary** : Dégradé vers secondary
- **Background** : `#0F172A` (Dark slate)
