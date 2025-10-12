-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update existing RLS policies to use role-based access
DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;
CREATE POLICY "Admins have full access to customers"
ON public.customers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins have full access to invoices" ON public.invoices;
CREATE POLICY "Admins have full access to invoices"
ON public.invoices
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins have full access to invoice items" ON public.invoice_items;
CREATE POLICY "Admins have full access to invoice items"
ON public.invoice_items
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to create customer login (admin only)
CREATE OR REPLACE FUNCTION public.create_customer_login(
  customer_uuid UUID,
  customer_email TEXT,
  customer_password TEXT,
  customer_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can create customer logins';
  END IF;

  -- Create the auth user (this will trigger profile creation via existing trigger)
  -- Note: This is a placeholder - actual user creation must be done via Supabase Auth API
  -- This function will be called from edge function
  
  -- Update the customer record email if provided
  IF customer_email IS NOT NULL THEN
    UPDATE public.customers 
    SET email = customer_email 
    WHERE id = customer_uuid;
  END IF;

  RETURN json_build_object(
    'success', true,
    'customer_id', customer_uuid
  );
END;
$$;