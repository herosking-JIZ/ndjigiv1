import axios, { AxiosInstance } from 'axios'
import type {
  ApiResponse,
  LoginCredentials, LoginResponseData,
  Utilisateur, PaginatedResponse, AccountStatus, CreateUserPayload,
  Document, DocumentStatus,
  Trajet,
  Transaction, FinanceKpis, Wallet, DepotPayload,
  Parking, VehiculeParking, MouvementParking,
  ZoneTarifaire, CategorieVehicule, CodePromo,
  AdminKpis, ChartDataPoint, TopChauffeur,
  Ticket,
} from '@/types'
import * as mock from '@/data/mockData'
import { STORAGE_KEY_ACCESS, STORAGE_KEY_REFRESH } from '@/contexts/AuthContext'

// ─── Mode démo ────────────────────────────────────────────────
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'
function delay(ms = 300) { return new Promise((r) => setTimeout(r, ms)) }

// ═══════════════════════════════════════════════════════════════
// AXIOS INSTANCE
// ═══════════════════════════════════════════════════════════════
const api: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Injecter le token sur chaque requête ────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY_ACCESS)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Gérer les réponses : unwrap { success, data } ──────────
// Le backend renvoie toujours { success, message, data, errors }
// On unwrap automatiquement pour retourner directement `data`
api.interceptors.response.use(
  (res) => {
    // Si la réponse suit le contrat { success, data }, on retourne la réponse telle quelle
    // L'unwrap se fait dans chaque service (voir extractData)
    return res
  },
  async (err) => {
    const status = err.response?.status

    // Token expiré → tenter le refresh
    if (status === 401) {
      const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH)
      if (refreshToken && !err.config._retry) {
        err.config._retry = true
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
          const newToken = data.data?.tokens?.accessToken
          if (newToken) {
            localStorage.setItem(STORAGE_KEY_ACCESS, newToken)
            err.config.headers.Authorization = `Bearer ${newToken}`
            return api(err.config)
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY_ACCESS)
          localStorage.removeItem(STORAGE_KEY_REFRESH)
          localStorage.removeItem('ndjigi_user')
          localStorage.removeItem('ndjigi_permissions')
          window.location.href = '/login'
          return Promise.reject(err)  // ← ajouter ça pour stopper la chaîne

          // Refresh échoué → déconnexion
        }
      }
      // Pas de refresh token ou refresh échoué → déconnexion
      localStorage.removeItem(STORAGE_KEY_ACCESS)
      localStorage.removeItem(STORAGE_KEY_REFRESH)
      localStorage.removeItem('ndjigi_user')
      localStorage.removeItem('ndjigi_permissions')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Helper : extraire data depuis { success, message, data } ─
// Lance une erreur avec le message backend si success=false
function extractData<T>(apiResponse: ApiResponse<T>): T {
  if (!apiResponse.success) {
    const err: any = new Error(apiResponse.message || 'Erreur serveur')
    err.backendErrors = apiResponse.errors
    throw err
  }
  return apiResponse.data
}

// ─── In-memory state pour le mode démo ───────────────────────
let _users = [...mock.MOCK_UTILISATEURS]
let _documents = [...mock.MOCK_DOCUMENTS]
let _trajets = [...mock.MOCK_TRAJETS]
let _transactions = [...mock.MOCK_TRANSACTIONS]
let _parkings = [...mock.MOCK_PARKINGS]
let _vehicules = [...mock.MOCK_VEHICULES_PARKING]
let _mouvements = [...mock.MOCK_MOUVEMENTS]
let _zones = [...mock.MOCK_ZONES]
let _categories = [...mock.MOCK_CATEGORIES]
let _promos = [...mock.MOCK_PROMOS]

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
export const authService = {
  // Retourne LoginResponseData (pas le wrapper)
  login: async (creds: LoginCredentials): Promise<LoginResponseData> => {
    if (IS_DEMO) {
      await delay()
      const expectedPwd = mock.MOCK_PASSWORDS[creds.email]
      if (!expectedPwd || expectedPwd !== creds.password) {
        const err: any = new Error('Identifiants incorrects')
        err.response = { data: { success: false, message: 'Identifiants incorrects' }, status: 401 }
        throw err
      }
      return mock.MOCK_LOGIN_DATA[creds.email]
    }
    const { data } = await api.post<ApiResponse<LoginResponseData>>('/auth/login', creds)
    return extractData(data)
  },

  logout: async () => {
    if (IS_DEMO) { await delay(100); return }
    try { await api.post('/auth/logout') } catch { /* ignorer */ }
  },

  // Demander un email de réinitialisation
  forgotPassword: async (email: string): Promise<void> => {
    if (IS_DEMO) { await delay(500); return }
    const { data } = await api.post<ApiResponse<null>>('/auth/forgot-password', { email })
    extractData(data)
  },

  // Réinitialiser le mot de passe avec le token reçu par email
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    if (IS_DEMO) { await delay(500); return }
    const { data } = await api.post<ApiResponse<null>>('/auth/reset-password', {
      token,
      nouveau_mot_de_passe: newPassword,
    })
    extractData(data)
  },

  // Changer le mot de passe (utilisateur connecté)
  changePassword: async (ancienMotDePasse: string, nouveauMotDePasse: string): Promise<void> => {
    if (IS_DEMO) { await delay(500); return }
    const { data } = await api.post<ApiResponse<null>>('/auth/change-password', {
      ancien_mot_de_passe: ancienMotDePasse,
      nouveau_mot_de_passe: nouveauMotDePasse,
    })
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// UTILISATEURS
// ═══════════════════════════════════════════════════════════════
export const utilisateursService = {
  list: async (params?: {
    page?: number; limit?: number; search?: string; role?: string; statut?: string
  }): Promise<PaginatedResponse<Utilisateur>> => {
    if (IS_DEMO) {
      await delay()
      const filtered = mock.filterUsers(params?.search ?? '', params?.role ?? '', params?.statut ?? '')
      return mock.paginate(filtered, params?.page ?? 1, params?.limit ?? 20)
    }
    const response = await api.get<ApiResponse<Utilisateur[]> & { meta: { total: number; page: number; limit: number } }>('/utilisateurs', { params })
    const utilisateurs = extractData(response.data);
    const meta = response.data.meta ;
    return {
      data: utilisateurs,
      total: meta?.total ?? 0,
      page: meta?.page ?? 1,
      limit: meta?.limit ?? 20,
      totalPages: Math.ceil((meta?.total ?? 0) / (meta?.limit ?? 20)),
    }
    
  },

  getById: async (id: string): Promise<Utilisateur> => {
    if (IS_DEMO) {
      await delay()
      return _users.find((x) => x.id_utilisateur === id) ?? _users[0]
    }
    const { data } = await api.get<ApiResponse<Utilisateur>>(`/utilisateurs/${id}`)
    return extractData(data)
  },

  updateStatut: async (id: string, statut: AccountStatus): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      _users = _users.map((u) => u.id_utilisateur === id ? { ...u, statut_compte: statut } : u)
      return
    }
    const { data } = await api.patch<ApiResponse<null>>(`/utilisateurs/${id}/statut`, { statut })
    extractData(data)
  },

  // Création d'utilisateur par l'admin (gestionnaire, chauffeur, etc.)
  create: async (payload: CreateUserPayload): Promise<Utilisateur> => {
    if (IS_DEMO) {
      await delay(500)
      const newUser: Utilisateur = {
        id_utilisateur: `u-${Date.now()}`,
        nom: payload.nom,
        prenom: payload.prenom,
        email: payload.email,
        numero_telephone: payload.numero_telephone,
        adresse: payload.adresse,
        statut_compte: 'actif',
        date_inscription: new Date().toISOString(),
        roles: [payload.role],
        parking_id: payload.parking_id,
      }
      _users = [newUser, ..._users]
      return newUser
    }
    const { data } = await api.post<ApiResponse<Utilisateur>>('auth/admin/users', payload)
    return extractData(data)
  },

  // Dépôt admin vers wallet passager
  depot: async (payload: DepotPayload): Promise<void> => {
    if (IS_DEMO) { await delay(400); return }
    const { data } = await api.post<ApiResponse<null>>('/utilisateurs/depot', payload)
    extractData(data)
  },

  // Wallet d'un utilisateur
  getWallet: async (id: string): Promise<Wallet> => {
    if (IS_DEMO) {
      await delay()
      return { id_portefeuille: `w-${id}`, id_utilisateur: id, solde: 12500, dette_commission: 0, devise: 'XOF', statut: 'actif' }
    }
    const { data } = await api.get<ApiResponse<Wallet>>(`/utilisateurs/${id}/wallet`)
    return extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════
export const documentsService = {
  listEnAttente: async (): Promise<Document[]> => {
    if (IS_DEMO) { await delay(); return _documents.filter((d) => d.statut_verification === 'en_attente') }
    const { data } = await api.get<ApiResponse<Document[]>>('/documents?statut=en_attente')
    return extractData(data)
  },
  listHistorique: async (): Promise<Document[]> => {
    if (IS_DEMO) { await delay(); return _documents.filter((d) => d.statut_verification !== 'en_attente') }
    const { data } = await api.get<ApiResponse<Document[]>>('/documents?statut=valide,rejete')
    return extractData(data)
  },
  valider: async (id: string): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      _documents = _documents.map((d) => d.id_document === id ? { ...d, statut_verification: 'valide' as DocumentStatus } : d)
      return
    }
    const { data } = await api.patch<ApiResponse<null>>(`/documents/${id}/valider`)
    extractData(data)
  },
  rejeter: async (id: string, motif: string): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      _documents = _documents.map((d) => d.id_document === id ? { ...d, statut_verification: 'rejete' as DocumentStatus } : d)
      return
    }
    const { data } = await api.patch<ApiResponse<null>>(`/documents/${id}/rejeter`, { motif })
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// TRAJETS
// ═══════════════════════════════════════════════════════════════
export const trajetsService = {
  enCours: async (): Promise<Trajet[]> => {
    if (IS_DEMO) { await delay(); return _trajets.filter((t) => t.statut === 'en_cours') }
    const { data } = await api.get<ApiResponse<Trajet[]>>('/trajets?statut=en_cours')
    return extractData(data)
  },




historique: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Trajet>> => {
  if (IS_DEMO) {
    await delay()
    const q = (params?.search ?? '').toLowerCase()
    const filtered = _trajets.filter((t) =>
      !q ||
      t.passager_nom.toLowerCase().includes(q) ||
      t.chauffeur_nom.toLowerCase().includes(q) ||
      t.adresse_depart.toLowerCase().includes(q) ||
      t.statut.includes(q)
    )
    return mock.paginate(filtered, params?.page ?? 1, params?.limit ?? 20)
  }

  // ✅ extractData retourne { data, total, page, limit, totalPages }
  const { data } = await api.get<ApiResponse<PaginatedResponse<Trajet>>>('/trajets/historique', { params })
  return extractData(data)  // PaginatedResponse directement
},



  
}

// ═══════════════════════════════════════════════════════════════
// FINANCES
// ═══════════════════════════════════════════════════════════════
export const financesService = {
  kpis: async (): Promise<FinanceKpis> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_FINANCE_KPIS }
    const { data } = await api.get<ApiResponse<FinanceKpis>>('/finances/kpis')
    return extractData(data)
  },
  transactions: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Transaction>> => {
    if (IS_DEMO) {
      await delay()
      const q = (params?.search ?? '').toLowerCase()
      const filtered = _transactions.filter((t) => !q || t.description.toLowerCase().includes(q) || t.type.includes(q) || t.statut.includes(q))
      return mock.paginate(filtered, params?.page ?? 1, params?.limit ?? 20)
    }
    const { data } = await api.get<ApiResponse<PaginatedResponse<Transaction>>>('/finances/transactions', { params })
    return extractData(data)
  },
  // Wallet global de la plateforme (commissions accumulées)
  walletPlateforme: async (): Promise<{ solde: number; total_commissions: number }> => {
    if (IS_DEMO) { await delay(); return { solde: 4_250_000, total_commissions: 5_100_000 } }
    const { data } = await api.get<ApiResponse<{ solde: number; total_commissions: number }>>('/finances/wallet-plateforme')
    return extractData(data)
  },
  // Faire un remboursement
  rembourser: async (payload: { id_utilisateur: string; montant: number; motif: string; id_ticket?: string }): Promise<void> => {
    if (IS_DEMO) { await delay(400); return }
    const { data } = await api.post<ApiResponse<null>>('/finances/rembourser', payload)
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// SUPPORT / TICKETS
// ═══════════════════════════════════════════════════════════════
export const supportService = {
  list: async (params?: { page?: number; limit?: number; search?: string; statut?: string }): Promise<PaginatedResponse<Ticket>> => {
    if (IS_DEMO) { await delay(); return mock.paginate(mock.MOCK_TICKETS, params?.page ?? 1, params?.limit ?? 20) }
    const { data } = await api.get<ApiResponse<PaginatedResponse<Ticket>>>('/support/tickets', { params })
    return extractData(data)
  },
  getById: async (id: string): Promise<Ticket> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_TICKETS.find((t) => t.id_ticket === id) ?? mock.MOCK_TICKETS[0] }
    const { data } = await api.get<ApiResponse<Ticket>>(`/support/tickets/${id}`)
    return extractData(data)
  },
  updateStatut: async (id: string, statut: string): Promise<void> => {
    if (IS_DEMO) { await delay(); return }
    const { data } = await api.patch<ApiResponse<null>>(`/support/tickets/${id}/statut`, { statut })
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// PARKINGS (admin)
// ═══════════════════════════════════════════════════════════════
export const parkingsService = {
  list: async (): Promise<Parking[]> => {
    if (IS_DEMO) { await delay(); return _parkings }
    const { data } = await api.get<ApiResponse<Parking[]>>('/parkings')
    return extractData(data)
  },
  update: async (id: string, payload: Partial<Parking>): Promise<Parking> => {
    if (IS_DEMO) {
      await delay()
      _parkings = _parkings.map((p) => p.id_parking === id ? { ...p, ...payload } : p)
      return _parkings.find((p) => p.id_parking === id)!
    }
    const { data } = await api.put<ApiResponse<Parking>>(`/parkings/${id}`, payload)
    return extractData(data)
  },
  mouvements: async (params?: { search?: string }): Promise<MouvementParking[]> => {
    if (IS_DEMO) {
      await delay()
      const q = (params?.search ?? '').toLowerCase()
      return _mouvements.filter((m) => !q || m.immatriculation.toLowerCase().includes(q) || m.parking_nom.toLowerCase().includes(q) || m.parkeur_nom.toLowerCase().includes(q))
    }
    const { data } = await api.get<ApiResponse<MouvementParking[]>>('/parkings/mouvements', { params })
    return extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// PARKEUR (gestionnaire)
// ═══════════════════════════════════════════════════════════════
export const parkeurService = {
  monParking: async (parkingId: string): Promise<Parking> => {
    if (IS_DEMO) { await delay(); return _parkings.find((p) => p.id_parking === parkingId) ?? _parkings[0] }
    const { data } = await api.get<ApiResponse<Parking>>(`/parkings/${parkingId}`)
    return extractData(data)
  },
  vehiculesPresents: async (parkingId: string): Promise<VehiculeParking[]> => {
    if (IS_DEMO) { await delay(); return _vehicules }
    const { data } = await api.get<ApiResponse<VehiculeParking[]>>(`/parkings/${parkingId}/vehicules`)
    return extractData(data)
  },
  mouvements: async (parkingId: string, params?: { search?: string }): Promise<MouvementParking[]> => {
    if (IS_DEMO) {
      await delay()
      const q = (params?.search ?? '').toLowerCase()
      return _mouvements.filter((m) => m.id_parking === parkingId && (!q || m.immatriculation.toLowerCase().includes(q) || (m.commentaire ?? '').toLowerCase().includes(q)))
    }
    const { data } = await api.get<ApiResponse<MouvementParking[]>>(`/parkings/${parkingId}/mouvements`, { params })
    return extractData(data)
  },
  receptionVehicule: async (parkingId: string, payload: { immatriculation: string; etat_vehicule: string; commentaire?: string }): Promise<void> => {
    if (IS_DEMO) {
      await delay(400)
      const newMvt: MouvementParking = {
        id_log: `m-${Date.now()}`, id_vehicule: `v-${Date.now()}`,
        immatriculation: payload.immatriculation, id_parking: parkingId,
        parking_nom: _parkings.find((p) => p.id_parking === parkingId)?.nom ?? 'Parking',
        parkeur_nom: 'Gestionnaire', type_mouvement: 'entree',
        etat_vehicule: payload.etat_vehicule as any, date_mouvement: new Date().toISOString(),
        commentaire: payload.commentaire,
      }
      _mouvements = [newMvt, ..._mouvements]
      _parkings = _parkings.map((p) => p.id_parking === parkingId ? { ...p, capacite_occupee: p.capacite_occupee + 1 } : p)
      return
    }
    const { data } = await api.post<ApiResponse<null>>(`/parkings/${parkingId}/entree`, payload)
    extractData(data)
  },
  sortieVehicule: async (parkingId: string, payload: { immatriculation: string; etat_vehicule: string; commentaire?: string }): Promise<void> => {
    if (IS_DEMO) {
      await delay(400)
      const newMvt: MouvementParking = {
        id_log: `m-${Date.now()}`, id_vehicule: `v-${Date.now()}`,
        immatriculation: payload.immatriculation, id_parking: parkingId,
        parking_nom: _parkings.find((p) => p.id_parking === parkingId)?.nom ?? 'Parking',
        parkeur_nom: 'Gestionnaire', type_mouvement: 'sortie',
        etat_vehicule: payload.etat_vehicule as any, date_mouvement: new Date().toISOString(),
        commentaire: payload.commentaire,
      }
      _mouvements = [newMvt, ..._mouvements]
      _parkings = _parkings.map((p) => p.id_parking === parkingId ? { ...p, capacite_occupee: Math.max(0, p.capacite_occupee - 1) } : p)
      return
    }
    const { data } = await api.post<ApiResponse<null>>(`/parkings/${parkingId}/sortie`, payload)
    extractData(data)
  },
  updateVehicule: async (vehiculeId: string, payload: { immatriculation: string; marque: string; modele: string; categorie: string }): Promise<void> => {
    if (IS_DEMO) {
      await delay()
      _vehicules = _vehicules.map((v) => v.id_vehicule === vehiculeId ? { ...v, ...payload } : v)
      return
    }
    const { data } = await api.patch<ApiResponse<null>>(`/vehicules/${vehiculeId}`, payload)
    extractData(data)
  },
  declencherMaintenance: async (parkingId: string, vehiculeId: string, motif: string): Promise<void> => {
    if (IS_DEMO) {
      await delay(400)
      _vehicules = _vehicules.map((v) => v.id_vehicule === vehiculeId ? { ...v, statut: 'maintenance' as const } : v)
      const veh = _vehicules.find((v) => v.id_vehicule === vehiculeId)
      if (veh) {
        const mvt: MouvementParking = {
          id_log: `m-${Date.now()}`, id_vehicule: vehiculeId, immatriculation: veh.immatriculation,
          id_parking: parkingId, parking_nom: _parkings.find((p) => p.id_parking === parkingId)?.nom ?? '',
          parkeur_nom: 'Gestionnaire', type_mouvement: 'sortie', etat_vehicule: 'a_verifier',
          date_mouvement: new Date().toISOString(), commentaire: `🔧 Maintenance déclenchée — ${motif}`,
        }
        _mouvements = [mvt, ..._mouvements]
      }
      return
    }
    const { data } = await api.post<ApiResponse<null>>(`/parkings/${parkingId}/maintenance`, { id_vehicule: vehiculeId, motif })
    extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export const configService = {
  listZones: async (): Promise<ZoneTarifaire[]> => {
    if (IS_DEMO) { await delay(); return _zones }
    const { data } = await api.get<ApiResponse<ZoneTarifaire[]>>('/config/zones'); return extractData(data)
  },
  createZone: async (payload: Omit<ZoneTarifaire, 'id_zone'>): Promise<ZoneTarifaire> => {
    if (IS_DEMO) { await delay(); const z = { ...payload, id_zone: `z-${Date.now()}` }; _zones = [..._zones, z]; return z }
    const { data } = await api.post<ApiResponse<ZoneTarifaire>>('/config/zones', payload); return extractData(data)
  },
  updateZone: async (id: string, payload: Partial<ZoneTarifaire>): Promise<ZoneTarifaire> => {
    if (IS_DEMO) { await delay(); _zones = _zones.map((z) => z.id_zone === id ? { ...z, ...payload } : z); return _zones.find((z) => z.id_zone === id)! }
    const { data } = await api.put<ApiResponse<ZoneTarifaire>>(`/config/zones/${id}`, payload); return extractData(data)
  },
  deleteZone: async (id: string): Promise<void> => {
    if (IS_DEMO) { await delay(); _zones = _zones.filter((z) => z.id_zone !== id); return }
    const { data } = await api.delete<ApiResponse<null>>(`/config/zones/${id}`); extractData(data)
  },
  listCategories: async (): Promise<CategorieVehicule[]> => {
    if (IS_DEMO) { await delay(); return _categories }
    const { data } = await api.get<ApiResponse<CategorieVehicule[]>>('/config/categories'); return extractData(data)
  },
  createCategorie: async (payload: Omit<CategorieVehicule, 'id'>): Promise<CategorieVehicule> => {
    if (IS_DEMO) { await delay(); const c = { ...payload, id: `c-${Date.now()}` }; _categories = [..._categories, c]; return c }
    const { data } = await api.post<ApiResponse<CategorieVehicule>>('/config/categories', payload); return extractData(data)
  },
  updateCategorie: async (id: string, payload: Partial<CategorieVehicule>): Promise<CategorieVehicule> => {
    if (IS_DEMO) { await delay(); _categories = _categories.map((c) => c.id === id ? { ...c, ...payload } : c); return _categories.find((c) => c.id === id)! }
    const { data } = await api.put<ApiResponse<CategorieVehicule>>(`/config/categories/${id}`, payload); return extractData(data)
  },
  deleteCategorie: async (id: string): Promise<void> => {
    if (IS_DEMO) { await delay(); _categories = _categories.filter((c) => c.id !== id); return }
    const { data } = await api.delete<ApiResponse<null>>(`/config/categories/${id}`); extractData(data)
  },
  listPromos: async (): Promise<CodePromo[]> => {
    if (IS_DEMO) { await delay(); return _promos }
    const { data } = await api.get<ApiResponse<CodePromo[]>>('/config/promos'); return extractData(data)
  },
  createPromo: async (payload: Omit<CodePromo, 'id_promo' | 'nb_utilisations_actuel'>): Promise<CodePromo> => {
    if (IS_DEMO) { await delay(); const p = { ...payload, id_promo: `pr-${Date.now()}`, nb_utilisations_actuel: 0 }; _promos = [..._promos, p]; return p }
    const { data } = await api.post<ApiResponse<CodePromo>>('/config/promos', payload); return extractData(data)
  },
  updatePromo: async (id: string, payload: Partial<CodePromo>): Promise<CodePromo> => {
    if (IS_DEMO) { await delay(); _promos = _promos.map((p) => p.id_promo === id ? { ...p, ...payload } : p); return _promos.find((p) => p.id_promo === id)! }
    const { data } = await api.put<ApiResponse<CodePromo>>(`/config/promos/${id}`, payload); return extractData(data)
  },
  deletePromo: async (id: string): Promise<void> => {
    if (IS_DEMO) { await delay(); _promos = _promos.filter((p) => p.id_promo !== id); return }
    const { data } = await api.delete<ApiResponse<null>>(`/config/promos/${id}`); extractData(data)
  },
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// 
export const dashboardService = {
  kpis: async (): Promise<AdminKpis> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_KPIS }
    const { data } = await api.get<ApiResponse<AdminKpis>>('/dashboard/kpis'); return extractData(data)
  },
  coursesSemaine: async (): Promise<ChartDataPoint[]> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_COURSES_SEMAINE }
    const { data } = await api.get<ApiResponse<ChartDataPoint[]>>('/dashboard/courses-semaine'); return extractData(data)
  },
  evolutionMensuelle: async (): Promise<ChartDataPoint[]> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_EVOLUTION }
    const { data } = await api.get<ApiResponse<ChartDataPoint[]>>('/dashboard/evolution-mensuelle'); return extractData(data)
  },
  moyensPaiement: async (): Promise<{ name: string; value: number }[]> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_PAIEMENTS }
    const { data } = await api.get<ApiResponse<{ name: string; value: number }[]>>('/dashboard/moyens-paiement'); return extractData(data)
  },
  topChauffeurs: async (): Promise<TopChauffeur[]> => {
    if (IS_DEMO) { await delay(); return mock.MOCK_TOP_CHAUFFEURS }
    const { data } = await api.get<ApiResponse<TopChauffeur[]>>('/dashboard/top-chauffeurs'); return extractData(data)
  },
}
