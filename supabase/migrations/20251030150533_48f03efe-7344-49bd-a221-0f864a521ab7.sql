-- Fix 2022 invoices that have wrong year in invoice_date
-- Extract month from invoice_number and set correct 2022 date
UPDATE invoices
SET 
  invoice_date = CASE
    WHEN invoice_number ~ '^\d{2}/2022/' THEN
      ('2022-' || SUBSTRING(invoice_number FROM 1 FOR 2) || '-15')::date
    ELSE
      '2022-06-15'::date
  END,
  updated_at = NOW()
WHERE 
  invoice_number ILIKE '%/2022/%'
  AND EXTRACT(YEAR FROM invoice_date) != 2022;