-- NOTFALL-SICHERHEITSFIX: Entferne alle öffentlichen Zugriffspolicies
-- Dies ist kritisch für DSGVO-Compliance!

-- 1. CUSTOMERS: Entferne public read access
DROP POLICY IF EXISTS "Public read access for customers" ON public.customers;

-- 2. INVOICES: Entferne ALLE public policies
DROP POLICY IF EXISTS "Public read access for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public insert access for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public update access for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public delete access for invoices" ON public.invoices;

-- 3. INVOICE_ITEMS: Entferne ALLE public policies
DROP POLICY IF EXISTS "Public read access for invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Public insert access for invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Public update access for invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Public delete access for invoice_items" ON public.invoice_items;

-- 4. PRODUCTS: Entferne public write policies (read bleibt für Produktkatalog)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.products;
DROP POLICY IF EXISTS "Enable update for all users" ON public.products;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.products;

-- Erstelle Admin-only Policies für Products
CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));