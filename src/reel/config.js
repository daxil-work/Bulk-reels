import { Easing } from '../engine/animations.jsx';

export const DEFAULT_BEFORE_SRC = '/assets/before.png';
/** @deprecated use DEFAULT_BEFORE_SRC */
export const BEFORE_SRC = DEFAULT_BEFORE_SRC;

export const LOGO_SRC = '/uploads/trasprent%20logo.jpeg';
export const LOGO_GLOW_SRC = '/uploads/trasprent%20logo.jpeg';

export const HEAD_FONTS = [
  'Cormorant Garamond',
  'Playfair Display',
  'DM Serif Display',
  'Lora',
  'Marcellus',
  'Jost',
];

export const BODY_FONTS = ['Jost', 'Poppins', 'Montserrat'];

export const LOOKS = [
  { n: 'Lotus Pond', src: '/uploads/8.png' },
  { n: 'Kathakali Crown', src: '/uploads/5.png' },
  { n: "Storyteller's Tent", src: '/uploads/1.png' },
  { n: 'Bandhani Hues', src: '/uploads/3.png' },
  { n: 'Madhubani Floor', src: '/uploads/2.png' },
  { n: 'Shadow Puppets', src: '/uploads/6.png' },
  { n: 'Temple Light', src: '/uploads/7.png' },
  { n: 'Map of Bhārat', src: '/uploads/4.png' },
  { n: 'The Sweet Shop', src: '/uploads/9.png' },
];

export const RATIOS = {
  '9:16': [1080, 1920],
  '4:5': [1080, 1350],
  '1:1': [1080, 1080],
  '16:9': [1920, 1080],
};

export const PALETTES = {
  brand: { bg: '#002b4d', glow: '#0047cc', accent: '#b4d8ff', ink: '#ffffff' },
  ocean: { bg: '#021a33', glow: '#0047cc', accent: '#7fb8ff', ink: '#eaf3ff' },
  midnight: { bg: '#0c0a10', glow: '#22314a', accent: '#b4d8ff', ink: '#f3f6fb' },
  maroon: { bg: '#1a070c', glow: '#5a1620', accent: '#e6c074', ink: '#f7ead3' },
};

export const TWEAK_DEFAULTS = {
  ratio: '9:16',
  palette: 'brand',
  accent: '#002b4d',
  textColor: '',
  headlineFont: 'Lora',
  bodyFont: 'Montserrat',
  bgColor: '',
  imageAnim: 'Slide up',
  labelAnim: 'Wipe',
  labelPos: 'Bottom right',
  showLogo: true,
  transition: 'dissolve',
  transLen: 1.6,
  beforeHold: 5.8,
  montagePace: 1.9,
  motion: 6,
  hero: 'Map of Bhārat',
  kicker: 'RarestPrompt',
  hook1: 'One photo.',
  hook2: 'Endless tradition.',
  themeName: 'Traditional Indian Theme',
  titleS1: 'Top',
  titleS2: 'Middle',
  titleS3: 'Bottom',
  beforeLabel: 'Before',
  beforeSub: 'the everyday original',
  afterLabel: 'After',
  endTitle: 'Rarest Prompt',
  endTagline: 'Upgrade your photoshoots in seconds',
  endUrl: 'rarestprompt.com',
  endS1: 'Top',
  endS2: 'Middle',
  endS3: 'Bottom',
  fontWordmark: 'Default',
  sizeWordmark: 100,
  fontHeadline: 'Default',
  sizeHeadline: 100,
  fontSubhead: 'Default',
  sizeSubhead: 100,
  fontLabel: 'Default',
  sizeLabel: 145,
  fontCaption: 'Default',
  sizeCaption: 100,
};

export const TXT_SHADOW = '0 2px 16px rgba(0,0,0,0.75)';

export const num = (v, d) => (typeof v === 'number' && !isNaN(v)) ? v : d;

export function timings(t, montageCount = 8) {
  const transLen = num(t.transLen, 1.6);
  const perLook = num(t.montagePace, 1.8);
  const lookDur = perLook + 0.7;
  const bStart = 3.7;
  const transStart = bStart + num(t.beforeHold, 5.8);
  const mStart = transStart + 6.5;
  const n = Math.max(0, montageCount);
  const mEnd = mStart + (n - 1) * perLook + lookDur;
  const endStart = mEnd - 0.2;
  const endLen = 4.2;
  return {
    title: [0, 4.3],
    before: [bStart, transStart + 1.1],
    bLabel: [transStart - 4.8, transStart + 0.4],
    trans: [transStart, transStart + transLen],
    after: [transStart + 0.3, mStart + 0.7],
    aLabel: [transStart + 1.3, mStart - 0.1],
    mStart,
    mStep: perLook,
    mDur: lookDur,
    n,
    cLabel: [mStart + 0.2, mEnd - 0.4],
    end: [endStart, endStart + endLen],
    DURATION: endStart + endLen,
  };
}

export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function collectionSubtext(count, themeName) {
  const theme = (themeName || 'themed').trim();
  if (count === 1) return `One ${theme} look`;
  return `${count} ${theme} looks`;
}

export function fadeIO(lt, dur, ins = 0.7, outs = 0.7) {
  let o = 1;
  if (lt < ins) o = clamp(lt / ins, 0, 1);
  else if (lt > dur - outs) o = clamp((dur - lt) / outs, 0, 1);
  return Easing.easeInOutSine(o);
}
