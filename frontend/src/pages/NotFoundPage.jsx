import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* 404 animé */}
        <div className="relative select-none">
          <span
            className="text-[10rem] sm:text-[12rem] font-black leading-none
                       text-transparent bg-clip-text
                       bg-gradient-to-br from-primary via-secondary to-primary/40
                       animate-pulse"
          >
            404
          </span>
          {/* halo derrière */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <div className="w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>

        {/* Texte */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Page introuvable
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            L'URL que vous avez demandée n'existe pas ou a été déplacée.
            <br />
            Revenez à l'accueil pour continuer votre veille.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </Button>

          <Button
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Accueil
          </Button>
        </div>

        {/* Raccourcis utiles */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Pages disponibles</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'Accueil', path: '/' },
              { label: 'Statistiques', path: '/stats' },
              { label: 'Favoris', path: '/favoris' },
              { label: 'Tendances', path: '/tendances' },
              { label: 'À propos', path: '/about' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           text-xs font-medium border border-border
                           text-muted-foreground hover:text-foreground hover:bg-muted
                           transition-colors"
              >
                <Search className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotFoundPage;
