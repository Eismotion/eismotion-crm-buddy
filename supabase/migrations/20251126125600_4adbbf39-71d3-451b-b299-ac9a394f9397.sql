-- Update protect_invoice_item_data to allow service_role like protect_invoice_data does
CREATE OR REPLACE FUNCTION public.protect_invoice_item_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Erlaube INSERT immer (neue Positionen)
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Erlaube service_role (für Edge Functions/Automated Tasks) IMMER
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Prüfe ob User Admin ist
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Nur Administratoren dürfen Rechnungspositionen ändern! Operation: %', TG_OP
      USING HINT = 'Kontaktieren Sie einen Administrator';
  END IF;
  
  -- Admin darf alles
  RETURN NEW;
END;
$$;