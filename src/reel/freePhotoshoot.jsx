import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '../engine/animations.jsx';
import {
  TweakSection,
  TweakRadio,
  TweakColor,
  TweakColorField,
  TweakSelect,
  TweakSlider,
  TweakText,
  TweakRow,
} from '../components/TweaksPanel.jsx';
import {
  DEFAULT_BEFORE_SRC,
  LOOKS,
  RATIOS,
  PALETTES,
  LOGO_SRC,
  LOGO_GLOW_SRC,
} from './config.js';
import { buildPaletteFromTweaks } from './paletteUtils.js';
import { ALL_FONTS } from './fontUtils.js';
import { drawFpReel, buildFPFR, scenesOf, durationOf } from './fpDraw.js';
import { fpPreloadAssets } from './fpExport.js';

export const FP_TWEAK_DEFAULTS = {
  ratio: '9:16',
  palette: 'brand',
  accent: '#b4d8ff',
  textColor: '#ffffff',
  bgColor: '#0c0a10',
  offerBg: '#f4f7fb',
  transStyle: 'Dissolve',
  sceneTrans: 0.6,
  s2sweep: 5.2,
  s4layout: '2 × 3 grid',
  s4textColor: '#ffffff',
  s4bg: '#f2f2f3',
  s5S1: 'Middle',
  s5S2: 'Middle',
  s5S3: 'Bottom',
  s6S1: 'Middle',
  s6S2: 'Middle',
  s6S3: 'Bottom',
  d1: 3.5,
  d2: 6.5,
  d3: 10,
  d4: 8.5,
  d5: 9.5,
  d6: 10,
  kicker: 'RarestPrompt',
  s1line1: 'We gave this photoshoot',
  s1line2: 'for FREE',
  s2text: "Phone photos aren't enough for memories like these.",
  s3text: 'Studio-grade photoshoot. Zero cost.',
  s4text: 'Real babies. Real families. Real magic.',
  s5line1: 'Join the RarestPrompt Community',
  s5line2: 'Every week, 2–3 families get a FREE professional photoshoot.',
  s5line3: 'Limited slots · No hidden cost',
  s6head: 'Grab your FREE slot this week',
  s6sub: 'Link in bio · Limited seats every Sunday',
  s6btn: 'Join the Community  →',
  fontDisplay: 'Default',
  sizeDisplay: 100,
  fontSerif: 'Cormorant Garamond',
  sizeSerif: 120,
  fontBody: 'Lora',
  sizeBody: 90,
  fontLabel: 'Default',
  sizeLabel: 95,
};

const GALLERY_LOOKS = LOOKS.map((look, i) => ({
  key: `gallery-${i}`,
  name: look.n,
  defaultSrc: look.src,
}));

const imageSlots = {
  before: { key: 'before', label: 'Phone photo', defaultSrc: DEFAULT_BEFORE_SRC },
  looks: [
    { key: 'hook', name: 'Hook photo', defaultSrc: DEFAULT_BEFORE_SRC },
    { key: 'studio', name: 'Studio (split right)', defaultSrc: '/uploads/4.png' },
    ...GALLERY_LOOKS,
  ],
};

const SCENE_NAMES = ['Hook', 'Problem', 'Reveal', 'Gallery', 'Offer', 'CTA'];
const SLOT_OPTS = ['Top', 'Middle', 'Bottom'];

function resolveFpImages(images) {
  const byKey = Object.fromEntries((images.looks || []).map((l) => [l.key, l]));
  const hookImg = byKey.hook?.src || images.before;
  const s2studio = byKey.studio?.src || '/uploads/4.png';
  const pool = (images.looks || [])
    .filter((l) => !['hook', 'studio'].includes(l.key))
    .map((l) => l.src)
    .filter(Boolean);
  const reveal = pool.length >= 3 ? pool.slice(0, 3) : [...pool, ...pool, ...pool].slice(0, 3);
  const gallery = pool.length >= 6 ? pool.slice(0, 6) : [...pool, ...pool].slice(0, 6);
  return { hookImg, s2studio, pool, reveal, gallery };
}

function buildCfg({ t, images }) {
  const { hookImg, s2studio, pool, reveal, gallery } = resolveFpImages(images);
  const pal = buildPaletteFromTweaks(t, PALETTES);
  const dims = RATIOS[t.ratio] || RATIOS['9:16'];
  const W = dims[0];
  const H = dims[1];
  const tt = { ...t, hookImg, s2studio };
  const scenes = scenesOf(tt);
  const srcs = [
    LOGO_SRC,
    LOGO_GLOW_SRC,
    images.before,
    hookImg,
    s2studio,
    ...pool,
  ].filter(Boolean);

  return {
    cfg: {
      W,
      H,
      t: tt,
      pal,
      FR: buildFPFR(tt),
      scenes,
      offerBg: t.offerBg || '#ffffff',
      beforeSrc: images.before,
      pool,
      reveal,
      gallery,
    },
    W,
    H,
    TT: { DURATION: durationOf(tt) },
    srcs,
    accent: pal.accent,
  };
}

function Preview({ t, images }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [imgsReady, setImgsReady] = useState(false);
  const timeRef = useRef(0);
  const cfgRef = useRef(null);
  const playRef = useRef(true);

  const built = useMemo(() => {
    if (!images?.before) return null;
    return buildCfg({ t, images });
  }, [t, images]);

  const W = built?.W || 1080;
  const H = built?.H || 1920;
  const D = built?.TT?.DURATION || 50;

  playRef.current = playing;

  useEffect(() => {
    if (!built) return undefined;
    let cancelled = false;
    setImgsReady(false);
    fpPreloadAssets(t, built.srcs).then((imgs) => {
      if (cancelled) return;
      cfgRef.current = { ...built.cfg, imgs };
      setImgsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [built, t]);

  useEffect(() => {
    const fit = () => {
      const cv = canvasRef.current;
      const wrap = wrapRef.current;
      if (!cv || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const sc = Math.min((rect.width - 8) / W, (rect.height - 8) / H, 1);
      cv.style.width = `${W * sc}px`;
      cv.style.height = `${H * sc}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [W, H]);

  useEffect(() => {
    if (!imgsReady) return undefined;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (playRef.current) {
        let nt = timeRef.current + dt;
        if (nt >= D) nt = 0;
        timeRef.current = nt;
        setTime(nt);
      }
      const cv = canvasRef.current;
      const cfg = cfgRef.current;
      if (cv && cfg?.imgs) {
        drawFpReel(cv.getContext('2d'), clamp(timeRef.current, 0, D - 0.001), cfg);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [D, imgsReady]);

  const curScene = (scenesOf(t).find((s) => time >= s.start && time < s.end) || { i: 5 }).i;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  if (!images?.before) {
    return (
      <div className="flex h-full items-center justify-center bg-[#04060a] font-[Jost,sans-serif] text-sm text-white/50">
        Upload a phone photo to preview the reel.
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col bg-[#04060a]">
      <div
        ref={wrapRef}
        className="flex min-h-0 flex-1 items-center justify-center p-2"
        onClick={() => setPlaying((p) => !p)}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="cursor-pointer rounded shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
          aria-label="Free photoshoot reel preview"
        />
      </div>
      <div className="shrink-0 border-t border-white/[0.08] px-4 py-3">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#b4d8ff] text-[#04121f]"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <input
            className="min-w-0 flex-1 accent-[#b4d8ff]"
            type="range"
            min={0}
            max={D}
            step={0.01}
            value={clamp(time, 0, D)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              timeRef.current = v;
              setTime(v);
            }}
          />
          <span className="shrink-0 font-[Jost,sans-serif] text-[11px] tabular-nums text-white/70">
            {fmt(time)} / {fmt(D)}
          </span>
          <div className="hidden flex-wrap gap-1 sm:flex">
            {SCENE_NAMES.map((n, i) => (
              <span
                key={n}
                className={`rounded-full px-2 py-0.5 font-[Jost,sans-serif] text-[9px] tracking-wide ${
                  i === curScene ? 'bg-[#b4d8ff] text-[#04121f]' : 'bg-white/[0.06] text-white/55'
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsControls({ t, setTweak }) {
  const totalDur = durationOf(t).toFixed(1);

  return (
    <>
      <TweakSection label="Format & palette" />
      <TweakRadio label="Aspect ratio" value={t.ratio} options={['9:16', '4:5', '1:1', '16:9']} onChange={(v) => setTweak('ratio', v)} />
      <TweakSelect label="Palette" value={t.palette} options={['brand', 'ocean', 'midnight']} onChange={(v) => setTweak('palette', v)} />
      <TweakColor label="Accent" value={t.accent} options={['#b4d8ff', '#0047cc', '#002b4d', '#ffffff']} onChange={(v) => setTweak('accent', v)} />
      <TweakColorField label="Accent (custom)" value={t.accent} onChange={(v) => setTweak('accent', v)} />
      <TweakColor label="Background" value={t.bgColor} options={['#002b4d', '#021a33', '#0c0a10', '#0047cc']} onChange={(v) => setTweak('bgColor', v)} />
      <TweakColorField label="Background (custom)" value={t.bgColor} onChange={(v) => setTweak('bgColor', v)} />
      <TweakColor label="Text color" value={t.textColor} options={['#ffffff', '#b4d8ff', '#002b4d', '#e0bd6e']} onChange={(v) => setTweak('textColor', v)} />
      <TweakColorField label="Text color (custom)" value={t.textColor} onChange={(v) => setTweak('textColor', v)} />
      <TweakColor label="Offer-card background" value={t.offerBg} options={['#ffffff', '#f4f7fb', '#b4d8ff', '#002b4d']} onChange={(v) => setTweak('offerBg', v)} />

      <TweakSection label="Transitions & pacing" />
      <TweakRadio label="Transition" value={t.transStyle} options={['Dissolve', 'Slide', 'Cut']} onChange={(v) => setTweak('transStyle', v)} />
      <TweakSlider label="Transition length" value={t.sceneTrans} min={0.1} max={1.4} step={0.05} unit="s" onChange={(v) => setTweak('sceneTrans', v)} />
      <TweakSlider label="Scene 2 · comparison sweep" value={t.s2sweep} min={1} max={6} step={0.2} unit="s" onChange={(v) => setTweak('s2sweep', v)} />
      <TweakRow label="Total length" value={`${totalDur}s`}>
        <div className="h-0.5" />
      </TweakRow>
      <TweakSlider label="1 · Hook" value={t.d1} min={2} max={8} step={0.5} unit="s" onChange={(v) => setTweak('d1', v)} />
      <TweakSlider label="2 · Problem" value={t.d2} min={3} max={12} step={0.5} unit="s" onChange={(v) => setTweak('d2', v)} />
      <TweakSlider label="3 · Reveal" value={t.d3} min={6} max={22} step={0.5} unit="s" onChange={(v) => setTweak('d3', v)} />
      <TweakSlider label="4 · Gallery" value={t.d4} min={6} max={22} step={0.5} unit="s" onChange={(v) => setTweak('d4', v)} />
      <TweakSlider label="5 · Offer" value={t.d5} min={4} max={16} step={0.5} unit="s" onChange={(v) => setTweak('d5', v)} />
      <TweakSlider label="6 · CTA" value={t.d6} min={4} max={16} step={0.5} unit="s" onChange={(v) => setTweak('d6', v)} />

      <TweakSection label="Scene 1 · Hook" />
      <TweakText label="Line 1" value={t.s1line1} onChange={(v) => setTweak('s1line1', v)} />
      <TweakText label="Payoff line" value={t.s1line2} onChange={(v) => setTweak('s1line2', v)} />

      <TweakSection label="Scene 2 · Problem" />
      <TweakText label="Line" value={t.s2text} onChange={(v) => setTweak('s2text', v)} />

      <TweakSection label="Scene 3 · Reveal" />
      <TweakText label="Headline (word-by-word)" value={t.s3text} onChange={(v) => setTweak('s3text', v)} />

      <TweakSection label="Scene 4 · Gallery" />
      <TweakSelect
        label="Grid layout"
        value={t.s4layout}
        options={['2 × 3 grid', '2 × 2 grid', '3 × 3 grid', '3 × 4 grid', 'Bento', 'Sliding columns', 'Sliding rows']}
        onChange={(v) => setTweak('s4layout', v)}
      />
      <TweakColor label="Scene background" value={t.s4bg} options={['#002b4d', '#021a33', '#0c0a10', '#0047cc', '#ffffff']} onChange={(v) => setTweak('s4bg', v)} />
      <TweakColorField label="Scene background (custom)" value={t.s4bg} onChange={(v) => setTweak('s4bg', v)} />
      <TweakColor label="Caption text color" value={t.s4textColor} options={['#ffffff', '#b4d8ff', '#e0bd6e', '#002b4d']} onChange={(v) => setTweak('s4textColor', v)} />
      <TweakColorField label="Caption text (custom)" value={t.s4textColor} onChange={(v) => setTweak('s4textColor', v)} />
      <TweakText label="Line" value={t.s4text} onChange={(v) => setTweak('s4text', v)} />

      <TweakSection label="Scene 5 · Offer" />
      <TweakSelect label="1 · Logo + wordmark" value={t.s5S1 || 'Middle'} options={SLOT_OPTS} onChange={(v) => setTweak('s5S1', v)} />
      <TweakSelect label="2 · Community headline" value={t.s5S2 || 'Middle'} options={SLOT_OPTS} onChange={(v) => setTweak('s5S2', v)} />
      <TweakSelect label="3 · Offer details" value={t.s5S3 || 'Bottom'} options={SLOT_OPTS} onChange={(v) => setTweak('s5S3', v)} />
      <TweakText label="Line 1" value={t.s5line1} onChange={(v) => setTweak('s5line1', v)} />
      <TweakText label="Line 2" value={t.s5line2} onChange={(v) => setTweak('s5line2', v)} />
      <TweakText label="Line 3" value={t.s5line3} onChange={(v) => setTweak('s5line3', v)} />

      <TweakSection label="Scene 6 · CTA" />
      <TweakSelect label="1 · Logo + wordmark" value={t.s6S1 || 'Middle'} options={SLOT_OPTS} onChange={(v) => setTweak('s6S1', v)} />
      <TweakSelect label="2 · Headline" value={t.s6S2 || 'Middle'} options={SLOT_OPTS} onChange={(v) => setTweak('s6S2', v)} />
      <TweakSelect label="3 · Link + button" value={t.s6S3 || 'Bottom'} options={SLOT_OPTS} onChange={(v) => setTweak('s6S3', v)} />
      <TweakText label="Wordmark" value={t.kicker} onChange={(v) => setTweak('kicker', v)} />
      <TweakText label="Headline" value={t.s6head} onChange={(v) => setTweak('s6head', v)} />
      <TweakText label="Sub-text" value={t.s6sub} onChange={(v) => setTweak('s6sub', v)} />
      <TweakText label="Button" value={t.s6btn} onChange={(v) => setTweak('s6btn', v)} />

      <TweakSection label="Text · fonts & sizes" />
      <TweakSelect label="Display font" value={t.fontDisplay || 'Default'} options={['Default', ...ALL_FONTS]} onChange={(v) => setTweak('fontDisplay', v)} />
      <TweakSlider label="Display size" value={t.sizeDisplay} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeDisplay', v)} />
      <TweakSelect label="Serif font" value={t.fontSerif || 'Default'} options={['Default', ...ALL_FONTS]} onChange={(v) => setTweak('fontSerif', v)} />
      <TweakSlider label="Serif size" value={t.sizeSerif} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeSerif', v)} />
      <TweakSelect label="Body font" value={t.fontBody || 'Default'} options={['Default', ...ALL_FONTS]} onChange={(v) => setTweak('fontBody', v)} />
      <TweakSlider label="Body size" value={t.sizeBody} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeBody', v)} />
      <TweakSelect label="Label font" value={t.fontLabel || 'Default'} options={['Default', ...ALL_FONTS]} onChange={(v) => setTweak('fontLabel', v)} />
      <TweakSlider label="Label size" value={t.sizeLabel} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeLabel', v)} />
    </>
  );
}

export const freePhotoshootIdea = {
  id: 'free-photoshoot',
  name: 'Free Photoshoot',
  description: 'Hook → problem → reveal → gallery → offer → CTA marketing reel.',
  exportKind: 'canvas',
  defaults: FP_TWEAK_DEFAULTS,
  imageSlots,
  Preview,
  SettingsControls,
  buildCfg,
};
