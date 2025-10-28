/**
 * Supabase Storage Utilities for Template Images
 * Handles upload, download, and deletion of images in Supabase Storage
 */

import { supabase } from '@/integrations/supabase/client';

const STORAGE_BUCKET = 'invoice-templates';
const BACKGROUNDS_FOLDER = 'backgrounds';
const THUMBNAILS_FOLDER = 'thumbnails';

export interface UploadResult {
  backgroundUrl: string;
  thumbnailUrl: string;
  backgroundPath: string;
  thumbnailPath: string;
}

/**
 * Upload template background and thumbnail to Supabase Storage
 * @param backgroundBlob - Compressed background image
 * @param thumbnailBlob - Thumbnail image
 * @param templateName - Name of the template (used for file naming)
 * @returns Upload result with URLs and paths
 */
export async function uploadTemplateImages(
  backgroundBlob: Blob,
  thumbnailBlob: Blob,
  templateName: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const sanitizedName = templateName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  // Generate unique file names
  const backgroundFileName = `${sanitizedName}-${timestamp}.jpg`;
  const thumbnailFileName = `${sanitizedName}-${timestamp}-thumb.jpg`;
  
  const backgroundPath = `${BACKGROUNDS_FOLDER}/${backgroundFileName}`;
  const thumbnailPath = `${THUMBNAILS_FOLDER}/${thumbnailFileName}`;

  try {
    console.log(`📤 Uploading background: ${backgroundPath}`);
    
    // Upload background image
    const { data: backgroundData, error: backgroundError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(backgroundPath, backgroundBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (backgroundError) {
      throw new Error(`Background upload failed: ${backgroundError.message}`);
    }

    console.log(`✅ Background uploaded: ${backgroundPath}`);
    console.log(`📤 Uploading thumbnail: ${thumbnailPath}`);

    // Upload thumbnail
    const { data: thumbnailData, error: thumbnailError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(thumbnailPath, thumbnailBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });

    if (thumbnailError) {
      // Cleanup: delete background if thumbnail upload fails
      await supabase.storage.from(STORAGE_BUCKET).remove([backgroundPath]);
      throw new Error(`Thumbnail upload failed: ${thumbnailError.message}`);
    }

    console.log(`✅ Thumbnail uploaded: ${thumbnailPath}`);

    // Get public URLs
    const { data: backgroundUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(backgroundPath);

    const { data: thumbnailUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(thumbnailPath);

    return {
      backgroundUrl: backgroundUrlData.publicUrl,
      thumbnailUrl: thumbnailUrlData.publicUrl,
      backgroundPath,
      thumbnailPath
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

/**
 * Delete template images from Supabase Storage
 * @param backgroundPath - Path to background image
 * @param thumbnailPath - Path to thumbnail image
 */
export async function deleteTemplateImages(
  backgroundPath: string | null,
  thumbnailPath: string | null
): Promise<void> {
  const pathsToDelete: string[] = [];

  if (backgroundPath) pathsToDelete.push(backgroundPath);
  if (thumbnailPath) pathsToDelete.push(thumbnailPath);

  if (pathsToDelete.length === 0) {
    console.log('⚠️ No images to delete');
    return;
  }

  try {
    console.log(`🗑️ Deleting ${pathsToDelete.length} images from storage`);
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(pathsToDelete);

    if (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }

    console.log(`✅ Deleted ${pathsToDelete.length} images`);
  } catch (error) {
    console.error('❌ Failed to delete images:', error);
    // Don't throw - deletion failure shouldn't block other operations
  }
}

/**
 * Extract storage path from public URL
 * @param publicUrl - Public URL from Supabase Storage
 * @returns Storage path or null
 */
export function extractStoragePath(publicUrl: string | null): string | null {
  if (!publicUrl) return null;

  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(`/${STORAGE_BUCKET}/`);
    return pathParts.length > 1 ? pathParts[1] : null;
  } catch (error) {
    console.error('❌ Failed to extract storage path:', error);
    return null;
  }
}

/**
 * Check if Storage Bucket exists and is accessible
 * @returns true if bucket is accessible
 */
export async function checkStorageBucket(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
    
    if (error) {
      console.error(`❌ Storage bucket '${STORAGE_BUCKET}' not accessible:`, error);
      return false;
    }

    console.log(`✅ Storage bucket '${STORAGE_BUCKET}' is accessible`);
    return true;
  } catch (error) {
    console.error('❌ Error checking storage bucket:', error);
    return false;
  }
}

/**
 * Get signed URL for private storage (if needed in future)
 * @param path - Storage path
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * List all files in a folder
 * @param folder - Folder name (backgrounds or thumbnails)
 * @returns List of file paths
 */
export async function listFiles(folder: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder);

    if (error) {
      throw error;
    }

    return data.map(file => `${folder}/${file.name}`);
  } catch (error) {
    console.error(`❌ Failed to list files in ${folder}:`, error);
    return [];
  }
}
