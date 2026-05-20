import { useStore } from '@/store/useStore';
import { Bell, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { sidebarOpen, siteSettings, dechets, contrats } = useStore();
  
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Count notifications
  const ddCount = dechets.filter(d => d.isDD && d.statut?.includes('En attente')).length;
  const expiringContracts = contrats.filter(c => {
    const fin = new Date(c.fin);
    const today = new Date();
    const diffDays = Math.ceil((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }).length;
  const totalNotifications = ddCount + expiringContracts;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white border-b border-slate-200 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-16'
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Left: Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Company Info */}
          {siteSettings.companyName && (
            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="h-4 w-4" />
              <span>{siteSettings.companyName}</span>
            </div>
          )}

          {/* Date */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{today}</span>
          </div>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {totalNotifications}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h4 className="font-medium">Notifications</h4>
                {totalNotifications === 0 ? (
                  <p className="text-sm text-slate-500">Aucune notification</p>
                ) : (
                  <div className="space-y-2">
                    {ddCount > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                        <span className="text-sm text-red-700">
                          {ddCount} déchet(s) dangereux en attente
                        </span>
                      </div>
                    )}
                    {expiringContracts > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                        <span className="text-sm text-amber-700">
                          {expiringContracts} contrat(s) expirent bientôt
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
