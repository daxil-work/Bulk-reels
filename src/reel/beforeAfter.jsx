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
import { buildFR, ALL_FONTS } from './fontUtils.js';
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
  const fonts = {
    serif: `'${headFam}', serif`,
    sans: `'${bodyFam}', sans-serif`,
  };
  fonts.FR = buildFR(t, fonts.sans, fonts.serif);
  return { headFam, bodyFam, fonts };
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
      <Sprite start={TT.after[0] + 0.25} end={TT.after[1] - 0.35}>
        <CollectionLabel
          pal={pal}
          fonts={fonts}
          count={looks.length}
          themeName={t.themeName}
          anim={labelAnim}
          pos={labelPos}
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
                z={4 + i}
                anim={imageAnim}
                fadeIn={0.6}
                fadeOut={i === montage.length - 1 ? 0.7 : 0}
              />
            </Sprite>
            <Sprite start={labelStart} end={labelEnd}>
              <CollectionLabel
                pal={pal}
                fonts={fonts}
                count={looks.length}
                themeName={t.themeName}
                anim={labelAnim}
                pos={labelPos}
              />
            </Sprite>
          </React.Fragment>
        );
      })}

      <Sprite start={TT.end[0]} end={TT.end[1]}>
        <EndCard pal={pal} fonts={fonts} t={t} />
      </Sprite>
    </Stage>
  );
}

function SettingsControls({ t, setTweak }) {
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

      <TweakSection label="Text · fonts & sizes" />
      <TweakSelect
        label="Wordmark font"
        value={t.fontWordmark || 'Default'}
        options={['Default', ...ALL_FONTS]}
        onChange={(v) => setTweak('fontWordmark', v)}
      />
      <TweakSlider label="Wordmark size" value={t.sizeWordmark ?? 100} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeWordmark', v)} />
      <TweakSelect
        label="Headline font"
        value={t.fontHeadline || 'Default'}
        options={['Default', ...ALL_FONTS]}
        onChange={(v) => setTweak('fontHeadline', v)}
      />
      <TweakSlider label="Headline size" value={t.sizeHeadline ?? 100} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeHeadline', v)} />
      <TweakSelect
        label="Subhead font (italic lines)"
        value={t.fontSubhead || 'Default'}
        options={['Default', ...ALL_FONTS]}
        onChange={(v) => setTweak('fontSubhead', v)}
      />
      <TweakSlider label="Subhead size" value={t.sizeSubhead ?? 100} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeSubhead', v)} />
      <TweakSelect
        label="Label font (Before/After)"
        value={t.fontLabel || 'Default'}
        options={['Default', ...ALL_FONTS]}
        onChange={(v) => setTweak('fontLabel', v)}
      />
      <TweakSlider label="Label size" value={t.sizeLabel ?? 145} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeLabel', v)} />
      <TweakSelect
        label="Caption font (theme / URL)"
        value={t.fontCaption || 'Default'}
        options={['Default', ...ALL_FONTS]}
        onChange={(v) => setTweak('fontCaption', v)}
      />
      <TweakSlider label="Caption size" value={t.sizeCaption ?? 100} min={50} max={180} step={5} unit="%" onChange={(v) => setTweak('sizeCaption', v)} />

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
        label="Before image screen time"
        value={t.beforeHold ?? 5.8}
        min={3}
        max={10}
        step={0.2}
        unit="s"
        onChange={(v) => setTweak('beforeHold', v)}
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
