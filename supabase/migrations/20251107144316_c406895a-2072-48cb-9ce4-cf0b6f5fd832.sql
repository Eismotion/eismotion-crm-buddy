-- Backup table for invoices before customer reassignment
CREATE TABLE IF NOT EXISTS public.invoices_backup_20251107 (LIKE public.invoices INCLUDING ALL);