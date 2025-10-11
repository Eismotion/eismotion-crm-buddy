-- Ändere season Spalte zu nullable
ALTER TABLE invoice_templates ALTER COLUMN season DROP NOT NULL;

-- Erweitere invoice_templates
ALTER TABLE invoice_templates 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Themen',
ADD COLUMN IF NOT EXISTS theme VARCHAR(100),
ADD COLUMN IF NOT EXISTS occasion VARCHAR(100),
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS fonts JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Neue Tabellen
CREATE TABLE IF NOT EXISTS template_elements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES invoice_templates(id) ON DELETE CASCADE,
  element_type VARCHAR(50) NOT NULL,
  content TEXT,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 100,
  height INTEGER DEFAULT 50,
  z_index INTEGER DEFAULT 1,
  styles JSONB DEFAULT '{}',
  is_editable BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE template_elements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON template_elements FOR ALL TO authenticated USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS design_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  tags TEXT[],
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE design_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON design_assets FOR ALL TO authenticated USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS custom_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text_content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  season VARCHAR(50),
  occasion VARCHAR(100),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE custom_texts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON custom_texts FOR ALL TO authenticated USING (auth.role() = 'authenticated');

-- Erweitere invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS custom_design JSONB,
ADD COLUMN IF NOT EXISTS custom_message TEXT,
ADD COLUMN IF NOT EXISTS customer_feedback_rating INTEGER,
ADD COLUMN IF NOT EXISTS customer_feedback_text TEXT,
ADD COLUMN IF NOT EXISTS generated_leads INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS design_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES invoice_templates(id),
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID REFERENCES customers(id),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE design_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON design_analytics FOR ALL TO authenticated USING (auth.role() = 'authenticated');

-- Trigger
CREATE OR REPLACE FUNCTION track_template_usage() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.template_id IS NOT NULL THEN
        UPDATE invoice_templates SET usage_count = usage_count + 1 WHERE id = NEW.template_id;
        INSERT INTO design_analytics (template_id, invoice_id, customer_id, event_type)
        VALUES (NEW.template_id, NEW.id, NEW.customer_id, 'template_used');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS track_template_usage_trigger ON invoices;
CREATE TRIGGER track_template_usage_trigger AFTER INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION track_template_usage();

CREATE OR REPLACE FUNCTION track_text_usage() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.custom_message IS NOT NULL AND NEW.custom_message != '' THEN
        UPDATE custom_texts SET usage_count = usage_count + 1 WHERE text_content = NEW.custom_message;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS track_text_usage_trigger ON invoices;
CREATE TRIGGER track_text_usage_trigger AFTER INSERT OR UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION track_text_usage();

-- Views
CREATE OR REPLACE VIEW template_performance AS
SELECT t.id, t.name, t.category, t.theme, t.season, t.usage_count,
  COALESCE(AVG(i.customer_feedback_rating), 0) as avg_rating,
  COALESCE(SUM(i.generated_leads), 0) as total_leads, COUNT(i.id) as total_invoices
FROM invoice_templates t LEFT JOIN invoices i ON t.id = i.template_id
GROUP BY t.id, t.name, t.category, t.theme, t.season, t.usage_count ORDER BY t.usage_count DESC;

CREATE OR REPLACE VIEW design_impact AS
SELECT DATE_TRUNC('month', i.created_at) as month, COUNT(*) as total_invoices,
  COALESCE(AVG(i.customer_feedback_rating), 0) as avg_design_rating,
  COALESCE(SUM(i.generated_leads), 0) as total_leads_generated,
  COUNT(DISTINCT i.customer_id) as unique_customers
FROM invoices i WHERE i.template_id IS NOT NULL
GROUP BY DATE_TRUNC('month', i.created_at) ORDER BY month DESC;

CREATE OR REPLACE VIEW popular_assets AS
SELECT id, name, category, asset_type, usage_count, file_url FROM design_assets
WHERE is_public = true ORDER BY usage_count DESC LIMIT 20;

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('design-assets', 'design-assets', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public select" ON storage.objects FOR SELECT USING (bucket_id = 'design-assets');
CREATE POLICY "Auth insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'design-assets');
CREATE POLICY "Auth update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'design-assets');
CREATE POLICY "Auth delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'design-assets');

-- Seed
INSERT INTO invoice_templates (name, category, season, theme, colors, fonts, html_template, css_styles, thumbnail_url, is_default, is_public) VALUES
('Winter Wonderland', 'Saisonal', 'Winter', 'Elegant', '{"primary":"#1565c0","secondary":"#e3f2fd","accent":"#0d47a1"}'::jsonb, '{"heading":"Georgia","body":"Arial"}'::jsonb, '<!DOCTYPE html><html><body class="winter"><div class="header"><h1>❄️ {{company_name}}</h1></div></body></html>', 'body.winter{background:linear-gradient(135deg,#e3f2fd,#bbdefb);color:#1565c0}', '/templates/winter.jpg', true, true),
('Sommer Vibes', 'Saisonal', 'Sommer', 'Verspielt', '{"primary":"#ff8f00","secondary":"#fff3e0","accent":"#ef6c00"}'::jsonb, '{"heading":"Comic Sans MS","body":"Verdana"}'::jsonb, '<!DOCTYPE html><html><body class="sommer"><div class="header"><h1>☀️ {{company_name}}</h1></div></body></html>', 'body.sommer{background:linear-gradient(135deg,#fff3e0,#ffe0b2);color:#ef6c00}', '/templates/sommer.jpg', true, true),
('Business Elegant', 'Themen', NULL, 'Business', '{"primary":"#37474f","secondary":"#eceff1"}'::jsonb, '{"heading":"Times New Roman","body":"Arial"}'::jsonb, '<!DOCTYPE html><html><body><div class="header"><h1>{{company_name}}</h1></div></body></html>', 'body{background:#ffffff;color:#37474f}', '/templates/business.jpg', false, true),
('Retro Diner', 'Themen', NULL, 'Retro', '{"primary":"#d32f2f","secondary":"#ffebee"}'::jsonb, '{"heading":"Rockwell","body":"Georgia"}'::jsonb, '<!DOCTYPE html><html><body class="retro"><div class="header"><h1>🍦 {{company_name}}</h1></div></body></html>', 'body.retro{background:repeating-linear-gradient(45deg,#ffebee,#ffebee 10px,#fff 10px,#fff 20px);color:#d32f2f}', '/templates/retro.jpg', false, true)
ON CONFLICT DO NOTHING;

INSERT INTO custom_texts (text_content, category, tags, season, is_public) VALUES
('Danke für Ihren Einkauf - Sie sind so cool wie unser Eis! 🍦', 'Lustig', ARRAY['eis','cool'], NULL, true),
('Lassen Sie sich den Winter versüßen! ❄️', 'Saisonal', ARRAY['winter','süß'], 'Winter', true),
('Sommer, Sonne, Eisvergnügen! ☀️', 'Saisonal', ARRAY['sommer','eis'], 'Sommer', true),
('Herzlichen Dank für Ihr Vertrauen! ❤️', 'Dankbar', ARRAY['dank','herz'], NULL, true)
ON CONFLICT DO NOTHING;

INSERT INTO design_assets (name, asset_type, category, file_url, tags, is_public, width, height) VALUES
('Schneeflocke', 'icon', 'Jahreszeiten', '/assets/icons/snowflake.svg', ARRAY['winter'], true, 64, 64),
('Sonne', 'icon', 'Jahreszeiten', '/assets/icons/sun.svg', ARRAY['sommer'], true, 64, 64),
('Eiswaffel', 'icon', 'Eis', '/assets/icons/ice-cream.svg', ARRAY['eis'], true, 64, 64),
('Herz', 'icon', 'Emoticons', '/assets/icons/heart.svg', ARRAY['liebe'], true, 32, 32)
ON CONFLICT DO NOTHING;