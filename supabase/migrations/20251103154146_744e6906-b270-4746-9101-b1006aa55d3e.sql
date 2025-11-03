-- Erlaube NULL-Werte für price, da viele Produkte noch keinen Preis haben
ALTER TABLE public.products ALTER COLUMN price DROP NOT NULL;