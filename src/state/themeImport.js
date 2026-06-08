import { fileToStoredDataUrl } from './storage.js';
import {
  createTheme,
  folderNameToDisplayName,
  slugify,
  uniqueThemeId,
  tweaksForImportedTheme,
} from './themes.js';

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;

function normPath(p) {
  return p.replace(/\\/g, '/');
}

function isImageFile(name) {
  return IMAGE_EXT.test(name);
}

function baseName(path) {
  const parts = path.split('/');
  const file = parts[parts.length - 1];
  return file.replace(/\.[^.]+$/, '');
}

function lookLabelFromFile(path) {
  return folderNameToDisplayName(baseName(path));
}

/**
 * Parse FileList from webkitdirectory input.
 * Expected: themes/<themeName>/random/ref/* (before) and themes/<themeName>/random/wr/* (after)
 */
export async function parseThemeFolderFiles(fileList, tweakTemplate = null) {
  const files = Array.from(fileList).filter((f) => isImageFile(f.name));
  const buckets = new Map();

  for (const file of files) {
    const rel = normPath(file.webkitRelativePath || file.name);
    const parts = rel.split('/').filter(Boolean);
    const lower = rel.toLowerCase();

    let themeFolder = null;
    const themesIdx = parts.findIndex((p) => p.toLowerCase() === 'themes');
    if (themesIdx >= 0 && parts.length > themesIdx + 1) {
      themeFolder = parts[themesIdx + 1];
    } else if (parts.length >= 1) {
      themeFolder = parts[0];
    }
    if (!themeFolder) continue;

    const isRef = /\/random\/ref\//i.test(lower) || /\/ref\//i.test(lower);
    const isWr = /\/random\/wr\//i.test(lower) || /\/wr\//i.test(lower);
    if (!isRef && !isWr) continue;

    if (!buckets.has(themeFolder)) {
      buckets.set(themeFolder, { ref: [], wr: [] });
    }
    const b = buckets.get(themeFolder);
    if (isRef) b.ref.push(file);
    else if (isWr) b.wr.push(file);
  }

  const warnings = [];
  const themes = [];
  const existingIds = new Set();

  const sortedFolders = [...buckets.keys()].sort((a, b) => a.localeCompare(b));

  for (const folderName of sortedFolders) {
    const { ref, wr } = buckets.get(folderName);
    ref.sort((a, b) => a.name.localeCompare(b.name));
    wr.sort((a, b) => a.name.localeCompare(b.name));

    if (!ref.length) {
      warnings.push(`${folderName}: no before image in random/ref`);
      continue;
    }
    if (!wr.length) {
      warnings.push(`${folderName}: no after images in random/wr`);
      continue;
    }

    const displayName = folderNameToDisplayName(folderName);
    const beforeSrc = await fileToStoredDataUrl(ref[0]);
    const looks = [];
    for (let i = 0; i < wr.length; i++) {
      const src = await fileToStoredDataUrl(wr[i]);
      looks.push({
        key: `look-${i}`,
        n: lookLabelFromFile(wr[i].name),
        src,
      });
    }

    const lookNames = looks.map((l) => l.n);
    const baseId = slugify(folderName);
    const id = uniqueThemeId(baseId, existingIds);
    existingIds.add(id);

    themes.push(
      createTheme({
        id,
        folderName,
        displayName,
        beforeSrc,
        looks,
        tweaks: tweaksForImportedTheme(tweakTemplate, displayName, lookNames),
      })
    );
  }

  if (!themes.length && !warnings.length) {
    warnings.push(
      'No themes found. Use themes/<name>/random/ref (before) and themes/<name>/random/wr (after).'
    );
  }

  return { themes, warnings };
}
