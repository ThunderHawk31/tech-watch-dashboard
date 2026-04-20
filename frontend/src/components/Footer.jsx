import { Link } from "react-router-dom";
import { Zap, Github, Linkedin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-16 py-8 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-6">
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

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Accueil</Link></li>
              <li><Link to="/stats" className="text-muted-foreground hover:text-foreground transition-colors">Statistiques</Link></li>
              <li><Link to="/favoris" className="text-muted-foreground hover:text-foreground transition-colors">Mes Favoris</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">À propos</Link></li>
              <li><Link to="/mentions-legales" className="text-muted-foreground hover:text-foreground transition-colors">Mentions légales</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <a href="https://github.com/ThunderHawk31" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Profil GitHub">
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a href="https://linkedin.com/in/nolan-macé-b8647738a" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Profil LinkedIn">
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
              </div>
              <a href="mailto:nolan.mace49@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Contact</span>
              </a>
              <div className="flex flex-wrap gap-1 pt-2">
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full">React</span>
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full">n8n</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <p>© {currentYear} Tech Watch Dashboard</p>
              <span className="hidden md:inline">•</span>
              <p className="hidden md:inline">Créé par Nolan</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
