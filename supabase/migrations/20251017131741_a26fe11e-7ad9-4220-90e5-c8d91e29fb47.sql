-- Create table for storing invoice field positions
CREATE TABLE IF NOT EXISTS public.invoice_field_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_name, field_name)
);

-- Enable RLS
ALTER TABLE public.invoice_field_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for all users access
CREATE POLICY "Enable read access for all users" 
ON public.invoice_field_positions 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for all users" 
ON public.invoice_field_positions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for all users" 
ON public.invoice_field_positions 
FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete for all users" 
ON public.invoice_field_positions 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_invoice_field_positions_updated_at
BEFORE UPDATE ON public.invoice_field_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();