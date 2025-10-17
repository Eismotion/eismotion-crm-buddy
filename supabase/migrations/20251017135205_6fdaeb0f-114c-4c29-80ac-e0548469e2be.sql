-- Drop old tables completely
DROP TABLE IF EXISTS public.invoice_field_positions CASCADE;
DROP TABLE IF EXISTS public.template_elements CASCADE;
DROP TABLE IF EXISTS public.invoice_templates CASCADE;

-- Templates (Hintergründe)
CREATE TABLE public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  category TEXT,
  background_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Felder (Formularfelder, die frei positioniert werden können)
CREATE TABLE public.invoice_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.invoice_templates(id) ON DELETE CASCADE,
  label TEXT,
  key_name TEXT,
  x NUMERIC,
  y NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_templates
CREATE POLICY "Enable read access for all users" ON public.invoice_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.invoice_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.invoice_templates FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.invoice_templates FOR DELETE USING (true);

-- RLS Policies for invoice_fields
CREATE POLICY "Enable read access for all users" ON public.invoice_fields FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.invoice_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.invoice_fields FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.invoice_fields FOR DELETE USING (true);