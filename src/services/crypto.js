const enc = new TextEncoder();
const dec = new TextDecoder();
const MAGIC = 'LJRN';
const VERSION = 1;
const ITERATIONS = 250000;

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJSON(obj, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const data = enc.encode(JSON.stringify(obj));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  const head = enc.encode(MAGIC);
  const out = new Uint8Array(head.length + 2 + salt.length + iv.length + cipher.length);
  out.set(head, 0);
  out[head.length] = VERSION;
  out[head.length + 1] = salt.length;
  out.set(salt, head.length + 2);
  out.set(iv, head.length + 2 + salt.length);
  out.set(cipher, head.length + 2 + salt.length + iv.length);
  return out;
}

export async function decryptJSON(bytes, password) {
  const head = dec.decode(bytes.slice(0, 4));
  if (head !== MAGIC) throw new Error('not-backup');
  const saltLen = bytes[5];
  const salt = bytes.slice(6, 6 + saltLen);
  const iv = bytes.slice(6 + saltLen, 6 + saltLen + 12);
  const cipher = bytes.slice(6 + saltLen + 12);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return JSON.parse(dec.decode(plain));
}

export function isEncrypted(bytes) {
  return bytes.length > 6 && dec.decode(bytes.slice(0, 4)) === MAGIC;
}
