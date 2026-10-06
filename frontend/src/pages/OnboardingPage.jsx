import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, X, Plus } from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { useOnboardingSelection } from "../hooks/useOnboardingSelection";
import { packs } from "../lib/packs";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const OnboardingPage = () => {
  const seo = useSEO({
    title: "Personnalisez votre veille",
    description: "Choisissez vos secteurs d'intérêt et ajoutez vos sources pour un dashboard Tech Watch personnalisé.",
  });
  const navigate = useNavigate();
  const { selection, togglePack, addCustomSource, removeCustomSource, categoriesParam } = useOnboardingSelection();
  const [urlInput, setUrlInput] = useState("");
  const [labelInput, setLabelInput] = useState("");

  const handleAddSource = (e) => {
    e.preventDefault();
    const { error } = addCustomSource({ url: urlInput, label: labelInput });
    if (error) {
      toast.error(error);
      return;
    }
    setUrlInput("");
    setLabelInput("");
    toast.success("Source ajoutée");
  };

  const handleValidate = () => {
    navigate(categoriesParam ? `/app?categories=${encodeURIComponent(categoriesParam)}` : "/app");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {seo}
      <div className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Personnalisez votre veille</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choisissez les secteurs qui vous intéressent et ajoutez vos propres sources.
          Vous pourrez tout changer plus tard depuis le dashboard.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Vos packs</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packs.map(({ id, label, description, icon: Icon, bg, text }) => {
            const checked = selection.packs.includes(id);
            return (
              <Card
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => togglePack(id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePack(id); } }}
                className={`cursor-pointer transition-colors ${checked ? "border-primary" : "border-border"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${text}`} />
                    </div>
                    <Checkbox checked={checked} onCheckedChange={() => togglePack(id)} onClick={(e) => e.stopPropagation()} />
                  </div>
                  <h3 className="font-semibold mb-1">{label}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Vos sources perso (optionnel)</h2>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleAddSource} className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <Label htmlFor="source-url" className="sr-only">URL de la source</Label>
                <Input
                  id="source-url"
                  type="url"
                  placeholder="https://exemple.com/flux"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
              <div className="sm:w-56">
                <Label htmlFor="source-label" className="sr-only">Nom (optionnel)</Label>
                <Input
                  id="source-label"
                  type="text"
                  placeholder="Nom (optionnel)"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  maxLength={80}
                />
              </div>
              <Button type="submit" disabled={!urlInput.trim()}>
                <Plus className="w-4 h-4" /> Ajouter
              </Button>
            </form>

            {selection.customSources.length > 0 ? (
              <ul className="space-y-2">
                {selection.customSources.map((source) => (
                  <li key={source.url} className="flex items-center justify-between gap-3 p-2 rounded-md bg-muted/50">
                    <Badge variant="secondary" className="truncate max-w-[70%]">{source.label}</Badge>
                    <button
                      type="button"
                      onClick={() => removeCustomSource(source.url)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Retirer ${source.label}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune source ajoutée pour l'instant.</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Ces sources sont enregistrées sur cet appareil uniquement — elles n'alimentent pas encore le dashboard automatiquement.
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col items-center gap-4">
        <Button size="lg" onClick={handleValidate} className="px-10">
          <Check className="w-4 h-4" /> Voir mon dashboard
        </Button>
        <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
          Accéder directement au dashboard
        </Link>
      </div>
    </div>
  );
};

export default OnboardingPage;
