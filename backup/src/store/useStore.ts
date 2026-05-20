import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Dechet, Prestataire, Transporteur, Referentiel, Contrat, DashboardStats, ViewType, User, SiteSettings, UserPermissions } from '@/types';
import { loadInitialData } from '@/lib/database';
import { 
  logLogin, 
  logLogout, 
  logCreate, 
  logUpdate, 
  logDelete, 
  logPasswordReset,
  logPasswordChange
} from '@/lib/audit';

interface AppState {
  // Data
  dechets: Dechet[];
  prestataires: Prestataire[];
  transporteurs: Transporteur[];
  referentiels: Referentiel[];
  contrats: Contrat[];
  listes: {
    conditionnements: string[];
    statuts: string[];
    matieres: string[];
    transporteurs: string[];
    prestataires: string[];
  };
  
  // Users & Auth
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Site Settings
  siteSettings: SiteSettings;
  
  // UI State
  currentView: ViewType;
  sidebarOpen: boolean;
  
  // View preferences
  prestatairesViewMode: 'cards' | 'table';
  transporteursViewMode: 'cards' | 'table';
  dechetsViewMode: 'cards' | 'table';
  referentielsViewMode: 'cards' | 'table';
  contratsViewMode: 'cards' | 'table';
  
  // Actions
  setCurrentView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setPrestatairesViewMode: (mode: 'cards' | 'table') => void;
  setTransporteursViewMode: (mode: 'cards' | 'table') => void;
  setDechetsViewMode: (mode: 'cards' | 'table') => void;
  setReferentielsViewMode: (mode: 'cards' | 'table') => void;
  setContratsViewMode: (mode: 'cards' | 'table') => void;
  
  // Auth
  login: (email: string, password: string) => boolean;
  logout: () => void;
  resetPassword: (email: string) => { success: boolean; newPassword?: string };
  changePassword: (userId: string, oldPassword: string, newPassword: string) => boolean;
  
  // CRUD Users
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Site Settings
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  updateLogo: (logo: string) => void;
  updateLogoBackgroundColor: (color: string) => void;
  updateFavicon: (favicon: string) => void;
  updateLoginBackground: (background: string) => void;
  
  // List Management
  addConditionnement: (value: string) => void;
  removeConditionnement: (value: string) => void;
  updateConditionnement: (oldValue: string, newValue: string) => void;
  
  // CRUD Dechets
  addDechet: (dechet: Dechet) => void;
  updateDechet: (id: string, dechet: Partial<Dechet>) => void;
  deleteDechet: (id: string) => void;
  deleteDechets: (ids: string[]) => void;
  
  // CRUD Prestataires
  addPrestataire: (prestataire: Prestataire) => void;
  updatePrestataire: (id: string, prestataire: Partial<Prestataire>) => void;
  deletePrestataire: (id: string) => void;
  
  // CRUD Transporteurs
  addTransporteur: (transporteur: Transporteur) => void;
  updateTransporteur: (id: string, transporteur: Partial<Transporteur>) => void;
  deleteTransporteur: (id: string) => void;
  
  // CRUD Referentiels
  addReferentiel: (referentiel: Referentiel) => void;
  updateReferentiel: (id: string, referentiel: Partial<Referentiel>) => void;
  deleteReferentiel: (id: string) => void;
  
  // CRUD Contrats
  addContrat: (contrat: Contrat) => void;
  updateContrat: (id: string, contrat: Partial<Contrat>) => void;
  deleteContrat: (id: string) => void;
  
  // Stats
  getDashboardStats: () => DashboardStats;
  getMonthlyData: () => any[];
  getFinancialData: () => any;
  getGEREPData: () => any[];
  
  // Permissions
  canAccess: (view: ViewType) => boolean;
  
  // Reset
  resetAllData: () => void;
  
  // Data loading
  loadDataFromFile: () => Promise<void>;
  
  // Import all data at once
  importAllData: (data: Partial<AppState>) => void;
}

// Generate IDs for existing data
const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultPermissions: UserPermissions = {
  dashboard: true,
  dechets: true,
  prestataires: false,
  transporteurs: false,
  referentiels: false,
  contrats: false,
  admin: false,
};

const adminPermissions: UserPermissions = {
  dashboard: true,
  dechets: true,
  prestataires: true,
  transporteurs: true,
  referentiels: true,
  contrats: true,
  admin: true,
};

const processDechets = (dechets: any[]): Dechet[] => {
  return dechets.map((d, i) => ({
    ...d,
    id: generateId() + i,
    isDD: d.code_dechet && d.code_dechet.includes('*'),
    poids_kg: Number(d.poids_kg) || 0,
    num_semaine: Number(d.num_semaine) || 0,
  }));
};

const processPrestataires = (prestataires: any[]): Prestataire[] => {
  return prestataires.map((p, i) => ({
    ...p,
    id: generateId() + 'p' + i,
  }));
};

const processTransporteurs = (transporteurs: any[]): Transporteur[] => {
  return transporteurs.map((t, i) => ({
    ...t,
    id: generateId() + 't' + i,
  }));
};

const processReferentiels = (referentiels: any[]): Referentiel[] => {
  return referentiels.map((r, i) => ({
    ...r,
    id: generateId() + 'r' + i,
    cout_tonne: Number(r.cout_tonne) || 0,
  }));
};

const processContrats = (contrats: any[]): Contrat[] => {
  return contrats.map((c, i) => ({
    ...c,
    id: generateId() + 'c' + i,
    duree_mois: Number(c.duree_mois) || 0,
  }));
};

// Default admin user
const defaultUsers: User[] = [
  {
    id: 'admin001',
    nom: 'Administrateur',
    email: 'admin@sincereal.fr',
    password: 'admin123',
    role: 'admin',
    isActive: true,
    permissions: adminPermissions,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user001',
    nom: 'Frédéric MASSEZ',
    email: 'frederic.massez@sincereal.group',
    password: 'Hercules!6103',
    role: 'admin',
    isActive: true,
    permissions: adminPermissions,
    createdAt: new Date().toISOString(),
  }
];

// Default site settings
const defaultSiteSettings: SiteSettings = {
  siteName: 'Sincereal Waste Manager',
  companyName: 'Sincereal France',
  logo: '',
  responsibleName: '',
  responsibleEmail: '',
  responsiblePhone: '',
  address: '',
  siret: '',
};

// Sort conditionnements alphabetically
const sortConditionnements = (list: string[]) => {
  return [...list].sort((a, b) => a.localeCompare(b, 'fr-FR'));
};

// Default data for initial state
const defaultData = {
  dechets: [] as Dechet[],
  prestataires: [] as Prestataire[],
  transporteurs: [] as Transporteur[],
  referentiels: [] as Referentiel[],
  contrats: [] as Contrat[],
  listes: {
    conditionnements: sortConditionnements(["Bac", "Benne", "Big-bag", "Caisse", "Caisson compacteur", "Conteneur", "Fût 200L", "Fût 60L", "GRV", "Palette", "Plateau ampliroll", "Sac", "Semi-remorque"]),
    statuts: ["✅ Traité", "🔄 En cours", "⏳ En attente"],
    matieres: [] as string[],
    transporteurs: [] as string[],
    prestataires: [] as string[],
  },
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial data (will be loaded from JSON file)
      dechets: defaultData.dechets,
      prestataires: defaultData.prestataires,
      transporteurs: defaultData.transporteurs,
      referentiels: defaultData.referentiels,
      contrats: defaultData.contrats,
      listes: defaultData.listes,
      
      // Users & Auth
      users: defaultUsers,
      currentUser: null,
      isAuthenticated: false,
      
      // Site Settings
      siteSettings: defaultSiteSettings,
      
      // UI State
      currentView: 'dashboard',
      sidebarOpen: true,
      
      // View preferences
      prestatairesViewMode: 'cards',
      transporteursViewMode: 'cards',
      dechetsViewMode: 'table',
      referentielsViewMode: 'table',
      contratsViewMode: 'table',
      
      // Actions
      setCurrentView: (view) => set({ currentView: view }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setPrestatairesViewMode: (mode) => set({ prestatairesViewMode: mode }),
      setTransporteursViewMode: (mode) => set({ transporteursViewMode: mode }),
      setDechetsViewMode: (mode) => set({ dechetsViewMode: mode }),
      setReferentielsViewMode: (mode) => set({ referentielsViewMode: mode }),
      setContratsViewMode: (mode) => set({ contratsViewMode: mode }),
      
      // Auth
      login: (email, password) => {
        const users = get().users;
        console.log('Login attempt:', email, 'Users count:', users.length);
        console.log('Available users:', users.map(u => ({ email: u.email, isActive: u.isActive })));
        
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.isActive);
        if (user) {
          set({ currentUser: user, isAuthenticated: true });
          get().updateUser(user.id!, { lastLogin: new Date().toISOString() });
          // Log the login action
          logLogin(user.id!, user.email, user.nom);
          console.log('Login successful for:', user.email);
          return true;
        }
        console.log('Login failed: user not found or inactive');
        return false;
      },
      
      logout: () => {
        const currentUser = get().currentUser;
        if (currentUser) {
          logLogout(currentUser.id!, currentUser.email, currentUser.nom);
        }
        set({ currentUser: null, isAuthenticated: false, currentView: 'dashboard' });
      },
      
      resetPassword: (email) => {
        const user = get().users.find(u => u.email === email);
        if (user) {
          const newPassword = generateId().slice(0, 8);
          // Update user password directly in state
          set((state) => ({
            users: state.users.map((u) => u.id === user.id ? { ...u, password: newPassword } : u),
          }));
          // Log the password reset
          const currentUser = get().currentUser;
          if (currentUser) {
            logPasswordReset(currentUser.id!, currentUser.email, currentUser.nom, user.id!, user.email);
          }
          // Return the new password so it can be displayed
          return { success: true, newPassword };
        }
        return { success: false };
      },
      
      changePassword: (userId, oldPassword, newPassword) => {
        const user = get().users.find(u => u.id === userId);
        if (user && user.password === oldPassword) {
          get().updateUser(userId, { password: newPassword });
          // Log the password change
          logPasswordChange(user.id!, user.email, user.nom);
          return true;
        }
        return false;
      },
      
      // CRUD Users
      addUser: (user) => {
        const newUser = { 
          ...user, 
          id: generateId(), 
          createdAt: new Date().toISOString(),
          permissions: user.role === 'admin' ? adminPermissions : (user.permissions || defaultPermissions)
        };
        set((state) => ({ users: [...state.users, newUser] }));
        // Log the action
        const currentUser = get().currentUser;
        if (currentUser) {
          logCreate(currentUser.id!, currentUser.email, currentUser.nom, 'USER', newUser.id!, newUser.nom, { email: newUser.email, role: newUser.role });
        }
        return newUser;
      },
      
      updateUser: (id, user) => {
        const oldUser = get().users.find(u => u.id === id);
        set((state) => ({
          users: state.users.map((u) => u.id === id ? { ...u, ...user } : u),
        }));
        // Log the action
        const currentUser = get().currentUser;
        const updatedUser = get().users.find(u => u.id === id);
        if (currentUser && oldUser && updatedUser) {
          const changes: Record<string, { old: any; new: any }> = {};
          Object.keys(user).forEach(key => {
            if (oldUser[key as keyof User] !== user[key as keyof User]) {
              changes[key] = { old: oldUser[key as keyof User], new: user[key as keyof User] };
            }
          });
          if (Object.keys(changes).length > 0) {
            logUpdate(currentUser.id!, currentUser.email, currentUser.nom, 'USER', id, updatedUser.nom, changes);
          }
        }
      },
      
      deleteUser: (id) => {
        const userToDelete = get().users.find(u => u.id === id);
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        }));
        // Log the action
        const currentUser = get().currentUser;
        if (currentUser && userToDelete) {
          logDelete(currentUser.id!, currentUser.email, currentUser.nom, 'USER', id, userToDelete.nom, { email: userToDelete.email });
        }
      },
      
      // Site Settings
      updateSiteSettings: (settings) => set((state) => ({
        siteSettings: { ...state.siteSettings, ...settings },
      })),
      
      updateLogo: (logo) => set((state) => ({
        siteSettings: { ...state.siteSettings, logo },
      })),
      
      updateLogoBackgroundColor: (logoBackgroundColor) => set((state) => ({
        siteSettings: { ...state.siteSettings, logoBackgroundColor },
      })),
      
      updateFavicon: (favicon) => set((state) => ({
        siteSettings: { ...state.siteSettings, favicon },
      })),
      
      updateLoginBackground: (loginBackground) => set((state) => ({
        siteSettings: { ...state.siteSettings, loginBackground },
      })),
      
      // List Management
      addConditionnement: (value) => set((state) => ({
        listes: {
          ...state.listes,
          conditionnements: sortConditionnements([...state.listes.conditionnements, value]),
        },
      })),
      
      removeConditionnement: (value) => set((state) => ({
        listes: {
          ...state.listes,
          conditionnements: state.listes.conditionnements.filter(c => c !== value),
        },
      })),
      
      updateConditionnement: (oldValue, newValue) => set((state) => ({
        listes: {
          ...state.listes,
          conditionnements: sortConditionnements(state.listes.conditionnements.map(c => c === oldValue ? newValue : c)),
        },
      })),
      
      // CRUD Dechets
      addDechet: (dechet) => {
        const newDechet = { ...dechet, id: generateId(), isDD: dechet.code_dechet?.includes('*') };
        set((state) => ({ dechets: [...state.dechets, newDechet] }));
        // Log the action
        try {
          const currentUser = get().currentUser;
          if (currentUser && currentUser.id) {
            logCreate(currentUser.id, currentUser.email, currentUser.nom, 'DECHET', newDechet.id!, newDechet.num_ticket, { matiere: newDechet.matiere, poids: newDechet.poids_kg });
          }
        } catch (e) {
          // Silently ignore logging errors
        }
        return newDechet;
      },
      updateDechet: (id, dechet) => {
        const oldDechet = get().dechets.find(d => d.id === id);
        set((state) => ({
          dechets: state.dechets.map((d) => d.id === id ? { ...d, ...dechet, isDD: dechet.code_dechet?.includes('*') || d.isDD } : d),
        }));
        // Log the action
        try {
          const currentUser = get().currentUser;
          const updatedDechet = get().dechets.find(d => d.id === id);
          if (currentUser && currentUser.id && oldDechet && updatedDechet) {
            const changes: Record<string, { old: any; new: any }> = {};
            Object.keys(dechet).forEach(key => {
              if (oldDechet[key as keyof Dechet] !== dechet[key as keyof Dechet]) {
                changes[key] = { old: oldDechet[key as keyof Dechet], new: dechet[key as keyof Dechet] };
              }
            });
            if (Object.keys(changes).length > 0) {
              logUpdate(currentUser.id, currentUser.email, currentUser.nom, 'DECHET', id, updatedDechet.num_ticket, changes);
            }
          }
        } catch (e) {
          // Silently ignore logging errors
        }
      },
      deleteDechet: (id) => {
        const dechetToDelete = get().dechets.find(d => d.id === id);
        set((state) => ({ dechets: state.dechets.filter((d) => d.id !== id) }));
        // Log the action
        const currentUser = get().currentUser;
        if (currentUser && dechetToDelete) {
          logDelete(currentUser.id!, currentUser.email, currentUser.nom, 'DECHET', id, dechetToDelete.num_ticket, { matiere: dechetToDelete.matiere });
        }
      },
      deleteDechets: (ids: string[]) => {
        const dechetsToDelete = get().dechets.filter(d => ids.includes(d.id!));
        set((state) => ({ dechets: state.dechets.filter((d) => !ids.includes(d.id!)) }));
        // Log the action
        const currentUser = get().currentUser;
        if (currentUser) {
          dechetsToDelete.forEach(dechet => {
            logDelete(currentUser.id!, currentUser.email, currentUser.nom, 'DECHET', dechet.id!, dechet.num_ticket, { matiere: dechet.matiere });
          });
        }
      },
      
      // CRUD Prestataires
      addPrestataire: (prestataire) => set((state) => ({
        prestataires: [...state.prestataires, { ...prestataire, id: generateId() }],
      })),
      updatePrestataire: (id, prestataire) => set((state) => ({
        prestataires: state.prestataires.map((p) => p.id === id ? { ...p, ...prestataire } : p),
      })),
      deletePrestataire: (id) => set((state) => ({
        prestataires: state.prestataires.filter((p) => p.id !== id),
      })),
      
      // CRUD Transporteurs
      addTransporteur: (transporteur) => set((state) => ({
        transporteurs: [...state.transporteurs, { ...transporteur, id: generateId() }],
      })),
      updateTransporteur: (id, transporteur) => set((state) => ({
        transporteurs: state.transporteurs.map((t) => t.id === id ? { ...t, ...transporteur } : t),
      })),
      deleteTransporteur: (id) => set((state) => ({
        transporteurs: state.transporteurs.filter((t) => t.id !== id),
      })),
      
      // CRUD Referentiels
      addReferentiel: (referentiel) => set((state) => {
        const newReferentiels = [...state.referentiels, { ...referentiel, id: generateId() }];
        // Sort by code_dechet
        newReferentiels.sort((a, b) => a.code_dechet.localeCompare(b.code_dechet, 'fr-FR'));
        // Also add designation to matieres list if not exists
        const newMatieres = state.listes.matieres.includes(referentiel.designation) 
          ? state.listes.matieres 
          : [...state.listes.matieres, referentiel.designation].sort((a, b) => a.localeCompare(b, 'fr-FR'));
        return {
          referentiels: newReferentiels,
          listes: {
            ...state.listes,
            matieres: newMatieres,
          },
        };
      }),
      updateReferentiel: (id, referentiel) => set((state) => ({
        referentiels: state.referentiels.map((r) => r.id === id ? { ...r, ...referentiel } : r),
      })),
      deleteReferentiel: (id) => set((state) => ({
        referentiels: state.referentiels.filter((r) => r.id !== id),
      })),
      
      // CRUD Contrats
      addContrat: (contrat) => set((state) => ({
        contrats: [...state.contrats, { ...contrat, id: generateId() }],
      })),
      updateContrat: (id, contrat) => set((state) => ({
        contrats: state.contrats.map((c) => c.id === id ? { ...c, ...contrat } : c),
      })),
      deleteContrat: (id) => set((state) => ({
        contrats: state.contrats.filter((c) => c.id !== id),
      })),
      
      // Stats
      getDashboardStats: () => {
        const { dechets } = get();
        const totalPoids = dechets.reduce((sum, d) => sum + (d.poids_kg || 0), 0);
        const totalDD = dechets.filter((d) => d.isDD).length;
        const totalTraites = dechets.filter((d) => d.statut?.includes('Traité')).length;
        const totalEnCours = dechets.filter((d) => d.statut?.includes('En cours')).length;
        const totalEnAttente = dechets.filter((d) => d.statut?.includes('En attente')).length;
        
        return {
          totalDechets: dechets.length,
          totalPoids,
          totalDD,
          totalTraites,
          totalEnCours,
          totalEnAttente,
        };
      },
      
      getMonthlyData: () => {
        const { dechets } = get();
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        const monthlyData = months.map((mois, index) => {
          const monthDechets = dechets.filter((d) => {
            const date = new Date(d.date_entree);
            return date.getMonth() === index;
          });
          
          return {
            mois,
            moisNum: index + 1,
            entrees: monthDechets.length,
            poids: monthDechets.reduce((sum, d) => sum + (d.poids_kg || 0), 0),
            dd: monthDechets.filter((d) => d.isDD).length,
            traites: monthDechets.filter((d) => d.statut?.includes('Traité')).length,
          };
        });
        
        return monthlyData;
      },
      
      getFinancialData: () => {
        const { dechets, referentiels } = get();
        
        const valorisation: any[] = [];
        const traitement: any[] = [];
        
        dechets.forEach((d) => {
          const ref = referentiels.find((r) => r.code_dechet === d.code_dechet);
          if (ref) {
            const poidsTonnes = (d.poids_kg || 0) / 1000;
            const cout = poidsTonnes * (ref.cout_tonne || 0);
            
            if (ref.cout_tonne < 0) {
              const existing = valorisation.find((v) => v.designation === d.matiere);
              if (existing) {
                existing.poids += d.poids_kg || 0;
                existing.recette += Math.abs(cout);
              } else {
                valorisation.push({
                  designation: d.matiere,
                  poids: d.poids_kg || 0,
                  cout_tonne: ref.cout_tonne,
                  recette: Math.abs(cout),
                });
              }
            } else if (ref.cout_tonne > 0) {
              const existing = traitement.find((t) => t.designation === d.matiere);
              if (existing) {
                existing.poids += d.poids_kg || 0;
                existing.cout += cout;
              } else {
                traitement.push({
                  designation: d.matiere,
                  poids: d.poids_kg || 0,
                  cout_tonne: ref.cout_tonne,
                  cout,
                });
              }
            }
          }
        });
        
        const totalRecettes = valorisation.reduce((sum, v) => sum + v.recette, 0);
        const totalDepenses = traitement.reduce((sum, t) => sum + t.cout, 0);
        const bilanNet = totalRecettes - totalDepenses;
        
        return {
          valorisation,
          traitement,
          bilanNet,
          totalRecettes,
          totalDepenses,
        };
      },
      
      getGEREPData: () => {
        const { dechets } = get();
        
        // Group by code dechet
        const gerepMap = new Map();
        
        dechets.forEach((d) => {
          if (!gerepMap.has(d.code_dechet)) {
            gerepMap.set(d.code_dechet, {
              code_dechet: d.code_dechet,
              denomination: d.matiere,
              mode: 'Production',
              quantite_tonnes: 0,
              transporteur: d.transporteur,
              destinataire: d.destinataire,
              isDD: d.isDD,
            });
          }
          const entry = gerepMap.get(d.code_dechet);
          entry.quantite_tonnes += (d.poids_kg || 0) / 1000;
        });
        
        return Array.from(gerepMap.values()).sort((a, b) => a.code_dechet.localeCompare(b.code_dechet));
      },
      
      // Permissions
      canAccess: (view) => {
        const { currentUser } = get();
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        return currentUser.permissions[view] || false;
      },
      
      // Reset all data
      resetAllData: () => set({
        dechets: [],
        prestataires: [],
        transporteurs: [],
        referentiels: [],
        contrats: [],
        listes: defaultData.listes,
      }),
      
      // Load data from JSON file
      loadDataFromFile: async () => {
        const data = await loadInitialData();
        if (data) {
          set({
            dechets: processDechets(data.dechets || []),
            prestataires: processPrestataires(data.prestataires || []),
            transporteurs: processTransporteurs(data.transporteurs || []),
            referentiels: processReferentiels(data.referentiels || []),
            contrats: processContrats(data.contrats || []),
            listes: {
              conditionnements: sortConditionnements(data.listes?.conditionnements || defaultData.listes.conditionnements),
              statuts: data.listes?.statuts || defaultData.listes.statuts,
              matieres: data.listes?.matieres || defaultData.listes.matieres,
              transporteurs: data.listes?.transporteurs || defaultData.listes.transporteurs,
              prestataires: data.listes?.prestataires || defaultData.listes.prestataires,
            },
            users: data.users || defaultUsers,
            siteSettings: { ...defaultSiteSettings, ...data.siteSettings },
          });
        }
      },
      
      // Import all data at once (for file import)
      importAllData: (data) => {
        const updates: Partial<AppState> = {};
        
        if (data.dechets !== undefined) updates.dechets = processDechets(data.dechets);
        if (data.prestataires !== undefined) updates.prestataires = processPrestataires(data.prestataires);
        if (data.transporteurs !== undefined) updates.transporteurs = processTransporteurs(data.transporteurs);
        if (data.referentiels !== undefined) updates.referentiels = processReferentiels(data.referentiels);
        if (data.contrats !== undefined) updates.contrats = processContrats(data.contrats);
        if (data.listes !== undefined) {
          updates.listes = {
            conditionnements: sortConditionnements(data.listes.conditionnements || defaultData.listes.conditionnements),
            statuts: data.listes.statuts || defaultData.listes.statuts,
            matieres: data.listes.matieres || defaultData.listes.matieres,
            transporteurs: data.listes.transporteurs || defaultData.listes.transporteurs,
            prestataires: data.listes.prestataires || defaultData.listes.prestataires,
          };
        }
        if (data.users !== undefined) updates.users = data.users;
        if (data.siteSettings !== undefined) updates.siteSettings = { ...defaultSiteSettings, ...data.siteSettings };
        
        set(updates);
      },
    }),
    {
      name: 'sincereal-waste-storage-v4',
      // Ne pas persister les données volumineuses (déchets, prestataires, etc.)
      // pour éviter le QuotaExceededError du localStorage
      partialize: (state) => ({
        // Seuls les paramètres utilisateur et préférences sont persistés
        users: state.users,
        siteSettings: state.siteSettings,
        prestatairesViewMode: state.prestatairesViewMode,
        transporteursViewMode: state.transporteursViewMode,
        dechetsViewMode: state.dechetsViewMode,
        referentielsViewMode: state.referentielsViewMode,
        contratsViewMode: state.contratsViewMode,
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure default users are always present
        console.log('onRehydrateStorage called');
        if (state) {
          console.log('Current users:', state.users?.map(u => u.email) || 'none');
          if (!state.users) state.users = [];
          const existingEmails = new Set(state.users.map(u => u.email.toLowerCase()));
          defaultUsers.forEach(defaultUser => {
            if (!existingEmails.has(defaultUser.email.toLowerCase())) {
              console.log('Adding default user:', defaultUser.email);
              state.users.push({ ...defaultUser });
            }
          });
          console.log('Users after rehydrate:', state.users.map(u => u.email));
        }
      },
    }
  )
);
