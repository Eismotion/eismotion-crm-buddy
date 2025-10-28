-- Add Storage URL columns to invoice_templates
ALTER TABLE public.invoice_templates 
ADD COLUMN IF NOT EXISTS background_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_templates_name ON public.invoice_templates(name);

-- Create Storage Bucket for invoice templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoice-templates',
  'invoice-templates',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoice-templates bucket
CREATE POLICY "Authenticated users can upload template images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-templates');

CREATE POLICY "Public can view template images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'invoice-templates');

CREATE POLICY "Authenticated users can update template images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'invoice-templates');

CREATE POLICY "Authenticated users can delete template images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-templates');