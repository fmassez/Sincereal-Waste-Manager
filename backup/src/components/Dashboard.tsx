import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Trash2, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Hourglass,
  TrendingUp,
  TrendingDown,
  Euro,
  FileSpreadsheet,
  RefreshCw,
  Filter,
  Building2,
  X
} from 'lucide-react';
import { ApevalProductionPanel } from './ApevalProductionPanel';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DD_COLORS = ['#ef4444', '#10b981'];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow border-l-4 h-full" style={{ borderLeftColor: color }}>
      <CardContent className="p-4 h-full flex flex-col justify-center">
        <div className="flex items-start gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 mt-1"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-slate-500 leading-tight">{title}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{value}</h3>
            {subtitle && <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{subtitle}</p>}
            {trend && trendValue && (
              <div className={cn(
                'mt-1 flex items-center gap-1 text-[10px]',
                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
              )}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { getFinancialData, dechets, prestataires, siteSettings } = useStore();
  
  // Filters state
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [moisFilter, setMoisFilter] = useState('');
  const [prestataireFilter, setPrestataireFilter] = useState<string>('__all__');
  const [statutFilter, setStatutFilter] = useState<string>('__all__');
  const [showFilters, setShowFilters] = useState(false);
  
  const financialData = getFinancialData();

  // Get monthly data grouped by waste type
  const getMonthlyDataByWasteType = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data: Record<string, Record<string, number>> = {};
    
    // Initialize all months
    months.forEach(mois => {
      data[mois] = {};
    });
    
    // Get unique waste types
    const wasteTypes = [...new Set(filteredDechets.map(d => d.matiere))].filter(Boolean);
    
    // Group by month and waste type
    filteredDechets.forEach(d => {
      if (!d.date_entree || !d.matiere) return;
      const monthIndex = new Date(d.date_entree).getMonth();
      const month = months[monthIndex];
      if (!data[month][d.matiere]) {
        data[month][d.matiere] = 0;
      }
      data[month][d.matiere] += d.poids_kg || 0;
    });
    
    // Convert to array format for chart
    return months.map(mois => ({
      mois,
      ...wasteTypes.reduce((acc, type) => ({
        ...acc,
        [type]: data[mois][type] || 0
      }), {})
    }));
  };

  // Get colors for waste types
  const getWasteTypeColors = () => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    const wasteTypes = [...new Set(filteredDechets.map(d => d.matiere))].filter(Boolean);
    return wasteTypes.map((type, index) => ({
      type,
      color: colors[index % colors.length]
    }));
  };
  
  // Apply filters to dechets
  const filteredDechets = dechets.filter(d => {
    // Filtre par période (date début et fin)
    if (dateDebut && d.date_entree < dateDebut) return false;
    if (dateFin && d.date_entree > dateFin) return false;
    // Filtre par mois complet
    if (moisFilter && !d.date_entree.startsWith(moisFilter)) return false;
    if (prestataireFilter && prestataireFilter !== '__all__' && d.destinataire !== prestataireFilter) return false;
    if (statutFilter && statutFilter !== '__all__' && d.statut !== statutFilter) return false;
    return true;
  });
  
  // Recalculate stats based on filtered data
  const filteredStats = {
    totalDechets: filteredDechets.length,
    totalPoids: filteredDechets.reduce((sum, d) => sum + (d.poids_kg || 0), 0),
    totalDD: filteredDechets.filter((d) => d.isDD).length,
    totalTraites: filteredDechets.filter((d) => d.statut?.includes('Traité')).length,
    totalEnCours: filteredDechets.filter((d) => d.statut?.includes('En cours')).length,
    totalEnAttente: filteredDechets.filter((d) => d.statut?.includes('En attente')).length,
  };
  
  // Data for status pie chart
  const statusData = [
    { name: 'Traités', value: filteredStats.totalTraites, color: '#10b981' },
    { name: 'En cours', value: filteredStats.totalEnCours, color: '#f59e0b' },
    { name: 'En attente', value: filteredStats.totalEnAttente, color: '#ef4444' },
  ].filter(d => d.value > 0);
  
  // Data for DD pie chart
  const ddData = [
    { name: 'Déchets Dangereux', value: filteredStats.totalDD, color: '#ef4444' },
    { name: 'Déchets Non Dangereux', value: filteredStats.totalDechets - filteredStats.totalDD, color: '#10b981' },
  ];
  
  // Data for waste types
  const wasteTypeMap = new Map();
  filteredDechets.forEach(d => {
    const current = wasteTypeMap.get(d.matiere) || 0;
    wasteTypeMap.set(d.matiere, current + (d.poids_kg || 0));
  });
  const wasteTypeData = Array.from(wasteTypeMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Group by prestataire for treatment assignment
  const prestataireStats = prestataires.map(p => {
    const pDechets = filteredDechets.filter(d => d.destinataire === p.nom);
    // Get unique matieres for this prestataire
    const matieres = [...new Set(pDechets.map(d => d.matiere))];
    return {
      ...p,
      dechetsCount: pDechets.length,
      totalPoids: pDechets.reduce((sum, d) => sum + (d.poids_kg || 0), 0),
      matieres: matieres,
    };
  }).filter(p => p.dechetsCount > 0).sort((a, b) => b.totalPoids - a.totalPoids);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Ticket', 'Matière', 'Code', 'Poids (kg)', 'Conditionnement', 'Transporteur', 'Destinataire', 'Statut'];
    const rows = filteredDechets.map(d => [
      d.date_entree,
      d.num_ticket,
      d.matiere,
      d.code_dechet,
      d.poids_kg,
      d.conditionnement,
      d.transporteur,
      d.destinataire,
      d.statut
    ]);
    
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dechets_${siteSettings.companyName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export CSV téléchargé');
  };

  const refreshData = () => {
    toast.success('Données actualisées');
  };

  const clearFilters = () => {
    setDateDebut('');
    setDateFin('');
    setMoisFilter('');
    setPrestataireFilter('__all__');
    setStatutFilter('__all__');
    toast.success('Filtres réinitialisés');
  };

  const hasActiveFilters = dateDebut || dateFin || moisFilter || prestataireFilter !== '__all__' || statutFilter !== '__all__';

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                !
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Du</Label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Au</Label>
                <Input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Mois</Label>
                <Input
                  type="month"
                  value={moisFilter}
                  onChange={(e) => setMoisFilter(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Prestataire</Label>
                <Select value={prestataireFilter} onValueChange={setPrestataireFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tous les prestataires</SelectItem>
                    {prestataires
                      .filter(p => p.statut === 'Actif')
                      .sort((a, b) => a.nom.localeCompare(b.nom))
                      .map(p => (
                        <SelectItem key={p.id} value={p.nom}>{p.nom}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Statut</Label>
                <Select value={statutFilter} onValueChange={setStatutFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tous les statuts</SelectItem>
                    <SelectItem value="✅ Traité">✅ Traité</SelectItem>
                    <SelectItem value="🔄 En cours">🔄 En cours</SelectItem>
                    <SelectItem value="⏳ En attente">⏳ En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Déchets"
          value={filteredStats.totalDechets}
          subtitle="Entrées enregistrées"
          icon={Trash2}
          color="#6366f1"
        />
        <StatCard
          title="Poids Total"
          value={`${(filteredStats.totalPoids / 1000).toFixed(2)} t`}
          subtitle={`${filteredStats.totalPoids.toLocaleString()} kg`}
          icon={Scale}
          color="#8b5cf6"
        />
        <StatCard
          title="Déchets Dangereux"
          value={filteredStats.totalDD}
          subtitle={`${filteredStats.totalDechets > 0 ? ((filteredStats.totalDD / filteredStats.totalDechets) * 100).toFixed(0) : 0}% du total`}
          icon={AlertTriangle}
          color="#ef4444"
        />
        <StatCard
          title="Traités"
          value={filteredStats.totalTraites}
          subtitle={`${filteredStats.totalDechets > 0 ? ((filteredStats.totalTraites / filteredStats.totalDechets) * 100).toFixed(0) : 0}% complété`}
          icon={CheckCircle2}
          color="#10b981"
        />
        <StatCard
          title="En Cours"
          value={filteredStats.totalEnCours}
          subtitle="En traitement"
          icon={Clock}
          color="#f59e0b"
        />
        <StatCard
          title="En Attente"
          value={filteredStats.totalEnAttente}
          subtitle="À traiter"
          icon={Hourglass}
          color="#f97316"
        />
      </div>

      {/* Prestataire Assignment Section */}
      {prestataireStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-500" />
              Affectation des prestataires de traitement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Prestataire</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Matière</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Nombre</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Poids total (t)</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">%</th>
                  </tr>
                </thead>
                <tbody>
                  {prestataireStats.map((p) => {
                    const percentage = filteredStats.totalPoids > 0 
                      ? (p.totalPoids / filteredStats.totalPoids) * 100 
                      : 0;
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="font-medium text-slate-900">{p.nom}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {p.matieres?.map((matiere, idx) => (
                              <span key={idx} className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {matiere}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{p.dechetsCount}</td>
                        <td className="py-3 px-4 text-right font-medium">{(p.totalPoids / 1000).toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600">{percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* APEVAL - Volumes de production et ratio de perte céréale */}
      <ApevalProductionPanel />

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Weight Chart with Waste Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Évolution Mensuelle par Type de Déchet (kg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getMonthlyDataByWasteType()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value.toLocaleString()} kg`, name]}
                />
                <Legend />
                {getWasteTypeColors().map(({ type, color }) => (
                  <Bar key={type} dataKey={type} stackId="a" fill={color} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              Répartition par Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* DD vs Non-DD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Déchets Dangereux vs Non Dangereux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ddData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {ddData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={DD_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-emerald-500" />
              Bilan Financier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Valorisation (Recettes)</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    +{financialData.totalRecettes.toFixed(2)} €
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-red-600 font-medium">Traitement (Dépenses)</p>
                  <p className="text-2xl font-bold text-red-700">
                    -{financialData.totalDepenses.toFixed(2)} €
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
              <div className={cn(
                'flex items-center justify-between p-4 rounded-lg',
                financialData.bilanNet >= 0 ? 'bg-blue-50' : 'bg-orange-50'
              )}>
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    financialData.bilanNet >= 0 ? 'text-blue-600' : 'text-orange-600'
                  )}>
                    Bilan Net
                  </p>
                  <p className={cn(
                    'text-2xl font-bold',
                    financialData.bilanNet >= 0 ? 'text-blue-700' : 'text-orange-700'
                  )}>
                    {financialData.bilanNet >= 0 ? '+' : ''}{financialData.bilanNet.toFixed(2)} €
                  </p>
                </div>
                <Euro className={cn(
                  'h-8 w-8',
                  financialData.bilanNet >= 0 ? 'text-blue-500' : 'text-orange-500'
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waste Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 des Matières par Poids</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Matière</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Poids (t)</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">%</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Visualisation</th>
                </tr>
              </thead>
              <tbody>
                {wasteTypeData.map((item) => {
                  const percentage = filteredStats.totalPoids > 0 ? (item.value / filteredStats.totalPoids) * 100 : 0;
                  return (
                    <tr key={item.name} className="border-b border-slate-100">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-600">{(item.value / 1000).toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-right text-slate-600">{percentage.toFixed(1)}%</td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
