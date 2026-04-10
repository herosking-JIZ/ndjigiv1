// controllers/zoneTarifaireController.js
const { prisma } = require('../config/db'); // Destructuration si ton db.js exporte { prisma }

const zoneTarifaireController = {

    // ─────────────────────────────────────────
    // GET /zones-tarifaires
    // ─────────────────────────────────────────
    async lister(req, res) {
        try {
            const { actif, page, limit } = req.query;
            const skip  = (page - 1) * limit;
            const where = {};

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

            return res.status(200).json({
                success : true,
                message : 'Zones tarifaires récupérées avec succès.',
                data    : zones,
                meta    : {
                    total,
                    page,
                    limit,
                    totalPages : Math.ceil(total / limit)
                },
                errors: null
            });

        } catch (error) {
            console.error('[Zone.lister]', error);
            return res.status(500).json({
                success : false,
                message : 'Erreur serveur lors de la récupération des zones.',
                data    : null,
                errors  : error.message
            });
        }
    },

    // ─────────────────────────────────────────
    // GET /zones-tarifaires/:id
    // ─────────────────────────────────────────
    async findOne(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.findUnique({
                where: { id_zone: req.params.id }
            });

            if (!zone) {
                return res.status(404).json({
                    success : false,
                    message : 'Zone tarifaire introuvable.',
                    data    : null,
                    errors  : { code: 'ZONE_NOT_FOUND' }
                });
            }

            return res.status(200).json({
                success : true,
                message : 'Zone tarifaire trouvée.',
                data    : zone,
                errors  : null
            });

        } catch (error) {
            console.error('[Zone.findOne]', error);
            return res.status(500).json({
                success : false,
                message : 'Erreur serveur.',
                data    : null,
                errors  : error.message
            });
        }
    },

    // ─────────────────────────────────────────
    // POST /zones-tarifaires
    // ─────────────────────────────────────────
    async create(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.create({
                data: req.body
            });

            return res.status(201).json({
                success : true,
                message : 'Zone tarifaire créée avec succès.',
                data    : zone,
                errors  : null
            });

        } catch (error) {
            console.error('[Zone.create]', error);

            if (error.code === 'P2002') {
                return res.status(409).json({
                    success : false,
                    message : 'Une zone tarifaire avec ce nom existe déjà.',
                    data    : null,
                    errors  : { field: 'nom', code: 'DUPLICATE_VALUE' }
                });
            }

            return res.status(500).json({
                success : false,
                message : 'Erreur serveur lors de la création.',
                data    : null,
                errors  : error.message
            });
        }
    },

    // ─────────────────────────────────────────
    // PUT /zones-tarifaires/:id
    // ─────────────────────────────────────────
    async modifier(req, res) {
        try {
            // Note: .update() échoue de lui-même si l'ID n'existe pas (P2025)
            // On peut donc se passer du .findUnique préalable pour gagner une requête,
            // sauf si on a une logique métier complexe avant l'update.
            const zone = await prisma.zone_tarifaire.update({
                where : { id_zone: req.params.id },
                data  : req.body
            });

            return res.status(200).json({
                success : true,
                message : 'Zone tarifaire mise à jour avec succès.',
                data    : zone,
                errors  : null
            });

        } catch (error) {
            console.error('[Zone.modifier]', error);

            if (error.code === 'P2025') {
                return res.status(404).json({
                    success : false,
                    message : 'Zone tarifaire introuvable.',
                    data    : null,
                    errors  : { code: 'ZONE_NOT_FOUND' }
                });
            }

            return res.status(500).json({
                success : false,
                message : 'Erreur serveur lors de la modification.',
                data    : null,
                errors  : error.message
            });
        }
    },

    // ─────────────────────────────────────────
    // DELETE /zones-tarifaires/:id
    // ─────────────────────────────────────────
    async delete(req, res) {
        try {
            // Vérification des trajets liés (Bonne pratique !)
            // On peut aussi gérer cela via un "Soft Delete" (actif: false)
            // pour garder l'historique des prix des anciens trajets.
            const trajetsLies = await prisma.trajet.count({
                where: {
                    id_zone : req.params.id,
                    statut  : { in: ['en_attente', 'en_cours'] }
                }
            });

            if (trajetsLies > 0) {
                return res.status(409).json({
                    success : false,
                    message : `Suppression impossible : ${trajetsLies} trajet(s) actif(s) en cours.`,
                    data    : null,
                    errors  : { code: 'DEPENDENCY_CONFLICT', count: trajetsLies }
                });
            }

            await prisma.zone_tarifaire.delete({
                where: { id_zone: req.params.id }
            });

            return res.status(200).json({
                success : true,
                message : 'Zone tarifaire supprimée avec succès.',
                data    : null,
                errors  : null
            });

        } catch (error) {
            console.error('[Zone.delete]', error);

            if (error.code === 'P2025') {
                return res.status(404).json({
                    success : false,
                    message : 'Zone tarifaire introuvable.',
                    data    : null,
                    errors  : { code: 'ZONE_NOT_FOUND' }
                });
            }

            if (error.code === 'P2003') {
                return res.status(409).json({
                    success : false,
                    message : 'Impossible de supprimer : des données historiques y sont liées.',
                    data    : null,
                    errors  : { code: 'FK_CONSTRAINT' }
                });
            }

            return res.status(500).json({
                success : false,
                message : 'Erreur serveur.',
                data    : null,
                errors  : error.message
            });
        }
    }
};

module.exports = zoneTarifaireController;