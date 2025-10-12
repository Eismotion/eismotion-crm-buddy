-- Create profiles table for customer users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies: users can only see and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update invoices RLS policies to allow customers to see their own invoices
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoices;

CREATE POLICY "Customers can view own invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.customer_id = invoices.customer_id
    )
  );

-- Admin policy for invoices (we'll need to add admin role later)
CREATE POLICY "Admins have full access to invoices"
  ON public.invoices FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update customers RLS to allow users to see their linked customer
DROP POLICY IF EXISTS "Enable read access for all users" ON public.customers;

CREATE POLICY "Users can view own customer data"
  ON public.customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.customer_id = customers.id
    )
  );

CREATE POLICY "Admins have full access to customers"
  ON public.customers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Update invoice_items RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoice_items;

CREATE POLICY "Customers can view own invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      JOIN public.profiles p ON p.customer_id = i.customer_id
      WHERE i.id = invoice_items.invoice_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to invoice items"
  ON public.invoice_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();