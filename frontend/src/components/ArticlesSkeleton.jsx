import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

const ArticlesSkeleton = ({ totalArticles = 74 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stages = [
      { delay: 0, value: 20 },
      { delay: 700, value: 50 },
      { delay: 1400, value: 75 },
      { delay: 2000, value: 90 }
    ];
    stages.forEach(({ delay, value }) => {
      setTimeout(() => setProgress(value), delay);
    });
  }, []);

  return (
    <div className="max-w-md mx-auto py-20">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          <Zap className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Chargement de la veille tech</h3>
        <p className="text-sm text-muted-foreground">
          Analyse de {
            progress < 50
              ? Math.round(totalArticles * 0.3)
              : progress < 75
                ? Math.round(totalArticles * 0.6)
                : totalArticles
          } articles en cours...
        </p>
      </div>

      <div className="relative mb-8">
        <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="absolute right-0 -top-6 text-sm font-medium text-primary">{progress}%</span>
      </div>

      <div className="space-y-2 text-sm">
        <div className={`flex items-center gap-2 transition-all duration-300 ${progress >= 20 ? 'opacity-100' : 'opacity-30'}`}>
          <div className={`w-2 h-2 rounded-full transition-colors ${progress >= 20 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <span className={progress >= 20 ? 'text-foreground' : 'text-muted-foreground'}>Connexion à l'API</span>
          {progress >= 50 && <span className="ml-auto text-primary">✓</span>}
        </div>
        <div className={`flex items-center gap-2 transition-all duration-300 ${progress >= 50 ? 'opacity-100' : 'opacity-30'}`}>
          <div className={`w-2 h-2 rounded-full transition-colors ${progress >= 50 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <span className={progress >= 50 ? 'text-foreground' : 'text-muted-foreground'}>Récupération des données</span>
          {progress >= 75 && <span className="ml-auto text-primary">✓</span>}
        </div>
        <div className={`flex items-center gap-2 transition-all duration-300 ${progress >= 75 ? 'opacity-100' : 'opacity-30'}`}>
          <div className={`w-2 h-2 rounded-full transition-colors ${progress >= 75 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <span className={progress >= 75 ? 'text-foreground' : 'text-muted-foreground'}>Traitement des analyses</span>
          {progress >= 90 && <span className="ml-auto text-primary">✓</span>}
        </div>
        <div className={`flex items-center gap-2 transition-all duration-300 ${progress >= 90 ? 'opacity-100' : 'opacity-30'}`}>
          <div className={`w-2 h-2 rounded-full transition-colors ${progress >= 90 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <span className={progress >= 90 ? 'text-foreground' : 'text-muted-foreground'}>Finalisation</span>
        </div>
      </div>
    </div>
  );
};

export default ArticlesSkeleton;
