function bytesToB64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function b64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToB64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToB64(bytes);
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToB64(new Uint8Array(digest));
}

export async function hashPin(pin, saltB64) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(pin)),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: b64ToBytes(saltB64),
      iterations: 120000,
      hash: 'SHA-256',
    },
    key,
    256,
  );
  return bytesToB64(new Uint8Array(bits));
}
