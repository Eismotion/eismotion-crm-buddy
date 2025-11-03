-- Erweitere products Tabelle für vollständige Produktverwaltung
-- Prüfe ob Spalten bereits existieren und füge neue hinzu

-- Füge product_id Spalte hinzu (für ES-1001, EK-1008, etc.)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='product_id') THEN
    ALTER TABLE public.products ADD COLUMN product_id VARCHAR(20);
  END IF;
END $$;

-- Füge size Spalte hinzu
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='size') THEN
    ALTER TABLE public.products ADD COLUMN size VARCHAR(50);
  END IF;
END $$;

-- Füge material Spalte hinzu
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='material') THEN
    ALTER TABLE public.products ADD COLUMN material VARCHAR(100);
  END IF;
END $$;

-- Füge thickness Spalte hinzu
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='thickness') THEN
    ALTER TABLE public.products ADD COLUMN thickness VARCHAR(20);
  END IF;
END $$;

-- Füge quantity Spalte hinzu
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='quantity') THEN
    ALTER TABLE public.products ADD COLUMN quantity VARCHAR(50);
  END IF;
END $$;

-- Füge image_url Spalte hinzu
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='image_url') THEN
    ALTER TABLE public.products ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Füge supplier Spalte hinzu
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='supplier') THEN
    ALTER TABLE public.products ADD COLUMN supplier VARCHAR(200);
  END IF;
END $$;

-- Füge supplier_product_id Spalte hinzu
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='supplier_product_id') THEN
    ALTER TABLE public.products ADD COLUMN supplier_product_id VARCHAR(100);
  END IF;
END $$;

-- Füge supplier_price Spalte hinzu
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='supplier_price') THEN
    ALTER TABLE public.products ADD COLUMN supplier_price DECIMAL(10,2);
  END IF;
END $$;

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_products_product_id ON public.products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier);

-- Erstelle unique constraint für product_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_product_id_key'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_product_id_key UNIQUE (product_id);
  END IF;
END $$;

-- Storage Bucket für Produktbilder erstellen
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies für Produktbilder
-- Lösche alte Policies falls vorhanden und erstelle neue
DROP POLICY IF EXISTS "Public read access for product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Jeder kann Produktbilder lesen
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Admins können Produktbilder hochladen
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins können Produktbilder löschen
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);