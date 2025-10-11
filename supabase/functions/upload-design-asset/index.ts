import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'Allgemein';
    const tagsString = formData.get('tags') as string;
    const name = formData.get('name') as string || file.name;
    
    if (!file) {
      throw new Error('Keine Datei hochgeladen');
    }
    
    const tags = tagsString ? JSON.parse(tagsString) : [];
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Uploading asset: ${file.name}, Category: ${category}`);
    
    // Generiere eindeutigen Dateinamen
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${category}/${fileName}`;
    
    // Upload zu Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('design-assets')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);
    }
    
    console.log('File uploaded successfully:', uploadData.path);
    
    // Hole die öffentliche URL
    const { data: urlData } = supabase.storage
      .from('design-assets')
      .getPublicUrl(uploadData.path);
    
    // Bestimme Asset-Typ basierend auf MIME-Type
    let assetType = 'image';
    if (file.type.startsWith('image/')) assetType = 'image';
    else if (file.type.includes('svg')) assetType = 'icon';
    
    // Speichere Asset-Metadaten in DB
    const { data: assetData, error: dbError } = await supabase
      .from('design_assets')
      .insert({
        name,
        asset_type: assetType,
        category,
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: file.size,
        mime_type: file.type,
        tags,
        is_public: true,
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      // Versuche, hochgeladene Datei zu löschen
      await supabase.storage.from('design-assets').remove([uploadData.path]);
      throw new Error(`Datenbankfehler: ${dbError.message}`);
    }
    
    console.log('Asset metadata saved successfully');
    
    return new Response(JSON.stringify(assetData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('Error uploading asset:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});