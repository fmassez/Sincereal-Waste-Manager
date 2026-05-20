/**
 * Database Service for GitHub Pages
 * 
 * This service manages data persistence using:
 * 1. A static JSON file (db.json) for initial data
 * 2. localStorage for user modifications
 * 3. Export/Import functionality for backup/restore
 */

import { toast } from 'sonner';

const DB_URL = '/data/db.json';
const STORAGE_KEY = 'sincereal-waste-storage-v4';

export interface DatabaseSchema {
  dechets: any[];
  prestataires: any[];
  transporteurs: any[];
  referentiels: any[];
  contrats: any[];
  users: any[];
  siteSettings: any;
  listes: {
    conditionnements: string[];
    statuts: string[];
    matieres: string[];
    transporteurs: string[];
    prestataires: string[];
  };
  exportDate?: string;
}

/**
 * Load initial data from the static JSON file
 */
export async function loadInitialData(): Promise<DatabaseSchema | null> {
  try {
    const response = await fetch(DB_URL);
    if (!response.ok) {
      console.error('Failed to load database:', response.status, response.statusText);
      return null;
    }
    const data = await response.json();
    console.log('Data loaded successfully:', {
      dechets: data.dechets?.length || 0,
      prestataires: data.prestataires?.length || 0,
      transporteurs: data.transporteurs?.length || 0,
      referentiels: data.referentiels?.length || 0,
      contrats: data.contrats?.length || 0,
      users: data.users?.length || 0,
    });
    return data;
  } catch (error) {
    console.error('Error loading initial data:', error);
    return null;
  }
}

/**
 * Load data from localStorage (user modifications)
 */
export function loadFromLocalStorage(): DatabaseSchema | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state || parsed;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return null;
}

/**
 * Save data to localStorage
 */
export function saveToLocalStorage(data: DatabaseSchema): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      state: data,
      version: 0,
    }));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    toast.error('Erreur lors de la sauvegarde');
  }
}

/**
 * Export all data to a JSON file for download
 */
export function exportToFile(data: DatabaseSchema, filename?: string): void {
  const exportData = {
    ...data,
    exportDate: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `sincereal_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success('Données exportées avec succès');
}

/**
 * Import data from a JSON file
 */
export async function importFromFile(file: File): Promise<DatabaseSchema | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        toast.success('Données importées avec succès');
        resolve(data);
      } catch (error) {
        console.error('Error parsing imported file:', error);
        toast.error('Fichier invalide');
        resolve(null);
      }
    };
    reader.onerror = () => {
      toast.error('Erreur lors de la lecture du fichier');
      resolve(null);
    };
    reader.readAsText(file);
  });
}

/**
 * Merge imported data with existing data (avoiding duplicates)
 */
export function mergeData(existing: DatabaseSchema, imported: Partial<DatabaseSchema>): DatabaseSchema {
  const merged = { ...existing };
  
  // Merge arrays, avoiding duplicates by ID
  if (imported.dechets) {
    const existingIds = new Set(merged.dechets.map(d => d.id));
    merged.dechets = [...merged.dechets, ...imported.dechets.filter(d => !existingIds.has(d.id))];
  }
  
  if (imported.prestataires) {
    const existingIds = new Set(merged.prestataires.map(p => p.id));
    merged.prestataires = [...merged.prestataires, ...imported.prestataires.filter(p => !existingIds.has(p.id))];
  }
  
  if (imported.transporteurs) {
    const existingIds = new Set(merged.transporteurs.map(t => t.id));
    merged.transporteurs = [...merged.transporteurs, ...imported.transporteurs.filter(t => !existingIds.has(t.id))];
  }
  
  if (imported.referentiels) {
    const existingIds = new Set(merged.referentiels.map(r => r.id));
    merged.referentiels = [...merged.referentiels, ...imported.referentiels.filter(r => !existingIds.has(r.id))];
  }
  
  if (imported.contrats) {
    const existingIds = new Set(merged.contrats.map(c => c.id));
    merged.contrats = [...merged.contrats, ...imported.contrats.filter(c => !existingIds.has(c.id))];
  }
  
  if (imported.users) {
    const existingIds = new Set(merged.users.map(u => u.id));
    merged.users = [...merged.users, ...imported.users.filter(u => !existingIds.has(u.id))];
  }
  
  // Merge site settings (imported takes precedence)
  if (imported.siteSettings) {
    merged.siteSettings = { ...merged.siteSettings, ...imported.siteSettings };
  }
  
  // Merge lists
  if (imported.listes) {
    merged.listes = {
      conditionnements: mergeArrays(merged.listes.conditionnements, imported.listes?.conditionnements || []),
      statuts: mergeArrays(merged.listes.statuts, imported.listes?.statuts || []),
      matieres: mergeArrays(merged.listes.matieres, imported.listes?.matieres || []),
      transporteurs: mergeArrays(merged.listes.transporteurs, imported.listes?.transporteurs || []),
      prestataires: mergeArrays(merged.listes.prestataires, imported.listes?.prestataires || []),
    };
  }
  
  return merged;
}

/**
 * Merge two arrays without duplicates
 */
function mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
  return Array.from(new Set([...arr1, ...arr2]));
}

/**
 * Reset all data to initial state
 */
export async function resetAllData(): Promise<DatabaseSchema | null> {
  const initial = await loadInitialData();
  if (initial) {
    saveToLocalStorage(initial);
    toast.success('Données réinitialisées');
  }
  return initial;
}
