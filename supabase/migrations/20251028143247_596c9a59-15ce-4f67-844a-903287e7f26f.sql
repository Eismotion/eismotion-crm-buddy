-- Add missing columns to invoice_templates table
ALTER TABLE invoice_templates 
ADD COLUMN IF NOT EXISTS thumbnail_base64 text,
ADD COLUMN IF NOT EXISTS has_header_text boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add trigger to auto-update updated_at
CREATE OR REPLACE TRIGGER update_invoice_templates_updated_at
BEFORE UPDATE ON invoice_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();