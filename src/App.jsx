import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Drawer from './components/Drawer.jsx';
import MobileHeader from './components/MobileHeader.jsx';
import { useTweaks } from './components/TweaksPanel.jsx';
import { IDEAS, getIdea } from './ideas/registry.js';
import { useImages } from './state/useImages.js';
import { loadSelectedIdea, saveSelectedIdea } from './state/storage.js';
import { preloadAssets, encodeMP4, recordRealtime, downloadBlob } from './reel/export.js';

export default function App() {
  const [selectedIdeaId, setSelectedIdeaId] = useState(() => loadSelectedIdea(IDEAS[0].id));
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const idea = useMemo(() => getIdea(selectedIdeaId), [selectedIdeaId]);
  const [t, setTweak, resetTweaks] = useTweaks(idea.defaults, idea.id);
  const {
    images,
    slots,
    setImage,
    resetImage,
    deleteImage,
    restoreImage,
    resetAllImages,
  } = useImages(idea.imageSlots, idea.id);
  const [rec, setRec] = useState({ on: false, p: 0, mode: null, ext: null });

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
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) closeDrawers();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [closeDrawers]);

  const lookNames = images.looks.map((l) => l.n);

  useEffect(() => {
    if (lookNames.length && t.hero && !lookNames.includes(t.hero)) {
      setTweak('hero', lookNames[lookNames.length - 1]);
    }
  }, [lookNames, t.hero, setTweak]);

  const built = useMemo(() => idea.buildCfg({ t, images }), [idea, t, images]);
  const { cfg, W, H, TT, srcs, accent } = built;
  const Preview = idea.Preview;
  const SettingsControls = idea.SettingsControls;

  const onResetAll = () => {
    if (!window.confirm('Reset all settings and images to defaults?')) return;
    resetTweaks();
    resetAllImages();
  };

  const onDownload = async () => {
    if (rec.on || !images.before) return;
    setRec({ on: true, p: 0, mode: 'prep', ext: null });
    try {
      const exportCfg = { ...cfg };
      exportCfg.imgs = await preloadAssets(cfg.headFam, srcs);
      let blob = null;
      let ext = 'mp4';
      if (window.VideoEncoder) {
        setRec({ on: true, p: 0, mode: 'encode', ext: null });
        blob = await encodeMP4(exportCfg, (p) => setRec((r) => ({ ...r, p })));
      }
      if (blob) {
        downloadBlob(blob, 'mp4');
        ext = 'mp4';
      } else {
        setRec({ on: true, p: 0, mode: 'record', ext: null });
        const res = await recordRealtime(exportCfg, (p) => setRec((r) => ({ ...r, p })));
        downloadBlob(res.blob, res.ext);
        ext = res.ext;
      }
      setRec({ on: false, p: 1, mode: null, ext });
      setTimeout(() => setRec((r) => ({ ...r, ext: null })), 5000);
    } catch (e) {
      console.error(e);
      setRec({ on: false, p: 0, mode: null, ext: 'error' });
    }
  };

  const dlText = !rec.on
    ? 'Download'
    : rec.mode === 'prep'
      ? 'Preparing…'
      : rec.mode === 'encode'
        ? `Encoding ${Math.round(rec.p * 100)}%`
        : rec.mode === 'record'
          ? `Recording ${Math.round(rec.p * TT.DURATION)}s`
          : 'Working…';


  const settingsPanelProps = {
    accent,
    downloadLabel: dlText,
    recOn: rec.on,
    onDownload,
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

  return (
    <div className="box-border flex h-full w-full gap-4 overflow-hidden bg-[#04060a] p-2 sm:p-4">
      {/* Desktop: left sidebar */}
      <div className="hidden h-full w-[248px] shrink-0 lg:block">
        <Sidebar ideas={IDEAS} selectedId={selectedIdeaId} onSelect={setSelectedIdeaId} />
      </div>

      {/* Mobile: left drawer */}
      <Drawer open={leftOpen} onClose={closeDrawers} side="left" title="Reel ideas">
        <div className="h-full p-2">
          <Sidebar
            ideas={IDEAS}
            selectedId={selectedIdeaId}
            onSelect={setSelectedIdeaId}
            onClose={closeDrawers}
          />
        </div>
      </Drawer>

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#0a0a0a] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55)]">
        <MobileHeader
          ideaName={idea.name}
          onOpenIdeas={openLeft}
          onOpenSettings={openRight}
        />
        <div className="relative min-h-0 flex-1 pt-[calc(52px+env(safe-area-inset-top,0px))] lg:pt-0">
          <Preview t={t} images={images} />
        </div>
      </main>

      {/* Desktop: right settings */}
      <div className="hidden h-full w-[380px] shrink-0 lg:block">
        <SettingsPanel {...settingsPanelProps} />
      </div>

      {/* Mobile: right drawer */}
      <Drawer open={rightOpen} onClose={closeDrawers} side="right" title="Settings">
        <div className="h-full p-2">
          <SettingsPanel {...settingsPanelProps} />
        </div>
      </Drawer>
    </div>
  );
}
