import { db } from '../database/db';
import { encryptJSON, decryptJSON, isEncrypted } from './crypto';

function blobToBase64(blob) {
  return blob.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf);
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  });
}

function base64ToBlob(b64, type = 'image/jpeg') {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function exportBackup({ includePhotos = true, password = '' } = {}) {
  const entries = await db.entries.toArray();
  const settingsRows = await db.settings.toArray();
  const payload = {
    app: 'life-journal',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    settings: settingsRows.filter((s) => !['pinHash', 'webauthnId'].includes(s.key)),
  };
  if (includePhotos) {
    const photos = await db.photos.toArray();
    payload.photos = await Promise.all(
      photos.map(async (p) => ({
        entryId: p.entryId,
        width: p.width,
        height: p.height,
        createdAt: p.createdAt,
        type: p.blob.type,
        data: await blobToBase64(p.blob),
      }))
    );
  }
  let blob;
  let filename;
  if (password) {
    const bytes = await encryptJSON(payload, password);
    blob = new Blob([bytes], { type: 'application/octet-stream' });
    filename = `life-journal-${new Date().toISOString().slice(0, 10)}.ljournal`;
  } else {
    blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    filename = `life-journal-${new Date().toISOString().slice(0, 10)}.json`;
  }
  await db.settings.put({ key: 'lastBackupAt', value: Date.now() });
  return { blob, filename, entryCount: entries.length };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function readBackupFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (isEncrypted(buf)) return { encrypted: true, bytes: buf };
  try {
    return { encrypted: false, data: JSON.parse(new TextDecoder().decode(buf)) };
  } catch {
    throw new Error('bad-file');
  }
}

export async function unlockBackup(bytes, password) {
  return decryptJSON(bytes, password);
}

export async function restoreBackup(data) {
  if (data?.app !== 'life-journal') throw new Error('bad-file');
  await db.transaction('rw', db.entries, db.photos, db.settings, async () => {
    await db.entries.clear();
    await db.photos.clear();
    for (const e of data.entries || []) {
      const { id, ...rest } = e;
      const newId = await db.entries.add(rest);
      for (const p of data.photos || []) {
        if (p.entryId === id) {
          await db.photos.add({
            entryId: newId,
            blob: base64ToBlob(p.data, p.type),
            width: p.width,
            height: p.height,
            createdAt: p.createdAt,
          });
        }
      }
    }
    for (const s of data.settings || []) {
      await db.settings.put(s);
    }
  });
}

export async function backupSize(includePhotos) {
  const entries = await db.entries.count();
  const photoRows = includePhotos ? await db.photos.toArray() : [];
  const photoCount = await db.photos.count();
  let bytes = 0;
  for (const p of photoRows) bytes += p.blob.size;
  return { entries, photos: photoCount, bytes };
}
