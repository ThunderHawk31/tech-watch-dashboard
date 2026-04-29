import { useState, useEffect } from "react";
import { fetchSectorHeat } from "../api";
import { sectorConfig } from "../lib/config";

const SectorHeatWidget = ({ expanded = false }) => {
  const [sectors, setSectors] = useState([]);

  useEffect(() => {
    fetchSectorHeat().then(setSectors);
  }, []);

  if (!sectors.length) return <p className="text-sm text-muted-foreground">Aucune donnée disponible.</p>;

  const max = sectors[0]?.heat_score || 1;

  if (!expanded) {
    return (
      <div className="flex flex-wrap gap-2">
        {sectors.map((s) => {
          const cfg = sectorConfig[s.sector] || sectorConfig["Autre"];
          const Icon = cfg.icon;
          const intensity = Math.round((s.heat_score / max) * 100);
          return (
            <div key={s.sector} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border text-sm">
              <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              <span>{s.sector}</span>
              <span className="text-xs text-muted-foreground ml-1">{intensity}%</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sectors.map((s) => {
        const cfg = sectorConfig[s.sector] || sectorConfig["Autre"];
        const Icon = cfg.icon;
        const intensity = Math.round((s.heat_score / max) * 100);
        return (
          <div key={s.sector} className="flex items-center gap-4 p-4 rounded-xl bg-card/60 border border-border">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted shrink-0">
              <Icon className="w-5 h-5" style={{ color: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{s.sector}</span>
                <span className="text-xs text-muted-foreground">{intensity}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${intensity}%`, backgroundColor: cfg.color }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SectorHeatWidget;
