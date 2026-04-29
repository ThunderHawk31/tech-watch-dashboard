import Joi from 'joi';

/**
 * Schéma de validation pour les filtres d'articles
 *
 * Contraintes de sécurité :
 * - search : max 100 caractères (prévenir DoS)
 * - sector : whitelist stricte (prévenir injection)
 * - sentiment : whitelist stricte
 * - minImportance : 0-5 (validation métier)
 * - sort : whitelist stricte
 * - page : 1-1000 (prévenir abus pagination)
 */
export const filtersSchema = Joi.object({
  // Recherche textuelle
  search: Joi.string()
    .max(100)
    .trim()
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'La recherche ne peut pas dépasser 100 caractères',
      'string.base': 'La recherche doit être du texte'
    }),

  // Secteur unique (rétrocompatibilité)
  sector: Joi.string()
    .valid('Tous', 'IA', 'Tech', 'Finance', 'Crypto', 'Énergie', 'Santé', 'Cybersécurité','Autre')
    .default('Tous')
    .messages({
      'any.only': 'Secteur invalide. Valeurs acceptées : Tous, IA, Tech, Finance, Crypto, Énergie, Santé, Cybersécurité, Autre'
    }),

  // Multi-secteurs (nouveau filtre)
  sectors: Joi.array()
    .items(Joi.string().valid('IA', 'Tech', 'Finance', 'Crypto', 'Énergie', 'Santé', 'Cybersécurité', 'Autre'))
    .default([]),

  // Sentiment (whitelist stricte)
  sentiment: Joi.string()
    .valid('Tous', 'Positif', 'Négatif', 'Neutre')
    .default('Tous')
    .messages({
      'any.only': 'Sentiment invalide. Valeurs acceptées : Tous, Positif, Négatif, Neutre'
    }),

  // Importance minimum (0-5)
  minImportance: Joi.alternatives()
    .try(
      Joi.number().integer().min(0).max(5),
      Joi.string().valid('0', '1', '2', '3', '4', '5')
    )
    .default(0)
    .messages({
      'alternatives.match': 'Importance doit être un nombre entre 0 et 5',
      'number.base': 'Importance doit être un nombre',
      'number.integer': 'Importance doit être un entier',
      'number.min': 'Importance minimum est 0',
      'number.max': 'Importance maximum est 5'
    }),

  // Tri (whitelist stricte)
  sort: Joi.string()
    .valid('recent', 'importance', 'az')
    .default('recent')
    .messages({
      'any.only': 'Tri invalide. Valeurs acceptées : recent, importance'
    }),

  // Pagination (limité à 1-1000)
  page: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1)
    .messages({
      'number.base': 'Page doit être un nombre',
      'number.integer': 'Page doit être un entier',
      'number.min': 'Page minimum est 1',
      'number.max': 'Page maximum est 1000'
    })
});

/**
 * Valide les filtres et retourne le résultat
 *
 * @param {Object} filters - Filtres à valider
 * @returns {Object} { isValid, errors, value }
 */
export const validateFilters = (filters) => {
  const { error, value } = filtersSchema.validate(filters, {
    abortEarly: false,    // Retourne TOUTES les erreurs
    stripUnknown: true,   // Supprime les champs inconnus (sécurité)
    convert: true         // Convertit les types (ex: "3" → 3)
  });

  if (error) {
    // Formatte les erreurs de façon lisible
    const errors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message,
      value: detail.context.value
    }));

    return {
      isValid: false,
      errors,
      value: null
    };
  }

  return {
    isValid: true,
    errors: null,
    value  // Valeurs validées et converties
  };
};

/**
 * Sanitize la recherche (couche supplémentaire de sécurité)
 * Supprime les caractères potentiellement dangereux
 *
 * @param {string} search - Texte de recherche
 * @returns {string} Recherche nettoyée
 */
export const sanitizeSearch = (search) => {
  if (!search) return '';

  return search
    .trim()
    .replace(/[<>]/g, '')  // Supprime < et > (anti-XSS basique)
    .slice(0, 100);         // Force limite 100 caractères
};
