const express          = require('express');
const TrajetController = require('../controllers/trajetController');
const { authenticate } = require('../middlewares/authenticate');
const { can }          = require('../middlewares/authorize');

const trajetRoute = express.Router();
 
// Toutes les routes trajets nécessitent d'être connecté
trajetRoute.use(authenticate);

trajetRoute.get ('/',              can('trajet:lire'),     TrajetController.lister);
trajetRoute.get  ('/:id',            can('trajet:lire'),     TrajetController.findOne);
trajetRoute.post ('/',               can('trajet:creer'),    TrajetController.creer);
trajetRoute.post ('/tarif',          can('trajet:lire'),     TrajetController.calculerTarif);
trajetRoute.patch('/:id/demarrer', can('trajet:demarrer'), TrajetController.demarrer);
trajetRoute.patch('/:id/terminer', can('trajet:terminer'), TrajetController.terminer);
trajetRoute.patch('/:id/annuler',  can('trajet:annuler'),  TrajetController.annuler);

module.exports =  trajetRoute ;