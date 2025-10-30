-- Update all draft invoices from 2022 to "bezahlt" status
UPDATE invoices
SET 
  status = 'bezahlt',
  updated_at = NOW()
WHERE 
  status = 'draft' 
  AND invoice_number LIKE '%/2022/%';