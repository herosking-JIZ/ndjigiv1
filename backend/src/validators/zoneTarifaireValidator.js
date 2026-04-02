// validators/zoneTarifaire.validator.js
const Joi = require('joi');

const uuidSchema = Joi.string()
  .uuid({ version: ['uuidv4'] })
  .required()
  .messages({
  'string.base': 'L\'ID doit être une chaîne de caractères',
  'string.empty': 'L\'ID ne peut pas être vide',
  'string.uuid': 'L\'ID doit être un UUID valide (version 4)'
});
// Schéma pour valider les paramètres d'ID de zone tarifaire
// Ce schéma peut être utilisé pour valider les paramètres d'ID dans les routes qui nécessitent un ID de zone tarifaire
// Par exemple, pour les routes GET /zones/:id, PUT /zones/:id, DELETE /zones/:id
// Il vérifie que l'ID est une chaîne de caractères au format UUID version 4 et qu'il est requis
// Le message d'erreur personnalisé indique clairement que l'ID doit être un UUID valide et qu'il est obligatoire


const zoneIdParamSchema = Joi.object({
  id: uuidSchema.label('ID de la zone tarifaire').messages({
    'any.required': 'L\'ID de la zone tarifaire est requis',
    'string.base': 'L\'ID de la zone tarifaire doit être une chaîne de caractères',  
    'string.empty': 'L\'ID de la zone tarifaire ne peut pas être vide',
    'string.uuid': 'L\'ID de la zone tarifaire doit être un UUID valide (version 4)'
  }) 
});


const zoneIdQuerySchema = Joi.object({
  page : Joi.number()
    .integer()
    .positive()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'La page doit être un nombre',
      'number.integer': 'La page doit être un entier',
      'number.positive': 'La page doit être un nombre positif',
      'number.min': 'La page doit être au moins 1'
    }),
  limit : Joi.number()
    .integer()
    .positive()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Le limit doit être un nombre',
      'number.integer': 'Le limit doit être un entier',
      'number.positive': 'Le limit doit être un nombre positif',
      'number.min': 'Le limit doit être au moins 1',
      'number.max': 'Le limit ne peut pas dépasser 100' 
    }),

    // filtre optionnel par nom de zone
  nom: Joi.string()
    .min(3)
    .max(60)
    .optional()
    .messages({
      'string.base': 'Le nom doit être une chaîne de caractères',
      'string.min': 'Le nom doit comporter au moins 3 caractères',
      'string.max': 'Le nom ne peut pas dépasser 60 caractères'
    }),

  tarif_base : Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Le tarif de base doit être un nombre',
      'number.positive': 'Le tarif de base doit être un nombre positif',
      'number.precision': 'Le tarif de base doit avoir au maximum 2 décimales'
    }),
    tarif_km : Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Le tarif par km doit être un nombre',
      'number.positive': 'Le tarif par km doit être un nombre positif',
      'number.precision': 'Le tarif par km doit avoir au maximum 2 décimales'
    }),
    tarif_minute : Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Le tarif par minute doit être un nombre',
      'number.positive': 'Le tarif par minute doit être un nombre positif',
      'number.precision': 'Le tarif par minute doit avoir au maximum 2 décimales'
    })  

});

const createZoneSchema = Joi.object({
  nom: Joi.string()
    .min(3)
    .max(60)
    .required()
    .messages(
      { 
        'any.required': 'Le nom de la zone est obligatoire',
        'string.min': 'Le nom de la zone doit comporter au moins 3 caractères',
        'string.max': 'Le nom de la zone ne peut pas dépasser 60 caractères'
       }),

  tarif_base: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
       'any.required': 'Le tarif de base est obligatoire',
        'number.positive': 'Le tarif de base doit être un nombre positif',
        'number.precision': 'Le tarif de base doit avoir au maximum 2 décimales'

      }),

  tarif_km: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({ 
      'any.required': 'Le tarif par km est obligatoire',
      'number.positive': 'Le tarif par km doit être un nombre positif',
      'number.precision': 'Le tarif par km doit avoir au maximum 2 décimales' 
    }),

  tarif_minute: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({ 
      'any.required': 'Le tarif par minute est obligatoire',
      'number.positive': 'Le tarif par minute doit être un nombre positif',
      'number.precision': 'Le tarif par minute doit avoir au maximum 2 décimales' 
    }),
    actif: Joi.boolean()
    .optional()
    .messages({
        'boolean.base': 'Le champ actif doit être un booléen (true/false)'
    }),

  coefficient_max: Joi.number()
    .positive()
    .min(1)
    .max(5)                    // maximum surge raisonnable
    .default(3.0)
    .messages({
      'number.min': 'Le coefficient max doit être au moins 1',
      'number.max': 'Le coefficient max ne peut pas dépasser 5',
      'number.positive': 'Le coefficient max doit être un nombre positif',
      'number.base': 'Le coefficient max doit être un nombre'
    })
});

// Optionnel : schéma pour update (on peut réutiliser le même en .fork())
const updateZoneSchema = createZoneSchema.fork(['nom', 'tarif_base', 'tarif_km', 'tarif_minute', 'actif', 'coefficient_max'], 
  (schema) => schema.optional()).min(1).messages({
    'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
  });


module.exports = {
  zoneIdParamSchema,
  zoneIdQuerySchema,
  createZoneSchema,
  updateZoneSchema,
  uuidSchema
};