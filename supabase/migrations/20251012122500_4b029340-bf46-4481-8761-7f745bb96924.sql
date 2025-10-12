-- Create storage bucket for incoming invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('incoming-invoices', 'incoming-invoices', false);

-- Create table for incoming invoice metadata
CREATE TABLE public.incoming_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type VARCHAR NOT NULL CHECK (invoice_type IN ('supplier', 'other')),
  file_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_size INTEGER,
  supplier_name VARCHAR,
  invoice_number VARCHAR,
  invoice_date DATE,
  amount NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.incoming_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all incoming invoices"
ON public.incoming_invoices
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert incoming invoices"
ON public.incoming_invoices
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update incoming invoices"
ON public.incoming_invoices
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete incoming invoices"
ON public.incoming_invoices
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Storage policies for incoming-invoices bucket
CREATE POLICY "Admins can view incoming invoice files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'incoming-invoices' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload incoming invoice files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'incoming-invoices' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update incoming invoice files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'incoming-invoices' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete incoming invoice files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'incoming-invoices' AND has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_incoming_invoices_updated_at
BEFORE UPDATE ON public.incoming_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();