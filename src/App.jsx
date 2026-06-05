import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ThemeSidebar from './components/ThemeSidebar.jsx';
import BulkPreviewGrid from './components/BulkPreviewGrid.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Drawer from './components/Drawer.jsx';
import MobileHeader from './components/MobileHeader.jsx';
import { useTweaks } from './components/TweaksPanel.jsx';
import { IDEAS, getIdea } from './ideas/registry.js';
import { useImages } from './state/useImages.js';
import { useThemeCollection } from './state/useThemeCollection.js';
import { themeToSlots } from './state/themes.js';
import { loadSelectedIdea, saveSelectedIdea } from './state/storage.js';
import { preloadAssets, encodeMP4, recordRealtime, downloadBlob } from './reel/export.js';
import { exportThemesZip, downloadZipBlob } from './reel/bulkExport.js';
import { sanitizeFilename } from './state/themes.js';

export default function App() {
  const [selectedIdeaId, setSelectedIdeaId] = useState(() => loadSelectedIdea(IDEAS[0].id));
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const idea = useMemo(() => getIdea(selectedIdeaId), [selectedIdeaId]);

  const themeCol = useThemeCollection();
  const {
    themes,
    selectedTheme,
    selectedThemeId,
    setSelectedThemeId,
    hasThemes,
    viewMode,
    setViewMode,
    importWarnings,
    setThemeTweak,
    resetThemeTweaks,
    setThemeImage,
    deleteThemeLook,
    importFolder,
    importPack,
    exportPack,
    clearThemes,
    images: themeImages,
    tweaks: themeTweaks,
  } = themeCol;

  const useThemeMode = hasThemes && selectedTheme;

  const [tLegacy, setTweakLegacy, resetTweaksLegacy] = useTweaks(idea.defaults, idea.id);

  const t = useThemeMode ? themeTweaks : tLegacy;
  const setTweak = useThemeMode
    ? setThemeTweak
    : setTweakLegacy;
  const resetTweaks = useThemeMode ? resetThemeTweaks : resetTweaksLegacy;

  const {
    images: legacyImages,
    slots: legacySlots,
    setImage: legacySetImage,
    resetImage: legacyResetImage,
    deleteImage: legacyDeleteImage,
    restoreImage: legacyRestoreImage,
    resetAllImages,
  } = useImages(idea.imageSlots, idea.id);

  const images = useThemeMode ? themeImages : legacyImages;
  const slots = useThemeMode ? themeToSlots(selectedTheme) : legacySlots;
  const setImage = useThemeMode
    ? (key, file) => setThemeImage(key, file)
    : legacySetImage;
  const resetImage = useThemeMode ? () => {} : legacyResetImage;
  const deleteImage = useThemeMode
    ? (key) => deleteThemeLook(key)
    : legacyDeleteImage;
  const restoreImage = useThemeMode ? () => {} : legacyRestoreImage;

  const [rec, setRec] = useState({ on: false, p: 0, mode: null, ext: null, label: null });
  const [bulkBusy, setBulkBusy] = useState(false);

  const closeDrawers = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, []);

  const openLeft = useCallback(() => {
    setRightOpen(false);
    setLeftOpen(true);
  }, []);

  const openRight = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(true);
  }, []);

  useEffect(() => {
    saveSelectedIdea(selectedIdeaId);
  }, [selectedIdeaId]);

  useEffect(() => {
    if (hasThemes && !selectedThemeId && themes[0]) {
      setSelectedThemeId(themes[0].id);
    }
  }, [hasThemes, selectedThemeId, themes, setSelectedThemeId]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) closeDrawers();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [closeDrawers]);

  const lookNames = images?.looks?.map((l) => l.n) ?? [];

  useEffect(() => {
    if (!t || !lookNames.length || !t.hero) return;
    if (!lookNames.includes(t.hero)) {
      setTweak('hero', lookNames[lookNames.length - 1]);
    }
  }, [lookNames, t?.hero, setTweak]);

  const built = useMemo(() => {
    if (!images) return null;
    return idea.buildCfg({ t, images });
  }, [idea, t, images]);

  const { cfg, W, H, TT, srcs, accent } = built || {
    cfg: null,
    W: 1080,
    H: 1920,
    TT: { DURATION: 36 },
    srcs: [],
    accent: '#b4d8ff',
  };
  const Preview = idea.Preview;
  const SettingsControls = idea.SettingsControls;

  const runExport = async (themeForExport, downloadName) => {
    const exportImages = themeForExport
      ? {
          before: themeForExport.beforeSrc,
          looks: themeForExport.looks.map((l) => ({ key: l.key, n: l.n, src: l.src })),
        }
      : images;
    const exportTweaks = themeForExport ? themeForExport.tweaks : t;
    const builtExport = idea.buildCfg({ t: exportTweaks, images: exportImages });
    const exportCfg = { ...builtExport.cfg };
    exportCfg.imgs = await preloadAssets(builtExport.cfg.headFam, builtExport.srcs, builtExport.cfg.bodyFam);
    let blob = null;
    let ext = 'mp4';
    if (window.VideoEncoder) {
      setRec((r) => ({ ...r, mode: 'encode', p: 0 }));
      blob = await encodeMP4(exportCfg, (p) => setRec((r) => ({ ...r, p })));
    }
    if (blob) {
      downloadBlob(blob, 'mp4', downloadName);
      ext = 'mp4';
    } else {
      setRec((r) => ({ ...r, mode: 'record', p: 0 }));
      const res = await recordRealtime(exportCfg, (p) => setRec((r) => ({ ...r, p })));
      downloadBlob(res.blob, res.ext, downloadName);
      ext = res.ext;
    }
    return ext;
  };

  const onDownload = async () => {
    if (rec.on || !images?.before) return;
    const name = useThemeMode && selectedTheme
      ? sanitizeFilename(selectedTheme.displayName)
      : 'before-after-reel';
    setRec({ on: true, p: 0, mode: 'prep', ext: null, label: name });
    try {
      const ext = await runExport(
        useThemeMode ? selectedTheme : null,
        name
      );
      setRec({ on: false, p: 1, mode: null, ext, label: name });
      setTimeout(() => setRec((r) => ({ ...r, ext: null })), 5000);
    } catch (e) {
      console.error(e);
      setRec({ on: false, p: 0, mode: null, ext: 'error', label: null });
    }
  };

  const onBulkDownload = async () => {
    if (rec.on || bulkBusy || !themes.length) return;
    setBulkBusy(true);
    setRec({ on: true, p: 0, mode: 'bulk', ext: null, label: 'bulk' });
    try {
      const zip = await exportThemesZip(themes, idea, (status) => {
        if (status.phase === 'export') {
          setRec({
            on: true,
            p: status.progress,
            mode: 'bulk',
            ext: null,
            label: status.name,
          });
        }
      });
      downloadZipBlob(zip, 'reels-bulk.zip');
      setRec({ on: false, p: 1, mode: null, ext: 'zip', label: null });
    } catch (e) {
      console.error(e);
      setRec({ on: false, p: 0, mode: null, ext: 'error', label: null });
    } finally {
      setBulkBusy(false);
    }
  };

  const onResetAll = () => {
    if (!window.confirm('Reset settings to defaults for this theme?')) return;
    if (useThemeMode) {
      resetThemeTweaks();
    } else {
      resetTweaks();
      resetAllImages();
    }
  };

  const onImportFolder = async (files) => {
    const { count, warnings } = await importFolder(files);
    if (count > 0) closeDrawers();
    if (warnings?.length && count === 0) {
      window.alert(warnings.join('\n'));
    }
  };

  const onImportPack = async (file) => {
    try {
      await importPack(file);
      closeDrawers();
    } catch (e) {
      window.alert(e.message || 'Could not import theme pack');
    }
  };

  const onSelectTheme = (id) => {
    setSelectedThemeId(id);
    setViewMode('editor');
  };

  const dlText = !rec.on
    ? 'Download'
    : rec.mode === 'prep'
      ? 'Preparing…'
      : rec.mode === 'encode'
        ? `Encoding ${Math.round(rec.p * 100)}%`
        : rec.mode === 'record'
          ? `Recording ${Math.round(rec.p * TT.DURATION)}s`
          : rec.mode === 'bulk'
            ? `Bulk ${Math.round(rec.p * 100)}%`
            : 'Working…';

  const downloadNote = rec.on
    ? rec.mode === 'encode'
      ? 'Rendering MP4 — faster than real time.'
      : rec.mode === 'record'
        ? 'Recording in real time — keep tab focused.'
        : rec.mode === 'bulk'
          ? `Bulk export: ${rec.label || 'working'}…`
          : 'Loading photos…'
    : rec.ext === 'mp4'
      ? 'Saved as MP4 ✓'
      : rec.ext === 'webm'
        ? 'Saved as WEBM ✓'
        : rec.ext === 'zip'
          ? 'Bulk ZIP saved ✓'
          : rec.ext === 'error'
            ? 'Export failed — try Chrome or Edge.'
            : built
              ? `Exports a ${Math.round(TT.DURATION)}s · ${W}×${H} MP4.`
              : '';

  const headerName = useThemeMode && selectedTheme
    ? selectedTheme.displayName
    : idea.name;

  const settingsPanelProps = {
    accent,
    downloadLabel: dlText,
    downloadNote,
    recOn: rec.on || bulkBusy,
    onDownload,
    onBulkDownload: hasThemes ? onBulkDownload : undefined,
    bulkDownloadLabel: bulkBusy ? 'Exporting…' : 'Bulk ZIP',
    bulkBusy,
    onResetAll,
    slots,
    setImage,
    resetImage,
    deleteImage,
    restoreImage,
    SettingsControls,
    t,
    setTweak,
    lookNames,
    onClose: closeDrawers,
  };

  const leftSidebar = hasThemes ? (
    <ThemeSidebar
      themes={themes}
      selectedId={selectedThemeId}
      onSelect={onSelectTheme}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onImportFolder={onImportFolder}
      onImportPack={onImportPack}
      onExportPack={exportPack}
      onBulkDownload={onBulkDownload}
      onClearThemes={() => {
        if (window.confirm('Remove all imported themes?')) clearThemes();
      }}
      importWarnings={importWarnings}
      bulkBusy={bulkBusy || rec.on}
      onClose={closeDrawers}
    />
  ) : (
    <Sidebar
      ideas={IDEAS}
      selectedId={selectedIdeaId}
      onSelect={setSelectedIdeaId}
      onImportFolder={onImportFolder}
      onImportPack={onImportPack}
    />
  );

  const showGrid = hasThemes && viewMode === 'grid';

  return (
    <div className="box-border flex h-full w-full gap-4 overflow-hidden bg-[#04060a] p-2 sm:p-4">
      <div className="hidden h-full w-[248px] shrink-0 lg:block">{leftSidebar}</div>

      <Drawer open={leftOpen} onClose={closeDrawers} side="left" title={hasThemes ? 'Themes' : 'Reel ideas'}>
        <div className="h-full p-2">
          {hasThemes ? (
            <ThemeSidebar
              themes={themes}
              selectedId={selectedThemeId}
              onSelect={onSelectTheme}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onImportFolder={onImportFolder}
              onImportPack={onImportPack}
              onExportPack={exportPack}
              onBulkDownload={onBulkDownload}
              onClearThemes={() => {
                if (window.confirm('Remove all imported themes?')) clearThemes();
              }}
              importWarnings={importWarnings}
              bulkBusy={bulkBusy || rec.on}
              onClose={closeDrawers}
            />
          ) : (
            <Sidebar
              ideas={IDEAS}
              selectedId={selectedIdeaId}
              onSelect={setSelectedIdeaId}
              onImportFolder={onImportFolder}
              onImportPack={onImportPack}
              onClose={closeDrawers}
            />
          )}
        </div>
      </Drawer>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#0a0a0a] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55)]">
        <MobileHeader
          ideaName={headerName}
          onOpenIdeas={openLeft}
          onOpenSettings={openRight}
        />
        <div className="relative min-h-0 flex-1 pt-[calc(52px+env(safe-area-inset-top,0px))] lg:pt-0">
          {showGrid ? (
            <BulkPreviewGrid
              themes={themes}
              selectedId={selectedThemeId}
              onSelect={onSelectTheme}
            />
          ) : (
            <Preview t={t} images={images} />
          )}
        </div>
      </main>

      <div className="hidden h-full w-[380px] shrink-0 lg:block">
        <SettingsPanel {...settingsPanelProps} />
      </div>

      <Drawer open={rightOpen} onClose={closeDrawers} side="right" title="Settings">
        <div className="h-full p-2">
          <SettingsPanel {...settingsPanelProps} />
        </div>
      </Drawer>
    </div>
  );
}
