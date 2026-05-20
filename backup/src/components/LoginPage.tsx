import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Recycle, Eye, EyeOff, Lock, User, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export function LoginPage() {
  const { siteSettings, login, resetPassword } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = login(email, password);
    if (success) {
      toast.success('Connexion réussie', {
        icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
      });
    } else {
      toast.error('Email ou mot de passe incorrect', {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
      });
    }
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('Veuillez entrer votre adresse email', {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
      });
      return;
    }
    
    setIsResetting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = resetPassword(resetEmail);
    if (result.success) {
      // Simuler l'envoi d'un email - ne pas afficher le mot de passe en clair
      toast.success(
        <div className="space-y-2">
          <p className="font-medium">Email envoyé avec succès !</p>
          <p className="text-sm">Un nouveau mot de passe a été généré et envoyé à :</p>
          <p className="font-medium text-emerald-600">{resetEmail}</p>
          <p className="text-xs text-slate-500">Veuillez consulter votre boîte de réception (et vos spams).</p>
        </div>,
        {
          icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
          duration: 8000,
        }
      );
      setIsResetDialogOpen(false);
      setResetEmail('');
    } else {
      toast.error('Aucun utilisateur trouvé avec cet email', {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
      });
    }
    setIsResetting(false);
  };

  const backgroundStyle = siteSettings.loginBackground
    ? { backgroundImage: `url(${siteSettings.loginBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4"
      style={backgroundStyle}
    >
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="mb-8">
          <div className="bg-black/50 backdrop-blur-md rounded-2xl px-8 py-6 flex items-center gap-6 shadow-2xl border border-white/10 w-full">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg flex-shrink-0"
              style={{ backgroundColor: siteSettings.logoBackgroundColor || '#10b981', boxShadow: `0 10px 15px -3px ${siteSettings.logoBackgroundColor || '#10b981'}40` }}
            >
              {siteSettings.logo ? (
                <img 
                  src={siteSettings.logo} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <Recycle className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-lg whitespace-nowrap">
                {siteSettings.siteName}
              </h1>
              <p className="text-white/90 drop-shadow-md">
                {siteSettings.companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center font-normal">Connexion</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour accéder à l'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsResetDialogOpen(true)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-500" />
                Réinitialiser le mot de passe
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-600">
                Entrez votre adresse email pour réinitialiser votre mot de passe.
                Un nouveau mot de passe sera généré et envoyé par email.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsResetDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleResetPassword}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isResetting}
              >
                {isResetting ? 'Réinitialisation...' : 'Réinitialiser'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="mt-8 bg-black/50 backdrop-blur-md rounded-2xl px-8 py-4 text-center text-white/90 text-sm w-full border border-white/10">
          <p>© {new Date().getFullYear()} {siteSettings.companyName}</p>
          <p className="mt-1">Gestion des déchets - Conformité GEREP</p>
        </div>
      </div>
      
      <Toaster 
        position="bottom-right"
        closeButton={false}
        duration={5000}
        toastOptions={{
          style: {
            background: '#ffffff',
            border: 'none',
            borderLeft: '4px solid',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            padding: '16px 20px',
          },
        }}
      />
    </div>
  );
}
