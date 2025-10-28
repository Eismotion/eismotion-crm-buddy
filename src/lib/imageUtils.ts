/**
 * Image Utilities for Template Background Processing
 * Provides compression, resizing, and format conversion
 */

export interface ImageCompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Compress and resize an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image as Blob
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > options.maxWidth) {
          width = options.maxWidth;
          height = width / aspectRatio;
        }

        if (height > options.maxHeight) {
          height = options.maxHeight;
          width = height * aspectRatio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`✅ Image compressed: ${(file.size / 1024).toFixed(2)} KB → ${(blob.size / 1024).toFixed(2)} KB`);
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          options.format ? `image/${options.format}` : file.type,
          options.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create a thumbnail from an image file
 * @param file - The image file
 * @param maxWidth - Maximum width of thumbnail (default: 300px)
 * @returns Thumbnail as Blob
 */
export async function createThumbnail(
  file: File,
  maxWidth: number = 300
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate thumbnail dimensions (maintain A4 aspect ratio)
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        // Draw thumbnail
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to JPEG for better compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`✅ Thumbnail created: ${(blob.size / 1024).toFixed(2)} KB`);
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail'));
            }
          },
          'image/jpeg',
          0.85
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image file
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Datei ist kein Bild. Bitte nur PNG, JPG oder WebP hochladen.'
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum: ${maxSizeMB} MB.`
    };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Ungültiges Bildformat. Nur PNG, JPG und WebP sind erlaubt.'
    };
  }

  return { valid: true };
}

/**
 * Convert File to Base64 (for backward compatibility)
 * @param file - The file to convert
 * @returns Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get optimal compression settings based on image dimensions
 * @param width - Image width
 * @param height - Image height
 * @returns Optimal compression options
 */
export function getOptimalCompressionSettings(
  width: number,
  height: number
): ImageCompressionOptions {
  // A4 at 300 DPI: 2480 x 3508 pixels
  const A4_WIDTH_300DPI = 2480;
  const A4_HEIGHT_300DPI = 3508;

  // If image is already smaller than A4@300DPI, use lower quality
  if (width <= A4_WIDTH_300DPI && height <= A4_HEIGHT_300DPI) {
    return {
      maxWidth: width,
      maxHeight: height,
      quality: 0.92,
      format: 'jpeg'
    };
  }

  // For larger images, resize to A4@300DPI
  return {
    maxWidth: A4_WIDTH_300DPI,
    maxHeight: A4_HEIGHT_300DPI,
    quality: 0.90,
    format: 'jpeg'
  };
}

/**
 * Preload an image from URL
 * @param url - Image URL to preload
 * @returns Promise that resolves when image is loaded
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`✅ Image preloaded: ${url.substring(0, 50)}...`);
      resolve();
    };
    img.onerror = () => {
      console.error(`❌ Failed to preload image: ${url.substring(0, 50)}...`);
      reject(new Error('Failed to preload image'));
    };
    img.src = url;
  });
}
