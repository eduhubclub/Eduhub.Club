/**
 * Browser-only image convert / resize / compress for Edu.Convert.
 * Files never leave the device.
 */

/** @typedef {'jpeg' | 'png' | 'webp'} ImageFormatId */

export const IMAGE_FORMATS = {
  jpeg: { id: 'jpeg', mime: 'image/jpeg', ext: 'jpg', label: 'JPG', lossy: true },
  png: { id: 'png', mime: 'image/png', ext: 'png', label: 'PNG', lossy: false },
  webp: { id: 'webp', mime: 'image/webp', ext: 'webp', label: 'WEBP', lossy: true },
};

export const IMAGE_FORMAT_OPTIONS = [
  IMAGE_FORMATS.jpeg,
  IMAGE_FORMATS.png,
  IMAGE_FORMATS.webp,
];

/** Classroom-friendly size/quality presets. */
export const IMAGE_PRESETS = {
  custom: {
    id: 'custom',
    label: 'Custom',
    maxWidth: null,
    maxHeight: null,
    quality: 85,
    format: null,
  },
  email: {
    id: 'email',
    label: 'Email',
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 72,
    format: 'jpeg',
  },
  slides: {
    id: 'slides',
    label: 'Slides',
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 82,
    format: 'jpeg',
  },
  print: {
    id: 'print',
    label: 'Print',
    maxWidth: 2400,
    maxHeight: 2400,
    quality: 92,
    format: 'jpeg',
  },
};

export const IMAGE_PRESET_OPTIONS = [
  IMAGE_PRESETS.custom,
  IMAGE_PRESETS.email,
  IMAGE_PRESETS.slides,
  IMAGE_PRESETS.print,
];

export const CROP_ASPECT_OPTIONS = [
  { id: 'none', label: 'None', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
];

/**
 * Center-crop box for a target aspect ratio (width/height).
 * @param {number} width
 * @param {number} height
 * @param {number} ratio width/height
 */
export function centerCropRect(width, height, ratio) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const r = Number(ratio);
  if (!Number.isFinite(r) || r <= 0) {
    return { x: 0, y: 0, width: w, height: h };
  }
  const current = w / h;
  if (Math.abs(current - r) < 0.001) {
    return { x: 0, y: 0, width: w, height: h };
  }
  if (current > r) {
    const cropW = Math.round(h * r);
    return { x: Math.round((w - cropW) / 2), y: 0, width: cropW, height: h };
  }
  const cropH = Math.round(w / r);
  return { x: 0, y: Math.round((h - cropH) / 2), width: w, height: cropH };
}

/**
 * Output canvas size after a clockwise rotation of 0/90/180/270.
 * @param {number} width
 * @param {number} height
 * @param {number} degrees
 */
export function sizeAfterRotation(width, height, degrees) {
  const d = ((Number(degrees) % 360) + 360) % 360;
  if (d === 90 || d === 270) return { width: height, height: width };
  return { width, height };
}

const HEIC_EXT = /\.(heic|heif)$/i;
const GIF_EXT = /\.gif$/i;

/**
 * @param {File | { name?: string, type?: string }} file
 */
export function isLikelyHeic(file) {
  const name = file?.name || '';
  const type = (file?.type || '').toLowerCase();
  return (
    HEIC_EXT.test(name) ||
    type.includes('heic') ||
    type.includes('heif')
  );
}

/**
 * @param {File | { name?: string, type?: string }} file
 */
export function isLikelyGif(file) {
  const name = file?.name || '';
  const type = (file?.type || '').toLowerCase();
  return GIF_EXT.test(name) || type === 'image/gif';
}

/**
 * @param {string} originalName
 * @param {ImageFormatId | string} formatId
 */
export function suggestFilename(originalName, formatId) {
  const fmt = IMAGE_FORMATS[formatId] || IMAGE_FORMATS.jpeg;
  const base = String(originalName || 'image')
    .replace(/\.[^.]+$/, '')
    .trim() || 'image';
  return `${base}.${fmt.ext}`;
}

/**
 * Shrink to fit inside max box; never upscale. Null/0 max means unlimited on that axis.
 * @param {number} width
 * @param {number} height
 * @param {number | null | undefined} maxWidth
 * @param {number | null | undefined} maxHeight
 */
export function fitWithin(width, height, maxWidth, maxHeight) {
  const w = Math.max(1, Math.round(Number(width) || 1));
  const h = Math.max(1, Math.round(Number(height) || 1));
  const mw = maxWidth == null || maxWidth <= 0 ? Infinity : maxWidth;
  const mh = maxHeight == null || maxHeight <= 0 ? Infinity : maxHeight;
  const scale = Math.min(1, mw / w, mh / h);
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

/**
 * @param {number} quality 0–1 or 0–100
 */
export function normalizeQuality(quality) {
  let q = Number(quality);
  if (!Number.isFinite(q)) return 0.85;
  if (q > 1) q = q / 100;
  return Math.min(1, Math.max(0.05, q));
}

function revokeQuiet(url) {
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Decode a File into an ImageBitmap or HTMLImageElement.
 * @param {File | Blob} file
 * @returns {Promise<{ source: ImageBitmap | HTMLImageElement, width: number, height: number, close: () => void }>}
 */
export async function decodeImage(file) {
  const heic = isLikelyHeic(file);
  const type = file?.type || '';

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => {
          if (typeof bitmap.close === 'function') bitmap.close();
        },
      };
    } catch (err) {
      if (heic) {
        throw new Error(
          'This browser cannot open HEIC. Try Safari on a Mac or iPad, or export as JPG from Photos first.',
        );
      }
      // Fall through to <img> path for odd types.
      void err;
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => {
        if (heic) {
          reject(
            new Error(
              'This browser cannot open HEIC. Try Safari on a Mac or iPad, or export as JPG from Photos first.',
            ),
          );
        } else {
          reject(new Error(`Could not read ${file?.name || type || 'this image'}.`));
        }
      };
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      close: () => revokeQuiet(url),
    };
  } catch (err) {
    revokeQuiet(url);
    throw err;
  }
}

/**
 * Draw source onto a canvas sized with fitWithin, then encode.
 * Supports rotate (CW), flip, and center crop-to-aspect before resize.
 * @param {CanvasImageSource} source
 * @param {{ width: number, height: number }} natural
 * @param {{
 *   format?: ImageFormatId,
 *   quality?: number,
 *   maxWidth?: number | null,
 *   maxHeight?: number | null,
 *   filename?: string,
 *   rotate?: 0 | 90 | 180 | 270,
 *   flipH?: boolean,
 *   flipV?: boolean,
 *   cropAspect?: number | null,
 * }} [options]
 */
export async function encodeImage(source, natural, options = {}) {
  const formatId = options.format && IMAGE_FORMATS[options.format] ? options.format : 'jpeg';
  const fmt = IMAGE_FORMATS[formatId];
  const quality = normalizeQuality(options.quality);
  const rotate = ((Number(options.rotate) % 360) + 360) % 360;
  const flipH = Boolean(options.flipH);
  const flipV = Boolean(options.flipV);
  const cropAspect =
    options.cropAspect != null && Number(options.cropAspect) > 0
      ? Number(options.cropAspect)
      : null;

  const crop = cropAspect
    ? centerCropRect(natural.width, natural.height, cropAspect)
    : { x: 0, y: 0, width: natural.width, height: natural.height };

  const rotated = sizeAfterRotation(crop.width, crop.height, rotate);
  const { width, height } = fitWithin(
    rotated.width,
    rotated.height,
    options.maxWidth,
    options.maxHeight,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create a drawing surface.');

  if (fmt.id === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  const drawW = rotate === 90 || rotate === 270 ? height : width;
  const drawH = rotate === 90 || rotate === 270 ? width : height;
  ctx.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH,
  );
  ctx.restore();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error(`Could not encode as ${fmt.label}.`));
      },
      fmt.mime,
      fmt.lossy ? quality : undefined,
    );
  });

  return {
    blob,
    width,
    height,
    mime: fmt.mime,
    format: fmt.id,
    filename: suggestFilename(options.filename || 'image', formatId),
  };
}

/**
 * Decode + encode a File with the given options.
 * @param {File} file
 * @param {Parameters<typeof encodeImage>[2]} [options]
 */
export async function convertImageFile(file, options = {}) {
  const decoded = await decodeImage(file);
  try {
    return await encodeImage(decoded.source, decoded, {
      ...options,
      filename: options.filename || file.name,
    });
  } finally {
    decoded.close();
  }
}

/**
 * Trigger a browser download for a Blob.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Minimal store-method ZIP (no compression) for batch image downloads.
 * @param {{ name: string, blob: Blob }[]} entries
 * @returns {Promise<Blob>}
 */
export async function zipBlobs(entries) {
  const parts = [];
  const central = [];
  let offset = 0;
  const encoder = new TextEncoder();

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name.replace(/\\/g, '/'));
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(8, 0, true); // store
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);

    parts.push(local, data);

    const cen = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    cen.set(nameBytes, 46);
    central.push(cen);

    offset += local.length + data.length;
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

/** CRC-32 for ZIP local headers. */
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}
