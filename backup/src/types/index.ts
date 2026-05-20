// Types pour le SaaS de Gestion des Déchets

export interface Dechet {
  id?: string;
  date_entree: string;
  num_semaine: number;
  num_ticket: string;
  matiere: string;
  code_dechet: string;
  poids_kg: number;
  conditionnement: string;
  transporteur: string;
  destinataire: string;
  observations?: string;
  statut: string;
  isDD?: boolean;
}

export interface Prestataire {
  id?: string;
  nom: string;
  adresse?: string;
  siret?: string;
  telephone?: string;
  email?: string;
  dechets_traites: string;
  statut: string;
  certifications?: string;
  logo?: string;
}

export interface Transporteur {
  id?: string;
  nom: string;
  adresse?: string;
  siren?: string;
  telephone?: string;
  email?: string;
  statut: string;
  certifications_adr?: string;
  logo?: string;
}

export interface Referentiel {
  id?: string;
  code_dechet: string;
  designation: string;
  categorie: string;
  num_adr?: string;
  groupe_emb?: string;
  identification_adr?: string;
  cout_tonne: number;
  mode_traitement?: string;
}

export interface Contrat {
  id?: string;
  prestataire: string;
  type_contrat: string;
  debut: string;
  fin: string;
  duree_mois: number;
  objet: string;
  statut: string;
  contact?: string;
  logo?: string;
  commentaire_interne?: string;
}

export interface User {
  id?: string;
  nom: string;
  email: string;
  password?: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  permissions: UserPermissions;
  createdAt?: string;
  lastLogin?: string;
  photo?: string;
}

export interface UserPermissions {
  dashboard: boolean;
  dechets: boolean;
  prestataires: boolean;
  transporteurs: boolean;
  referentiels: boolean;
  contrats: boolean;
  admin: boolean;
}

export interface SiteSettings {
  siteName: string;
  companyName: string;
  logo?: string;
  logoBackgroundColor?: string;
  favicon?: string;
  loginBackground?: string;
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone?: string;
  address?: string;
  siret?: string;
}

export interface DashboardStats {
  totalDechets: number;
  totalPoids: number;
  totalDD: number;
  totalTraites: number;
  totalEnCours: number;
  totalEnAttente: number;
}

export interface MonthlyData {
  mois: string;
  moisNum: number;
  entrees: number;
  poids: number;
  dd: number;
  traites: number;
}

export interface FinancialData {
  valorisation: Array<{
    designation: string;
    poids: number;
    cout_tonne: number;
    recette: number;
  }>;
  traitement: Array<{
    designation: string;
    poids: number;
    cout_tonne: number;
    cout: number;
  }>;
  bilanNet: number;
}

export interface GEREPData {
  code_dechet: string;
  denomination: string;
  mode: string;
  quantite_tonnes: number;
  transporteur: string;
  destinataire: string;
  isDD: boolean;
}

export type ViewType = 'dashboard' | 'dechets' | 'prestataires' | 'transporteurs' | 'referentiels' | 'contrats' | 'admin';
