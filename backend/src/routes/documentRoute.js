const express = require('express');
const documentController  = require('../controllers/documentController');
const { authenticate } = require('../middlewares/authenticate');
const { can, authorize } = require('../middlewares/authorize');

const documentRoute = express.Router();
// Toutes les routes documents nécessitent d'être connecté
documentRoute.use(authenticate);    

// Définition des routes pour les documents

// GET /utilisateur/documents — voir ses documents

documentRoute.get   ('/documents',                 can('profil:lire'),       documentController.mesDocuments);

// POST /utilisateur/documents — ajouter un document


documentRoute.post  ('/documents',                 can('profil:modifier'),   documentController.uploadDocument);

// PATCH /utilisateur/documents/:id/verifier — vérifier un document (admin seulement)


documentRoute.patch ('/documents/:id/verifier',    authorize('admin'),       documentController.verifierDocument);
