-- Fix alle views mit SECURITY INVOKER

DROP VIEW IF EXISTS template_performance;
CREATE VIEW template_performance WITH (security_invoker=on) AS
SELECT 
  t.id, t.name, t.category, t.theme, t.season, t.usage_count,
  COALESCE(AVG(i.customer_feedback_rating), 0) as avg_rating,
  COALESCE(SUM(i.generated_leads), 0) as total_leads, 
  COUNT(i.id) as total_invoices
FROM invoice_templates t 
LEFT JOIN invoices i ON t.id = i.template_id
GROUP BY t.id, t.name, t.category, t.theme, t.season, t.usage_count 
ORDER BY t.usage_count DESC;

DROP VIEW IF EXISTS design_impact;
CREATE VIEW design_impact WITH (security_invoker=on) AS
SELECT 
  DATE_TRUNC('month', i.created_at) as month, 
  COUNT(*) as total_invoices,
  COALESCE(AVG(i.customer_feedback_rating), 0) as avg_design_rating,
  COALESCE(SUM(i.generated_leads), 0) as total_leads_generated,
  COUNT(DISTINCT i.customer_id) as unique_customers
FROM invoices i 
WHERE i.template_id IS NOT NULL
GROUP BY DATE_TRUNC('month', i.created_at) 
ORDER BY month DESC;

DROP VIEW IF EXISTS popular_assets;
CREATE VIEW popular_assets WITH (security_invoker=on) AS
SELECT 
  id, name, category, asset_type, usage_count, file_url 
FROM design_assets
WHERE is_public = true 
ORDER BY usage_count DESC 
LIMIT 20;

-- Fix die alten views auch
DROP VIEW IF EXISTS dashboard_stats;
CREATE VIEW dashboard_stats WITH (security_invoker=on) AS
SELECT
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM invoices) as total_invoices,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'bezahlt') as total_revenue,
  (SELECT COUNT(*) FROM invoices WHERE status = 'überfällig') as overdue_invoices,
  (SELECT COALESCE(AVG(total_amount), 0) FROM invoices WHERE status = 'bezahlt') as avg_invoice_value;

DROP VIEW IF EXISTS monthly_revenue;
CREATE VIEW monthly_revenue WITH (security_invoker=on) AS
SELECT
  DATE_TRUNC('month', invoice_date) as month,
  SUM(total_amount) as revenue,
  COUNT(*) as invoice_count
FROM invoices
WHERE status = 'bezahlt'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month DESC;

DROP VIEW IF EXISTS top_products;
CREATE VIEW top_products WITH (security_invoker=on) AS
SELECT
  p.id,
  p.name,
  p.category,
  p.season,
  SUM(ii.quantity) as total_sold,
  SUM(ii.total_price) as total_revenue
FROM products p
INNER JOIN invoice_items ii ON p.id = ii.product_id
INNER JOIN invoices i ON ii.invoice_id = i.id
WHERE i.status = 'bezahlt'
GROUP BY p.id, p.name, p.category, p.season
ORDER BY total_revenue DESC
LIMIT 10;