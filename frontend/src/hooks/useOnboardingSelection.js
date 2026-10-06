import { useState, useEffect } from 'react';
import {
  loadSelection,
  saveSelection,
  togglePack as togglePackPure,
  addCustomSource as addCustomSourcePure,
  removeCustomSource as removeCustomSourcePure,
  buildCategoriesParam,
} from '../lib/onboardingStorage';

export function useOnboardingSelection() {
  const [selection, setSelection] = useState(() => loadSelection());

  useEffect(() => {
    saveSelection(selection);
  }, [selection]);

  const togglePack = (packId) => setSelection(s => togglePackPure(s, packId));

  const addCustomSource = (input) => {
    const { selection: next, error } = addCustomSourcePure(selection, input);
    if (error) return { error };
    setSelection(next);
    return { error: null };
  };

  const removeCustomSource = (url) => setSelection(s => removeCustomSourcePure(s, url));

  return {
    selection,
    togglePack,
    addCustomSource,
    removeCustomSource,
    categoriesParam: buildCategoriesParam(selection),
  };
}
