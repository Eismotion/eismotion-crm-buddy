-- Add background_base64 column to invoice_templates table
ALTER TABLE public.invoice_templates 
ADD COLUMN IF NOT EXISTS background_base64 TEXT;