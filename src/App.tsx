import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { TemplateProvider } from "./contexts/TemplateContext";
import { CustomerPortal } from "./components/CustomerPortal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TemplateProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/customers" element={<Index />} />
            <Route path="/customers/:customerId" element={<Index />} />
            <Route path="/customer-portal" element={<CustomerPortal />} />
            <Route path="/invoices" element={<Index />} />
            <Route path="/invoices/:id" element={<Index />} />
            <Route path="/import" element={<Index />} />
            <Route path="/incoming-invoices" element={<Index />} />
            <Route path="/accounting" element={<Index />} />
            <Route path="/design-studio" element={<Index />} />
            <Route path="/products" element={<Index />} />
            <Route path="/analytics" element={<Index />} />
            <Route path="/settings" element={<Index />} />
            <Route path="/fix-customers" element={<Index />} />
            <Route path="/vat-fix" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TemplateProvider>
  </QueryClientProvider>
);

export default App;
