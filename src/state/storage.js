const META_PREFIX = 'reel-slots';

export function metaKeyFor(ideaId) {
  return `${META_PREFIX}:${ideaId}`;
}

export function loadSlotMeta(ideaId, imageSlots) {
  try {
    const raw = localStorage.getItem(metaKeyFor(ideaId));
    if (!raw) return buildDefaultMeta(imageSlots);
    const parsed = JSON.parse(raw);
    return mergeMeta(imageSlots, parsed);
  } catch {
    return buildDefaultMeta(imageSlots);
  }
}

export function saveSlotMeta(ideaId, meta) {
  try {
    localStorage.setItem(metaKeyFor(ideaId), JSON.stringify(meta));
  } catch (e) {
    console.warn('Could not save image slots to localStorage', e);
  }
}

export function clearSlotMeta(ideaId) {
  try {
    localStorage.removeItem(metaKeyFor(ideaId));
  } catch {}
}

function buildDefaultMeta(imageSlots) {
  const meta = {};
  meta[imageSlots.before.key] = { customDataUrl: null, deleted: false };
  for (const look of imageSlots.looks) {
    meta[look.key] = { customDataUrl: null, deleted: false };
  }
  return meta;
}

function mergeMeta(imageSlots, stored) {
  const meta = buildDefaultMeta(imageSlots);
  for (const key of Object.keys(meta)) {
    if (stored[key]) {
      meta[key] = {
        customDataUrl: stored[key].customDataUrl || null,
        deleted: !!stored[key].deleted,
      };
    }
  }
  return meta;
}

export async function fileToStoredDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  const maxW = 1280;
  const maxH = 2280;
  const sc = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const w = Math.round(bitmap.width * sc);
  const h = Math.round(bitmap.height * sc);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function clearAllIdeaStorage(ideaId) {
  clearSlotMeta(ideaId);
  try {
    localStorage.removeItem(`reel-tweaks:${ideaId}`);
  } catch {}
}

export const SELECTED_IDEA_KEY = 'reel-selected-idea';

export function loadSelectedIdea(defaultId) {
  try {
    return localStorage.getItem(SELECTED_IDEA_KEY) || defaultId;
  } catch {
    return defaultId;
  }
}

export function saveSelectedIdea(id) {
  try {
    localStorage.setItem(SELECTED_IDEA_KEY, id);
  } catch {}
}

export const THEMES_COLLECTION_KEY = 'reel-themes-collection';

export function clearThemesCollection() {
  try {
    localStorage.removeItem(THEMES_COLLECTION_KEY);
    localStorage.removeItem('reel-selected-theme');
  } catch {}
}
