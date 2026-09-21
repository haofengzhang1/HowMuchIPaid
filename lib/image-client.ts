export async function fileToJpegDataUrl(
  file: File,
  {
    maxEdge,
    quality,
    square,
  }: {
    maxEdge: number;
    quality: number;
    square?: boolean;
  },
) {
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    throw new Error("image");
  }
  const bitmap = await createImageBitmap(file);
  const sourceSize = square ? Math.min(bitmap.width, bitmap.height) : Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxEdge / sourceSize);
  const width = square ? Math.round(sourceSize * scale) : Math.round(bitmap.width * scale);
  const height = square ? Math.round(sourceSize * scale) : Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("image");
  if (square) {
    const sx = (bitmap.width - sourceSize) / 2;
    const sy = (bitmap.height - sourceSize) / 2;
    ctx.drawImage(bitmap, sx, sy, sourceSize, sourceSize, 0, 0, width, height);
  } else {
    ctx.drawImage(bitmap, 0, 0, width, height);
  }
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
