function removeStrayLines(data: Buffer | Uint8Array, width: number, height: number, channels: number) {
  const rowCounts = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (a > 25 && !(r > 240 && g > 240 && b > 240)) {
        rowCounts[y]++;
      }
    }
  }

  const clusters: { startY: number; endY: number; totalPixels: number }[] = [];
  let cur: { startY: number; endY: number; totalPixels: number } | null = null;
  for (let y = 0; y < height; y++) {
    if (rowCounts[y] > 0) {
      if (!cur) cur = { startY: y, endY: y, totalPixels: 0 };
      cur.endY = y;
      cur.totalPixels += rowCounts[y];
    } else {
      if (cur) {
        clusters.push(cur);
        cur = null;
      }
    }
  }
  if (cur) clusters.push(cur);

  if (clusters.length > 1) {
    const mainCluster = clusters.reduce(
      (max, c) => (c.totalPixels > max.totalPixels ? c : max),
      clusters[0]
    );
    clusters.forEach((c) => {
      const gap = Math.min(
        Math.abs(c.startY - mainCluster.endY),
        Math.abs(c.endY - mainCluster.startY)
      );
      if (c !== mainCluster && gap > 12 && c.endY - c.startY + 1 <= 3) {
        for (let y = c.startY; y <= c.endY; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * channels;
            data[idx + 3] = 0;
          }
        }
      }
    });
  }
}

/**
 * Normalizes partner logos:
 * 1. Removes white, near-white, or corner background colors making them fully transparent.
 * 2. Removes isolated stray artifacts / horizontal noise lines.
 * 3. Tightly crops to the exact logo boundary.
 * 4. Applies optical visual-weight sizing (so wide and compact logos appear balanced).
 * 5. Perfectly centers the logo onto a standard 320x110 transparent canvas.
 */
export async function normalizePartnerLogoBuffer(inputBuffer: Buffer): Promise<Buffer> {
  try {
    const sharp = require('sharp');
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    if (metadata.format === 'svg') {
      return inputBuffer;
    }

    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;

    // 1. Detect corner/background color
    const samplePixel = (x: number, y: number) => {
      const idx = (y * width + x) * 4;
      return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
    };

    const corners = [
      samplePixel(0, 0),
      samplePixel(width - 1, 0),
      samplePixel(0, height - 1),
      samplePixel(width - 1, height - 1),
    ];

    const avgR = corners.reduce((s: number, c: { r: number }) => s + c.r, 0) / 4;
    const avgG = corners.reduce((s: number, c: { g: number }) => s + c.g, 0) / 4;
    const avgB = corners.reduce((s: number, c: { b: number }) => s + c.b, 0) / 4;
    const avgA = corners.reduce((s: number, c: { a: number }) => s + c.a, 0) / 4;

    const isLightOrWhiteBg = (avgR > 215 && avgG > 215 && avgB > 215) || avgA < 20;

    // 2. Remove background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 15) {
        data[i + 3] = 0;
      } else if (isLightOrWhiteBg) {
        if (r > 238 && g > 238 && b > 238) {
          data[i + 3] = 0;
        } else {
          const dist = Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2);
          if (dist < 22 && r > 210 && g > 210 && b > 210) {
            data[i + 3] = 0;
          }
        }
      }
    }

    // 3. Remove isolated 1px stray lines/artifacts
    removeStrayLines(data, width, height, 4);

    // 4. Calculate tight content bounding box
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasContent = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          hasContent = true;
        }
      }
    }

    if (!hasContent || minX > maxX || minY > maxY) {
      minX = 0;
      minY = 0;
      maxX = width - 1;
      maxY = height - 1;
    }

    const cropW = Math.max(1, maxX - minX + 1);
    const cropH = Math.max(1, maxY - minY + 1);
    const aspect = cropW / cropH;

    // 5. Extract cropped logo
    const cropped = await sharp(data, { raw: { width, height, channels: 4 } })
      .extract({ left: minX, top: minY, width: cropW, height: cropH })
      .png()
      .toBuffer();

    // 6. Balanced Optical Sizing onto standardized 320x110 canvas
    const targetW = 320;
    const targetH = 110;

    let drawW: number;
    let drawH: number;
    if (aspect >= 2.8) {
      // Wide logos: max width 265px, max height 52px
      const scale = Math.min(265 / cropW, 52 / cropH);
      drawW = Math.max(1, Math.round(cropW * scale));
      drawH = Math.max(1, Math.round(cropH * scale));
    } else if (aspect >= 2.0) {
      // Medium logos: max width 235px, max height 60px
      const scale = Math.min(235 / cropW, 60 / cropH);
      drawW = Math.max(1, Math.round(cropW * scale));
      drawH = Math.max(1, Math.round(cropH * scale));
    } else {
      // Compact/square logos: max width 185px, max height 64px
      const scale = Math.min(185 / cropW, 64 / cropH);
      drawW = Math.max(1, Math.round(cropW * scale));
      drawH = Math.max(1, Math.round(cropH * scale));
    }

    // Exact middle and center placement
    const padLeft = Math.floor((targetW - drawW) / 2);
    const padRight = targetW - drawW - padLeft;
    const padTop = Math.floor((targetH - drawH) / 2);
    const padBottom = targetH - drawH - padTop;

    const normalized = await sharp(cropped)
      .resize(drawW, drawH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: padTop,
        bottom: padBottom,
        left: padLeft,
        right: padRight,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    return normalized;
  } catch (err) {
    console.warn('normalizePartnerLogoBuffer fallback to original:', err);
    return inputBuffer;
  }
}
