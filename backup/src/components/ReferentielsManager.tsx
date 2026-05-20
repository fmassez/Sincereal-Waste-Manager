import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { Referentiel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Search, Pencil, Trash2, AlertTriangle, Euro, Filter, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emptyReferentiel: Partial<Referentiel> = {
  code_dechet: '',
  designation: '',
  categorie: '🟡 DIB',
  num_adr: 'NSA',
  groupe_emb: 'NSA',
  identification_adr: '',
  cout_tonne: 0,
  mode_traitement: '',
};

export function ReferentielsManager() {
  const { referentiels, addReferentiel, updateReferentiel, deleteReferentiel } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('__all__');
  const [editingReferentiel, setEditingReferentiel] = useState<Partial<Referentiel> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const filteredReferentiels = referentiels
    .filter((r) => {
      const matchesSearch = Object.values(r).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesCategory = categoryFilter === '__all__' || r.categorie === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (a.designation || '').localeCompare(b.designation || '', 'fr-FR'));

  // Format code dechet (XX XX XX)
  const formatCodeDechet = (code: string): string => {
    // Remove all non-digit and non-star characters
    let cleaned = code.replace(/[^0-9*]/g, '');
    // Format as XX XX XX
    if (cleaned.length > 2) {
      cleaned = cleaned.slice(0, 2) + ' ' + cleaned.slice(2);
    }
    if (cleaned.length > 5) {
      cleaned = cleaned.slice(0, 5) + ' ' + cleaned.slice(5);
    }
    return cleaned.slice(0, 8); // Max length: XX XX XX
  };

  const handleSave = () => {
    if (!editingReferentiel || isSaving) return;
    
    setIsSaving(true);
    
    // Validation des champs obligatoires
    const errors: Record<string, boolean> = {};
    if (!editingReferentiel.code_dechet?.trim()) errors.code_dechet = true;
    if (!editingReferentiel.designation?.trim()) errors.designation = true;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Champ(s) obligatoire(s) manquant(s)');
      setIsSaving(false);
      return;
    }

    // Format the code
    if (editingReferentiel.code_dechet) {
      const formattedCode = formatCodeDechet(editingReferentiel.code_dechet);
      editingReferentiel.code_dechet = formattedCode;
    }
    
    if (editingReferentiel.id) {
      updateReferentiel(editingReferentiel.id, editingReferentiel);
      toast.success('Code déchet mis à jour');
    } else {
      addReferentiel(editingReferentiel as Referentiel);
      toast.success('Code déchet ajouté avec succès');
    }
    
    setFieldErrors({});
    setIsDialogOpen(false);
    setEditingReferentiel(null);
    setIsSaving(false);
  };

  const handleEdit = (referentiel: Referentiel) => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingReferentiel({ ...referentiel });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingReferentiel({ ...emptyReferentiel });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce code déchet ?')) {
      deleteReferentiel(id);
    }
  };

  const isDD = (code: string) => code?.includes('*');

  // Export/Import functions
  const exportReferentiels = () => {
    const fullExport = {
      referentiels: referentiels,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(fullExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `referentiels-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${referentiels.length} code(s) exporté(s)`);
  };

  const importReferentiels = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Supporte plusieurs formats : array direct, objet avec referentiels, ou objet avec dechets
        let importedReferentiels: Referentiel[] = [];
        
        if (Array.isArray(importedData)) {
          importedReferentiels = importedData;
        } else if (importedData.referentiels && Array.isArray(importedData.referentiels)) {
          importedReferentiels = importedData.referentiels;
        } else if (importedData.dechets && Array.isArray(importedData.dechets)) {
          // Cas spécial : import depuis un export de déchets - extraire les codes uniques
          const uniqueCodes = new Map<string, Referentiel>();
          importedData.dechets.forEach((dechet: any) => {
            if (dechet.code_dechet && !uniqueCodes.has(dechet.code_dechet)) {
              uniqueCodes.set(dechet.code_dechet, {
                id: crypto.randomUUID(),
                code_dechet: dechet.code_dechet,
                designation: dechet.matiere || 'Code importé',
                categorie: dechet.code_dechet?.includes('*') ? '🔴 DD' : '🟡 DIB',
              } as Referentiel);
            }
          });
          importedReferentiels = Array.from(uniqueCodes.values());
        }
        
        if (importedReferentiels.length > 0) {
          let importedCount = 0;
          let duplicateCount = 0;
          
          importedReferentiels.forEach((referentiel: Referentiel) => {
            const { id, ...referentielWithoutId } = referentiel;
            
            // Vérifier les doublons par code_dechet
            const isDuplicate = referentiels.some(existing => 
              existing.code_dechet === referentielWithoutId.code_dechet
            );
            
            if (!isDuplicate) {
              addReferentiel(referentielWithoutId as Referentiel);
              importedCount++;
            } else {
              duplicateCount++;
            }
          });
          
          if (duplicateCount > 0) {
            toast.success(`${importedCount} code(s) importé(s) - ${duplicateCount} doublon(s) ignoré(s)`);
          } else {
            toast.success(`${importedCount} code(s) importé(s)`);
          }
        } else {
          toast.error('Aucun code déchet trouvé dans le fichier');
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
        <div className="flex gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher un code déchet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes les catégories</SelectItem>
              <SelectItem value="🔴 DD">🔴 DD - Déchet Dangereux</SelectItem>
              <SelectItem value="🟡 DIB">🟡 DIB - Déchets Industriels Banals</SelectItem>
              <SelectItem value="🟢 DI">🟢 DI - Déchets Inertes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Export/Import + Add Button */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportReferentiels}>
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={importReferentiels}
              id="import-referentiels"
              className="hidden"
            />
            <label htmlFor="import-referentiels">
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
                Ajouter un code
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingReferentiel?.id ? 'Modifier le code déchet' : 'Ajouter un code déchet'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code_dechet">Code Déchet *</Label>
                  <Input
                    id="code_dechet"
                    placeholder="Ex: 15 01 01"
                    value={editingReferentiel?.code_dechet || ''}
                    onChange={(e) => {
                      const formatted = formatCodeDechet(e.target.value);
                      setEditingReferentiel({ ...editingReferentiel, code_dechet: formatted });
                      if (formatted.trim()) setFieldErrors(prev => ({ ...prev, code_dechet: false }));
                    }}
                    maxLength={8}
                    className={fieldErrors.code_dechet ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                  />
                  <p className="text-xs text-slate-500">
                    Format: 15 01 02 (2 chiffres, espace, 2 chiffres, espace, 2 chiffres). Ajoutez * pour les déchets dangereux
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categorie">Catégorie *</Label>
                  <Select
                    value={editingReferentiel?.categorie || ''}
                    onValueChange={(value) => setEditingReferentiel({ ...editingReferentiel, categorie: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectItem value="🔴 DD">🔴 DD - Déchet Dangereux</SelectItem>
                      <SelectItem value="🟡 DIB">🟡 DIB - Déchets Industriels Banals</SelectItem>
                      <SelectItem value="🟢 DI">🟢 DI - Déchets Inertes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="designation">Désignation officielle *</Label>
                <Input
                  id="designation"
                  placeholder="Intitulé complet selon Annexe II R.541-8"
                  value={editingReferentiel?.designation || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditingReferentiel({ ...editingReferentiel, designation: value });
                    if (value.trim()) setFieldErrors(prev => ({ ...prev, designation: false }));
                  }}
                  className={fieldErrors.designation ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="num_adr">N° ADR</Label>
                  <Input
                    id="num_adr"
                    placeholder="Ex: 3082 ou NSA"
                    value={editingReferentiel?.num_adr || ''}
                    onChange={(e) => setEditingReferentiel({ ...editingReferentiel, num_adr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupe_emb">Groupe d'emballage</Label>
                  <Select
                    value={editingReferentiel?.groupe_emb || ''}
                    onValueChange={(value) => setEditingReferentiel({ ...editingReferentiel, groupe_emb: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">I</SelectItem>
                      <SelectItem value="II">II</SelectItem>
                      <SelectItem value="III">III</SelectItem>
                      <SelectItem value="NC">NC</SelectItem>
                      <SelectItem value="NSA">NSA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode_traitement">Mode de traitement</Label>
                <Input
                  id="mode_traitement"
                  placeholder="Ex: R1 - D10 - D13"
                  value={editingReferentiel?.mode_traitement || ''}
                  onChange={(e) => setEditingReferentiel({ ...editingReferentiel, mode_traitement: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  Codes des opérations de traitement selon la liste des abréviations (R1, D10, etc.)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="identification_adr">Identification ADR</Label>
                <Input
                  id="identification_adr"
                  placeholder="Désignation officielle transport"
                  value={editingReferentiel?.identification_adr || ''}
                  onChange={(e) => setEditingReferentiel({ ...editingReferentiel, identification_adr: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cout_tonne">Coût de traitement (€/t) *</Label>
                <Input
                  id="cout_tonne"
                  type="number"
                  placeholder="Négatif = valorisation (recette)"
                  value={editingReferentiel?.cout_tonne || ''}
                  onChange={(e) => setEditingReferentiel({ ...editingReferentiel, cout_tonne: parseFloat(e.target.value) })}
                />
                <p className="text-xs text-slate-500">
                  Valeur négative = valorisation (recette), positive = traitement (dépense)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={(e) => { e.preventDefault(); setIsDialogOpen(false); }}>Annuler</Button>
              <Button onClick={(e) => { e.preventDefault(); handleSave(); }} className="bg-emerald-600 hover:bg-emerald-700" type="button" disabled={isSaving}>
                {isSaving ? 'Enregistrement...' : (editingReferentiel?.id ? 'Mettre à jour' : 'Ajouter')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[750px]">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[90px] px-2">Code</TableHead>
                  <TableHead className="w-[200px] px-2">Désignation</TableHead>
                  <TableHead className="w-[100px] px-2">Catégorie</TableHead>
                  <TableHead className="w-[100px] px-2">Mode</TableHead>
                  <TableHead className="w-[70px] px-2">ADR</TableHead>
                  <TableHead className="w-[80px] px-2 text-right">Coût</TableHead>
                  <TableHead className="w-[70px] px-2 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferentiels.map((ref) => (
                  <TableRow 
                    key={ref.id}
                    className={cn(isDD(ref.code_dechet) && 'bg-red-50/50')}
                  >
                    <TableCell className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        {isDD(ref.code_dechet) && (
                          <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                        )}
                        <span className={cn(
                          'font-mono font-medium text-sm',
                          isDD(ref.code_dechet) ? 'text-red-700' : 'text-slate-700'
                        )}>
                          {ref.code_dechet}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 truncate max-w-[200px]" title={ref.designation}>
                      <span className="truncate block text-sm">{ref.designation}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                        ref.categorie?.includes('DD') ? 'bg-red-100 text-red-700' :
                        ref.categorie?.includes('DIB') ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      )}>
                        {ref.categorie}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm text-slate-600 truncate max-w-[100px]" title={ref.mode_traitement || '-'}>
                      <span className="truncate block">{ref.mode_traitement || '-'}</span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs">{ref.num_adr || 'NSA'}</span>
                        {ref.groupe_emb && <span className="text-slate-500 text-xs">Grp: {ref.groupe_emb}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right">
                      <span className={cn(
                        'font-medium text-sm',
                        (ref.cout_tonne || 0) < 0 ? 'text-emerald-600' : 
                        (ref.cout_tonne || 0) > 0 ? 'text-red-600' : 'text-slate-600'
                      )}>
                        <Euro className="inline h-3 w-3 mr-1" />
                        {ref.cout_tonne}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ref)}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ref.id!)}
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
          {filteredReferentiels.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              Aucun code déchet trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
