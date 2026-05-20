import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import type { Contrat } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Search, Pencil, Trash2, FileText, Calendar, User, Building2, AlertCircle, Mail, Copy, Check, Image as ImageIcon, X, LayoutGrid, Table2, Filter, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emptyContrat: Partial<Contrat> = {
  prestataire: '',
  type_contrat: '',
  debut: new Date().toISOString().split('T')[0],
  fin: '',
  duree_mois: 12,
  objet: '',
  statut: '✅ Valide',
  contact: '',
  logo: '',
  commentaire_interne: '',
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

export function ContratsManager() {
  const { contrats, prestataires, addContrat, updateContrat, deleteContrat, contratsViewMode, setContratsViewMode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingContrat, setEditingContrat] = useState<Partial<Contrat> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Column filters
  const [columnFilters, setColumnFilters] = useState({
    prestataire: '',
    type: '',
    periode: '',
    statut: '',
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);

  const filteredContrats = contrats
    .filter((c) => {
      // Global search
      const matchesGlobal = Object.values(c).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      // Column filters
      const matchesPrestataire = !columnFilters.prestataire || c.prestataire?.toLowerCase().includes(columnFilters.prestataire.toLowerCase());
      const matchesType = !columnFilters.type || c.type_contrat?.toLowerCase().includes(columnFilters.type.toLowerCase());
      const matchesPeriode = !columnFilters.periode || (c.debut?.includes(columnFilters.periode) || c.fin?.includes(columnFilters.periode));
      const matchesStatut = !columnFilters.statut || c.statut?.toLowerCase().includes(columnFilters.statut.toLowerCase());
      
      return matchesGlobal && matchesPrestataire && matchesType && matchesPeriode && matchesStatut;
    })
    .sort((a, b) => a.prestataire.localeCompare(b.prestataire, 'fr-FR'));

  // Calculate days until expiration
  const getDaysUntilExpiration = (fin: string) => {
    const endDate = new Date(fin);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSave = () => {
    if (!editingContrat || isSaving) return;
    
    setIsSaving(true);
    
    // Validation des champs obligatoires
    const errors: Record<string, boolean> = {};
    if (!editingContrat.prestataire?.trim()) errors.prestataire = true;
    if (!editingContrat.type_contrat?.trim()) errors.type_contrat = true;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Champ(s) obligatoire(s) manquant(s)');
      setIsSaving(false);
      return;
    }
    
    // Calculate duration
    if (editingContrat.debut && editingContrat.fin) {
      const debut = new Date(editingContrat.debut);
      const fin = new Date(editingContrat.fin);
      const diffMonths = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
      editingContrat.duree_mois = diffMonths;
    }
    
    if (editingContrat.id) {
      updateContrat(editingContrat.id, editingContrat);
      toast.success('Contrat mis à jour');
    } else {
      addContrat(editingContrat as Contrat);
      toast.success('Contrat ajouté avec succès');
    }
    
    setFieldErrors({});
    setIsDialogOpen(false);
    setEditingContrat(null);
    setIsSaving(false);
  };

  const handleEdit = (contrat: Contrat) => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingContrat({ ...contrat });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingContrat({ ...emptyContrat });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      deleteContrat(id);
      toast.success('Contrat supprimé');
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text, field);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export/Import functions
  const exportContrats = () => {
    const fullExport = {
      contrats: contrats,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(fullExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrats-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${contrats.length} contrat(s) exporté(s)`);
  };

  const importContrats = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Supporte plusieurs formats
        let importedContrats: Contrat[] = [];
        
        if (Array.isArray(importedData)) {
          importedContrats = importedData;
        } else if (importedData.contrats && Array.isArray(importedData.contrats)) {
          importedContrats = importedData.contrats;
        }
        
        if (importedContrats.length > 0) {
          let importedCount = 0;
          let duplicateCount = 0;
          let errorCount = 0;
          
          importedContrats.forEach((contrat: Contrat) => {
            const { id, ...contratWithoutId } = contrat;
            
            // Vérifier que les champs obligatoires sont présents
            if (!contratWithoutId.prestataire || !contratWithoutId.debut) {
              errorCount++;
              return;
            }
            
            // Vérifier les doublons par prestataire + date de début
            const isDuplicate = contrats.some(existing => 
              existing.prestataire?.toLowerCase() === contratWithoutId.prestataire?.toLowerCase() &&
              existing.debut === contratWithoutId.debut
            );
            
            if (!isDuplicate) {
              // S'assurer que le contrat a un ID
              const newContrat = {
                ...contratWithoutId,
                id: crypto.randomUUID()
              };
              addContrat(newContrat as Contrat);
              importedCount++;
            } else {
              duplicateCount++;
            }
          });
          
          if (errorCount > 0) {
            toast.error(`${errorCount} contrat(s) ignoré(s) : données incomplètes`);
          }
          if (duplicateCount > 0) {
            toast.success(`${importedCount} contrat(s) importé(s) - ${duplicateCount} doublon(s) ignoré(s)`);
          } else if (importedCount > 0) {
            toast.success(`${importedCount} contrat(s) importé(s)`);
          }
        } else {
          toast.error('Aucun contrat trouvé dans le fichier');
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingContrat({ ...editingContrat, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Get prestataire email for contact
  const getPrestataireEmail = (nom: string) => {
    const prestataire = prestataires.find(p => p.nom === nom);
    return prestataire?.email;
  };

  // Render table view
  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[850px]">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[160px] px-2">Prestataire</TableHead>
                <TableHead className="w-[120px] px-2">Type</TableHead>
                <TableHead className="w-[130px] px-2">Période</TableHead>
                <TableHead className="w-[140px] px-2">Objet</TableHead>
                <TableHead className="w-[100px] px-2">Contact</TableHead>
                <TableHead className="w-[90px] px-2">Statut</TableHead>
                <TableHead className="w-[70px] px-2 text-right">Actions</TableHead>
              </TableRow>
              {showColumnFilters && (
                <TableRow className="bg-slate-100">
                  <TableHead className="p-1 px-2">
                    <Input
                      placeholder="Filtrer..."
                      value={columnFilters.prestataire}
                      onChange={(e) => setColumnFilters({...columnFilters, prestataire: e.target.value})}
                      className="h-6 text-xs px-1"
                    />
                  </TableHead>
                  <TableHead className="p-1 px-2">
                    <Input
                      placeholder="Filtrer..."
                      value={columnFilters.type}
                      onChange={(e) => setColumnFilters({...columnFilters, type: e.target.value})}
                      className="h-6 text-xs px-1"
                    />
                  </TableHead>
                  <TableHead className="p-1 px-2">
                    <Input
                      placeholder="Filtrer..."
                      value={columnFilters.periode}
                      onChange={(e) => setColumnFilters({...columnFilters, periode: e.target.value})}
                      className="h-6 text-xs px-1"
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
                      value={columnFilters.statut}
                      onChange={(e) => setColumnFilters({...columnFilters, statut: e.target.value})}
                      className="h-6 text-xs px-1"
                    />
                  </TableHead>
                  <TableHead className="p-1 px-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setColumnFilters({prestataire: '', type: '', periode: '', statut: ''})}
                      className="h-6 px-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {filteredContrats.map((contrat) => {
                const daysUntilExpiration = getDaysUntilExpiration(contrat.fin);
                const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30;
                const isExpired = daysUntilExpiration < 0;
                const prestataireEmail = getPrestataireEmail(contrat.prestataire);
                
                return (
                  <TableRow key={contrat.id} className={cn(
                    isExpired && 'bg-red-50/50',
                    isExpiringSoon && 'bg-amber-50/50'
                  )}>
                    <TableCell className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        {contrat.logo ? (
                          <div className="h-8 w-8 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                            <img 
                              src={contrat.logo} 
                              alt="Logo" 
                              className="h-full w-full object-contain p-0.5"
                            />
                          </div>
                        ) : (
                          <div className={cn(
                            'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            isExpired ? 'bg-red-100' : isExpiringSoon ? 'bg-amber-100' : 'bg-blue-100'
                          )}>
                            <FileText className={cn(
                              'h-4 w-4',
                              isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-blue-600'
                            )} />
                          </div>
                        )}
                        <span className="font-medium text-sm truncate">{contrat.prestataire}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm truncate max-w-[120px]" title={contrat.type_contrat}>
                      <span className="truncate block">{contrat.type_contrat}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="text-xs">
                          {new Date(contrat.debut).toLocaleDateString('fr-FR')} - {' '}
                          {new Date(contrat.fin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {(isExpiringSoon || isExpired) && (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium mt-0.5',
                          isExpired ? 'text-red-600' : 'text-amber-600'
                        )}>
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          {isExpired ? `Expiré ${Math.abs(daysUntilExpiration)}j` : `Expire ${daysUntilExpiration}j`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm truncate max-w-[140px]" title={contrat.objet || '-'}>
                      <span className="truncate block">{contrat.objet || '-'}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm">
                      {contrat.contact && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate text-xs">{contrat.contact}</span>
                          {prestataireEmail && (
                            <a 
                              href={`mailto:${prestataireEmail}`}
                              className="text-emerald-600 hover:underline flex-shrink-0"
                            >
                              <Mail className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium',
                        contrat.statut?.includes('Valide') ? 'bg-emerald-100 text-emerald-700' :
                        contrat.statut?.includes('En attente') ? 'bg-amber-100 text-amber-700' :
                        contrat.statut?.includes('Expiré') ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      )}>
                        {contrat.statut}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(contrat)}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contrat.id!)}
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  // Render cards view
  const renderCardsView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredContrats.map((contrat) => {
        const daysUntilExpiration = getDaysUntilExpiration(contrat.fin);
        const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30;
        const isExpired = daysUntilExpiration < 0;
        const prestataireEmail = getPrestataireEmail(contrat.prestataire);
        
        return (
          <Card key={contrat.id} className={cn(
            'hover:shadow-lg transition-shadow',
            isExpired && 'border-red-300 bg-red-50/30',
            isExpiringSoon && 'border-amber-300 bg-amber-50/30'
          )}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {contrat.logo ? (
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                      <img 
                        src={contrat.logo} 
                        alt="Logo" 
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center',
                      isExpired ? 'bg-red-100' : isExpiringSoon ? 'bg-amber-100' : 'bg-blue-100'
                    )}>
                      <FileText className={cn(
                        'h-6 w-6',
                        isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-blue-600'
                      )} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{contrat.prestataire}</h3>
                    <p className="text-sm text-slate-500">{contrat.type_contrat}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(contrat)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(contrat.id!)}
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Du {new Date(contrat.debut).toLocaleDateString('fr-FR')} au {' '}
                    {new Date(contrat.fin).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-600">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{contrat.objet}</span>
                </div>
                
                {contrat.contact && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>{contrat.contact}</span>
                    {prestataireEmail && (
                      <>
                        <a 
                          href={`mailto:${prestataireEmail}`}
                          className="text-emerald-600 hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => handleCopy(prestataireEmail, 'Email')}
                        >
                          {copiedField === 'Email' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {/* Commentaire interne */}
                {contrat.commentaire_interne && (
                  <div className="mt-3 p-2 bg-slate-100 rounded-lg text-xs text-slate-600">
                    <span className="font-medium">Note interne:</span> {contrat.commentaire_interne}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    contrat.statut?.includes('Valide') ? 'bg-emerald-100 text-emerald-700' :
                    contrat.statut?.includes('En attente') ? 'bg-amber-100 text-amber-700' :
                    contrat.statut?.includes('Expiré') ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  )}>
                    {contrat.statut}
                  </span>
                  
                  {(isExpiringSoon || isExpired) && (
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium',
                      isExpired ? 'text-red-600' : 'text-amber-600'
                    )}>
                      <AlertCircle className="h-3 w-3" />
                      {isExpired ? `Expiré depuis ${Math.abs(daysUntilExpiration)}j` : `Expire dans ${daysUntilExpiration}j`}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher un contrat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowColumnFilters(!showColumnFilters)}
            className={cn(showColumnFilters && "bg-slate-100")}
            title="Filtres colonnes"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContratsViewMode('cards')}
              className={cn(
                contratsViewMode === 'cards' && 'bg-white shadow-sm'
              )}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Vignettes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContratsViewMode('table')}
              className={cn(
                contratsViewMode === 'table' && 'bg-white shadow-sm'
              )}
            >
              <Table2 className="h-4 w-4 mr-1" />
              Tableau
            </Button>
          </div>
          
          {/* Export/Import */}
          <Button variant="outline" size="sm" onClick={exportContrats}>
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={importContrats}
              id="import-contrats"
              className="hidden"
            />
            <label htmlFor="import-contrats">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-1" />
                  Importer
                </span>
              </Button>
            </label>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un contrat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContrat?.id ? 'Modifier le contrat' : 'Ajouter un contrat'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo du contrat</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                    {editingContrat?.logo ? (
                      <img 
                        src={editingContrat.logo} 
                        alt="Logo contrat" 
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      {editingContrat?.logo ? 'Changer' : 'Ajouter'}
                    </Button>
                    {editingContrat?.logo && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingContrat({ ...editingContrat, logo: '' })}
                        className="text-red-500"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prestataire">Prestataire *</Label>
                <Select
                  value={editingContrat?.prestataire || ''}
                  onValueChange={(value) => {
                    setEditingContrat({ ...editingContrat, prestataire: value });
                    if (value) setFieldErrors(prev => ({ ...prev, prestataire: false }));
                  }}
                >
                  <SelectTrigger className={fieldErrors.prestataire ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}>
                    <SelectValue placeholder="Sélectionner un prestataire" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {prestataires
                      .filter(p => p.statut === 'Actif')
                      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr-FR'))
                      .map((p) => (
                        <SelectItem key={p.id} value={p.nom}>
                          {p.nom}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type_contrat">Type de contrat *</Label>
                <Input
                  id="type_contrat"
                  placeholder="Ex: Collecte papier/carton"
                  value={editingContrat?.type_contrat || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditingContrat({ ...editingContrat, type_contrat: value });
                    if (value.trim()) setFieldErrors(prev => ({ ...prev, type_contrat: false }));
                  }}
                  className={fieldErrors.type_contrat ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="debut">Date de début *</Label>
                  <Input
                    id="debut"
                    type="date"
                    value={editingContrat?.debut || ''}
                    onChange={(e) => setEditingContrat({ ...editingContrat, debut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fin">Date de fin *</Label>
                  <Input
                    id="fin"
                    type="date"
                    value={editingContrat?.fin || ''}
                    onChange={(e) => setEditingContrat({ ...editingContrat, fin: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="objet">Objet / Déchets couverts</Label>
                <Input
                  id="objet"
                  placeholder="Description des services couverts"
                  value={editingContrat?.objet || ''}
                  onChange={(e) => setEditingContrat({ ...editingContrat, objet: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={editingContrat?.statut || ''}
                    onValueChange={(value) => setEditingContrat({ ...editingContrat, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="✅ Valide">✅ Valide</SelectItem>
                      <SelectItem value="⏳ En attente">⏳ En attente</SelectItem>
                      <SelectItem value="❌ Expiré">❌ Expiré</SelectItem>
                      <SelectItem value="🔄 Renouvellement">🔄 Renouvellement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    placeholder="Nom du contact"
                    value={editingContrat?.contact || ''}
                    onChange={(e) => setEditingContrat({ ...editingContrat, contact: e.target.value })}
                  />
                </div>
              </div>

              {/* Commentaire interne */}
              <div className="space-y-2">
                <Label htmlFor="commentaire_interne">Commentaire interne</Label>
                <Textarea
                  id="commentaire_interne"
                  placeholder="Notes et commentaires internes (non visible externement)..."
                  value={editingContrat?.commentaire_interne || ''}
                  onChange={(e) => setEditingContrat({ ...editingContrat, commentaire_interne: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={(e) => { e.preventDefault(); setIsDialogOpen(false); }}>Annuler</Button>
              <Button onClick={(e) => { e.preventDefault(); handleSave(); }} className="bg-emerald-600 hover:bg-emerald-700" type="button" disabled={isSaving}>
                {isSaving ? 'Enregistrement...' : (editingContrat?.id ? 'Mettre à jour' : 'Ajouter')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Content */}
      {contratsViewMode === 'table' ? renderTableView() : renderCardsView()}

      {filteredContrats.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          Aucun contrat trouvé
        </div>
      )}
    </div>
  );
}
