-- Remove unique constraint on invoice_number to allow duplicate invoice numbers
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;