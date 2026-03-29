/**
 * CONTROLLERS/PROMOAVISCONTROLLER.JS
 */

const { prisma } = require('../config/db');

// ─────────────────────────────────────────────────────────────
// CODE PROMO
// ─────────────────────────────────────────────────────────────

const PromoController = {

  // ── Lister les codes promo ──────────────────────────────────
  async lister(req, res) {
    try {
      const { actif, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (actif !== undefined) where.actif = actif === 'true';

      const [promos, total] = await Promise.all([
        prisma.code_promo.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { date_debut: 'desc' }
        }),
        prisma.code_promo.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: promos,
        meta: { total, page: parseInt(page), limit: parseInt(limit) }
      });
    } catch (error) {
      console.error('[promo.lister]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Créer un code promo (admin) ─────────────────────────────
  async creer(req, res) {
    try {
      const {
        code, type_reduction, valeur,
        date_debut, date_fin, nb_utilisations_max
      } = req.body;

      if (!code || !type_reduction || !valeur || !date_debut) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
      }

      if (!['fixe', 'pourcentage'].includes(type_reduction)) {
        return res.status(400).json({ success: false, message: 'type_reduction doit être "fixe" ou "pourcentage".' });
      }

      if (type_reduction === 'pourcentage' && parseFloat(valeur) > 100) {
        return res.status(400).json({ success: false, message: 'Un pourcentage ne peut pas dépasser 100.' });
      }

      const promo = await prisma.code_promo.create({
        data: {
          code:                code.toUpperCase(),
          type_reduction,
          valeur:              parseFloat(valeur),
          date_debut:          new Date(date_debut),
          date_fin:            date_fin ? new Date(date_fin) : null,
          nb_utilisations_max: nb_utilisations_max ? parseInt(nb_utilisations_max) : null,
        }
      });

      return res.status(201).json({ success: true, data: promo });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ success: false, message: 'Ce code promo existe déjà.' });
      }
      console.error('[promo.creer]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Valider un code promo ───────────────────────────────────
  async valider(req, res) {
    try {
      const { code } = req.params;
      const id_utilisateur = req.user.id_utilisateur;

      const promo = await prisma.code_promo.findUnique({ where: { code: code.toUpperCase() } });

      if (!promo || !promo.actif) {
        return res.status(404).json({ success: false, message: 'Code promo invalide.' });
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

      // Vérifier usage par cet utilisateur
      const dejaUtilise = await prisma.utilisation_promo.findUnique({
        where: { id_utilisateur_id_promo: { id_utilisateur, id_promo: promo.id_promo } }
      });
      if (dejaUtilise) {
        return res.status(400).json({ success: false, message: 'Vous avez déjà utilisé ce code.' });
      }

      return res.status(200).json({
        success: true,
        data: {
          id_promo:       promo.id_promo,
          code:           promo.code,
          type_reduction: promo.type_reduction,
          valeur:         promo.valeur,
        }
      });
    } catch (error) {
      console.error('[promo.valider]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },

  // ── Activer / Désactiver un code promo (admin) ──────────────
  async toggleActif(req, res) {
    try {
      const { id } = req.params;
      const promo = await prisma.code_promo.findUnique({ where: { id_promo: id } });

      if (!promo) {
        return res.status(404).json({ success: false, message: 'Code promo introuvable.' });
      }

      const updated = await prisma.code_promo.update({
        where: { id_promo: id },
        data: { actif: !promo.actif }
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('[promo.toggleActif]', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
  },
};

module.exports = PromoController ;
