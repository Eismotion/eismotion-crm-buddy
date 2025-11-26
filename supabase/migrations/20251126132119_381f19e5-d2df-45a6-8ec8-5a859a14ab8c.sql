-- Erstelle Funktion zum Löschen aller Rechnungen 2020-2025
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

  -- Setze Kundenstatistiken zurück
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
    ), 0);

  RETURN jsonb_build_object(
    'success', true,
    'items_deleted', v_items_deleted,
    'invoices_deleted', v_invoices_deleted
  );
END;
$$;