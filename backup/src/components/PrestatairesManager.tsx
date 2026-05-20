import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import type { Prestataire } from '@/types';
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
import { 
  Plus, Search, Pencil, Trash2, Building2, Mail, Phone, MapPin, Award, 
  ExternalLink, Copy, Check, LayoutGrid, Table2, Image as ImageIcon, X,
  Download, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emptyPrestataire: Partial<Prestataire> = {
  nom: '',
  adresse: '',
  siret: '',
  telephone: '',
  email: '',
  dechets_traites: '',
  statut: 'Actif',
  certifications: '',
  logo: '',
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

// Google Maps link helper
const getGoogleMapsLink = (address: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

export function PrestatairesManager() {
  const { prestataires, addPrestataire, updatePrestataire, deletePrestataire, prestatairesViewMode, setPrestatairesViewMode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrestataire, setEditingPrestataire] = useState<Partial<Prestataire> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingPrestataire({ ...editingPrestataire, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredPrestataires = prestataires
    .filter((p) =>
      Object.values(p).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr-FR'));

  const handleSave = () => {
    if (!editingPrestataire || isSaving) return;
    
    setIsSaving(true);
    
    // Validation des champs obligatoires
    const errors: Record<string, boolean> = {};
    if (!editingPrestataire.nom?.trim()) errors.nom = true;
    if (!editingPrestataire.dechets_traites?.trim()) errors.dechets_traites = true;
    
    setFieldErrors(errors);
    
    const missingFieldsCount = Object.keys(errors).length;
    if (missingFieldsCount > 0) {
      toast.error(`${missingFieldsCount} champ(s) obligatoire(s) manquant(s)`);
      setIsSaving(false);
      return;
    }
    
    // Vérifier les doublons (sauf en mode édition)
    if (!editingPrestataire.id) {
      const isDuplicate = prestataires.some(existing => 
        existing.nom?.toLowerCase().trim() === editingPrestataire.nom?.toLowerCase().trim()
      );
      if (isDuplicate) {
        toast.error('Un prestataire avec ce nom existe déjà');
        setIsSaving(false);
        return;
      }
    }
    
    if (editingPrestataire.id) {
      updatePrestataire(editingPrestataire.id, editingPrestataire);
      toast.success('Prestataire mis à jour');
    } else {
      addPrestataire(editingPrestataire as Prestataire);
      toast.success('Prestataire ajouté avec succès');
    }
    
    setFieldErrors({});
    setIsDialogOpen(false);
    setEditingPrestataire(null);
    setIsSaving(false);
  };

  const handleEdit = (prestataire: Prestataire) => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingPrestataire({ ...prestataire });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingPrestataire({ ...emptyPrestataire });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce prestataire ?')) {
      deletePrestataire(id);
      toast.success('Prestataire supprimé');
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text, field);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export/Import functions
  const exportPrestataires = () => {
    const fullExport = {
      prestataires: prestataires,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(fullExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prestataires-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${prestataires.length} prestataire(s) exporté(s)`);
  };

  const importPrestataires = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Supporte plusieurs formats
        let importedPrestataires: Prestataire[] = [];
        
        if (Array.isArray(importedData)) {
          importedPrestataires = importedData;
        } else if (importedData.prestataires && Array.isArray(importedData.prestataires)) {
          importedPrestataires = importedData.prestataires;
        } else if (importedData.dechets && Array.isArray(importedData.dechets)) {
          // Cas spécial : import depuis déchets - extraire les destinataires uniques
          const uniquePrestataires = new Map<string, Prestataire>();
          importedData.dechets.forEach((dechet: any) => {
            if (dechet.destinataire && !uniquePrestataires.has(dechet.destinataire)) {
              uniquePrestataires.set(dechet.destinataire, {
                id: crypto.randomUUID(),
                nom: dechet.destinataire,
              } as Prestataire);
            }
          });
          importedPrestataires = Array.from(uniquePrestataires.values());
        }
        
        if (importedPrestataires.length > 0) {
          let importedCount = 0;
          let duplicateCount = 0;
          
          importedPrestataires.forEach((prestataire: Prestataire) => {
            const { id, ...prestataireWithoutId } = prestataire;
            
            // Vérifier les doublons par nom
            const isDuplicate = prestataires.some(existing => 
              existing.nom?.toLowerCase() === prestataireWithoutId.nom?.toLowerCase()
            );
            
            if (!isDuplicate) {
              addPrestataire(prestataireWithoutId as Prestataire);
              importedCount++;
            } else {
              duplicateCount++;
            }
          });
          
          if (duplicateCount > 0) {
            toast.success(`${importedCount} prestataire(s) importé(s) - ${duplicateCount} doublon(s) ignoré(s)`);
          } else {
            toast.success(`${importedCount} prestataire(s) importé(s)`);
          }
        } else {
          toast.error('Aucun prestataire trouvé dans le fichier');
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

  // Render card view
  const renderCardsView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredPrestataires.map((prestataire) => (
        <Card key={prestataire.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {prestataire.logo ? (
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                    <img 
                      src={prestataire.logo} 
                      alt="Logo" 
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-emerald-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-900">{prestataire.nom}</h3>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    prestataire.statut === 'Actif' ? 'bg-emerald-100 text-emerald-700' :
                    prestataire.statut === 'Inactif' ? 'bg-slate-100 text-slate-700' :
                    'bg-amber-100 text-amber-700'
                  )}>
                    {prestataire.statut}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(prestataire)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(prestataire.id!)}
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              {prestataire.adresse && (
                <div className="flex items-start gap-2 text-slate-600 group">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <a 
                    href={getGoogleMapsLink(prestataire.adresse)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    {prestataire.adresse}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              )}
              {prestataire.telephone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a 
                    href={`tel:${prestataire.telephone.replace(/\s/g, '')}`}
                    className="hover:text-emerald-600 hover:underline"
                  >
                    {prestataire.telephone}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleCopy(prestataire.telephone!, 'Téléphone')}
                  >
                    {copiedField === 'Téléphone' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              {prestataire.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a 
                    href={`mailto:${prestataire.email}`}
                    className="hover:text-emerald-600 hover:underline"
                  >
                    {prestataire.email}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleCopy(prestataire.email!, 'Email')}
                  >
                    {copiedField === 'Email' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              <div className="flex items-start gap-2 text-slate-600">
                <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{prestataire.dechets_traites}</span>
              </div>
              {prestataire.certifications && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {prestataire.certifications}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render table view
  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[180px] px-2">Nom</TableHead>
                <TableHead className="w-[140px] px-2">Adresse</TableHead>
                <TableHead className="w-[140px] px-2">Contact</TableHead>
                <TableHead className="w-[140px] px-2">Déchets</TableHead>
                <TableHead className="w-[80px] px-2">Statut</TableHead>
                <TableHead className="w-[70px] px-2 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrestataires.map((prestataire) => (
                <TableRow key={prestataire.id}>
                  <TableCell className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {prestataire.logo ? (
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={prestataire.logo} 
                            alt="Logo" 
                            className="h-full w-full object-contain p-0.5"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-sm truncate block">{prestataire.nom}</span>
                        {prestataire.siret && (
                          <p className="text-xs text-slate-500 truncate">SIRET: {prestataire.siret}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-sm text-slate-600">
                    {prestataire.adresse ? (
                      <div className="flex items-start gap-1 group">
                        <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5 text-slate-400" />
                        <a 
                          href={getGoogleMapsLink(prestataire.adresse)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-600 hover:underline line-clamp-2 flex-1 text-xs"
                          title={prestataire.adresse}
                        >
                          {prestataire.adresse}
                        </a>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <div className="text-xs space-y-0.5">
                      {prestataire.telephone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <a 
                            href={`tel:${prestataire.telephone.replace(/\s/g, '')}`}
                            className="hover:text-emerald-600 hover:underline truncate"
                            title={prestataire.telephone}
                          >
                            {prestataire.telephone}
                          </a>
                        </div>
                      )}
                      {prestataire.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <a 
                            href={`mailto:${prestataire.email}`}
                            className="hover:text-emerald-600 hover:underline truncate"
                            title={prestataire.email}
                          >
                            {prestataire.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-sm truncate max-w-[140px]" title={prestataire.dechets_traites}>
                    <span className="truncate block text-xs">{prestataire.dechets_traites}</span>
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <span className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium',
                      prestataire.statut === 'Actif' ? 'bg-emerald-100 text-emerald-700' :
                      prestataire.statut === 'Inactif' ? 'bg-slate-100 text-slate-700' :
                      'bg-amber-100 text-amber-700'
                    )}>
                      {prestataire.statut}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(prestataire)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(prestataire.id!)}
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
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Rechercher un prestataire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrestatairesViewMode('cards')}
              className={cn(
                prestatairesViewMode === 'cards' && 'bg-white shadow-sm'
              )}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Vignettes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPrestatairesViewMode('table')}
              className={cn(
                prestatairesViewMode === 'table' && 'bg-white shadow-sm'
              )}
            >
              <Table2 className="h-4 w-4 mr-1" />
              Tableau
            </Button>
          </div>
          
          {/* Export/Import */}
          <Button variant="outline" size="sm" onClick={exportPrestataires}>
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={importPrestataires}
              id="import-prestataires"
              className="hidden"
            />
            <label htmlFor="import-prestataires">
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
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPrestataire?.id ? 'Modifier le prestataire' : 'Ajouter un prestataire'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo du prestataire</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                      {editingPrestataire?.logo ? (
                        <img 
                          src={editingPrestataire.logo} 
                          alt="Logo" 
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
                        {editingPrestataire?.logo ? 'Changer' : 'Ajouter'}
                      </Button>
                      {editingPrestataire?.logo && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingPrestataire({ ...editingPrestataire, logo: '' })}
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
                  <Label htmlFor="nom">Nom / Code *</Label>
                  <Input
                    id="nom"
                    placeholder="Ex: RecyPaper"
                    value={editingPrestataire?.nom || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditingPrestataire({ ...editingPrestataire, nom: value });
                      if (value.trim()) setFieldErrors(prev => ({ ...prev, nom: false }));
                    }}
                    className={fieldErrors.nom ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adresse">Adresse complète</Label>
                  <Input
                    id="adresse"
                    placeholder="Rue, code postal, ville"
                    value={editingPrestataire?.adresse || ''}
                    onChange={(e) => setEditingPrestataire({ ...editingPrestataire, adresse: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siret">N° SIRET</Label>
                    <Input
                      id="siret"
                      placeholder="14 chiffres"
                      value={editingPrestataire?.siret || ''}
                      onChange={(e) => setEditingPrestataire({ ...editingPrestataire, siret: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      placeholder="01 23 45 67 89"
                      value={editingPrestataire?.telephone || ''}
                      onChange={(e) => setEditingPrestataire({ ...editingPrestataire, telephone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    value={editingPrestataire?.email || ''}
                    onChange={(e) => setEditingPrestataire({ ...editingPrestataire, email: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dechets_traites">Déchets traités / valorisés *</Label>
                  <Input
                    id="dechets_traites"
                    placeholder="Ex: Papier, Carton, Plastiques..."
                    value={editingPrestataire?.dechets_traites || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditingPrestataire({ ...editingPrestataire, dechets_traites: value });
                      if (value.trim()) setFieldErrors(prev => ({ ...prev, dechets_traites: false }));
                    }}
                    className={fieldErrors.dechets_traites ? 'border-2 border-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="statut">Statut *</Label>
                    <Select
                      value={editingPrestataire?.statut || ''}
                      onValueChange={(value) => setEditingPrestataire({ ...editingPrestataire, statut: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
                        <SelectItem value="Suspendu">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications</Label>
                    <Input
                      id="certifications"
                      placeholder="Ex: ISO 14001, ICPE, ADR..."
                      value={editingPrestataire?.certifications || ''}
                      onChange={(e) => setEditingPrestataire({ ...editingPrestataire, certifications: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={(e) => { e.preventDefault(); setIsDialogOpen(false); }}>Annuler</Button>
                  <Button onClick={(e) => { e.preventDefault(); handleSave(); }} className="bg-emerald-600 hover:bg-emerald-700" type="button" disabled={isSaving}>
                    {isSaving ? 'Enregistrement...' : (editingPrestataire?.id ? 'Mettre à jour' : 'Ajouter')}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {prestatairesViewMode === 'cards' ? renderCardsView() : renderTableView()}

      {filteredPrestataires.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          Aucun prestataire trouvé
        </div>
      )}
    </div>
  );
}
