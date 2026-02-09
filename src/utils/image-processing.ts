export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LetterboxResult {
  file: File;
  crop: CropRect;
  target: ImageDimensions;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export const measureImage = async (src: string): Promise<ImageDimensions> => {
  const img = await loadImage(src);
  return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const letterboxToFile = async (
  src: string,
  target: ImageDimensions,
  options: {
    fileName?: string;
    mimeType?: string;
    quality?: number;
    background?: string;
    useBlurBackdrop?: boolean;
  } = {}
): Promise<LetterboxResult> => {
  const img = await loadImage(src);
  const targetWidth = Math.max(1, Math.round(target.width));
  const targetHeight = Math.max(1, Math.round(target.height));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  const coverScale = Math.max(targetWidth / imgW, targetHeight / imgH);
  const coverW = imgW * coverScale;
  const coverH = imgH * coverScale;
  const coverX = (targetWidth - coverW) / 2;
  const coverY = (targetHeight - coverH) / 2;

  ctx.fillStyle = options.background ?? '#fdf8f2';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  if (options.useBlurBackdrop !== false) {
    const blurPx = clamp(Math.min(targetWidth, targetHeight) / 18, 10, 28);
    ctx.save();
    ctx.filter = `blur(${blurPx}px)`;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(img, coverX, coverY, coverW, coverH);
    ctx.restore();

    ctx.fillStyle = 'rgba(253,248,242,0.10)';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  const containScale = Math.min(targetWidth / imgW, targetHeight / imgH);
  const drawW = imgW * containScale;
  const drawH = imgH * containScale;
  const drawX = (targetWidth - drawW) / 2;
  const drawY = (targetHeight - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  const crop: CropRect = {
    x: Math.max(0, Math.round(drawX)),
    y: Math.max(0, Math.round(drawY)),
    width: Math.max(1, Math.round(drawW)),
    height: Math.max(1, Math.round(drawH)),
  };

  const mimeType = options.mimeType ?? 'image/png';
  const quality = options.quality ?? 0.92;
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Unable to encode image'))),
      mimeType,
      quality
    );
  });

  const name = options.fileName ?? 'spraystone-upload.png';
  const file = new File([blob], name, { type: mimeType });

  return { file, crop, target: { width: targetWidth, height: targetHeight } };
};

export const cropDataUrl = async (
  src: string,
  crop: CropRect,
  options: { mimeType?: string; quality?: number } = {}
): Promise<string> => {
  const img = await loadImage(src);

  const output = document.createElement('canvas');
  output.width = Math.max(1, Math.round(crop.width));
  output.height = Math.max(1, Math.round(crop.height));

  const ctx = output.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    output.width,
    output.height
  );

  const mimeType = options.mimeType ?? 'image/png';
  const quality = options.quality ?? 0.92;
  return output.toDataURL(mimeType, quality);
};
