-- Add thumbnail_base64 column to invoice_templates for preview images
ALTER TABLE public.invoice_templates 
ADD COLUMN IF NOT EXISTS thumbnail_base64 TEXT;