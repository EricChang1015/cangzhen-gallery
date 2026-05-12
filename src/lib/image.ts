import sharp from "sharp";

export interface CompressOptions {
  quality?: number;
  maxSize?: number;
}

export interface CompressedImage {
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
  format: "webp";
}

/**
 * 將上傳的圖片壓縮成 webp，並依長邊縮放到 maxSize。
 * 預設品質 82、長邊 1920，可由後台設定覆寫。
 */
function toBuffer(input: Buffer | ArrayBuffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof ArrayBuffer) return Buffer.from(new Uint8Array(input));
  return Buffer.from(input);
}

export async function compressImage(
  input: Buffer | ArrayBuffer | Uint8Array,
  { quality = 82, maxSize = 1920 }: CompressOptions = {},
): Promise<CompressedImage> {
  const buf = toBuffer(input);
  const pipeline = sharp(buf, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const longest = Math.max(w, h);

  if (longest > maxSize) {
    if (w >= h) {
      pipeline.resize({ width: maxSize, withoutEnlargement: true });
    } else {
      pipeline.resize({ height: maxSize, withoutEnlargement: true });
    }
  }

  const out = await pipeline
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: out.data,
    width: out.info.width,
    height: out.info.height,
    bytes: out.info.size,
    format: "webp",
  };
}

export async function makeThumbnail(
  input: Buffer | ArrayBuffer | Uint8Array,
  maxSize = 600,
  quality = 78,
): Promise<CompressedImage> {
  const buf = toBuffer(input);
  const out = await sharp(buf, { failOn: "none" })
    .rotate()
    .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: out.data,
    width: out.info.width,
    height: out.info.height,
    bytes: out.info.size,
    format: "webp",
  };
}
