-- Entferne doppelte Rechnungen, behalte nur die älteste pro Rechnungsnummer
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY invoice_number ORDER BY created_at ASC) as rn
  FROM public.invoices
)
DELETE FROM public.invoices
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);