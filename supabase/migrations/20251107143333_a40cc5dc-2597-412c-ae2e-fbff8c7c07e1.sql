-- Create or replace view for top customers grouped by name + postal code (fallback: address)
CREATE OR REPLACE VIEW public.top_customers AS
SELECT 
  c.name AS name,
  COALESCE(c.address, '') AS address,
  -- derive postal code from customers.postal_code or extract from address
  COALESCE(NULLIF(c.postal_code, ''), (regexp_match(COALESCE(c.address, ''), '\\d{5}'))[1]) AS postal_code,
  COUNT(i.id)::bigint AS orders,
  SUM(COALESCE(i.total_amount, 0))::numeric AS revenue,
  ROUND(AVG(COALESCE(i.total_amount, 0))::numeric, 2) AS average,
  MAX(i.invoice_date) AS last_order
FROM public.invoices i
LEFT JOIN public.customers c ON c.id = i.customer_id
WHERE i.status IS DISTINCT FROM 'storniert'
  AND i.status IS DISTINCT FROM 'cancelled'
GROUP BY 
  c.name,
  COALESCE(NULLIF(c.postal_code, ''), (regexp_match(COALESCE(c.address, ''), '\\d{5}'))[1]),
  COALESCE(c.address, '')
ORDER BY revenue DESC;