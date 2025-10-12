-- Add parent_customer_id field to customers table to support "belongs to" relationships
ALTER TABLE customers 
ADD COLUMN parent_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

-- Create index for better performance when querying parent relationships
CREATE INDEX idx_customers_parent_customer_id ON customers(parent_customer_id);

-- Add comment to explain the column
COMMENT ON COLUMN customers.parent_customer_id IS 'References the parent customer if this customer belongs to another customer';