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
  referenceImage?: string | HTMLImageElement | HTMLCanvasElement; // 1st/Primary Image to teach product focus
  cropRect?: { x: number; y: number; width: number; height: number }; // Manual focal crop if specified
}

export interface ProductColorProfile {
  hues: number[];
  primaryHue: number;
  hasDistinctColor: boolean;
  avgSat: number;
  avgVal: number;
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else if (max === b) h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

/**
 * Extracts dominant product colors from the reference (1st) image
 */
export function extractProductColorProfile(refSource: HTMLCanvasElement | HTMLImageElement): ProductColorProfile | null {
  try {
    const canvas = document.createElement('canvas');
    const w = refSource instanceof HTMLImageElement ? (refSource.naturalWidth || refSource.width) : refSource.width;
    const h = refSource instanceof HTMLImageElement ? (refSource.naturalHeight || refSource.height) : refSource.height;
    if (!w || !h) return null;

    const sampleSize = 250;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(refSource, 0, 0, sampleSize, sampleSize);
    const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imgData.data;

    const hueCounts = new Array(360).fill(0);
    let totalSaturated = 0;
    let satSum = 0;
    let valSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (a > 30 && !(r > 240 && g > 240 && b > 240)) {
        const hsv = rgbToHsv(r, g, b);
        if (hsv.s > 25 && hsv.v > 20) {
          hueCounts[hsv.h]++;
          satSum += hsv.s;
          valSum += hsv.v;
          totalSaturated++;
        }
      }
    }

    if (totalSaturated < 80) return null;

    let maxCount = 0;
    let peakHue = 0;
    for (let h = 0; h < 360; h++) {
      let count = 0;
      for (let dh = -6; dh <= 6; dh++) {
        const idx = (h + dh + 360) % 360;
        count += hueCounts[idx];
      }
      if (count > maxCount) {
        maxCount = count;
        peakHue = h;
      }
    }

    return {
      hues: [peakHue],
      primaryHue: peakHue,
      hasDistinctColor: maxCount / totalSaturated > 0.22,
      avgSat: Math.round(satSum / totalSaturated),
      avgVal: Math.round(valSum / totalSaturated),
    };
  } catch (e) {
    console.warn('Error extracting product color profile:', e);
    return null;
  }
}

/**
 * Detects the Hero Product Subject (e.g. glove) inside an angle photo with foreign props/tools
 */
export function detectHeroSubjectBoundingBox(
  canvas: HTMLCanvasElement,
  refProfile: ProductColorProfile | null
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  const fullBBox = getBoundingBox(canvas);
  if (!refProfile || !refProfile.hasDistinctColor) {
    return fullBBox;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return fullBBox;

  const { width: w, height: h } = canvas;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Locate Product Anchor Pixels (e.g. orange nitrile palm/fingers)
  const targetHue = refProfile.primaryHue;
  const anchorPixels: { x: number; y: number }[] = [];

  for (let y = fullBBox.minY; y <= fullBBox.maxY; y += 2) {
    for (let x = fullBBox.minX; x <= fullBBox.maxX; x += 2) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a < 25) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const hsv = rgbToHsv(r, g, b);
      const hueDiff = Math.min(Math.abs(hsv.h - targetHue), 360 - Math.abs(hsv.h - targetHue));

      if (hueDiff <= 34 && hsv.s >= 22 && hsv.v >= 20) {
        anchorPixels.push({ x, y });
      }
    }
  }

  // If insufficient anchor pixels detected, keep the entire foreground intact
  if (anchorPixels.length < 50) {
    return fullBBox;
  }

  // 2. Find Anchor Centroid and Extent
  let sumX = 0, sumY = 0;
  for (const pt of anchorPixels) {
    sumX += pt.x;
    sumY += pt.y;
  }
  const centerX = sumX / anchorPixels.length;
  const centerY = sumY / anchorPixels.length;

  anchorPixels.sort((a, b) => a.x - b.x);
  const aMinX = anchorPixels[Math.floor(anchorPixels.length * 0.02)].x;
  const aMaxX = anchorPixels[Math.floor(anchorPixels.length * 0.98)].x;
  anchorPixels.sort((a, b) => a.y - b.y);
  const aMinY = anchorPixels[Math.floor(anchorPixels.length * 0.02)].y;
  const aMaxY = anchorPixels[Math.floor(anchorPixels.length * 0.98)].y;

  const anchorW = aMaxX - aMinX + 1;
  const anchorH = aMaxY - aMinY + 1;
  const anchorSpan = Math.max(anchorW, anchorH);

  // 3. Connect to the Complete Product (including White Knit Cuff/Back) & Tool in Hand!
  // Any visible foreground pixel (alpha > 25) that is contiguous with the glove or within the hand's reach
  // is protected and included. The white knit cuff and held tool are NEVER sliced or wiped!
  let subMinX = aMinX;
  let subMaxX = aMaxX;
  let subMinY = aMinY;
  let subMaxY = aMaxY;

  // Maximum radius from product centroid to include white cuff, hand, and gripped tool
  const maxReach = anchorSpan * 1.65;

  for (let y = fullBBox.minY; y <= fullBBox.maxY; y++) {
    for (let x = fullBBox.minX; x <= fullBBox.maxX; x++) {
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a < 25) continue;

      const dist = Math.hypot(x - centerX, y - centerY);
      if (dist <= maxReach) {
        if (x < subMinX) subMinX = x;
        if (x > subMaxX) subMaxX = x;
        if (y < subMinY) subMinY = y;
        if (y > subMaxY) subMaxY = y;
      }
    }
  }

  // 4. Safe Context Padding so no glove seam, cuff hem, or tool edge is ever clipped
  const pad = Math.round(Math.max(subMaxX - subMinX, subMaxY - subMinY) * 0.06);

  const finalMinX = Math.max(0, subMinX - pad);
  const finalMaxX = Math.min(w - 1, subMaxX + pad);
  const finalMinY = Math.max(0, subMinY - pad);
  const finalMaxY = Math.min(h - 1, subMaxY + pad);

  return {
    minX: finalMinX,
    minY: finalMinY,
    maxX: finalMaxX,
    maxY: finalMaxY,
    width: finalMaxX - finalMinX + 1,
    height: finalMaxY - finalMinY + 1,
  };
}

export type AnglePerspective = 'side' | 'top' | 'back' | 'detail';

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
  {
    id: 'detail',
    label: '45° Detail View',
    description: 'Quarter perspective highlighting craftsmanship and finish.',
    icon: 'solar:magic-stick-3-bold',
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
  const isCornerStudioWhite =
    topLeft.r > 225 &&
    topLeft.g > 225 &&
    topLeft.b > 225 &&
    topRight.r > 225 &&
    topRight.g > 225 &&
    topRight.b > 225;

  const isBgPixel = (idx: number): boolean => {
    const a = data[idx + 3];
    if (a < 20) return true; // Already transparent

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

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

    // Only if both top corners are verified studio pure white: match near-white backdrop
    // Stricter threshold (248) protects white knit cuffs, white cotton liners, and logos from being wiped
    if (isCornerStudioWhite && r > 248 && g > 248 && b > 248 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8) {
      return true;
    }

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
  if (checkedPixels > 0 && nonStudioCount / checkedPixels > 0.08) {
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
  let bbox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };

  if (options.cropRect && options.cropRect.width > 0 && options.cropRect.height > 0) {
    bbox = {
      minX: options.cropRect.x,
      minY: options.cropRect.y,
      maxX: options.cropRect.x + options.cropRect.width - 1,
      maxY: options.cropRect.y + options.cropRect.height - 1,
      width: options.cropRect.width,
      height: options.cropRect.height,
    };
  } else if (options.referenceImage) {
    try {
      const refImg = typeof options.referenceImage === 'string'
        ? await loadImage(options.referenceImage)
        : options.referenceImage;
      const refProfile = extractProductColorProfile(refImg);
      bbox = detectHeroSubjectBoundingBox(sourceCanvas, refProfile);
    } catch {
      bbox = getBoundingBox(sourceCanvas);
    }
  } else {
    bbox = getBoundingBox(sourceCanvas);
  }

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

  // 2. Remove background if requested (AI Neural Network with canvas fallback)
  let workingCanvas: HTMLCanvasElement;
  if (removeBackground) {
    try {
      const { removeBackgroundAi } = await import('./aiBackgroundRemoval');
      const aiBlob = await removeBackgroundAi(file);
      const aiImg = await loadImage(aiBlob);
      workingCanvas = document.createElement('canvas');
      workingCanvas.width = aiImg.naturalWidth || aiImg.width;
      workingCanvas.height = aiImg.naturalHeight || aiImg.height;
      const ctx = workingCanvas.getContext('2d');
      ctx?.drawImage(aiImg, 0, 0);
    } catch (aiErr) {
      console.warn('AI background removal error, falling back to canvas:', aiErr);
      workingCanvas = removeBackgroundCanvas(img);
    }
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
  } else if (angle === 'detail') {
    // 45-degree angle / close-up detail perspective
    ctx.transform(0.96, 0.05, -0.05, 0.96, 0, 0);
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

/**
 * Takes an existing transparent cutout image URL and reframes / zooms / pans onto a chosen focal area
 */
export async function reframeImageCanvas(
  imageUrl: string,
  zoomScale: number = 1.0, // 1.0 to 3.0
  offsetX: number = 0,     // -50 to +50 percent
  offsetY: number = 0,     // -50 to +50 percent
  canvasSize: number = 1000
): Promise<File> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context.');

  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const baseW = img.naturalWidth || img.width;
  const baseH = img.naturalHeight || img.height;

  // Fit image inside canvas at zoomScale
  const fitScale = (Math.min(canvasSize / baseW, canvasSize / baseH) * 0.88) * zoomScale;
  const drawW = baseW * fitScale;
  const drawH = baseH * fitScale;

  const shiftX = (offsetX / 100) * (canvasSize / 2);
  const shiftY = (offsetY / 100) * (canvasSize / 2);

  const posX = (canvasSize - drawW) / 2 + shiftX;
  const posY = (canvasSize - drawH) / 2 + shiftY;

  ctx.drawImage(img, posX, posY, drawW, drawH);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Failed to reframe image.'));
      resolve(new File([blob], `refocused-${Date.now()}.png`, { type: 'image/png' }));
    }, 'image/png');
  });
}
