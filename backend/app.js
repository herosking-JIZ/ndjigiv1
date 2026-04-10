const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connectDB, disconnectDB } = require('./src/config/db');
const  route  = require('./src/routes/index');

const app = express();
app.set('etag', false)
const PORT = process.env.PORT || 8000;


// Connexion à la base de données

connectDB();

// --- MIDDLEWARES DE SÉCURITÉ ---
app.use(helmet());
app.use(cors());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limite chaque IP à 100 requêtes
    message: {
        success: false,
        message: "Trop de requêtes, réessayez plus tard."
    }
});
app.use(limiter);

// --- PARSING ---
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true }));




app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.log('Format de donnees json invalide');
        return res.status(400).json({
            success: false,
            error: "Format JSON invalide. Vérifiez vos guillemets !"
        });
    }
    next();
});

// --- LOGGER DE REQUÊTES ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    console.log(`${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} => ${res.statusCode} (${duration}ms)\x1b[0m`);
  });
  next();
});

// --- INTERCEPTEUR POUR STANDARDISER LES RÉPONSES API ---
app.use('/api/v1', (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (body && typeof body === 'object') {
            const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

            const finalSuccess = body.success !== undefined ? body.success : isSuccess;
            const finalMessage = body.message || (isSuccess ? 'Opération réussie' : 'Une erreur est survenue');
            let finalData = null;
            const finalErrors = body.errors !== undefined ? body.errors : null;

            if (body.data !== undefined) {
                finalData = body.data;
            } else if (Array.isArray(body)) {
                finalData = body;
            } else {
                // S'il reste des clés utiles dans body en dehors de success/message/errors/data
                const { success, message, errors, data, ...rest } = body;
                if (Object.keys(rest).length > 0) {
                    finalData = rest;
                }
            }

            return originalJson.call(this, {
                success: finalSuccess,
                message: finalMessage,
                data: finalData,
                errors: finalErrors
            });
        }
        return originalJson.call(this, body);
    };
    next();
});

// --- ROUTES ---

app.use('/api/v1',route);

// Health Check (Correction de Date.now)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur N'DJIGI à l'écoute sur le port : ${PORT}`);
});

// --- GESTION DES ERREURS ET ARRÊT GRACIEUX ---


const gracefulShutdown = async (signal, exitCode) => {
    console.log(`\n ⚠️ ${signal} reçu. Fermeture du serveur N'DJIGI...`);
    
    if (server) {
        server.close(async () => {
            console.log("HTTP server fermé.");
            try {
                // Importation dynamique ou via ton module db.js
                await disconnectDB();
                console.log("Connexion Prisma fermée.");
                process.exit(exitCode);
            } catch (err) {
                console.error("Erreur lors de la déconnexion Prisma:", err);
                process.exit(1);
            }
        });
    } else {
        process.exit(exitCode);
    }
};


// Gestion des erreurs


// 1. Capture des exceptions synchrones (ex: variable non définie)
process.on("uncaughtException", (err) => {
    console.error("❌ ERREUR CRITIQUE (Uncaught Exception):", err.message);
    console.error(err.stack);
    // On ferme immédiatement car l'état de l'app est corrompu
    gracefulShutdown("uncaughtException", 1);
});

// 2. Capture des promesses non gérées (ex: Prisma error sans catch)
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ PROMESSE NON GÉRÉE (Unhandled Rejection) à:", promise, "raison:", reason);
    // On ferme proprement car une opération DB a échoué dans le vide
    gracefulShutdown("unhandledRejection", 1);
});


// 3. Signal de terminaison (ex: CTRL+C ou arrêt Docker/PM2)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM", 0));
process.on("SIGINT", () => gracefulShutdown("SIGINT", 0));



