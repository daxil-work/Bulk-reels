import { Easing } from '../engine/animations.jsx';
import { lerp, fadeIO, clamp } from './config.js';

const _imgCache = {};

export function loadImg(src) {
  if (_imgCache[src]) return _imgCache[src];
  const p = new Promise((res, rej) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
  _imgCache[src] = p;
  return p;
}

export function coverRect(img, extra, posY, cw, ch) {
  const ir = img.width / img.height;
  const cr = cw / ch;
  let dw;
  let dh;
  if (ir > cr) {
    dh = ch;
    dw = ch * ir;
  } else {
    dw = cw;
    dh = cw / ir;
  }
  dw *= extra;
  dh *= extra;
  return { dx: (cw - dw) / 2, dy: (ch - dh) * posY, dw, dh };
}

export function drawReel(ctx, time, cfg) {
  const { pal, hero, montage, t, imgs, headFam, TT } = cfg;
  const cw = cfg.W || 1080;
  const ch = cfg.H || 1920;
  const cyc = ch / 2;
  const sans = '"Jost", sans-serif';
  const serif = `"${headFam}", serif`;
  const amt = clamp((t.motion == null ? 7 : t.motion) / 100, 0, 0.4);
  const kIn = [1.03, 1.03 + amt];
  const kOut = [1.03 + amt, 1.03];
  const transEnd = TT.trans[1];

  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, cw, ch);

  let g = ctx.createRadialGradient(cw / 2, ch * 0.18, 0, cw / 2, ch * 0.18, cw * 0.9);
  g.addColorStop(0, pal.glow);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cw, ch);
  ctx.restore();

  const shot = (img, win, kbFrom, kbTo, posY, filter) => {
    if (!img || time < win[0] || time > win[1]) return;
    const lt = time - win[0];
    const dur = win[1] - win[0];
    const op = fadeIO(lt, dur, 0.7, 0.7);
    const sc = lerp(kbFrom, kbTo, Easing.easeInOutSine(dur ? lt / dur : 0));
    const { dx, dy, dw, dh } = coverRect(img, sc, posY, cw, ch);
    ctx.save();
    ctx.globalAlpha = op;
    if (filter) ctx.filter = filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    ctx.filter = 'none';
  };

  shot(imgs[cfg.beforeSrc], TT.before, kIn[0], kIn[1], 0.22, 'saturate(0.5) brightness(0.94) contrast(1.03)');
  shot(imgs[hero.src], TT.after, kOut[0], kOut[1], 0.24, null);
  montage.forEach((l, i) => {
    const s = TT.mStart + i * TT.mStep;
    const k = i % 2 ? kOut : kIn;
    shot(imgs[l.src], [s, s + TT.mDur], k[0], k[1], 0.22, null);
  });

  let tb = ctx.createLinearGradient(0, 0, 0, 110);
  tb.addColorStop(0, 'rgba(0,0,0,0.55)');
  tb.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tb;
  ctx.fillRect(0, 0, cw, 110);
  const bH = Math.min(470, ch * 0.5);
  let bb = ctx.createLinearGradient(0, ch - bH, 0, ch);
  bb.addColorStop(0, 'rgba(0,0,0,0)');
  bb.addColorStop(0.45, 'rgba(0,0,0,0.5)');
  bb.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = bb;
  ctx.fillRect(0, ch - bH, cw, bH);
  let vg = ctx.createRadialGradient(cw / 2, ch * 0.45, ch * 0.3, cw / 2, ch * 0.45, ch * 0.62);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, cw, ch);

  if (time >= TT.trans[0] && time <= transEnd) {
    const pr = (time - TT.trans[0]) / (transEnd - TT.trans[0]);
    const glow = Math.sin(clamp(pr, 0, 1) * Math.PI);
    if (t.transition === 'flash') {
      ctx.save();
      ctx.globalAlpha = 0.7 * glow;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
    } else if (t.transition === 'bloom') {
      const r = lerp(120, 1100, Easing.easeOutCubic(pr));
      const bg2 = ctx.createRadialGradient(cw / 2, ch * 0.42, 0, cw / 2, ch * 0.42, r);
      bg2.addColorStop(0, pal.accent);
      bg2.addColorStop(0.4, 'rgba(255,255,255,0.6)');
      bg2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save();
      ctx.globalAlpha = 0.85 * glow;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = bg2;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
    } else if (t.transition !== 'dissolve') {
      const x = lerp(-0.3, 1.3, Easing.easeInOutQuart(pr)) * cw;
      ctx.save();
      ctx.globalAlpha = 0.9 * glow;
      const sg = ctx.createLinearGradient(x - 250, 0, x + 250, 0);
      sg.addColorStop(0, 'rgba(180,216,255,0)');
      sg.addColorStop(0.4, pal.accent);
      sg.addColorStop(0.5, '#ffffff');
      sg.addColorStop(0.6, pal.accent);
      sg.addColorStop(1, 'rgba(180,216,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(x - 280, -100, 560, ch + 200);
      ctx.restore();
    }
  }

  const text = (str, x, y, font, color, ls, align, alpha, shadow) => {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    if (ls != null) ctx.letterSpacing = `${ls}px`;
    if (shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.72)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 2;
    }
    ctx.fillText(str, x, y);
    ctx.restore();
    ctx.letterSpacing = '0px';
  };

  const rule = (x, y, w, color, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, 2);
    ctx.restore();
  };

  if (time >= TT.title[0] && time <= TT.title[1]) {
    const lt = time - TT.title[0];
    const dur = TT.title[1] - TT.title[0];
    const o = fadeIO(lt, dur, 0.8, 0.7);
    const k = Easing.easeOutCubic(clamp(lt / 0.8, 0, 1));
    const l1 = Easing.easeOutCubic(clamp((lt - 0.5) / 0.9, 0, 1));
    const l2 = Easing.easeOutCubic(clamp((lt - 1.0) / 0.9, 0, 1));
    const rw = Easing.easeOutCubic(clamp((lt - 0.3) / 1.0, 0, 1)) * 120;
    text((t.kicker || '').toUpperCase(), cw / 2, cyc - 160, `500 24px ${sans}`, pal.accent, 12, 'center', o * k, true);
    rule(cw / 2 - rw / 2, cyc - 104, rw, pal.accent, o * 0.7);
    text(t.hook1, cw / 2, cyc - 8, `600 104px ${serif}`, pal.ink, null, 'center', o * l1, true);
    text(t.hook2, cw / 2, cyc + 110, `italic 600 104px ${serif}`, pal.accent, null, 'center', o * l2, true);
    if (t.themeName) {
      const tn = Easing.easeOutCubic(clamp((lt - 1.5) / 0.9, 0, 1));
      rule(cw / 2 - 45, ch - 322, 90, pal.accent, o * tn * 0.6);
      text((t.themeName || '').toUpperCase(), cw / 2, ch - 282, `500 26px ${sans}`, pal.accent, 9, 'center', o * tn, true);
    }
  }

  const drawLabel = (win, label, sub, isAccent) => {
    if (time < win[0] || time > win[1]) return;
    const lt = time - win[0];
    const dur = win[1] - win[0];
    const o = fadeIO(lt, dur, 0.7, 0.5);
    const line = Easing.easeOutCubic(clamp((lt - 0.25) / 0.8, 0, 1));
    rule(70, ch - 308, 60 * line, pal.accent, o);
    text((label || '').toUpperCase(), 70, ch - 260, `500 22px ${sans}`, isAccent ? pal.accent : 'rgba(255,255,255,0.88)', 10, 'left', o, true);
    if (sub) text(sub, 70, ch - 204, `italic 500 46px ${serif}`, pal.ink, null, 'left', o, true);
  };
  drawLabel(TT.bLabel, t.beforeLabel, t.beforeSub, false);
  drawLabel(TT.aLabel, t.afterLabel, hero.n, true);

  if (time >= TT.cLabel[0] && time <= TT.cLabel[1]) {
    const lt = time - TT.cLabel[0];
    const dur = TT.cLabel[1] - TT.cLabel[0];
    const o = fadeIO(lt, dur, 0.8, 0.8);
    rule(70, ch - 314, 50, pal.accent, o);
    text('THE COLLECTION', 70, ch - 268, `500 22px ${sans}`, pal.accent, 9, 'left', o, true);
    const count = cfg.lookCount ?? montage.length + 1;
    const collLabel = count === 1 ? 'One traditional look' : `${count} traditional looks`;
    text(collLabel, 70, ch - 212, `italic 500 44px ${serif}`, pal.ink, null, 'left', o, true);
  }

  if (time >= TT.end[0] && time <= TT.end[1]) {
    const lt = time - TT.end[0];
    const dur = TT.end[1] - TT.end[0];
    const o = fadeIO(lt, dur, 0.9, 0.6);
    const k = Easing.easeOutCubic(clamp(lt / 1.0, 0, 1));
    const rw = Easing.easeOutCubic(clamp((lt - 0.4) / 1.0, 0, 1)) * 140;
    const sub = Easing.easeOutCubic(clamp((lt - 0.7) / 1.0, 0, 1));
    text(t.endTitle, cw / 2, cyc - 60, `600 96px ${serif}`, pal.ink, null, 'center', o * k, true);
    rule(cw / 2 - rw / 2, cyc + 18, rw, pal.accent, o * 0.85);
    text(t.endTagline, cw / 2, cyc + 88, `400 30px ${sans}`, pal.ink, 1, 'center', o * sub, true);
    if (t.endUrl) text((t.endUrl || '').toUpperCase(), cw / 2, cyc + 172, `600 26px ${sans}`, pal.accent, 7, 'center', o * sub, true);
  }
}
