/**
 * CONTROLLERS/TRAJETCONTROLLER.JS
 * Fusion optimisée des deux versions
 * Couvre : CRUD, démarrer/terminer/annuler, tarif, promo, update admin
 */
const { prisma } = require('../config/db');
// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
/** Champs include communs pour findOne */
const INCLUDE_TRAJET_COMPLET = {
  zone_tarifaire: true,
  affectation_vehicule: {
    include: {
      chauffeur: {
        include: {
          utilisateur: {
            select: { nom: true, prenom: true, photo_profil: true, numero_telephone: true }
          }
        }
      },
      vehicule: true
    }
  },
  reservation: {
    include: {
      passager: {
        include: {
        }
      }
    }
  },
    utilisateur: { select: { nom: true, prenom: true, photo_profil: true } },
  avis:              true,
  incident_securite: true,
  utilisation_promo: { include: { code_promo: true } }
};

/** Champs include allégés pour findAll */
const INCLUDE_TRAJET_LISTE = {
  zone_tarifaire: { select: { nom: true, tarif_base: true } },
  affectation_vehicule: {
    include: {
      chauffeur: {
        include: {
          utilisateur: { select: { nom: true, prenom: true, photo_profil: true } }
        }
      },
      vehicule: {
        select: { marque: true, modele: true, immatriculation: true, couleur: true }
      }
    }
  },
  reservation: { select: { id_passager: true, statut: true } }
};


/** Statuts autorisés à être annulés */
const STATUTS_ANNULABLES = ['en_attente', 'confirme', 'en_cours'];
/** Statuts permettant de démarrer */
const STATUTS_DEMARRABLES = ['en_attente', 'confirme'];
// ─────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────
const TrajetController = {
  // ──────────────────────────────────────────────────────────
  // GET /api/trajets
  // Lister les trajets avec pagination + filtres
  // ──────────────────────────────────────────────────────────
  async lister(req, res) {
    try {
      const { statut, type_trajet, page = 1, limit = 20 } = req.query;
      const skip  = (parseInt(page) - 1) * parseInt(limit);
      const where = {};
      if (statut)      where.statut      = statut;
      if (type_trajet) where.type_trajet = type_trajet;
      const [trajets, total] = await Promise.all([
        prisma.trajet.findMany({
          where,
          skip,
          take:    parseInt(limit),
          orderBy: { date_heure_debut: 'desc' },
          include: INCLUDE_TRAJET_LISTE
        }),
        prisma.trajet.count({ where })
      ]);
      return res.status(200).json({
        success: true,
        data:    trajets,
        meta:    { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[trajet.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
  // ──────────────────────────────────────────────────────────
  // GET /api/trajets/:id
  // Détail complet d'un trajet
  // ──────────────────────────────────────────────────────────
  async findOne(req, res) {
    try {
      const { id } = req.params;
      const trajet = await prisma.trajet.findUnique({
        where:   { id_trajet: id },
        include: INCLUDE_TRAJET_COMPLET
      });
      if (!trajet) {
        return res.status(404).json({ success: false, message: 'Trajet introuvable.' });
      }
      return res.status(200).json({ success: true, data: trajet });
    } catch (error) {
      console.error('[trajet.findOne]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
  // ──────────────────────────────────────────────────────────
  // POST /api/trajets
  // Créer un trajet avec calcul automatique du tarif estimé
  // ──────────────────────────────────────────────────────────
  async creer(req, res) {
    try {
      const {
        id_affectation,
        id_zone,
        adresse_depart,
        adresse_arrivee,
        coordonnees_depart,
        coordonnees_arrivee,
        type_trajet,
        distance_km,
        duree_estimee_min,
      } = req.body;
      // Validation des champs obligatoires
      if (!id_affectation || !adresse_depart || !adresse_arrivee || !type_trajet) {
        return res.status(400).json({
          success: false,
          message: 'Champs obligatoires manquants : id_affectation, adresse_depart, adresse_arrivee, type_trajet.'
        });
      }
      // Calcul automatique du tarif estimé si zone + distance + durée fournis
      let tarif_final = null;
      if (id_zone && distance_km && duree_estimee_min) {
        const zone = await prisma.zone_tarifaire.findUnique({ where: { id_zone } });
        if (zone && zone.actif) {
          tarif_final = parseFloat(zone.tarif_base)
            + parseFloat(zone.tarif_km)     * parseFloat(distance_km)
            + parseFloat(zone.tarif_minute) * parseInt(duree_estimee_min);
          tarif_final = parseFloat(tarif_final.toFixed(2));
        }
      }
      const trajet = await prisma.trajet.create({
        data: {
          id_affectation,
          id_zone:             id_zone             ?? null,
          adresse_depart,
          adresse_arrivee,
          coordonnees_depart:  coordonnees_depart  ?? null,
          coordonnees_arrivee: coordonnees_arrivee ?? null,
          type_trajet,
          distance_km:         distance_km       ? parseFloat(distance_km)     : null,
          duree_estimee_min:   duree_estimee_min ? parseInt(duree_estimee_min) : null,
          tarif_final,
          statut: 'en_attente',
        },
        include: INCLUDE_TRAJET_COMPLET
      });
      return res.status(201).json({
        success: true,
        message: 'Trajet créé.',
        data:    trajet
      });
    } catch (error) {
      console.error('[trajet.creer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
  // ──────────────────────────────────────────────────────────
  // PATCH /api/trajets/:id/demarrer
  // Démarrer un trajet (en_attente ou confirme → en_cours)
  // ──────────────────────────────────────────────────────────
  async demarrer(req, res) {
    try {
      const { id } = req.params;
      const trajet = await prisma.trajet.findUnique({ where: { id_trajet: id } });
      if (!trajet) {
        return res.status(404).json({ success: false, message: 'Trajet introuvable.' });
      }
      if (!STATUTS_DEMARRABLES.includes(trajet.statut)) {
        return res.status(400).json({
          success: false,
          message: `Impossible de démarrer un trajet en statut "${trajet.statut}". Statuts autorisés : ${STATUTS_DEMARRABLES.join(', ')}.`
        });
      }
      const updated = await prisma.trajet.update({
        where: { id_trajet: id },
        data:  { statut: 'en_cours', date_heure_debut: new Date() }
      });
      return res.status(200).json({
        success: true,
        message: 'Trajet démarré.',
        data:    updated
      });
    } catch (error) {
      console.error('[trajet.demarrer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
  // ──────────────────────────────────────────────────────────
  // PATCH /api/trajets/:id/terminer
  // Terminer un trajet — incrémente nb_courses du chauffeur
  // ──────────────────────────────────────────────────────────
  async terminer(req, res) {
    try {
      const { id }                        = req.params;
      const { tarif_final, polyline_trajet } = req.body;
      const trajet = await prisma.trajet.findUnique({ where: { id_trajet: id } });
      if (!trajet) {
        return res.status(404).json({ success: false, message: 'Trajet introuvable.' });
      }
      if (trajet.statut !== 'en_cours') {
        return res.status(400).json({
          success: false,
          message: `Impossible de terminer un trajet en statut "${trajet.statut}".`
        });
      }
      const updated = await prisma.$transaction(async (tx) => {
        // 1. Terminer le trajet
        const t = await tx.trajet.update({
          where: { id_trajet: id },
          data: {
            statut:          'termine',
            date_heure_fin:  new Date(),
            tarif_final:     tarif_final     ? parseFloat(tarif_final) : trajet.tarif_final,
            polyline_trajet: polyline_trajet ?? trajet.polyline_trajet,
          }
        });
        // 2. Récupérer le chauffeur via l'affectation (correction bug Code 1)
        const affectation = await tx.affectation_vehicule.findUnique({
          where: { id_affectation: trajet.id_affectation }
        });
        if (affectation) {
          // 3. Incrémenter nb_courses du chauffeur
          await tx.chauffeur.update({
            where: { id_chauffeur: affectation.id_chauffeur },
            data:  { nb_courses_effectuees: { increment: 1 } }
          });
          // 4. Incrémenter nb_courses des passagers ayant réservé
          await tx.passager.updateMany({
            where: {
              reservation: {
                some: { id_trajet: id, statut: { not: 'annule' } }
              }
            },
            data: { nb_courses_effectuees: { increment: 1 } }
          });
        }
        return t;
      });
      return res.status(200).json({
        success: true,
        message: 'Trajet terminé.',
        data:    updated
      });
    } catch (error) {
      console.error('[trajet.terminer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
  // ──────────────────────────────────────────────────────────
  // PATCH /api/trajets/:id/annuler
  // Annuler un trajet + notifier les passagers
  // ──────────────────────────────────────────────────────────
  async annuler(req, res) {
    try {
      const { id }    = req.params;
      const { motif } = req.body;
      const trajet = await prisma.trajet.findUnique({ where: { id_trajet: id } });
      if (!trajet) {
        return res.status(404).json({ success: false, message: 'Trajet introuvable.' });
      }
      if (!STATUTS_ANNULABLES.includes(trajet.statut)) {
        return res.status(400).json({
          success: false,
          message: `Impossible d'annuler un trajet en statut "${trajet.statut}".`
        });
      }
      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trajet.update({
          where: { id_trajet: id },
          data:  { statut: 'annule' }
        });
        // Annuler les réservations liées
        await tx.reservation.updateMany({
          where: { id_trajet: id, statut: { not: 'annule' } },
          data:  { statut: 'annule' }
        });
        // Notifier les passagers
        const reservations = await tx.reservation.findMany({
          where:  { id_trajet: id },
          select: { id_passager: true }
        });
        if (reservations.length > 0) {
          await tx.notification.createMany({
            data: reservations.map(r => ({
              id_utilisateur: r.id_passager,
              type:           'trajet_annule',
              titre:          'Trajet annulé',
              contenu:        motif ?? 'Votre trajet a été annulé.',
              id_objet_lie:   id,
            }))
          });
        }
        return t;
      });
      return res.status(200).json({
        success: true,
        message: 'Trajet annulé.',
        data:    updated
      });
    } catch (error) {
      console.error('[trajet.annuler]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
  // ──────────────────────────────────────────────────────────
  // POST /api/trajets/tarif
  // Calculer le tarif estimé avec surge pricing
  // ──────────────────────────────────────────────────────────
  async calculerTarif(req, res) {
    try {
      const { id_zone, distance_km, duree_min, coefficient } = req.body;
      if (!id_zone || !distance_km || !duree_min) {
        return res.status(400).json({
          success: false,
          message: 'id_zone, distance_km et duree_min sont requis.'
        });
      }
      const zone = await prisma.zone_tarifaire.findUnique({ where: { id_zone } });
      if (!zone || !zone.actif) {
        return res.status(404).json({ success: false, message: 'Zone tarifaire introuvable ou inactive.' });
      }
      // Appliquer le coefficient en respectant le plafond
      const coef = Math.min(
        parseFloat(coefficient ?? 1),
        parseFloat(zone.coefficient_max)
      );
      const tarif_base  = parseFloat(zone.tarif_base);
      const tarif_km    = parseFloat(zone.tarif_km)     * parseFloat(distance_km);
      const tarif_min   = parseFloat(zone.tarif_minute) * parseFloat(duree_min);
      const tarif_ht    = tarif_base + tarif_km + tarif_min;
      const tarif_final = parseFloat((tarif_ht * coef).toFixed(2));
      const tarif_max   = parseFloat((tarif_ht * parseFloat(zone.coefficient_max)).toFixed(2));
      return res.status(200).json({
        success: true,
        data: {
          tarif_estime: parseFloat(tarif_ht.toFixed(2)),
          tarif_final,
          tarif_max,
          coefficient:  coef,
          devise:       'XOF',
          detail: { tarif_base, tarif_km, tarif_min }
        }
      });
    } catch (error) {
      console.error('[trajet.calculerTarif]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
  // ──────────────────────────────────────────────────────────
  // POST /api/trajets/:id/promo
  // Appliquer un code promo sur un trajet (atomique)
  // ──────────────────────────────────────────────────────────
  async appliquerPromo(req, res) {
    try {
      const { id }         = req.params;
      const { code }       = req.body;
      const id_utilisateur = req.user.id_utilisateur;
      if (!code) {
        return res.status(400).json({ success: false, message: 'code requis.' });
      }
      // Récupérer le trajet
      const trajet = await prisma.trajet.findUnique({ where: { id_trajet: id } });
      if (!trajet) {
        return res.status(404).json({ success: false, message: 'Trajet introuvable.' });
      }
      // Récupérer et valider le code promo
      const promo = await prisma.code_promo.findUnique({ where: { code: code.toUpperCase() } });
      if (!promo || !promo.actif) {
        return res.status(404).json({ success: false, message: 'Code promo invalide ou inactif.' });
      }
      if (new Date() < new Date(promo.date_debut)) {
        return res.status(400).json({ success: false, message: 'Code promo pas encore actif.' });
      }
      if (promo.date_fin && new Date() > new Date(promo.date_fin)) {
        return res.status(400).json({ success: false, message: 'Code promo expiré.' });
      }
      if (promo.nb_utilisations_max && promo.nb_utilisations_actuel >= promo.nb_utilisations_max) {
        return res.status(400).json({ success: false, message: 'Code promo épuisé.' });
      }
      // Vérifier usage unique par utilisateur
      const dejaUtilise = await prisma.utilisation_promo.findUnique({
        where: { id_utilisateur_id_promo: { id_utilisateur, id_promo: promo.id_promo } }
      });
      if (dejaUtilise) {
        return res.status(400).json({ success: false, message: 'Vous avez déjà utilisé ce code promo.' });
      }
      // Appliquer atomiquement
      await prisma.$transaction([
        prisma.utilisation_promo.create({
          data: { id_utilisateur, id_promo: promo.id_promo, id_trajet: id }
        }),
        prisma.code_promo.update({
          where: { id_promo: promo.id_promo },
          data:  { nb_utilisations_actuel: { increment: 1 } }
        })
      ]);
      // Calculer la réduction
      let reduction = 0;
      if (trajet.tarif_final) {
        reduction = promo.type_reduction === 'pourcentage'
          ? parseFloat(trajet.tarif_final) * (parseFloat(promo.valeur) / 100)
          : Math.min(parseFloat(promo.valeur), parseFloat(trajet.tarif_final));
      }
      return res.status(200).json({
        success: true,
        message: 'Code promo appliqué.',
        data: {
          code:           promo.code,
          type_reduction: promo.type_reduction,
          valeur:         parseFloat(promo.valeur),
          reduction:      parseFloat(reduction.toFixed(2)),
          devise:         'XOF'
        }
      });
    } catch (error) {
      console.error('[trajet.appliquerPromo]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
  // ──────────────────────────────────────────────────────────
  // PATCH /api/trajets/:id (admin)
  // Mise à jour contrôlée — champs autorisés uniquement
  // ──────────────────────────────────────────────────────────
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        adresse_depart,
        adresse_arrivee,
        coordonnees_depart,
        coordonnees_arrivee,
        distance_km,
        duree_estimee_min,
        polyline_trajet,
        id_zone,
        type_trajet,
      } = req.body;
      const trajet = await prisma.trajet.update({
        where: { id_trajet: id },
        data: {
          ...(adresse_depart       && { adresse_depart }),
          ...(adresse_arrivee      && { adresse_arrivee }),
          ...(coordonnees_depart   && { coordonnees_depart }),
          ...(coordonnees_arrivee  && { coordonnees_arrivee }),
          ...(distance_km          && { distance_km:       parseFloat(distance_km) }),
          ...(duree_estimee_min    && { duree_estimee_min: parseInt(duree_estimee_min) }),
          ...(polyline_trajet      && { polyline_trajet }),
          ...(id_zone              && { id_zone }),
          ...(type_trajet          && { type_trajet }),
        }
      });
      return res.status(200).json({ success: true, data: trajet });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Trajet introuvable.' });
      }
      console.error('[trajet.update]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};
module.exports = TrajetController;