-- SQL-Funktion für Jahres-Counts
CREATE OR REPLACE FUNCTION get_invoice_counts_by_year()
RETURNS TABLE(jahr integer, anzahl bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(YEAR FROM invoice_date)::integer as jahr,
    COUNT(*)::bigint as anzahl
  FROM invoices
  WHERE invoice_date IS NOT NULL
  GROUP BY EXTRACT(YEAR FROM invoice_date)
  ORDER BY jahr;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;