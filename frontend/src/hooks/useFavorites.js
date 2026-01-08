import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const FAVORITES_KEY = 'tech_watch_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  // Charger les favoris au démarrage
  useEffect(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Erreur chargement favoris:', e);
        setFavorites([]);
      }
    }
  }, []);

  // Sauvegarder à chaque modification
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (article) => {
    setFavorites(prev => {
      // Éviter les doublons
      if (prev.some(fav => fav.url === article.url)) {
        toast.info('📌 Déjà dans les favoris', {
          description: 'Cet article est déjà enregistré'
        });
        return prev;
      }
      
      toast.success('⭐ Ajouté aux favoris !', {
        description: 'Article enregistré avec succès'
      });
      
      return [...prev, { ...article, favoritedAt: new Date().toISOString() }];
    });
  };

  const removeFavorite = (articleUrl) => {
    setFavorites(prev => prev.filter(fav => fav.url !== articleUrl));
    
    toast.success('🗑️ Retiré des favoris', {
      description: 'Article supprimé de vos favoris'
    });
  };

  const isFavorite = (articleUrl) => {
    return favorites.some(fav => fav.url === articleUrl);
  };

  const toggleFavorite = (article) => {
    if (isFavorite(article.url)) {
      removeFavorite(article.url);
      return false;
    } else {
      addFavorite(article);
      return true;
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    count: favorites.length
  };
}
