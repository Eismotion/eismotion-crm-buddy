-- ============================================
-- KUNDE-ZUORDNUNG REPARIEREN
-- ============================================
-- 
-- PROBLEM: Alle "Eiscafe Venezia" Rechnungen wurden dem ersten zugeordnet
-- LÖSUNG: Neu-Zuordnung basierend auf Name + PLZ
--
-- ⚠️ WICHTIG: Dieses Script MUSS als Administrator ausgeführt werden!
-- 
-- Anleitung:
-- 1. Öffne Lovable Cloud Backend (Settings → Cloud → View Backend)
-- 2. Gehe zu SQL Editor
-- 3. Kopiere dieses komplette Script
-- 4. Führe es aus
-- ============================================

-- SCHRITT 1: Erstelle temporäre Tabelle für Korrektur-Mapping
-- ============================================
CREATE TEMP TABLE IF NOT EXISTS invoice_customer_corrections AS
SELECT 
  i.id as invoice_id,
  i.customer_id as old_customer_id,
  c_correct.id as new_customer_id,
  i.invoice_number,
  c_old.name as old_customer_name,
  c_old.address as old_customer_address,
  c_correct.name as new_customer_name,
  c_correct.address as new_customer_address
FROM public.invoices i
-- Aktuell zugeordneter Kunde (oft falsch)
LEFT JOIN public.customers c_old ON i.customer_id = c_old.id
-- Korrekter Kunde (basierend auf temp Spalten die wir in der Migration erstellt haben)
LEFT JOIN public.customers c_correct ON 
  UPPER(c_correct.name) = UPPER(i.customer_name_temp)
  AND public.extract_plz(c_correct.address) = public.extract_plz(i.customer_address_temp)
WHERE i.customer_id IS NOT NULL
  AND c_correct.id IS NOT NULL
  AND i.customer_id != c_correct.id;  -- Nur falsch zugeordnete

-- Zeige Vorschau der Korrekturen
SELECT 
  invoice_number,
  old_customer_name,
  public.extract_plz(old_customer_address) as old_plz,
  new_customer_name,
  public.extract_plz(new_customer_address) as new_plz
FROM invoice_customer_corrections
LIMIT 20;

-- Statistik
SELECT 
  COUNT(*) as anzahl_korrekturen_noetig,
  COUNT(DISTINCT old_customer_id) as betroffene_alte_kunden,
  COUNT(DISTINCT new_customer_id) as neue_kunden
FROM invoice_customer_corrections;

-- ============================================
-- SCHRITT 2: Admin-Session setzen
-- ============================================
-- Dies ist notwendig, um den Schutz-Trigger zu umgehen
SET LOCAL app.user_role = 'admin';

-- ============================================
-- SCHRITT 3: Korrigiere customer_id
-- ============================================
UPDATE public.invoices i
SET customer_id = corr.new_customer_id
FROM invoice_customer_corrections corr
WHERE i.id = corr.invoice_id;

-- ============================================
-- SCHRITT 4: Lösche temp Spalten
-- ============================================
ALTER TABLE public.invoices DROP COLUMN IF EXISTS customer_name_temp;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS customer_address_temp;

-- ============================================
-- SCHRITT 5: Validierung
-- ============================================

-- Prüfe Rechnung 07/2025/956 (sollte jetzt zu Völklingen gehören)
SELECT 
  i.invoice_number,
  c.name,
  c.address,
  c.postal_code
FROM public.invoices i
JOIN public.customers c ON i.customer_id = c.id
WHERE i.invoice_number = '07/2025/956';

-- Zähle "Eiscafe Venezia" Kunden mit Rechnungen
SELECT 
  c.name,
  c.address,
  c.postal_code,
  COUNT(i.id) as anzahl_rechnungen,
  SUM(CAST(i.total_amount AS NUMERIC)) as gesamtumsatz
FROM public.customers c
LEFT JOIN public.invoices i ON c.id = i.customer_id
WHERE c.name ILIKE '%Venezia%'
GROUP BY c.id, c.name, c.address, c.postal_code
ORDER BY gesamtumsatz DESC;

-- Neue Top 5 Kunden (sollte jetzt stimmen!)
SELECT 
  c.name,
  c.address,
  COUNT(i.id) as rechnungen,
  SUM(CAST(i.total_amount AS NUMERIC)) as umsatz
FROM public.customers c
LEFT JOIN public.invoices i ON c.id = i.customer_id
WHERE i.status != 'storniert'
GROUP BY c.id, c.name, c.address
ORDER BY umsatz DESC
LIMIT 5;

-- ============================================
-- SCHRITT 6: Aktualisiere customer total_spent
-- ============================================
-- Berechne total_spent neu für alle betroffenen Kunden
UPDATE public.customers c
SET 
  total_spent = COALESCE((
    SELECT SUM(total_amount)
    FROM public.invoices i
    WHERE i.customer_id = c.id
      AND i.status = 'bezahlt'
  ), 0),
  total_orders = COALESCE((
    SELECT COUNT(*)
    FROM public.invoices i
    WHERE i.customer_id = c.id
  ), 0)
WHERE c.id IN (
  SELECT DISTINCT new_customer_id FROM invoice_customer_corrections
  UNION
  SELECT DISTINCT old_customer_id FROM invoice_customer_corrections
);

-- ✅ FERTIG!
-- Die Korrekturen wurden angewendet.
-- Überprüfe die Validierungs-Abfragen oben.
