function hexRgb(h) {
  h = (h || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luma(h) {
  const [r, g, b] = hexRgb(h);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function contrast(a, b) {
  const la = luma(a) + 0.05;
  const lb = luma(b) + 0.05;
  return la > lb ? la / lb : lb / la;
}

export function buildPaletteFromTweaks(t, palettes) {
  const base = palettes[t.palette] || palettes.brand;
  const pal = {
    ...base,
    accent: t.accent || base.accent,
    bg: t.bgColor || base.bg,
  };

  if (luma(pal.bg) > 0.62) {
    pal.ink = '#13243a';
    pal.muted = 'rgba(19,36,58,0.78)';
    if (contrast(pal.accent, pal.bg) < 1.7) pal.accent = '#13243a';
  } else {
    pal.muted = 'rgba(255,255,255,0.85)';
  }

  if (t.textColor) {
    const [tr, tg, tb] = hexRgb(t.textColor);
    pal.ink = t.textColor;
    pal.muted = `rgba(${tr},${tg},${tb},0.82)`;
  }

  return pal;
}
