import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { loadImg, drawReel } from './drawReel.js';

function pickMime() {
  const cands = ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const c of cands) {
    try {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
    } catch {}
  }
  return 'video/webm';
}

export async function preloadAssets(headFam, srcs) {
  try {
    await Promise.all([
      document.fonts.load(`600 104px "${headFam}"`),
      document.fonts.load(`italic 600 104px "${headFam}"`),
      document.fonts.load('500 24px "Jost"'),
      document.fonts.load('400 30px "Jost"'),
    ]);
    await document.fonts.ready;
  } catch {}
  const uniqueSrcs = [...new Set(srcs)];
  const imgs = {};
  for (const s of uniqueSrcs) {
    try {
      const im = await loadImg(s);
      const maxW = 1280;
      const maxH = 2280;
      const sc = Math.min(1, maxW / im.width, maxH / im.height);
      const w = Math.round(im.width * sc);
      const h = Math.round(im.height * sc);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(im, 0, 0, w, h);
      imgs[s] = c;
    } catch {
      imgs[s] = null;
    }
  }
  return imgs;
}

export async function encodeMP4(cfg, onProgress) {
  if (!window.VideoEncoder || !window.VideoFrame) return null;
  const fps = 30;
  const frames = Math.round(cfg.TT.DURATION * fps);
  const W = cfg.W || 1080;
  const H = cfg.H || 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  let muxer;
  let encoder;
  try {
    muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width: W, height: H },
      fastStart: 'in-memory',
    });
    encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('encoder', e),
    });
  } catch {
    return null;
  }
  const codecs = ['avc1.640028', 'avc1.4d4028', 'avc1.420028'];
  let ok = false;
  for (const codec of codecs) {
    try {
      if (VideoEncoder.isConfigSupported) {
        const sup = await VideoEncoder.isConfigSupported({
          codec,
          width: W,
          height: H,
          bitrate: 12000000,
          framerate: fps,
        });
        if (!sup || !sup.supported) continue;
      }
      encoder.configure({ codec, width: W, height: H, bitrate: 12000000, framerate: fps });
      ok = true;
      break;
    } catch {}
  }
  if (!ok) {
    try {
      encoder.close();
    } catch {}
    return null;
  }
  try {
    for (let i = 0; i < frames; i++) {
      drawReel(ctx, i / fps, cfg);
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(i * 1e6 / fps),
        duration: Math.round(1e6 / fps),
      });
      encoder.encode(frame, { keyFrame: i % fps === 0 });
      frame.close();
      if (encoder.encodeQueueSize > 12) await new Promise((r) => setTimeout(r, 0));
      if (onProgress && i % 4 === 0) onProgress(i / frames);
    }
    await encoder.flush();
    muxer.finalize();
    return new Blob([muxer.target.buffer], { type: 'video/mp4' });
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function recordRealtime(cfg, onProgress) {
  const W = cfg.W || 1080;
  const H = cfg.H || 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const mime = pickMime();
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
  const chunks = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  const done = new Promise((resolve) => {
    rec.onstop = () =>
      resolve({
        blob: new Blob(chunks, { type: mime }),
        ext: mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm',
      });
  });
  rec.start();
  const start = performance.now();
  const D = cfg.TT.DURATION;
  await new Promise((resolve) => {
    const frame = () => {
      const tt = (performance.now() - start) / 1000;
      if (tt >= D) {
        drawReel(ctx, D - 0.001, cfg);
        setTimeout(() => {
          try {
            rec.stop();
          } catch {}
        }, 250);
        resolve();
        return;
      }
      drawReel(ctx, tt, cfg);
      onProgress && onProgress(tt / D);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  return done;
}

export function downloadBlob(blob, ext, baseName = 'before-after-reel') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}.${ext}`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
}
