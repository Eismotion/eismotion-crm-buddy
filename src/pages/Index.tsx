import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { CustomerManagement } from '@/components/CustomerManagement';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { InvoiceDesignStudio } from '@/components/InvoiceDesignStudio';
import { ProductManagement } from '@/components/ProductManagement';
import { Analytics } from '@/components/Analytics';
import { Settings } from '@/components/Settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <CustomerManagement />;
      case 'invoices':
        return <InvoiceManagement />;
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
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
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
