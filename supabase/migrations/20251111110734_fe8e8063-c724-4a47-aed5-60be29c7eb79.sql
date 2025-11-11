-- Erlaube authentifizierten Benutzern das Anzeigen von Templates
-- Admins behalten weiterhin volle Kontrolle über INSERT, UPDATE, DELETE

-- Entferne die alte "FOR ALL" Policy für Admins
DROP POLICY IF EXISTS "Admins have full access to invoice templates" ON public.invoice_templates;

-- Erstelle getrennte Policies: SELECT für alle, Rest nur für Admins
CREATE POLICY "Authenticated users can view invoice templates"
ON public.invoice_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert invoice templates"
ON public.invoice_templates
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invoice templates"
ON public.invoice_templates
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invoice templates"
ON public.invoice_templates
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));