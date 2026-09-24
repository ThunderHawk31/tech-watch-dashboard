import { TrendingUp, Cpu, Shield, Layers } from "lucide-react";

// Packs groupés (décision Nolan, 2026-09-23 — liste finale, pas 1 pack par
// secteur). "sectors: []" (Généraliste) = pas de filtre du tout ; c'est aussi
// le seul moyen d'atteindre Énergie/Santé/Autre, qui n'ont pas de pack dédié.
export const packs = [
  {
    id: "finance",
    label: "Finance",
    description: "Marchés, résultats d'entreprises, crypto et macro.",
    sectors: ["Finance", "Crypto"],
    icon: TrendingUp,
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
  },
  {
    id: "tech-ia",
    label: "Tech & IA",
    description: "Produits tech, plateformes et actualité IA.",
    sectors: ["Tech", "IA"],
    icon: Cpu,
    bg: "bg-blue-500/20",
    text: "text-blue-400",
  },
  {
    id: "cybersecurite",
    label: "Cybersécurité",
    description: "Failles, incidents, outils de défense.",
    sectors: ["Cybersécurité"],
    icon: Shield,
    bg: "bg-red-500/20",
    text: "text-red-400",
  },
  {
    id: "generaliste",
    label: "Généraliste",
    description: "Tous les secteurs, sans filtre — y compris Énergie, Santé et Autre.",
    sectors: [],
    icon: Layers,
    bg: "bg-gray-500/20",
    text: "text-gray-400",
  },
];
