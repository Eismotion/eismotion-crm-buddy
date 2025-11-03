-- Fix RLS policies for invoices table to allow public insert
DROP POLICY IF EXISTS "Public insert access for invoices" ON public.invoices;
CREATE POLICY "Public insert access for invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (true);

-- Also allow public updates and deletes
DROP POLICY IF EXISTS "Public update access for invoices" ON public.invoices;
CREATE POLICY "Public update access for invoices" 
ON public.invoices 
FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Public delete access for invoices" ON public.invoices;
CREATE POLICY "Public delete access for invoices" 
ON public.invoices 
FOR DELETE 
USING (true);

-- Fix RLS policies for invoice_items table to allow public operations
DROP POLICY IF EXISTS "Public insert access for invoice_items" ON public.invoice_items;
CREATE POLICY "Public insert access for invoice_items" 
ON public.invoice_items 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access for invoice_items" ON public.invoice_items;
CREATE POLICY "Public update access for invoice_items" 
ON public.invoice_items 
FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Public delete access for invoice_items" ON public.invoice_items;
CREATE POLICY "Public delete access for invoice_items" 
ON public.invoice_items 
FOR DELETE 
USING (true);