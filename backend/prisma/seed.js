// prisma/seed.js
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma/index.js');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── UUIDs fixes pour pouvoir référencer entre entités ───────
const IDS = {
    // Utilisateurs
    admin: 'a0000000-0000-0000-0000-000000000001',
    passager1: 'b0000000-0000-0000-0000-000000000001',
    passager2: 'b0000000-0000-0000-0000-000000000002',
    passager3: 'b0000000-0000-0000-0000-000000000003',
    chauffeur1: 'c0000000-0000-0000-0000-000000000001',
    chauffeur2: 'c0000000-0000-0000-0000-000000000002',
    chauffeur3: 'c0000000-0000-0000-0000-000000000003',
    chauffeur4: 'c0000000-0000-0000-0000-000000000004',
    chauffeur5: 'c0000000-0000-0000-0000-000000000005',
    chauffeur6: 'c0000000-0000-0000-0000-000000000006',
    chauffeur7: 'c0000000-0000-0000-0000-000000000007',
    proprietaire1: 'd0000000-0000-0000-0000-000000000001',
    proprietaire2: 'd0000000-0000-0000-0000-000000000002',
    gestionnaire1: 'e0000000-0000-0000-0000-000000000001',
    gestionnaire2: 'e0000000-0000-0000-0000-000000000002',

    // Parkings
    parking1: 'f0000000-0000-0000-0000-000000000001',
    parking2: 'f0000000-0000-0000-0000-000000000002',

    // Véhicules
    vehicule1: '10000000-0000-0000-0000-000000000001',
    vehicule2: '10000000-0000-0000-0000-000000000002',
    vehicule3: '10000000-0000-0000-0000-000000000003',
    vehicule4: '10000000-0000-0000-0000-000000000004',

    // Affectations
    affectation1: '20000000-0000-0000-0000-000000000001',
    affectation2: '20000000-0000-0000-0000-000000000002',
    affectation3: '20000000-0000-0000-0000-000000000003',

    // Zone tarifaire
    zone1: '30000000-0000-0000-0000-000000000001',

    // Trajets
    trajet1: '40000000-0000-0000-0000-000000000001',
    trajet2: '40000000-0000-0000-0000-000000000002',

    // Code promo
    promo1: '50000000-0000-0000-0000-000000000001',
}

async function main() {
    console.log('🌱 Début du seed...')

    const hash = await bcrypt.hash('Password123!', 10)

    // ─── 1. UTILISATEURS ──────────────────────────────────────
    console.log('👤 Création des utilisateurs...')

    const utilisateurs = [
        // Admin
        {
            id_utilisateur: IDS.admin,
            nom: 'Diallo',
            prenom: 'Amadou',
            email: 'admin@parkway.bf',
            numero_telephone: '+22670000001',
            mot_de_passe_hash: hash,
            adresse: 'Avenue Kwame Nkrumah, Ouagadougou',
            statut_compte: 'actif',
        },
        // Passagers
        {
            id_utilisateur: IDS.passager1,
            nom: 'Ouedraogo',
            prenom: 'Fatima',
            email: 'fatima.ouedraogo@gmail.com',
            numero_telephone: '+22670000002',
            mot_de_passe_hash: hash,
            adresse: 'Secteur 15, Ouagadougou',
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.passager2,
            nom: 'Compaoré',
            prenom: 'Ibrahim',
            email: 'ibrahim.compaore@gmail.com',
            numero_telephone: '+22670000003',
            mot_de_passe_hash: hash,
            adresse: 'Gounghin, Ouagadougou',
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.passager3,
            nom: 'Sawadogo',
            prenom: 'Marie',
            email: 'marie.sawadogo@gmail.com',
            numero_telephone: '+22670000004',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        // Chauffeurs
        {
            id_utilisateur: IDS.chauffeur1,
            nom: 'Kaboré',
            prenom: 'Seydou',
            email: 'seydou.kabore@gmail.com',
            numero_telephone: '+22670000005',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.chauffeur2,
            nom: 'Traoré',
            prenom: 'Moussa',
            email: 'moussa.traore@gmail.com',
            numero_telephone: '+22670000006',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.chauffeur3,
            nom: 'Zongo',
            prenom: 'Lassina',
            email: 'lassina.zongo@gmail.com',
            numero_telephone: '+22670000007',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.chauffeur4,
            nom: 'Nikiema',
            prenom: 'Adama',
            email: 'adama.nikiema@gmail.com',
            numero_telephone: '+22670000008',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.chauffeur5,
            nom: 'Ilboudo',
            prenom: 'Rasmane',
            email: 'rasmane.ilboudo@gmail.com',
            numero_telephone: '+22670000009',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.chauffeur6,
            nom: 'Ouattara',
            prenom: 'Hamidou',
            email: 'hamidou.ouattara@gmail.com',
            numero_telephone: '+22670000010',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.chauffeur7,
            nom: 'Belem',
            prenom: 'Justin',
            email: 'justin.belem@gmail.com',
            numero_telephone: '+22670000011',
            mot_de_passe_hash: hash,
            statut_compte: 'suspendu',
        },
        // Propriétaires
        {
            id_utilisateur: IDS.proprietaire1,
            nom: 'Coulibaly',
            prenom: 'Salif',
            email: 'salif.coulibaly@gmail.com',
            numero_telephone: '+22670000012',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.proprietaire2,
            nom: 'Barry',
            prenom: 'Aïssata',
            email: 'aissata.barry@gmail.com',
            numero_telephone: '+22670000013',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        // Gestionnaires
        {
            id_utilisateur: IDS.gestionnaire1,
            nom: 'Some',
            prenom: 'Eric',
            email: 'eric.some@parkway.bf',
            numero_telephone: '+22670000014',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
        {
            id_utilisateur: IDS.gestionnaire2,
            nom: 'Tapsoba',
            prenom: 'Alice',
            email: 'alice.tapsoba@parkway.bf',
            numero_telephone: '+22670000015',
            mot_de_passe_hash: hash,
            statut_compte: 'actif',
        },
    ]

    for (const u of utilisateurs) {
        await prisma.utilisateur.upsert({
            where: { id_utilisateur: u.id_utilisateur },
            update: {},
            create: u,
        })
    }

    // ─── 2. RÔLES ─────────────────────────────────────────────
    console.log('🎭 Attribution des rôles...')

    const roles = [
        { id_utilisateur: IDS.admin, role: 'admin' },
        { id_utilisateur: IDS.passager1, role: 'passager' },
        { id_utilisateur: IDS.passager2, role: 'passager' },
        { id_utilisateur: IDS.passager3, role: 'passager' },
        { id_utilisateur: IDS.chauffeur1, role: 'chauffeur' },
        { id_utilisateur: IDS.chauffeur2, role: 'chauffeur' },
        { id_utilisateur: IDS.chauffeur3, role: 'chauffeur' },
        { id_utilisateur: IDS.chauffeur4, role: 'chauffeur' },
        { id_utilisateur: IDS.chauffeur5, role: 'chauffeur' },
        { id_utilisateur: IDS.chauffeur6, role: 'chauffeur' },
        { id_utilisateur: IDS.chauffeur7, role: 'chauffeur' },
        { id_utilisateur: IDS.proprietaire1, role: 'proprietaire' },
        { id_utilisateur: IDS.proprietaire2, role: 'proprietaire' },
        { id_utilisateur: IDS.gestionnaire1, role: 'gestionnaire' },
        { id_utilisateur: IDS.gestionnaire2, role: 'gestionnaire' },
    ]

    for (const r of roles) {
        await prisma.utilisateur_role.upsert({
            where: { id_utilisateur_role: { id_utilisateur: r.id_utilisateur, role: r.role } },
            update: {},
            create: { ...r, actif: true },
        })
    }

    // ─── 3. PORTEFEUILLES ─────────────────────────────────────
    console.log('💰 Création des portefeuilles...')

    const portefeuilleIds = [
        IDS.passager1, IDS.passager2, IDS.passager3,
        IDS.chauffeur1, IDS.chauffeur2, IDS.chauffeur3,
        IDS.chauffeur4, IDS.chauffeur5, IDS.chauffeur6, IDS.chauffeur7,
        IDS.proprietaire1, IDS.proprietaire2,
    ]

    for (const id of portefeuilleIds) {
        await prisma.portefeuille.upsert({
            where: { id_utilisateur: id },
            update: {},
            create: {
                id_utilisateur: id,
                solde: Math.floor(Math.random() * 50000) + 5000,
                devise: 'XOF',
                statut: 'actif',
            },
        })
    }

    // ─── 4. TABLES SATELLITES UTILISATEURS ────────────────────
    console.log('🔧 Création des profils satellites...')

    // Passagers
    for (const id of [IDS.passager1, IDS.passager2, IDS.passager3]) {
        await prisma.passager.upsert({
            where: { id_passager: id },
            update: {},
            create: { id_passager: id, nb_courses_effectuees: Math.floor(Math.random() * 20) },
        })
    }

    // Chauffeurs
    const chauffeurIds = [
        IDS.chauffeur1, IDS.chauffeur2, IDS.chauffeur3, IDS.chauffeur4,
        IDS.chauffeur5, IDS.chauffeur6, IDS.chauffeur7,
    ]
    const statutsDisponibilite = ['disponible', 'en_course', 'hors_ligne']

    for (const id of chauffeurIds) {
        await prisma.chauffeur.upsert({
            where: { id_chauffeur: id },
            update: {},
            create: {
                id_chauffeur: id,
                statut_validation: 'valide',
                type_service: 'vtc',
                statut_disponibilite: statutsDisponibilite[Math.floor(Math.random() * 3)],
                note_chauffeur: (3.5 + Math.random() * 1.5).toFixed(2),
                nb_courses_effectuees: Math.floor(Math.random() * 100) + 10,
                numero_permis: `BF-${Math.floor(Math.random() * 900000) + 100000}`,
                date_expiration_permis: new Date('2027-12-31'),
            },
        })
    }

    // Propriétaires
    for (const id of [IDS.proprietaire1, IDS.proprietaire2]) {
        await prisma.proprietaire.upsert({
            where: { id_proprietaire: id },
            update: {},
            create: {
                id_proprietaire: id,
                statut_validation: 'valide',
                nb_locations_effectuees: Math.floor(Math.random() * 30),
            },
        })
    }

    // ─── 5. PARKINGS ──────────────────────────────────────────
    console.log('🅿️  Création des parkings...')

    await prisma.parking.upsert({
        where: { id_parking: IDS.parking1 },
        update: {},
        create: {
            id_parking: IDS.parking1,
            nom: 'Parking Central Ouaga',
            adresse: 'Avenue de la Nation, Ouagadougou',
            capacite_totale: 50,
            capacite_occupee: 12,
            latitude: 12.3647,
            longitude: -1.5334,
        },
    })

    await prisma.parking.upsert({
        where: { id_parking: IDS.parking2 },
        update: {},
        create: {
            id_parking: IDS.parking2,
            nom: 'Parking Zogona',
            adresse: 'Quartier Zogona, Ouagadougou',
            capacite_totale: 30,
            capacite_occupee: 5,
            latitude: 12.3801,
            longitude: -1.5204,
        },
    })

    // ─── 6. GESTIONNAIRES DE PARKING ──────────────────────────
    console.log('🏢 Affectation des gestionnaires...')

    await prisma.gestionnaire_parking.upsert({
        where: { id_gestionnaire: IDS.gestionnaire1 },
        update: {},
        create: {
            id_gestionnaire: IDS.gestionnaire1,
            id_parking: IDS.parking1,
            date_prise_poste: new Date('2024-01-15'),
        },
    })

    await prisma.gestionnaire_parking.upsert({
        where: { id_gestionnaire: IDS.gestionnaire2 },
        update: {},
        create: {
            id_gestionnaire: IDS.gestionnaire2,
            id_parking: IDS.parking2,
            date_prise_poste: new Date('2024-03-01'),
        },
    })

    // ─── 7. VÉHICULES ─────────────────────────────────────────
    console.log('🚗 Création des véhicules...')

    const vehicules = [
        {
            id_vehicule: IDS.vehicule1,
            id_proprietaire: IDS.proprietaire1,
            immatriculation: 'BF-1234-AB',
            marque: 'Toyota',
            modele: 'Corolla',
            annee: 2020,
            categorie: 'berline',
            nb_places: 4,
            couleur: 'Blanc',
            statut: 'disponible',
            climatisation: true,
            gps_actif: true,
        },
        {
            id_vehicule: IDS.vehicule2,
            id_proprietaire: IDS.proprietaire1,
            immatriculation: 'BF-5678-CD',
            marque: 'Honda',
            modele: 'CR-V',
            annee: 2021,
            categorie: 'suv',
            nb_places: 5,
            couleur: 'Gris',
            statut: 'disponible',
            climatisation: true,
            gps_actif: false,
        },
        {
            id_vehicule: IDS.vehicule3,
            id_proprietaire: IDS.proprietaire2,
            immatriculation: 'BF-9012-EF',
            marque: 'Hyundai',
            modele: 'Accent',
            annee: 2019,
            categorie: 'berline',
            nb_places: 4,
            couleur: 'Noir',
            statut: 'disponible',
            climatisation: true,
            gps_actif: true,
        },
        {
            id_vehicule: IDS.vehicule4,
            id_proprietaire: IDS.proprietaire2,
            immatriculation: 'BF-3456-GH',
            marque: 'Renault',
            modele: 'Duster',
            annee: 2022,
            categorie: 'suv',
            nb_places: 5,
            couleur: 'Bleu',
            statut: 'en_maintenance',
            climatisation: false,
            gps_actif: false,
        },
    ]

    for (const v of vehicules) {
        await prisma.vehicule.upsert({
            where: { id_vehicule: v.id_vehicule },
            update: {},
            create: v,
        })
    }

    // ─── 8. AFFECTATIONS VÉHICULE → CHAUFFEUR ─────────────────
    console.log('🔗 Affectation véhicules aux chauffeurs...')

    const affectations = [
        { id_affectation: IDS.affectation1, id_vehicule: IDS.vehicule1, id_chauffeur: IDS.chauffeur1 },
        { id_affectation: IDS.affectation2, id_vehicule: IDS.vehicule2, id_chauffeur: IDS.chauffeur2 },
        { id_affectation: IDS.affectation3, id_vehicule: IDS.vehicule3, id_chauffeur: IDS.chauffeur3 },
    ]

    for (const a of affectations) {
        await prisma.affectation_vehicule.upsert({
            where: { id_affectation: a.id_affectation },
            update: {},
            create: { ...a, est_active: true },
        })
    }

    // ─── 9. ZONE TARIFAIRE ────────────────────────────────────
    console.log('💲 Création des zones tarifaires...')

    await prisma.zone_tarifaire.upsert({
        where: { id_zone: IDS.zone1 },
        update: {},
        create: {
            id_zone: IDS.zone1,
            nom: 'Zone Centrale Ouagadougou',
            tarif_base: 500,
            tarif_km: 250,
            tarif_minute: 50,
            coefficient_max: 2.5,
            actif: true,
        },
    })

    // ─── 10. TRAJETS ──────────────────────────────────────────
    console.log('🛣️  Création des trajets...')

    await prisma.trajet.upsert({
        where: { id_trajet: IDS.trajet1 },
        update: {},
        create: {
            id_trajet: IDS.trajet1,
            id_affectation: IDS.affectation1,
            id_zone: IDS.zone1,
            adresse_depart: 'Avenue Kwame Nkrumah, Ouagadougou',
            adresse_arrivee: 'Aéroport International de Ouagadougou',
            distance_km: 8.5,
            duree_estimee_min: 20,
            date_heure_debut: new Date('2025-03-10T08:00:00Z'),
            date_heure_fin: new Date('2025-03-10T08:22:00Z'),
            statut: 'termine',
            type_trajet: 'vtc',
            tarif_final: 3625,
        },
    })

    await prisma.trajet.upsert({
        where: { id_trajet: IDS.trajet2 },
        update: {},
        create: {
            id_trajet: IDS.trajet2,
            id_affectation: IDS.affectation2,
            id_zone: IDS.zone1,
            adresse_depart: 'Quartier Zogona, Ouagadougou',
            adresse_arrivee: 'Marché Rood Woko, Ouagadougou',
            distance_km: 4.2,
            duree_estimee_min: 12,
            date_heure_debut: new Date('2025-03-11T14:00:00Z'),
            date_heure_fin: new Date('2025-03-11T14:15:00Z'),
            statut: 'termine',
            type_trajet: 'vtc',
            tarif_final: 1550,
        },
    })

    // ─── 11. DOCUMENTS ────────────────────────────────────────
    console.log('📄 Création des documents...')

    const docs = [
        { id_utilisateur: IDS.chauffeur1, type: 'permis', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/permis_c1.pdf', date_expiration: new Date('2027-06-30') },
        { id_utilisateur: IDS.chauffeur1, type: 'cni', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/cni_c1.pdf' },
        { id_utilisateur: IDS.chauffeur2, type: 'permis', statut_verification: 'en_attente', url_fichier: 'https://storage.parkway.bf/docs/permis_c2.pdf', date_expiration: new Date('2026-12-31') },
        { id_utilisateur: IDS.chauffeur3, type: 'permis', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/permis_c3.pdf', date_expiration: new Date('2028-03-15') },
        { id_utilisateur: IDS.proprietaire1, type: 'carte_grise', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/cg_p1_v1.pdf' },
        { id_utilisateur: IDS.proprietaire1, type: 'assurance', statut_verification: 'valide', url_fichier: 'https://storage.parkway.bf/docs/ass_p1.pdf', date_expiration: new Date('2026-01-01') },
        { id_utilisateur: IDS.proprietaire2, type: 'carte_grise', statut_verification: 'rejete', url_fichier: 'https://storage.parkway.bf/docs/cg_p2.pdf' },
    ]

    for (const d of docs) {
        await prisma.document.create({ data: d })
    }

    // ─── 12. CODE PROMO ───────────────────────────────────────
    console.log('🎟️  Création des codes promo...')

    await prisma.code_promo.upsert({
        where: { id_promo: IDS.promo1 },
        update: {},
        create: {
            id_promo: IDS.promo1,
            code: 'BIENVENUE20',
            type_reduction: 'pourcentage',
            valeur: 20,
            date_debut: new Date('2025-01-01'),
            date_fin: new Date('2025-12-31'),
            nb_utilisations_max: 100,
            actif: true,
        },
    })

    // ─── 13. AVIS ─────────────────────────────────────────────
    console.log('⭐ Création des avis...')

    await prisma.avis.create({
        data: {
            id_evaluateur: IDS.passager1,
            id_evalue: IDS.chauffeur1,
            id_trajet: IDS.trajet1,
            note: 5,
            commentaire: 'Excellent chauffeur, très ponctuel et courtois.',
        },
    })

    await prisma.avis.create({
        data: {
            id_evaluateur: IDS.passager2,
            id_evalue: IDS.chauffeur2,
            id_trajet: IDS.trajet2,
            note: 4,
            commentaire: 'Bon trajet, voiture propre.',
        },
    })

    console.log('✅ Seed terminé avec succès !')
    console.log('')
    console.log('📋 Comptes créés (mot de passe : Password123!) :')
    console.log('   admin@parkway.bf          → Admin')
    console.log('   fatima.ouedraogo@gmail.com → Passager')
    console.log('   ibrahim.compaore@gmail.com → Passager')
    console.log('   marie.sawadogo@gmail.com   → Passager')
    console.log('   seydou.kabore@gmail.com    → Chauffeur')
    console.log('   salif.coulibaly@gmail.com  → Propriétaire')
    console.log('   eric.some@parkway.bf       → Gestionnaire (Parking Central)')
    console.log('   alice.tapsoba@parkway.bf   → Gestionnaire (Parking Zogona)')
}

main()
    .catch((e) => {
        console.error('❌ Erreur seed :', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })