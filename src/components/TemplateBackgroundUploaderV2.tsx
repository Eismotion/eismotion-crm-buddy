import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTemplates } from "@/contexts/TemplateContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { 
  compressImage, 
  createThumbnail, 
  validateImageFile, 
  getOptimalCompressionSettings 
} from "@/lib/imageUtils";
import { 
  uploadTemplateImages, 
  deleteTemplateImages, 
  extractStoragePath,
  checkStorageBucket 
} from "@/lib/storageUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TemplateBackgroundUploaderV2Props {
  templateName: string;
  onUploadComplete?: () => void;
  useStorage?: boolean; // Toggle between Storage and Base64
}

export default function TemplateBackgroundUploaderV2({ 
  templateName, 
  onUploadComplete,
  useStorage = true // Default to Storage for better performance
}: TemplateBackgroundUploaderV2Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const { refreshTemplates, selectedTemplate } = useTemplates();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress('Datei wird validiert...');

    try {
      console.log(`📤 Starting upload for template: ${templateName}`);
      console.log(`📊 Original file size: ${(file.size / 1024).toFixed(2)} KB`);

      // Check if using Storage
      if (useStorage) {
        const bucketAccessible = await checkStorageBucket();
        if (!bucketAccessible) {
          toast.error('Storage-Bucket nicht verfügbar. Bitte kontaktieren Sie den Administrator.');
          console.error('❌ Storage bucket not accessible. Falling back to Base64.');
          // Fall back to Base64 method
          await uploadWithBase64(file);
          return;
        }
      }

      if (useStorage) {
        await uploadWithStorage(file);
      } else {
        await uploadWithBase64(file);
      }

      toast.success('Hintergrundbild erfolgreich gespeichert!');
      
      // Refresh templates in context
      await refreshTemplates();
      console.log(`✅ Templates refreshed`);
      
      onUploadComplete?.();
    } catch (error) {
      console.error("❌ Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Hochladen: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadProgress('');
      event.target.value = "";
    }
  };

  const uploadWithStorage = async (file: File) => {
    setUploadProgress('Bild wird komprimiert...');

    // Load image to get dimensions
    const img = await loadImage(file);
    const compressionSettings = getOptimalCompressionSettings(img.width, img.height);
    
    console.log(`📐 Image dimensions: ${img.width}x${img.height}`);
    console.log(`⚙️ Compression settings:`, compressionSettings);

    // Compress background image
    const compressedBackground = await compressImage(file, compressionSettings);
    
    setUploadProgress('Thumbnail wird erstellt...');
    
    // Create thumbnail
    const thumbnailBlob = await createThumbnail(file, 300);

    setUploadProgress('Bilder werden hochgeladen...');

    // Delete old images if they exist
    if (selectedTemplate?.background_url) {
      const oldBackgroundPath = extractStoragePath(selectedTemplate.background_url);
      const oldThumbnailPath = extractStoragePath(selectedTemplate.thumbnail_url);
      await deleteTemplateImages(oldBackgroundPath, oldThumbnailPath);
    }

    // Upload to Supabase Storage
    const uploadResult = await uploadTemplateImages(
      compressedBackground,
      thumbnailBlob,
      templateName
    );

    setUploadProgress('Datenbank wird aktualisiert...');

    // Update database with Storage URLs
    const timestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("invoice_templates")
      .update({ 
        background_url: uploadResult.backgroundUrl,
        thumbnail_url: uploadResult.thumbnailUrl,
        background_base64: null, // Clear old Base64 data
        thumbnail_base64: null,
        updated_at: timestamp
      })
      .eq("name", templateName);

    if (updateError) {
      // Cleanup: delete uploaded images if database update fails
      await deleteTemplateImages(uploadResult.backgroundPath, uploadResult.thumbnailPath);
      throw updateError;
    }

    console.log(`✅ Template saved with Storage URLs`);
  };

  const uploadWithBase64 = async (file: File) => {
    setUploadProgress('Bild wird komprimiert...');

    // Load image to get dimensions
    const img = await loadImage(file);
    const compressionSettings = getOptimalCompressionSettings(img.width, img.height);

    // Compress background image
    const compressedBackground = await compressImage(file, compressionSettings);
    
    setUploadProgress('Base64 wird generiert...');
    
    // Convert to Base64
    const base64 = await blobToBase64(compressedBackground);
    
    setUploadProgress('Thumbnail wird erstellt...');
    
    // Create thumbnail
    const thumbnailBlob = await createThumbnail(file, 300);
    const thumbnailBase64 = await blobToBase64(thumbnailBlob);

    setUploadProgress('Datenbank wird aktualisiert...');

    // Save to database
    const timestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("invoice_templates")
      .update({ 
        background_base64: base64,
        thumbnail_base64: thumbnailBase64,
        background_url: null, // Clear Storage URLs
        thumbnail_url: null,
        updated_at: timestamp
      })
      .eq("name", templateName);

    if (updateError) throw updateError;

    console.log(`✅ Template saved with Base64 (size: ${(base64.length / 1024).toFixed(2)} KB)`);
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      <div>
        <Label htmlFor="bg-upload" className="text-sm font-medium">
          Hintergrundbild hochladen {useStorage ? '(Supabase Storage)' : '(Base64)'}
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG oder WebP, max. 5 MB
        </p>
      </div>

      {useStorage && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Optimiert:</strong> Bilder werden automatisch komprimiert und in Supabase Storage gespeichert für bessere Performance.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex gap-2">
        <Input
          id="bg-upload"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileUpload}
          disabled={uploading}
          className="flex-1"
        />
        <Button disabled={uploading} size="icon" variant="secondary">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {uploading && uploadProgress && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{uploadProgress}</span>
        </div>
      )}
    </div>
  );
}
