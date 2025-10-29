import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { CustomerManagement } from '@/components/CustomerManagement';
import { CustomerDetails } from '@/components/CustomerDetails';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { InvoiceImport } from '@/components/InvoiceImport';
import IncomingInvoices from '@/components/IncomingInvoices';
import Accounting from '@/components/Accounting';
import { InvoiceDesignStudio } from '@/components/InvoiceDesignStudio';
import { ProductManagement } from '@/components/ProductManagement';
import { Analytics } from '@/components/Analytics';
import { Settings } from '@/components/Settings';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerId } = useParams();
  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/customers/')) return 'customers';
    if (path === '/customers') return 'customers';
    if (path === '/invoices') return 'invoices';
    if (path === '/import') return 'import';
    if (path === '/incoming-invoices') return 'incoming-invoices';
    if (path === '/accounting') return 'accounting';
    if (path === '/design-studio') return 'design-studio';
    if (path === '/products') return 'products';
    if (path === '/analytics') return 'analytics';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = {
      'dashboard': '/',
      'customers': '/customers',
      'invoices': '/invoices',
      'import': '/import',
      'incoming-invoices': '/incoming-invoices',
      'accounting': '/accounting',
      'design-studio': '/design-studio',
      'products': '/products',
      'analytics': '/analytics',
      'settings': '/settings',
    };
    navigate(routes[tab] || '/');
  };

  const renderContent = () => {
    if (customerId) {
      return <CustomerDetails />;
    }
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <CustomerManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'import':
        return <InvoiceImport />;
      case 'incoming-invoices':
        return <IncomingInvoices />;
      case 'accounting':
        return <Accounting />;
      case 'design-studio':
        return <InvoiceDesignStudio />;
      case 'products':
        return <ProductManagement />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      {activeTab === 'design-studio' ? (
        <main className="flex-1">
          {renderContent()}
        </main>
      ) : (
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      )}
    </div>
  );
};

export default Index;
