import { fetchArticles as fetchArticlesAPI } from './api';
import { validateFilters } from './validation/filters';
import { useState, useEffect, lazy, Suspense, memo } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Search, Star, ExternalLink, Copy,
  TrendingUp, TrendingDown, Minus, BookOpen, Info,
  ChevronLeft, ChevronRight,
  Zap, Cpu, Coins, Leaf, Heart, HelpCircle, Shield, Github, Linkedin, RefreshCw
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { OfflineIndicator } from './components/InstallPrompt';
import { IOSInstallPrompt } from './components/IOSInstallPrompt';
import { ShareButton } from './components/ShareButton';
import { InstallPWA } from './components/InstallPWA';
// New imports for UI Mobile Design
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider, useFavorites as useFavoritesContext } from './contexts/FavoritesContext';
import { HeaderNew } from './components/HeaderNew';
import MentionsLegales from './MentionsLegales';
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeURL,
  sanitizeArticle
} from './utils/sanitizer';

// Sector colors and icons
const sectorConfig = {
  "IA": { color: "#8B5CF6", bg: "bg-violet-500/20", text: "text-violet-400", icon: Zap },
  "Tech": { color: "#3B82F6", bg: "bg-blue-500/20", text: "text-blue-400", icon: Cpu },
  "Finance": { color: "#10B981", bg: "bg-emerald-500/20", text: "text-emerald-400", icon: TrendingUp },
  "Crypto": { color: "#F59E0B", bg: "bg-amber-500/20", text: "text-amber-400", icon: Coins },
  "Énergie": { color: "#EAB308", bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Leaf },
  "Santé": { color: "#EC4899", bg: "bg-pink-500/20", text: "text-pink-400", icon: Heart },
  "Cybersécurité": { color: "#EF4444", bg: "bg-red-500/20", text: "text-red-400", icon: Shield },
  "Autre": { color: "#6B7280", bg: "bg-gray-500/20", text: "text-gray-400", icon: HelpCircle },
};

const sentimentConfig = {
  "Positif": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: TrendingUp },
  "Négatif": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: TrendingDown },
  "Neutre": { bg: "bg-gray-100 dark:bg-gray-700/30", text: "text-gray-700 dark:text-gray-400", icon: Minus },
};

// Helper functions
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

const renderStars = (count) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${i < count ? "fill-amber-400 text-amber-400" : "text-gray-600"}`}
    />
  ));
};

// Components
// Using the new HeaderNew component from UI Mobile Design
const Header = HeaderNew;



const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-16 py-8 bg-card/30">
      <div className="container mx-auto px-4">
        {/* Section principale */}
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          {/* Colonne 1 : À propos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Tech Watch</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Système de veille technologique automatisé par IA.
              Analyse +40 articles/jour en temps réel.
            </p>
          </div>

          {/* Colonne 2 : Navigation rapide */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/stats" className="text-muted-foreground hover:text-foreground transition-colors">
                  Statistiques
                </Link>
              </li>
              <li>
                <Link to="/favoris" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mes Favoris
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Contact & Technologies */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Contact</h3>
            <div className="space-y-3">
              {/* Liens sociaux */}
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/ThunderHawk31"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Profil GitHub"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://linkedin.com/in/nolan-macé-b8647738a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Profil LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              </div>

              {/* Email */}
              <a
                href="mailto:nolan.mace49@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Contact</span>
              </a>

              {/* Stack tech (badges) */}
              <div className="flex flex-wrap gap-1 pt-2">
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full">React</span>
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full">n8n</span>
              </div>
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            {/* Copyright */}
            <div className="flex items-center gap-4">
              <p>© {currentYear} Tech Watch Dashboard</p>
              <span className="hidden md:inline">•</span>
              <p className="hidden md:inline">Créé par Nolan</p>
            </div>

            {/* ✅ SUPPRIMÉ : "En ligne" et "Dernière mise à jour" */}
            {/* Les infos techniques ont été retirées comme demandé */}
          </div>
        </div>

      </div>
    </footer>
  );
};

  const ArticleCard = memo(({ article, onOpenModal }) => {
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const sector = sectorConfig[article.secteur] || sectorConfig["Autre"];
  const sentiment = sentimentConfig[article.sentiment] || sentimentConfig["Neutre"];
  const SectorIcon = sector.icon;
  const SentimentIcon = sentiment.icon;
  
  const isArticleFavorite = isFavorite(article.url);

  const getTitle = () => {
    if (article.titre && article.titre !== 'undefined' && article.titre.length > 5) {
      let cleanTitle = article.titre
        .replace(/^\(/, '')
        .replace(/\)$/, '')
        .trim();
      return cleanTitle;
    }
    
    if (article.analyse) {
      const cleaned = article.analyse.replace(/[#*`📰🏷️📊🔑💼⚡📈💹]/g, '').trim();
      const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        if (line.length > 20 && !line.match(/^(TITRE|SECTEUR|RÉSUMÉ|POINTS|IMPACT|OPPORTUNITÉS|IMPORTANCE|SENTIMENT)/i)) {
          if (line.length > 80) {
            return line.substring(0, 77) + '...';
          }
          return line;
        }
      }
    }
    
    return "Article de veille technologique";
  };
  
  const handleCopyLink = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(article.url);
    toast.success("Lien copié !");
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    const added = toggleFavorite(article);
    if (added) {
      toast.success("Ajouté aux favoris !", {
        icon: "⭐",
      });
    } else {
      toast.info("Retiré des favoris");
    }
  };

  return (
    <Card
      className="group cursor-pointer bg-card hover:bg-card/80 transition-all duration-300 hover:-translate-y-1"
      onClick={() => onOpenModal(article)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${sector.bg} ${sector.text} border-0 gap-1.5`}>
            <SectorIcon className="w-3 h-3" />
            {article.secteur}
          </Badge>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label={isArticleFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  isArticleFavorite
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-600 hover:text-amber-400"
                }`}
              />
            </button>
            <div className="flex items-center gap-0.5">
              {renderStars(article.importance)}
            </div>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          {sanitizeText(getTitle())}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
          <span>{formatDate(article.date)}</span>
          <Badge className={`${sentiment.bg} ${sentiment.text} border-0 gap-1`}>
            <SentimentIcon className="w-3 h-3" />
            {article.sentiment}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {sanitizeText(article.analyse || '').substring(0, 150)}...
        </p>
        {article.actions && article.actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Actions :</span>
            {(article.actions || []).map((action, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {action}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary">
          <BookOpen className="w-4 h-4" />
          Lire l'analyse
        </Button>
        <ShareButton article={article} variant="ghost" size="sm" showText={false} />
      </CardFooter>
    </Card>
  );
});

const ArticleModal = ({ article, open, onClose }) => {
  if (!article) return null;

  const sector = sectorConfig[article.secteur] || sectorConfig["Autre"];
  const sentiment = sentimentConfig[article.sentiment] || sentimentConfig["Neutre"];
  const SectorIcon = sector.icon;
  const SentimentIcon = sentiment.icon;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(article.url);
    toast.success("Lien copié !");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={`${sector.bg} ${sector.text} border-0 gap-1.5`}>
              <SectorIcon className="w-3 h-3" />
              {article.secteur}
            </Badge>
            <Badge className={`${sentiment.bg} ${sentiment.text} border-0 gap-1`}>
              <SentimentIcon className="w-3 h-3" />
              {article.sentiment}
            </Badge>
            <div className="flex items-center gap-0.5 ml-auto">
              {renderStars(article.importance)}
            </div>
          </div>
          <DialogTitle className="text-xl leading-tight pr-8">
            {article.url.split('/').pop().replace(/-/g, ' ')}
          </DialogTitle>
          <DialogDescription>
            {formatDate(article.date)}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-4">
          <div
            className="text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(article.analyse || '') }}
          />
        </ScrollArea>

        {article.actions && article.actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap py-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Actions mentionnées :</span>
            {(article.actions || []).map(action => (
              <Badge key={action} variant="secondary" className="font-mono">
                {action}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Button asChild className="flex-1 gap-2">
            <a href={sanitizeURL(article.url)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Voir l'article original
            </a>
          </Button> 
          <Button 
  variant="outline" 
  size="icon" 
  onClick={handleCopyLink}
  aria-label="Copier le lien"
>
  <Copy className="w-4 h-4" />
</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FiltersBar = ({ filters, setFilters }) => {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✅ Validation simple avec console.warn
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };

    // Valide immédiatement (feedback développeur)
    const { isValid, errors } = validateFilters(newFilters);

    if (!isValid) {
      console.warn('⚠️ Filtres invalides:', errors);
    }

    setFilters(newFilters);
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-border">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les articles..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Rechercher dans les articles"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.sector}
            onValueChange={(value) => handleFilterChange('sector', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Secteur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous secteurs</SelectItem>
              <SelectItem value="IA">IA</SelectItem>
              <SelectItem value="Tech">Tech</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Crypto">Crypto</SelectItem>
              <SelectItem value="Énergie">Énergie</SelectItem>
              <SelectItem value="Santé">Santé</SelectItem>
              <SelectItem value="Cybersécurité">Cybersécurité</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sentiment}
            onValueChange={(value) => handleFilterChange('sentiment', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous</SelectItem>
              <SelectItem value="Positif">Positif</SelectItem>
              <SelectItem value="Négatif">Négatif</SelectItem>
              <SelectItem value="Neutre">Neutre</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.minImportance}
            onValueChange={(value) => handleFilterChange('minImportance', value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Toutes</SelectItem>
              <SelectItem value="3">3+ étoiles</SelectItem>
              <SelectItem value="4">4+ étoiles</SelectItem>
              <SelectItem value="5">5 étoiles</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sort}
            onValueChange={(value) => handleFilterChange('sort', value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récent</SelectItem>
              <SelectItem value="importance">Plus important</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

const StatsOverview = ({ stats }) => {
  if (!stats) return null;

  const totalArticles = stats.total || 0;
  const positivePercent = totalArticles > 0
    ? Math.round((stats.parSecteur?.IA || 0) / totalArticles * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-2xl font-bold">{stats.total || 0}</p>
          <p className="text-sm text-muted-foreground">Articles analysés</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-2xl font-bold">{Object.keys(stats.parSecteur || {}).length}</p>
          <p className="text-sm text-muted-foreground">Secteurs couverts</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-2xl font-bold text-emerald-400">{stats.sentimentPositif || 0}</p>
          <p className="text-sm text-muted-foreground">Positifs</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-2xl font-bold">{stats.importanceMoyenne || "0"}</p>
          <p className="text-sm text-muted-foreground">Importance moy.</p>
        </CardContent>
      </Card>
    </div>
  );
};

  const ArticlesSkeleton = ({ totalArticles = 74 }) => {  
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulation de progression
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
        {/* Spinner avec icône */}
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          <Zap className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          Chargement de la veille tech
        </h3>
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
      
      {/* Barre de progression stylée */}
      <div className="relative mb-8">
        <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="absolute right-0 -top-6 text-sm font-medium text-primary">
          {progress}%
        </span>
      </div>
      
      {/* Étapes progressives */}
      <div className="space-y-2 text-sm">
        <div className={`flex items-center gap-2 transition-all duration-300 ${progress >= 20 ? 'opacity-100' : 'opacity-30'}`}>
          <div className={`w-2 h-2 rounded-full transition-colors ${progress >= 20 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <span className={progress >= 20 ? 'text-foreground' : 'text-muted-foreground'}>
            Connexion à l'API
          </span>
          {progress >= 50 && <span className="ml-auto text-primary">✓</span>}
        </div>
        
        <div className={`flex items-center gap-2 transition-all duration-300 ${progress >= 50 ? 'opacity-100' : 'opacity-30'}`}>
          <div className={`w-2 h-2 rounded-full transition-colors ${progress >= 50 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <span className={progress >= 50 ? 'text-foreground' : 'text-muted-foreground'}>
            Récupération des données
          </span>
          {progress >= 75 && <span className="ml-auto text-primary">✓</span>}
        </div>
        
        <div className={`flex items-center gap-2 transition-all duration-300 ${progress >= 75 ? 'opacity-100' : 'opacity-30'}`}>
          <div className={`w-2 h-2 rounded-full transition-colors ${progress >= 75 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <span className={progress >= 75 ? 'text-foreground' : 'text-muted-foreground'}>
            Traitement des analyses
          </span>
          {progress >= 90 && <span className="ml-auto text-primary">✓</span>}
        </div>
        
        <div className={`flex items-center gap-2 transition-all duration-300 ${progress >= 90 ? 'opacity-100' : 'opacity-30'}`}>
          <div className={`w-2 h-2 rounded-full transition-colors ${progress >= 90 ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
          <span className={progress >= 90 ? 'text-foreground' : 'text-muted-foreground'}>
            Finalisation
          </span>
        </div>
      </div>
    </div>
  );
};

// Main Page
const HomePage = () => {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    sector: "Tous",
    sentiment: "Tous",
    minImportance: "0",
    sort: "recent"
  });
const [displayTotal, setDisplayTotal] = useState(112);

// Dans le useEffect qui charge les articles
useEffect(() => {
  fetchArticles();
}, [page, filters.sector, filters.sentiment, filters.minImportance, filters.sort, filters.search]);

// Ajoute un autre useEffect pour mettre à jour displayTotal
useEffect(() => {
  if (totalCount > 0) {
    setDisplayTotal(totalCount);
  }
}, [totalCount]);
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await fetchArticlesAPI(filters, page);
      
      setArticles(data.articles);
      setTotalCount(data.total);
      setStats(data.stats);
      setLoading(false);
      
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error("Erreur lors du chargement des articles");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, filters.sector, filters.sentiment, filters.minImportance, filters.sort, filters.search]);

  const totalPages = Math.ceil(totalCount / 15);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          Veille Technologique
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            IA & Tech
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Analyses automatiques par IA — Mis à jour 2×/jour
        </p>
      </div>

      <StatsOverview stats={stats} />
      <FiltersBar filters={filters} setFilters={setFilters} />
      <h2 className="sr-only">Liste des articles</h2>

      {loading ? (
  <ArticlesSkeleton totalArticles={displayTotal} />
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <Info className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucun article trouvé</h3>
          <p className="text-muted-foreground mb-4">
            Essayez de modifier vos filtres de recherche
          </p>
          <Button onClick={fetchArticles} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Recharger
          </Button>
        </div>
      ) : (
        <>
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {articles.map((article, index) => (
    <div
      key={article.id}
      className="animate-fadeInUp"
      style={{
        animationDelay: `${index * 0.05}s`,
        animationFillMode: 'both'
      }}
    >
      <ArticleCard
        article={article}
        onOpenModal={setSelectedArticle}
      />
    </div>
  ))}
</div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
             <Button
  variant="outline"
  size="icon"
  disabled={page === 1}
  onClick={() => setPage(p => p - 1)}
  aria-label="Page précédente"
>
  <ChevronLeft className="w-4 h-4" />
</Button>
<span className="text-sm text-muted-foreground px-4" aria-live="polite">
  Page {page} sur {totalPages}
</span>
<Button
  variant="outline"
  size="icon"
  disabled={page === totalPages}
  onClick={() => setPage(p => p + 1)}
  aria-label="Page suivante"
>
  <ChevronRight className="w-4 h-4" />
</Button>
            </div>
          )}
        </>
      )}

      <ArticleModal
        article={selectedArticle}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          À propos du projet
        </h1>
        <p className="text-xl text-muted-foreground">
          Un système de veille technologique automatisé alimenté par l'IA
        </p>
      </div>

      {/* Présentation du projet */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Le Projet
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Tech Watch Dashboard</strong> est un système complet de veille technologique 
              qui analyse automatiquement les dernières actualités des secteurs IA, Tech, Finance, Crypto et plus encore.
            </p>
            <p>
              Projet personnel développé en parallèle de ma formation <strong className="text-foreground">BTS SIO SISR</strong>, 
              il combine plusieurs technologies modernes pour automatiser entièrement le processus de veille, 
              de la collecte des articles à leur analyse par IA.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Workflow */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            Comment ça fonctionne ?
          </h2>
          
          <div className="space-y-6">
            {/* Étape 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Collecte automatique (n8n)</h3>
                <p className="text-muted-foreground">
                  Un workflow n8n s'exécute <strong>2 fois par jour</strong> (00:00 et 12:00) pour récupérer 
                  les flux RSS de sources tech de référence : TechCrunch, The Verge, Ars Technica, etc.
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Analyse par IA (Claude API)</h3>
                <p className="text-muted-foreground">
                  Chaque article est analysé par <strong>Claude 4 Sonnet</strong> qui extrait :
                  le secteur, l'importance (1-5⭐), le sentiment, les actions boursières mentionnées, 
                  et génère un résumé structuré.
                </p>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Stockage (Google Sheets)</h3>
                <p className="text-muted-foreground">
                  Les analyses sont automatiquement enregistrées dans Google Sheets qui sert de base de données, 
                  permettant un accès facile et une sauvegarde sécurisée.
                </p>
              </div>
            </div>

            {/* Étape 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Affichage (React + Vercel)</h3>
                <p className="text-muted-foreground">
                  Ce dashboard React consulte l'API n8n pour afficher les articles avec filtres, 
                  recherche, favoris et statistiques. Déployé sur Vercel pour une disponibilité 24/7.
                </p>
              </div>
            </div>
          </div>

          {/* Schéma visuel simple */}
          <div className="mt-8 p-6 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-orange-500" />
                </div>
                <p className="text-sm font-medium">RSS Feeds</p>
              </div>
              
              <ChevronRight className="w-6 h-6 text-muted-foreground hidden sm:block" />
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-sm font-medium">n8n</p>
              </div>
              
              <ChevronRight className="w-6 h-6 text-muted-foreground hidden sm:block" />
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-sm font-medium">Claude AI</p>
              </div>
              
              <ChevronRight className="w-6 h-6 text-muted-foreground hidden sm:block" />
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-medium">Google Sheets</p>
              </div>
              
              <ChevronRight className="w-6 h-6 text-muted-foreground hidden sm:block" />
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Dashboard</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pourquoi ce projet */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-primary" />
            Pourquoi ce projet ?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Problème résolu
              </h3>
              <p className="text-sm text-muted-foreground">
                La veille technologique manuelle est chronophage (2-3h/jour) et subjective. 
                Ce système automatise entièrement le processus tout en garantissant une analyse 
                objective et structurée grâce à l'IA.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Compétences développées
              </h3>
              <p className="text-sm text-muted-foreground">
                Automatisation avec n8n, intégration d'API (Claude, Google), développement React, 
                déploiement cloud (Railway, Vercel), et conception de systèmes distribués.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Star className="w-5 h-5 text-violet-500" />
                Valeur ajoutée
              </h3>
              <p className="text-sm text-muted-foreground">
                Gain de temps significatif, analyses objectives et structurées, 
                historique complet consultable, et système évolutif pour ajouter de nouvelles sources.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Objectif pédagogique
              </h3>
              <p className="text-sm text-muted-foreground">
                Démontrer ma capacité à concevoir et déployer une solution technique complète, 
                de l'analyse du besoin à la mise en production, dans le cadre de mon BTS SIO SISR.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technologies */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            Technologies utilisées
          </h2>
          
          <div className="space-y-6">
            {/* Automatisation */}
            <div>
              <h3 className="font-semibold mb-3 text-blue-400">⚙️ Automatisation & Backend</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1">n8n (Workflow automation)</Badge>
                <Badge variant="secondary" className="px-3 py-1">Claude 4 Sonnet API</Badge>
                <Badge variant="secondary" className="px-3 py-1">Google Sheets API</Badge>
                <Badge variant="secondary" className="px-3 py-1">Railway (hosting)</Badge>
              </div>
            </div>

            {/* Frontend */}
            <div>
              <h3 className="font-semibold mb-3 text-violet-400">🎨 Frontend</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1">React 18</Badge>
                <Badge variant="secondary" className="px-3 py-1">React Router</Badge>
                <Badge variant="secondary" className="px-3 py-1">Tailwind CSS</Badge>
                <Badge variant="secondary" className="px-3 py-1">shadcn/ui</Badge>
                <Badge variant="secondary" className="px-3 py-1">Recharts</Badge>
                <Badge variant="secondary" className="px-3 py-1">Lucide Icons</Badge>
              </div>
            </div>

            {/* Déploiement */}
            <div>
              <h3 className="font-semibold mb-3 text-emerald-400">🚀 Déploiement</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1">Vercel (Frontend)</Badge>
                <Badge variant="secondary" className="px-3 py-1">Railway (Backend n8n)</Badge>
                <Badge variant="secondary" className="px-3 py-1">GitHub (Version control)</Badge>
              </div>
            </div>

            {/* Outils */}
            <div>
              <h3 className="font-semibold mb-3 text-amber-400">🛠️ Outils & Services</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1">Google Sheets (Database)</Badge>
                <Badge variant="secondary" className="px-3 py-1">RSS Feeds</Badge>
                <Badge variant="secondary" className="px-3 py-1">localStorage (Cache)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques du système */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Statistiques du système
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">+40</p>
              <p className="text-sm text-muted-foreground">Articles/jour</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">2×</p>
              <p className="text-sm text-muted-foreground">Exécutions/jour</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">90%</p>
              <p className="text-sm text-muted-foreground">Gain de temps</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground">Disponibilité</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact / Liens */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Contact & Liens</h2>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Développé par :</strong> Nolan - Étudiant BTS SIO SISR
            </p>
            <div className="flex items-center gap-4 pt-4">
              <a 
                href="https://github.com/ThunderHawk31" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </a>
              <a 
                href="https://linkedin.com/in/nolan-macé-b8647738a" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
const StatsPage = lazy(() => import('./StatsPage'));

function App() {
  // Exposer toast pour le Service Worker
  useEffect(() => {
    window.toast = toast;
  }, []);
  return (
    <div className="App min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/stats" 
            element={
              <Suspense fallback={
                <div className="container mx-auto px-4 py-8">
                  <div className="animate-pulse">
                    <div className="h-10 w-64 bg-gray-700 rounded mb-8"></div>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="h-80 bg-gray-700 rounded"></div>
                      <div className="h-80 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              }>
                <StatsPage />
              </Suspense>
            } 
          />
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

const FavoritesPage = () => {
  const { favorites, removeFavorite } = useFavoritesContext();
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
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Mes Favoris
        </h1>
        <p className="text-muted-foreground">
          {favorites.length} article{favorites.length > 1 ? 's' : ''} sauvegardé{favorites.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((article, index) => (
          <div
            key={article.url}
            className="animate-fadeInUp"
            style={{
              animationDelay: `${index * 0.05}s`,
              animationFillMode: 'both'
            }}
          >
            <ArticleCard
              article={article}
              onOpenModal={setSelectedArticle}
            />
          </div>
        ))}
      </div>

      <ArticleModal
        article={selectedArticle}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </div>
  );
};

function AppWrapper() {
  return (
    <BrowserRouter>
      <OfflineIndicator />
      <ThemeProvider>
        <FavoritesProvider>
          <IOSInstallPrompt />
          <InstallPWA />
          <App />
          <Toaster position="top-right" richColors />
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default AppWrapper;
