/**
 * CONTROLLERS/AUTHCONTROLLER.JS — Logique d'authentification N'DJIGI
 *
 * register      : Inscription d'un nouvel utilisateur
 * login         : Connexion avec email/mot de passe
 * refresh       : Renouvellement du token via refresh token
 * logout        : Déconnexion (révocation de la session courante)
 * logoutAll     : Déconnexion de toutes les sessions
 * me            : Profil de l'utilisateur connecté
 * forgotPassword: Demande de réinitialisation du mot de passe
 * resetPassword : Réinitialisation avec le token reçu par email
 */

const bcrypt                     = require('bcryptjs');
const crypto                     = require('crypto');
const { prisma }                 = require('../config/db');
const { getPermissions }         = require('../config/roles');
const { sendResetPasswordEmail } = require('../utils/email');


const { generateAccessToken,
        generateRefreshToken,
        verifyRefreshToken,
        getRefreshTokenExpiry }  = require('../utils/jwt');

// ─────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────

/** Retire les champs sensibles avant d'envoyer au client */
function sanitizeUser(user) {
  const {
    mot_de_passe_hash,
    reset_token,
    reset_token_expire,
    ...userSafe
  } = user;
  return userSafe;
}

/** Extrait les rôles actifs de l'utilisateur */
function extractRoles(user) {
  if (!user.utilisateur_role) return [];
  return user.utilisateur_role
    .filter(r => r.actif)
    .map(r => r.role);
}


const AuthController = {

  // ─────────────────────────────────────────
  // POST /api/auth/register
  // ─────────────────────────────────────────
  async register(req, res) {
    try {
      const { nom, prenom, email, password, role, numero_telephone } = req.body;

      // Vérification unicité email
      const existingUser = await prisma.utilisateur.findUnique({
        where: { email }
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Un compte avec cet email existe déjà.'
        });
      }

      // Vérification unicité téléphone
      const existingPhone = await prisma.utilisateur.findUnique({
        where: { numero_telephone }
      });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'Un compte avec ce numéro de téléphone existe déjà.'
        });
      }

      // Hash du mot de passe
      const mot_de_passe_hash = await bcrypt.hash(password, 12);

      // Création utilisateur + rôle en transaction atomique
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.utilisateur.create({
          data: {
            nom,
            prenom,
            email,
            mot_de_passe_hash,
            numero_telephone,
            utilisateur_role: {
              create: {
                role:  role || 'passager',
                actif: true
              }
            }
          },
          include: {
            utilisateur_role: { where: { actif: true } }
          }
        });
        return newUser;
      });

      // Génération des tokens
      const accessToken  = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Sauvegarde de la session
      await prisma.session.create({
        data: {
          id_utilisateur:  user.id_utilisateur,
          refresh_token:   refreshToken,
          date_expiration: getRefreshTokenExpiry(),
          est_valide:      true
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Compte créé avec succès.',
        data: {
          user:   sanitizeUser(user),
          tokens: { accessToken, refreshToken }
        }
      });

    } catch (error) {
      console.error('[register]', error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'inscription."
      });
    }
  },

  // ─────────────────────────────────────────
  // POST /api/auth/login
  // ─────────────────────────────────────────
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Récupération avec rôles et mot de passe
      const user = await prisma.utilisateur.findUnique({
        where:   { email },
        include: { utilisateur_role: { where: { actif: true } } }
      });

      // Email inexistant → message générique (ne pas révéler)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect.'
        });
      }

      // Compte désactivé
      if (user.statut_compte !== 'actif') {
        return res.status(403).json({
          success: false,
          message: 'Compte désactivé. Contactez l\'administrateur.'
        });
      }

      // Vérification blocage brute force
      if (user.bloque_jusqu_au && user.bloque_jusqu_au > new Date()) {
        const remaining = Math.ceil(
          (new Date(user.bloque_jusqu_au) - Date.now()) / 60000
        );
        return res.status(423).json({
          success: false,
          message: `Compte temporairement bloqué. Réessayez dans ${remaining} minute(s).`
        });
      }

      // Vérification mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe_hash);

      if (!isPasswordValid) {
        // Incrémenter les tentatives
        const tentatives = user.tentatives_connexion + 1;
        const bloque_jusqu_au = tentatives >= 5
          ? new Date(Date.now() + 15 * 60 * 1000) // bloqué 15 min après 5 échecs
          : null;

        await prisma.utilisateur.update({
          where: { id_utilisateur: user.id_utilisateur },
          data:  { tentatives_connexion: tentatives, bloque_jusqu_au }
        });

        // Message d'alerte si proche du blocage
        const restantes = 5 - tentatives;
        const message = restantes > 0
          ? `Email ou mot de passe incorrect. (${restantes} tentative(s) restante(s))`
          : 'Compte bloqué 15 minutes suite à trop de tentatives.';

        return res.status(401).json({ success: false, message });
      }

      // ✅ Connexion réussie → réinitialiser le compteur
      await prisma.utilisateur.update({
        where: { id_utilisateur: user.id_utilisateur },
        data:  {
          tentatives_connexion: 0,
          bloque_jusqu_au:      null
        }
      });

      // Génération des tokens
      const accessToken  = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Sauvegarde session
      await prisma.session.create({
        data: {
          id_utilisateur:  user.id_utilisateur,
          refresh_token:   refreshToken,
          date_expiration: getRefreshTokenExpiry(),
          est_valide:      true
        }
      });

      const roles = extractRoles(user);

      return res.status(200).json({
        success: true,
        message: 'Connexion réussie.',
        data: {
          user:        sanitizeUser(user),
          permissions: getPermissions(roles),
          tokens:      { accessToken, refreshToken }
        }
      });

    } catch (error) {
      console.error('[login]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la connexion.'
      });
    }
  },

  // ─────────────────────────────────────────
  // POST /api/auth/refresh
  // ─────────────────────────────────────────
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token manquant.'
        });
      }

      // Vérification en base
      const session = await prisma.session.findUnique({
        where: { refresh_token: refreshToken }
      });

      if (!session || !session.est_valide) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token invalide ou révoqué.'
        });
      }

      // Vérification expiration en base
      if (session.date_expiration < new Date()) {
        await prisma.session.update({
          where: { refresh_token: refreshToken },
          data:  { est_valide: false }
        });
        return res.status(401).json({
          success: false,
          message: 'Refresh token expiré. Reconnectez-vous.',
          code: 'REFRESH_EXPIRED'
        });
      }

      // Vérification signature JWT
      const decoded = verifyRefreshToken(refreshToken);

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: 'Type de token invalide.'
        });
      }

      // Récupération utilisateur
      const user = await prisma.utilisateur.findUnique({
        where:   { id_utilisateur: decoded.sub },
        include: { utilisateur_role: { where: { actif: true } } }
      });

      if (!user || user.statut_compte !== 'actif') {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur introuvable ou inactif.'
        });
      }

      // Rotation des tokens : invalider l'ancien
      await prisma.session.update({
        where: { refresh_token: refreshToken },
        data:  { est_valide: false }
      });

      // Créer les nouveaux tokens
      const newAccessToken  = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      await prisma.session.create({
        data: {
          id_utilisateur:  user.id_utilisateur,
          refresh_token:   newRefreshToken,
          date_expiration: getRefreshTokenExpiry(),
          est_valide:      true
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Tokens renouvelés avec succès.',
        data: {
          tokens: {
            accessToken:  newAccessToken,
            refreshToken: newRefreshToken
          }
        }
      });

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expiré. Reconnectez-vous.',
          code: 'REFRESH_EXPIRED'
        });
      }
      console.error('[refresh]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du renouvellement du token.'
      });
    }
  },

  // ─────────────────────────────────────────
  // POST /api/auth/logout
  // ─────────────────────────────────────────
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await prisma.session.updateMany({
          where: {
            refresh_token:  refreshToken,
            id_utilisateur: req.user.id_utilisateur // sécurité : ne révoquer que sa propre session
          },
          data: { est_valide: false }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Déconnexion réussie.'
      });

    } catch (error) {
      console.error('[logout]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion.'
      });
    }
  },

  // ─────────────────────────────────────────
  // POST /api/auth/logout-all
  // ─────────────────────────────────────────
  async logoutAll(req, res) {
    try {
      await prisma.session.updateMany({
        where: { id_utilisateur: req.user.id_utilisateur },
        data:  { est_valide: false }
      });

      return res.status(200).json({
        success: true,
        message: 'Déconnecté de toutes les sessions.'
      });

    } catch (error) {
      console.error('[logoutAll]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion globale.'
      });
    }
  },

  // ─────────────────────────────────────────
  // GET /api/auth/me
  // ─────────────────────────────────────────
  me(req, res) {
    const roles = extractRoles(req.user);
    return res.status(200).json({
      success: true,
      data: {
        user:        req.user,
        permissions: getPermissions(roles)
      }
    });
  },

  // ─────────────────────────────────────────
  // POST /api/auth/forgot-password
  // ─────────────────────────────────────────
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Réponse identique dans tous les cas (anti-énumération)
      const successResponse = () => res.status(200).json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.'
      });

      const user = await prisma.utilisateur.findUnique({
        where: { email }
      });

      if (!user || user.statut_compte !== 'actif') {
        return successResponse();
      }

      // Générer token UUID + expiration 15 min
      const reset_token        = crypto.randomUUID();
      const reset_token_expire = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.utilisateur.update({
        where: { email },
        data:  { reset_token, reset_token_expire }
      });

      // Envoyer l'email
      await sendResetPasswordEmail(email, user.prenom, reset_token);

      return successResponse();

    } catch (error) {
      console.error('[forgotPassword]', error);
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la demande de réinitialisation."
      });
    }
  },

  // ─────────────────────────────────────────
  // POST /api/auth/reset-password
  // ─────────────────────────────────────────
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Chercher utilisateur avec token valide et non expiré
      const user = await prisma.utilisateur.findFirst({
        where: {
          reset_token:        token,
          reset_token_expire: { gt: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Lien invalide ou expiré. Faites une nouvelle demande.'
        });
      }

      const mot_de_passe_hash = await bcrypt.hash(newPassword, 12);

      // Transaction : nouveau mdp + effacer token + révoquer sessions
      await prisma.$transaction([
        prisma.utilisateur.update({
          where: { id_utilisateur: user.id_utilisateur },
          data: {
            mot_de_passe_hash,
            reset_token:          null,
            reset_token_expire:   null,
            tentatives_connexion: 0,
            bloque_jusqu_au:      null
          }
        }),
        prisma.session.updateMany({
          where: { id_utilisateur: user.id_utilisateur },
          data:  { est_valide: false }
        })
      ]);

      return res.status(200).json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.'
      });

    } catch (error) {
      console.error('[resetPassword]', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la réinitialisation.'
      });
    }
  }
};

module.exports = AuthController;