import { memo } from "react";
import { toast } from "sonner";
import { Star, Languages, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { sectorConfig, sentimentConfig } from "../lib/config";
import { formatDate, renderStars } from "../lib/appUtils";
import { sanitizeText } from "../utils/sanitizer";
import { useLang } from "../contexts/LangContext";
import { useFavorites as useFavoritesContext } from "../contexts/FavoritesContext";
import { ShareButton } from "./ShareButton";

const ArticleCard = memo(({ article, onOpenModal, onTickerClick, activeTicker }) => {
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const { lang, setLang } = useLang();
  const sector = sectorConfig[article.secteur] || sectorConfig["Autre"];
  const sentiment = sentimentConfig[article.sentiment] || sentimentConfig["Neutre"];
  const SectorIcon = sector.icon;
  const SentimentIcon = sentiment.icon;

  const isArticleFavorite = isFavorite(article.url);

  const getTitle = () => {
    if (lang === 'en' && article.titre_en && article.titre_en.length > 5) {
      return article.titre_en;
    }
    if (article.titre && article.titre !== 'undefined' && article.titre.length > 5) {
      return article.titre.replace(/^\(/, '').replace(/\)$/, '').trim();
    }
    if (article.analyse) {
      if (article.analyse.trimStart().startsWith('{')) {
        try {
          const j = JSON.parse(article.analyse);
          const text = (j.titre || (j.resume || '').split('\n')[0]).trim();
          if (text.length > 5) return text.length > 80 ? text.substring(0, 77) + '...' : text;
        } catch { /* fall through */ }
      }
      const cleaned = article.analyse.replace(/[#*`📰🏷️📊🔑💼⚡📈💹]/g, '').trim();
      const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
      for (const line of lines) {
        if (line.length > 20 && !line.match(/^(TITRE|SECTEUR|RÉSUMÉ|POINTS|IMPACT|OPPORTUNITÉS|IMPORTANCE|SENTIMENT)/i)) {
          return line.length > 80 ? line.substring(0, 77) + '...' : line;
        }
      }
    }
    return "Article de veille technologique";
  };

  const getArticlePreview = (analyse, maxChars = 200) => {
    if (!analyse) return '';
    if (analyse.trimStart().startsWith('{')) {
      try {
        const j = JSON.parse(analyse);
        const text = (j.resume || '').trim();
        if (text) {
          if (text.length <= maxChars) return text;
          const lastDot = text.lastIndexOf('.', maxChars);
          if (lastDot >= maxChars * 0.5) return text.substring(0, lastDot + 1);
          return text.substring(0, maxChars) + '…';
        }
      } catch { /* fall through */ }
    }
    let normalized = analyse.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
    if ((normalized.match(/\n/g) || []).length < 3) normalized = normalized.replace(/ # /g, '\n# ');
    const m = normalized.match(/RÉSUMÉ EXÉCUTIF[:\s]*([\s\S]*?)(?=\n#|$)/i);
    const raw = m ? m[1].split('\n')[0].trim() || m[1].trim() : normalized;
    const cleaned = raw
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[📰🏷️📊🔑💼⚡📈💹]/g, '')
      .replace(/\(([^)]+)\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();
    if (!cleaned) return '';
    if (cleaned.length <= maxChars) return cleaned;
    const lastDot = cleaned.lastIndexOf('.', maxChars);
    if (lastDot >= maxChars * 0.5) return cleaned.substring(0, lastDot + 1);
    return cleaned.substring(0, maxChars) + '…';
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    const added = toggleFavorite(article);
    if (added) {
      toast.success("Ajouté aux favoris !", { icon: "⭐" });
    } else {
      toast.info("Retiré des favoris");
    }
  };

  return (
    <Card
      className={`group cursor-pointer bg-card hover:bg-card/80 transition-all duration-300 hover:-translate-y-1${article.importance >= 5 ? ' card-top' : ''}`}
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
              <Star className={`w-5 h-5 transition-colors ${isArticleFavorite ? "fill-amber-400 text-amber-400" : "text-gray-600 hover:text-amber-400"}`} />
            </button>
            <div className="flex items-center gap-0.5">
              {renderStars(article.importance)}
            </div>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors flex items-start justify-between gap-2">
          <span>{sanitizeText(getTitle())}</span>
          {article.titre_en && (
            <button
              onClick={(e) => { e.stopPropagation(); setLang(lang === 'fr' ? 'en' : 'fr'); }}
              className={`shrink-0 mt-0.5 p-1 rounded-md transition-colors ${lang === 'en' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              title={lang === 'fr' ? 'Voir en anglais' : 'Voir en français'}
            >
              <Languages className="w-3.5 h-3.5" />
            </button>
          )}
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
          {getArticlePreview(article.analyse)}
        </p>
        {article.actions && article.actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Actions :</span>
            {(article.actions || []).map((action, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className={`text-xs cursor-pointer transition-colors ${activeTicker === action ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-primary/10'}`}
                onClick={(e) => { e.stopPropagation(); onTickerClick?.(action); }}
              >
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

export default ArticleCard;
