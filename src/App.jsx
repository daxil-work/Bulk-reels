import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { useTweaks } from './components/TweaksPanel.jsx';
import { IDEAS, getIdea } from './ideas/registry.js';
import { useImages } from './state/useImages.js';
import { loadSelectedIdea, saveSelectedIdea } from './state/storage.js';
import { preloadAssets, encodeMP4, recordRealtime, downloadBlob } from './reel/export.js';

export default function App() {
  const [selectedIdeaId, setSelectedIdeaId] = useState(() => loadSelectedIdea(IDEAS[0].id));
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

  useEffect(() => {
    saveSelectedIdea(selectedIdeaId);
  }, [selectedIdeaId]);

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
    ? 'Download video'
    : rec.mode === 'prep'
      ? 'Preparing…'
      : rec.mode === 'encode'
        ? `Encoding ${Math.round(rec.p * 100)}%`
        : rec.mode === 'record'
          ? `Recording ${Math.round(rec.p * TT.DURATION)}s`
          : 'Working…';

  const noteText = rec.on
    ? rec.mode === 'encode'
      ? 'Rendering a true MP4 — this is faster than real time, please wait.'
      : rec.mode === 'record'
        ? 'Recording in real time — keep this tab focused.'
        : 'Loading photos…'
    : !images.before
      ? 'Add a Before photo to export.'
      : rec.ext === 'mp4'
        ? 'Saved as MP4 — full length, ready for Instagram.'
        : rec.ext === 'webm'
          ? "Saved as WEBM (browser couldn't encode MP4)."
          : rec.ext === 'error'
            ? 'Export failed — try Chrome or Edge.'
            : `Exports a ${Math.round(TT.DURATION)}s · ${W}×${H} MP4.`;

  return (
    <div className="box-border flex h-full w-full gap-4 overflow-hidden bg-[#04060a] p-4">
      <Sidebar ideas={IDEAS} selectedId={selectedIdeaId} onSelect={setSelectedIdeaId} />

      <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl bg-[#0a0a0a] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55)]">
        <Preview t={t} images={images} />
      </main>

      <SettingsPanel
        accent={accent}
        downloadLabel={dlText}
        downloadNote={noteText}
        recOn={rec.on}
        onDownload={onDownload}
        onResetAll={onResetAll}
        slots={slots}
        setImage={setImage}
        resetImage={resetImage}
        deleteImage={deleteImage}
        restoreImage={restoreImage}
        SettingsControls={SettingsControls}
        t={t}
        setTweak={setTweak}
        lookNames={lookNames}
      />
    </div>
  );
}
