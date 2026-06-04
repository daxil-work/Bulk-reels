import { zipSync, strToU8 } from 'fflate';
import { getIdea } from '../ideas/registry.js';
import { preloadAssets, encodeMP4, recordRealtime } from './export.js';
import { serializeThemePack } from '../state/themePack.js';
import { sanitizeFilename } from '../state/themes.js';

async function exportOneTheme(theme, idea, onProgress) {
  const images = {
    before: theme.beforeSrc,
    looks: theme.looks.map((l) => ({ key: l.key, n: l.n, src: l.src })),
  };
  const built = idea.buildCfg({ t: theme.tweaks, images });
  const { cfg, srcs } = built;
  const exportCfg = { ...cfg };
  exportCfg.imgs = await preloadAssets(cfg.headFam, srcs);

  let blob = null;
  let ext = 'mp4';
  if (window.VideoEncoder) {
    blob = await encodeMP4(exportCfg, onProgress);
  }
  if (blob) {
    return { blob, ext };
  }
  const res = await recordRealtime(exportCfg, onProgress);
  return { blob: res.blob, ext: res.ext };
}

export async function exportThemesZip(themes, idea, onStatus) {
  const entries = {};
  const total = themes.length;

  for (let i = 0; i < themes.length; i++) {
    const theme = themes[i];
    onStatus?.({
      phase: 'export',
      index: i,
      total,
      name: theme.displayName,
      progress: i / total,
    });

    const { blob, ext } = await exportOneTheme(theme, idea, (p) => {
      onStatus?.({
        phase: 'export',
        index: i,
        total,
        name: theme.displayName,
        progress: (i + p) / total,
      });
    });

    const fname = `videos/${sanitizeFilename(theme.displayName)}.${ext}`;
    const buf = new Uint8Array(await blob.arrayBuffer());
    entries[fname] = buf;
  }

  const pack = serializeThemePack(themes);
  entries['theme-pack.json'] = strToU8(JSON.stringify(pack, null, 2));

  onStatus?.({ phase: 'zip', progress: 1 });
  const zipped = zipSync(entries, { level: 6 });
  return new Blob([zipped], { type: 'application/zip' });
}

export function downloadZipBlob(blob, filename = 'reels-bulk.zip') {
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
