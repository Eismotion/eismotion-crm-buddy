-- Add position and is_tax_exempt columns to invoice_items
ALTER TABLE invoice_items 
ADD COLUMN position INTEGER DEFAULT 0,
ADD COLUMN is_tax_exempt BOOLEAN DEFAULT false;

-- Create index for better sorting performance
CREATE INDEX idx_invoice_items_position ON invoice_items(invoice_id, position);

-- Update existing rows to have sequential positions
WITH numbered_items AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY invoice_id ORDER BY created_at) as row_num
  FROM invoice_items
)
UPDATE invoice_items 
SET position = numbered_items.row_num
FROM numbered_items
WHERE invoice_items.id = numbered_items.id;