
-- Remove unique constraint on customer names since there are multiple cafes with the same name
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_name_unique;
