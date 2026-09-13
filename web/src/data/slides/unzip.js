/**
 * Minimal ZIP reader for PPTX (store + deflate).
 */

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot unpack PowerPoint files.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(
    new DecompressionStream('deflate-raw'),
  );
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

/**
 * @param {ArrayBuffer} buffer
 * @returns {Promise<Record<string, Uint8Array>>}
 */
export async function unzipArrayBuffer(buffer) {
  const view = new DataView(buffer);
  let eocd = buffer.byteLength - 22;
  while (eocd >= 0 && view.getUint32(eocd, true) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error('Not a ZIP file.');
  const entries = view.getUint16(eocd + 10, true);
  let off = view.getUint32(eocd + 16, true);
  /** @type {Record<string, Uint8Array>} */
  const files = {};
  const decoder = new TextDecoder();
  for (let i = 0; i < entries; i += 1) {
    if (view.getUint32(off, true) !== 0x02014b50) break;
    const method = view.getUint16(off + 10, true);
    const compSize = view.getUint32(off + 20, true);
    const nameLen = view.getUint16(off + 28, true);
    const extraLen = view.getUint16(off + 30, true);
    const commentLen = view.getUint16(off + 32, true);
    const localOff = view.getUint32(off + 42, true);
    const name = decoder.decode(new Uint8Array(buffer, off + 46, nameLen));
    const localNameLen = view.getUint16(localOff + 26, true);
    const localExtra = view.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + localNameLen + localExtra;
    const compressed = new Uint8Array(buffer, dataStart, compSize);
    let data = compressed;
    if (method === 8) data = await inflateRaw(compressed);
    else if (method !== 0) data = compressed;
    files[name] = data;
    off += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

export function bytesToText(bytes) {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

export function bytesToDataUrl(bytes, mime = 'application/octet-stream') {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}
