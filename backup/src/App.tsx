import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { LoginPage } from '@/components/LoginPage';
import { Dashboard } from '@/components/Dashboard';
import { DechetsManager } from '@/components/DechetsManager';
import { PrestatairesManager } from '@/components/PrestatairesManager';
import { TransporteursManager } from '@/components/TransporteursManager';
import { ReferentielsManager } from '@/components/ReferentielsManager';
import { ContratsManager } from '@/components/ContratsManager';
import { AdminPanel } from '@/components/AdminPanel';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import '@/styles/notifications.css';

function App() {
  const { currentView, sidebarOpen, siteSettings, canAccess, isAuthenticated, loadDataFromFile } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  // Load data from JSON file on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if data exists in localStorage
        const stored = localStorage.getItem('sincereal-waste-storage-v4');
        if (!stored) {
          // No localStorage data, load from JSON file
          await loadDataFromFile();
        } else {
          // Check if stored data has actual content
          const parsed = JSON.parse(stored);
          const hasData = parsed.state && (
            (parsed.state.dechets && parsed.state.dechets.length > 0) ||
            (parsed.state.prestataires && parsed.state.prestataires.length > 0)
          );
          if (!hasData) {
            // LocalStorage exists but is empty, reload from file
            await loadDataFromFile();
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        // Always stop loading, even if there's an error
        setIsLoading(false);
      }
    };
    
    // Add a timeout to ensure loading stops even if something hangs
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    
    loadData();
    
    return () => clearTimeout(timeoutId);
  }, [loadDataFromFile]);

  // Update favicon when it changes
  useEffect(() => {
    if (siteSettings.favicon) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.setAttribute('rel', 'shortcut icon');
      link.setAttribute('type', 'image/x-icon');
      link.setAttribute('href', siteSettings.favicon);
      document.head.appendChild(link);
    }
  }, [siteSettings.favicon]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster position="top-right" />
      </>
    );
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de votre gestion des déchets' };
      case 'dechets':
        return { title: 'Suivi des déchets', subtitle: 'Gestion des entrées et sorties de déchets' };
      case 'prestataires':
        return { title: 'Prestataires de traitement', subtitle: 'Répertoire des entreprises de valorisation' };
      case 'transporteurs':
        return { title: 'Transporteurs', subtitle: 'Répertoire des transporteurs agréés' };
      case 'referentiels':
        return { title: 'Référentiels', subtitle: 'Codes déchets et données ADR' };
      case 'contrats':
        return { title: 'Contrats', subtitle: 'Suivi des contrats et agréments' };
      case 'admin':
        return { title: 'Administration', subtitle: 'Paramètres et configuration' };
      default:
        return { title: 'Tableau de bord', subtitle: '' };
    }
  };

  const renderView = () => {
    // Check permissions
    if (!canAccess(currentView)) {
      return (
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Accès restreint</h2>
            <p className="text-slate-500 mb-4">
              Vous n\'avez pas les permissions nécessaires pour accéder à cette rubrique.
            </p>
            <Button 
              onClick={() => {
                const { setCurrentView } = useStore.getState();
                setCurrentView('dashboard');
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'dechets':
        return <DechetsManager />;
      case 'prestataires':
        return <PrestatairesManager />;
      case 'transporteurs':
        return <TransporteursManager />;
      case 'referentiels':
        return <ReferentielsManager />;
      case 'contrats':
        return <ContratsManager />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  const { title, subtitle } = getViewTitle();

  // Update document title
  document.title = `${title} - ${siteSettings.siteName}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header title={title} subtitle={subtitle} />
      
      <main
        className={cn(
          'pt-16 transition-all duration-300 min-h-screen',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <div className="p-6">
          {renderView()}
        </div>
      </main>
      
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

export default App;
