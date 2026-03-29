// ─────────────────────────────────────────────────────────────
// ROUTES/UTILISATEURROUTE.JS
// ─────────────────────────────────────────────────────────────
const express                 = require('express');
const UtilisateurController   = require('../controllers/utilisateurController');
const { authenticate }        = require('../middlewares/authenticate');
const { authorize, can }      = require('../middlewares/authorize');

const utilisateurRoute = express.Router();
utilisateurRoute.use(authenticate);

// ── Profil connecté ──────────────────────────────────────────
utilisateurRoute.get   ('/profil',                    can('profil:lire'),       UtilisateurController.monProfil);
utilisateurRoute.patch ('/profil',                    can('profil:modifier'),   UtilisateurController.updateProfil);
utilisateurRoute.patch ('/mot-de-passe',              can('profil:modifier'),   UtilisateurController.changerMotDePasse);

// ── Documents ────────────────────────────────────────────────
utilisateurRoute.get   ('/documents',                 can('profil:lire'),       UtilisateurController.mesDocuments);
utilisateurRoute.post  ('/documents',                 can('profil:modifier'),   UtilisateurController.uploadDocument);
utilisateurRoute.patch ('/documents/:id/verifier',    authorize('admin'),       UtilisateurController.verifierDocument);

// ── Admin ────────────────────────────────────────────────────
utilisateurRoute.get   ('/',                          authorize('admin'),        UtilisateurController.findAll);
utilisateurRoute.get   ('/:id',                       authorize('admin'),        UtilisateurController.findOne);
utilisateurRoute.patch ('/:id',                       authorize('admin'),        UtilisateurController.update);
utilisateurRoute.delete('/:id',                       authorize('admin'),        UtilisateurController.delete);
utilisateurRoute.patch ('/:id/statut',                authorize('admin'),        UtilisateurController.changerStatut);
utilisateurRoute.post  ('/:id/roles',                 authorize('admin'),        UtilisateurController.ajouterRole);
utilisateurRoute.delete('/:id/roles/:role',           authorize('admin'),        UtilisateurController.retirerRole);

module.exports = utilisateurRoute;
