/**
 * Tests unitaires pour la validation Joi des filtres
 *
 * Ces tests vérifient que la validation fonctionne correctement
 * pour tous les cas d'usage (valides et invalides)
 */

import { validateFilters, sanitizeSearch } from '../filters';

describe('Validation Joi - Filtres', () => {

  // ============================================================
  // TEST 1: RECHERCHE (search)
  // ============================================================

  describe('Recherche (search)', () => {
    test('✅ Accepte recherche valide (50 caractères)', () => {
      const result = validateFilters({ search: 'a'.repeat(50) });
      expect(result.isValid).toBe(true);
      expect(result.value.search).toBe('a'.repeat(50));
    });

    test('✅ Accepte recherche vide', () => {
      const result = validateFilters({ search: '' });
      expect(result.isValid).toBe(true);
    });

    test('❌ Rejette recherche trop longue (>100)', () => {
      const result = validateFilters({ search: 'a'.repeat(150) });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('search');
      expect(result.errors[0].message).toContain('100 caractères');
    });

    test('✅ sanitizeSearch tronque à 100 caractères', () => {
      const longSearch = 'a'.repeat(150);
      const sanitized = sanitizeSearch(longSearch);
      expect(sanitized.length).toBeLessThanOrEqual(100);
    });

    test('✅ sanitizeSearch supprime < et >', () => {
      const result = sanitizeSearch('<script>alert("xss")</script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  // ============================================================
  // TEST 2: SECTEUR (sector)
  // ============================================================

  describe('Secteur (sector)', () => {
    const validSectors = ['Tous', 'IA', 'Tech', 'Finance', 'Crypto', 'Énergie', 'Santé', 'Autre'];

    validSectors.forEach(sector => {
      test(`✅ Accepte secteur valide: "${sector}"`, () => {
        const result = validateFilters({ sector });
        expect(result.isValid).toBe(true);
        expect(result.value.sector).toBe(sector);
      });
    });

    test('❌ Rejette secteur invalide', () => {
      const result = validateFilters({ sector: 'InvalidSector' });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('sector');
    });

    test('❌ Rejette injection XSS', () => {
      const result = validateFilters({ sector: '<script>alert("xss")</script>' });
      expect(result.isValid).toBe(false);
    });

    test('✅ Utilise "Tous" par défaut si non fourni', () => {
      const result = validateFilters({});
      expect(result.isValid).toBe(true);
      expect(result.value.sector).toBe('Tous');
    });
  });

  // ============================================================
  // TEST 3: SENTIMENT (sentiment)
  // ============================================================

  describe('Sentiment (sentiment)', () => {
    const validSentiments = ['Tous', 'Positif', 'Négatif', 'Neutre'];

    validSentiments.forEach(sentiment => {
      test(`✅ Accepte sentiment valide: "${sentiment}"`, () => {
        const result = validateFilters({ sentiment });
        expect(result.isValid).toBe(true);
        expect(result.value.sentiment).toBe(sentiment);
      });
    });

    test('❌ Rejette sentiment invalide', () => {
      const result = validateFilters({ sentiment: 'BadSentiment' });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('sentiment');
    });

    test('✅ Utilise "Tous" par défaut', () => {
      const result = validateFilters({});
      expect(result.value.sentiment).toBe('Tous');
    });
  });

  // ============================================================
  // TEST 4: IMPORTANCE (minImportance)
  // ============================================================

  describe('Importance (minImportance)', () => {
    test('✅ Accepte importance valide (0-5)', () => {
      [0, 1, 2, 3, 4, 5].forEach(importance => {
        const result = validateFilters({ minImportance: importance });
        expect(result.isValid).toBe(true);
        expect(result.value.minImportance).toBe(importance);
      });
    });

    test('✅ Accepte importance en string', () => {
      const result = validateFilters({ minImportance: '3' });
      expect(result.isValid).toBe(true);
      expect(result.value.minImportance).toBe(3); // Converti en nombre
    });

    test('❌ Rejette importance trop haute (>5)', () => {
      const result = validateFilters({ minImportance: 999 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('minImportance');
      expect(result.errors[0].message).toContain('5');
    });

    test('❌ Rejette importance négative', () => {
      const result = validateFilters({ minImportance: -10 });
      expect(result.isValid).toBe(false);
    });

    test('❌ Rejette importance non-numérique', () => {
      const result = validateFilters({ minImportance: 'invalid' });
      expect(result.isValid).toBe(false);
    });

    test('✅ Utilise 0 par défaut', () => {
      const result = validateFilters({});
      expect(result.value.minImportance).toBe(0);
    });
  });

  // ============================================================
  // TEST 5: TRI (sort)
  // ============================================================

  describe('Tri (sort)', () => {
    test('✅ Accepte "recent"', () => {
      const result = validateFilters({ sort: 'recent' });
      expect(result.isValid).toBe(true);
      expect(result.value.sort).toBe('recent');
    });

    test('✅ Accepte "importance"', () => {
      const result = validateFilters({ sort: 'importance' });
      expect(result.isValid).toBe(true);
      expect(result.value.sort).toBe('importance');
    });

    test('❌ Rejette tri invalide', () => {
      const result = validateFilters({ sort: 'badSort' });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('sort');
    });

    test('✅ Utilise "recent" par défaut', () => {
      const result = validateFilters({});
      expect(result.value.sort).toBe('recent');
    });
  });

  // ============================================================
  // TEST 6: PAGE (page)
  // ============================================================

  describe('Page (page)', () => {
    test('✅ Accepte page valide (1-1000)', () => {
      [1, 10, 500, 1000].forEach(page => {
        const result = validateFilters({ page });
        expect(result.isValid).toBe(true);
        expect(result.value.page).toBe(page);
      });
    });

    test('❌ Rejette page négative', () => {
      const result = validateFilters({ page: -5 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('page');
      expect(result.errors[0].message).toContain('minimum est 1');
    });

    test('❌ Rejette page 0', () => {
      const result = validateFilters({ page: 0 });
      expect(result.isValid).toBe(false);
    });

    test('❌ Rejette page trop haute (>1000)', () => {
      const result = validateFilters({ page: 99999 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('maximum est 1000');
    });

    test('❌ Rejette page non-numérique', () => {
      const result = validateFilters({ page: 'notanumber' });
      expect(result.isValid).toBe(false);
    });

    test('✅ Utilise 1 par défaut', () => {
      const result = validateFilters({});
      expect(result.value.page).toBe(1);
    });
  });

  // ============================================================
  // TEST 7: COMBINAISONS MULTIPLES
  // ============================================================

  describe('Combinaisons multiples', () => {
    test('✅ Accepte tous les filtres valides', () => {
      const filters = {
        search: 'crypto',
        sector: 'Finance',
        sentiment: 'Positif',
        minImportance: 3,
        sort: 'recent',
        page: 1
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(true);
      expect(result.value).toMatchObject(filters);
    });

    test('❌ Détecte tous les invalides dans une combinaison', () => {
      const filters = {
        search: 'a'.repeat(200),
        sector: 'Invalid',
        sentiment: 'Bad',
        minImportance: 999,
        sort: 'badSort',
        page: -10
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Vérifie que chaque champ invalide est détecté
      const errorFields = result.errors.map(e => e.field);
      expect(errorFields).toContain('search');
      expect(errorFields).toContain('sector');
      expect(errorFields).toContain('sentiment');
      expect(errorFields).toContain('minImportance');
      expect(errorFields).toContain('sort');
      expect(errorFields).toContain('page');
    });

    test('✅ Supprime les champs inconnus (stripUnknown)', () => {
      const filters = {
        search: 'test',
        unknownField: 'should be removed',
        anotherUnknown: 123
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(true);
      expect(result.value).not.toHaveProperty('unknownField');
      expect(result.value).not.toHaveProperty('anotherUnknown');
    });

    test('✅ Convertit les types automatiquement', () => {
      const filters = {
        minImportance: '3', // String
        page: '2'           // String
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(true);
      expect(typeof result.value.minImportance).toBe('number');
      expect(result.value.minImportance).toBe(3);
      expect(typeof result.value.page).toBe('number');
      expect(result.value.page).toBe(2);
    });
  });
});
