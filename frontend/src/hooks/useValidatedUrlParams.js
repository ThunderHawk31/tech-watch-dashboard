import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { validateFilters } from '../validation/filters';

/**
 * Hook pour valider et corriger automatiquement les paramètres URL
 *
 * Intercepte les paramètres invalides et les remplace par des valeurs par défaut
 * Affiche des warnings dans la console en mode développement
 *
 * @returns {Object} Paramètres validés et fonction de mise à jour
 */
export function useValidatedUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Extraire les paramètres URL actuels
    const rawParams = {
      search: searchParams.get('search') || '',
      sector: searchParams.get('sector') || 'Tous',
      sentiment: searchParams.get('sentiment') || 'Tous',
      minImportance: searchParams.get('minImportance') || '0',
      sort: searchParams.get('sort') || 'recent',
      page: searchParams.get('page') || '1'
    };

    // Valider avec Joi
    const { isValid, errors, value } = validateFilters(rawParams);

    if (!isValid) {
      console.warn('⚠️ Paramètres URL invalides détectés:', errors);

      // Afficher chaque erreur individuellement
      errors.forEach(error => {
        console.warn(`  → ${error.field}: ${error.message}`);
      });

      // Construire les paramètres corrigés
      const correctedParams = new URLSearchParams();

      // Utiliser les valeurs validées (avec fallback sur defaults)
      if (value.search) correctedParams.set('search', value.search);
      if (value.sector !== 'Tous') correctedParams.set('sector', value.sector);
      if (value.sentiment !== 'Tous') correctedParams.set('sentiment', value.sentiment);
      if (value.minImportance !== '0' && value.minImportance !== 0) {
        correctedParams.set('minImportance', value.minImportance.toString());
      }
      if (value.sort !== 'recent') correctedParams.set('sort', value.sort);
      if (value.page !== 1 && value.page !== '1') {
        correctedParams.set('page', value.page.toString());
      }

      // Remplacer l'URL sans recharger la page
      setSearchParams(correctedParams, { replace: true });

      console.info('✅ Paramètres URL corrigés automatiquement');
    }
  }, [searchParams, setSearchParams]);

  // Retourner les paramètres validés
  const getValidatedParams = () => {
    const params = {
      search: searchParams.get('search') || '',
      sector: searchParams.get('sector') || 'Tous',
      sentiment: searchParams.get('sentiment') || 'Tous',
      minImportance: searchParams.get('minImportance') || '0',
      sort: searchParams.get('sort') || 'recent',
      page: parseInt(searchParams.get('page') || '1', 10)
    };

    // Validation finale (devrait toujours passer après correction)
    const { value } = validateFilters(params);
    return value || params;
  };

  // Fonction pour mettre à jour les paramètres (avec validation)
  const updateParams = (newParams) => {
    const currentParams = getValidatedParams();
    const mergedParams = { ...currentParams, ...newParams };

    // Valider avant mise à jour
    const { isValid, errors, value } = validateFilters(mergedParams);

    if (!isValid) {
      console.error('❌ Tentative de mise à jour avec paramètres invalides:', errors);
      return false;
    }

    // Construire les nouveaux paramètres
    const urlParams = new URLSearchParams();

    if (value.search) urlParams.set('search', value.search);
    if (value.sector !== 'Tous') urlParams.set('sector', value.sector);
    if (value.sentiment !== 'Tous') urlParams.set('sentiment', value.sentiment);
    if (value.minImportance !== '0' && value.minImportance !== 0) {
      urlParams.set('minImportance', value.minImportance.toString());
    }
    if (value.sort !== 'recent') urlParams.set('sort', value.sort);
    if (value.page !== 1 && value.page !== '1') {
      urlParams.set('page', value.page.toString());
    }

    setSearchParams(urlParams);
    return true;
  };

  return {
    params: getValidatedParams(),
    updateParams,
    setSearchParams
  };
}
