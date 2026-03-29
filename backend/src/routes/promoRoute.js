const express                           = require('express');
const PromoController                   = require('../controllers/promoController');
const { authenticate }                  = require('../middlewares/authenticate');
const { authorize, can }                = require('../middlewares/authorize');

const promoRoute = express.Router();
promoRoute.use(authenticate);

promoRoute.get  ('/promos',               authorize('admin'),       PromoController.lister);
promoRoute.post ('/promos',               authorize('admin'),       PromoController.creer);
promoRoute.get  ('/promos/:code/valider', can('trajet:reserver'),   PromoController.valider);
promoRoute.patch('/promos/:id/toggle',    authorize('admin'),       PromoController.toggleActif);

module.exports = promoRoute;
