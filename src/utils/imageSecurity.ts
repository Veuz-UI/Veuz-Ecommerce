/**
 * Client-Side Image Security, Validation, and Canvas Compression Utility
 * Protects against oversized uploads, malicious extensions, and reduces bandwidth/storage.
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.85)
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates an image file before upload or processing
 */
export function validateImageFile(
  file: File,
  maxSizeBytes: number = DEFAULT_MAX_SIZE_BYTES
): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // 1. Check MIME type
  const mime = file.type ? file.type.toLowerCase() : '';
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.',
    };
  }

  // 2. Check Extension
  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Invalid file extension. Please select a .jpg, .png, or .webp image.',
    };
  }

  // 3. Check File Size Limit
  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds the allowed limit of ${maxMb}MB. Please choose a smaller image.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses an image in the browser using HTML5 Canvas.
 * Automatically downscales dimensions and strips EXIF metadata for enhanced security and privacy.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    mimeType = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    // Check if running in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression.'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Maintain aspect ratio while bounding within maxWidth & maxHeight
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file); // fallback to original file if canvas not supported
          }

          // Crisp rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }
              // Generate safe filename with appropriate extension
              const ext = mimeType === 'image/webp' ? '.webp' : mimeType === 'image/jpeg' ? '.jpg' : '.png';
              const cleanBaseName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '_');
              const newFileName = `${cleanBaseName}_compressed${ext}`;

              const compressedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            mimeType,
            quality
          );
        } catch (err) {
          console.error('Image compression error, using original:', err);
          resolve(file);
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
