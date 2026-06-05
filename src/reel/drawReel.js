import { Easing } from '../engine/animations.jsx';
import { lerp, fadeIO, clamp, LOGO_GLOW_SRC } from './config.js';

const _imgCache = {};

const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

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

function drawGlowLogo(ctx, cx, cy, size, alpha, imgs) {
  const img = imgs[LOGO_GLOW_SRC];
  if (!img) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  const ir = img.width / img.height;
  let dw;
  let dh;
  if (ir > 1) {
    dw = size;
    dh = size / ir;
  } else {
    dh = size;
    dw = size * ir;
  }
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

export function drawReel(ctx, time, cfg) {
  const { pal, hero, montage, t, imgs, headFam, bodyFam, TT } = cfg;
  const cw = cfg.W || 1080;
  const ch = cfg.H || 1920;
  const cyc = ch / 2;
  const sans = `"${bodyFam || 'Jost'}", sans-serif`;
  const serif = `"${headFam}", serif`;
  const amt = clamp((t.motion == null ? 7 : t.motion) / 100, 0, 0.4);
  const kIn = [1.03, 1.03 + amt];
  const kOut = [1.03 + amt, 1.03];
  const transEnd = TT.trans[1];
  const inTitle = time >= TT.title[0] && time <= TT.title[1];
  const inEnd = time >= TT.end[0] && time <= TT.end[1];
  const flatScene = inTitle || inEnd;

  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, cw, ch);

  if (!flatScene) {
    const g = ctx.createRadialGradient(cw / 2, ch * 0.18, 0, cw / 2, ch * 0.18, cw * 0.9);
    g.addColorStop(0, pal.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }

  const shot = (img, win, kbFrom, kbTo, posY, filter, fin, fout) => {
    if (!img || time < win[0] || time > win[1]) return;
    const lt = time - win[0];
    const dur = win[1] - win[0];
    const op = fadeIO(lt, dur, fin == null ? 0.7 : fin, fout == null ? 0.7 : fout);
    const prog = dur ? lt / dur : 0;
    const enter = Easing.easeOutCubic(clamp(lt / 0.8, 0, 1));
    let sc = lerp(kbFrom, kbTo, Easing.easeInOutSine(prog));
    let tx = 0;
    let ty = 0;
    let blur = 0;
    let rot = 0;
    const a = t.imageAnim || 'Ken Burns';
    if (a === 'Zoom in') sc *= lerp(1.18, 1, enter);
    else if (a === 'Zoom out') sc *= lerp(0.86, 1, enter);
    else if (a === 'Slide left') tx = (1 - enter) * 0.1 * cw;
    else if (a === 'Slide right') tx = -(1 - enter) * 0.1 * cw;
    else if (a === 'Slide up') ty = (1 - enter) * 0.1 * ch;
    else if (a === 'Slide down') ty = -(1 - enter) * 0.1 * ch;
    else if (a === 'Blur in') blur = (1 - enter) * 22;
    else if (a === 'Pan up') {
      ty = lerp(0.035 * ch, -0.035 * ch, Easing.easeInOutSine(prog));
      sc *= 1.1;
    } else if (a === 'Spin in') {
      rot = (1 - enter) * -8 * (Math.PI / 180);
      sc *= lerp(1.12, 1, enter);
    } else if (a === 'Zoom blur') {
      sc *= lerp(1.25, 1, enter);
      blur = (1 - enter) * 18;
    }
    const { dx, dy, dw, dh } = coverRect(img, sc, posY, cw, ch);
    ctx.save();
    ctx.globalAlpha = op;
    let f = filter || '';
    if (blur > 0.1) f = (f ? `${f} ` : '') + `blur(${blur}px)`;
    if (f) ctx.filter = f;
    if (rot) {
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate(rot);
      ctx.translate(-cw / 2, -ch / 2);
    }
    ctx.drawImage(img, dx + tx, dy + ty, dw, dh);
    ctx.restore();
    ctx.filter = 'none';
  };

  shot(
    imgs[cfg.beforeSrc],
    TT.before,
    kIn[0],
    kIn[1],
    0.22,
    'saturate(0.5) brightness(0.94) contrast(1.03)',
    0.6,
    0
  );
  shot(imgs[hero.src], TT.after, kOut[0], kOut[1], 0.24, null, 0.6, 0);
  montage.forEach((l, i) => {
    const s = TT.mStart + i * TT.mStep;
    const k = i % 2 ? kOut : kIn;
    shot(imgs[l.src], [s, s + TT.mDur], k[0], k[1], 0.22, null, 0.6, i === montage.length - 1 ? 0.7 : 0);
  });

  if (!flatScene) {
    const tb = ctx.createLinearGradient(0, 0, 0, 110);
    tb.addColorStop(0, 'rgba(0,0,0,0.55)');
    tb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tb;
    ctx.fillRect(0, 0, cw, 110);
    const bH = Math.min(470, ch * 0.5);
    const bb = ctx.createLinearGradient(0, ch - bH, 0, ch);
    bb.addColorStop(0, 'rgba(0,0,0,0)');
    bb.addColorStop(0.45, 'rgba(0,0,0,0.5)');
    bb.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = bb;
    ctx.fillRect(0, ch - bH, cw, bH);
    const vg = ctx.createRadialGradient(cw / 2, ch * 0.45, ch * 0.3, cw / 2, ch * 0.45, ch * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, cw, ch);
  }

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

  const placeSlots = (sections) => {
    ['Top', 'Middle', 'Bottom'].forEach((slot) => {
      const items = sections.filter((s) => s.slot === slot);
      if (!items.length) return;
      const gap = 40;
      const total = items.reduce((a, s) => a + s.h, 0) + gap * (items.length - 1);
      let y = slot === 'Top' ? 200 : slot === 'Bottom' ? ch - 200 - total : cyc - total / 2;
      items.forEach((s) => {
        s.draw(y);
        y += s.h + gap;
      });
    });
  };

  if (time >= TT.title[0] && time <= TT.title[1]) {
    const lt = time - TT.title[0];
    const dur = TT.title[1] - TT.title[0];
    const o = fadeIO(lt, dur, 0.8, 0.7);
    const k = Easing.easeOutCubic(clamp(lt / 0.8, 0, 1));
    const l1 = Easing.easeOutCubic(clamp((lt - 0.6) / 0.9, 0, 1));
    const l2 = Easing.easeOutCubic(clamp((lt - 1.1) / 0.9, 0, 1));
    const tn = Easing.easeOutCubic(clamp((lt - 1.6) / 0.9, 0, 1));
    const rw = Easing.easeOutCubic(clamp((lt - 0.4) / 1.0, 0, 1)) * 120;
    const showL = t.showLogo !== false;
    const sections = [
      {
        slot: t.titleS1 || 'Middle',
        h: (showL ? 208 : 0) + 60,
        draw: (top) => {
          if (showL) drawGlowLogo(ctx, cw / 2, top + 93, 186, o * k, imgs);
          text(
            (t.kicker || '').toUpperCase(),
            cw / 2,
            top + (showL ? 208 : 0) + 30,
            `700 54px ${sans}`,
            pal.ink,
            5,
            'center',
            o * k,
            true
          );
        },
      },
      {
        slot: t.titleS2 || 'Middle',
        h: 238,
        draw: (top) => {
          rule(cw / 2 - rw / 2, top + 8, rw, pal.accent, o * 0.7);
          text(t.hook1, cw / 2, top + 82, `600 100px ${serif}`, pal.ink, null, 'center', o * l1, true);
          text(t.hook2, cw / 2, top + 186, `italic 600 100px ${serif}`, pal.accent, null, 'center', o * l2, true);
        },
      },
    ];
    if (t.themeName) {
      sections.push({
        slot: t.titleS3 || 'Bottom',
        h: 50,
        draw: (top) => {
          rule(cw / 2 - 45, top + 6, 90, pal.accent, o * tn * 0.6);
          text(
            (t.themeName || '').toUpperCase(),
            cw / 2,
            top + 34,
            `500 26px ${sans}`,
            pal.accent,
            9,
            'center',
            o * tn,
            true
          );
        },
      });
    }
    placeSlots(sections);
  }

  const drawLabel = (win, label, sub, isAccent) => {
    if (time < win[0] || time > win[1]) return;
    const lt = time - win[0];
    const dur = win[1] - win[0];
    const o = fadeIO(lt, dur, 0.7, 0.5);
    const line = Easing.easeOutCubic(clamp((lt - 0.25) / 0.8, 0, 1));
    const enter = Easing.easeOutCubic(clamp(lt / 0.7, 0, 1));
    const a = t.labelAnim || 'Rise';
    let tx = 0;
    let ty = 0;
    let scale = 1;
    let scaleY = 1;
    let blur = 0;
    let lsExtra = 0;
    let wipe = 0;
    if (a === 'Rise') ty = (1 - enter) * 26;
    else if (a === 'Slide') tx = (1 - enter) * -40;
    else if (a === 'Drop') ty = (1 - enter) * -30;
    else if (a === 'Pop') scale = lerp(0.8, 1, enter);
    else if (a === 'Blur') blur = (1 - enter) * 10;
    else if (a === 'Expand') lsExtra = (1 - enter) * 8;
    else if (a === 'Bounce') ty = (1 - easeOutBack(clamp(lt / 0.7, 0, 1))) * 30;
    else if (a === 'Flip') scaleY = enter;
    else if (a === 'Wipe') wipe = 1;
    const pos = t.labelPos || 'Bottom left';
    const isC = pos.includes('center') || pos === 'Center';
    const isR = pos.includes('right');
    const isTop = pos.startsWith('Top');
    const isMid = pos === 'Center';
    const ax = isC ? cw / 2 : isR ? cw - 70 : 70;
    const talign = isC ? 'center' : isR ? 'right' : 'left';
    const subY = isTop ? 252 : isMid ? ch / 2 + 60 : ch - 204;
    const labelY = subY - 56;
    const ruleY = subY - 104;
    const rwid = 60 * line;
    const ruleX = talign === 'left' ? ax : talign === 'center' ? ax - rwid / 2 : ax - rwid;
    ctx.save();
    ctx.translate(ax + tx, subY + ty);
    ctx.scale(scale, scale * scaleY);
    ctx.translate(-ax, -subY);
    if (blur > 0.1) ctx.filter = `blur(${blur}px)`;
    if (wipe) {
      const wx = talign === 'left' ? ax - 12 : talign === 'center' ? ax - 290 : ax - 560;
      ctx.beginPath();
      ctx.rect(wx, ruleY - 24, 580 * enter, subY - ruleY + 90);
      ctx.clip();
    }
    rule(ruleX, ruleY, rwid, pal.accent, o);
    text(
      (label || '').toUpperCase(),
      ax,
      labelY,
      `500 22px ${sans}`,
      isAccent ? pal.accent : pal.muted || 'rgba(255,255,255,0.88)',
      10 + lsExtra,
      talign,
      o,
      true
    );
    if (sub) text(sub, ax, subY, `italic 500 46px ${serif}`, pal.ink, null, talign, o, true);
    ctx.filter = 'none';
    ctx.restore();
  };

  drawLabel(TT.bLabel, t.beforeLabel, t.beforeSub, false);
  drawLabel(TT.aLabel, t.afterLabel, hero.n, true);

  const count = cfg.lookCount ?? montage.length + 1;
  const collLabel = count === 1 ? 'One traditional look' : `${count} traditional looks`;
  drawLabel(TT.cLabel, 'The Collection', collLabel, true);

  if (time >= TT.end[0] && time <= TT.end[1]) {
    const lt = time - TT.end[0];
    const dur = TT.end[1] - TT.end[0];
    const o = fadeIO(lt, dur, 0.9, 0.6);
    const k = Easing.easeOutCubic(clamp(lt / 0.8, 0, 1));
    const rw = Easing.easeOutCubic(clamp((lt - 0.4) / 1.0, 0, 1)) * 120;
    const sub = Easing.easeOutCubic(clamp((lt - 0.7) / 1.0, 0, 1));
    const tn = Easing.easeOutCubic(clamp((lt - 1.0) / 0.9, 0, 1));
    const showL = t.showLogo !== false;
    const sections = [
      {
        slot: t.endS1 || 'Middle',
        h: (showL ? 208 : 0) + 60,
        draw: (top) => {
          if (showL) drawGlowLogo(ctx, cw / 2, top + 93, 186, o * k, imgs);
          text(
            (t.kicker || '').toUpperCase(),
            cw / 2,
            top + (showL ? 208 : 0) + 30,
            `700 54px ${sans}`,
            pal.ink,
            5,
            'center',
            o * k,
            true
          );
        },
      },
      {
        slot: t.endS2 || 'Middle',
        h: 80,
        draw: (top) => {
          rule(cw / 2 - rw / 2, top + 8, rw, pal.accent, o * 0.7);
          text(t.endTagline, cw / 2, top + 52, `italic 500 46px ${serif}`, pal.ink, null, 'center', o * sub, true);
        },
      },
    ];
    if (t.endUrl) {
      sections.push({
        slot: t.endS3 || 'Bottom',
        h: 50,
        draw: (top) => {
          rule(cw / 2 - 45, top + 6, 90, pal.accent, o * tn * 0.6);
          text(
            (t.endUrl || '').toUpperCase(),
            cw / 2,
            top + 34,
            `500 26px ${sans}`,
            pal.accent,
            9,
            'center',
            o * tn,
            true
          );
        },
      });
    }
    placeSlots(sections);
  }
}
