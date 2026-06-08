import { useCallback, useEffect, useState } from 'react';
import { parseThemeFolderFiles } from './themeImport.js';
import { parseThemePack, downloadThemePackJson } from './themePack.js';
import { createTheme, defaultTweaksForTheme, themeToImages } from './themes.js';
import { mergeImportedTweaks } from './tweakPack.js';
import { fileToStoredDataUrl } from './storage.js';

const COLLECTION_KEY = 'reel-themes-collection';
const SELECTED_THEME_KEY = 'reel-selected-theme';
const VIEW_MODE_KEY = 'reel-view-mode';

function loadCollection() {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t) =>
      createTheme({
        id: t.id,
        folderName: t.folderName,
        displayName: t.displayName,
        beforeSrc: t.beforeSrc,
        looks: t.looks,
        tweaks: t.tweaks,
      })
    );
  } catch {
    return [];
  }
}

function saveCollection(themes) {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(themes));
  } catch (e) {
    console.warn('Could not save theme collection', e);
  }
}

function loadSelectedThemeId(themes) {
  try {
    const id = localStorage.getItem(SELECTED_THEME_KEY);
    if (id && themes.some((t) => t.id === id)) return id;
  } catch {}
  return themes[0]?.id ?? null;
}

function loadViewMode() {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    if (v === 'grid' || v === 'editor') return v;
  } catch {}
  return 'editor';
}

export function useThemeCollection() {
  const [themes, setThemes] = useState(() => loadCollection());
  const [selectedThemeId, setSelectedThemeId] = useState(() =>
    loadSelectedThemeId(loadCollection())
  );
  const [viewMode, setViewMode] = useState(loadViewMode);
  const [importWarnings, setImportWarnings] = useState([]);

  const selectedTheme = themes.find((t) => t.id === selectedThemeId) || null;
  const hasThemes = themes.length > 0;

  useEffect(() => {
    saveCollection(themes);
    if (selectedThemeId && !themes.some((t) => t.id === selectedThemeId)) {
      setSelectedThemeId(themes[0]?.id ?? null);
    }
  }, [themes, selectedThemeId]);

  useEffect(() => {
    try {
      if (selectedThemeId) localStorage.setItem(SELECTED_THEME_KEY, selectedThemeId);
    } catch {}
  }, [selectedThemeId]);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, viewMode);
    } catch {}
  }, [viewMode]);

  const updateTheme = useCallback((id, patch) => {
    setThemes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }, []);

  const updateThemeTweaks = useCallback((id, edits) => {
    setThemes((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, tweaks: { ...t.tweaks, ...edits } } : t
      )
    );
  }, []);

  const setThemeTweak = useCallback((keyOrEdits, val) => {
    if (!selectedThemeId) return;
    const edits =
      typeof keyOrEdits === 'object' && keyOrEdits !== null
        ? keyOrEdits
        : { [keyOrEdits]: val };
    updateThemeTweaks(selectedThemeId, edits);
  }, [selectedThemeId, updateThemeTweaks]);

  const resetThemeTweaks = useCallback(() => {
    if (!selectedTheme) return;
    const lookNames = selectedTheme.looks.map((l) => l.n);
    updateTheme(selectedTheme.id, {
      tweaks: defaultTweaksForTheme(selectedTheme.displayName, lookNames),
    });
  }, [selectedTheme, updateTheme]);

  const mergeTweaksForTheme = useCallback((theme, imported) => {
    const lookNames = theme.looks.map((l) => l.n);
    const defaults = defaultTweaksForTheme(theme.displayName, lookNames);
    let merged = mergeImportedTweaks(defaults, imported);
    if (merged.hero && !lookNames.includes(merged.hero)) {
      merged = { ...merged, hero: lookNames[lookNames.length - 1] || merged.hero };
    }
    return { ...merged, themeName: theme.displayName };
  }, []);

  const replaceThemeTweaks = useCallback(
    (imported) => {
      if (!selectedTheme) return;
      updateTheme(selectedTheme.id, {
        tweaks: mergeTweaksForTheme(selectedTheme, imported),
      });
    },
    [selectedTheme, updateTheme, mergeTweaksForTheme]
  );

  const applyTweaksToAllThemes = useCallback(
    (imported) => {
      setThemes((prev) =>
        prev.map((theme) => ({
          ...theme,
          tweaks: mergeTweaksForTheme(theme, imported),
        }))
      );
    },
    [mergeTweaksForTheme]
  );

  const resetThemeImages = useCallback(() => {
    if (!selectedTheme) return;
    // Re-import would be needed; for bulk themes we reset tweaks only on "reset all"
    resetThemeTweaks();
  }, [selectedTheme, resetThemeTweaks]);

  const setThemeImage = useCallback(
    async (key, file) => {
      if (!selectedThemeId || !file) return;
      const dataUrl = await fileToStoredDataUrl(file);
      setThemes((prev) =>
        prev.map((t) => {
          if (t.id !== selectedThemeId) return t;
          if (key === 'before') {
            return { ...t, beforeSrc: dataUrl };
          }
          const looks = t.looks.map((l) =>
            l.key === key ? { ...l, src: dataUrl } : l
          );
          return { ...t, looks };
        })
      );
    },
    [selectedThemeId]
  );

  const deleteThemeLook = useCallback(
    (key) => {
      if (!selectedThemeId) return;
      setThemes((prev) =>
        prev.map((t) => {
          if (t.id !== selectedThemeId) return t;
          const looks = t.looks.filter((l) => l.key !== key);
          const lookNames = looks.map((l) => l.n);
          let tweaks = t.tweaks;
          if (tweaks.hero && !lookNames.includes(tweaks.hero)) {
            tweaks = { ...tweaks, hero: lookNames[lookNames.length - 1] || tweaks.hero };
          }
          return { ...t, looks, tweaks };
        })
      );
    },
    [selectedThemeId]
  );

  const importFolder = useCallback(async (fileList, tweakTemplate = null) => {
    const { themes: imported, warnings } = await parseThemeFolderFiles(fileList, tweakTemplate);
    setImportWarnings(warnings);
    if (!imported.length) return { count: 0, warnings };

    setThemes((prev) => {
      const byId = new Map(prev.map((t) => [t.id, t]));
      for (const t of imported) byId.set(t.id, t);
      return [...byId.values()].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      );
    });
    setSelectedThemeId(imported[0].id);
    setViewMode('grid');
    return { count: imported.length, warnings };
  }, []);

  const importPack = useCallback(async (file) => {
    const { themes: imported } = await parseThemePack(await file.text());
    setImportWarnings([]);
    setThemes(imported);
    setSelectedThemeId(imported[0]?.id ?? null);
    setViewMode('grid');
    return { count: imported.length };
  }, []);

  const exportPack = useCallback(() => {
    downloadThemePackJson(themes);
  }, [themes]);

  const clearThemes = useCallback(() => {
    setThemes([]);
    setSelectedThemeId(null);
    setImportWarnings([]);
    try {
      localStorage.removeItem(COLLECTION_KEY);
      localStorage.removeItem(SELECTED_THEME_KEY);
    } catch {}
  }, []);

  const images = selectedTheme ? themeToImages(selectedTheme) : null;
  const tweaks = selectedTheme?.tweaks ?? null;

  return {
    themes,
    selectedTheme,
    selectedThemeId,
    setSelectedThemeId,
    hasThemes,
    viewMode,
    setViewMode,
    importWarnings,
    updateTheme,
    setThemeTweak,
    resetThemeTweaks,
    replaceThemeTweaks,
    applyTweaksToAllThemes,
    resetThemeImages,
    setThemeImage,
    deleteThemeLook,
    importFolder,
    importPack,
    exportPack,
    clearThemes,
    images,
    tweaks,
  };
}
