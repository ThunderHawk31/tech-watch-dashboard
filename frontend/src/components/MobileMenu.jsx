import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, BarChart3, Star, Info } from 'lucide-react';
import { Button } from './ui/button';

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/stats', label: 'Stats', icon: BarChart3 },
    { path: '/favoris', label: 'Favoris', icon: Star },
    { path: '/about', label: 'À propos', icon: Info },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Bouton Hamburger - visible uniquement sur mobile */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed top-16 right-0 w-64 h-[calc(100vh-4rem)] bg-slate-900 border-l border-white/10 z-50 md:hidden animate-in slide-in-from-right duration-300">
            <nav className="flex flex-col gap-2 p-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
};
