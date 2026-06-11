import { DEFAULT_BEFORE_SRC, LOGO_SRC, LOGO_GLOW_SRC, LOOKS } from './config.js';
import { ALL_FONTS, SERIF_FONTS } from './fontUtils.js';

const POOL_DEFAULT = LOOKS.map((l) => l.src);
  // ── math / easing ───────────────────────────────────────────────────────
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
  const easeOutBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const fadeIO = (lt, dur, ins, outs) => {
    let o = 1;
    if (lt < ins) o = clamp(lt / ins, 0, 1);
    else if (lt > dur - outs) o = clamp((dur - lt) / outs, 0, 1);
    return easeInOutSine(o);
  };
  const hexRgb = (h) => { h = (h || "").replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const luma = (h) => { const [r, g, b] = hexRgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };

function poolOf(cfg) {
  return cfg.pool?.length ? cfg.pool : POOL_DEFAULT;
}

function revealOf(cfg) {
  if (cfg.reveal?.length) return cfg.reveal;
  const p = poolOf(cfg);
  return p.length >= 3 ? p.slice(0, 3) : [...p, ...p, ...p].slice(0, 3);
}

function galleryOf(cfg) {
  if (cfg.gallery?.length) return cfg.gallery;
  const p = poolOf(cfg);
  return p.length >= 6 ? p.slice(0, 6) : [...p, ...p].slice(0, 6);
}

// ── tweak → font-role resolution ─────────────────────────────────────────
export function buildFPFR(t) {
    const num = (v, d) => (typeof v === "number" && !isNaN(v)) ? v : d;
    const famOf = (v, base) => (!v || v === "Default" || !ALL_FONTS.includes(v))
      ? base : `'${v}', ${SERIF_FONTS.includes(v) ? "serif" : "sans-serif"}`;
    const sc = (v) => clamp(num(v, 100), 50, 180) / 100;
    return {
      display: { fam: famOf(t.fontDisplay, "'Montserrat', sans-serif"), s: sc(t.sizeDisplay) },
      serif:   { fam: famOf(t.fontSerif, "'Cormorant Garamond', serif"), s: sc(t.sizeSerif) },
      body:    { fam: famOf(t.fontBody, "'Montserrat', sans-serif"), s: sc(t.sizeBody) },
      label:   { fam: famOf(t.fontLabel, "'Jost', sans-serif"), s: sc(t.sizeLabel) },
    };
  }

  // ── scene timeline from per-scene durations ──────────────────────────────
export const DEFAULT_DUR = [3.5, 6.5, 15, 15, 9.5, 10];

export function scenesOf(t) {
    const num = (v, d) => (typeof v === "number" && !isNaN(v)) ? v : d;
    const d = [
      num(t.d1, DEFAULT_DUR[0]), num(t.d2, DEFAULT_DUR[1]), num(t.d3, DEFAULT_DUR[2]),
      num(t.d4, DEFAULT_DUR[3]), num(t.d5, DEFAULT_DUR[4]), num(t.d6, DEFAULT_DUR[5]),
    ];
    const out = []; let s = 0;
    for (let i = 0; i < 6; i++) { out.push({ i, start: s, end: s + d[i], dur: d[i] }); s += d[i]; }
    return out;
  }
export function durationOf(t) {
  const sc = scenesOf(t);
  return sc[sc.length - 1].end;
}

  // ── canvas drawing utilities ─────────────────────────────────────────────
  function getImg(cfg, src) { return cfg.imgs ? cfg.imgs[src] : null; }

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function cover(ctx, img, x, y, w, h, opt) {
    opt = opt || {};
    if (!img) { ctx.fillStyle = opt.fallback || "#0a1422"; if (opt.radius) { rrect(ctx, x, y, w, h, opt.radius); ctx.fill(); } else ctx.fillRect(x, y, w, h); return; }
    ctx.save();
    if (opt.radius) { rrect(ctx, x, y, w, h, opt.radius); ctx.clip(); }
    else { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
    const iw = img.width, ih = img.height;
    const s = Math.max(w / iw, h / ih) * (opt.scale || 1);
    const dw = iw * s, dh = ih * s;
    const px = opt.posX == null ? 0.5 : opt.posX;
    const py = opt.posY == null ? 0.5 : opt.posY;
    const dx = x + (w - dw) * px;
    const dy = y + (h - dh) * py;
    if (opt.filter) ctx.filter = opt.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function setFont(ctx, cfg, role, weight, px, italic) {
    const r = cfg.FR[role] || { fam: "sans-serif", s: 1 };
    ctx.font = `${italic ? "italic " : ""}${weight} ${Math.round(px * r.s)}px ${r.fam}`;
  }
  const setLS = (ctx, ls) => { try { ctx.letterSpacing = (ls || 0) + "px"; } catch (e) {} };

  function txt(ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    setLS(ctx, o.ls || 0);
    ctx.textAlign = o.align || "center";
    ctx.textBaseline = o.baseline || "alphabetic";
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * (ctx.globalAlpha);
    if (o.shadow !== false) { ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = o.shadowBlur || 18; ctx.shadowOffsetY = 2; }
    ctx.fillStyle = o.fill || "#fff";
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function wrap(ctx, str, maxW) {
    const words = str.split(" ");
    const lines = []; let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function rule(ctx, cx, y, w, color, alpha) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color;
    ctx.fillRect(cx - w / 2, y, w, 2); ctx.restore();
  }

  function glowLogo(ctx, cfg, cx, cy, size, alpha) {
    const img = getImg(cfg, LOGO_GLOW_SRC) || getImg(cfg, LOGO_SRC);
    ctx.save();
    ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(cx, cy, size * 0.2, cx, cy, size * 0.95);
    g.addColorStop(0, rgba(cfg.pal.accent, 0.42));
    g.addColorStop(1, rgba(cfg.pal.accent, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, size * 0.95, 0, Math.PI * 2); ctx.fill();
    const r = size / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (img) cover(ctx, img, cx - r, cy - r, size, size, {});
    else { ctx.fillStyle = cfg.pal.bg; ctx.fillRect(cx - r, cy - r, size, size); }
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = rgba(cfg.pal.accent, 0.85);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Draws the transparent brand logo ONLY (no circle frame, no glow ring),
  // contained within a size×size box, preserving aspect.
  function plainLogo(ctx, cfg, cx, cy, size, alpha) {
    const img = getImg(cfg, LOGO_GLOW_SRC) || getImg(cfg, LOGO_SRC);
    if (!img) return;
    ctx.save(); ctx.globalAlpha *= clamp(alpha, 0, 1);
    const ir = img.width / img.height;
    let w = size, h = size;
    if (ir > 1) h = size / ir; else w = size * ir;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }

  // Three-slot vertical layout (Top / Middle / Bottom). Each section supplies a
  // height + draw(topY). Multiple sections in one slot stack with a gap.
  function placeThree(ctx, cfg, sections) {
    const H = cfg.H;
    ["Top", "Middle", "Bottom"].forEach((slot) => {
      const items = sections.filter((s) => s.slot === slot);
      if (!items.length) return;
      const gap = 44;
      const total = items.reduce((a, s) => a + s.h, 0) + gap * (items.length - 1);
      let y = slot === "Top" ? H * 0.12 : slot === "Bottom" ? (H * 0.9 - total) : (H / 2 - total / 2);
      items.forEach((s) => { s.draw(y); y += s.h + gap; });
    });
  }

  function vignette(ctx, W, H, topA, botA) {
    let g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgba(0,4,10,${topA})`);
    g.addColorStop(0.32, "rgba(0,4,10,0)");
    g.addColorStop(0.5, "rgba(0,4,10,0)");
    g.addColorStop(1, `rgba(0,4,10,${botA})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  SCENES
  // ════════════════════════════════════════════════════════════════════════

  // 1 — THE HOOK : full-bleed laughing baby, big "FREE" payoff
  function scHook(ctx, lt, dur, cfg) {
    const { W, H, pal, t } = cfg;
    const p = dur > 0 ? lt / dur : 0;
    const img = getImg(cfg, t.hookImg || cfg.beforeSrc || DEFAULT_BEFORE_SRC);
    cover(ctx, img, 0, 0, W, H, { scale: lerp(1.06, 1.17, easeInOutSine(p)), posY: 0.4, fallback: pal.bg });
    vignette(ctx, W, H, 0.5, 0.95);

    // big payoff bottom third
    const baseY = H * 0.78;
    setFont(ctx, cfg, "display", 800, 92);
    const maxW = W - 150;
    const l1 = wrap(ctx, t.s1line1 || "We gave this photoshoot", maxW);
    const e1 = easeOutCubic(clamp((lt - 0.4) / 0.8, 0, 1));
    let y = baseY;
    l1.forEach((ln) => {
      txt(ctx, ln, W / 2, y + (1 - e1) * 26, { fill: pal.ink, alpha: e1, ls: 1, shadowBlur: 26 });
      y += 104 * cfg.FR.display.s;
    });
    // emphasised line
    const e2 = easeOutCubic(clamp((lt - 0.85) / 0.8, 0, 1));
    setFont(ctx, cfg, "display", 800, 124);
    txt(ctx, (t.s1line2 || "for FREE").toUpperCase(), W / 2, y + 22 + (1 - e2) * 30,
      { fill: pal.accent, alpha: e2, ls: 2, shadowBlur: 30 });
    rule(ctx, W / 2, y + 52, 150 * e2, pal.accent, e2 * 0.9);
  }

  // 2 — THE PROBLEM : animated before/after comparison slider
  function scProblem(ctx, lt, dur, cfg) {
    const { W, H, pal, t } = cfg;
    ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
    const enter = easeOutCubic(clamp(lt / 0.6, 0, 1));
    const before = getImg(cfg, cfg.beforeSrc || DEFAULT_BEFORE_SRC);
    const after = getImg(cfg, t.s2studio || POOL_DEFAULT[3]);

    // split position 0..1 sweeps: hold center → right → left → back to center
    const sw = clamp((typeof t.s2sweep === "number" ? t.s2sweep : 3.2), 1, 6);
    const hold = 0.7, ph = lt - hold;
    let sx = 0.5;
    if (ph <= 0) sx = 0.5;
    else if (ph < sw * 0.32) sx = lerp(0.5, 0.9, easeInOutSine(ph / (sw * 0.32)));
    else if (ph < sw * 0.72) sx = lerp(0.9, 0.1, easeInOutSine((ph - sw * 0.32) / (sw * 0.4)));
    else if (ph < sw) sx = lerp(0.1, 0.5, easeInOutSine((ph - sw * 0.72) / (sw * 0.28)));
    const splitX = W * sx;

    // AFTER fills the frame
    ctx.save(); ctx.globalAlpha *= enter;
    cover(ctx, after, 0, 0, W, H, { scale: lerp(1.1, 1.03, enter), posY: 0.32 });
    ctx.restore();
    // BEFORE clipped to the left of the divider
    ctx.save(); ctx.globalAlpha *= enter;
    ctx.beginPath(); ctx.rect(0, 0, splitX, H); ctx.clip();
    cover(ctx, before, 0, 0, W, H, { scale: lerp(1.1, 1.03, enter), posY: 0.4, filter: "grayscale(0.6) brightness(0.8) contrast(0.95)" });
    ctx.restore();

    // divider line
    ctx.save(); ctx.globalAlpha *= enter;
    ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fillRect(splitX - 2, 0, 4, H);
    ctx.shadowColor = rgba(pal.accent, 0.9); ctx.shadowBlur = 22; ctx.fillStyle = rgba(pal.accent, 0.85);
    ctx.fillRect(splitX - 1.5, 0, 3, H); ctx.shadowBlur = 0;
    // drag handle
    const hr = 36;
    ctx.beginPath(); ctx.arc(splitX, H / 2, hr, 0, Math.PI * 2);
    ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 14; ctx.fillStyle = "#fff"; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = pal.bg; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(splitX - 8, H / 2 - 10); ctx.lineTo(splitX - 17, H / 2); ctx.lineTo(splitX - 8, H / 2 + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(splitX + 8, H / 2 - 10); ctx.lineTo(splitX + 17, H / 2); ctx.lineTo(splitX + 8, H / 2 + 10); ctx.stroke();
    ctx.restore();

    // top-center label, one at a time, synced to the slider direction:
    // divider to the RIGHT reveals the phone photo → "PHONE PHOTO";
    // divider to the LEFT reveals the studio shot → "STUDIO MEMORY".
    const phoneA = clamp((sx - 0.52) / 0.28, 0, 1) * enter;
    const studioA = clamp((0.48 - sx) / 0.28, 0, 1) * enter;
    const topLabel = (str, a, fill) => {
      if (a <= 0.02) return;
      setFont(ctx, cfg, "label", 600, 32);
      const tw = ctx.measureText(str).width + str.length * 5;
      const ph = 70, bw = tw + 88, bx = W / 2 - bw / 2, by = H * 0.085;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = "rgba(0,10,22,0.46)"; rrect(ctx, bx, by, bw, ph, ph / 2); ctx.fill(); ctx.restore();
      txt(ctx, str, W / 2, by + ph / 2 + 11, { fill, ls: 5, alpha: a, shadow: false });
    };
    topLabel("PHONE PHOTO", phoneA, "#ffffff");
    topLabel("STUDIO MEMORY", studioA, pal.accent);

    // bottom line plate
    const tIn = easeOutCubic(clamp((lt - 0.6) / 0.8, 0, 1));
    const plateH = 260;
    ctx.save(); ctx.globalAlpha *= tIn * 0.9;
    const g = ctx.createLinearGradient(0, H - plateH, 0, H);
    g.addColorStop(0, "rgba(0,6,16,0)"); g.addColorStop(0.5, "rgba(0,6,16,0.82)"); g.addColorStop(1, "rgba(0,6,16,0.96)");
    ctx.fillStyle = g; ctx.fillRect(0, H - plateH, W, plateH); ctx.restore();
    setFont(ctx, cfg, "serif", 500, 56, true);
    const lines = wrap(ctx, t.s2text || "Phone photos aren't enough for memories like these.", W - 200);
    let y = H - 150 - (lines.length - 1) * 32;
    lines.forEach((ln) => { txt(ctx, ln, W / 2, y, { fill: "#fff", alpha: tIn, shadowBlur: 14 }); y += 70 * cfg.FR.serif.s; });
  }

  // 3 — STUDIO REVEAL : montage bg + word-by-word headline
  function scReveal(ctx, lt, dur, cfg) {
    const { W, H, pal, t } = cfg;
    ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
    // rotating bg with overlap so it's never blank
    const REVEAL = revealOf(cfg);
    const n = REVEAL.length;
    const seg = dur / n;
    const idx = clamp(Math.floor(lt / seg), 0, n - 1);
    const within = lt - idx * seg;
    const kb = (i, lt2, d) => lerp(1.05, 1.16, easeInOutSine(clamp(lt2 / d, 0, 1)));
    cover(ctx, getImg(cfg, REVEAL[idx]), 0, 0, W, H, { scale: kb(idx, within, seg), posY: 0.34 });
    if (within > seg - 0.6 && idx < n - 1) {
      const b = clamp((within - (seg - 0.6)) / 0.6, 0, 1);
      ctx.save(); ctx.globalAlpha *= b;
      cover(ctx, getImg(cfg, REVEAL[idx + 1]), 0, 0, W, H, { scale: kb(idx + 1, 0, seg), posY: 0.34 });
      ctx.restore();
    }
    // darken for legibility
    ctx.save(); ctx.globalAlpha *= 0.5; ctx.fillStyle = "#02060d"; ctx.fillRect(0, 0, W, H); ctx.restore();
    vignette(ctx, W, H, 0.4, 0.55);

    // word-by-word headline
    setFont(ctx, cfg, "display", 800, 96);
    const str = (t.s3text || "Studio-grade photoshoot. Zero cost.").toUpperCase();
    const lines = wrap(ctx, str, W - 200);
    const lineH = 116 * cfg.FR.display.s;
    let wi = 0;
    const totalH = lines.length * lineH;
    let y0 = H / 2 - totalH / 2 + lineH * 0.7;
    lines.forEach((ln) => {
      const words = ln.split(" ");
      const widths = words.map(w => ctx.measureText(w).width);
      const space = ctx.measureText(" ").width;
      const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
      let x = W / 2 - total / 2;
      words.forEach((w, j) => {
        const start = 0.5 + wi * 0.34;
        const e = easeOutCubic(clamp((lt - start) / 0.45, 0, 1));
        const sc = lerp(0.86, 1, e);
        ctx.save();
        ctx.translate(x + widths[j] / 2, y0);
        ctx.scale(sc, sc);
        txt(ctx, w, 0, 0, { fill: pal.ink, alpha: e, ls: 1, shadowBlur: 22 });
        ctx.restore();
        x += widths[j] + space;
        wi++;
      });
      y0 += lineH;
    });
  }

  // 4 — GALLERY MONTAGE : selectable layout + text plate
  function scGallery(ctx, lt, dur, cfg) {
    const { W, H, pal, t } = cfg;
    const bg = t.s4bg || pal.bg;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const layout = t.s4layout || "2 × 3 grid";
    const P = 56, G = 22, enter = easeOutCubic(clamp(lt / 0.6, 0, 1));
    const G_ = galleryOf(cfg);
    const tile = (src, x, y, w, h, a, scale) => {
      if (a <= 0) return;
      const cx = x + w / 2, cy = y + h / 2;
      ctx.save(); ctx.globalAlpha *= clamp(a, 0, 1);
      if (scale && scale !== 1) { ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy); }
      cover(ctx, getImg(cfg, src), x, y, w, h, { radius: 26, posY: 0.3 });
      ctx.restore();
    };

    if (layout === "Bento") {
      const iw = W - 2 * P, ih = H - 2 * P;
      const cells = [
        [0, 0, 0.62, 0.5], [0.64, 0, 0.36, 0.235], [0.64, 0.265, 0.36, 0.235],
        [0, 0.52, 0.47, 0.48], [0.49, 0.52, 0.51, 0.48],
      ];
      cells.forEach((c, i) => {
        const e = easeOutCubic(clamp((lt - (0.15 + i * 0.16)) / 0.5, 0, 1));
        tile(G_[i % G_.length], P + c[0] * iw, P + c[1] * ih, c[2] * iw, c[3] * ih, e, lerp(0.84, 1, e));
      });
    } else if (layout === "Sliding columns") {
      const cols = 2, colW = (W - 2 * P - (cols - 1) * G) / cols, ch = colW * 1.18, cell = ch + G;
      const n = G_.length, stripH = n * cell;
      for (let c = 0; c < cols; c++) {
        const x = P + c * (colW + G), dir = c % 2 ? -1 : 1;
        const off = ((lt * 78 * dir) % stripH + stripH) % stripH;
        // tile from above the top edge to below the bottom edge — never any gap
        const first = Math.floor(off / cell) - 1, last = first + Math.ceil(H / cell) + 3;
        for (let m = first; m <= last; m++) {
          const y = P - off + m * cell;
          tile(G_[((m % n) + n) % n], x, y, colW, ch, enter, 1);
        }
      }
    } else if (layout === "Sliding rows") {
      const rows = 3, rowH = (H - 2 * P - (rows - 1) * G) / rows, cw = rowH * 0.92, cell = cw + G;
      const n = G_.length, stripW = n * cell;
      for (let r = 0; r < rows; r++) {
        const y = P + r * (rowH + G), dir = r % 2 ? -1 : 1;
        const off = ((lt * 92 * dir) % stripW + stripW) % stripW;
        const first = Math.floor(off / cell) - 1, last = first + Math.ceil(W / cell) + 3;
        for (let m = first; m <= last; m++) {
          const x = P - off + m * cell;
          tile(G_[((m % n) + n) % n], x, y, cw, rowH, enter, 1);
        }
      }
    } else { // "C × R grid"
      const mt = layout.match(/(\d+)\s*[×x]\s*(\d+)/);
      const cols = mt ? +mt[1] : 2, rows = mt ? +mt[2] : 3;
      const cellW = (W - 2 * P - (cols - 1) * G) / cols;
      const cellH = (H - 2 * P - (rows - 1) * G) / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c, e = easeOutCubic(clamp((lt - (0.12 + i * 0.1)) / 0.5, 0, 1));
        tile(G_[i % G_.length], P + c * (cellW + G), P + r * (cellH + G), cellW, cellH, e, lerp(0.84, 1, e));
      }
    }

    // text plate near end — darken the gallery (like Scene 3) so text reads clearly
    const tIn = easeOutCubic(clamp((lt - (dur - 4.5)) / 0.9, 0, 1));
    if (tIn > 0) {
      ctx.save(); ctx.globalAlpha *= tIn * 0.62; ctx.fillStyle = "#02060d"; ctx.fillRect(0, 0, W, H); ctx.restore();
      const parts = (t.s4text || "Real babies. Real families. Real magic.").split(". ").map((s, i, a) => i < a.length - 1 ? s + "." : s);
      setFont(ctx, cfg, "serif", 600, 72);
      const main = t.s4textColor || "#ffffff";
      let y = H / 2 - (parts.length - 1) * 44 + 20;
      parts.forEach((ln, i) => {
        const e = easeOutCubic(clamp((lt - (dur - 4.5) - 0.2 - i * 0.4) / 0.6, 0, 1));
        const c = i === parts.length - 1 ? pal.accent : main;
        txt(ctx, ln, W / 2, y, { fill: c, alpha: e, shadowBlur: 24 });
        y += 92 * cfg.FR.serif.s;
      });
    }
  }

  // 5 — THE OFFER : logo + 3 repositionable sections
  function scOffer(ctx, lt, dur, cfg) {
    const { W, H, t } = cfg;
    const bg = cfg.offerBg || "#ffffff";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const light = luma(bg) > 0.5;
    const ink = light ? "#002b4d" : "#ffffff";
    const accent = light ? "#0047cc" : cfg.pal.accent;
    const muted = light ? "rgba(0,43,77,0.6)" : "rgba(255,255,255,0.7)";
    const fade = (d) => easeOutCubic(clamp((lt - d) / 0.7, 0, 1));

    // S1 — logo + wordmark
    const logoSize = 176, wmSize = 56;
    const s1h = logoSize + 36 + wmSize * cfg.FR.label.s;
    const s1 = { slot: t.s5S1 || "Top", h: s1h, draw: (top) => {
      const a = fade(0);
      plainLogo(ctx, cfg, W / 2, top + logoSize / 2, logoSize, a);
      setFont(ctx, cfg, "label", 700, wmSize);
      txt(ctx, "RAREST PROMPT", W / 2, top + logoSize + 36 + wmSize * 0.78 * cfg.FR.label.s, { fill: accent, ls: 5, alpha: a, shadow: false });
    } };

    // S2 — headline
    setFont(ctx, cfg, "display", 800, 84);
    const l1 = wrap(ctx, t.s5line1 || "Join the RarestPrompt Community", W - 170);
    const lh1 = 96 * cfg.FR.display.s, s2h = l1.length * lh1 + 30;
    const s2 = { slot: t.s5S2 || "Middle", h: s2h, draw: (top) => {
      const a = fade(0.4);
      setFont(ctx, cfg, "display", 800, 84);
      let y = top + lh1 * 0.82;
      l1.forEach((ln) => { txt(ctx, ln, W / 2, y, { fill: ink, alpha: a, shadow: false }); y += lh1; });
      rule(ctx, W / 2, top + s2h - 12, 110 * a, accent, a * 0.8);
    } };

    // S3 — supporting lines
    setFont(ctx, cfg, "body", 500, 46);
    const l2 = wrap(ctx, t.s5line2 || "Every week, 2–3 families get a FREE professional photoshoot.", W - 220);
    const lh2 = 64 * cfg.FR.body.s, s3h = l2.length * lh2 + 64;
    const s3 = { slot: t.s5S3 || "Bottom", h: s3h, draw: (top) => {
      const a = fade(0.9);
      setFont(ctx, cfg, "body", 500, 46);
      let y = top + lh2 * 0.8;
      l2.forEach((ln) => { txt(ctx, ln, W / 2, y, { fill: ink, alpha: a, shadow: false }); y += lh2; });
      setFont(ctx, cfg, "label", 500, 34);
      txt(ctx, (t.s5line3 || "Limited slots · No hidden cost").toUpperCase(), W / 2, y + 30, { fill: muted, ls: 4, alpha: fade(1.3), shadow: false });
    } };

    placeThree(ctx, cfg, [s1, s2, s3]);
  }

  // 6 — CALL TO ACTION : flat brand end card, 3 repositionable sections
  function scCTA(ctx, lt, dur, cfg) {
    const { W, H, pal, t } = cfg;
    ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
    const fade = (d) => easeOutCubic(clamp((lt - d) / 0.7, 0, 1));

    // S1 — logo + wordmark
    const logoSize = 224, wmSize = 60;
    const s1h = logoSize + 40 + wmSize * cfg.FR.label.s;
    const s1 = { slot: t.s6S1 || "Top", h: s1h, draw: (top) => {
      const a = fade(0);
      plainLogo(ctx, cfg, W / 2, top + logoSize / 2, logoSize, a);
      setFont(ctx, cfg, "label", 700, wmSize);
      txt(ctx, (t.kicker || "RARESTPROMPT").toUpperCase(), W / 2, top + logoSize + 40 + wmSize * 0.78 * cfg.FR.label.s, { fill: pal.ink, ls: 5, alpha: a });
    } };

    // S2 — headline
    setFont(ctx, cfg, "display", 800, 78);
    const l1 = wrap(ctx, t.s6head || "Grab your FREE slot this week", W - 200);
    const lh1 = 92 * cfg.FR.display.s, s2h = l1.length * lh1 + 36;
    const s2 = { slot: t.s6S2 || "Middle", h: s2h, draw: (top) => {
      const a = fade(0.5);
      rule(ctx, W / 2, top + 4, 120 * a, pal.accent, a * 0.7);
      setFont(ctx, cfg, "display", 800, 78);
      let y = top + lh1 * 0.82 + 24;
      l1.forEach((ln) => { txt(ctx, ln, W / 2, y, { fill: pal.ink, alpha: a, ls: 0.5, shadowBlur: 22 }); y += lh1; });
    } };

    // S3 — sub-text + button
    setFont(ctx, cfg, "label", 600, 40);
    const label = t.s6btn || "Join the Community  →";
    const tw = ctx.measureText(label).width, padX = 64, bh = 108, bw = tw + padX * 2;
    const subH = 54, gap = 40, s3h = subH + gap + bh;
    const s3 = { slot: t.s6S3 || "Bottom", h: s3h, draw: (top) => {
      const a2 = fade(1.0);
      setFont(ctx, cfg, "body", 400, 38);
      txt(ctx, t.s6sub || "Link in bio · Limited seats every Sunday", W / 2, top + 36, { fill: pal.accent, alpha: a2 });
      const e3 = easeOutBack(clamp((lt - 1.4) / 0.6, 0, 1));
      if (e3 > 0.01) {
        const pulse = 1 + Math.sin(lt * 3) * 0.012, bw2 = bw * pulse, bx = W / 2 - bw2 / 2, byb = top + subH + gap;
        ctx.save(); ctx.globalAlpha *= clamp(e3, 0, 1);
        ctx.shadowColor = rgba(pal.accent, 0.5); ctx.shadowBlur = 36; ctx.shadowOffsetY = 8;
        ctx.fillStyle = pal.accent; rrect(ctx, bx, byb, bw2, bh, bh / 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.globalAlpha *= clamp(e3, 0, 1);
        setFont(ctx, cfg, "label", 600, 40);
        txt(ctx, label, W / 2, byb + bh / 2 + 14, { fill: luma(pal.accent) > 0.6 ? "#04121f" : "#ffffff", ls: 3, shadow: false });
        ctx.restore();
      }
    } };

    placeThree(ctx, cfg, [s1, s2, s3]);
  }

  const SCENES = [scHook, scProblem, scReveal, scGallery, scOffer, scCTA];

  // ── master draw with cross-scene transitions ─────────────────────────────
export function drawFpReel(ctx, time, cfg) {
    const { W, H } = cfg;
    ctx.save(); ctx.globalAlpha = 1; ctx.filter = "none";
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const sc = cfg.scenes || scenesOf(cfg.t);
    const style = cfg.t.transStyle || "Dissolve";
    let tau = cfg.t.transStyle === "Cut" ? 0.04 : clamp((typeof cfg.t.sceneTrans === "number" ? cfg.t.sceneTrans : 0.6), 0.04, 1.4);
    for (let k = 0; k < sc.length; k++) {
      const s = sc[k];
      if (time < s.start - tau / 2 || time > s.end + tau / 2) continue;
      let a = 1, entering = null;
      if (k > 0) {
        if (time < s.start - tau / 2) a = 0;
        else if (time < s.start + tau / 2) { entering = clamp((time - (s.start - tau / 2)) / tau, 0, 1); a = entering; }
      }
      if (k < sc.length - 1) {
        if (time > s.end + tau / 2) a = 0;
        else if (time > s.end - tau / 2) a = Math.min(a, 1 - clamp((time - (s.end - tau / 2)) / tau, 0, 1));
      }
      if (a <= 0.001) continue;
      const lt = clamp(time - s.start, 0, s.dur);
      ctx.save();
      if (style === "Slide" && entering != null) {
        const p = easeOutCubic(entering);
        ctx.translate(W * (1 - p), 0);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = a;
      }
      ctx.filter = "none";
      SCENES[k](ctx, lt, s.dur, cfg);
      ctx.restore();
    }
    ctx.restore();
  }

