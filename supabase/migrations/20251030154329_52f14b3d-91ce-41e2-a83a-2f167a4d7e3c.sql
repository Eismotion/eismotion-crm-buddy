-- Add UNIQUE constraint to invoice_number to prevent duplicates
ALTER TABLE invoices 
ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);