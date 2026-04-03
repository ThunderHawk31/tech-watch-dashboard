import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bookmark, Zap, Menu, Sun, Moon } from "lucide-react";
import { NavigationMenu } from "./NavigationMenu";
import { useFavorites } from "../contexts/FavoritesContext";
import { useTheme } from "../contexts/ThemeContext";
import { Badge } from "./ui/badge";
import { InstallButton } from './InstallButton';

export const HeaderNew = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { favorites, count } = useFavorites();
  const { isDark, setIsDark } = useTheme();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border safe-area-header">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo - Sur desktop = Link normal, sur mobile = bouton menu */}
            <div className="flex items-center gap-3">
              {/* Mobile: Logo cliquable = bouton menu */}
              <button
                onClick={() => setMenuOpen(true)}
                className="flex items-center gap-3 group md:hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl hidden sm:block">Tech Watch</span>
              </button>

              {/* Desktop: Logo normal comme avant */}
              <Link to="/" className="hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">Tech Watch</span>
              </Link>
            </div>

            {/* Navigation desktop - cachée sur mobile (comme avant) */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Accueil
              </Link>
              <Link
                to="/stats"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/stats') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Stats
              </Link>
              <Link
                to="/favoris"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive('/favoris') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Favoris
                {count > 0 && (
                  <Badge className="bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                    {count}
                  </Badge>
                )}
              </Link>
              <Link
                to="/tendances"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/tendances') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Tendances
              </Link>
              <Link
                to="/about"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/about') ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                À propos
              </Link>
            </nav>

            {/* Actions - Desktop: boutons classiques, Mobile: badge favoris uniquement */}
            <div className="flex items-center gap-3">
              {/* Desktop: Boutons d'actions complets */}
              <div className="hidden md:flex items-center gap-3">
                <InstallButton />

                <button
                  onClick={() => setIsDark(!isDark)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              {/* Mobile: Badge favoris uniquement (le toggle theme est dans le menu) */}
              <Link
                to="/favoris"
                className="relative p-2 rounded-lg hover:bg-muted transition-colors md:hidden"
              >
                <Bookmark className="w-5 h-5" />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </header>

      {/* Menu Drawer - uniquement sur mobile */}
      <NavigationMenu isOpen={menuOpen} setIsOpen={setMenuOpen} />
    </>
  );
};
