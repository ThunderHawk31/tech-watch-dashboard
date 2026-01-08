import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent } from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import {
  Home, Bookmark, BarChart3, Info,
  Sun, Moon, Zap, Sparkles
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useFavorites } from "../contexts/FavoritesContext";

export const NavigationMenu = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { isDark, setIsDark } = useTheme();
  const { favorites } = useFavorites();

  const menuItems = [
    {
      path: "/",
      label: "Accueil",
      icon: Home,
      description: "Derniers articles"
    },
    {
      path: "/favoris",
      label: "Favoris",
      icon: Bookmark,
      description: `${favorites.length} articles sauvegardés`,
      badge: favorites.length
    },
    {
      path: "/stats",
      label: "Statistiques",
      icon: BarChart3,
      description: "Analyses et tendances"
    },
    {
      path: "/about",
      label: "À propos",
      icon: Info,
      description: "En savoir plus"
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="w-80 p-0 bg-card border-r border-border">
        <div className="flex flex-col h-full">

          {/* Menu Header avec fond dégradé */}
          <div className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Tech Watch</h2>
                <p className="text-xs text-muted-foreground">Veille IA & Tech</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <ScrollArea className="flex-1 px-4 py-6">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-muted group-hover:bg-primary/20"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.label}</span>
                        {item.badge > 0 && (
                          <Badge variant="secondary" className="h-5 px-2 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-6" />

            {/* Theme Toggle */}
            <div className="px-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl hover:bg-muted transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium">{isDark ? "Mode sombre" : "Mode clair"}</span>
                  <p className="text-xs text-muted-foreground">Changer l'apparence</p>
                </div>
              </button>
            </div>
          </ScrollArea>

          {/* Menu Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span>Propulsé par IA</span>
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
};
