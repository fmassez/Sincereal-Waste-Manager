import { useStore } from '@/store/useStore';
import type { ViewType } from '@/types';
import { 
  LayoutDashboard, 
  Trash2, 
  Building2, 
  Truck, 
  BookOpen, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Recycle,
  LogOut,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MenuItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'dechets', label: 'Suivi des déchets', icon: Trash2 },
  { id: 'prestataires', label: 'Prestataires', icon: Building2 },
  { id: 'transporteurs', label: 'Transporteurs', icon: Truck },
  { id: 'referentiels', label: 'Référentiels', icon: BookOpen },
  { id: 'contrats', label: 'Contrats', icon: FileText },
  { id: 'admin', label: 'Administration', icon: Settings },
];

export function Sidebar() {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar, currentUser, logout, siteSettings, canAccess } = useStore();

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté avec succès');
  };

  const handleNavigation = (view: ViewType) => {
    if (canAccess(view)) {
      setCurrentView(view);
    } else {
      toast.error('Vous n\'avez pas accès à cette rubrique');
    }
  };

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (currentUser?.role === 'admin') return true;
    return currentUser?.permissions[item.id];
  });

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-slate-900 transition-all duration-300 ease-in-out flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center w-full')}>
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: siteSettings.logoBackgroundColor || '#10b981' }}
            >
              {siteSettings.logo ? (
                <img 
                  src={siteSettings.logo} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-0.5"
                />
              ) : (
                <Recycle className="h-6 w-6 text-white" />
              )}
            </div>
            {sidebarOpen && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-white truncate">{siteSettings.siteName.split(' ')[0]}</span>
                <span className="text-xs text-slate-400 truncate">{siteSettings.siteName.split(' ').slice(1).join(' ')}</span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Toggle button when collapsed */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const hasAccess = canAccess(item.id);
            
            const buttonContent = (
              <button
                onClick={() => handleNavigation(item.id)}
                disabled={!hasAccess}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200 w-full',
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                  !hasAccess && 'opacity-50 cursor-not-allowed',
                  !sidebarOpen && 'justify-center px-2'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
            
            if (!sidebarOpen) {
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {buttonContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return buttonContent;
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-emerald-500">
                  {currentUser?.photo ? (
                    <img 
                      src={currentUser.photo} 
                      alt={currentUser.nom} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {currentUser?.nom?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="text-sm font-medium text-white truncate">{currentUser?.nom}</span>
                  <span className="text-xs text-slate-400 truncate">{currentUser?.email}</span>
                </div>
                {currentUser?.role === 'admin' && (
                  <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-emerald-500 cursor-pointer">
                    {currentUser?.photo ? (
                      <img 
                        src={currentUser.photo} 
                        alt={currentUser.nom} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-white">
                        {currentUser?.nom?.charAt(0).toUpperCase() || 'A'}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{currentUser?.nom}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-full py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Déconnexion</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
