import { Star } from "lucide-react";

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

export const renderStars = (count) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${i < count ? "fill-amber-400 text-amber-400" : "text-gray-600"}`}
    />
  ));
};

export const parseAnalysis = (analyse) => {
  if (!analyse) return {};

  // Borner l'input pour éviter le ReDoS sur des analyses très longues
  const safe = analyse.slice(0, 10000);

  const clean = (text) => text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*([^*]{0,300})\*\*/g, '$1')
    .replace(/\*([^*]{0,300})\*/g, '$1')
    .replace(/\[([^\]]{0,200})\]\([^)]{0,500}\)/g, '$1')
    .replace(/[📰🏷️📊🔑💼⚡📈💹🌍]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Découper par sections (#) pour éviter [\s\S]*? sur input illimité
  const sections = safe.split(/\n(?=#)/);

  const extract = (label) => {
    const target = sections.find(s =>
      new RegExp(`^#*\\s*${label}`, 'i').test(s.trim())
    );
    if (!target) return null;
    const body = target.replace(new RegExp(`^#*[^\\n]*${label}[^\\n]*\\n?`, 'i'), '');
    return clean(body) || null;
  };

  const resume = extract('RÉSUMÉ EXÉCUTIF');
  const impact = extract('IMPACT');
  const opportunites = extract('OPPORTUNIT');

  const pointsClesSection = sections.find(s => /^#*\s*POINTS? CLÉS?/i.test(s.trim()));
  let pointsCles = null;
  if (pointsClesSection) {
    pointsCles = pointsClesSection
      .split('\n')
      .slice(1)
      .map(l => clean(l).replace(/^[-•*\d.]+\s*/, ''))
      .filter(l => l.length > 5)
      .slice(0, 20);
    if (pointsCles.length === 0) pointsCles = null;
  }

  return { resume, pointsCles, impact, opportunites };
};
