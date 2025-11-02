-- Create storage bucket for customer files
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-files', 'customer-files', false);

-- Create customer_files table to track uploaded files
CREATE TABLE public.customer_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER,
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customer_files
ALTER TABLE public.customer_files ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with customer files
CREATE POLICY "Admins have full access to customer files"
ON public.customer_files
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Customers can view their own files
CREATE POLICY "Customers can view own files"
ON public.customer_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.customer_id = customer_files.customer_id
  )
);

-- Storage policies for customer-files bucket
-- Admins can upload files
CREATE POLICY "Admins can upload customer files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'customer-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can update customer files
CREATE POLICY "Admins can update customer files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'customer-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can delete customer files
CREATE POLICY "Admins can delete customer files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'customer-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can view all customer files
CREATE POLICY "Admins can view all customer files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'customer-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Customers can view their own files
CREATE POLICY "Customers can view own files in storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'customer-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (storage.foldername(name))[1] = profiles.customer_id::text
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_files_updated_at
BEFORE UPDATE ON public.customer_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();