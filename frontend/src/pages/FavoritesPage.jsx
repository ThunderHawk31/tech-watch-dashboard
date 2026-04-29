import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Zap } from "lucide-react";
import { useFavorites as useFavoritesContext } from "../contexts/FavoritesContext";
import { Button } from "../components/ui/button";
import ArticleCard from "../components/ArticleCard";
import ArticleModal from "../components/ArticleModal";

const FavoritesPage = () => {
  const { favorites } = useFavoritesContext();
  const [selectedArticle, setSelectedArticle] = useState(null);

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Aucun favori</h1>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas encore ajouté d'articles à vos favoris.
            Cliquez sur l'étoile ⭐ sur les cartes pour en ajouter !
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Zap className="w-4 h-4" />
              Découvrir des articles
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Mes Favoris</h1>
        <p className="text-muted-foreground">
          {favorites.length} article{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((article, index) => (
          <div
            key={article.url}
            className="animate-fadeInUp"
            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
          >
            <ArticleCard article={article} onOpenModal={setSelectedArticle} />
          </div>
        ))}
      </div>

      <ArticleModal article={selectedArticle} open={!!selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
};

export default FavoritesPage;
