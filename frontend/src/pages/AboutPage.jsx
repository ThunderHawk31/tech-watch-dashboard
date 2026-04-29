import { Zap, Cpu, Info, TrendingUp, Star, Heart, BookOpen, ChevronRight, Github, Linkedin } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">À propos du projet</h1>
        <p className="text-xl text-muted-foreground">Un système de veille technologique automatisé alimenté par l'IA</p>
      </div>

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

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            Comment ça fonctionne ?
          </h2>
          <div className="space-y-6">
            {[
              {
                n: 1, title: "Collecte automatique (n8n)",
                text: <>Un workflow n8n s'exécute <strong>2 fois par jour</strong> (10h30 et 18h30) pour récupérer les flux RSS de sources de référence : TechCrunch, O'Reilly, The Hacker News, CoinDesk, HuggingFace, etc.</>
              },
              {
                n: 2, title: "Analyse par IA (Claude API)",
                text: <>Chaque article est analysé par <strong>Claude 4 Sonnet</strong> qui extrait : le secteur, l'importance (1-5⭐), le sentiment, les actions boursières mentionnées, et génère un résumé structuré.</>
              },
              {
                n: 3, title: "Stockage (Supabase)",
                text: "Les analyses sont automatiquement enregistrées dans Supabase (PostgreSQL), avec dédoublonnage par URL et accès direct depuis le frontend."
              },
              {
                n: 4, title: "Affichage (React + Vercel)",
                text: "Ce dashboard React consulte l'API n8n pour afficher les articles avec filtres, recherche, favoris et statistiques. Déployé sur Vercel pour une disponibilité 24/7."
              }
            ].map(({ n, title, text }) => (
              <div key={n} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{n}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {[
                { icon: <BookOpen className="w-8 h-8 text-orange-500" />, bg: "bg-orange-500/20", label: "RSS Feeds" },
                { icon: <Zap className="w-8 h-8 text-blue-500" />, bg: "bg-blue-500/20", label: "n8n" },
                { icon: <Cpu className="w-8 h-8 text-purple-500" />, bg: "bg-purple-500/20", label: "Claude AI" },
                { icon: <TrendingUp className="w-8 h-8 text-green-500" />, bg: "bg-green-500/20", label: "Supabase" },
                { icon: <Zap className="w-8 h-8 text-primary" />, bg: "bg-primary/20", label: "Dashboard" },
              ].map(({ icon, bg, label }, i, arr) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-2 rounded-full ${bg} flex items-center justify-center`}>{icon}</div>
                    <p className="text-sm font-medium">{label}</p>
                  </div>
                  {i < arr.length - 1 && <ChevronRight className="w-6 h-6 text-muted-foreground hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-primary" />
            Pourquoi ce projet ?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <TrendingUp className="w-5 h-5 text-emerald-500" />, title: "Problème résolu", text: "La veille technologique manuelle est chronophage (2-3h/jour) et subjective. Ce système automatise entièrement le processus tout en garantissant une analyse objective et structurée grâce à l'IA." },
              { icon: <Zap className="w-5 h-5 text-amber-500" />, title: "Compétences développées", text: "Automatisation avec n8n, intégration d'API (Claude, Google), développement React, déploiement cloud (Railway, Vercel), et conception de systèmes distribués." },
              { icon: <Star className="w-5 h-5 text-violet-500" />, title: "Valeur ajoutée", text: "Gain de temps significatif, analyses objectives et structurées, historique complet consultable, et système évolutif pour ajouter de nouvelles sources." },
              { icon: <Heart className="w-5 h-5 text-pink-500" />, title: "Objectif pédagogique", text: "Démontrer ma capacité à concevoir et déployer une solution technique complète, de l'analyse du besoin à la mise en production, dans le cadre de mon BTS SIO SISR." },
            ].map(({ icon, title, text }) => (
              <div key={title}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">{icon}{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            Technologies utilisées
          </h2>
          <div className="space-y-6">
            {[
              { color: "text-blue-400", label: "⚙️ Automatisation & Backend", badges: ["n8n (Workflow automation)", "Claude 4 Sonnet API", "Supabase (PostgreSQL)", "Railway (hosting)"] },
              { color: "text-violet-400", label: "🎨 Frontend", badges: ["React 18", "React Router", "Tailwind CSS", "shadcn/ui", "Recharts", "Lucide Icons"] },
              { color: "text-emerald-400", label: "🚀 Déploiement", badges: ["Vercel (Frontend)", "Railway (Backend n8n)", "GitHub (Version control)"] },
              { color: "text-amber-400", label: "🛠️ Outils & Services", badges: ["Supabase (Database)", "RSS Feeds", "localStorage (Cache)"] },
            ].map(({ color, label, badges }) => (
              <div key={label}>
                <h3 className={`font-semibold mb-3 ${color}`}>{label}</h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map(b => <Badge key={b} variant="secondary" className="px-3 py-1">{b}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Statistiques du système
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ val: "+40", label: "Articles/jour" }, { val: "2×", label: "Exécutions/jour" }, { val: "90%", label: "Gain de temps" }, { val: "24/7", label: "Disponibilité" }].map(({ val, label }) => (
              <div key={label} className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-primary">{val}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Contact & Liens</h2>
          <div className="space-y-3">
            <p className="text-muted-foreground"><strong className="text-foreground">Développé par :</strong> Nolan - Étudiant BTS SIO SISR</p>
            <div className="flex items-center gap-4 pt-4">
              <a href="https://github.com/ThunderHawk31" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" /><span>GitHub</span>
              </a>
              <a href="https://linkedin.com/in/nolan-macé-b8647738a" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-5 h-5" /><span>LinkedIn</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;
