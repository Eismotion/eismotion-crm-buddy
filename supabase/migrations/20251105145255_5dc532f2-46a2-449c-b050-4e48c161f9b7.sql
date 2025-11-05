-- TEIL 1: AUDIT LOG TABELLE
-- Protokolliert alle Änderungen an Rechnungen
CREATE TABLE IF NOT EXISTS public.invoice_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS für Audit-Log (nur Admins können lesen)
ALTER TABLE public.invoice_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.invoice_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_audit_invoice_id ON public.invoice_audit_log(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON public.invoice_audit_log(changed_at DESC);

-- TEIL 2: AUDIT LOG TRIGGER
-- Protokolliert automatisch alle Änderungen
CREATE OR REPLACE FUNCTION public.log_invoice_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.invoice_audit_log (
    invoice_id,
    changed_by,
    operation,
    old_data,
    new_data,
    user_role
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    current_setting('request.jwt.claims', true)::json->>'role'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger erstellen (läuft NACH der Änderung für Log)
DROP TRIGGER IF EXISTS audit_invoices_trigger ON public.invoices;
CREATE TRIGGER audit_invoices_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.log_invoice_changes();

-- TEIL 3: SCHUTZ-TRIGGER
-- Verhindert unerlaubte Änderungen an historischen Daten
CREATE OR REPLACE FUNCTION public.protect_invoice_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Erlaube INSERT immer (neue Rechnungen)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Prüfe ob User Admin ist
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    -- Für UPDATE und DELETE: Nur Admins erlaubt
    RAISE EXCEPTION 'Nur Administratoren dürfen Rechnungsdaten ändern! Operation: %', TG_OP
      USING HINT = 'Kontaktieren Sie einen Administrator';
  END IF;
  
  -- Admin darf alles
  RETURN NEW;
END;
$$;

-- Schutz-Trigger erstellen (läuft VOR der Änderung)
DROP TRIGGER IF EXISTS protect_invoices_trigger ON public.invoices;
CREATE TRIGGER protect_invoices_trigger
BEFORE UPDATE OR DELETE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.protect_invoice_data();

-- TEIL 4: GLEICHES FÜR INVOICE_ITEMS
-- Audit Log für Invoice Items
CREATE OR REPLACE FUNCTION public.log_invoice_item_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.invoice_audit_log (
    invoice_id,
    changed_by,
    operation,
    old_data,
    new_data,
    user_role
  ) VALUES (
    COALESCE(NEW.invoice_id, OLD.invoice_id),
    auth.uid(),
    TG_OP || '_ITEM',
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    current_setting('request.jwt.claims', true)::json->>'role'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_invoice_items_trigger ON public.invoice_items;
CREATE TRIGGER audit_invoice_items_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.log_invoice_item_changes();

-- Schutz für Invoice Items
CREATE OR REPLACE FUNCTION public.protect_invoice_item_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Nur Administratoren dürfen Rechnungspositionen ändern! Operation: %', TG_OP
      USING HINT = 'Kontaktieren Sie einen Administrator';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_invoice_items_trigger ON public.invoice_items;
CREATE TRIGGER protect_invoice_items_trigger
BEFORE UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.protect_invoice_item_data();