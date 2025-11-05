import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { CustomerManagement } from '@/components/CustomerManagement';
import { CustomerDetails } from '@/components/CustomerDetails';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { InvoiceDetails } from '@/components/InvoiceDetails';
import { InvoiceImport } from '@/components/InvoiceImport';
import { ContactImport } from '@/components/ContactImport';
import IncomingInvoices from '@/components/IncomingInvoices';
import Accounting from '@/components/Accounting';
import { InvoiceDesignStudio } from '@/components/InvoiceDesignStudio';
import { ProductManagement } from '@/components/ProductManagement';
import { Analytics } from '@/components/Analytics';
import { Settings } from '@/components/Settings';
import { CustomerFixTool } from '@/components/CustomerFixTool';
import VATFixTool from '@/components/VATFixTool';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customerId, id: invoiceId } = useParams<{ customerId?: string; id?: string }>();
  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/customers/')) return 'customers';
    if (path === '/customers') return 'customers';
    if (path.startsWith('/invoices/')) return 'invoices';
    if (path === '/invoices') return 'invoices';
    if (path === '/import') return 'import';
    if (path === '/incoming-invoices') return 'incoming-invoices';
    if (path === '/accounting') return 'accounting';
    if (path === '/design-studio') return 'design-studio';
    if (path === '/products') return 'products';
    if (path === '/analytics') return 'analytics';
    if (path === '/settings') return 'settings';
    if (path === '/fix-customers') return 'fix-customers';
    if (path === '/vat-fix') return 'vat-fix';
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
      'fix-customers': '/fix-customers',
      'vat-fix': '/vat-fix',
    };
    navigate(routes[tab] || '/');
  };

  const renderContent = () => {
    if (customerId) {
      return <CustomerDetails />;
    }
    
    if (invoiceId) {
      return <InvoiceDetails />;
    }
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <CustomerManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'import':
        return (
          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="contacts">Ansprechpartner Import</TabsTrigger>
              <TabsTrigger value="invoices">Rechnungs-Import</TabsTrigger>
            </TabsList>
            <TabsContent value="contacts" className="mt-6">
              <ContactImport />
            </TabsContent>
            <TabsContent value="invoices" className="mt-6">
              <InvoiceImport />
            </TabsContent>
          </Tabs>
        );
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
      case 'fix-customers':
        return <CustomerFixTool />;
      case 'vat-fix':
        return <VATFixTool />;
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
