const express          = require('express');
const TrajetController = require('../controllers/trajetController');
const { authenticate } = require('../middlewares/authenticate');
const { can }          = require('../middlewares/authorize');

const checkTrajetChauffeur = require('../middlewares/checkTrajetOwnership');

const trajetRoute = express.Router();
 
// Toutes les routes trajets nécessitent d'être connecté
trajetRoute.use(authenticate);


//lister les trajets avec possibilité de filtrer par statut, chauffeur, passager, date, etc.
trajetRoute.get ('/',              can('trajet:lire'),     TrajetController.lister);
trajetRoute.get  ('/:id',            can('trajet:lire'),     TrajetController.findOne);
trajetRoute.post ('/',               can('trajet:creer'),    TrajetController.creer);
trajetRoute.post ('/tarif',          can('trajet:lire'),     TrajetController.calculerTarif);
trajetRoute.patch('/:id/demarrer', can('trajet:demarrer'), checkTrajetChauffeur, TrajetController.demarrer);
trajetRoute.patch('/:id/terminer', can('trajet:terminer'), checkTrajetChauffeur, TrajetController.terminer);
trajetRoute.patch('/:id/annuler',  can('trajet:annuler'),  checkTrajetChauffeur, TrajetController.annuler);

module.exports =  trajetRoute ;