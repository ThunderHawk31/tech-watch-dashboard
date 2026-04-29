import { toast } from "sonner";
import { ExternalLink, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { sectorConfig, sentimentConfig } from "../lib/config";
import { formatDate, renderStars, parseAnalysis } from "../lib/appUtils";
import { sanitizeURL } from "../utils/sanitizer";
import { useLang } from "../contexts/LangContext";

const ArticleModal = ({ article, open, onClose }) => {
  if (!article) return null;

  const { lang } = useLang();
  const modalTitle = lang === 'en' && article.titre_en
    ? article.titre_en
    : (article.titre || article.url.split('/').pop().replace(/-/g, ' '));

  const sector = sectorConfig[article.secteur] || sectorConfig["Autre"];
  const sentiment = sentimentConfig[article.sentiment] || sentimentConfig["Neutre"];
  const SectorIcon = sector.icon;
  const SentimentIcon = sentiment.icon;

  const { resume, pointsCles, impact, opportunites } = parseAnalysis(article.analyse);

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
          <DialogTitle className="text-xl leading-tight pr-8">{modalTitle}</DialogTitle>
          <DialogDescription>{formatDate(article.date)}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="flex flex-col gap-4 text-sm">
            {resume && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Résumé</p>
                <p className="text-foreground leading-relaxed">{resume}</p>
              </div>
            )}
            {pointsCles && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Points clés</p>
                <ul className="flex flex-col gap-1">
                  {pointsCles.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-foreground leading-relaxed">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {impact && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Impact marchés</p>
                <p className="text-foreground leading-relaxed">{impact}</p>
              </div>
            )}
            {opportunites && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Opportunités</p>
                <p className="text-foreground leading-relaxed">{opportunites}</p>
              </div>
            )}
            {!resume && !pointsCles && !impact && !opportunites && (
              <p className="text-muted-foreground">{article.analyse}</p>
            )}
          </div>
        </ScrollArea>

        {article.actions && article.actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap py-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Actions mentionnées :</span>
            {(article.actions || []).map(action => (
              <Badge key={action} variant="secondary" className="font-mono">{action}</Badge>
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
            onClick={() => {
              const link = `${window.location.origin}/?article=${article.id}`;
              navigator.clipboard.writeText(link);
              toast.success("Lien TechWatch copié !");
            }}
            aria-label="Copier le lien TechWatch"
            title="Copier le lien de partage TechWatch"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleModal;
