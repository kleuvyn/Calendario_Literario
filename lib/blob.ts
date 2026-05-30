import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

type ImageMime = "image/png" | "image/jpeg" | "image/webp" | "image/gif" | "image/avif";

const SUPPORTED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function parseDataUrl(dataUrl: string): { mime: ImageMime; buffer: Buffer; ext: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const ext = SUPPORTED_MIME[mime];
  if (!ext) return null;

  return {
    mime: mime as ImageMime,
    buffer: Buffer.from(base64, "base64"),
    ext,
  };
}

function getBlobToken() {
  return process.env.VERCEL_BLOB_RW_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
}

export async function resolveCoverUrl(rawCoverUrl: unknown): Promise<string | null> {
  if (typeof rawCoverUrl !== "string") return null;

  const trimmed = rawCoverUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (!trimmed.startsWith("data:image/")) {
    return null;
  }

  const parsed = parseDataUrl(trimmed);
  if (!parsed) {
    return null;
  }

  const token = getBlobToken();
  const filename = `covers/${Date.now()}-${randomUUID()}.${parsed.ext}`;

  const uploadOptions = token
    ? { access: "public" as const, contentType: parsed.mime, token }
    : { access: "public" as const, contentType: parsed.mime };

  const result = await put(filename, parsed.buffer, uploadOptions);
  return result.url;
}