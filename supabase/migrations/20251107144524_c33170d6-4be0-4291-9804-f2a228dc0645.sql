-- Enable RLS on backup table and create policy for admins
ALTER TABLE public.invoices_backup_20251107 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup" 
ON public.invoices_backup_20251107 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));