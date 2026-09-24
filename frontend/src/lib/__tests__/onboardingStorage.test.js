import {
  STORAGE_KEY,
  emptySelection,
  loadSelection,
  saveSelection,
  togglePack,
  validateCustomSourceUrl,
  addCustomSource,
  removeCustomSource,
  deriveLabelFromUrl,
  buildCategoriesParam,
} from '../onboardingStorage';

describe('emptySelection', () => {
  it('returns an empty packs/customSources shape', () => {
    expect(emptySelection()).toEqual({ packs: [], customSources: [] });
  });
});

describe('loadSelection / saveSelection', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty selection when nothing stored', () => {
    expect(loadSelection()).toEqual({ packs: [], customSources: [] });
  });

  it('round-trips a saved selection', () => {
    const selection = { packs: ['finance', 'tech-ia'], customSources: [{ url: 'https://example.com', label: 'Example', addedAt: '2026-01-01T00:00:00.000Z' }] };
    saveSelection(selection);
    const loaded = loadSelection();
    expect(loaded.packs).toEqual(['finance', 'tech-ia']);
    expect(loaded.customSources).toEqual(selection.customSources);
  });

  it('ignores corrupted JSON instead of throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSelection()).toEqual({ packs: [], customSources: [] });
  });

  it('does not throw when localStorage.setItem throws (quota/private mode)', () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(() => saveSelection(emptySelection())).not.toThrow();
    spy.mockRestore();
  });
});

describe('togglePack', () => {
  it('adds a pack id not yet selected', () => {
    const result = togglePack(emptySelection(), 'finance');
    expect(result.packs).toEqual(['finance']);
  });

  it('removes a pack id already selected', () => {
    const result = togglePack({ packs: ['finance', 'tech-ia'], customSources: [] }, 'finance');
    expect(result.packs).toEqual(['tech-ia']);
  });

  it('does not mutate the input selection', () => {
    const input = { packs: [], customSources: [] };
    togglePack(input, 'finance');
    expect(input.packs).toEqual([]);
  });
});

describe('validateCustomSourceUrl', () => {
  it('accepts http and https URLs', () => {
    expect(validateCustomSourceUrl('https://example.com/feed').isValid).toBe(true);
    expect(validateCustomSourceUrl('http://example.com/feed').isValid).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    const result = validateCustomSourceUrl('javascript:alert(1)');
    expect(result.isValid).toBe(false);
  });

  it('rejects empty/missing URLs', () => {
    expect(validateCustomSourceUrl('').isValid).toBe(false);
    expect(validateCustomSourceUrl(undefined).isValid).toBe(false);
  });

  it('rejects URLs over 500 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(500);
    expect(validateCustomSourceUrl(longUrl).isValid).toBe(false);
  });
});

describe('addCustomSource', () => {
  it('adds a valid source with a derived label when none given', () => {
    const { selection, error } = addCustomSource(emptySelection(), { url: 'https://example.com/feed', label: '' });
    expect(error).toBeNull();
    expect(selection.customSources).toHaveLength(1);
    expect(selection.customSources[0].url).toBe('https://example.com/feed');
    expect(selection.customSources[0].label).toBe('example.com');
    expect(typeof selection.customSources[0].addedAt).toBe('string');
  });

  it('sanitizes an explicit label', () => {
    const { selection } = addCustomSource(emptySelection(), { url: 'https://example.com', label: '<script>x</script>My Feed' });
    expect(selection.customSources[0].label).not.toContain('<script>');
  });

  it('rejects an invalid URL and returns the original selection unchanged', () => {
    const input = emptySelection();
    const { selection, error } = addCustomSource(input, { url: 'javascript:alert(1)', label: '' });
    expect(error).toBeTruthy();
    expect(selection).toBe(input);
  });

  it('rejects a duplicate URL', () => {
    const withOne = addCustomSource(emptySelection(), { url: 'https://example.com', label: '' }).selection;
    const { error } = addCustomSource(withOne, { url: 'https://example.com', label: '' });
    expect(error).toBeTruthy();
  });
});

describe('removeCustomSource', () => {
  it('removes the matching URL only', () => {
    const selection = {
      packs: [],
      customSources: [
        { url: 'https://a.com', label: 'A', addedAt: '2026-01-01T00:00:00.000Z' },
        { url: 'https://b.com', label: 'B', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
    };
    const result = removeCustomSource(selection, 'https://a.com');
    expect(result.customSources.map(s => s.url)).toEqual(['https://b.com']);
  });
});

describe('deriveLabelFromUrl', () => {
  it('strips protocol and www', () => {
    expect(deriveLabelFromUrl('https://www.example.com/feed')).toBe('example.com');
  });

  it('falls back to the raw string on unparsable input', () => {
    expect(deriveLabelFromUrl('not a url')).toBe('not a url');
  });
});

describe('buildCategoriesParam', () => {
  it('returns an empty string when no packs selected', () => {
    expect(buildCategoriesParam(emptySelection())).toBe('');
  });

  it('expands a single pack into its sector list', () => {
    expect(buildCategoriesParam({ packs: ['finance'], customSources: [] })).toBe('Finance,Crypto');
  });

  it('a single-sector pack expands to just that sector', () => {
    expect(buildCategoriesParam({ packs: ['cybersecurite'], customSources: [] })).toBe('Cybersécurité');
  });

  it('unions sectors across multiple selected packs, deduped', () => {
    const result = buildCategoriesParam({ packs: ['finance', 'tech-ia'], customSources: [] });
    expect(result.split(',').sort()).toEqual(['Crypto', 'Finance', 'IA', 'Tech'].sort());
  });

  it('treats "généraliste" as an override: forces no filter even with other packs selected', () => {
    expect(buildCategoriesParam({ packs: ['finance', 'generaliste'], customSources: [] })).toBe('');
  });

  it('ignores unknown pack ids', () => {
    expect(buildCategoriesParam({ packs: ['does-not-exist'], customSources: [] })).toBe('');
  });
});
