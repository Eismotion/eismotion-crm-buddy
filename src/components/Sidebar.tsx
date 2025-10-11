import { Package, LayoutDashboard, Users, FileText, ShoppingBag, BarChart3, Settings, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Kunden', icon: Users },
  { id: 'invoices', label: 'Rechnungen', icon: FileText },
  { id: 'design-studio', label: 'Design-Studio', icon: Palette },
  { id: 'products', label: 'Produkte', icon: ShoppingBag },
  { id: 'analytics', label: 'Analysen', icon: BarChart3 },
  { id: 'settings', label: 'Einstellungen', icon: Settings },
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Eismotion CRM</h1>
            <p className="text-xs text-muted-foreground">Rechnungen, die begeistern</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
