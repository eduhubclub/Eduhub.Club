import { describe, expect, it } from 'vitest';
import {
  fitWithin,
  suggestFilename,
  normalizeQuality,
  isLikelyHeic,
  isLikelyGif,
  IMAGE_FORMATS,
  IMAGE_PRESETS,
  centerCropRect,
  sizeAfterRotation,
  zipBlobs,
} from './imageConvert.js';

describe('fitWithin', () => {
  it('leaves size alone when under max', () => {
    expect(fitWithin(800, 600, 1600, 1200)).toEqual({ width: 800, height: 600 });
  });

  it('shrinks to fit width while keeping aspect', () => {
    expect(fitWithin(2000, 1000, 1000, null)).toEqual({ width: 1000, height: 500 });
  });

  it('shrinks to fit height', () => {
    expect(fitWithin(1000, 2000, null, 500)).toEqual({ width: 250, height: 500 });
  });

  it('never upscales', () => {
    expect(fitWithin(100, 80, 1000, 1000)).toEqual({ width: 100, height: 80 });
  });
});

describe('suggestFilename', () => {
  it('swaps the extension for the target format', () => {
    expect(suggestFilename('Photo.HEIC', 'jpeg')).toBe('Photo.jpg');
    expect(suggestFilename('slide.PNG', 'webp')).toBe('slide.webp');
    expect(suggestFilename('noext', 'png')).toBe('noext.png');
  });
});

describe('normalizeQuality', () => {
  it('accepts 0–1 and 0–100 scales', () => {
    expect(normalizeQuality(0.7)).toBe(0.7);
    expect(normalizeQuality(70)).toBe(0.7);
  });

  it('clamps extremes', () => {
    expect(normalizeQuality(0)).toBe(0.05);
    expect(normalizeQuality(200)).toBe(1);
  });
});

describe('format sniffers', () => {
  it('detects HEIC by name or type', () => {
    expect(isLikelyHeic({ name: 'a.heic', type: '' })).toBe(true);
    expect(isLikelyHeic({ name: 'a.jpg', type: 'image/heic' })).toBe(true);
    expect(isLikelyHeic({ name: 'a.jpg', type: 'image/jpeg' })).toBe(false);
  });

  it('detects GIF', () => {
    expect(isLikelyGif({ name: 'x.gif', type: '' })).toBe(true);
    expect(isLikelyGif({ name: 'x.png', type: 'image/gif' })).toBe(true);
  });
});

describe('IMAGE_FORMATS', () => {
  it('exposes jpeg png webp mime types', () => {
    expect(IMAGE_FORMATS.jpeg.mime).toBe('image/jpeg');
    expect(IMAGE_FORMATS.png.ext).toBe('png');
    expect(IMAGE_FORMATS.webp.lossy).toBe(true);
  });
});

describe('IMAGE_PRESETS', () => {
  it('defines email slides and print caps', () => {
    expect(IMAGE_PRESETS.email.maxWidth).toBe(1280);
    expect(IMAGE_PRESETS.slides.format).toBe('jpeg');
    expect(IMAGE_PRESETS.print.quality).toBeGreaterThan(IMAGE_PRESETS.email.quality);
  });
});

describe('centerCropRect', () => {
  it('crops wide images to square', () => {
    expect(centerCropRect(200, 100, 1)).toEqual({ x: 50, y: 0, width: 100, height: 100 });
  });

  it('crops tall images to 16:9', () => {
    const box = centerCropRect(100, 200, 16 / 9);
    expect(box.x).toBe(0);
    expect(box.width).toBe(100);
    expect(box.height).toBe(Math.round(100 / (16 / 9)));
  });
});

describe('sizeAfterRotation', () => {
  it('swaps axes for 90 and 270', () => {
    expect(sizeAfterRotation(200, 100, 90)).toEqual({ width: 100, height: 200 });
    expect(sizeAfterRotation(200, 100, 180)).toEqual({ width: 200, height: 100 });
  });
});

describe('zipBlobs', () => {
  it('builds a zip with a local file header signature', async () => {
    const blob = await zipBlobs([
      { name: 'a.txt', blob: new Blob(['hello'], { type: 'text/plain' }) },
    ]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
    expect(blob.size).toBeGreaterThan(30);
  });
});
