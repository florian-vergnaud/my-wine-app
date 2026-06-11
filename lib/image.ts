"use client";

/**
 * Reads an image File and returns a downscaled JPEG data URL.
 * Downscaling keeps uploads small (under serverless body limits) and reduces
 * vision-token cost when sent to Claude.
 */
export async function fileToResizedDataUrl(
  file: File,
  maxEdge = 1280,
  quality = 0.82,
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxEdge || height > maxEdge) {
    const scale = maxEdge / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Splits a data URL into mime + base64 for the Claude vision API. */
export function dataUrlParts(
  dataUrl: string,
): { mediaType: string; data: string } | null {
  const m = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { mediaType: m[1], data: m[2] };
}
