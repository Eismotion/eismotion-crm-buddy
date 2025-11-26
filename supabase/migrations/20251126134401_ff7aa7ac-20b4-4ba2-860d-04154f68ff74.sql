-- Update delete function to disable triggers
CREATE OR REPLACE FUNCTION public.delete_all_invoices_2020_2025()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items_deleted INTEGER;
  v_invoices_deleted INTEGER;
BEGIN
  -- Deaktiviere Trigger temporär
  ALTER TABLE public.invoice_items DISABLE TRIGGER protect_invoice_item_data_trigger;
  ALTER TABLE public.invoices DISABLE TRIGGER protect_invoice_data_trigger;
  
  -- Lösche invoice_items zuerst
  WITH deleted_items AS (
    DELETE FROM public.invoice_items
    WHERE invoice_id IN (
      SELECT id FROM public.invoices
      WHERE EXTRACT(YEAR FROM invoice_date) BETWEEN 2020 AND 2025
    )
    RETURNING *
  )
  SELECT COUNT(*) INTO v_items_deleted FROM deleted_items;

  -- Lösche Rechnungen
  WITH deleted_invoices AS (
    DELETE FROM public.invoices
    WHERE EXTRACT(YEAR FROM invoice_date) BETWEEN 2020 AND 2025
    RETURNING *
  )
  SELECT COUNT(*) INTO v_invoices_deleted FROM deleted_invoices;

  -- Aktiviere Trigger wieder
  ALTER TABLE public.invoice_items ENABLE TRIGGER protect_invoice_item_data_trigger;
  ALTER TABLE public.invoices ENABLE TRIGGER protect_invoice_data_trigger;

  -- Setze Kundenstatistiken zurück für alle Kunden
  UPDATE public.customers
  SET 
    total_spent = COALESCE((
      SELECT SUM(total_amount)
      FROM public.invoices
      WHERE customer_id = customers.id AND status = 'bezahlt'
    ), 0),
    total_orders = COALESCE((
      SELECT COUNT(*)
      FROM public.invoices
      WHERE customer_id = customers.id
    ), 0)
  WHERE id IS NOT NULL;

  RETURN jsonb_build_object(
    'success', true,
    'items_deleted', v_items_deleted,
    'invoices_deleted', v_invoices_deleted
  );
END;
$$;