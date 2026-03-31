const prisma = require('../config/db');
const { modifier } = require('./vehiculeController');



const zoneTarifaireController = {


    async lister(req,res){
        try {
            const { actif , page, limit } = req.query ;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const where = {};
            if(actif !== undefined) where.actif = actif === 'true';

            const [zones , total ] = await Promise.all([
                prisma.zone_tarifaire.findMany({
                    where,
                    skip,
                    take : parseInt(limit),
                    orderBy: { nom : 'asc'}
                }),
                prisma.zone_tarifaire.count({ where })
            ]);
            return res.tatus.json({
                succes : true,
                date : zones,
                meta : {
                    total,
                    page : parseInt(page),
                    limit : parseInt(limit)
                }
            });

        }catch(error){
            console.error('[Zone.lister]', error);
            return res.status(500).json({
                "succes" : false,
                "message": "Erreur serveur."
            });
        }
    },
    async create(req, res) {
        try {
            const zone = await prisma.zone_tarifaire.create({
            data: req.body   // ← déjà validé et nettoyé par le middleware
        });

        return res.status(201).json({
            success: true,
            message: 'Zone tarifaire créée avec succès',
            data: zone
    });
    } catch (error) {
        console.error('[zone.create]', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de la zone'
        });
    }
},

    async delete(req,res){



    },

    async modifier(){


    }
}