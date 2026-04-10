/*
  Warnings:

  - Made the column `id_proprietaire` on table `vehicule` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "chauffeur" ADD COLUMN     "date_expiration_permis" DATE,
ADD COLUMN     "numero_permis" VARCHAR(30),
ADD COLUMN     "solde_commission_du" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "parking" ADD COLUMN     "capacite_occupee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7);

-- AlterTable
ALTER TABLE "trajet" ADD COLUMN     "coordonnees_arrivee" JSONB,
ADD COLUMN     "coordonnees_depart" JSONB,
ADD COLUMN     "distance_km" DECIMAL(8,2),
ADD COLUMN     "duree_estimee_min" INTEGER,
ADD COLUMN     "id_zone" UUID,
ADD COLUMN     "polyline_trajet" TEXT;

-- AlterTable
ALTER TABLE "utilisateur" ADD COLUMN     "supprime_le" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vehicule" ADD COLUMN     "climatisation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "couleur" VARCHAR(30),
ADD COLUMN     "latitude_actuelle" DECIMAL(10,7),
ADD COLUMN     "longitude_actuelle" DECIMAL(10,7),
ADD COLUMN     "supprime_le" TIMESTAMP(3),
ALTER COLUMN "id_proprietaire" SET NOT NULL;

-- CreateTable
CREATE TABLE "code_promo" (
    "id_promo" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(30) NOT NULL,
    "type_reduction" VARCHAR(20) NOT NULL,
    "valeur" DECIMAL(8,2) NOT NULL,
    "date_debut" TIMESTAMP(6) NOT NULL,
    "date_fin" TIMESTAMP(6),
    "nb_utilisations_max" INTEGER,
    "nb_utilisations_actuel" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "code_promo_pkey" PRIMARY KEY ("id_promo")
);

-- CreateTable
CREATE TABLE "gestionnaire_parking" (
    "id_gestionnaire" UUID NOT NULL,
    "id_parking" UUID NOT NULL,
    "date_prise_poste" DATE,

    CONSTRAINT "gestionnaire_parking_pkey" PRIMARY KEY ("id_gestionnaire")
);

-- CreateTable
CREATE TABLE "notification" (
    "id_notification" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_utilisateur" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "titre" VARCHAR(100) NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "date_creation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_lecture" TIMESTAMP(6),
    "id_objet_lie" UUID,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id_notification")
);

-- CreateTable
CREATE TABLE "tracking_vehicule" (
    "id_tracking" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_vehicule" UUID NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "vitesse" INTEGER,
    "cap" INTEGER,
    "horodatage" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_vehicule_pkey" PRIMARY KEY ("id_tracking")
);

-- CreateTable
CREATE TABLE "utilisation_promo" (
    "id_utilisateur" UUID NOT NULL,
    "id_promo" UUID NOT NULL,
    "id_trajet" UUID NOT NULL,
    "date_utilisation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisation_promo_pkey" PRIMARY KEY ("id_utilisateur","id_promo")
);

-- CreateTable
CREATE TABLE "zone_tarifaire" (
    "id_zone" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" VARCHAR(60) NOT NULL,
    "tarif_base" DECIMAL(8,2) NOT NULL,
    "tarif_km" DECIMAL(6,2) NOT NULL,
    "tarif_minute" DECIMAL(6,2) NOT NULL,
    "coefficient_max" DECIMAL(4,2) NOT NULL DEFAULT 3.0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "zone_tarifaire_pkey" PRIMARY KEY ("id_zone")
);

-- CreateIndex
CREATE UNIQUE INDEX "code_promo_code_key" ON "code_promo"("code");

-- CreateIndex
CREATE INDEX "idx_gestionnaire_parking" ON "gestionnaire_parking"("id_parking");

-- CreateIndex
CREATE INDEX "idx_notification_utilisateur_lu" ON "notification"("id_utilisateur", "lu");

-- CreateIndex
CREATE INDEX "idx_tracking_vehicule_horodatage" ON "tracking_vehicule"("id_vehicule", "horodatage");

-- CreateIndex
CREATE INDEX "idx_utilisation_promo_trajet" ON "utilisation_promo"("id_trajet");

-- CreateIndex
CREATE INDEX "idx_trajet_zone" ON "trajet"("id_zone");

-- AddForeignKey
ALTER TABLE "gestionnaire_parking" ADD CONSTRAINT "gestionnaire_parking_id_gestionnaire_fkey" FOREIGN KEY ("id_gestionnaire") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "gestionnaire_parking" ADD CONSTRAINT "gestionnaire_parking_id_parking_fkey" FOREIGN KEY ("id_parking") REFERENCES "parking"("id_parking") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tracking_vehicule" ADD CONSTRAINT "tracking_vehicule_id_vehicule_fkey" FOREIGN KEY ("id_vehicule") REFERENCES "vehicule"("id_vehicule") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trajet" ADD CONSTRAINT "trajet_id_zone_fkey" FOREIGN KEY ("id_zone") REFERENCES "zone_tarifaire"("id_zone") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utilisation_promo" ADD CONSTRAINT "utilisation_promo_id_promo_fkey" FOREIGN KEY ("id_promo") REFERENCES "code_promo"("id_promo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utilisation_promo" ADD CONSTRAINT "utilisation_promo_id_trajet_fkey" FOREIGN KEY ("id_trajet") REFERENCES "trajet"("id_trajet") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "utilisation_promo" ADD CONSTRAINT "utilisation_promo_id_utilisateur_fkey" FOREIGN KEY ("id_utilisateur") REFERENCES "utilisateur"("id_utilisateur") ON DELETE NO ACTION ON UPDATE NO ACTION;
