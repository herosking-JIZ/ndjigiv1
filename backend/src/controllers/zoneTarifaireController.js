// controllers/zoneTarifaireController.js
const prisma = require('../config/db');

const zoneTarifaireController = {

    // ─────────────────────────────────────────
    // GET /zones-tarifaires
    // Lister avec pagination + filtre actif
    // ─────────────────────────────────────────
    async lister(req, res) {
        try {
            // Les valeurs sont déjà validées et typées par Joi (page/limit ont des defaults)
            const { actif, page, limit } = req.query;
            const skip  = (page - 1) * limit;
            const where = {};

            // Filtre optionnel : actif=true ou actif=false
            // Joi a déjà converti la string en boolean via .boolean()
            if (actif !== undefined) where.actif = actif;

            const [zones, total] = await Promise.all([
                prisma.zone_tarifaire.findMany({
                    where,
                    skip,
                    take     : limit,
                    orderBy  : { nom: 'asc' }
                }),
                prisma.zone_tarifaire.count({ where })
            ]);

            return res.status(200).json({        // ✅ status (pas tatus)
                success : true,                  // ✅ success (pas succes)
                data    : zones,                 // ✅ data (pas date)
                meta    : {
                    total,
                    page,
                    limit,
                    totalPages : Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('[Zone.lister]', error);
            return res.status(500).json({
                success : false,
                message : 'Erreur serveur lors de la récupération des zones.'
            });
        }
    },

    // ─────────────────────────────────────────
    // GET /zones-tarifaires/:id
    // Récupérer une zone par son ID
    // ─────────────────────────────────────────
    async findOne(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone: req.params.id }
            });

            if (!zone) {
                return res.status(404).json({
                    success : false,
                    message : 'Zone tarifaire introuvable.'
                });
            }

            return res.status(200).json({
                success : true,
                data    : zone
            });

        } catch (error) {
            console.error('[Zone.findOne]', error);
            return res.status(500).json({
                success : false,
                message : 'Erreur serveur lors de la récupération de la zone.'
            });
        }
    },

    // ─────────────────────────────────────────
    // POST /zones-tarifaires
    // Créer une zone tarifaire
    // ─────────────────────────────────────────
    async create(req, res) {
        try {
            // req.body est déjà validé et nettoyé par le middleware Joi
            const zone = await prisma.zone_tarifaire.create({
                data: req.body
            });

            return res.status(201).json({
                success : true,
                message : 'Zone tarifaire créée avec succès.',
                data    : zone
            });

        } catch (error) {
            console.error('[Zone.create]', error);

            // Contrainte d'unicité en base (si nom unique)
            if (error.code === 'P2002') {
                return res.status(409).json({
                    success : false,
                    message : 'Une zone tarifaire avec ce nom existe déjà.'
                });
            }

            return res.status(500).json({
                success : false,
                message : 'Erreur serveur lors de la création de la zone.'
            });
        }
    },

    // ─────────────────────────────────────────
    // PUT /zones-tarifaires/:id
    // Modifier une zone tarifaire
    // ─────────────────────────────────────────
    async modifier(req, res) {                   // ✅ (req, res) ajoutés
        try {
            // Vérifier que la zone existe avant de mettre à jour
            const existe = await prisma.zone_tarifaire.findUnique({
                where: { id_zone: req.params.id }
            });

            if (!existe) {
                return res.status(404).json({
                    success : false,
                    message : 'Zone tarifaire introuvable.'
                });
            }

            const zone = await prisma.zone_tarifaire.update({
                where : { id_zone: req.params.id },
                data  : req.body   // déjà validé par updateZoneSchema
            });

            return res.status(200).json({
                success : true,
                message : 'Zone tarifaire mise à jour avec succès.',
                data    : zone
            });

        } catch (error) {
            console.error('[Zone.modifier]', error);

            // Enregistrement inexistant au moment du update (race condition)
            if (error.code === 'P2025') {
                return res.status(404).json({
                    success : false,
                    message : 'Zone tarifaire introuvable.'
                });
            }

            return res.status(500).json({
                success : false,
                message : 'Erreur serveur lors de la mise à jour de la zone.'
            });
        }
    },

    // ─────────────────────────────────────────
    // DELETE /zones-tarifaires/:id
    // Supprimer une zone tarifaire
    // ─────────────────────────────────────────
    async delete(req, res) {
        try {
            // Vérifier que la zone n'est pas liée à des trajets actifs
            const trajetsLies = await prisma.trajet.count({
                where: {
                    id_zone : req.params.id,
                    statut  : { in: ['en_attente', 'en_cours'] }
                }
            });

            if (trajetsLies > 0) {
                return res.status(409).json({
                    success : false,
                    message : `Impossible de supprimer : ${trajetsLies} trajet(s) actif(s) utilisent cette zone.`
                });
            }

            await prisma.zone_tarifaire.delete({
                where: { id_zone: req.params.id }
            });

            return res.status(200).json({
                success : true,
                message : 'Zone tarifaire supprimée avec succès.'
            });

        } catch (error) {
            console.error('[Zone.delete]', error);

            if (error.code === 'P2025') {
                return res.status(404).json({
                    success : false,
                    message : 'Zone tarifaire introuvable.'
                });
            }

            // Contrainte de FK — des trajets référencent encore cette zone
            if (error.code === 'P2003') {
                return res.status(409).json({
                    success : false,
                    message : 'Impossible de supprimer : des trajets sont liés à cette zone.'
                });
            }

            return res.status(500).json({
                success : false,
                message : 'Erreur serveur lors de la suppression de la zone.'
            });
        }
    }
};

module.exports = zoneTarifaireController;