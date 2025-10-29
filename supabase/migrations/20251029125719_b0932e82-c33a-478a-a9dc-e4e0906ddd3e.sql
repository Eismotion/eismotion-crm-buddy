-- Fix: Allow multiple customers with NULL email
-- Drop the existing unique constraint on email
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_email_key;

-- Create a partial unique index that only applies when email is not NULL and not empty
CREATE UNIQUE INDEX customers_email_unique_idx ON public.customers (email) 
WHERE email IS NOT NULL AND email != '';