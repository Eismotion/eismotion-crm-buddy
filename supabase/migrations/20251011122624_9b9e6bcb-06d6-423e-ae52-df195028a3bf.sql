-- Fix Security Definer Views - Recreate without SECURITY DEFINER

DROP VIEW IF EXISTS template_performance;
CREATE VIEW template_performance AS
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
CREATE VIEW design_impact AS
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
CREATE VIEW popular_assets AS
SELECT 
  id, name, category, asset_type, usage_count, file_url 
FROM design_assets
WHERE is_public = true 
ORDER BY usage_count DESC 
LIMIT 20;