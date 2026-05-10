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

const normalizeForParsing = (text) => {
  if (!text) return '';
  let t = text.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\r\n/g, '\n');
  // Texte sur une ligne (format DB) : insérer un saut avant chaque section "#"
  if ((t.match(/\n/g) || []).length < 3) {
    t = t.replace(/ # /g, '\n# ');
  }
  return t;
};

export const parseAnalysis = (analyse) => {
  if (!analyse) return {};

  const safe = normalizeForParsing(analyse).slice(0, 10000);

  const clean = (text) => text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*([^*]{0,300})\*\*/g, '$1')
    .replace(/\*([^*]{0,300})\*/g, '$1')
    .replace(/\[([^\]]{0,200})\]\([^)]{0,500}\)/g, '$1')
    .replace(/[📰🏷️📊📋🔑💼⚡📈💹🌍⭐]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const sections = safe.split(/\n(?=#)/);

  // Extrait le contenu après le label, qu'il soit inline ou sur la ligne suivante
  const extract = (label) => {
    const target = sections.find(s => new RegExp(label, 'i').test(s));
    if (!target) return null;
    const m = target.match(new RegExp(`${label}[:\\s]*`, 'i'));
    if (!m) return null;
    const body = target.slice(m.index + m[0].length).split('\n')[0].trim()
      || target.slice(m.index + m[0].length).trim();
    return clean(body) || null;
  };

  const extractSection = (keyword) => {
    const regex = new RegExp(`#[^\\n]*${keyword}[^\\n]*\\n([\\s\\S]*?)(?=\\n#|$)`, 'i');
    const match = safe.match(regex);
    return match ? clean(match[1].trim()) || null : null;
  };

  const resume = extract('RÉSUMÉ EXÉCUTIF');
  const impact = extractSection('IMPACT');
  const opportunites = extractSection('OPPORTUNIT');

  const pointsClesSection = sections.find(s => /POINTS? CLÉS?/i.test(s));
  let pointsCles = null;
  if (pointsClesSection) {
    const m = pointsClesSection.match(/POINTS? CLÉS?[:\s]*/i);
    const body = m ? pointsClesSection.slice(m.index + m[0].length) : '';
    const items = body.includes('\n')
      ? body.split('\n')
      : body.split(/ - (?=[A-ZÀÂÉÈÊÎÏÔÙÛÜ])/);
    pointsCles = items
      .map(l => clean(l).replace(/^[-•*\d.]+\s*/, ''))
      .filter(l => l.length > 5)
      .slice(0, 20);
    if (pointsCles.length === 0) pointsCles = null;
  }

  return { resume, pointsCles, impact, opportunites };
};
