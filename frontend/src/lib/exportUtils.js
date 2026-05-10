import { toast } from 'sonner';

export function exportToCSV(articles, filename = 'veille-tech') {
  if (!articles || articles.length === 0) {
    toast.error('❌ Aucun article à exporter', {
      description: 'La liste est vide'
    });
    return;
  }

  try {
    // Colonnes du CSV
    const headers = [
      'Date',
      'Secteur',
      'Importance',
      'Sentiment',
      'Titre',
      'Analyse',
      'Actions',
      'URL',
      'Tokens'
    ];

    // Fonction pour échapper les caractères spéciaux CSV
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '';
      let stringified = String(str);
      // Protection formula injection Excel/LibreOffice
      if (/^[=+\-@\t\r]/.test(stringified)) {
        stringified = "'" + stringified;
      }
      if (stringified.includes(',') || stringified.includes('\n') || stringified.includes('"')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    // Construire les lignes CSV
    const rows = articles.map(article => [
      new Date(article.date).toLocaleDateString('fr-FR'),
      article.secteur || '',
      article.importance || '',
      article.sentiment || '',
      article.titre || extractTitleFromAnalyse(article.analyse) || 'Sans titre',
      cleanAnalyseForExport(article.analyse || ''),
      Array.isArray(article.actions) ? article.actions.join(', ') : article.actions || '',
      article.url || '',
      article.tokens || ''
    ]);

    // Créer le contenu CSV
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Ajouter BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Télécharger le fichier
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Toast de succès
    toast.success('📊 Export CSV réussi !', {
      description: `${articles.length} articles exportés`
    });
  } catch (error) {
    console.error('Erreur export CSV:', error);
    toast.error('❌ Erreur lors de l\'export', {
      description: 'Veuillez réessayer'
    });
  }
}

// Fonction helper pour nettoyer l'analyse
function cleanAnalyseForExport(analyse) {
  if (analyse.trimStart().startsWith('{')) {
    try {
      const j = JSON.parse(analyse);
      const parts = [
        j.resume,
        Array.isArray(j.points_cles) ? j.points_cles.join(' - ') : j.points_cles,
        j.impact_marches,
        j.opportunites,
      ].filter(Boolean);
      return parts.join(' ').trim().substring(0, 500);
    } catch { /* fall through */ }
  }
  return analyse
    .replace(/[#*`📰🏷️📊🔑💼⚡📈💹]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 500);
}

// Fonction helper pour extraire titre
function extractTitleFromAnalyse(analyse) {
  if (!analyse) return '';
  if (analyse.trimStart().startsWith('{')) {
    try {
      const j = JSON.parse(analyse);
      const text = (j.titre || (j.resume || '').split('\n')[0]).trim();
      return text.length > 80 ? text.substring(0, 77) + '...' : text;
    } catch { /* fall through */ }
  }
  const cleaned = analyse.replace(/[#*`📰🏷️📊🔑💼⚡📈💹]/g, '').trim();
  const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
  for (const line of lines) {
    if (line.length > 20 && !line.match(/^(TITRE|SECTEUR|RÉSUMÉ|POINTS|IMPACT)/i)) {
      return line.length > 80 ? line.substring(0, 77) + '...' : line;
    }
  }
  return '';
}

// Export JSON (bonus)
export function exportToJSON(articles, filename = 'veille-tech') {
  if (!articles || articles.length === 0) {
    toast.error('❌ Aucun article à exporter', {
      description: 'La liste est vide'
    });
    return;
  }

  try {
    const jsonContent = JSON.stringify(articles, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timestamp}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('📄 Export JSON réussi !', {
      description: `${articles.length} articles exportés`
    });
  } catch (error) {
    console.error('Erreur export JSON:', error);
    toast.error('❌ Erreur lors de l\'export', {
      description: 'Veuillez réessayer'
    });
  }
}
