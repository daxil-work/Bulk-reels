/** Remove near-black JPEG background so the colorful logo shows on reel scenes. */
export function keyBlackToTransparent(image, threshold = 42) {
  const w = image.width;
  const h = image.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    if (r <= threshold && g <= threshold && b <= threshold) {
      px[i + 3] = 0;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

export function isLogoSrc(src) {
  if (!src) return false;
  const s = src.toLowerCase();
  return s.includes('logo');
}
