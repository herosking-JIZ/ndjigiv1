-- CreateTable
CREATE TABLE "affectation_vehicule" (
    "id_affectation" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_vehicule" UUID NOT NULL,
    "id_chauffeur" UUID NOT NULL,
    "date_debut" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin" TIMESTAMP(6),
    "motif_fin" VARCHAR(50),
    "est_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "affectation_vehicule_pkey" PRIMARY KEY ("id_affectation")
);

-- CreateTable
CREATE TABLE "avis" (
    "id_avis" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_evaluateur" UUID NOT NULL,
    "id_evalue" UUID NOT NULL,
    "id_trajet" UUID,
    "note" SMALLINT,
    "commentaire" TEXT,
    "date_avis" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id_avis")
);

-- CreateTable
CREATE TABLE "chauffeur" (
    "id_chauffeur" UUID NOT NULL,
    "statut_validation" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "type_service" VARCHAR(20) NOT NULL,
    "statut_disponibilite" VARCHAR(20) NOT NULL DEFAULT 'hors_ligne',
    "note_chauffeur" DECIMAL(3,2),
    "nb_courses_effectuees" INTEGER NOT NULL DEFAULT 0,
    "date_derniere_suspension" DATE,

    CONSTRAINT "chauffeur_pkey" PRIMARY KEY ("id_chauffeur")
);

-- CreateTable
CREATE TABLE "document" (
    "id_document" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_utilisateur" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "url_fichier" TEXT NOT NULL,
    "statut_verification" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "date_soumission" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_expiration" DATE,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id_document")
);

-- CreateTable
CREATE TABLE "incident_securite" (
    "id_incident" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_trajet" UUID,
    "id_declencheur" UUID NOT NULL,
    "type_incident" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "date_declenchement" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_securite_pkey" PRIMARY KEY ("id_incident")
);

-- CreateTable
CREATE TABLE "journal_parking" (
    "id_log" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_vehicule" UUID NOT NULL,
    "id_parking" UUID NOT NULL,
    "id_gestionnaire" UUID NOT NULL,
    "type_mouvement" VARCHAR(20),
    "etat_vehicule" VARCHAR(20),
    "besoin_maintenance" BOOLEAN DEFAULT false,
    "date_mouvement" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_parking_pkey" PRIMARY KEY ("id_log")
);

-- CreateTable
CREATE TABLE "location" (
    "id_location" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_vehicule" UUID NOT NULL,
    "id_passager" UUID NOT NULL,
    "date_debut" TIMESTAMP(6) NOT NULL,
    "date_fin" TIMESTAMP(6) NOT NULL,
    "montant_total" DECIMAL(12,2) NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'en_attente',

    CONSTRAINT "location_pkey" PRIMARY KEY ("id_location")
);

-- CreateTable
CREATE TABLE "mouvement_portefeuille" (
    "id_mouvement" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_portefeuille" UUID NOT NULL,
    "id_objet_lie" UUID,
    "type_operation" VARCHAR(30) NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "sens" VARCHAR(6) NOT NULL,
    "solde_apres" DECIMAL(12,2) NOT NULL,
    "date_operation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mouvement_portefeuille_pkey" PRIMARY KEY ("id_mouvement")
);

-- CreateTable
CREATE TABLE "paiement" (
    "id_paiement" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_utilisateur" UUID NOT NULL,
    "id_objet_lie" UUID,
    "montant" DECIMAL(12,2) NOT NULL,
    "methode" VARCHAR(20) NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "reference_transaction" VARCHAR(100),
    "date_paiement" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiement_pkey" PRIMARY KEY ("id_paiement")
);

-- CreateTable
CREATE TABLE "parking" (
    "id_parking" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" VARCHAR(100) NOT NULL,
    "adresse" TEXT NOT NULL,
    "capacite_totale" INTEGER,

    CONSTRAINT "parking_pkey" PRIMARY KEY ("id_parking")
);

-- CreateTable
CREATE TABLE "passager" (
    "id_passager" UUID NOT NULL,
    "adresses_favorites" JSONB,
    "note_passager" DECIMAL(3,2),
    "nb_courses_effectuees" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "passager_pkey" PRIMARY KEY ("id_passager")
);

-- CreateTable
CREATE TABLE "portefeuille" (
    "id_portefeuille" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_utilisateur" UUID NOT NULL,
    "solde" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "dette_commission" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "devise" CHAR(3) NOT NULL DEFAULT 'XOF',
    "statut" VARCHAR(20) NOT NULL DEFAULT 'actif',

    CONSTRAINT "portefeuille_pkey" PRIMARY KEY ("id_portefeuille")
);

-- CreateTable
CREATE TABLE "proprietaire" (
    "id_proprietaire" UUID NOT NULL,
    "statut_validation" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "note_proprietaire" DECIMAL(3,2),
    "nb_locations_effectuees" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "proprietaire_pkey" PRIMARY KEY ("id_proprietaire")
);

-- CreateTable
CREATE TABLE "reservation" (
    "id_reservation" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_passager" UUID NOT NULL,
    "id_trajet" UUID NOT NULL,
    "date_reservation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_trajet_souhaite" TIMESTAMP(6) NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "rappel_24h_envoye" BOOLEAN DEFAULT false,
    "rappel_1h_envoye" BOOLEAN DEFAULT false,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id_reservation")
);

-- CreateTable
CREATE TABLE "session" (
    "id_session" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_utilisateur" UUID NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "appareil_nom" VARCHAR(100),
    "appareil_id" VARCHAR(255),
    "adresse_ip" VARCHAR(45),
    "date_creation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "date_expiration" TIMESTAMP(6) NOT NULL,
    "est_valide" BOOLEAN DEFAULT true,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id_session")
);

-- CreateTable
CREATE TABLE "trajet" (
    "id_trajet" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_affectation" UUID NOT NULL,
    "adresse_depart" TEXT NOT NULL,
    "adresse_arrivee" TEXT NOT NULL,
    "date_heure_debut" TIMESTAMP(6),
    "date_heure_fin" TIMESTAMP(6),
    "statut" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "type_trajet" VARCHAR(20) NOT NULL,
    "tarif_final" DECIMAL(10,2),

    CONSTRAINT "trajet_pkey" PRIMARY KEY ("id_trajet")
);

-- CreateTable
CREATE TABLE "utilisateur" (
    "id_utilisateur" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_telephone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "photo_profil" TEXT,
    "adresse" TEXT,
    "tentatives_connexion" INTEGER NOT NULL DEFAULT 0,
    "bloque_jusqu_au" TIMESTAMP(3),
    "date_inscription" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut_compte" VARCHAR(20) NOT NULL DEFAULT 'actif',
    "auth_provider" VARCHAR(20) NOT NULL DEFAULT 'email',
    "note_moyenne" DECIMAL(3,2),
    "deux_fa_activee" BOOLEAN NOT NULL DEFAULT false,
    "reset_token" UUID,
    "reset_token_expire" TIMESTAMP(6),

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("id_utilisateur")
);

-- CreateTable
CREATE TABLE "utilisateur_role" (
    "id_utilisateur" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_activation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_desactivation" TIMESTAMP(6),

    CONSTRAINT "utilisateur_role_pkey" PRIMARY KEY ("id_utilisateur","role")
);

-- CreateTable
CREATE TABLE "vehicule" (
    "id_vehicule" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_proprietaire" UUID,
    "immatriculation" VARCHAR(20) NOT NULL,
    "marque" VARCHAR(60) NOT NULL,
    "modele" VARCHAR(60) NOT NULL,
    "annee" SMALLINT NOT NULL,
    "categorie" VARCHAR(20) NOT NULL,
    "nb_places" SMALLINT NOT NULL,
    "photos" JSONB,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'disponible',
    "gps_actif" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vehicule_pkey" PRIMARY KEY ("id_vehicule")
);

-- CreateIndex
CREATE UNIQUE INDEX "idx_vehicule_chauffeur_actif" ON "affectation_vehicule"("id_vehicule") WHERE (est_active = true);

-- CreateIndex
CREATE UNIQUE INDEX "paiement_reference_transaction_key" ON "paiement"("reference_transaction");

-- CreateIndex
CREATE INDEX "idx_paiement_ref" ON "paiement"("reference_transaction");

-- CreateIndex
CREATE UNIQUE INDEX "portefeuille_id_utilisateur_key" ON "portefeuille"("id_utilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "session_refresh_token_key" ON "session"("refresh_token");

-- CreateIndex
CREATE INDEX "idx_session_utilisateur" ON "session"("id_utilisateur");

-- CreateIndex
CREATE INDEX "idx_trajet_statut" ON "trajet"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_numero_telephone_key" ON "utilisateur"("numero_telephone");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateur_email_key" ON "utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicule_immatriculation_key" ON "vehicule"("immatriculation");

-- AddForeignKey
ALTER TABLE "affectation_vehicule" ADD CONSTRAINT "affectation_vehicule_id_chauffeur_fkey" FOREIGN KEY ("id_chauffeur") REFERENCES "chauffeur"("id_chauffeur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "affectation_vehicule" ADD CONSTRAINT "affectation_vehicule_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_id_evaluateur_fkey" FOREIGN KEY ("id_evaluateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_id_evalue_fkey" FOREIGN KEY ("id_evalue") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_id_trajet_fkey" FOREIGN KEY ("id_trajet") REFERENCES "trajet"("id_trajet") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chauffeur" ADD CONSTRAINT "chauffeur_id_chauffeur_fkey" FOREIGN KEY ("id_chauffeur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "incident_securite" ADD CONSTRAINT "incident_securite_id_declencheur_fkey" FOREIGN KEY ("id_declencheur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "incident_securite" ADD CONSTRAINT "incident_securite_id_trajet_fkey" FOREIGN KEY ("id_trajet") REFERENCES "trajet"("id_trajet") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "journal_parking" ADD CONSTRAINT "journal_parking_id_gestionnaire_fkey" FOREIGN KEY ("id_gestionnaire") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "journal_parking" ADD CONSTRAINT "journal_parking_id_parking_fkey" FOREIGN KEY ("id_parking") REFERENCES "parking"("id_parking") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "journal_parking" ADD CONSTRAINT "journal_parking_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_id_passager_fkey" FOREIGN KEY ("id_passager") REFERENCES "passager"("id_passager") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mouvement_portefeuille" ADD CONSTRAINT "mouvement_portefeuille_id_portefeuille_fkey" FOREIGN KEY ("id_portefeuille") REFERENCES "portefeuille"("id_portefeuille") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paiement" ADD CONSTRAINT "paiement_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "passager" ADD CONSTRAINT "passager_id_passager_fkey" FOREIGN KEY ("id_passager") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "portefeuille" ADD CONSTRAINT "portefeuille_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proprietaire" ADD CONSTRAINT "proprietaire_id_proprietaire_fkey" FOREIGN KEY ("id_proprietaire") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_id_passager_fkey" FOREIGN KEY ("id_passager") REFERENCES "passager"("id_passager") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_id_trajet_fkey" FOREIGN KEY ("id_trajet") REFERENCES "trajet"("id_trajet") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trajet" ADD CONSTRAINT "trajet_id_affectation_fkey" FOREIGN KEY ("id_affectation") REFERENCES "affectation_vehicule"("id_affectation") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utilisateur_role" ADD CONSTRAINT "utilisateur_role_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicule" ADD CONSTRAINT "vehicule_id_proprietaire_fkey" FOREIGN KEY ("id_proprietaire") REFERENCES "proprietaire"("id_proprietaire") ON DELETE NO ACTION ON UPDATE NO ACTION;
