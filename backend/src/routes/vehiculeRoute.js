const express = require('express');
const vehiculeController  = require('../controllers/vehiculeController');
const { authenticate } = require('../middlewares/authenticate');
const { can, authorize } = require('../middlewares/authorize');

const vehiculeRoute = express.Router();

vehiculeRoute.use(authenticate);

vehiculeRoute.get('/', can('vehicule:lire'), vehiculeController.lister);
vehiculeRoute.post('/', can('vehicule:creer'), vehiculeController.creer);
vehiculeRoute.get('/:id', can('vehicule:lire'), vehiculeController.findOne);
vehiculeRoute.get('/:id/tracking', can('vehicule:lire'), vehiculeController.tracking);
vehiculeRoute.patch ('/:id/position', can('vehicule:modifier'), vehiculeController.updatePosition);

vehiculeRoute.patch('/:id', can('vehicule:modifier'), vehiculeController.modifier);
vehiculeRoute.delete('/:id', authorize('admin'), vehiculeController.supprimer);

module.exports = vehiculeRoute ;