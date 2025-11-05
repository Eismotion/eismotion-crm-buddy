-- Lösche alte View falls vorhanden
DROP VIEW IF EXISTS public.dashboard_stats;

-- Erstelle View für Dashboard-Statistiken mit ALLEN Rechnungen
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.customers) as total_customers,
  (SELECT COUNT(*) FROM public.invoices WHERE status != 'storniert') as total_invoices,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices WHERE status != 'storniert') as total_revenue,
  (SELECT COUNT(*) FROM public.invoices WHERE status = 'überfällig') as overdue_invoices,
  (SELECT COALESCE(AVG(total_amount), 0) FROM public.invoices WHERE status != 'storniert') as avg_invoice_value;