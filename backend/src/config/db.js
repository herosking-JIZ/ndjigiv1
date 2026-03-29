const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../generated/prisma/index.js');
console.log('DATABASE_URL bb:',process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ["query", "error", "warn"] : ["error"],
});

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("✅ DB Connectée avec succès");
    } catch (error) {
        console.error(`❌ Erreur de connexion : ${error.message}`);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await prisma.$disconnect();
        console.log("🐘 Connexion à la base de données fermée.");
    } catch (err) {
        console.error("Erreur lors de la déconnexion de la base de données:", err);
    }
};

module.exports = { prisma, connectDB, disconnectDB };