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
  const clean = (text) => text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[📰🏷️📊🔑💼⚡📈💹🌍]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const extract = (label) => {
    const re = new RegExp(`${label}[^\\n#]*[\\n:]?([\\s\\S]*?)(?=\\s*#|$)`, 'i');
    const m = analyse.match(re);
    return m ? clean(m[1]) : null;
  };

  const resume = extract('RÉSUMÉ EXÉCUTIF');
  const impact = extract('IMPACT');
  const opportunites = extract('OPPORTUNIT');

  const pointsClesMatch = analyse.match(/POINTS? CLÉS?[^\n#]*[\n:]?([\s\S]*?)(?=\s*#|$)/i);
  let pointsCles = null;
  if (pointsClesMatch) {
    pointsCles = pointsClesMatch[1]
      .split(/\n|(?<=\.)(?=\s*[-•*]|\s+\d+\.)/)
      .map(l => clean(l).replace(/^[-•*\d.]+\s*/, ''))
      .filter(l => l.length > 5);
    if (pointsCles.length === 0) pointsCles = null;
  }

  return { resume, pointsCles, impact, opportunites };
};
