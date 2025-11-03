-- Erweitere invoice_items Tabelle für Produktdaten
-- Füge Produkt-Referenz und Spezifikationen hinzu

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='product_id') THEN
    ALTER TABLE public.invoice_items ADD COLUMN product_id VARCHAR(20);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='size') THEN
    ALTER TABLE public.invoice_items ADD COLUMN size VARCHAR(50);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='material') THEN
    ALTER TABLE public.invoice_items ADD COLUMN material VARCHAR(100);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='thickness') THEN
    ALTER TABLE public.invoice_items ADD COLUMN thickness VARCHAR(20);
  END IF;
END $$;

-- Index für bessere Performance bei Produkt-Abfragen
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON public.invoice_items(product_id);