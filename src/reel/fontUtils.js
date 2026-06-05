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
