// routes/zoneTarifaire.routes.js
const express                  = require('express');
const zoneTarifaireController  = require('../controllers/zoneTarifaireController');
const joiValidate              = require('../middlewares/validate.middleware');
const { authenticate }         = require('../middlewares/authenticate');
const { authorize }            = require('../middlewares/authorize');

const {
    zoneIdParamSchema,
    zoneQuerySchema,     // ✅ nom corrigé (zoneIdQuerySchema → zoneQuerySchema)
    createZoneSchema,
    updateZoneSchema
} = require('../validators/zoneTarifaireValidator');

const router = express.Router();

// Toutes les routes nécessitent d'être connecté
router.use(authenticate);

// GET /zones-tarifaires — lister (admin + chauffeur peuvent consulter)
router.get('/',
    authorize('admin'),
    joiValidate({ query: zoneQuerySchema }),
    zoneTarifaireController.lister
);

// GET /zones-tarifaires/:id — voir une zone précise
router.get('/:id',
    authorize('admin', 'chauffeur', 'proprietaire'),
    joiValidate({ params: zoneIdParamSchema }),
    zoneTarifaireController.findOne
);

// POST /zones-tarifaires — créer (admin seulement)
router.post('/',
    authorize('admin'),
    joiValidate({ body: createZoneSchema }),
    zoneTarifaireController.create
);

// PUT /zones-tarifaires/:id — modifier (admin seulement)
router.put('/:id',
    authorize('admin'),
    joiValidate({ params: zoneIdParamSchema, body: updateZoneSchema }),
    zoneTarifaireController.modifier
);

// DELETE /zones-tarifaires/:id — supprimer (admin seulement)
router.delete('/:id',
    authorize('admin'),
    joiValidate({ params: zoneIdParamSchema }),
    zoneTarifaireController.delete
);

module.exports = router;