
-- Merge duplicate customers and consolidate their data

-- Step 1: For each duplicate customer name, keep the oldest entry (by created_at) and update all invoices to point to it
WITH duplicate_groups AS (
  SELECT DISTINCT ON (name)
    name,
    id as master_id,
    created_at
  FROM customers
  WHERE name IN (
    SELECT name FROM customers GROUP BY name HAVING COUNT(*) > 1
  )
  ORDER BY name, created_at ASC
),
all_duplicates AS (
  SELECT 
    c.id as duplicate_id,
    dg.master_id
  FROM customers c
  INNER JOIN duplicate_groups dg ON c.name = dg.name
  WHERE c.id != dg.master_id
)
UPDATE invoices
SET customer_id = ad.master_id
FROM all_duplicates ad
WHERE invoices.customer_id = ad.duplicate_id;

-- Step 2: Delete all duplicate customer entries
WITH duplicate_groups AS (
  SELECT DISTINCT ON (name)
    name,
    id as master_id,
    created_at
  FROM customers
  WHERE name IN (
    SELECT name FROM customers GROUP BY name HAVING COUNT(*) > 1
  )
  ORDER BY name, created_at ASC
),
all_duplicates AS (
  SELECT 
    c.id as duplicate_id
  FROM customers c
  INNER JOIN duplicate_groups dg ON c.name = dg.name
  WHERE c.id != dg.master_id
)
DELETE FROM customers
WHERE id IN (SELECT duplicate_id FROM all_duplicates);

-- Step 3: Recalculate total_orders and total_spent for all customers
WITH customer_stats AS (
  SELECT 
    customer_id,
    COUNT(*) as order_count,
    COALESCE(SUM(total_amount), 0) as total_revenue
  FROM invoices
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
)
UPDATE customers
SET 
  total_orders = COALESCE(cs.order_count, 0),
  total_spent = COALESCE(cs.total_revenue, 0)
FROM customer_stats cs
WHERE customers.id = cs.customer_id;

-- Step 4: Add a unique constraint to prevent future duplicates
ALTER TABLE customers 
ADD CONSTRAINT customers_name_unique UNIQUE (name);
