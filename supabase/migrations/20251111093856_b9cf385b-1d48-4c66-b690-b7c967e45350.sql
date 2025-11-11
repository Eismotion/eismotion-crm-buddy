-- Sichere design_assets Tabelle
DROP POLICY IF EXISTS "Enable delete for all users" ON public.design_assets;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.design_assets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.design_assets;
DROP POLICY IF EXISTS "Enable update for all users" ON public.design_assets;

CREATE POLICY "Admins have full access to design assets"
ON public.design_assets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sichere custom_texts Tabelle
DROP POLICY IF EXISTS "Enable delete for all users" ON public.custom_texts;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.custom_texts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.custom_texts;
DROP POLICY IF EXISTS "Enable update for all users" ON public.custom_texts;

CREATE POLICY "Admins have full access to custom texts"
ON public.custom_texts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sichere invoice_templates Tabelle
DROP POLICY IF EXISTS "Enable delete for all users" ON public.invoice_templates;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.invoice_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoice_templates;
DROP POLICY IF EXISTS "Enable update for all users" ON public.invoice_templates;

CREATE POLICY "Admins have full access to invoice templates"
ON public.invoice_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sichere invoice_fields Tabelle
DROP POLICY IF EXISTS "Enable delete for all users" ON public.invoice_fields;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.invoice_fields;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.invoice_fields;
DROP POLICY IF EXISTS "Enable update for all users" ON public.invoice_fields;

CREATE POLICY "Admins have full access to invoice fields"
ON public.invoice_fields
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sichere design_analytics Tabelle
DROP POLICY IF EXISTS "Enable insert for all users" ON public.design_analytics;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.design_analytics;

CREATE POLICY "Admins have full access to design analytics"
ON public.design_analytics
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sichere import_logs Tabelle
DROP POLICY IF EXISTS "Enable insert for all users" ON public.import_logs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.import_logs;
DROP POLICY IF EXISTS "Enable update for all users" ON public.import_logs;

CREATE POLICY "Admins have full access to import logs"
ON public.import_logs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));