-- Erweitere customers Tabelle für länderspezifische MwSt-Sätze
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS vat_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vat_validated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.customers.vat_validated IS 'Wurde die USt-ID erfolgreich validiert';

-- Funktion zur Berechnung des korrekten MwSt-Satzes nach Land
CREATE OR REPLACE FUNCTION public.get_country_vat_rate(p_country VARCHAR(2))
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE p_country
    WHEN 'DE' THEN RETURN 19.00;
    WHEN 'ES' THEN RETURN 21.00;
    WHEN 'AT' THEN RETURN 20.00;
    WHEN 'FR' THEN RETURN 20.00;
    WHEN 'IT' THEN RETURN 22.00;
    WHEN 'NL' THEN RETURN 21.00;
    WHEN 'BE' THEN RETURN 21.00;
    WHEN 'PL' THEN RETURN 23.00;
    WHEN 'PT' THEN RETURN 23.00;
    WHEN 'SE' THEN RETURN 25.00;
    WHEN 'DK' THEN RETURN 25.00;
    WHEN 'FI' THEN RETURN 24.00;
    WHEN 'IE' THEN RETURN 23.00;
    WHEN 'LU' THEN RETURN 17.00;
    WHEN 'GR' THEN RETURN 24.00;
    WHEN 'CZ' THEN RETURN 21.00;
    WHEN 'HU' THEN RETURN 27.00;
    WHEN 'RO' THEN RETURN 19.00;
    WHEN 'BG' THEN RETURN 20.00;
    WHEN 'HR' THEN RETURN 25.00;
    WHEN 'SI' THEN RETURN 22.00;
    WHEN 'SK' THEN RETURN 20.00;
    WHEN 'EE' THEN RETURN 20.00;
    WHEN 'LV' THEN RETURN 21.00;
    WHEN 'LT' THEN RETURN 21.00;
    WHEN 'CY' THEN RETURN 19.00;
    WHEN 'MT' THEN RETURN 18.00;
    ELSE RETURN 0.00; -- Drittland ohne MwSt
  END CASE;
END;
$$;

-- Aktualisierte Funktion zur Berechnung der korrekten MwSt für eine Rechnung
CREATE OR REPLACE FUNCTION public.calculate_invoice_tax_rate(
  p_customer_id UUID,
  p_invoice_items JSONB
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_country VARCHAR(2);
  v_customer_vat_number VARCHAR(50);
  v_customer_is_business BOOLEAN;
  v_customer_vat_validated BOOLEAN;
  v_has_taxable_items BOOLEAN := false;
  v_item JSONB;
  v_product RECORD;
BEGIN
  -- Hole Kundendaten
  SELECT country, vat_number, is_business, vat_validated
  INTO v_customer_country, v_customer_vat_number, v_customer_is_business, v_customer_vat_validated
  FROM public.customers 
  WHERE id = p_customer_id;
  
  -- Default auf Deutschland wenn nicht gesetzt
  v_customer_country := COALESCE(v_customer_country, 'DE');
  
  -- Prüfe ob es MwSt-pflichtige Artikel gibt
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_invoice_items)
  LOOP
    SELECT * INTO v_product 
    FROM public.products 
    WHERE id = (v_item->>'product_id')::UUID;
    
    -- Artikel ist MwSt-pflichtig wenn:
    -- - NICHT MwSt-befreit (Versand/Design)
    -- - Produkt in DE produziert
    IF v_product.is_tax_exempt = false AND v_product.production_country = 'DE' THEN
      -- Prüfe ob B2B innergemeinschaftlich mit validierter USt-ID
      IF v_customer_country != 'DE' 
         AND v_customer_is_business 
         AND v_customer_vat_validated 
         AND v_customer_vat_number IS NOT NULL 
         AND v_customer_country IN ('AT', 'FR', 'IT', 'NL', 'BE', 'PL', 'ES', 'PT', 'SE', 'DK', 'FI', 'IE', 'LU', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE', 'LV', 'LT', 'CY', 'MT') THEN
        -- B2B innergemeinschaftlich mit validierter USt-ID: 0% MwSt (Reverse Charge)
        CONTINUE;
      ELSE
        -- Artikel ist steuerpflichtig
        v_has_taxable_items := true;
        EXIT;
      END IF;
    END IF;
  END LOOP;
  
  -- Rückgabe: Länderspezifischer MwSt-Satz wenn MwSt-pflichtige Artikel, sonst 0%
  IF v_has_taxable_items THEN
    RETURN public.get_country_vat_rate(v_customer_country);
  ELSE
    RETURN 0.00;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.calculate_invoice_tax_rate IS 'Berechnet automatisch den korrekten MwSt-Satz basierend auf Kundenland, USt-ID und Produkten. Spanien = 21%, DE = 19%, etc. B2B EU mit validierter USt-ID = 0% (Reverse Charge)';