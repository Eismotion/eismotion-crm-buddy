-- Tabelle für private Ausgaben erstellen
CREATE TABLE public.private_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  category VARCHAR NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS aktivieren
ALTER TABLE public.private_expenses ENABLE ROW LEVEL SECURITY;

-- Policies erstellen
CREATE POLICY "Admins can view all private expenses"
  ON public.private_expenses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert private expenses"
  ON public.private_expenses
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update private expenses"
  ON public.private_expenses
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete private expenses"
  ON public.private_expenses
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger für automatische updated_at Aktualisierung
CREATE TRIGGER update_private_expenses_updated_at
  BEFORE UPDATE ON public.private_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();