-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.invoices;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.invoice_templates;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.design_assets;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.custom_texts;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.design_analytics;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.import_logs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.template_elements;

-- Create new public access policies for internal CRM use
CREATE POLICY "Enable read access for all users" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.customers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.invoices FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.invoice_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.invoice_items FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.products FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.invoice_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.invoice_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.invoice_templates FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.invoice_templates FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.design_assets FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.design_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.design_assets FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.design_assets FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.custom_texts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.custom_texts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.custom_texts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.custom_texts FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.design_analytics FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.design_analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.import_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.import_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.import_logs FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.template_elements FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.template_elements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.template_elements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.template_elements FOR DELETE USING (true);