-- =====================================================
-- Eismotion CRM Database Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  customer_number VARCHAR(50) UNIQUE,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(8,2) NOT NULL,
  season VARCHAR(50) DEFAULT 'Ganzjährig',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Invoice Templates Table
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  season VARCHAR(50) NOT NULL,
  html_template TEXT NOT NULL,
  css_styles TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.invoice_templates(id),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 19.00,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(8,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(8,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Import Logs Table
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename VARCHAR(255),
  import_type VARCHAR(50),
  records_processed INTEGER DEFAULT 0,
  records_successful INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  status VARCHAR(50) DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
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

-- Function: Calculate invoice totals from items
CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals()
RETURNS TRIGGER AS $$
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
$$ language 'plpgsql';

-- Triggers for invoice calculations
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

-- Function: Update customer statistics
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
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
$$ language 'plpgsql';

-- Trigger for customer stats
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON public.invoices;
CREATE TRIGGER update_customer_stats_trigger 
AFTER INSERT OR UPDATE ON public.invoices 
FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Dashboard Statistics View
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices WHERE status = 'bezahlt') as total_revenue,
  (SELECT COUNT(*) FROM public.customers) as total_customers,
  (SELECT COUNT(*) FROM public.invoices) as total_invoices,
  (SELECT COUNT(*) FROM public.invoices WHERE status = 'überfällig') as overdue_invoices,
  (SELECT COALESCE(AVG(total_amount), 0) FROM public.invoices WHERE status = 'bezahlt') as avg_invoice_value;

-- Monthly Revenue View
CREATE OR REPLACE VIEW public.monthly_revenue AS
SELECT 
  DATE_TRUNC('month', invoice_date) as month,
  SUM(total_amount) as revenue,
  COUNT(*) as invoice_count
FROM public.invoices 
WHERE status = 'bezahlt'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

-- Top Products View
CREATE OR REPLACE VIEW public.top_products AS
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.invoice_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.invoice_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.import_logs FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert Products
INSERT INTO public.products (name, description, category, price, season) VALUES
('Vanilleeis - 2 Kugeln', 'Cremiges Vanilleeis in der Waffel', 'Eis', 4.50, 'Ganzjährig'),
('Schokoladeneis - 2 Kugeln', 'Reichhaltiges Schokoladeneis in der Waffel', 'Eis', 4.50, 'Ganzjährig'),
('Erdbeereis - 2 Kugeln', 'Fruchtiges Erdbeereis in der Waffel', 'Eis', 4.50, 'Sommer'),
('Glühwein', 'Heißer Glühwein mit Gewürzen', 'Heißgetränke', 3.50, 'Winter'),
('Eiskaffee', 'Kalter Kaffee mit Vanilleeis', 'Kaltgetränke', 5.20, 'Sommer'),
('Heißer Kakao', 'Cremiger heißer Kakao mit Sahne', 'Heißgetränke', 3.80, 'Winter'),
('Frozen Yogurt', 'Gesunder gefrorener Joghurt', 'Eis', 4.20, 'Sommer'),
('Kürbiseis', 'Herbstliches Kürbiseis', 'Eis', 4.80, 'Herbst'),
('Apfelstrudel mit Eis', 'Hausgemachter Apfelstrudel mit Vanilleeis', 'Dessert', 6.50, 'Herbst'),
('Erdbeer-Sorbet', 'Frisches Erdbeersorbet', 'Eis', 4.80, 'Frühling'),
('Matcha-Eis', 'Grüntee-Eis aus Japan', 'Eis', 5.20, 'Frühling')
ON CONFLICT DO NOTHING;

-- Insert Invoice Templates
INSERT INTO public.invoice_templates (name, season, html_template, css_styles) VALUES
('Winter-Design', 'Winter', 
'<!DOCTYPE html><html><head><style>{{css}}</style></head><body class="winter"><div class="header"><h1>❄️ Eismotion</h1></div><div class="content">{{content}}</div></body></html>',
'body.winter { background: linear-gradient(135deg, #e3f2fd, #bbdefb); color: #1565c0; font-family: Arial, sans-serif; } .header { background: #0d47a1; color: white; padding: 20px; text-align: center; }'),

('Sommer-Design', 'Sommer',
'<!DOCTYPE html><html><head><style>{{css}}</style></head><body class="sommer"><div class="header"><h1>☀️ Eismotion</h1></div><div class="content">{{content}}</div></body></html>',
'body.sommer { background: linear-gradient(135deg, #fff3e0, #ffe0b2); color: #ef6c00; font-family: Arial, sans-serif; } .header { background: #ff8f00; color: white; padding: 20px; text-align: center; }'),

('Herbst-Design', 'Herbst',
'<!DOCTYPE html><html><head><style>{{css}}</style></head><body class="herbst"><div class="header"><h1>🍂 Eismotion</h1></div><div class="content">{{content}}</div></body></html>',
'body.herbst { background: linear-gradient(135deg, #fbe9e7, #ffccbc); color: #d84315; font-family: Arial, sans-serif; } .header { background: #bf360c; color: white; padding: 20px; text-align: center; }'),

('Frühling-Design', 'Frühling',
'<!DOCTYPE html><html><head><style>{{css}}</style></head><body class="fruehling"><div class="header"><h1>🌸 Eismotion</h1></div><div class="content">{{content}}</div></body></html>',
'body.fruehling { background: linear-gradient(135deg, #f3e5f5, #e1bee7); color: #7b1fa2; font-family: Arial, sans-serif; } .header { background: #4a148c; color: white; padding: 20px; text-align: center; }')
ON CONFLICT DO NOTHING;

-- Insert Sample Customers
INSERT INTO public.customers (name, email, phone, city, customer_number, total_spent, total_orders) VALUES
('Max Mustermann', 'max@example.com', '+49 170 1234567', 'Berlin', 'CUST-001', 245.50, 15),
('Anna Schmidt', 'anna@example.com', '+49 171 2345678', 'München', 'CUST-002', 156.30, 8),
('Café Sonnenschein', 'info@sonnenschein.de', '+49 172 3456789', 'Hamburg', 'CUST-003', 890.75, 32),
('Peter Wagner', 'peter@example.com', '+49 173 4567890', 'Köln', 'CUST-004', 189.20, 12),
('Maria Müller', 'maria@example.com', '+49 174 5678901', 'Frankfurt', 'CUST-005', 345.80, 20)
ON CONFLICT DO NOTHING;