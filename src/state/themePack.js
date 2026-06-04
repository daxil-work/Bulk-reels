import { createTheme } from './themes.js';

export const THEME_PACK_VERSION = 1;

export function serializeThemePack(themes) {
  return {
    version: THEME_PACK_VERSION,
    exportedAt: new Date().toISOString(),
    themes: themes.map((t) => ({
      id: t.id,
      folderName: t.folderName,
      displayName: t.displayName,
      beforeSrc: t.beforeSrc,
      looks: t.looks.map((l) => ({ key: l.key, n: l.n, src: l.src })),
      tweaks: { ...t.tweaks },
    })),
  };
}

export function parseThemePack(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || !Array.isArray(data.themes)) {
    throw new Error('Invalid theme pack: missing themes array');
  }
  const version = data.version ?? 1;
  if (version > THEME_PACK_VERSION) {
    console.warn('Theme pack version newer than app; import may be incomplete');
  }
  const themes = data.themes.map((raw) =>
    createTheme({
      id: raw.id,
      folderName: raw.folderName || raw.displayName,
      displayName: raw.displayName,
      beforeSrc: raw.beforeSrc,
      looks: raw.looks || [],
      tweaks: raw.tweaks,
    })
  );
  return { themes, exportedAt: data.exportedAt };
}

export function downloadThemePackJson(themes, filename = 'theme-pack.json') {
  const pack = serializeThemePack(themes);
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

export async function readThemePackFile(file) {
  const text = await file.text();
  return parseThemePack(text);
}
