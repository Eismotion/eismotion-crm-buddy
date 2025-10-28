-- Remove overly permissive policies for invoices that conflict with proper access control
DROP POLICY IF EXISTS "Enable delete for all users" ON invoices;
DROP POLICY IF EXISTS "Enable insert for all users" ON invoices;
DROP POLICY IF EXISTS "Enable update for all users" ON invoices;

-- Remove conflicting policies for customers
DROP POLICY IF EXISTS "Enable delete for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert for all users" ON customers;
DROP POLICY IF EXISTS "Enable update for all users" ON customers;

-- Remove conflicting policies for invoice_items
DROP POLICY IF EXISTS "Enable delete for all users" ON invoice_items;
DROP POLICY IF EXISTS "Enable insert for all users" ON invoice_items;
DROP POLICY IF EXISTS "Enable update for all users" ON invoice_items;

-- Create proper admin-only policies for invoices (already have "Admins have full access" but let's ensure it works)
-- The existing "Admins have full access to invoices" and "Customers can view own invoices" should now work correctly