import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import type { User, UserPermissions } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Settings, 
  Database, 
  Bell, 
  Shield, 
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Plus,
  Pencil,
  X,
  Lock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  List,
  Check,
  FileSpreadsheet,
  FileText,
  Activity,
  Save,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { toast } from 'sonner';
import { exportToFile, type DatabaseSchema } from '@/lib/database';
import { getAuditLogs, exportAuditLogsToCSV, clearAuditLogs, type AuditLogEntry, type AuditAction } from '@/lib/audit';

const defaultPermissions: UserPermissions = {
  dashboard: true,
  dechets: true,
  prestataires: false,
  transporteurs: false,
  referentiels: false,
  contrats: false,
  admin: false,
};

const emptyUser: Partial<User> = {
  nom: '',
  email: '',
  password: '',
  role: 'user',
  isActive: true,
  permissions: defaultPermissions,
};

const viewLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  dechets: 'Suivi des déchets',
  prestataires: 'Prestataires',
  transporteurs: 'Transporteurs',
  referentiels: 'Référentiels',
  contrats: 'Contrats',
  admin: 'Administration',
};

export function AdminPanel() {
  const { 
    dechets, 
    prestataires, 
    transporteurs, 
    referentiels, 
    contrats,
    users,
    currentUser,
    siteSettings,
    listes,
    addUser,
    updateUser,
    deleteUser,
    updateSiteSettings,
    updateLogo,
    updateLogoBackgroundColor,
    updateFavicon,
    updateLoginBackground,
    changePassword,
    resetPassword,
    addConditionnement,
    removeConditionnement,
    updateConditionnement,
    getGEREPData,
    resetAllData,
    importAllData,
    loadDataFromFile,
  } = useStore();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertDD, setAlertDD] = useState(true);
  const [alertContracts, setAlertContracts] = useState(true);
  
  // User management state
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetResult, setResetResult] = useState<{success: boolean, newPassword?: string} | null>(null);
  
  // Password change state
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  
  // Predefined logo background colors
  const logoBackgroundColors = [
    { name: 'Transparent', value: 'transparent' },
    { name: 'Blanc', value: '#ffffff' },
    { name: 'Noir', value: '#000000' },
    { name: 'Gris clair', value: '#f3f4f6' },
    { name: 'Gris foncé', value: '#374151' },
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Vert', value: '#10b981' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Jaune', value: '#f59e0b' },
    { name: 'Violet', value: '#8b5cf6' },
  ];
  
  // Conditionnement management
  const [newConditionnement, setNewConditionnement] = useState('');
  const [editingConditionnement, setEditingConditionnement] = useState<string | null>(null);
  const [editedConditionnementValue, setEditedConditionnementValue] = useState('');
  
  // Save confirmation dialog
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  
  // Load audit logs when tab is selected
  const loadAuditLogs = () => {
    setAuditLogs(getAuditLogs().reverse()); // Most recent first
  };

  const exportData = () => {
    const data: DatabaseSchema = {
      dechets,
      prestataires,
      transporteurs,
      referentiels,
      contrats,
      users,
      siteSettings,
      listes,
    };
    exportToFile(data, `sincereal_export_${new Date().toISOString().split('T')[0]}.json`);
  };

  // Export GEREP to CSV
  const exportGEREP = () => {
    const gerepData = getGEREPData();
    const headers = ['Code déchet', 'Dénomination', 'Mode', 'Quantité (tonnes)', 'Transporteur', 'Destinataire', 'DD'];
    const rows = gerepData.map(d => [
      d.code_dechet,
      d.denomination,
      d.mode,
      d.quantite_tonnes.toFixed(3),
      d.transporteur,
      d.destinataire,
      d.isDD ? 'Oui' : 'Non'
    ]);
    
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GEREP_${siteSettings.companyName}_${new Date().getFullYear()}.csv`;
    a.click();
    toast.success('Export GEREP téléchargé');
  };

  const handleSaveUser = (sendPasswordByEmail: boolean = false, isUpdateNotification: boolean = false) => {
    if (!editingUser?.nom || !editingUser?.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Vérifier les doublons (email déjà utilisé)
    const existingUser = users.find(u => u.email.toLowerCase() === editingUser.email?.toLowerCase());
    if (existingUser && existingUser.id !== editingUser.id) {
      toast.error('Un utilisateur avec cet email existe déjà');
      return;
    }
    
    if (editingUser.id) {
      // Mise à jour d'un utilisateur existant
      const oldUser = users.find(u => u.id === editingUser.id);
      const hasPasswordChange = editingUser.password && editingUser.password.length > 0;
      const hasPermissionChange = oldUser && JSON.stringify(oldUser.permissions) !== JSON.stringify(editingUser.permissions);
      
      updateUser(editingUser.id, editingUser);
      
      if (isUpdateNotification && (hasPasswordChange || hasPermissionChange)) {
        // Simuler l'envoi d'un email de notification
        toast.success(
          <div className="space-y-2">
            <p className="font-medium">Utilisateur mis à jour avec succès</p>
            <p className="text-sm">Un email de notification a été envoyé à {editingUser.email}</p>
            {hasPasswordChange && <p className="text-xs text-slate-500">Le mot de passe a été modifié</p>}
            {hasPermissionChange && <p className="text-xs text-slate-500">Les permissions ont été modifiées</p>}
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.success('Utilisateur mis à jour avec succès');
      }
      setIsUserDialogOpen(false);
      setEditingUser(null);
    } else {
      // Création d'un nouvel utilisateur
      if (!editingUser.password) {
        toast.error('Le mot de passe est requis pour un nouvel utilisateur');
        return;
      }
      
      addUser(editingUser as User);
      
      if (sendPasswordByEmail) {
        // Simuler l'envoi d'un email avec les informations de connexion
        toast.success(
          <div className="space-y-2">
            <p className="font-medium">Utilisateur créé avec succès</p>
            <p className="text-sm">Un email avec les informations de connexion a été envoyé à :</p>
            <p className="font-medium text-emerald-600">{editingUser.email}</p>
            <div className="bg-slate-100 p-2 rounded text-xs mt-2">
              <p><strong>Email :</strong> {editingUser.email}</p>
              <p><strong>Mot de passe :</strong> {editingUser.password}</p>
              <p className="text-slate-500 mt-1">Veuillez consulter votre boîte de réception (et vos spams).</p>
            </div>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success('Utilisateur créé avec succès');
      }
      setIsUserDialogOpen(false);
      setEditingUser(null);
    }
  };

  const handleAddUser = () => {
    setEditingUser({ ...emptyUser });
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user, password: '' });
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteUser(id);
      toast.success('Utilisateur supprimé');
    }
  };

  const handleResetPassword = () => {
    if (!resetEmail) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }
    const result = resetPassword(resetEmail);
    if (result.success) {
      setResetResult(result);
      // Afficher aussi une notification avec le nouveau mot de passe
      toast.success(
        <div className="space-y-2">
          <p className="font-medium">Mot de passe réinitialisé avec succès !</p>
          <p className="text-sm">Nouveau mot de passe : <span className="font-mono font-bold text-emerald-600">{result.newPassword}</span></p>
          <p className="text-xs text-slate-500">Notez ce mot de passe et transmettez-le à l'utilisateur.</p>
        </div>,
        { duration: 10000 }
      );
    } else {
      toast.error('Aucun utilisateur trouvé avec cet email');
    }
  };

  const handleCloseResetDialog = () => {
    setResetResult(null);
    setIsResetPasswordDialogOpen(false);
    setResetEmail('');
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (currentUser?.id) {
      const success = changePassword(currentUser.id, oldPassword, newPassword);
      if (success) {
        toast.success('Mot de passe modifié avec succès');
        setIsChangePasswordDialogOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Ancien mot de passe incorrect');
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateLogo(reader.result as string);
        toast.success('Logo mis à jour');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateLoginBackground(reader.result as string);
        toast.success('Fond d\'écran de connexion mis à jour');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFavicon(reader.result as string);
        toast.success('Favicon mis à jour');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetAllData = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUTES les données ? Cette action est irréversible.')) {
      resetAllData();
      toast.success('Toutes les données ont été réinitialisées');
    }
  };

  const handleAddConditionnement = () => {
    if (!newConditionnement.trim()) {
      toast.error('Veuillez entrer une valeur');
      return;
    }
    if (listes.conditionnements.includes(newConditionnement.trim())) {
      toast.error('Ce conditionnement existe déjà');
      return;
    }
    addConditionnement(newConditionnement.trim());
    setNewConditionnement('');
    toast.success('Conditionnement ajouté');
  };

  // Import data function - replaces all data at once
  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          // Validate data structure
          if (!data || typeof data !== 'object') {
            toast.error('Format de fichier invalide');
            event.target.value = '';
            return;
          }

          // Use importAllData to replace all data at once
          importAllData({
            dechets: data.dechets || [],
            prestataires: data.prestataires || [],
            transporteurs: data.transporteurs || [],
            referentiels: data.referentiels || [],
            contrats: data.contrats || [],
            listes: data.listes,
            users: data.users,
            siteSettings: data.siteSettings,
          });

          const counts = {
            dechets: data.dechets?.length || 0,
            prestataires: data.prestataires?.length || 0,
            transporteurs: data.transporteurs?.length || 0,
            referentiels: data.referentiels?.length || 0,
            contrats: data.contrats?.length || 0,
            users: data.users?.length || 0,
          };

          toast.success(
            <div>
              <p>Données importées avec succès !</p>
              <p className="text-sm text-slate-500 mt-1">
                {counts.dechets > 0 && `${counts.dechets} déchets, `}
                {counts.prestataires > 0 && `${counts.prestataires} prestataires, `}
                {counts.transporteurs > 0 && `${counts.transporteurs} transporteurs, `}
                {counts.referentiels > 0 && `${counts.referentiels} référentiels, `}
                {counts.contrats > 0 && `${counts.contrats} contrats, `}
                {counts.users > 0 && `${counts.users} utilisateurs`}
              </p>
            </div>
          );
          event.target.value = '';
        } catch (error) {
          console.error('Error parsing file:', error);
          toast.error('Erreur lors de l\'import. Vérifiez le format du fichier.');
          event.target.value = '';
        }
      };
      reader.onerror = () => {
        toast.error('Erreur lors de la lecture du fichier');
        event.target.value = '';
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('Erreur lors de l\'import des données');
      console.error(error);
      event.target.value = '';
    }
  };

  const handleUpdateConditionnement = (oldValue: string) => {
    if (!editedConditionnementValue.trim()) {
      toast.error('Veuillez entrer une valeur');
      return;
    }
    updateConditionnement(oldValue, editedConditionnementValue.trim());
    setEditingConditionnement(null);
    setEditedConditionnementValue('');
    toast.success('Conditionnement mis à jour');
  };

  const handleRemoveConditionnement = (value: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${value}" ?`)) {
      removeConditionnement(value);
      toast.success('Conditionnement supprimé');
    }
  };

  const togglePermission = (permission: keyof UserPermissions) => {
    if (!editingUser) return;
    const currentPermissions = editingUser.permissions || defaultPermissions;
    setEditingUser({
      ...editingUser,
      permissions: {
        ...currentPermissions,
        [permission]: !currentPermissions[permission],
      },
    });
  };

  const gerepData = getGEREPData();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <div className="flex items-center justify-between sticky top-0 z-20 bg-white py-2">
          <TabsList className="grid w-full grid-cols-7 lg:w-fit">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="lists">Listes</TabsTrigger>
            <TabsTrigger value="gerep">GEREP</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="data">Données</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
          </TabsList>
          <Button 
            onClick={() => setIsSaveDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 ml-4"
          >
            <Save className="mr-2 h-4 w-4" />
            Enregistrer les modifications
          </Button>
        </div>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-500" />
                Paramètres généraux
              </CardTitle>
              <CardDescription>
                Configurez les informations de votre entreprise et l'apparence du site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Section */}
              <div className="space-y-4">
                <Label>Logo du site</Label>
                <div className="flex items-start gap-4">
                  <div 
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: siteSettings.logoBackgroundColor || '#f8fafc' }}
                  >
                    {siteSettings.logo ? (
                      <img 
                        src={siteSettings.logo} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Changer le logo
                      </Button>
                      {siteSettings.logo && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateLogo('')}
                          className="text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                    
                    {/* Logo Background Color */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">Couleur de fond (pour logos PNG)</Label>
                      <div className="flex flex-wrap gap-2">
                        {logoBackgroundColors.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => updateLogoBackgroundColor(color.value)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all ${
                              siteSettings.logoBackgroundColor === color.value 
                                ? 'border-emerald-500 ring-2 ring-emerald-200' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon Section */}
              <div className="space-y-4">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                    {siteSettings.favicon ? (
                      <img 
                        src={siteSettings.favicon} 
                        alt="Favicon" 
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={faviconInputRef}
                      accept="image/*"
                      onChange={handleFaviconUpload}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => faviconInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Changer le favicon
                      </Button>
                      {siteSettings.favicon && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateFavicon('')}
                          className="text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Format recommandé : 32x32px ou 64x64px (PNG, ICO)
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Background Section */}
              <div className="space-y-4">
                <Label>Fond d'écran de connexion</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                    {siteSettings.loginBackground ? (
                      <img 
                        src={siteSettings.loginBackground} 
                        alt="Fond d'écran" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={bgInputRef}
                      accept="image/*"
                      onChange={handleLoginBackgroundUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => bgInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Changer le fond
                    </Button>
                    {siteSettings.loginBackground && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateLoginBackground('')}
                        className="text-red-500"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nom du site</Label>
                  <Input
                    id="siteName"
                    value={siteSettings.siteName}
                    onChange={(e) => updateSiteSettings({ siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    id="companyName"
                    value={siteSettings.companyName}
                    onChange={(e) => updateSiteSettings({ companyName: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsibleName">Responsable GEREP</Label>
                <Input
                  id="responsibleName"
                  placeholder="Nom du responsable"
                  value={siteSettings.responsibleName}
                  onChange={(e) => updateSiteSettings({ responsibleName: e.target.value })}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responsibleEmail">Email du responsable</Label>
                  <Input
                    id="responsibleEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={siteSettings.responsibleEmail}
                    onChange={(e) => updateSiteSettings({ responsibleEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsiblePhone">Téléphone du responsable</Label>
                  <Input
                    id="responsiblePhone"
                    placeholder="01 23 45 67 89"
                    value={siteSettings.responsiblePhone}
                    onChange={(e) => updateSiteSettings({ responsiblePhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse de l'entreprise</Label>
                <Input
                  id="address"
                  placeholder="Adresse complète"
                  value={siteSettings.address}
                  onChange={(e) => updateSiteSettings({ address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siret">N° SIRET</Label>
                <Input
                  id="siret"
                  placeholder="123 456 789 00012"
                  value={siteSettings.siret}
                  onChange={(e) => updateSiteSettings({ siret: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Sécurité
              </CardTitle>
              <CardDescription>
                Gérez votre mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => setIsChangePasswordDialogOpen(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Changer mon mot de passe
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Déchets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{dechets.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Prestataires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{prestataires.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Transporteurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{transporteurs.length}</div>
              </CardContent>
            </Card>
          </div>
          
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Gestion des utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Ajoutez, modifiez et gérez les accès des utilisateurs
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsResetPasswordDialogOpen(true)}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Réinitialiser MDP
                  </Button>
                  <Button onClick={handleAddUser} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                            {user.photo ? (
                              <img src={user.photo} alt={user.nom} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-emerald-600 font-medium">{user.nom.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="font-medium">{user.nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                            user.role === 'user' ? 'bg-blue-100 text-blue-700' : 
                            'bg-slate-100 text-slate-700'}
                        `}>
                          {user.role === 'admin' ? 'Administrateur' : 
                           user.role === 'user' ? 'Utilisateur' : 'Lecteur'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                        `}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(user.permissions || {})
                            .filter(([, v]) => v)
                            .map(([k]) => (
                              <span key={k} className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                                {viewLabels[k]}
                              </span>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.id!)}
                          className="text-red-500"
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lists Management */}
        <TabsContent value="lists" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5 text-emerald-500" />
                    Gestion des conditionnements
                  </CardTitle>
                  <CardDescription>
                    Gérez la liste des conditionnements disponibles dans les formulaires (triés automatiquement par ordre alphabétique)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const data = JSON.stringify(listes.conditionnements, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `conditionnements_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      toast.success('Conditionnements exportés');
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                  </Button>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const imported = JSON.parse(event.target?.result as string);
                            if (Array.isArray(imported)) {
                              imported.forEach((cond: string) => {
                                if (!listes.conditionnements.includes(cond)) {
                                  addConditionnement(cond);
                                }
                              });
                              toast.success(`${imported.length} conditionnements importés`);
                            } else {
                              toast.error('Format de fichier invalide');
                            }
                          } catch {
                            toast.error('Erreur lors de l\'import');
                          }
                          e.target.value = '';
                        };
                        reader.readAsText(file);
                      }}
                      id="import-conditionnements"
                      className="hidden"
                    />
                    <label htmlFor="import-conditionnements">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Importer
                        </span>
                      </Button>
                    </label>
                  </div>
                  <Input
                    placeholder="Nouveau conditionnement..."
                    value={newConditionnement}
                    onChange={(e) => setNewConditionnement(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddConditionnement()}
                    className="w-64"
                  />
                  <Button onClick={handleAddConditionnement} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[calc(100vh-350px)] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-slate-50 h-8">
                      <TableHead className="w-[80%] py-1">Conditionnement</TableHead>
                      <TableHead className="text-right py-1">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listes.conditionnements.map((cond) => (
                      <TableRow key={cond} className="h-8">
                        <TableCell className="py-1">
                          {editingConditionnement === cond ? (
                            <Input
                              value={editedConditionnementValue}
                              onChange={(e) => setEditedConditionnementValue(e.target.value)}
                              className="w-full h-7 py-0"
                              autoFocus
                            />
                          ) : (
                            <span className="text-sm">{cond}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-1">
                          {editingConditionnement === cond ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUpdateConditionnement(cond)}
                                className="text-emerald-600 h-7 w-7"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingConditionnement(null);
                                  setEditedConditionnementValue('');
                                }}
                                className="h-7 w-7"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingConditionnement(cond);
                                  setEditedConditionnementValue(cond);
                                }}
                                className="h-7 w-7"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveConditionnement(cond)}
                                className="text-red-500 h-7 w-7"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GEREP Export */}
        <TabsContent value="gerep" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-500" />
                    Export GEREP
                  </CardTitle>
                  <CardDescription>
                    Tableau de données pour la déclaration annuelle GEREP
                  </CardDescription>
                </div>
                <Button onClick={exportGEREP} className="bg-emerald-600 hover:bg-emerald-700">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Code déchet</TableHead>
                      <TableHead>Dénomination</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Quantité (t)</TableHead>
                      <TableHead>Transporteur</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>DD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gerepData.map((item, index) => (
                      <TableRow key={index} className={item.isDD ? 'bg-red-50/50' : ''}>
                        <TableCell className="font-mono">{item.code_dechet}</TableCell>
                        <TableCell>{item.denomination}</TableCell>
                        <TableCell>{item.mode}</TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantite_tonnes.toFixed(3)}
                        </TableCell>
                        <TableCell>{item.transporteur}</TableCell>
                        <TableCell>{item.destinataire}</TableCell>
                        <TableCell>
                          {item.isDD ? (
                            <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium">
                              Oui
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs">
                              Non
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {gerepData.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  Aucune donnée GEREP disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-500" />
                Configuration des alertes
              </CardTitle>
              <CardDescription>
                Gérez les notifications et alertes automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notifications par email</Label>
                  <p className="text-sm text-slate-500">
                    Recevoir les notifications par email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Alerte Déchets Dangereux
                  </Label>
                  <p className="text-sm text-slate-500">
                    Notifier à chaque enregistrement d'un déchet dangereux
                  </p>
                </div>
                <Switch
                  checked={alertDD}
                  onCheckedChange={setAlertDD}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Alerte contrats expirants</Label>
                  <p className="text-sm text-slate-500">
                    Rappel 30 jours avant expiration d'un contrat
                  </p>
                </div>
                <Switch
                  checked={alertContracts}
                  onCheckedChange={setAlertContracts}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Rappel GEREP annuel</Label>
                  <p className="text-sm text-slate-500">
                    Rappel 60 jours avant le 30 avril (date limite GEREP)
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-500" />
                Gestion des données
              </CardTitle>
              <CardDescription>
                Exportez ou importez vos données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button onClick={exportData} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter toutes les données
                </Button>
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    id="import-data"
                    className="hidden"
                  />
                  <label htmlFor="import-data" className="w-full">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Importer des données
                      </span>
                    </Button>
                  </label>
                </div>
                <Button 
                  onClick={async () => {
                    await loadDataFromFile();
                    toast.success('Données rechargées depuis le fichier');
                  }} 
                  variant="outline" 
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recharger depuis fichier
                </Button>
              </div>
              
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium mb-2">Résumé des données</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Déchets enregistrés</span>
                    <span className="font-medium">{dechets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prestataires</span>
                    <span className="font-medium">{prestataires.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transporteurs</span>
                    <span className="font-medium">{transporteurs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Codes déchets</span>
                    <span className="font-medium">{referentiels.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contrats</span>
                    <span className="font-medium">{contrats.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Utilisateurs</span>
                    <span className="font-medium">{users.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Zone dangereuse
              </CardTitle>
              <CardDescription>
                Actions irréversibles sur les données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                <div>
                  <h4 className="font-medium text-red-900">Réinitialiser toutes les données</h4>
                  <p className="text-sm text-red-700">
                    Cette action supprimera toutes les données de l'application
                  </p>
                </div>
                <Button variant="destructive" onClick={handleResetAllData}>
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal / Statistics */}
        <TabsContent value="journal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Journal d'audit RGPD
              </CardTitle>
              <CardDescription>
                Historique des actions des utilisateurs pour conformité réglementaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <Select value={auditFilter} onValueChange={(v) => setAuditFilter(v as AuditAction | 'ALL')}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toutes les actions</SelectItem>
                    <SelectItem value="LOGIN">Connexion</SelectItem>
                    <SelectItem value="LOGOUT">Déconnexion</SelectItem>
                    <SelectItem value="CREATE">Création</SelectItem>
                    <SelectItem value="UPDATE">Modification</SelectItem>
                    <SelectItem value="DELETE">Suppression</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                    <SelectItem value="IMPORT">Import</SelectItem>
                    <SelectItem value="PASSWORD_RESET">Réinitialisation MDP</SelectItem>
                    <SelectItem value="PASSWORD_CHANGE">Changement MDP</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Rechercher..."
                  value={auditSearchTerm}
                  onChange={(e) => setAuditSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button variant="outline" onClick={loadAuditLogs}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button variant="outline" onClick={() => exportAuditLogsToCSV()}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
                <Button variant="outline" onClick={clearAuditLogs} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              </div>

              {/* Logs Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entité</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs
                      .filter(log => {
                        if (auditFilter !== 'ALL' && log.action !== auditFilter) return false;
                        if (auditSearchTerm) {
                          const search = auditSearchTerm.toLowerCase();
                          return (
                            log.userName.toLowerCase().includes(search) ||
                            log.userEmail.toLowerCase().includes(search) ||
                            log.action.toLowerCase().includes(search) ||
                            log.entityType.toLowerCase().includes(search) ||
                            (log.entityName && log.entityName.toLowerCase().includes(search))
                          );
                        }
                        return true;
                      })
                      .slice(0, 100)
                      .map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {new Date(log.timestamp).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{log.userName}</div>
                            <div className="text-xs text-slate-500">{log.userEmail}</div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                              log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                              log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                              log.action === 'LOGIN' ? 'bg-purple-100 text-purple-700' :
                              log.action === 'LOGOUT' ? 'bg-slate-100 text-slate-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{log.entityType}</TableCell>
                          <TableCell className="text-sm">{log.entityName || '-'}</TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </TableCell>
                        </TableRow>
                      ))}
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          Aucun log d'audit. Cliquez sur "Actualiser" pour charger les données.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Utilisateurs actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {users.filter(u => u.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Administrateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'admin').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Connectés ce mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {users.filter(u => {
                    if (!u.lastLogin) return false;
                    const lastLogin = new Date(u.lastLogin);
                    const now = new Date();
                    return lastLogin.getMonth() === now.getMonth() && 
                           lastLogin.getFullYear() === now.getFullYear();
                  }).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser?.id ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={editingUser?.nom || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, nom: e.target.value })}
                  placeholder="Nom complet"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editingUser?.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                  {editingUser?.photo ? (
                    <img src={editingUser.photo} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-emerald-600 font-medium text-xl">
                      {(editingUser?.nom || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('user-photo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {editingUser?.photo ? 'Changer' : 'Ajouter'}
                  </Button>
                  {editingUser?.photo && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingUser({ ...editingUser, photo: undefined })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  )}
                </div>
                <input
                  id="user-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('L\'image ne doit pas dépasser 2 Mo');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setEditingUser({ ...editingUser, photo: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">Format accepté : JPG, PNG. Taille max : 2 Mo</p>
            </div>

            <div className="space-y-2">
              <Label>Mot de passe {!editingUser?.id && '*'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={editingUser?.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder={editingUser?.id ? 'Laisser vide pour ne pas changer' : 'Mot de passe'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={editingUser?.role || 'user'}
                  onValueChange={(value: 'admin' | 'user' | 'viewer') => {
                    setEditingUser({ 
                      ...editingUser, 
                      role: value,
                      permissions: value === 'admin' ? 
                        { dashboard: true, dechets: true, prestataires: true, transporteurs: true, referentiels: true, contrats: true, admin: true } :
                        defaultPermissions
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="viewer">Lecteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={editingUser?.isActive ? 'active' : 'inactive'}
                  onValueChange={(value) => setEditingUser({ ...editingUser, isActive: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {editingUser?.role !== 'admin' && (
              <div className="space-y-2">
                <Label>Permissions d'accès</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(viewLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        checked={editingUser?.permissions?.[key as keyof UserPermissions] || false}
                        onCheckedChange={() => togglePermission(key as keyof UserPermissions)}
                      />
                      <Label className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={(e) => { e.preventDefault(); setIsUserDialogOpen(false); }}>Annuler</Button>
            {editingUser?.id && (
              <Button 
                onClick={(e) => { e.preventDefault(); handleSaveUser(false, true); }} 
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                type="button"
              >
                Mettre à jour et notifier
              </Button>
            )}
            {!editingUser?.id && (
              <Button 
                onClick={(e) => { e.preventDefault(); handleSaveUser(true); }} 
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                type="button"
              >
                Ajouter et envoyer par mail
              </Button>
            )}
            <Button 
              onClick={(e) => { e.preventDefault(); handleSaveUser(false, false); }} 
              className="bg-emerald-600 hover:bg-emerald-700"
              type="button"
            >
              {editingUser?.id ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resetResult?.success ? 'Mot de passe réinitialisé' : 'Réinitialiser le mot de passe'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {resetResult?.success ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Le nouveau mot de passe est :</p>
                  <p className="font-mono font-bold text-emerald-600 bg-white px-3 py-2 rounded border text-center text-lg">
                    {resetResult.newPassword}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  Notez ce mot de passe et transmettez-le à l'utilisateur.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Email de l'utilisateur</Label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            {resetResult?.success ? (
              <Button onClick={handleCloseResetDialog} className="bg-emerald-600 hover:bg-emerald-700">
                OK
              </Button>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={handleResetPassword} className="bg-emerald-600 hover:bg-emerald-700">
                  Réinitialiser
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer mon mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ancien mot de passe</Label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmer le nouveau mot de passe</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleChangePassword} className="bg-emerald-600 hover:bg-emerald-700">
              Changer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-emerald-500" />
              Confirmer l'enregistrement
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir enregistrer les modifications ?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Cette action sauvegardera toutes les données modifiées.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSaveDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                try {
                  // Le store zustand persiste automatiquement les données
                  // Cette action force juste une notification de confirmation
                  setIsSaveDialogOpen(false);
                  toast.success('Modifications enregistrées avec succès');
                } catch (error) {
                  console.error('Erreur:', error);
                  toast.error('Erreur lors de la sauvegarde');
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
              type="button"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
