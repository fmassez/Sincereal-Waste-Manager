import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { Dechet } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Pencil, Trash2, AlertTriangle, CheckCircle, Copy, Check, Filter, X, ChevronDown, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const getStatusClass = (statut: string) => {
  if (statut?.includes('Traité')) return 'bg-emerald-100 text-emerald-700';
  if (statut?.includes('En cours')) return 'bg-amber-100 text-amber-700';
  if (statut?.includes('En attente')) return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-700';
};

const emptyDechet: Partial<Dechet> = {
  date_entree: new Date().toISOString().split('T')[0],
  num_ticket: '',
  matiere: '',
  code_dechet: '',
  poids_kg: 0,
  conditionnement: '',
  transporteur: '',
  destinataire: '',
  observations: '',
  statut: '⏳ En attente',
};

// Copy to clipboard helper
const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papiers`);
  } catch {
    toast.error('Impossible de copier');
  }
};

export function DechetsManager() {
  const { dechets, listes, referentiels, prestataires, transporteurs, siteSettings, addDechet, updateDechet, deleteDechet, deleteDechets } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDechet, setEditingDechet] = useState<Partial<Dechet> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  
  // Column filters
  const [columnFilters, setColumnFilters] = useState({
    date: '',
    matiere: '',
    code: '',
    transporteur: '',
    destinataire: '',
    statut: '',
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [showMatiereDropdown, setShowMatiereDropdown] = useState(false);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [showTransporteurDropdown, setShowTransporteurDropdown] = useState(false);
  const [showDestinataireDropdown, setShowDestinataireDropdown] = useState(false);
  
  // Filter states
  const [filterDD, setFilterDD] = useState<'all' | 'dd' | 'non-dd'>('all');
  
  // Table column sort state - tri par date décroissante par défaut
  const [columnSort, setColumnSort] = useState<{column: string | null, order: 'asc' | 'desc'}>({column: 'date', order: 'desc'});
  
  // Selection state for bulk actions
  const [selectedDechets, setSelectedDechets] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filter active prestataires and transporteurs
  const activePrestataires = prestataires.filter(p => p.statut === 'Actif');
  const activeTransporteurs = transporteurs.filter(t => t.statut === 'Actif');
  
  // Calculate mini bilan
  const totalDechets = dechets.length;
  const dechetsDD = dechets.filter(d => d.code_dechet?.includes('*')).length;
  const dechetsNonDD = totalDechets - dechetsDD;

  // Détecter les doublons de num_ticket
  const getTicketDuplicates = () => {
    const ticketCounts = new Map<string, number>();
    dechets.forEach(d => {
      const ticket = d.num_ticket?.toLowerCase().trim();
      if (ticket) {
        ticketCounts.set(ticket, (ticketCounts.get(ticket) || 0) + 1);
      }
    });
    return ticketCounts;
  };
  
  const ticketDuplicates = getTicketDuplicates();
  const isDuplicateTicket = (ticket: string) => {
    return ticket && (ticketDuplicates.get(ticket.toLowerCase().trim()) || 0) > 1;
  };

  // Sort function for column headers
  const handleColumnSort = (column: string) => {
    if (columnSort.column === column) {
      setColumnSort({column, order: columnSort.order === 'asc' ? 'desc' : 'asc'});
    } else {
      setColumnSort({column, order: 'asc'});
    }
  };

  const getSortedDechets = (dechetsList: typeof dechets) => {
    if (!columnSort.column) return dechetsList;
    
    return [...dechetsList].sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (columnSort.column) {
        case 'ticket':
          valueA = a.num_ticket || '';
          valueB = b.num_ticket || '';
          break;
        case 'date':
          valueA = new Date(a.date_entree).getTime();
          valueB = new Date(b.date_entree).getTime();
          break;
        case 'matiere':
          valueA = a.matiere || '';
          valueB = b.matiere || '';
          break;
        case 'code':
          valueA = a.code_dechet || '';
          valueB = b.code_dechet || '';
          break;
        case 'poids':
          valueA = a.poids_kg || 0;
          valueB = b.poids_kg || 0;
          break;
        case 'conditionnement':
          valueA = a.conditionnement || '';
          valueB = b.conditionnement || '';
          break;
        case 'transporteur':
          valueA = a.transporteur || '';
          valueB = b.transporteur || '';
          break;
        case 'destinataire':
          valueA = a.destinataire || '';
          valueB = b.destinataire || '';
          break;
        case 'statut':
          valueA = a.statut || '';
          valueB = b.statut || '';
          break;
        default:
          return 0;
      }
      
      if (typeof valueA === 'string') {
        return columnSort.order === 'asc' 
          ? valueA.localeCompare(valueB, 'fr-FR')
          : valueB.localeCompare(valueA, 'fr-FR');
      }
      
      return columnSort.order === 'asc' ? valueA - valueB : valueB - valueA;
    });
  };

  const filteredDechets = getSortedDechets(dechets
    .filter((d) => {
      // Global search
      const matchesGlobal = Object.values(d).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      // Column filters
      const matchesDate = !columnFilters.date || d.date_entree?.includes(columnFilters.date);
      const matchesMatiere = !columnFilters.matiere || d.matiere?.toLowerCase().includes(columnFilters.matiere.toLowerCase());
      const matchesCode = !columnFilters.code || d.code_dechet?.toLowerCase().includes(columnFilters.code.toLowerCase());
      const matchesTransporteur = !columnFilters.transporteur || d.transporteur?.toLowerCase().includes(columnFilters.transporteur.toLowerCase());
      const matchesDestinataire = !columnFilters.destinataire || d.destinataire?.toLowerCase().includes(columnFilters.destinataire.toLowerCase());
      const matchesStatut = !columnFilters.statut || d.statut?.toLowerCase().includes(columnFilters.statut.toLowerCase());
      // DD filter
      const matchesDD = filterDD === 'all' || 
        (filterDD === 'dd' && d.code_dechet?.includes('*')) ||
        (filterDD === 'non-dd' && !d.code_dechet?.includes('*'));
      
      return matchesGlobal && matchesDate && matchesMatiere && matchesCode && 
             matchesTransporteur && matchesDestinataire && matchesStatut && matchesDD;
    }));

  const handleSave = () => {
    if (!editingDechet || isSaving) {
      console.log('handleSave: blocked - editingDechet:', editingDechet, 'isSaving:', isSaving);
      return;
    }
    
    console.log('handleSave: starting...');
    setIsSaving(true);
    
    // Validation des champs obligatoires
    const errors: Record<string, boolean> = {};
    if (!editingDechet.date_entree) errors.date_entree = true;
    if (!editingDechet.num_ticket) errors.num_ticket = true;
    if (!editingDechet.matiere) errors.matiere = true;
    if (!editingDechet.code_dechet) errors.code_dechet = true;
    if (!editingDechet.poids_kg || Number(editingDechet.poids_kg) <= 0) errors.poids_kg = true;
    if (!editingDechet.conditionnement) errors.conditionnement = true;
    if (!editingDechet.transporteur) errors.transporteur = true;
    if (!editingDechet.destinataire) errors.destinataire = true;
    
    setFieldErrors(errors);
    
    const missingFieldsCount = Object.keys(errors).length;
    if (missingFieldsCount > 0) {
      toast.error(`${missingFieldsCount} champ(s) obligatoire(s) manquant(s)`);
      setIsSaving(false);
      return;
    }
    
    // Vérifier les doublons de tickets
    const existingDechet = dechets.find(d => 
      d.num_ticket === editingDechet.num_ticket && 
      d.date_entree === editingDechet.date_entree &&
      d.id !== editingDechet.id
    );
    if (existingDechet) {
      toast.error('Ce ticket existe déjà pour cette date');
      setIsSaving(false);
      return;
    }
    
    // Auto-calculate week number from date
    if (editingDechet.date_entree) {
      const date = new Date(editingDechet.date_entree);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      editingDechet.num_semaine = weekNum;
    }
    
    // Sauvegarder le déchet
    try {
      console.log('handleSave: saving dechet...');
      if (editingDechet.id) {
        console.log('handleSave: updating existing dechet');
        updateDechet(editingDechet.id, editingDechet);
        toast.success('Déchet mis à jour');
      } else {
        console.log('handleSave: adding new dechet');
        addDechet(editingDechet as Dechet);
        toast.success('Déchet ajouté');
      }
      console.log('handleSave: dechet saved successfully');
      
      // Fermer la fenêtre et réinitialiser
      console.log('handleSave: closing dialog...');
      setFieldErrors({});
      setEditingDechet(null);
      setIsDialogOpen(false);
      console.log('handleSave: dialog closed');
    } catch (error) {
      console.error('handleSave: error saving dechet:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
      console.log('handleSave: finished');
    }
  };

  const handleEdit = (dechet: Dechet) => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingDechet({ ...dechet });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingDechet({ ...emptyDechet });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce déchet ?')) {
      deleteDechet(id);
      toast.success('Déchet supprimé');
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text, field);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDechets([]);
    } else {
      setSelectedDechets(filteredDechets.map(d => d.id!));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectDechet = (id: string) => {
    if (selectedDechets.includes(id)) {
      setSelectedDechets(selectedDechets.filter(dId => dId !== id));
    } else {
      setSelectedDechets([...selectedDechets, id]);
    }
  };

  // Bulk actions
  const handleBulkDelete = () => {
    const count = selectedDechets.length;
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${count} déchet(s) ?`)) {
      deleteDechets(selectedDechets);
      setSelectedDechets([]);
      setSelectAll(false);
      toast.success(`${count} déchet(s) supprimé(s)`);
    }
  };

  const handleBulkDuplicate = () => {
    const dechetsToDuplicate = dechets.filter(d => selectedDechets.includes(d.id!));
    dechetsToDuplicate.forEach(dechet => {
      const { id, ...dechetWithoutId } = dechet;
      addDechet({
        ...dechetWithoutId,
        num_ticket: `${dechet.num_ticket}-COPY`,
        date_entree: new Date().toISOString().split('T')[0],
      });
    });
    setSelectedDechets([]);
    setSelectAll(false);
    toast.success(`${dechetsToDuplicate.length} déchet(s) dupliqué(s)`);
  };

  const handleBulkChangeStatus = (newStatus: string) => {
    const count = selectedDechets.length;
    selectedDechets.forEach(id => {
      const dechet = dechets.find(d => d.id === id);
      if (dechet) {
        updateDechet(id, { ...dechet, statut: newStatus });
      }
    });
    setSelectedDechets([]);
    setSelectAll(false);
    toast.success(`Statut mis à jour pour ${count} déchet(s)`);
  };

  // Export/Import functions
  const exportDechets = () => {
    const dataToExport = selectedDechets.length > 0 
      ? dechets.filter(d => selectedDechets.includes(d.id!))
      : dechets;
    
    // Export complet avec toutes les données liées
    const fullExport = {
      dechets: dataToExport,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(fullExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dechets-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${dataToExport.length} déchet(s) exporté(s)`);
  };

  const importDechets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Supporte plusieurs formats
        let importedDechets: Dechet[] = [];
        
        if (Array.isArray(importedData)) {
          importedDechets = importedData;
        } else if (importedData.dechets && Array.isArray(importedData.dechets)) {
          importedDechets = importedData.dechets;
        }
        
        if (importedDechets.length > 0) {
          let importedCount = 0;
          let duplicateCount = 0;
          
          importedDechets.forEach((dechet: Dechet) => {
            const { id, ...dechetWithoutId } = dechet;
            
            // Vérifier les doublons par num_ticket + date_entree
            const isDuplicate = dechets.some(existing => 
              existing.num_ticket === dechetWithoutId.num_ticket && 
              existing.date_entree === dechetWithoutId.date_entree
            );
            
            if (!isDuplicate) {
              addDechet(dechetWithoutId as Dechet);
              importedCount++;
            } else {
              duplicateCount++;
            }
          });
          
          if (duplicateCount > 0) {
            toast.success(`${importedCount} déchet(s) importé(s) - ${duplicateCount} doublon(s) ignoré(s)`);
          } else {
            toast.success(`${importedCount} déchet(s) importé(s)`);
          }
        } else {
          toast.error('Aucun déchet trouvé dans le fichier');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Erreur lors de l\'import : fichier invalide');
      }
    };
    reader.onerror = () => {
      toast.error('Erreur lors de la lecture du fichier');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Rechercher un déchet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un déchet
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8">
            <DialogHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                {siteSettings.logo && (
                  <img 
                    src={siteSettings.logo} 
                    alt="Logo" 
                    className="h-10 w-auto object-contain"
                  />
                )}
                <DialogTitle className="font-normal">
                  {editingDechet?.id ? 'Modifier le déchet' : 'Ajouter un déchet'}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_entree">Date d'entrée *</Label>
                  <Input
                    id="date_entree"
                    type="date"
                    value={editingDechet?.date_entree || ''}
                    onChange={(e) => {
                      setEditingDechet({ ...editingDechet, date_entree: e.target.value });
                      if (e.target.value) setFieldErrors(prev => ({ ...prev, date_entree: false }));
                    }}
                    className={fieldErrors.date_entree ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num_ticket">N° Ticket *</Label>
                  <Input
                    id="num_ticket"
                    placeholder="Saisir le N°"
                    value={editingDechet?.num_ticket || ''}
                    onChange={(e) => {
                      setEditingDechet({ ...editingDechet, num_ticket: e.target.value });
                      if (e.target.value) setFieldErrors(prev => ({ ...prev, num_ticket: false }));
                    }}
                    className={fieldErrors.num_ticket ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                  />
                </div>
              </div>
              
              <div className="space-y-2 relative">
                <Label htmlFor="matiere">Matière / Désignation *</Label>
                <div className="relative">
                  <Input
                    id="matiere"
                    placeholder="Rechercher ou choisir une matière..."
                    value={editingDechet?.matiere || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditingDechet({ ...editingDechet, matiere: value });
                      if (value) setFieldErrors(prev => ({ ...prev, matiere: false }));
                      // Show dropdown when typing (filter mode)
                      setShowMatiereDropdown(true);
                    }}
                    onFocus={() => {
                      // Show all options on focus
                      setShowMatiereDropdown(true);
                    }}
                    onBlur={() => {
                      // Delay to allow click on dropdown items
                      setTimeout(() => setShowMatiereDropdown(false), 200);
                    }}
                    className={`pr-10 ${fieldErrors.matiere ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMatiereDropdown(!showMatiereDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                {showMatiereDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {referentiels
                      .filter((r) => 
                        !editingDechet?.matiere || 
                        editingDechet.matiere.length === 0 ||
                        r.designation.toLowerCase().includes(editingDechet.matiere.toLowerCase())
                      )
                      .sort((a, b) => a.designation.localeCompare(b.designation, 'fr-FR'))
                      .map((ref) => (
                        <button
                          key={ref.id}
                          type="button"
                          onClick={() => {
                            setEditingDechet({
                              ...editingDechet,
                              matiere: ref.designation,
                              code_dechet: ref.code_dechet,
                            });
                            setFieldErrors(prev => ({ ...prev, matiere: false, code_dechet: false }));
                            setShowMatiereDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center justify-between"
                        >
                          <span>
                            <span className="font-medium">{ref.designation}</span>
                            <span className="text-slate-500 ml-2">({ref.code_dechet})</span>
                          </span>
                          {ref.categorie?.includes('🔴') && (
                            <span className="text-xs text-red-500">Dangereux</span>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="code_dechet">Code Déchet *</Label>
                  <div className="relative">
                    <Input
                      id="code_dechet"
                      placeholder="Rechercher ou choisir un code..."
                      value={editingDechet?.code_dechet || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const ref = referentiels.find(r => r.code_dechet === value);
                        setEditingDechet({ 
                          ...editingDechet, 
                          code_dechet: value,
                          matiere: ref?.designation || editingDechet?.matiere
                        });
                        if (value) setFieldErrors(prev => ({ ...prev, code_dechet: false }));
                        setShowCodeDropdown(true);
                      }}
                      onFocus={() => setShowCodeDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCodeDropdown(false), 200)}
                      className={cn(
                        "font-mono pr-10",
                        editingDechet?.code_dechet?.includes('*') && "text-red-600 border-red-300",
                        fieldErrors.code_dechet && "border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCodeDropdown(!showCodeDropdown)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  {showCodeDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {referentiels
                        .filter((r) => 
                          !editingDechet?.code_dechet || 
                          editingDechet.code_dechet.length === 0 ||
                          r.code_dechet.toLowerCase().includes(editingDechet.code_dechet.toLowerCase())
                        )
                        .sort((a, b) => a.code_dechet.localeCompare(b.code_dechet, 'fr-FR'))
                        .map((ref) => (
                          <button
                            key={ref.id}
                            type="button"
                            onClick={() => {
                              setEditingDechet({
                                ...editingDechet,
                                code_dechet: ref.code_dechet,
                                matiere: ref.designation,
                              });
                              setFieldErrors(prev => ({ ...prev, code_dechet: false, matiere: false }));
                              setShowCodeDropdown(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center justify-between",
                              ref.code_dechet?.includes('*') && "text-red-600"
                            )}
                          >
                            <span>
                              <span className="font-mono font-medium">{ref.code_dechet}</span>
                              <span className="text-slate-500 ml-2">{ref.designation}</span>
                            </span>
                            {ref.categorie?.includes('🔴') && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                  {editingDechet?.code_dechet?.includes('*') && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Déchet dangereux
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poids_kg">Poids (kg) *</Label>
                  <Input
                    id="poids_kg"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 350.5"
                    value={editingDechet?.poids_kg || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setEditingDechet({ ...editingDechet, poids_kg: value });
                      if (value > 0) setFieldErrors(prev => ({ ...prev, poids_kg: false }));
                    }}
                    className={fieldErrors.poids_kg ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conditionnement">Conditionnement *</Label>
                  <Select
                    value={editingDechet?.conditionnement || ''}
                    onValueChange={(value) => {
                      setEditingDechet({ ...editingDechet, conditionnement: value });
                      if (value) setFieldErrors(prev => ({ ...prev, conditionnement: false }));
                    }}
                  >
                    <SelectTrigger className={fieldErrors.conditionnement ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...listes.conditionnements].sort((a, b) => a.localeCompare(b, 'fr-FR')).map((cond) => (
                        <SelectItem key={cond} value={cond}>
                          {cond}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut *</Label>
                  <Select
                    value={editingDechet?.statut || ''}
                    onValueChange={(value) => setEditingDechet({ ...editingDechet, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {listes.statuts.map((statut) => (
                        <SelectItem key={statut} value={statut}>
                          {statut}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Transporteur avec dropdown */}
                <div className="space-y-2 relative">
                  <Label htmlFor="transporteur">Transporteur *</Label>
                  <div className="relative">
                    <Input
                      id="transporteur"
                      placeholder="Rechercher ou choisir un transporteur..."
                      value={editingDechet?.transporteur || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingDechet({ ...editingDechet, transporteur: value });
                        if (value) setFieldErrors(prev => ({ ...prev, transporteur: false }));
                      }}
                      onFocus={() => setShowTransporteurDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTransporteurDropdown(false), 200)}
                      className={`pr-10 ${fieldErrors.transporteur ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTransporteurDropdown(!showTransporteurDropdown)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  {showTransporteurDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {[...activeTransporteurs]
                        .filter((t) => 
                          !editingDechet?.transporteur || 
                          editingDechet.transporteur.length === 0 ||
                          t.nom.toLowerCase().includes(editingDechet.transporteur.toLowerCase())
                        )
                        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr-FR'))
                        .map((transp) => (
                          <button
                            key={transp.id}
                            type="button"
                            onClick={() => {
                              setEditingDechet({ ...editingDechet, transporteur: transp.nom });
                              setFieldErrors(prev => ({ ...prev, transporteur: false }));
                              setShowTransporteurDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center justify-between"
                          >
                            <span>{transp.nom}</span>
                            {transp.certifications_adr?.includes('ADR') && (
                              <span className="text-xs text-amber-600">♦ ADR</span>
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Destinataire avec dropdown */}
                <div className="space-y-2 relative">
                  <Label htmlFor="destinataire">Destinataire / Filière *</Label>
                  <div className="relative">
                    <Input
                      id="destinataire"
                      placeholder="Rechercher ou choisir un prestataire..."
                      value={editingDechet?.destinataire || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditingDechet({ ...editingDechet, destinataire: value });
                        if (value) setFieldErrors(prev => ({ ...prev, destinataire: false }));
                      }}
                      onFocus={() => setShowDestinataireDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDestinataireDropdown(false), 200)}
                      className={`pr-10 ${fieldErrors.destinataire ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDestinataireDropdown(!showDestinataireDropdown)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  {showDestinataireDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {[...activePrestataires]
                        .filter((p) => 
                          !editingDechet?.destinataire || 
                          editingDechet.destinataire.length === 0 ||
                          p.nom.toLowerCase().includes(editingDechet.destinataire.toLowerCase())
                        )
                        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr-FR'))
                        .map((prest) => (
                          <button
                            key={prest.id}
                            type="button"
                            onClick={() => {
                              setEditingDechet({ ...editingDechet, destinataire: prest.nom });
                              setFieldErrors(prev => ({ ...prev, destinataire: false }));
                              setShowDestinataireDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 truncate"
                          >
                            {prest.nom}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observations">Observations</Label>
                <Input
                  id="observations"
                  placeholder="Informations complémentaires..."
                  value={editingDechet?.observations || ''}
                  onChange={(e) => setEditingDechet({ ...editingDechet, observations: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={(e) => { e.preventDefault(); setIsDialogOpen(false); }}>
                  Annuler
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700" 
                  onClick={(e) => { e.preventDefault(); handleSave(); }}
                  type="button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Enregistrement...' : (editingDechet?.id ? 'Mettre à jour' : 'Ajouter')}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulk Actions Bar */}
      {selectedDechets.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-sm font-medium text-emerald-700">
            {selectedDechets.length} sélectionné(s)
          </span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                Changer statut
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkChangeStatus('⏳ En attente')}>
                ⏳ En attente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkChangeStatus('🔄 En cours')}>
                🔄 En cours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkChangeStatus('✅ Traité')}>
                ✅ Traité
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={handleBulkDuplicate}>
            <Copy className="h-4 w-4 mr-1" />
            Dupliquer
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        </div>
      )}

      {/* Mini Bilan and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Mini Bilan */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterDD(filterDD === 'all' ? 'dd' : 'all')}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              filterDD === 'dd' 
                ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                : 'bg-slate-100 text-slate-600 hover:bg-red-50 border-2 border-transparent'
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Dangereux: {dechetsDD}</span>
          </button>
          <button
            onClick={() => setFilterDD(filterDD === 'all' ? 'non-dd' : 'all')}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              filterDD === 'non-dd' 
                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' 
                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 border-2 border-transparent'
            )}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Non dangereux: {dechetsNonDD}</span>
          </button>
          <div className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 flex items-center gap-2">
            <span>Total: {totalDechets}</span>
          </div>
        </div>
        
        {/* Sort and Filter Controls */}
        <div className="flex gap-2">
          {/* Export/Import */}
          <Button variant="outline" size="sm" onClick={exportDechets}>
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={importDechets}
              id="import-dechets"
              className="hidden"
            />
            <label htmlFor="import-dechets">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  Importer
                </span>
              </Button>
            </label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnFilters(!showColumnFilters)}
            className={cn(showColumnFilters && "bg-slate-100")}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres colonnes
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
            <Table className="min-w-[900px]">
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[32px] px-2">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </TableHead>
                  <TableHead 
                    className="w-[90px] px-2 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('ticket')}
                  >
                    Ticket {columnSort.column === 'ticket' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="w-[90px] px-2 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('date')}
                  >
                    Date {columnSort.column === 'date' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="w-[140px] px-2 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('matiere')}
                  >
                    Matière {columnSort.column === 'matiere' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="w-[80px] px-2 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('code')}
                  >
                    Code {columnSort.column === 'code' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="w-[80px] px-2 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('poids')}
                  >
                    Poids {columnSort.column === 'poids' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="w-[100px] px-2 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('conditionnement')}
                  >
                    Cond. {columnSort.column === 'conditionnement' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="w-[120px] px-2 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('transporteur')}
                  >
                    Transp. {columnSort.column === 'transporteur' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="w-[120px] px-2 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('destinataire')}
                  >
                    Dest. {columnSort.column === 'destinataire' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className="w-[100px] px-2 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleColumnSort('statut')}
                  >
                    Statut {columnSort.column === 'statut' && (columnSort.order === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="w-[80px] px-2 text-right">Actions</TableHead>
                </TableRow>
                {showColumnFilters && (
                  <TableRow className="bg-slate-100">
                    <TableHead className="p-1 px-2">
                      <span className="text-xs text-slate-400">-</span>
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <span className="text-xs text-slate-400">-</span>
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <Input
                        placeholder="Filtrer..."
                        value={columnFilters.date}
                        onChange={(e) => setColumnFilters({...columnFilters, date: e.target.value})}
                        className="h-6 text-xs px-1"
                      />
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <Input
                        placeholder="Filtrer..."
                        value={columnFilters.matiere}
                        onChange={(e) => setColumnFilters({...columnFilters, matiere: e.target.value})}
                        className="h-6 text-xs px-1"
                      />
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <Input
                        placeholder="Filtrer..."
                        value={columnFilters.code}
                        onChange={(e) => setColumnFilters({...columnFilters, code: e.target.value})}
                        className="h-6 text-xs font-mono px-1"
                      />
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <span className="text-xs text-slate-400">-</span>
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <span className="text-xs text-slate-400">-</span>
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <Input
                        placeholder="Filtrer..."
                        value={columnFilters.transporteur}
                        onChange={(e) => setColumnFilters({...columnFilters, transporteur: e.target.value})}
                        className="h-6 text-xs px-1"
                      />
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <Input
                        placeholder="Filtrer..."
                        value={columnFilters.destinataire}
                        onChange={(e) => setColumnFilters({...columnFilters, destinataire: e.target.value})}
                        className="h-6 text-xs px-1"
                      />
                    </TableHead>
                    <TableHead className="p-1 px-2">
                      <Input
                        placeholder="Filtrer..."
                        value={columnFilters.statut}
                        onChange={(e) => setColumnFilters({...columnFilters, statut: e.target.value})}
                        className="h-6 text-xs px-1"
                      />
                    </TableHead>
                    <TableHead className="p-1 px-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setColumnFilters({date: '', matiere: '', code: '', transporteur: '', destinataire: '', statut: ''})}
                        className="h-6 px-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {filteredDechets.map((dechet) => (
                  <TableRow 
                    key={dechet.id}
                    className={cn(dechet.isDD && 'bg-red-50/50', selectedDechets.includes(dechet.id!) && 'bg-emerald-50')}
                  >
                    <TableCell className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selectedDechets.includes(dechet.id!)}
                        onChange={() => handleSelectDechet(dechet.id!)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium px-2 py-2">
                      <div className={cn(
                        "flex items-center gap-1",
                        isDuplicateTicket(dechet.num_ticket) && "bg-red-100 text-red-700 px-1 py-0.5 rounded"
                      )}>
                        <span className="truncate max-w-[60px]">{dechet.num_ticket}</span>
                        {isDuplicateTicket(dechet.num_ticket) && (
                          <span className="text-xs text-red-500 flex-shrink-0" title="Doublon détecté">⚠️</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 flex-shrink-0"
                          onClick={() => handleCopy(dechet.num_ticket, 'N° Ticket')}
                        >
                          {copiedField === 'N° Ticket' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm">{new Date(dechet.date_entree).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="px-2 py-2 truncate max-w-[140px]" title={dechet.matiere}>
                      <span className="truncate block">{dechet.matiere}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
                        dechet.isDD ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      )}>
                        {dechet.isDD && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                        <span className="truncate">{dechet.code_dechet}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right font-medium text-sm">
                      {dechet.poids_kg?.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm truncate max-w-[100px]" title={dechet.conditionnement}>
                      <span className="truncate block">{dechet.conditionnement}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm truncate max-w-[120px]" title={dechet.transporteur}>
                      <span className="truncate block">{dechet.transporteur}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm truncate max-w-[120px]" title={dechet.destinataire}>
                      <span className="truncate block">{dechet.destinataire}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusClass(dechet.statut)
                      )}>
                        <span className="truncate">{dechet.statut}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(dechet)}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(dechet.id!)}
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredDechets.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              Aucun déchet trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
