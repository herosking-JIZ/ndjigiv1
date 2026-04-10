const express = require('express');
const TrajetController = require('../controllers/trajetController');
const { authenticate } = require('../middlewares/authenticate');
const { can } = require('../middlewares/authorize');

const checkTrajetChauffeur = require('../middlewares/checkTrajetOwnership');

const trajetRoute = express.Router();
trajetRoute.use(authenticate);



// ✅ /historique AVANT /:id sinon Express lit "historique" comme un id
trajetRoute.get('/historique', can('trajet:lire'), TrajetController.historique) // 👈 renommer aussi le controller
trajetRoute.get('/', can('trajet:lire'), TrajetController.lister)
trajetRoute.get('/:id', can('trajet:lire'), TrajetController.findOne)
trajetRoute.post('/tarif', can('trajet:lire'), TrajetController.calculerTarif)
trajetRoute.post('/', can('trajet:creer'), TrajetController.creer)
trajetRoute.patch('/:id/demarrer', can('trajet:demarrer'), checkTrajetChauffeur, TrajetController.demarrer)
trajetRoute.patch('/:id/terminer', can('trajet:terminer'), checkTrajetChauffeur, TrajetController.terminer)
trajetRoute.patch('/:id/annuler', can('trajet:annuler'), checkTrajetChauffeur, TrajetController.annuler)

module.exports = trajetRoute;