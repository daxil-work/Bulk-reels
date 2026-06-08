import React, { useState } from 'react';
import { Stage, Sprite, clamp } from '../engine/animations.jsx';
import {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakColor,
  TweakSelect,
  TweakSlider,
  TweakText,
} from '../components/TweaksPanel.jsx';
import {
  BEFORE_SRC,
  LOOKS,
  RATIOS,
  PALETTES,
  TWEAK_DEFAULTS,
  timings,
} from './config.js';
import {
  Atmosphere,
  FullShot,
  ShotLabel,
  Transition,
  TitleCard,
  EndCard,
  CollectionLabel,
  ScreenLabeler,
} from './scenes.jsx';
import { preloadAssets, encodeMP4, recordRealtime, downloadBlob } from './export.js';

export default function ReelApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [rec, setRec] = useState({ on: false, p: 0, mode: null, ext: null });
  const base = PALETTES[t.palette] || PALETTES.brand;
  const pal = { ...base, accent: t.accent || base.accent };
  const headFam = t.headlineFont === 'Jost' ? 'Jost' : 'Cormorant Garamond';
  const fonts = { serif: `'${headFam}', serif`, sans: "'Jost', sans-serif" };

  const hero = LOOKS.find((l) => l.n === t.hero) || LOOKS[LOOKS.length - 1];
  const montage = LOOKS.filter((l) => l.n !== hero.n);
  const amt = clamp((t.motion == null ? 6 : t.motion) / 100, 0, 0.4);
  const kbIn = [1.03, 1.03 + amt];
  const kbOut = [1.03 + amt, 1.03];
  const TT = timings(t);
  const dims = RATIOS[t.ratio] || RATIOS['9:16'];
  const RW = dims[0];
  const RH = dims[1];

  const onDownload = async () => {
    if (rec.on) return;
    const cfg = { pal, hero, montage, t, headFam, TT, W: RW, H: RH };
    setRec({ on: true, p: 0, mode: 'prep', ext: null });
    try {
      cfg.imgs = await preloadAssets(headFam);
      let blob = null;
      let ext = 'mp4';
      if (window.VideoEncoder) {
        setRec({ on: true, p: 0, mode: 'encode', ext: null });
        blob = await encodeMP4(cfg, (p) => setRec((r) => ({ ...r, p })));
      }
      if (blob) {
        downloadBlob(blob, 'mp4');
        ext = 'mp4';
      } else {
        setRec({ on: true, p: 0, mode: 'record', ext: null });
        const res = await recordRealtime(cfg, (p) => setRec((r) => ({ ...r, p })));
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
    : rec.ext === 'mp4'
      ? 'Saved as MP4 ✓ — full length, ready for Instagram.'
      : rec.ext === 'webm'
        ? "Saved as WEBM ✓ (browser couldn't encode MP4)."
        : rec.ext === 'error'
          ? 'Export failed — try Chrome or Edge.'
          : ``;

  return (
    <>
      <Stage width={RW} height={RH} duration={TT.DURATION} background={pal.bg} persistKey="reel-v3">
        <ScreenLabeler />
        <Atmosphere pal={pal} />

        <Sprite start={TT.title[0]} end={TT.title[1]}>
          <TitleCard pal={pal} fonts={fonts} t={t} />
        </Sprite>

        <Sprite start={TT.before[0]} end={TT.before[1]}>
          <FullShot
            src={BEFORE_SRC}
            filter="saturate(0.5) brightness(0.94) contrast(1.03)"
            kbFrom={kbIn[0]}
            kbTo={kbIn[1]}
            posY="22%"
          />
        </Sprite>
        <Sprite start={TT.bLabel[0]} end={TT.bLabel[1]}>
          <ShotLabel label={t.beforeLabel} sub={t.beforeSub} pal={pal} fonts={fonts} accent={false} />
        </Sprite>

        <Sprite start={TT.trans[0]} end={TT.trans[1]}>
          <Transition pal={pal} type={t.transition} />
        </Sprite>

        <Sprite start={TT.after[0]} end={TT.after[1]}>
          <FullShot src={hero.src} kbFrom={kbOut[0]} kbTo={kbOut[1]} posY="24%" />
        </Sprite>
        <Sprite start={TT.after[0] + 0.25} end={TT.after[1] - 0.35}>
          <CollectionLabel
            pal={pal}
            fonts={fonts}
            count={LOOKS.length}
            themeName={t.themeName}
          />
        </Sprite>

        {montage.map((l, i) => {
          const shotStart = TT.mStart + i * TT.mStep;
          const shotEnd = shotStart + TT.mDur;
          const labelStart = shotStart + 0.25;
          const labelEnd = shotEnd - 0.35;
          return (
            <React.Fragment key={l.n}>
              <Sprite start={shotStart} end={shotEnd}>
                <FullShot
                  src={l.src}
                  kbFrom={(i % 2 ? kbOut : kbIn)[0]}
                  kbTo={(i % 2 ? kbOut : kbIn)[1]}
                  posY="22%"
                  z={2 + (i % 2)}
                />
              </Sprite>
              <Sprite start={labelStart} end={labelEnd}>
                <CollectionLabel
                  pal={pal}
                  fonts={fonts}
                  count={LOOKS.length}
                  themeName={t.themeName}
                />
              </Sprite>
            </React.Fragment>
          );
        })}

        <Sprite start={TT.end[0]} end={TT.end[1]}>
          <EndCard pal={pal} fonts={fonts} t={t} />
        </Sprite>
      </Stage>

      <button
        type="button"
        onClick={onDownload}
        disabled={rec.on}
        style={{ background: pal.accent }}
        className="fixed top-4 left-4 z-[2147483647] inline-flex items-center gap-2.5 rounded-full border-0 px-[18px] py-[11px] font-[Jost,sans-serif] text-sm font-medium tracking-[0.08em] text-[#04121f] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] transition-[transform,filter] duration-150 hover:-translate-y-px hover:brightness-[1.06] disabled:cursor-default disabled:opacity-[0.92]"
      >
        {rec.on ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <circle cx="12" cy="12" r="9" stroke="rgba(4,18,31,0.3)" strokeWidth="3" />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="#04121f" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5"
              stroke="#04121f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              stroke="#04121f"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {dlText}
      </button>
      <div className="fixed top-[58px] left-4 z-[2147483647] max-w-[240px] font-[Jost,sans-serif] text-[11px] leading-[1.45] tracking-[0.04em] text-white/60 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
        {noteText}
      </div>

      <TweaksPanel>
        <TweakSection label="Format" />
        <TweakRadio label="Aspect ratio" value={t.ratio} options={['9:16', '4:5', '1:1', '16:9']} onChange={(v) => setTweak('ratio', v)} />

        <TweakSection label="Theme" />
        <TweakRadio
          label="Palette"
          value={t.palette}
          options={['brand', 'ocean', 'midnight', 'maroon']}
          onChange={(v) => setTweak('palette', v)}
        />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={['#b4d8ff', '#0047cc', '#002b4d', '#ffffff', '#e0bd6e']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakRadio
          label="Headline font"
          value={t.headlineFont}
          options={['Cormorant Garamond', 'Jost']}
          onChange={(v) => setTweak('headlineFont', v)}
        />

        <TweakSection label="Pacing & transition" />
        <TweakSelect
          label="Before→After transition"
          value={t.transition}
          options={['shimmer', 'flash', 'dissolve', 'bloom']}
          onChange={(v) => setTweak('transition', v)}
        />
        <TweakSlider
          label="Transition length"
          value={t.transLen}
          min={0.4}
          max={3}
          step={0.1}
          unit="s"
          onChange={(v) => setTweak('transLen', v)}
        />
        <TweakSlider
          label="Look duration (each photo)"
          value={t.montagePace}
          min={0.8}
          max={3.5}
          step={0.1}
          unit="s"
          onChange={(v) => setTweak('montagePace', v)}
        />
        <TweakSlider
          label="Image zoom motion"
          value={t.motion}
          min={0}
          max={18}
          step={1}
          unit="%"
          onChange={(v) => setTweak('motion', v)}
        />

        <TweakSection label="Opening" />
        <TweakText label="Kicker" value={t.kicker} onChange={(v) => setTweak('kicker', v)} />
        <TweakText label="Hook line 1" value={t.hook1} onChange={(v) => setTweak('hook1', v)} />
        <TweakText label="Hook line 2" value={t.hook2} onChange={(v) => setTweak('hook2', v)} />
        <TweakText label="Theme name (bottom)" value={t.themeName} onChange={(v) => setTweak('themeName', v)} />

        <TweakSection label="Before / After" />
        <TweakText label="Before label" value={t.beforeLabel} onChange={(v) => setTweak('beforeLabel', v)} />
        <TweakText label="Before sub" value={t.beforeSub} onChange={(v) => setTweak('beforeSub', v)} />
        <TweakText label="After label" value={t.afterLabel} onChange={(v) => setTweak('afterLabel', v)} />

        <TweakSection label="End card" />
        <TweakText label="Title" value={t.endTitle} onChange={(v) => setTweak('endTitle', v)} />
        <TweakText label="Tagline" value={t.endTagline} onChange={(v) => setTweak('endTagline', v)} />
        <TweakText label="URL" value={t.endUrl} onChange={(v) => setTweak('endUrl', v)} />
      </TweaksPanel>
    </>
  );
}
