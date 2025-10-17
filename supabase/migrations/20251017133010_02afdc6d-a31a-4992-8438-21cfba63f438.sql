-- Add has_header_text flag to invoice_templates for controlling header display
ALTER TABLE public.invoice_templates 
ADD COLUMN IF NOT EXISTS has_header_text BOOLEAN DEFAULT false;

-- Update Eismotion template to indicate it has header text in the image
UPDATE public.invoice_templates 
SET has_header_text = true 
WHERE name = 'Eismotion – Headerbild';