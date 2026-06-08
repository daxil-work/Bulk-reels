import { TWEAK_DEFAULTS } from '../reel/config.js';
import { mergeImportedTweaks } from './tweakPack.js';

/** Title-case each word: "dark wedding look" → "Dark Wedding Look" */
export function folderNameToDisplayName(folderName) {
  return String(folderName)
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'theme';
}

export function uniqueThemeId(baseId, existingIds) {
  let id = baseId;
  let n = 2;
  while (existingIds.has(id)) {
    id = `${baseId}-${n++}`;
  }
  return id;
}

export function defaultTweaksForTheme(displayName, lookNames = []) {
  const hero = lookNames.length ? lookNames[lookNames.length - 1] : TWEAK_DEFAULTS.hero;
  return {
    ...TWEAK_DEFAULTS,
    themeName: displayName,
    hero,
  };
}

/** Apply a tweak template to a newly imported theme (per-theme name + hero). */
export function tweaksForImportedTheme(template, displayName, lookNames = []) {
  const defaults = defaultTweaksForTheme(displayName, lookNames);
  if (!template) return defaults;
  const hero = template.hero && lookNames.includes(template.hero)
    ? template.hero
    : defaults.hero;
  return mergeImportedTweaks(defaults, {
    ...template,
    themeName: displayName,
    hero,
  });
}

export function createTheme({ folderName, displayName, beforeSrc, looks, tweaks, id }) {
  const display = displayName || folderNameToDisplayName(folderName);
  const lookList = (looks || []).map((l, i) => ({
    key: l.key || `look-${i}`,
    n: l.n || `Look ${i + 1}`,
    src: l.src,
  }));
  const lookNames = lookList.map((l) => l.n);
  return {
    id: id || slugify(folderName),
    folderName,
    displayName: display,
    beforeSrc,
    looks: lookList,
    tweaks: tweaks || defaultTweaksForTheme(display, lookNames),
  };
}

export function themeToImages(theme) {
  return {
    before: theme.beforeSrc,
    looks: theme.looks.map((l) => ({ key: l.key, n: l.n, src: l.src })),
  };
}

export function themeToImageSlots(theme) {
  return {
    before: { key: 'before', label: 'Before photo', defaultSrc: theme.beforeSrc },
    looks: theme.looks.map((l, i) => ({
      key: l.key || `look-${i}`,
      name: l.n,
      defaultSrc: l.src,
    })),
  };
}

export function themeToSlots(theme) {
  const imageSlots = themeToImageSlots(theme);
  return [
    {
      key: 'before',
      label: imageSlots.before.label,
      src: theme.beforeSrc,
      defaultSrc: theme.beforeSrc,
      isCustom: true,
      deleted: false,
      canDelete: false,
    },
    ...theme.looks.map((l, i) => ({
      key: l.key || `look-${i}`,
      label: l.n,
      src: l.src,
      defaultSrc: l.src,
      isCustom: true,
      deleted: false,
      canDelete: true,
    })),
  ];
}

export function sanitizeFilename(name) {
  return String(name)
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'theme';
}
