import { exportToCSV, exportToJSON } from '../exportUtils';

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() }
}));
import { toast } from 'sonner';

// jsdom n'implémente ni URL.createObjectURL ni Blob.text() : on mocke le
// constructeur Blob pour capturer le contenu réellement passé, plutôt que
// de faire confiance à ce que le code affirme avoir exporté (c'est
// exactement le genre d'écart qui a produit le bug de régression
// StatsPage : "810 articles exportés" alors que l'appel ne récupérait
// que les 15 premiers).
let lastContent = null;
const RealBlob = global.Blob;
beforeEach(() => {
  jest.clearAllMocks();
  lastContent = null;
  global.Blob = jest.fn((parts) => { lastContent = parts.join(''); return new RealBlob(parts); });
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
});

function makeArticles(n) {
  return Array.from({ length: n }, (_, i) => ({
    date: '2026-10-14T12:00:00.000Z',
    secteur: 'IA',
    importance: 3,
    sentiment: 'Positif',
    titre: `Article ${i}`,
    analyse: `Résumé de l'article ${i}`,
    actions: ['AAPL'],
    url: `https://example.com/${i}`,
    tokens: 100
  }));
}

describe('exportToCSV', () => {
  it('exporte autant de lignes que d\'articles reçus (garde-fou anti-régression)', () => {
    const articles = makeArticles(20); // > PAGE_SIZE (15) : si on recevait une page tronquée, ce test le verrait
    exportToCSV(articles, 'veille-tech');

    expect(lastContent).not.toBeNull();
    const lines = lastContent.replace(/^﻿/, '').trim().split('\n');
    // 1 ligne d'en-tête + 20 lignes de données
    expect(lines).toHaveLength(21);
  });

  it('n\'exporte rien et affiche une erreur si la liste est vide', () => {
    exportToCSV([], 'veille-tech');
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('échappe les virgules, guillemets et retours à la ligne', () => {
    const articles = [{
      date: '2026-10-14T12:00:00.000Z',
      secteur: 'IA',
      importance: 3,
      sentiment: 'Positif',
      titre: 'Titre, avec virgule et "guillemets"',
      analyse: 'Ligne 1\nLigne 2',
      actions: [],
      url: 'https://example.com/1',
      tokens: 0
    }];
    exportToCSV(articles, 'veille-tech');
    expect(lastContent).toContain('"Titre, avec virgule et ""guillemets"""');
  });

  it('neutralise une injection de formule Excel (=, +, -, @)', () => {
    const articles = [{
      date: '2026-10-14T12:00:00.000Z',
      secteur: 'IA',
      importance: 3,
      sentiment: 'Positif',
      titre: '=cmd|"/c calc"!A1',
      analyse: 'analyse',
      actions: [],
      url: 'https://example.com/1',
      tokens: 0
    }];
    exportToCSV(articles, 'veille-tech');
    expect(lastContent).not.toMatch(/,=cmd/);
    expect(lastContent).toContain("'=cmd");
  });

  it('ajoute le BOM UTF-8 pour Excel', () => {
    exportToCSV(makeArticles(1), 'veille-tech');
    expect(lastContent.charCodeAt(0)).toBe(0xFEFF);
  });
});

describe('exportToJSON', () => {
  it('exporte un JSON valide contenant tous les articles reçus', () => {
    const articles = makeArticles(20);
    exportToJSON(articles, 'veille-tech');

    expect(lastContent).not.toBeNull();
    const parsed = JSON.parse(lastContent);
    expect(parsed).toHaveLength(20);
    expect(parsed[0].titre).toBe('Article 0');
  });

  it('n\'exporte rien et affiche une erreur si la liste est vide', () => {
    exportToJSON([], 'veille-tech');
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
