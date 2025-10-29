-- Erweitere products Tabelle für MwSt-Verwaltung
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_tax_exempt BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS production_country VARCHAR(2) DEFAULT 'DE',
ADD COLUMN IF NOT EXISTS sku VARCHAR(50);

COMMENT ON COLUMN public.products.is_tax_exempt IS 'Versand und Design sind immer MwSt-frei';
COMMENT ON COLUMN public.products.production_country IS 'Land wo das Produkt produziert wird (ISO 3166-1 alpha-2)';

-- Erweitere customers Tabelle für internationale Kunden
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'DE',
ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.customers.country IS 'Land des Kunden (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN public.customers.vat_number IS 'EU Umsatzsteuernummer für B2B innergemeinschaftliche Lieferungen';
COMMENT ON COLUMN public.customers.is_business IS 'B2B Kunde mit gültiger USt-Nr';

-- Update bestehende "Versand" und "Design" Produkte als MwSt-frei
UPDATE public.products 
SET is_tax_exempt = true 
WHERE category IN ('Versand', 'Design') OR name ILIKE '%versand%' OR name ILIKE '%design%';

-- Funktion zur Berechnung der korrekten MwSt für eine Rechnung
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
  v_has_taxable_items BOOLEAN := false;
  v_item JSONB;
  v_product RECORD;
BEGIN
  -- Hole Kundendaten
  SELECT country, vat_number, is_business 
  INTO v_customer_country, v_customer_vat_number, v_customer_is_business
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
    -- - Kunde in DE ODER Kunde hat keine gültige EU-USt-Nr
    IF v_product.is_tax_exempt = false THEN
      IF v_product.production_country = 'DE' THEN
        IF v_customer_country = 'DE' THEN
          v_has_taxable_items := true;
          EXIT; -- Mindestens ein MwSt-pflichtiger Artikel gefunden
        ELSIF NOT (v_customer_is_business AND v_customer_vat_number IS NOT NULL AND v_customer_country IN ('AT', 'FR', 'IT', 'NL', 'BE', 'PL', 'ES', 'PT', 'SE', 'DK', 'FI', 'IE', 'LU', 'GR', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE', 'LV', 'LT', 'CY', 'MT')) THEN
          -- Kunde außerhalb DE ohne gültige EU-USt-Nr
          v_has_taxable_items := true;
          EXIT;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  -- Rückgabe: 19% wenn MwSt-pflichtige Artikel, sonst 0%
  IF v_has_taxable_items THEN
    RETURN 19.00;
  ELSE
    RETURN 0.00;
  END IF;
END;
$$;