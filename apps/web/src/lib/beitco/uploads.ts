// PROD-1: image upload helper. Flag/config-aware so the listing wizard has a
// single call site regardless of backend:
//   - API mode + uploads configured (S3/R2): downscale -> presigned PUT ->
//     return the public URL (no base64 in the DB).
//   - otherwise (mock, or S3 not configured): downscale -> return a base64 data
//     URL, exactly like before (zero-setup dev + the localStorage prototype).
import { USE_API, apiPresignUpload } from "./api";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

// Downscale a File to a JPEG data URL (caps the longest edge). Big phone photos
// otherwise bloat storage and render inconsistently.
export async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  try {
    return await downscaleDataUrl(raw, MAX_EDGE, JPEG_QUALITY);
  } catch {
    return raw; // fall back to the original if canvas isn't available (SSR/test)
  }
}

function downscaleDataUrl(dataUrl: string, maxEdge: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxEdge / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no-2d-context"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Convert a data URL back to a Blob for the PUT body.
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Upload one image; returns the URL to store on the listing (a CDN/S3 URL when
// uploads are configured, else a base64 data URL).
export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await fileToDownscaledDataUrl(file);

  if (!USE_API) return dataUrl; // mock/prototype: keep base64

  // Try a direct-to-storage upload; fall back to base64 on any miss so the
  // wizard never hard-fails on a flaky storage config.
  try {
    const blob = dataUrlToBlob(dataUrl);
    const presign = await apiPresignUpload(blob.type, blob.size);
    if (!presign.configured || !presign.uploadUrl || !presign.publicUrl) return dataUrl;

    const put = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: presign.headers ?? { "Content-Type": blob.type },
      body: blob,
    });
    if (!put.ok) return dataUrl;
    return presign.publicUrl;
  } catch {
    return dataUrl;
  }
}
