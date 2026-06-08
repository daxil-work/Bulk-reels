import { TWEAK_DEFAULTS } from '../reel/config.js';
import { sanitizeFilename } from './themes.js';

export const TWEAK_PACK_VERSION = 1;

export function sanitizeTweaks(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  for (const key of Object.keys(TWEAK_DEFAULTS)) {
    if (key in raw && raw[key] !== undefined) {
      out[key] = raw[key];
    }
  }
  return out;
}

export function serializeTweakPack(tweaks, meta = {}) {
  return {
    version: TWEAK_PACK_VERSION,
    type: 'tweaks',
    exportedAt: new Date().toISOString(),
    ...meta,
    tweaks: sanitizeTweaks(tweaks),
  };
}

export function parseTweakPack(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid tweaks file');
  }
  const raw = data.tweaks ?? data;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid tweaks file: missing tweaks object');
  }
  const version = data.version ?? 1;
  if (version > TWEAK_PACK_VERSION) {
    console.warn('Tweaks file version newer than app; import may be incomplete');
  }
  return {
    tweaks: sanitizeTweaks(raw),
    themeName: data.themeName ?? data.displayName ?? null,
    ideaId: data.ideaId ?? null,
    exportedAt: data.exportedAt ?? null,
  };
}

export function downloadTweaksJson(tweaks, label = 'tweaks') {
  const pack = serializeTweakPack(tweaks, {
    themeName: tweaks.themeName || label,
  });
  const filename = `${sanitizeFilename(label)}-tweaks.json`;
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
}

export async function readTweakPackFile(file) {
  const text = await file.text();
  return parseTweakPack(text);
}

export function mergeImportedTweaks(defaults, imported) {
  return { ...defaults, ...sanitizeTweaks(imported) };
}
