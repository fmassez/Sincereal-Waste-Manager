import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Trash2, Wheat, Calculator, Save, Settings2, Download, Upload, Factory, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

interface ProductionEntry {
  id: string;
  mois: string;
  annee: number;
  volumeProduction: number;
  volumeDechets: number;
  note?: string;
}

interface RatioThresholds {
  optimal: number;
  warning: number;
  critical: number;
}

const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function ApevalProductionPanel() {
  const { dechets } = useStore();
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isThresholdDialogOpen, setIsThresholdDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Partial<ProductionEntry> | null>(null);
  const [useTons, setUseTons] = useState(true); // Par défaut en tonnes
  const [thresholds, setThresholds] = useState<RatioThresholds>({
    optimal: 2,
    warning: 4,
    critical: 4,
  });

  // Calculer automatiquement les volumes à partir des déchets APEVAL
  const calculateFromDechets = () => {
    const apevalDechets = dechets.filter(d => d.destinataire === 'APEVAL');
    const monthlyData = new Map<string, { volumeDechets: number; count: number }>();
    
    apevalDechets.forEach(d => {
      if (!d.date_entree) return;
      const date = new Date(d.date_entree);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(key)) {
        monthlyData.set(key, { volumeDechets: 0, count: 0 });
      }
      const data = monthlyData.get(key)!;
      data.volumeDechets += d.poids_kg || 0;
      data.count += 1;
    });

    // Convertir en entrées
    const newEntries: ProductionEntry[] = [];
    monthlyData.forEach((data, key) => {
      const [annee, mois] = key.split('-').map(Number);
      newEntries.push({
        id: key,
        mois: moisNoms[mois - 1],
        annee,
        volumeProduction: 0, // À saisir manuellement
        volumeDechets: data.volumeDechets,
        note: `${data.count} ticket(s) APEVAL`,
      });
    });

    // Trier par date décroissante
    newEntries.sort((a, b) => {
      if (a.annee !== b.annee) return b.annee - a.annee;
      return moisNoms.indexOf(b.mois) - moisNoms.indexOf(a.mois);
    });

    return newEntries;
  };

  // Initialiser avec les données des déchets
  useEffect(() => {
    const autoEntries = calculateFromDechets();
    setEntries(autoEntries);
  }, [dechets]);

  const handleAdd = () => {
    const now = new Date();
    setEditingEntry({
      mois: moisNoms[now.getMonth()],
      annee: now.getFullYear(),
      volumeProduction: 0,
      volumeDechets: 0,
      note: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (entry: ProductionEntry) => {
    setEditingEntry({ ...entry });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingEntry?.mois || !editingEntry?.annee || editingEntry.volumeProduction === undefined || editingEntry.volumeDechets === undefined) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newEntry: ProductionEntry = {
      id: editingEntry.id || `${editingEntry.annee}-${moisNoms.indexOf(editingEntry.mois) + 1}`,
      mois: editingEntry.mois,
      annee: editingEntry.annee,
      volumeProduction: Number(editingEntry.volumeProduction),
      volumeDechets: Number(editingEntry.volumeDechets),
      note: editingEntry.note,
    };

    if (editingEntry.id) {
      setEntries(entries.map(e => e.id === editingEntry.id ? newEntry : e));
      toast.success('Entrée mise à jour');
    } else {
      setEntries([...entries, newEntry]);
      toast.success('Entrée ajoutée');
    }

    setIsDialogOpen(false);
    setEditingEntry(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      setEntries(entries.filter(e => e.id !== id));
      toast.success('Entrée supprimée');
    }
  };

  // Export production data to JSON
  const exportProductionData = () => {
    const data = {
      entries,
      thresholds,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apeval_production_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Données exportées avec succès');
  };

  // Import production data from JSON
  const importProductionData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.entries && Array.isArray(data.entries)) {
          setEntries(data.entries);
          if (data.thresholds) {
            setThresholds(data.thresholds);
          }
          toast.success(`${data.entries.length} entrées importées avec succès`);
        } else {
          toast.error('Format de fichier invalide');
        }
      } catch (error) {
        toast.error('Erreur lors de l\'import du fichier');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const calculateRatio = (volumeDechets: number, volumeProduction: number): number => {
    if (volumeProduction === 0) return 0;
    return (volumeDechets / volumeProduction) * 100;
  };

  // Conversion kg <-> tonnes
  const toDisplayUnit = (kg: number): number => {
    return useTons ? kg / 1000 : kg;
  };

  const totalProduction = entries.reduce((sum, e) => sum + e.volumeProduction, 0);
  const totalDechets = entries.reduce((sum, e) => sum + e.volumeDechets, 0);
  const globalRatio = calculateRatio(totalDechets, totalProduction);

  const getRatioColor = (ratio: number): string => {
    if (ratio <= thresholds.optimal) return 'text-emerald-600';
    if (ratio <= thresholds.warning) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRatioBg = (ratio: number): string => {
    if (ratio <= thresholds.optimal) return 'bg-emerald-50';
    if (ratio <= thresholds.warning) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getRatioLabel = (ratio: number): string => {
    if (ratio <= thresholds.optimal) return '✓ Ratio optimal';
    if (ratio <= thresholds.warning) return '⚠ Ratio à surveiller';
    return '✗ Ratio critique';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="h-5 w-5 text-amber-500" />
            APEVAL - Volumes de production et ratio de perte céréale
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportProductionData}>
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </Button>
            <div>
              <input
                type="file"
                accept=".json"
                onChange={importProductionData}
                id="import-production"
                className="hidden"
              />
              <label htmlFor="import-production">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Importer
                  </span>
                </Button>
              </label>
            </div>
            <Button onClick={handleAdd} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Unit Toggle & Settings */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setUseTons(true)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  useTons ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Tonnes
              </button>
              <button
                onClick={() => setUseTons(false)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  !useTons ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Kg
              </button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsThresholdDialogOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-1" />
            Modifier les seuils
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Factory className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-600 font-medium">Volume total de production</p>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {toDisplayUnit(totalProduction).toLocaleString()} {useTons ? 't' : 'kg'}
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trash className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-600 font-medium">Volume total de déchets</p>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {toDisplayUnit(totalDechets).toLocaleString()} {useTons ? 't' : 'kg'}
            </p>
          </div>
          <div className={cn('rounded-lg p-4', getRatioBg(globalRatio))}>
            <div className="flex items-center gap-2 mb-2">
              <Calculator className={cn('h-5 w-5', getRatioColor(globalRatio))} />
              <p className={cn('text-sm font-medium', getRatioColor(globalRatio))}>Ratio de perte global</p>
            </div>
            <p className={cn('text-2xl font-bold', getRatioColor(globalRatio))}>
              {globalRatio.toFixed(2)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {getRatioLabel(globalRatio)}
            </p>
          </div>
        </div>

        {/* Production Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">Volume Production ({useTons ? 't' : 'kg'})</TableHead>
                <TableHead className="text-right">Volume Déchets ({useTons ? 't' : 'kg'})</TableHead>
                <TableHead className="text-right">Ratio de perte</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    Aucune donnée APEVAL. Les déchets destinés à APEVAL apparaîtront automatiquement.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const ratio = calculateRatio(entry.volumeDechets, entry.volumeProduction);
                  return (
                    <TableRow key={entry.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleEdit(entry)}>
                      <TableCell className="font-medium">{entry.mois} {entry.annee}</TableCell>
                      <TableCell className="text-right font-medium">
                        {toDisplayUnit(entry.volumeProduction).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {toDisplayUnit(entry.volumeDechets).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-semibold', getRatioColor(ratio))}>
                          {ratio.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500">{entry.note || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Legend with 3 thresholds */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-600">Ratio optimal (≤ {thresholds.optimal}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-600">À surveiller ({thresholds.optimal}% - {thresholds.warning}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-600">Critique (&gt; {thresholds.warning}%)</span>
          </div>
        </div>
      </CardContent>

      {/* Threshold Settings Dialog */}
      <Dialog open={isThresholdDialogOpen} onOpenChange={setIsThresholdDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-emerald-500" />
              Modifier les seuils
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="optimal" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                Seuil optimal (%)
              </Label>
              <Input
                id="optimal"
                type="number"
                step="0.1"
                min="0"
                value={thresholds.optimal}
                onChange={(e) => setThresholds({ ...thresholds, optimal: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500">Ratio considéré comme optimal (vert)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warning" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                Seuil à surveiller (%)
              </Label>
              <Input
                id="warning"
                type="number"
                step="0.1"
                min="0"
                value={thresholds.warning}
                onChange={(e) => setThresholds({ ...thresholds, warning: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500">Ratio à surveiller (orange)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="critical" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Seuil critique (%)
              </Label>
              <Input
                id="critical"
                type="number"
                step="0.1"
                min="0"
                value={thresholds.critical}
                onChange={(e) => setThresholds({ ...thresholds, critical: Number(e.target.value) })}
              />
              <p className="text-xs text-slate-500">Ratio critique (rouge)</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={() => {
              setIsThresholdDialogOpen(false);
              toast.success('Seuils mis à jour');
            }} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4 mr-1" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-500" />
              {editingEntry?.id ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mois">Mois</Label>
                <select
                  id="mois"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={editingEntry?.mois || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, mois: e.target.value })}
                >
                  {moisNoms.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  value={editingEntry?.annee || new Date().getFullYear()}
                  onChange={(e) => setEditingEntry({ ...editingEntry, annee: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="volumeProduction">Volume de production (kg)</Label>
              <Input
                id="volumeProduction"
                type="number"
                min="0"
                value={editingEntry?.volumeProduction || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, volumeProduction: Number(e.target.value) })}
                placeholder="Ex: 15000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volumeDechets">Volume de déchets (kg)</Label>
              <Input
                id="volumeDechets"
                type="number"
                min="0"
                value={editingEntry?.volumeDechets || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, volumeDechets: Number(e.target.value) })}
                placeholder="Ex: 450"
              />
            </div>
            {editingEntry?.volumeProduction && editingEntry?.volumeDechets && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">Ratio calculé:</p>
                <p className={cn('text-lg font-semibold', getRatioColor(calculateRatio(editingEntry.volumeDechets, editingEntry.volumeProduction)))}>
                  {calculateRatio(editingEntry.volumeDechets, editingEntry.volumeProduction).toFixed(2)}%
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Input
                id="note"
                value={editingEntry?.note || ''}
                onChange={(e) => setEditingEntry({ ...editingEntry, note: e.target.value })}
                placeholder="Ex: Production standard"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4 mr-1" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
