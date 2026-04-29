import { useState, useEffect } from "react";
import { validateFilters } from "../validation/filters";
import { sectorConfig } from "../lib/config";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const FiltersBar = ({ filters, setFilters }) => {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    const { isValid, errors } = validateFilters(newFilters);
    if (!isValid) console.warn('⚠️ Filtres invalides:', errors);
    setFilters(newFilters);
  };

  const toggleSector = (name) => {
    const current = filters.sectors || [];
    const next = current.includes(name)
      ? current.filter(s => s !== name)
      : [...current, name];
    setFilters(prev => ({ ...prev, sectors: next }));
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-border">
      <div className="flex flex-col gap-4">
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
            <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Récent</SelectItem>
                <SelectItem value="importance">Score</SelectItem>
                <SelectItem value="az">A–Z</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sentiment} onValueChange={(value) => handleFilterChange('sentiment', value)}>
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

            <Select value={filters.minImportance} onValueChange={(value) => handleFilterChange('minImportance', value)}>
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
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(sectorConfig).map(([name, cfg]) => {
            const Icon = cfg.icon;
            const active = (filters.sectors || []).includes(name);
            return (
              <button
                key={name}
                onClick={() => toggleSector(name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-150 ${
                  active
                    ? 'border-transparent text-white font-medium'
                    : 'border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
                style={active ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
              >
                <Icon className="w-3.5 h-3.5" style={active ? {} : { color: cfg.color }} />
                {name}
              </button>
            );
          })}
          {(filters.sectors || []).length > 0 && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, sectors: [] }))}
              className="px-3 py-1.5 rounded-full text-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              Tout afficher
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
