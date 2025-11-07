-- Allow service role to bypass invoice protection for automated fixes
CREATE OR REPLACE FUNCTION public.protect_invoice_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Erlaube INSERT immer (neue Rechnungen)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Erlaube service_role (für Edge Functions/Automated Tasks) IMMER
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';