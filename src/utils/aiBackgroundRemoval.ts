/**
 * AI-Powered Background Removal Engine
 * Uses @imgly/background-removal (ONNX Neural Network & WebAssembly)
 * Runs client-side in the browser: 100% private, free, and works on any complex background.
 * Seamlessly falls back to heuristic canvas algorithm if WebAssembly/WASM is unsupported.
 */

import { removeBackgroundCanvas } from './productStudio';

export interface AiRemoveBgOptions {
  onProgress?: (progress: number, stage: string) => void;
  outputFormat?: 'image/png' | 'image/webp';
  quality?: number;
}

export async function removeBackgroundAi(
  fileOrBlob: File | Blob,
  options: AiRemoveBgOptions = {}
): Promise<Blob> {
  const { onProgress, outputFormat = 'image/png', quality = 0.95 } = options;

  // 1. Check if running in browser environment
  if (typeof window === 'undefined') {
    return fileOrBlob;
  }

  try {
    onProgress?.(10, 'Initializing AI Engine...');
    
    // Dynamic import ensures zero Next.js SSR / build-time node issues
    const imglyModule = await import('@imgly/background-removal');
    const removeBackgroundFn = (imglyModule.removeBackground || (imglyModule as any).default) as (
      image: any,
      configuration?: any
    ) => Promise<Blob>;

    onProgress?.(25, 'Analyzing image with AI...');
    const resultBlob = await removeBackgroundFn(fileOrBlob, {
      output: {
        format: outputFormat,
        quality: quality,
      },
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.min(95, Math.round(25 + (current / total) * 70));
          const stageName = key.includes('fetch') ? 'Loading AI Model...' : 'Removing background with AI...';
          onProgress?.(pct, stageName);
        }
      },
    });

    onProgress?.(100, 'Background removed successfully!');
    return resultBlob;
  } catch (aiErr) {
    console.warn('AI Background removal encountered an issue, using canvas fallback:', aiErr);
    onProgress?.(70, 'Applying Studio Canvas Engine...');

    // Graceful fallback to client canvas flood-fill
    return new Promise((resolve) => {
      const img = new Image();
      const tempUrl = URL.createObjectURL(fileOrBlob);
      img.onload = () => {
        try {
          const canvas = removeBackgroundCanvas(img);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(tempUrl);
              resolve(blob || fileOrBlob);
            },
            outputFormat,
            quality
          );
        } catch {
          URL.revokeObjectURL(tempUrl);
          resolve(fileOrBlob);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        resolve(fileOrBlob);
      };
      img.src = tempUrl;
    });
  }
}
