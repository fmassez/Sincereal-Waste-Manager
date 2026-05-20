import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import type { Transporteur } from '@/types';
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
import { Plus, Search, Pencil, Trash2, Truck, Mail, Phone, MapPin, Shield, ExternalLink, Copy, Check, LayoutGrid, Table2, Image as ImageIcon, X, Filter, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const emptyTransporteur: Partial<Transporteur> = {
  nom: '',
  adresse: '',
  siren: '',
  telephone: '',
  email: '',
  statut: 'Actif',
  certifications_adr: '',
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

export function TransporteursManager() {
  const { transporteurs, addTransporteur, updateTransporteur, deleteTransporteur, transporteursViewMode, setTransporteursViewMode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTransporteur, setEditingTransporteur] = useState<Partial<Transporteur> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Column filters
  const [columnFilters, setColumnFilters] = useState({
    nom: '',
    adresse: '',
    siren: '',
    statut: '',
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingTransporteur({ ...editingTransporteur, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredTransporteurs = transporteurs
    .filter((t) => {
      // Global search
      const matchesGlobal = Object.values(t).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      // Column filters
      const matchesNom = !columnFilters.nom || t.nom?.toLowerCase().includes(columnFilters.nom.toLowerCase());
      const matchesAdresse = !columnFilters.adresse || t.adresse?.toLowerCase().includes(columnFilters.adresse.toLowerCase());
      const matchesSiren = !columnFilters.siren || t.siren?.toLowerCase().includes(columnFilters.siren.toLowerCase());
      const matchesStatut = !columnFilters.statut || t.statut?.toLowerCase().includes(columnFilters.statut.toLowerCase());
      
    return matchesGlobal && matchesNom && matchesAdresse && matchesSiren && matchesStatut;
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr-FR')); // Tri alphabétique

  const handleSave = () => {
    if (!editingTransporteur || isSaving) return;
    
    setIsSaving(true);
    
    // Validation des champs obligatoires
    const errors: Record<string, boolean> = {};
    if (!editingTransporteur.nom?.trim()) errors.nom = true;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Champ(s) obligatoire(s) manquant(s)');
      setIsSaving(false);
      return;
    }
    
    if (editingTransporteur.id) {
      updateTransporteur(editingTransporteur.id, editingTransporteur);
      toast.success('Transporteur mis à jour');
    } else {
      addTransporteur(editingTransporteur as Transporteur);
      toast.success('Transporteur ajouté avec succès');
    }
    
    setFieldErrors({});
    setIsDialogOpen(false);
    setEditingTransporteur(null);
    setIsSaving(false);
  };

  const handleEdit = (transporteur: Transporteur) => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingTransporteur({ ...transporteur });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setIsSaving(false);
    setFieldErrors({});
    setEditingTransporteur({ ...emptyTransporteur });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce transporteur ?')) {
      deleteTransporteur(id);
      toast.success('Transporteur supprimé');
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await copyToClipboard(text, field);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export/Import functions
  const exportTransporteurs = () => {
    const fullExport = {
      transporteurs: transporteurs,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(fullExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transporteurs-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${transporteurs.length} transporteur(s) exporté(s)`);
  };

  const importTransporteurs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Supporte plusieurs formats
        let importedTransporteurs: Transporteur[] = [];
        
        if (Array.isArray(importedData)) {
          importedTransporteurs = importedData;
        } else if (importedData.transporteurs && Array.isArray(importedData.transporteurs)) {
          importedTransporteurs = importedData.transporteurs;
        } else if (importedData.dechets && Array.isArray(importedData.dechets)) {
          // Cas spécial : import depuis déchets - extraire les transporteurs uniques
          const uniqueTransporteurs = new Map<string, Transporteur>();
          importedData.dechets.forEach((dechet: any) => {
            if (dechet.transporteur && !uniqueTransporteurs.has(dechet.transporteur)) {
              uniqueTransporteurs.set(dechet.transporteur, {
                id: crypto.randomUUID(),
                nom: dechet.transporteur,
              } as Transporteur);
            }
          });
          importedTransporteurs = Array.from(uniqueTransporteurs.values());
        }
        
        if (importedTransporteurs.length > 0) {
          let importedCount = 0;
          let duplicateCount = 0;
          
          importedTransporteurs.forEach((transporteur: Transporteur) => {
            const { id, ...transporteurWithoutId } = transporteur;
            
            // Vérifier les doublons par nom
            const isDuplicate = transporteurs.some(existing => 
              existing.nom?.toLowerCase() === transporteurWithoutId.nom?.toLowerCase()
            );
            
            if (!isDuplicate) {
              addTransporteur(transporteurWithoutId as Transporteur);
              importedCount++;
            } else {
              duplicateCount++;
            }
          });
          
          if (duplicateCount > 0) {
            toast.success(`${importedCount} transporteur(s) importé(s) - ${duplicateCount} doublon(s) ignoré(s)`);
          } else {
            toast.success(`${importedCount} transporteur(s) importé(s)`);
          }
        } else {
          toast.error('Aucun transporteur trouvé dans le fichier');
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
      {filteredTransporteurs.map((transporteur) => (
        <Card key={transporteur.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {transporteur.logo ? (
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                    <img 
                      src={transporteur.logo} 
                      alt="Logo" 
                      className="h-full w-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Truck className="h-7 w-7 text-blue-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-900">{transporteur.nom}</h3>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    transporteur.statut === 'Actif' ? 'bg-emerald-100 text-emerald-700' :
                    transporteur.statut === 'Inactif' ? 'bg-slate-100 text-slate-700' :
                    'bg-amber-100 text-amber-700'
                  )}>
                    {transporteur.statut}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(transporteur)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(transporteur.id!)}
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              {transporteur.adresse && (
                <div className="flex items-start gap-2 text-slate-600 group">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <a 
                      href={getGoogleMapsLink(transporteur.adresse)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-600 hover:underline block"
                    >
                      <span className="block truncate">{transporteur.adresse.split(/,\s*/).slice(0, -1).join(', ')}</span>
                      <span className="block font-medium uppercase">{transporteur.adresse.split(/,\s*/).slice(-1)[0]}</span>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-slate-400 hover:text-emerald-600 mt-1"
                      onClick={() => handleCopy(transporteur.adresse!, 'Adresse')}
                    >
                      {copiedField === 'Adresse' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span className="ml-1">Copier</span>
                    </Button>
                  </div>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </div>
              )}
              {transporteur.siren && (
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">SIREN: {transporteur.siren}</span>
                </div>
              )}
              {transporteur.telephone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a 
                    href={`tel:${transporteur.telephone.replace(/\s/g, '')}`}
                    className="hover:text-emerald-600 hover:underline"
                  >
                    {transporteur.telephone}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleCopy(transporteur.telephone!, 'Téléphone')}
                  >
                    {copiedField === 'Téléphone' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              {transporteur.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a 
                    href={`mailto:${transporteur.email}`}
                    className="hover:text-emerald-600 hover:underline"
                  >
                    {transporteur.email}
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleCopy(transporteur.email!, 'Email')}
                  >
                    {copiedField === 'Email' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              {transporteur.certifications_adr && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                    <Shield className="h-3 w-3" />
                    {transporteur.certifications_adr}
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
          <Table className="min-w-[850px]">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[160px] px-2">Transporteur</TableHead>
                <TableHead className="w-[130px] px-2">Adresse</TableHead>
                <TableHead className="w-[80px] px-2">SIREN</TableHead>
                <TableHead className="w-[130px] px-2">Contact</TableHead>
                <TableHead className="w-[100px] px-2">Certif.</TableHead>
                <TableHead className="w-[80px] px-2">Statut</TableHead>
                <TableHead className="w-[70px] px-2 text-right">Actions</TableHead>
              </TableRow>
              {showColumnFilters && (
                <TableRow className="bg-slate-100">
                  <TableHead className="p-1 px-2">
                    <Input
                      placeholder="Filtrer..."
                      value={columnFilters.nom}
                      onChange={(e) => setColumnFilters({...columnFilters, nom: e.target.value})}
                      className="h-6 text-xs px-1"
                    />
                  </TableHead>
                  <TableHead className="p-1 px-2">
                    <Input
                      placeholder="Filtrer..."
                      value={columnFilters.adresse}
                      onChange={(e) => setColumnFilters({...columnFilters, adresse: e.target.value})}
                      className="h-6 text-xs px-1"
                    />
                  </TableHead>
                  <TableHead className="p-1 px-2">
                    <Input
                      placeholder="Filtrer..."
                      value={columnFilters.siren}
                      onChange={(e) => setColumnFilters({...columnFilters, siren: e.target.value})}
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
                      onClick={() => setColumnFilters({nom: '', adresse: '', siren: '', statut: ''})}
                      className="h-6 px-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {filteredTransporteurs.map((transporteur) => (
                <TableRow key={transporteur.id}>
                  <TableCell className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {transporteur.logo ? (
                        <div className="h-8 w-8 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={transporteur.logo} 
                            alt="Logo" 
                            className="h-full w-full object-contain p-0.5"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <span className="font-medium text-sm truncate">{transporteur.nom}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-sm text-slate-600">
                    {transporteur.adresse ? (
                      <a 
                        href={getGoogleMapsLink(transporteur.adresse)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-600 hover:underline flex items-center gap-1 group text-xs"
                        title={transporteur.adresse}
                      >
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{transporteur.adresse}</span>
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-xs text-slate-600">
                    {transporteur.siren || '-'}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <div className="text-xs space-y-0.5">
                      {transporteur.telephone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <a 
                            href={`tel:${transporteur.telephone.replace(/\s/g, '')}`}
                            className="hover:text-emerald-600 hover:underline truncate"
                            title={transporteur.telephone}
                          >
                            {transporteur.telephone}
                          </a>
                        </div>
                      )}
                      {transporteur.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <a 
                            href={`mailto:${transporteur.email}`}
                            className="hover:text-emerald-600 hover:underline truncate"
                            title={transporteur.email}
                          >
                            {transporteur.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    {transporteur.certifications_adr ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                        <Shield className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{transporteur.certifications_adr}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <span className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium',
                      transporteur.statut === 'Actif' ? 'bg-emerald-100 text-emerald-700' :
                      transporteur.statut === 'Inactif' ? 'bg-slate-100 text-slate-700' :
                      'bg-amber-100 text-amber-700'
                    )}>
                      {transporteur.statut}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transporteur)}
                        className="h-7 w-7"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transporteur.id!)}
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
        <div className="flex gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher un transporteur..."
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
              onClick={() => setTransporteursViewMode('cards')}
              className={cn(
                transporteursViewMode === 'cards' && 'bg-white shadow-sm'
              )}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Vignettes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTransporteursViewMode('table')}
              className={cn(
                transporteursViewMode === 'table' && 'bg-white shadow-sm'
              )}
            >
              <Table2 className="h-4 w-4 mr-1" />
              Tableau
            </Button>
          </div>
          
          {/* Export/Import */}
          <Button variant="outline" size="sm" onClick={exportTransporteurs}>
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </Button>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={importTransporteurs}
              id="import-transporteurs"
              className="hidden"
            />
            <label htmlFor="import-transporteurs">
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
                Ajouter un transporteur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTransporteur?.id ? 'Modifier le transporteur' : 'Ajouter un transporteur'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo du transporteur</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                      {editingTransporteur?.logo ? (
                        <img 
                          src={editingTransporteur.logo} 
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
                        {editingTransporteur?.logo ? 'Changer' : 'Ajouter'}
                      </Button>
                      {editingTransporteur?.logo && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingTransporteur({ ...editingTransporteur, logo: '' })}
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
                    placeholder="Ex: BLONDEL LOGISTIQUE"
                    value={editingTransporteur?.nom || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditingTransporteur({ ...editingTransporteur, nom: value });
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
                    value={editingTransporteur?.adresse || ''}
                    onChange={(e) => setEditingTransporteur({ ...editingTransporteur, adresse: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siren">N° SIREN</Label>
                    <Input
                      id="siren"
                      placeholder="9 chiffres"
                      value={editingTransporteur?.siren || ''}
                      onChange={(e) => setEditingTransporteur({ ...editingTransporteur, siren: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      placeholder="01 23 45 67 89"
                      value={editingTransporteur?.telephone || ''}
                      onChange={(e) => setEditingTransporteur({ ...editingTransporteur, telephone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@example.com"
                    value={editingTransporteur?.email || ''}
                    onChange={(e) => setEditingTransporteur({ ...editingTransporteur, email: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="statut">Statut *</Label>
                    <Select
                      value={editingTransporteur?.statut || ''}
                      onValueChange={(value) => setEditingTransporteur({ ...editingTransporteur, statut: value })}
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
                    <Label htmlFor="certifications_adr">Certifications ADR</Label>
                    <Input
                      id="certifications_adr"
                      placeholder="Ex: ADR, ICPE..."
                      value={editingTransporteur?.certifications_adr || ''}
                      onChange={(e) => setEditingTransporteur({ ...editingTransporteur, certifications_adr: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={(e) => { e.preventDefault(); setIsDialogOpen(false); }}>Annuler</Button>
                <Button onClick={(e) => { e.preventDefault(); handleSave(); }} className="bg-emerald-600 hover:bg-emerald-700" type="button" disabled={isSaving}>
                  {isSaving ? 'Enregistrement...' : (editingTransporteur?.id ? 'Mettre à jour' : 'Ajouter')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {transporteursViewMode === 'cards' ? renderCardsView() : renderTableView()}

      {filteredTransporteurs.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          Aucun transporteur trouvé
        </div>
      )}
    </div>
  );
}
