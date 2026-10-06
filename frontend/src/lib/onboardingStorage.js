import { sanitizeText } from '../utils/sanitizer';
import { packs } from './packs';

export const STORAGE_KEY = 'tech_watch_onboarding_v1';

const URL_RE = /^https?:\/\/.+/i;
const MAX_URL_LENGTH = 500;
const MAX_LABEL_LENGTH = 80;

export function emptySelection() {
  return { packs: [], customSources: [] };
}

export function loadSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySelection();
    const parsed = JSON.parse(raw);
    return {
      packs: Array.isArray(parsed.packs) ? parsed.packs : [],
      customSources: Array.isArray(parsed.customSources) ? parsed.customSources : [],
    };
  } catch (e) {
    return emptySelection();
  }
}

export function saveSelection(selection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      packs: selection.packs,
      customSources: selection.customSources,
      updatedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('Erreur sauvegarde sélection onboarding:', e);
  }
}

export function togglePack(selection, packId) {
  const has = selection.packs.includes(packId);
  return {
    ...selection,
    packs: has ? selection.packs.filter(id => id !== packId) : [...selection.packs, packId],
  };
}

export function validateCustomSourceUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL requise', value: null };
  }
  const trimmed = url.trim();
  if (trimmed.length > MAX_URL_LENGTH) {
    return { isValid: false, error: 'URL trop longue', value: null };
  }
  if (!URL_RE.test(trimmed)) {
    return { isValid: false, error: "URL invalide (doit commencer par http:// ou https://)", value: null };
  }
  return { isValid: true, error: null, value: trimmed };
}

export function deriveLabelFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function addCustomSource(selection, { url, label }) {
  const validation = validateCustomSourceUrl(url);
  if (!validation.isValid) {
    return { selection, error: validation.error };
  }
  if (selection.customSources.some(s => s.url === validation.value)) {
    return { selection, error: 'Cette source est déjà ajoutée' };
  }
  const cleanLabel = sanitizeText(label || '').trim().slice(0, MAX_LABEL_LENGTH) || deriveLabelFromUrl(validation.value);
  const entry = { url: validation.value, label: cleanLabel, addedAt: new Date().toISOString() };
  return { selection: { ...selection, customSources: [...selection.customSources, entry] }, error: null };
}

export function removeCustomSource(selection, url) {
  return { ...selection, customSources: selection.customSources.filter(s => s.url !== url) };
}

export function buildCategoriesParam(selection) {
  if (selection.packs.length === 0) return '';
  const selectedPacks = packs.filter(p => selection.packs.includes(p.id));
  const hasUnfilteredPack = selectedPacks.some(p => p.sectors.length === 0);
  if (hasUnfilteredPack) return '';
  const sectors = new Set();
  selectedPacks.forEach(p => p.sectors.forEach(s => sectors.add(s)));
  return Array.from(sectors).join(',');
}
