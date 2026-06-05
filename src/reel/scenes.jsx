import React, { useEffect, useState } from 'react';
import { useSprite, useTime, Easing, clamp } from '../engine/animations.jsx';
import { lerp, fadeIO, TXT_SHADOW, LOGO_GLOW_SRC } from './config.js';
import { loadImg } from './drawReel.js';
import { keyBlackToTransparent } from './logoUtils.js';

const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

export function Atmosphere({ pal, TT }) {
  const time = useTime();
  const hide =
    TT &&
    ((time >= TT.title[0] && time <= TT.title[1]) || (time >= TT.end[0] && time <= TT.end[1]))
      ? 0
      : 1;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: `radial-gradient(120% 75% at 50% 18%, ${pal.glow} 0%, transparent 60%)`,
          opacity: 0.7 * hide,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 60,
          opacity: hide,
          background: 'radial-gradient(125% 100% at 50% 45%, transparent 50%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 61,
          opacity: 0.06,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 110,
          zIndex: 55,
          opacity: hide,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 470,
          zIndex: 55,
          opacity: hide,
          background:
            'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 45%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export function FullShot({
  src,
  filter = 'none',
  kbFrom = 1.06,
  kbTo = 1.16,
  posY = '26%',
  z = 2,
  anim = 'Ken Burns',
  fadeIn = 0.7,
  fadeOut = 0.7,
}) {
  const { localTime, duration } = useSprite();
  const opacity = fadeIO(localTime, duration, fadeIn, fadeOut);
  const prog = duration > 0 ? localTime / duration : 0;
  const enter = Easing.easeOutCubic(clamp(localTime / 0.8, 0, 1));
  let scale = lerp(kbFrom, kbTo, Easing.easeInOutSine(prog));
  let tx = 0;
  let ty = 0;
  let blur = 0;
  let rot = 0;

  if (anim === 'Zoom in') scale *= lerp(1.18, 1, enter);
  else if (anim === 'Zoom out') scale *= lerp(0.86, 1, enter);
  else if (anim === 'Slide left') tx = (1 - enter) * 10;
  else if (anim === 'Slide right') tx = (1 - enter) * -10;
  else if (anim === 'Slide up') ty = (1 - enter) * 10;
  else if (anim === 'Slide down') ty = (1 - enter) * -10;
  else if (anim === 'Blur in') blur = (1 - enter) * 22;
  else if (anim === 'Pan up') {
    ty = lerp(3, -3, Easing.easeInOutSine(prog));
    scale *= 1.1;
  } else if (anim === 'Spin in') {
    rot = (1 - enter) * -8;
    scale *= lerp(1.12, 1, enter);
  } else if (anim === 'Zoom blur') {
    scale *= lerp(1.25, 1, enter);
    blur = (1 - enter) * 18;
  }

  const f = blur > 0.1 ? `${filter === 'none' ? '' : filter} blur(${blur}px)` : filter;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: z, opacity, overflow: 'hidden' }}>
      <img
        src={src}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `center ${posY}`,
          transform: `translate(${tx}%, ${ty}%) rotate(${rot}deg) scale(${scale})`,
          transformOrigin: 'center',
          filter: f,
          display: 'block',
        }}
      />
    </div>
  );
}

export function GlowLogo({ size = 180 }) {
  const [src, setSrc] = useState(LOGO_GLOW_SRC);

  useEffect(() => {
    let cancelled = false;
    loadImg(LOGO_GLOW_SRC)
      .then((im) => {
        if (cancelled) return;
        const processed = keyBlackToTransparent(im);
        setSrc(processed.toDataURL('image/png'));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <img
      src={src}
      alt=""
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 10px 32px rgba(0,0,0,0.45))',
      }}
    />
  );
}

export function ShotLabel({
  label,
  sub,
  pal,
  fonts,
  accent: isAccent,
  anim = 'Rise',
  pos = 'Bottom left',
}) {
  const { localTime, duration } = useSprite();
  const o = fadeIO(localTime, duration, 0.7, 0.5);
  const enter = Easing.easeOutCubic(clamp(localTime / 0.7, 0, 1));
  const line = Easing.easeOutCubic(clamp((localTime - 0.25) / 0.8, 0, 1));
  let tx = 0;
  let ty = 0;
  let scale = 1;
  let scaleY = 1;
  let blur = 0;
  let lsExtra = 0;
  let clip = 'none';

  if (anim === 'Rise') ty = (1 - enter) * 26;
  else if (anim === 'Slide') tx = (1 - enter) * -40;
  else if (anim === 'Drop') ty = (1 - enter) * -30;
  else if (anim === 'Pop') scale = lerp(0.8, 1, enter);
  else if (anim === 'Blur') blur = (1 - enter) * 10;
  else if (anim === 'Expand') lsExtra = (1 - enter) * 0.3;
  else if (anim === 'Bounce') ty = (1 - easeOutBack(clamp(localTime / 0.7, 0, 1))) * 30;
  else if (anim === 'Flip') scaleY = enter;
  else if (anim === 'Wipe') clip = `inset(0 ${(1 - enter) * 100}% 0 0)`;

  const isC = pos.includes('center') || pos === 'Center';
  const isR = pos.includes('right');
  const isTop = pos.startsWith('Top');
  const isMid = pos === 'Center';
  const itemsAlign = isC ? 'center' : isR ? 'flex-end' : 'flex-start';
  const tAlign = isC ? 'center' : isR ? 'right' : 'left';

  const cstyle = {
    position: 'absolute',
    zIndex: 58,
    opacity: o,
    display: 'flex',
    flexDirection: 'column',
    alignItems: itemsAlign,
    clipPath: clip,
    filter: blur > 0.1 ? `blur(${blur}px)` : 'none',
    transformOrigin: `${isC ? 'center' : isR ? 'right' : 'left'} ${isTop ? 'top' : 'bottom'}`,
  };
  if (isC) {
    cstyle.left = 0;
    cstyle.right = 0;
  } else if (isR) {
    cstyle.right = 70;
  } else {
    cstyle.left = 70;
  }
  if (isTop) cstyle.top = 140;
  else if (isMid) cstyle.top = '50%';
  else cstyle.bottom = 150;

  cstyle.transform = isMid
    ? `translate(${tx}px, calc(-50% + ${ty}px)) scale(${scale}) scaleY(${scaleY})`
    : `translate(${tx}px, ${ty}px) scale(${scale}) scaleY(${scaleY})`;

  return (
    <div style={cstyle}>
      <div style={{ width: 60 * line, height: 2, background: pal.accent, marginBottom: 22, boxShadow: TXT_SHADOW }} />
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: `${0.46 + lsExtra}em`,
          textTransform: 'uppercase',
          color: isAccent ? pal.accent : pal.muted || 'rgba(255,255,255,0.85)',
          textShadow: TXT_SHADOW,
          textAlign: tAlign,
        }}
      >
        {label}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: 46,
            fontWeight: 500,
            color: pal.ink,
            marginTop: 6,
            letterSpacing: '0.01em',
            textShadow: TXT_SHADOW,
            textAlign: tAlign,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export function Transition({ pal, type }) {
  const { progress } = useSprite();
  const glow = Math.sin(clamp(progress, 0, 1) * Math.PI);
  if (type === 'dissolve') return null;
  if (type === 'flash') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          pointerEvents: 'none',
          background: '#ffffff',
          opacity: 0.7 * glow,
        }}
      />
    );
  }
  if (type === 'bloom') {
    const r = lerp(10, 90, Easing.easeOutCubic(progress));
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          pointerEvents: 'none',
          background: `radial-gradient(${r}% ${r}% at 50% 42%, ${pal.accent} 0%, rgba(255,255,255,0.6) 35%, transparent 70%)`,
          opacity: 0.85 * glow,
          mixBlendMode: 'screen',
        }}
      />
    );
  }
  const x = lerp(-130, 130, Easing.easeInOutQuart(progress));
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          bottom: '-20%',
          left: `${x}%`,
          width: '55%',
          transform: 'skewX(-12deg)',
          background: `linear-gradient(90deg, transparent, ${pal.accent}, #ffffff, ${pal.accent}, transparent)`,
          opacity: 0.9 * glow,
          filter: 'blur(2px)',
          boxShadow: `0 0 120px 40px ${pal.accent}`,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.16 * glow }} />
    </div>
  );
}

function SlotScene({ o, sections }) {
  const slots = ['Top', 'Middle', 'Bottom'];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, opacity: o }}>
      {slots.map((slot) => {
        const items = sections.filter((s) => s.slot === slot);
        if (!items.length) return null;
        const st = {
          position: 'absolute',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 60px',
          gap: 34,
        };
        if (slot === 'Top') st.top = 170;
        else if (slot === 'Bottom') st.bottom = 170;
        else {
          st.top = 0;
          st.bottom = 0;
          st.justifyContent = 'center';
        }
        return (
          <div key={slot} style={st}>
            {items.map((s, i) => (
              <div key={i} style={{ width: '100%' }}>
                {s.node}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function TitleCard({ pal, fonts, t }) {
  const { localTime, duration } = useSprite();
  const o = fadeIO(localTime, duration, 0.8, 0.7);
  const k = Easing.easeOutCubic(clamp(localTime / 0.8, 0, 1));
  const l1 = Easing.easeOutCubic(clamp((localTime - 0.6) / 0.9, 0, 1));
  const l2 = Easing.easeOutCubic(clamp((localTime - 1.1) / 0.9, 0, 1));
  const ruleW = Easing.easeOutCubic(clamp((localTime - 0.4) / 1.0, 0, 1)) * 120;
  const tn = Easing.easeOutCubic(clamp((localTime - 1.6) / 0.9, 0, 1));

  const brand = (
    <div
      style={{
        opacity: k,
        transform: `translateY(${(1 - k) * 12}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {t.showLogo !== false ? (
        <div style={{ marginBottom: 14 }}>
          <GlowLogo size={186} />
        </div>
      ) : null}
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: pal.ink,
          textShadow: TXT_SHADOW,
        }}
      >
        {t.kicker}
      </div>
    </div>
  );

  const headline = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: ruleW, height: 1.5, background: pal.accent, opacity: 0.7, margin: '0 0 26px' }} />
      <div
        style={{
          fontFamily: fonts.serif,
          fontWeight: 600,
          fontSize: 100,
          lineHeight: 1.02,
          color: pal.ink,
          textShadow: TXT_SHADOW,
        }}
      >
        <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 20}px)` }}>{t.hook1}</div>
        <div
          style={{
            opacity: l2,
            transform: `translateY(${(1 - l2) * 20}px)`,
            fontStyle: 'italic',
            color: pal.accent,
          }}
        >
          {t.hook2}
        </div>
      </div>
    </div>
  );

  const foot = t.themeName ? (
    <div style={{ opacity: tn }}>
      <div style={{ width: 90, height: 1.5, background: pal.accent, opacity: 0.6, margin: '0 auto 20px' }} />
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: '0.36em',
          textTransform: 'uppercase',
          color: pal.accent,
          textShadow: TXT_SHADOW,
        }}
      >
        {t.themeName}
      </div>
    </div>
  ) : null;

  const sections = [
    { slot: t.titleS1 || 'Middle', node: brand },
    { slot: t.titleS2 || 'Middle', node: headline },
  ];
  if (foot) sections.push({ slot: t.titleS3 || 'Bottom', node: foot });

  return <SlotScene o={o} sections={sections} />;
}

export function EndCard({ pal, fonts, t }) {
  const { localTime, duration } = useSprite();
  const o = fadeIO(localTime, duration, 0.9, 0.6);
  const k = Easing.easeOutCubic(clamp(localTime / 0.8, 0, 1));
  const ruleW = Easing.easeOutCubic(clamp((localTime - 0.4) / 1.0, 0, 1)) * 120;
  const sub = Easing.easeOutCubic(clamp((localTime - 0.7) / 1.0, 0, 1));
  const tn = Easing.easeOutCubic(clamp((localTime - 1.0) / 0.9, 0, 1));

  const brand = (
    <div
      style={{
        opacity: k,
        transform: `translateY(${(1 - k) * 12}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {t.showLogo !== false ? (
        <div style={{ marginBottom: 14 }}>
          <GlowLogo size={186} />
        </div>
      ) : null}
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: pal.ink,
          textShadow: TXT_SHADOW,
        }}
      >
        {t.kicker}
      </div>
    </div>
  );

  const headline = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: sub }}>
      <div style={{ width: ruleW, height: 1.5, background: pal.accent, opacity: 0.7, margin: '0 0 26px' }} />
      <div
        style={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 46,
          lineHeight: 1.1,
          color: pal.ink,
          maxWidth: 760,
          textShadow: TXT_SHADOW,
        }}
      >
        {t.endTagline}
      </div>
    </div>
  );

  const foot = t.endUrl ? (
    <div style={{ opacity: tn }}>
      <div style={{ width: 90, height: 1.5, background: pal.accent, opacity: 0.6, margin: '0 auto 20px' }} />
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: pal.accent,
          textShadow: TXT_SHADOW,
        }}
      >
        {t.endUrl}
      </div>
    </div>
  ) : null;

  const sections = [
    { slot: t.endS1 || 'Middle', node: brand },
    { slot: t.endS2 || 'Middle', node: headline },
  ];
  if (foot) sections.push({ slot: t.endS3 || 'Bottom', node: foot });

  return <SlotScene o={o} sections={sections} />;
}

export function CollectionLabel({ pal, fonts, count = 9, anim, pos }) {
  const label = count === 1 ? 'One traditional look' : `${count} traditional looks`;
  return (
    <ShotLabel
      label="The Collection"
      sub={label}
      pal={pal}
      fonts={fonts}
      accent
      anim={anim}
      pos={pos}
    />
  );
}

export function ScreenLabeler() {
  const time = useTime();
  useEffect(() => {
    const r = document.getElementById('reel-root');
    if (r) r.setAttribute('data-screen-label', `${Math.floor(time)}s`);
  }, [Math.floor(time)]);
  return null;
}
