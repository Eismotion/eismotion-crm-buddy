-- =====================================================
-- Fix Security Issues
-- =====================================================

-- Fix: Add search_path to all functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.recalculate_invoice_totals() CASCADE;
CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_tax_rate DECIMAL(5,2);
BEGIN
    -- Get current invoice tax rate
    SELECT tax_rate INTO v_tax_rate 
    FROM public.invoices 
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Calculate subtotal from all items
    SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
    FROM public.invoice_items 
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Update invoice totals
    UPDATE public.invoices 
    SET 
        subtotal = v_subtotal,
        tax_amount = v_subtotal * (v_tax_rate / 100),
        total_amount = v_subtotal + (v_subtotal * (v_tax_rate / 100))
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP FUNCTION IF EXISTS public.update_customer_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.customers 
    SET 
        total_spent = (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM public.invoices 
            WHERE customer_id = NEW.customer_id AND status = 'bezahlt'
        ),
        total_orders = (
            SELECT COUNT(*) 
            FROM public.invoices 
            WHERE customer_id = NEW.customer_id
        )
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$;

-- Recreate all triggers
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at 
BEFORE UPDATE ON public.customers 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
BEFORE UPDATE ON public.products 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at 
BEFORE UPDATE ON public.invoices 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_templates_updated_at ON public.invoice_templates;
CREATE TRIGGER update_invoice_templates_updated_at 
BEFORE UPDATE ON public.invoice_templates 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS recalc_invoice_on_item_insert ON public.invoice_items;
CREATE TRIGGER recalc_invoice_on_item_insert
AFTER INSERT ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals();

DROP TRIGGER IF EXISTS recalc_invoice_on_item_update ON public.invoice_items;
CREATE TRIGGER recalc_invoice_on_item_update
AFTER UPDATE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals();

DROP TRIGGER IF EXISTS recalc_invoice_on_item_delete ON public.invoice_items;
CREATE TRIGGER recalc_invoice_on_item_delete
AFTER DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_invoice_totals();

DROP TRIGGER IF EXISTS update_customer_stats_trigger ON public.invoices;
CREATE TRIGGER update_customer_stats_trigger 
AFTER INSERT OR UPDATE ON public.invoices 
FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

-- Fix: Recreate views with security_invoker=true
DROP VIEW IF EXISTS public.dashboard_stats;
CREATE VIEW public.dashboard_stats
WITH (security_invoker=true)
AS
SELECT 
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices WHERE status = 'bezahlt') as total_revenue,
  (SELECT COUNT(*) FROM public.customers) as total_customers,
  (SELECT COUNT(*) FROM public.invoices) as total_invoices,
  (SELECT COUNT(*) FROM public.invoices WHERE status = 'überfällig') as overdue_invoices,
  (SELECT COALESCE(AVG(total_amount), 0) FROM public.invoices WHERE status = 'bezahlt') as avg_invoice_value;

DROP VIEW IF EXISTS public.monthly_revenue;
CREATE VIEW public.monthly_revenue
WITH (security_invoker=true)
AS
SELECT 
  DATE_TRUNC('month', invoice_date) as month,
  SUM(total_amount) as revenue,
  COUNT(*) as invoice_count
FROM public.invoices 
WHERE status = 'bezahlt'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

DROP VIEW IF EXISTS public.top_products;
CREATE VIEW public.top_products
WITH (security_invoker=true)
AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.season,
  COALESCE(SUM(ii.quantity), 0) as total_sold,
  COALESCE(SUM(ii.total_price), 0) as total_revenue
FROM public.products p
LEFT JOIN public.invoice_items ii ON p.id = ii.product_id
LEFT JOIN public.invoices i ON ii.invoice_id = i.id AND i.status = 'bezahlt'
GROUP BY p.id, p.name, p.category, p.season
ORDER BY total_revenue DESC;