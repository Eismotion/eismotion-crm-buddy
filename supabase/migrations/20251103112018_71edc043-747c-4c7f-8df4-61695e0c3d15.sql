-- Add contact_person field to customers table
ALTER TABLE public.customers 
ADD COLUMN contact_person character varying;