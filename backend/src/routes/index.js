const express               = require('express');
const authRoute            = require('./authRoute');
const trajetRoute          = require('./trajetRoute');
const vehiculeRoute        = require('./vehiculeRoute');
const parkingRoute         = require('./parkingRoute');
const chauffeurRoute       = require('./chauffeurRoute');
const affectationRoute     = require('./affectationRoute');
const avisRoute             = require('./avisRoute');
const notificationRoute     = require('./notificationRoute');
const paiementRoute         = require('./paiementRoute');
const passagerRoute         = require('./passagerRoute');
const promoRoute            = require('./promoRoute');
const proprietaireRoute     = require('./proprietaireRoute');
const reservationRoute      = require('./reservationRoute');
const utilisateurRoute      = require('./utilisateurRoute');


const router = express.Router();

router.use('/auth',       authRoute);
router.use('/trajets',    trajetRoute);
router.use('/vehicules',  vehiculeRoute);
router.use('/parkings',   parkingRoute);
router.use('/chauffeurs', chauffeurRoute);
router.use('/affectation', affectationRoute);
router.use('/avis', avisRoute);
router.use('/notification', notificationRoute);
router.use('/paiement', paiementRoute);
router.use('/parking',parkingRoute);
router.use('/pasager', passagerRoute);
router.use('/promoccode', promoRoute);
router.use('/proprietaire', proprietaireRoute);
router.use('/reservation', reservationRoute);
router.use('/utilisateur', utilisateurRoute);
router.use('/vehicule', vehiculeRoute);











module.exports = router;