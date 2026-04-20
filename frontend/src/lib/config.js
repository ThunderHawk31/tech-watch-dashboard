import { Zap, Cpu, TrendingUp, TrendingDown, Coins, Leaf, Heart, HelpCircle, Shield, Minus } from "lucide-react";

export const sectorConfig = {
  "IA": { color: "#8B5CF6", bg: "bg-violet-500/20", text: "text-violet-400", icon: Zap },
  "Tech": { color: "#3B82F6", bg: "bg-blue-500/20", text: "text-blue-400", icon: Cpu },
  "Finance": { color: "#10B981", bg: "bg-emerald-500/20", text: "text-emerald-400", icon: TrendingUp },
  "Crypto": { color: "#F59E0B", bg: "bg-amber-500/20", text: "text-amber-400", icon: Coins },
  "Énergie": { color: "#EAB308", bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Leaf },
  "Santé": { color: "#EC4899", bg: "bg-pink-500/20", text: "text-pink-400", icon: Heart },
  "Cybersécurité": { color: "#EF4444", bg: "bg-red-500/20", text: "text-red-400", icon: Shield },
  "Autre": { color: "#6B7280", bg: "bg-gray-500/20", text: "text-gray-400", icon: HelpCircle },
};

export const sentimentConfig = {
  "Positif": { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: TrendingUp },
  "Négatif": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: TrendingDown },
  "Neutre": { bg: "bg-gray-100 dark:bg-gray-700/30", text: "text-gray-700 dark:text-gray-400", icon: Minus },
};
