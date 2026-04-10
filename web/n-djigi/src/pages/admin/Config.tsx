import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Zap, TrendingUp } from 'lucide-react'
import { configService } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { formatDateShort } from '@/lib/utils'
import type { ZoneTarifaire, CategorieVehicule, CodePromo } from '@/types'

type Tab = 'zones' | 'categories' | 'promos'

// ─── Zones tarifaires ──────────────────────────────────────────
function ZonesTab() {
  const { toast } = useToast()
  const [zones, setZones] = useState<ZoneTarifaire[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<ZoneTarifaire> | null>(null)
  const [isNew, setIsNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setZones(await configService.listZones()) } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setIsNew(true); setModal({ nom: '', tarif_base: 0, tarif_km: 0, tarif_minute: 0, coefficient_max: 3, actif: true }) }
  const openEdit = (z: ZoneTarifaire) => { setIsNew(false); setModal({ ...z }) }

  const handleSave = async () => {
    if (!modal) return
    try {
      if (isNew) {
        await configService.createZone(modal as Omit<ZoneTarifaire, 'id_zone'>)
        toast({ title: 'Zone créée', variant: 'success' })
      } else {
        await configService.updateZone(modal.id_zone!, modal)
        toast({ title: 'Zone mise à jour', variant: 'success' })
      }
      setModal(null); load()
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette zone ?')) return
    try { await configService.deleteZone(id); toast({ title: 'Zone supprimée' }); load() }
    catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nouvelle zone
        </button>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Zone', 'Base FCFA', '/km', '/min', 'Coeff. max', 'Statut', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => <tr key={i} className="border-b border-border">{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>)
            ) : zones.map((z) => (
              <tr key={z.id_zone} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{z.nom}</td>
                <td className="px-4 py-3 font-mono">{z.tarif_base}</td>
                <td className="px-4 py-3 font-mono">{z.tarif_km}</td>
                <td className="px-4 py-3 font-mono">{z.tarif_minute}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-warning/15 text-warning text-xs rounded-md border border-warning/30">
                    <Zap className="h-3 w-3" />{z.coefficient_max}×
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={async () => { await configService.updateZone(z.id_zone, { actif: !z.actif }); load() }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${z.actif ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${z.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(z)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(z.id_zone)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">{isNew ? 'Nouvelle zone' : 'Modifier la zone'}</h2>
            <div className="space-y-3">
              {[
                { key: 'nom', label: 'Nom', type: 'text' },
                { key: 'tarif_base', label: 'Tarif base (FCFA)', type: 'number' },
                { key: 'tarif_km', label: 'Tarif/km (FCFA)', type: 'number' },
                { key: 'tarif_minute', label: 'Tarif/min (FCFA)', type: 'number' },
                { key: 'coefficient_max', label: 'Coefficient max', type: 'number', step: '0.1' },
              ].map(({ key, label, type, step }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type={type} step={step} value={(modal as any)[key] ?? ''} onChange={(e) => setModal((m) => ({ ...m, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Active</label>
                <button onClick={() => setModal((m) => ({ ...m, actif: !m?.actif }))} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${modal.actif ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${modal.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm">Annuler</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Catégories ────────────────────────────────────────────────
function CategoriesTab() {
  const { toast } = useToast()
  const [cats, setCats] = useState<CategorieVehicule[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<CategorieVehicule> | null>(null)
  const [isNew, setIsNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setCats(await configService.listCategories()) } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setIsNew(true); setModal({ icone: '🚗', nom: '', description: '', places_min: 1, places_max: 4, multiplicateur: 1, actif: true }) }
  const openEdit = (c: CategorieVehicule) => { setIsNew(false); setModal({ ...c }) }

  const handleSave = async () => {
    if (!modal) return
    try {
      if (isNew) await configService.createCategorie(modal as Omit<CategorieVehicule, 'id'>)
      else await configService.updateCategorie(modal.id!, modal)
      toast({ title: isNew ? 'Catégorie créée' : 'Catégorie mise à jour', variant: 'success' })
      setModal(null); load()
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    try { await configService.deleteCategorie(id); toast({ title: 'Catégorie supprimée' }); load() }
    catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nouvelle catégorie
        </button>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-4 relative">
              <div className="absolute top-3 right-3">
                <button
                  onClick={async () => { await configService.updateCategorie(c.id, { actif: !c.actif }); load() }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.actif ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${c.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-3 pr-10">
                <span className="text-3xl">{c.icone}</span>
                <div>
                  <p className="font-semibold">{c.nom}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span>{c.places_min}–{c.places_max} places</span>
                <span className="flex items-center gap-1 text-primary font-medium">
                  <TrendingUp className="h-3 w-3" />×{c.multiplicateur}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium">Modifier</button>
                <button onClick={() => handleDelete(c.id)} className="px-3 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-xs font-medium">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">{isNew ? 'Nouvelle catégorie' : 'Modifier'}</h2>
            <div className="space-y-3">
              {[
                { key: 'icone', label: 'Icône (emoji)', type: 'text' },
                { key: 'nom', label: 'Nom', type: 'text' },
                { key: 'description', label: 'Description', type: 'text' },
                { key: 'places_min', label: 'Places min', type: 'number' },
                { key: 'places_max', label: 'Places max', type: 'number' },
                { key: 'multiplicateur', label: 'Multiplicateur tarif', type: 'number', step: '0.1' },
              ].map(({ key, label, type, step }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type={type} step={step} value={(modal as any)[key] ?? ''} onChange={(e) => setModal((m) => ({ ...m, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm">Annuler</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Codes promo ───────────────────────────────────────────────
function PromosTab() {
  const { toast } = useToast()
  const [promos, setPromos] = useState<CodePromo[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Partial<CodePromo> | null>(null)
  const [isNew, setIsNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setPromos(await configService.listPromos()) } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setIsNew(true)
    setModal({ code: '', type_reduction: 'pourcentage', valeur: 10, date_debut: new Date().toISOString().slice(0, 10), actif: true, nb_utilisations_actuel: 0 })
  }
  const openEdit = (p: CodePromo) => { setIsNew(false); setModal({ ...p }) }

  const handleSave = async () => {
    if (!modal) return
    if (modal.type_reduction === 'pourcentage' && (modal.valeur ?? 0) > 100) {
      toast({ title: 'Erreur', description: 'Le pourcentage ne peut pas dépasser 100', variant: 'destructive' }); return
    }
    try {
      if (isNew) await configService.createPromo(modal as any)
      else await configService.updatePromo(modal.id_promo!, modal)
      toast({ title: isNew ? 'Code créé' : 'Code mis à jour', variant: 'success' })
      setModal(null); load()
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
  }

  const getProgressColor = (actuel: number, max?: number) => {
    if (!max) return 'bg-success'
    const pct = actuel / max
    if (pct >= 1) return 'bg-destructive'
    if (pct >= 0.75) return 'bg-warning'
    return 'bg-success'
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nouveau code
        </button>
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Code', 'Type', 'Valeur', 'Période', 'Utilisations', 'Statut', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => <tr key={i} className="border-b border-border">{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>)
              ) : promos.map((p) => (
                <tr key={p.id_promo} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <code className="px-2 py-0.5 bg-muted rounded font-mono text-xs font-semibold">{p.code}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${p.type_reduction === 'pourcentage' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                      {p.type_reduction === 'pourcentage' ? '%' : 'FCFA'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{p.type_reduction === 'pourcentage' ? `${p.valeur}%` : `${p.valeur} FCFA`}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDateShort(p.date_debut)} → {p.date_fin ? formatDateShort(p.date_fin) : '∞'}
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="text-xs mb-1">{p.nb_utilisations_actuel}{p.nb_utilisations_max ? `/${p.nb_utilisations_max}` : ''}</div>
                    {p.nb_utilisations_max && (
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getProgressColor(p.nb_utilisations_actuel, p.nb_utilisations_max)}`}
                          style={{ width: `${Math.min(100, (p.nb_utilisations_actuel / p.nb_utilisations_max) * 100)}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={async () => { await configService.updatePromo(p.id_promo, { actif: !p.actif }); load() }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.actif ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${p.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={async () => { if(confirm('Supprimer ?')) { await configService.deletePromo(p.id_promo); load() } }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">{isNew ? 'Nouveau code promo' : 'Modifier'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input type="text" value={modal.code ?? ''} onChange={(e) => setModal((m) => ({ ...m, code: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type de réduction</label>
                <select value={modal.type_reduction} onChange={(e) => setModal((m) => ({ ...m, type_reduction: e.target.value as any }))}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="pourcentage">Pourcentage (%)</option>
                  <option value="fixe">Montant fixe (FCFA)</option>
                </select>
              </div>
              {[
                { key: 'valeur', label: modal.type_reduction === 'pourcentage' ? 'Valeur (%)' : 'Valeur (FCFA)', type: 'number' },
                { key: 'date_debut', label: 'Date début', type: 'date' },
                { key: 'date_fin', label: 'Date fin (optionnel)', type: 'date' },
                { key: 'nb_utilisations_max', label: 'Utilisations max (optionnel)', type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type={type} value={(modal as any)[key] ?? ''} onChange={(e) => setModal((m) => ({ ...m, [key]: type === 'number' && e.target.value ? Number(e.target.value) : e.target.value || undefined }))}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Actif</label>
                <button onClick={() => setModal((m) => ({ ...m, actif: !m?.actif }))} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${modal.actif ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${modal.actif ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm">Annuler</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main Config page ──────────────────────────────────────────
export default function Config() {
  const [tab, setTab] = useState<Tab>('zones')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'zones', label: 'Zones tarifaires' },
    { key: 'categories', label: 'Catégories de véhicules' },
    { key: 'promos', label: 'Codes promotionnels' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Paramètres de la plateforme</p>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'zones' && <ZonesTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'promos' && <PromosTab />}
    </div>
  )
}
