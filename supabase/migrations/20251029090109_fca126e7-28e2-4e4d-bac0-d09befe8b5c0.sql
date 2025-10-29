-- Passe Sprüche an: Eismotion ist eine Werbeagentur, kein Eiscafé

-- Ändere "cool wie unser Eis" Spruch
UPDATE public.custom_texts 
SET text_content = 'Danke für Ihren Auftrag - Ihre Zufriedenheit ist unser Erfolg! 🎨',
    tags = ARRAY['dank', 'werbung'],
    category = 'Dankbar'
WHERE id = 'd3e603a3-735d-4c55-adc2-4f3bf0b0476b';

-- Ändere "Eisvergnügen" Spruch
UPDATE public.custom_texts 
SET text_content = 'Sommer, Sonne, kreative Kampagnen! ☀️',
    tags = ARRAY['sommer', 'werbung']
WHERE id = 'c625ea77-d39e-4dff-a2ec-7db372f9fcef';

-- Füge neue passende Werbeagentur-Sprüche hinzu
INSERT INTO public.custom_texts (text_content, category, tags, season, is_public) VALUES
('Ihre Marke, unsere Leidenschaft - Danke für Ihr Vertrauen! 💼', 'Dankbar', ARRAY['dank', 'werbung', 'marke'], NULL, true),
('Kreativität trifft auf Qualität - wir freuen uns auf die nächste Zusammenarbeit! 🎯', 'Professionell', ARRAY['werbung', 'qualität'], NULL, true),
('Gemeinsam stark - Danke für die tolle Partnerschaft! 🤝', 'Dankbar', ARRAY['dank', 'partnerschaft'], NULL, true),
('Frohe Festtage und vielen Dank für die erfolgreiche Zusammenarbeit! 🎄', 'Saisonal', ARRAY['weihnachten', 'dank'], 'Winter', true),
('Wir wünschen Ihnen einen kreativen Start ins neue Jahr! 🎊', 'Saisonal', ARRAY['neujahr', 'werbung'], 'Winter', true),
('Ihre Vision, unser Design - Danke für die Zusammenarbeit! ✨', 'Professionell', ARRAY['design', 'werbung'], NULL, true),
('Erfolgreiche Kampagnen beginnen mit starken Partnerschaften - Danke! 📈', 'Professionell', ARRAY['kampagne', 'erfolg'], NULL, true),
('Frühling liegt in der Luft - Zeit für frische Ideen! 🌸', 'Saisonal', ARRAY['frühling', 'kreativ'], 'Frühling', true),
('Herbstliche Grüße und vielen Dank für Ihr Vertrauen! 🍂', 'Saisonal', ARRAY['herbst', 'dank'], 'Herbst', true)
ON CONFLICT DO NOTHING;