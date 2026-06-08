import { clamp, num } from './config.js';

export const ALL_FONTS = [
  'Cormorant Garamond',
  'Playfair Display',
  'DM Serif Display',
  'Lora',
  'Marcellus',
  'Jost',
  'Poppins',
  'Montserrat',
];

export const SERIF_FONTS = [
  'Cormorant Garamond',
  'Playfair Display',
  'DM Serif Display',
  'Lora',
  'Marcellus',
];

/** Per-element font family + scale for wordmark, headline, subhead, label, caption. */
export function primaryFontName(fam) {
  const m = String(fam).match(/'([^']+)'/);
  return m ? m[1] : String(fam).replace(/['"]/g, '').split(',')[0].trim();
}

/** Font faces needed for canvas export to match HTML preview. */
export function exportFontLoads(t, headFam, bodyFam) {
  const sans = `"${bodyFam}", sans-serif`;
  const serif = `"${headFam}", serif`;
  const FR = buildFR(t, sans, serif);
  const px = (n) => Math.max(12, Math.round(n));
  const loads = new Set([
    `600 ${px(104)}px "${headFam}"`,
    `italic 600 ${px(104)}px "${headFam}"`,
    `700 ${px(66)}px "${bodyFam}"`,
    `500 ${px(24)}px "${bodyFam}"`,
    `400 ${px(30)}px "${bodyFam}"`,
    `700 ${px(54 * FR.wordmark.s)}px ${primaryFontName(FR.wordmark.fam)}`,
    `600 ${px(100 * FR.headline.s)}px ${primaryFontName(FR.headline.fam)}`,
    `italic 600 ${px(100 * FR.headline.s)}px ${primaryFontName(FR.headline.fam)}`,
    `italic 500 ${px(46 * FR.subhead.s)}px ${primaryFontName(FR.subhead.fam)}`,
    `500 ${px(22 * FR.label.s)}px ${primaryFontName(FR.label.fam)}`,
    `500 ${px(26 * FR.caption.s)}px ${primaryFontName(FR.caption.fam)}`,
  ]);
  for (const f of ALL_FONTS) loads.add(`500 60px "${f}"`);
  return [...loads];
}

export function buildFR(t, sansBase, serifBase) {
  const famOf = (v, base) => {
    if (!v || v === 'Default' || !ALL_FONTS.includes(v)) return base;
    return `'${v}', ${SERIF_FONTS.includes(v) ? 'serif' : 'sans-serif'}`;
  };
  const sc = (v) => clamp(num(v, 100), 50, 180) / 100;
  return {
    wordmark: { fam: famOf(t.fontWordmark, sansBase), s: sc(t.sizeWordmark) },
    headline: { fam: famOf(t.fontHeadline, serifBase), s: sc(t.sizeHeadline) },
    subhead: { fam: famOf(t.fontSubhead, serifBase), s: sc(t.sizeSubhead) },
    label: { fam: famOf(t.fontLabel, sansBase), s: sc(t.sizeLabel) },
    caption: { fam: famOf(t.fontCaption, sansBase), s: sc(t.sizeCaption) },
  };
}
