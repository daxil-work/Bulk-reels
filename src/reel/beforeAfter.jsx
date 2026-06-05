import React from 'react';
import { Stage, Sprite, clamp } from '../engine/animations.jsx';
import {
  TweakSection,
  TweakRadio,
  TweakColor,
  TweakColorField,
  TweakSelect,
  TweakSlider,
  TweakText,
  TweakToggle,
} from '../components/TweaksPanel.jsx';
import {
  DEFAULT_BEFORE_SRC,
  LOOKS,
  RATIOS,
  PALETTES,
  TWEAK_DEFAULTS,
  HEAD_FONTS,
  BODY_FONTS,
  LOGO_SRC,
  LOGO_GLOW_SRC,
  timings,
} from './config.js';
import { buildPaletteFromTweaks } from './paletteUtils.js';
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

const imageSlots = {
  before: { key: 'before', label: 'Before photo', defaultSrc: DEFAULT_BEFORE_SRC },
  looks: LOOKS.map((look, i) => ({
    key: `look-${i}`,
    name: look.n,
    defaultSrc: look.src,
  })),
};

function resolveLooks(images) {
  return images.looks.map((l) => ({ n: l.n, src: l.src }));
}

function buildPalette(t) {
  return buildPaletteFromTweaks(t, PALETTES);
}

function buildFonts(t) {
  const headFam = HEAD_FONTS.includes(t.headlineFont) ? t.headlineFont : 'Cormorant Garamond';
  const bodyFam = BODY_FONTS.includes(t.bodyFont) ? t.bodyFont : 'Jost';
  return {
    headFam,
    bodyFam,
    fonts: { serif: `'${headFam}', serif`, sans: `'${bodyFam}', sans-serif` },
  };
}

function buildMotion(t) {
  const amt = clamp((t.motion == null ? 6 : t.motion) / 100, 0, 0.4);
  return {
    kbIn: [1.03, 1.03 + amt],
    kbOut: [1.03 + amt, 1.03],
  };
}

function Preview({ t, images }) {
  const pal = buildPalette(t);
  const { fonts } = buildFonts(t);
  const looks = resolveLooks(images);
  if (!looks.length || !images.before) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0a] font-[Jost,sans-serif] text-sm text-white/50">
        {!images.before ? 'Upload a Before photo to preview the reel.' : 'Add at least one look to preview the reel.'}
      </div>
    );
  }
  const hero = looks.find((l) => l.n === t.hero) || looks[looks.length - 1];
  const montage = looks.filter((l) => l.n !== hero.n);
  const { kbIn, kbOut } = buildMotion(t);
  const TT = timings(t, montage.length);
  const dims = RATIOS[t.ratio] || RATIOS['9:16'];
  const RW = dims[0];
  const RH = dims[1];
  const imageAnim = t.imageAnim || 'Ken Burns';
  const labelAnim = t.labelAnim || 'Rise';
  const labelPos = t.labelPos || 'Bottom left';

  return (
    <Stage width={RW} height={RH} duration={TT.DURATION} background={pal.bg} persistKey="reel-v3">
      <ScreenLabeler />
      <Atmosphere pal={pal} TT={TT} />

      <Sprite start={TT.title[0]} end={TT.title[1]}>
        <TitleCard pal={pal} fonts={fonts} t={t} />
      </Sprite>

      <Sprite start={TT.before[0]} end={TT.before[1]}>
        <FullShot
          src={images.before}
          filter="saturate(0.5) brightness(0.94) contrast(1.03)"
          kbFrom={kbIn[0]}
          kbTo={kbIn[1]}
          posY="22%"
          anim={imageAnim}
          z={2}
          fadeIn={0.6}
          fadeOut={0}
        />
      </Sprite>
      <Sprite start={TT.bLabel[0]} end={TT.bLabel[1]}>
        <ShotLabel
          label={t.beforeLabel}
          sub={t.beforeSub}
          pal={pal}
          fonts={fonts}
          accent={false}
          anim={labelAnim}
          pos={labelPos}
        />
      </Sprite>

      <Sprite start={TT.trans[0]} end={TT.trans[1]}>
        <Transition pal={pal} type={t.transition} />
      </Sprite>

      <Sprite start={TT.after[0]} end={TT.after[1]}>
        <FullShot
          src={hero.src}
          kbFrom={kbOut[0]}
          kbTo={kbOut[1]}
          posY="24%"
          anim={imageAnim}
          z={3}
          fadeIn={0.6}
          fadeOut={0}
        />
      </Sprite>
      <Sprite start={TT.aLabel[0]} end={TT.aLabel[1]}>
        <ShotLabel
          label={t.afterLabel}
          sub={hero.n}
          pal={pal}
          fonts={fonts}
          accent
          anim={labelAnim}
          pos={labelPos}
        />
      </Sprite>

      {montage.map((l, i) => (
        <Sprite key={l.n} start={TT.mStart + i * TT.mStep} end={TT.mStart + i * TT.mStep + TT.mDur}>
          <FullShot
            src={l.src}
            kbFrom={(i % 2 ? kbOut : kbIn)[0]}
            kbTo={(i % 2 ? kbOut : kbIn)[1]}
            posY="22%"
            z={4 + i}
            anim={imageAnim}
            fadeIn={0.6}
            fadeOut={i === montage.length - 1 ? 0.7 : 0}
          />
        </Sprite>
      ))}
      <Sprite start={TT.cLabel[0]} end={TT.cLabel[1]}>
        <CollectionLabel
          pal={pal}
          fonts={fonts}
          count={looks.length}
          anim={labelAnim}
          pos={labelPos}
        />
      </Sprite>

      <Sprite start={TT.end[0]} end={TT.end[1]}>
        <EndCard pal={pal} fonts={fonts} t={t} />
      </Sprite>
    </Stage>
  );
}

function SettingsControls({ t, setTweak, lookNames }) {
  return (
    <>
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
      <TweakColorField label="Accent (custom)" value={t.accent} onChange={(v) => setTweak('accent', v)} />
      <TweakColor
        label="Background"
        value={t.bgColor || '#002b4d'}
        options={['#002b4d', '#0047cc', '#001226', '#0c0a10', '#1a070c']}
        onChange={(v) => setTweak('bgColor', v)}
      />
      <TweakColorField label="Background (custom)" value={t.bgColor || '#002b4d'} onChange={(v) => setTweak('bgColor', v)} />
      <TweakColor
        label="Text color"
        value={t.textColor || '#ffffff'}
        options={['#ffffff', '#b4d8ff', '#002b4d', '#13243a', '#e0bd6e']}
        onChange={(v) => setTweak('textColor', v)}
      />
      <TweakColorField label="Text color (custom)" value={t.textColor || '#ffffff'} onChange={(v) => setTweak('textColor', v)} />
      <TweakSelect
        label="Headline font"
        value={t.headlineFont}
        options={HEAD_FONTS}
        onChange={(v) => setTweak('headlineFont', v)}
      />
      <TweakSelect label="Body font" value={t.bodyFont} options={BODY_FONTS} onChange={(v) => setTweak('bodyFont', v)} />

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
      <TweakSelect label="Featured 'After' look" value={t.hero} options={lookNames} onChange={(v) => setTweak('hero', v)} />

      <TweakSection label="Entrance animations" />
      <TweakSelect
        label="Image transition"
        value={t.imageAnim}
        options={['Ken Burns', 'Zoom in', 'Zoom out', 'Fade', 'Slide left', 'Slide right', 'Slide up', 'Slide down', 'Blur in', 'Pan up', 'Spin in', 'Zoom blur']}
        onChange={(v) => setTweak('imageAnim', v)}
      />
      <TweakSelect
        label="Label transition"
        value={t.labelAnim}
        options={['Rise', 'Fade', 'Slide', 'Drop', 'Pop', 'Blur', 'Expand', 'Bounce', 'Flip', 'Wipe']}
        onChange={(v) => setTweak('labelAnim', v)}
      />
      <TweakSelect
        label="Label position"
        value={t.labelPos}
        options={['Bottom left', 'Bottom center', 'Bottom right', 'Top left', 'Top center', 'Center']}
        onChange={(v) => setTweak('labelPos', v)}
      />

      <TweakSection label="Opening" />
      <TweakToggle label="Show logo" value={t.showLogo !== false} onChange={(v) => setTweak('showLogo', v)} />
      <TweakText label="Wordmark" value={t.kicker} onChange={(v) => setTweak('kicker', v)} />
      <TweakText label="Hook line 1" value={t.hook1} onChange={(v) => setTweak('hook1', v)} />
      <TweakText label="Hook line 2" value={t.hook2} onChange={(v) => setTweak('hook2', v)} />
      <TweakText label="Theme name (bottom)" value={t.themeName} onChange={(v) => setTweak('themeName', v)} />
      <TweakSelect label="1 · Logo + wordmark" value={t.titleS1 || 'Middle'} options={['Top', 'Middle', 'Bottom']} onChange={(v) => setTweak('titleS1', v)} />
      <TweakSelect label="2 · Headline" value={t.titleS2 || 'Middle'} options={['Top', 'Middle', 'Bottom']} onChange={(v) => setTweak('titleS2', v)} />
      <TweakSelect label="3 · Theme name" value={t.titleS3 || 'Bottom'} options={['Top', 'Middle', 'Bottom']} onChange={(v) => setTweak('titleS3', v)} />

      <TweakSection label="Before / After" />
      <TweakText label="Before label" value={t.beforeLabel} onChange={(v) => setTweak('beforeLabel', v)} />
      <TweakText label="Before sub" value={t.beforeSub} onChange={(v) => setTweak('beforeSub', v)} />
      <TweakText label="After label" value={t.afterLabel} onChange={(v) => setTweak('afterLabel', v)} />

      <TweakSection label="End card" />
      <TweakText label="Headline" value={t.endTagline} onChange={(v) => setTweak('endTagline', v)} />
      <TweakText label="URL" value={t.endUrl} onChange={(v) => setTweak('endUrl', v)} />
      <TweakSelect label="1 · Logo + wordmark" value={t.endS1 || 'Middle'} options={['Top', 'Middle', 'Bottom']} onChange={(v) => setTweak('endS1', v)} />
      <TweakSelect label="2 · Headline" value={t.endS2 || 'Middle'} options={['Top', 'Middle', 'Bottom']} onChange={(v) => setTweak('endS2', v)} />
      <TweakSelect label="3 · URL" value={t.endS3 || 'Bottom'} options={['Top', 'Middle', 'Bottom']} onChange={(v) => setTweak('endS3', v)} />
    </>
  );
}

function buildCfg({ t, images }) {
  const pal = buildPalette(t);
  const { headFam, bodyFam } = buildFonts(t);
  const looks = resolveLooks(images);
  const hero = looks.find((l) => l.n === t.hero) || looks[looks.length - 1];
  const montage = looks.filter((l) => l.n !== hero.n);
  const TT = timings(t, montage.length);
  const dims = RATIOS[t.ratio] || RATIOS['9:16'];
  const W = dims[0];
  const H = dims[1];
  const beforeSrc = images.before;
  const srcs = [LOGO_SRC, LOGO_GLOW_SRC, beforeSrc, ...looks.map((l) => l.src)].filter(Boolean);

  return {
    cfg: { pal, hero, montage, t, headFam, bodyFam, TT, W, H, beforeSrc, lookCount: looks.length },
    W,
    H,
    TT,
    srcs,
    accent: pal.accent,
  };
}

export const beforeAfterIdea = {
  id: 'before-after',
  name: 'Before → After',
  description: 'One photo transformed into a themed collection montage.',
  defaults: TWEAK_DEFAULTS,
  imageSlots,
  Preview,
  SettingsControls,
  buildCfg,
};
