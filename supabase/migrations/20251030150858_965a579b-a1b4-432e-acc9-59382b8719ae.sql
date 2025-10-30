-- Delete all empty invoices (no invoice_number) that were created in 2025
DELETE FROM invoices
WHERE (invoice_number IS NULL OR invoice_number = '')
  AND EXTRACT(YEAR FROM invoice_date) = 2025
  AND total_amount = 0;