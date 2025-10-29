-- Enable public read access for invoices, customers, and invoice_items
-- This allows the Eismotion dashboard to display data without requiring login

-- Public read access for invoices
CREATE POLICY "Public read access for invoices"
ON public.invoices
FOR SELECT
USING (true);

-- Public read access for customers
CREATE POLICY "Public read access for customers"
ON public.customers
FOR SELECT
USING (true);

-- Public read access for invoice_items
CREATE POLICY "Public read access for invoice_items"
ON public.invoice_items
FOR SELECT
USING (true);