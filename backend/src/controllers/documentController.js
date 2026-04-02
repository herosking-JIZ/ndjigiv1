const prisma = require('../config/db');

const documentController = {
  /**
   * Téléverser un nouveau document
   * POST /documents
   */
  async uploadDocument(req, res, next) {
    try {
      // 1. Les données sont déjà validées par le middleware Joi ici
      // On récupère l'ID depuis le token (sécurité) et le reste du body
      const id_utilisateur = req.user.id_utilisateur;
      const { type, url_fichier, date_expiration } = req.body;

      // 2. Création en base
      const document = await prisma.document.create({
        data: {
          id_utilisateur,
          type,
          url_fichier,
          date_expiration: date_expiration || null,
          statut_verification: 'en_attente', // Forcé par le serveur
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Document téléversé avec succès et en attente de vérification.',
        data: document,
      });
    } catch (error) {
      console.error('[documentController.uploadDocument]', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors du téléversement du document.'
      });
    }
  },

  /**
   * Liste des documents de l'utilisateur connecté
   * GET /documents/me
   */
  async mesDocuments(req, res, next) {
    try {
      const id_utilisateur = req.user.id_utilisateur;

      const documents = await prisma.document.findMany({
        where: { id_utilisateur },
        orderBy: { date_soumission: 'desc' },
      });

      return res.status(200).json({
        success: true,
        count: documents.length,
        data: documents 
      });
    } catch (error) {
      console.error('[documentController.mesDocuments]', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des documents.'
      });
    }
  },

  /**
   * Vérification d'un document (Admin/Gestionnaire uniquement)
   * PATCH /documents/:id/verifier
   */
  async verifierDocument(req, res, next) {
    try {
      // On utilise 'id' car c'est ce que ton documentParamsSchema attend
      const { id } = req.params; 
      const { statut_verification } = req.body;

      // Pas besoin de 'statutsValides.includes' ici, Joi l'a déjà fait !
      const document = await prisma.document.update({
        where: { id_document: id },
        data: { 
          statut_verification,
          // Optionnel: on pourrait ajouter une date de validation ici
        }
      });

      return res.status(200).json({
        success: true,
        message: `Document marqué comme ${statut_verification}.`,
        data: document 
      });
    } catch (error) {
      // Gestion spécifique Prisma pour "Record not found"
      if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Document introuvable.' });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du document.'
      });
    }
  },
};

module.exports = documentController;