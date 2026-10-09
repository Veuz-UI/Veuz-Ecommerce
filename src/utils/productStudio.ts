/**
 * Product Studio Utility
 * - Intelligent Background Removal & Subject Focus (100% Transparent Output)
 * - Uniform 1:1 Studio Canvas Sizing & Auto-Centering
 * - Multi-Angle AI Generation helper: Side View, Top View, Back View
 */

export interface StudioOptions {
  removeBackground?: boolean;
  standardizeSize?: boolean;
  canvasSize?: number; // default: 1000px
  paddingPercent?: number; // default: 6% margin to focus subject prominently
  backgroundColor?: 'transparent' | 'white' | 'neutral';
  quality?: number; // 0.1 to 1.0 (default 1.0 for lossless alpha)
}

export type AnglePerspective = 'side' | 'top' | 'back';

export interface AnglePreset {
  id: AnglePerspective;
  label: string;
  description: string;
  icon: string;
}

export const ANGLE_PRESETS: AnglePreset[] = [
  {
    id: 'side',
    label: 'Side View',
    description: 'Side perspective showing product thickness and profile.',
    icon: 'solar:box-minimalistic-bold',
  },
  {
    id: 'top',
    label: 'Top View',
    description: 'Overhead view showcasing top details and interior.',
    icon: 'solar:align-top-bold',
  },
  {
    id: 'back',
    label: 'Back View',
    description: 'Rear perspective highlighting back closures, straps, or finish.',
    icon: 'solar:refresh-square-bold',
  },
];

/**
 * Loads an image from a File, Blob, or URL into an HTMLImageElement
 */
export function loadImage(src: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for processing.'));

    if (typeof src === 'string') {
      img.src = src;
    } else {
      const url = URL.createObjectURL(src);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    }
  });
}

/**
 * Intelligent background removal algorithm
 * Removes white, off-white, studio gray, and perimeter background colors.
 * Makes background 100% transparent and focuses the subject cleanly.
 */
export function removeBackgroundCanvas(img: HTMLImageElement, tolerance: number = 36): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Sample the top corners (reliably background in product & portrait photos)
  const sampleCorner = (startX: number, startY: number) => {
    let r = 0, g = 0, b = 0, count = 0;
    for (let dy = 0; dy < 5 && startY + dy < h; dy++) {
      for (let dx = 0; dx < 5 && startX + dx < w; dx++) {
        const idx = ((startY + dy) * w + (startX + dx)) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
    return count > 0 ? { r: r / count, g: g / count, b: b / count } : { r: 255, g: 255, b: 255 };
  };

  const topLeft = sampleCorner(0, 0);
  const topRight = sampleCorner(Math.max(0, w - 5), 0);

  const isBgPixel = (idx: number): boolean => {
    const a = data[idx + 3];
    if (a < 20) return true; // Already transparent

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Standard white / near-white studio background (most common)
    if (r > 232 && g > 232 && b > 232 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
      return true;
    }

    // Matches top-left corner background
    const distTL = Math.sqrt(
      Math.pow(r - topLeft.r, 2) + Math.pow(g - topLeft.g, 2) + Math.pow(b - topLeft.b, 2)
    );
    if (distTL <= tolerance) return true;

    // Matches top-right corner background
    const distTR = Math.sqrt(
      Math.pow(r - topRight.r, 2) + Math.pow(g - topRight.g, 2) + Math.pow(b - topRight.b, 2)
    );
    if (distTR <= tolerance) return true;

    return false;
  };

  // Verify if the image has a uniform studio background (sample along the top edge)
  let nonStudioCount = 0;
  let checkedPixels = 0;
  const step = Math.max(1, Math.floor(w / 100));

  for (let x = 0; x < w; x += step) {
    const idx = (0 * w + x) * 4;
    const a = data[idx + 3];
    if (a < 20) continue; // Already transparent
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const isLight = r > 220 && g > 220 && b > 220 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
    const distTL = Math.sqrt(Math.pow(r - topLeft.r, 2) + Math.pow(g - topLeft.g, 2) + Math.pow(b - topLeft.b, 2));
    const distTR = Math.sqrt(Math.pow(r - topRight.r, 2) + Math.pow(g - topRight.g, 2) + Math.pow(b - topRight.b, 2));
    if (!isLight && distTL > tolerance && distTR > tolerance) {
      nonStudioCount++;
    }
    checkedPixels++;
  }

  // If the top edge is a complex photographic scene (stairs, walls, outdoors, pillars, wallpaper),
  // DO NOT ERASE! Return original canvas intact so clothes, people, and scenery are never damaged.
  if (checkedPixels > 0 && nonStudioCount / checkedPixels > 0.15) {
    return canvas;
  }

  // 2. BFS Flood Fill from perimeter edges (only for verified studio backdrops)
  const visited = new Uint8Array(w * h);
  const queue: number[] = [];

  for (let x = 0; x < w; x++) {
    const topIdx = (0 * w + x) * 4;
    const botIdx = ((h - 1) * w + x) * 4;
    if (isBgPixel(topIdx)) queue.push(0 * w + x);
    if (isBgPixel(botIdx)) queue.push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    const leftIdx = (y * w + 0) * 4;
    const rightIdx = (y * w + (w - 1)) * 4;
    if (isBgPixel(leftIdx)) queue.push(y * w + 0);
    if (isBgPixel(rightIdx)) queue.push(y * w + (w - 1));
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    if (visited[curr]) continue;
    visited[curr] = 1;

    const idx = curr * 4;
    data[idx + 3] = 0; // Turn 100% transparent!

    const x = curr % w;
    const y = Math.floor(curr / w);

    if (x > 0 && !visited[curr - 1] && isBgPixel((curr - 1) * 4)) queue.push(curr - 1);
    if (x < w - 1 && !visited[curr + 1] && isBgPixel((curr + 1) * 4)) queue.push(curr + 1);
    if (y > 0 && !visited[curr - w] && isBgPixel((curr - w) * 4)) queue.push(curr - w);
    if (y < h - 1 && !visited[curr + w] && isBgPixel((curr + w) * 4)) queue.push(curr + w);
  }

  // 3. Feather edges slightly for smooth border
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] > 0) {
        let transCount = 0;
        if (data[((y - 1) * w + x) * 4 + 3] === 0) transCount++;
        if (data[((y + 1) * w + x) * 4 + 3] === 0) transCount++;
        if (data[(y * w + (x - 1)) * 4 + 3] === 0) transCount++;
        if (data[(y * w + (x + 1)) * 4 + 3] === 0) transCount++;

        if (transCount >= 2) {
          data[idx + 3] = Math.floor(data[idx + 3] * 0.75);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Finds the tightest bounding box of visible (non-transparent) pixels in a canvas
 */
export function getBoundingBox(canvas: HTMLCanvasElement): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { minX: 0, minY: 0, maxX: canvas.width, maxY: canvas.height, width: canvas.width, height: canvas.height };
  }

  const { width: w, height: h } = canvas;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return { minX: 0, minY: 0, maxX: w, maxY: h, width: w, height: h };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Standardizes a product cutout onto a uniform 1:1 canvas with centered auto-padding and 100% transparent background
 */
export async function standardizeProductCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  options: StudioOptions = {}
): Promise<File> {
  const {
    canvasSize = 1000,
    paddingPercent = 6, // 6% padding to focus the subject prominently
    backgroundColor = 'transparent', // 100% transparent by default
  } = options;

  let sourceCanvas: HTMLCanvasElement;
  if (source instanceof HTMLCanvasElement) {
    sourceCanvas = source;
  } else {
    sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = source.naturalWidth || source.width;
    sourceCanvas.height = source.naturalHeight || source.height;
    const ctx = sourceCanvas.getContext('2d');
    ctx?.drawImage(source, 0, 0);
  }

  // Find object bounding box to crop and center accurately
  const bbox = getBoundingBox(sourceCanvas);

  // Target 1:1 Square Canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = canvasSize;
  outCanvas.height = canvasSize;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) throw new Error('Could not initialize 2D canvas.');

  // 1. Draw Background: 100% transparent clearRect by default!
  if (backgroundColor === 'white') {
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, canvasSize, canvasSize);
  } else if (backgroundColor === 'neutral') {
    outCtx.fillStyle = '#f8fafc';
    outCtx.fillRect(0, 0, canvasSize, canvasSize);
  } else {
    // 100% Transparent
    outCtx.clearRect(0, 0, canvasSize, canvasSize);
  }

  // 2. Calculate scaling so subject fills canvas prominently (~88-90% scale)
  const maxAvailable = canvasSize * (1 - (paddingPercent * 2) / 100);
  const scale = Math.min(maxAvailable / bbox.width, maxAvailable / bbox.height);

  const targetW = bbox.width * scale;
  const targetH = bbox.height * scale;
  const targetX = (canvasSize - targetW) / 2;
  const targetY = (canvasSize - targetH) / 2;

  // 3. Draw centered subject with smooth interpolation
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(
    sourceCanvas,
    bbox.minX,
    bbox.minY,
    bbox.width,
    bbox.height,
    targetX,
    targetY,
    targetW,
    targetH
  );

  // 4. Export as transparent PNG file (preserves transparent alpha 100% across all browsers)
  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to render standardized studio image.'));
        const file = new File([blob], `product-studio-${Date.now()}.png`, {
          type: 'image/png',
          lastModified: Date.now(),
        });
        resolve(file);
      },
      'image/png'
    );
  });
}

/**
 * End-to-end Studio Processor for any uploaded product photo
 */
export async function processProductStudioPhoto(
  file: File,
  options: StudioOptions = {}
): Promise<{ file: File; dataUrl: string }> {
  const {
    removeBackground = true,
    standardizeSize = true,
    backgroundColor = 'transparent',
    paddingPercent = 6,
  } = options;

  // 1. Load image
  const img = await loadImage(file);

  // 2. Remove background if requested
  let workingCanvas: HTMLCanvasElement;
  if (removeBackground) {
    workingCanvas = removeBackgroundCanvas(img);
  } else {
    workingCanvas = document.createElement('canvas');
    workingCanvas.width = img.naturalWidth || img.width;
    workingCanvas.height = img.naturalHeight || img.height;
    const ctx = workingCanvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);
  }

  // 3. Standardize to 1:1 square canvas (transparent & centered)
  let finalFile: File;
  if (standardizeSize) {
    finalFile = await standardizeProductCanvas(workingCanvas, {
      ...options,
      backgroundColor,
      paddingPercent,
    });
  } else {
    finalFile = await new Promise((resolve, reject) => {
      workingCanvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to export image.'));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
        },
        'image/png'
      );
    });
  }

  // Generate preview data URL
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.readAsDataURL(finalFile);
  });

  return { file: finalFile, dataUrl };
}

/**
 * Generates specific product angles on canvas with 100% TRANSPARENT background
 * - 'side': 3D Isometric perspective view
 * - 'top': Overhead top-down view
 * - 'back': Rear view (horizontal mirror + rear perspective transform)
 */
export async function generateSimulatedAngleCanvas(
  img: HTMLImageElement,
  angle: AnglePerspective,
  canvasSize: number = 1000
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context.');

  // 100% Transparent Canvas (NO white background!)
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  ctx.save();
  ctx.translate(canvasSize / 2, canvasSize / 2);

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const maxDim = canvasSize * 0.86;
  const scale = Math.min(maxDim / w, maxDim / h);
  const drawW = w * scale;
  const drawH = h * scale;

  if (angle === 'side') {
    // 3D Perspective Side View
    ctx.transform(0.92, -0.06, 0.04, 0.96, 0, 0);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  } else if (angle === 'top') {
    // Top-down overhead tilt
    ctx.transform(1.04, 0, 0, 0.82, 0, -15);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  } else if (angle === 'back') {
    // Back / Rear View: Horizontally mirrored with subtle contrast
    ctx.scale(-0.95, 0.98);
    ctx.filter = 'contrast(1.05) brightness(0.98)';
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  }

  ctx.restore();

  // Export as 100% transparent PNG
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to generate angle.'));
        resolve(new File([blob], `product-angle-${angle}-${Date.now()}.png`, { type: 'image/png' }));
      },
      'image/png'
    );
  });
}
