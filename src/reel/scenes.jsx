import React, { useEffect } from 'react';
import { useSprite, useTime, Easing, clamp } from '../engine/animations.jsx';
import { lerp, fadeIO, TXT_SHADOW } from './config.js';

export function Atmosphere({ pal }) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: `radial-gradient(120% 75% at 50% 18%, ${pal.glow} 0%, transparent 60%)`,
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 60,
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
          background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 45%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

export function FullShot({ src, filter = 'none', kbFrom = 1.06, kbTo = 1.16, posY = '26%', z = 2 }) {
  const { localTime, duration } = useSprite();
  const opacity = fadeIO(localTime, duration, 0.7, 0.7);
  const scale = lerp(kbFrom, kbTo, Easing.easeInOutSine(duration > 0 ? localTime / duration : 0));
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
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          filter,
          display: 'block',
        }}
      />
    </div>
  );
}

export function ShotLabel({ label, sub, pal, fonts, accent: isAccent }) {
  const { localTime, duration } = useSprite();
  const o = fadeIO(localTime, duration, 0.7, 0.5);
  const up = (1 - Easing.easeOutCubic(clamp(localTime / 0.7, 0, 1))) * 26;
  const line = Easing.easeOutCubic(clamp((localTime - 0.25) / 0.8, 0, 1));
  return (
    <div style={{ position: 'absolute', left: 70, bottom: 150, zIndex: 58, opacity: o, transform: `translateY(${up}px)` }}>
      <div style={{ width: 60 * line, height: 2, background: pal.accent, marginBottom: 22, boxShadow: TXT_SHADOW }} />
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '0.46em',
          textTransform: 'uppercase',
          color: isAccent ? pal.accent : 'rgba(255,255,255,0.85)',
          textShadow: TXT_SHADOW,
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

export function TitleCard({ pal, fonts, t }) {
  const { localTime, duration } = useSprite();
  const o = fadeIO(localTime, duration, 0.8, 0.7);
  const k = Easing.easeOutCubic(clamp(localTime / 0.8, 0, 1));
  const l1 = Easing.easeOutCubic(clamp((localTime - 0.5) / 0.9, 0, 1));
  const l2 = Easing.easeOutCubic(clamp((localTime - 1.0) / 0.9, 0, 1));
  const ruleW = Easing.easeOutCubic(clamp((localTime - 0.3) / 1.0, 0, 1)) * 120;
  const tn = Easing.easeOutCubic(clamp((localTime - 1.5) / 0.9, 0, 1));
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        opacity: o,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: pal.accent,
          opacity: k,
          transform: `translateY(${(1 - k) * 12}px)`,
          textShadow: TXT_SHADOW,
        }}
      >
        {t.kicker}
      </div>
      <div style={{ width: ruleW, height: 1.5, background: pal.accent, opacity: 0.7, margin: '34px 0 30px' }} />
      <div
        style={{
          fontFamily: fonts.serif,
          fontWeight: 600,
          fontSize: 104,
          lineHeight: 1.02,
          color: pal.ink,
          textShadow: TXT_SHADOW,
        }}
      >
        <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 20}px)` }}>{t.hook1}</div>
        <div style={{ opacity: l2, transform: `translateY(${(1 - l2) * 20}px)`, fontStyle: 'italic', color: pal.accent }}>
          {t.hook2}
        </div>
      </div>
      {t.themeName ? (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 240, opacity: tn }}>
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
      ) : null}
    </div>
  );
}

export function EndCard({ pal, fonts, t }) {
  const { localTime, duration } = useSprite();
  const o = fadeIO(localTime, duration, 0.9, 0.6);
  const k = Easing.easeOutCubic(clamp(localTime / 1.0, 0, 1));
  const ruleW = Easing.easeOutCubic(clamp((localTime - 0.4) / 1.0, 0, 1)) * 140;
  const sub = Easing.easeOutCubic(clamp((localTime - 0.7) / 1.0, 0, 1));
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        opacity: o,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          fontFamily: fonts.serif,
          fontWeight: 600,
          fontSize: 96,
          letterSpacing: '0.02em',
          color: pal.ink,
          opacity: k,
          transform: `translateY(${(1 - k) * 16}px)`,
          textShadow: TXT_SHADOW,
        }}
      >
        {t.endTitle}
      </div>
      <div style={{ width: ruleW, height: 1.5, background: pal.accent, opacity: 0.8, margin: '30px 0' }} />
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 400,
          fontSize: 30,
          letterSpacing: '0.06em',
          color: pal.ink,
          opacity: sub,
          maxWidth: 720,
          textShadow: TXT_SHADOW,
        }}
      >
        {t.endTagline}
      </div>
      {t.endUrl ? (
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: pal.accent,
            opacity: sub,
            marginTop: 40,
            textShadow: TXT_SHADOW,
          }}
        >
          {t.endUrl}
        </div>
      ) : null}
    </div>
  );
}

export function CollectionLabel({ pal, fonts, count = 9 }) {
  const { localTime, duration } = useSprite();
  const o = fadeIO(localTime, duration, 0.8, 0.8);
  const label = count === 1 ? 'One traditional look' : `${count} traditional looks`;
  return (
    <div style={{ position: 'absolute', left: 70, bottom: 150, zIndex: 58, opacity: o }}>
      <div style={{ width: 50, height: 2, background: pal.accent, marginBottom: 20 }} />
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: pal.accent,
          textShadow: TXT_SHADOW,
        }}
      >
        The Collection
      </div>
      <div
        style={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontSize: 44,
          color: pal.ink,
          marginTop: 6,
          textShadow: TXT_SHADOW,
        }}
      >
        {label}
      </div>
    </div>
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
