/**
 * cloudinary.ts — OmniSocial Media Upload Helpers
 *
 * Uses Cloudinary's unsigned upload endpoint so the browser never
 * touches your API secret. The upload preset must be created in the
 * Cloudinary dashboard with "Unsigned" mode enabled.
 *
 * Required env variables (Vite):
 *   VITE_CLOUDINARY_CLOUD_NAME   — your cloud name (e.g. "myapp")
 *   VITE_CLOUDINARY_UPLOAD_PRESET — unsigned upload preset name
 *
 * Exports:
 *   uploadToCloudinary(file, options?)  → Promise<string>  (secure_url)
 *   uploadMultiple(files, options?)     → Promise<string[]>
 *   getOptimizedUrl(url, transforms)    → string
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UploadOptions {
  /** Sub-folder inside your Cloudinary media library */
  folder?: string;
  /** Max width/height (Cloudinary will crop/scale server-side) */
  maxDimension?: number;
  /** Listener for upload progress 0–100 */
  onProgress?: (pct: number) => void;
}

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video" | "raw";
  width?: number;
  height?: number;
  duration?: number;   // video seconds
  format: string;
  bytes: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME    as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  console.warn(
    "[cloudinary] VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET is not set."
  );
}

// ─── Core upload ───────────────────────────────────────────────────────────────

/**
 * Upload a single File to Cloudinary.
 * Returns the `secure_url` (HTTPS CDN URL) of the uploaded asset.
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const { folder = "omnisocial", onProgress } = options;

  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const endpoint     = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file",           file);
  formData.append("upload_preset",  UPLOAD_PRESET);
  formData.append("folder",         folder);

  // Use XHR so we get progress events; fetch() doesn't expose upload progress
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as CloudinaryResponse;
          resolve(data.secure_url);
        } catch {
          reject(new Error("Failed to parse Cloudinary response."));
        }
      } else {
        reject(
          new Error(
            `Cloudinary upload failed: ${xhr.status} ${xhr.statusText}`
          )
        );
      }
    });

    xhr.addEventListener("error",  () => reject(new Error("Network error during upload.")));
    xhr.addEventListener("abort",  () => reject(new Error("Upload was aborted.")));

    xhr.open("POST", endpoint);
    xhr.send(formData);
  });
}

// ─── Batch upload ──────────────────────────────────────────────────────────────

/**
 * Upload multiple files concurrently.
 * Returns an array of secure_urls in the same order as the input files.
 */
export async function uploadMultiple(
  files: File[],
  options: UploadOptions = {}
): Promise<string[]> {
  return Promise.all(files.map((f) => uploadToCloudinary(f, options)));
}

// ─── URL transformation helper ─────────────────────────────────────────────────

type CloudinaryTransform = {
  width?:   number;
  height?:  number;
  crop?:    "fill" | "fit" | "scale" | "thumb" | "crop";
  quality?: number | "auto";
  format?:  "auto" | "webp" | "avif" | "jpg" | "png";
  gravity?: "auto" | "face" | "center";
};

/**
 * Inject Cloudinary transformations into an existing secure_url.
 *
 * Example:
 *   getOptimizedUrl(url, { width: 400, crop: "fill", quality: "auto", format: "auto" })
 *   → "https://res.cloudinary.com/myapp/image/upload/w_400,c_fill,q_auto,f_auto/v1.../file.jpg"
 */
export function getOptimizedUrl(
  url: string,
  transforms: CloudinaryTransform
): string {
  if (!url.includes("res.cloudinary.com")) return url;

  const parts: string[] = [];
  if (transforms.width)   parts.push(`w_${transforms.width}`);
  if (transforms.height)  parts.push(`h_${transforms.height}`);
  if (transforms.crop)    parts.push(`c_${transforms.crop}`);
  if (transforms.quality) parts.push(`q_${transforms.quality}`);
  if (transforms.format)  parts.push(`f_${transforms.format}`);
  if (transforms.gravity) parts.push(`g_${transforms.gravity}`);

  const transformation = parts.join(",");
  if (!transformation) return url;

  // Insert transformation string between "/upload/" and the version/path segment
  return url.replace("/upload/", `/upload/${transformation}/`);
}

// ─── Convenience preset ────────────────────────────────────────────────────────

/**
 * Returns a responsive thumbnail URL suitable for feed previews.
 * 800 px wide, auto crop, auto quality & format (WebP/AVIF on supporting browsers).
 */
export function feedThumbnail(url: string): string {
  return getOptimizedUrl(url, {
    width:   800,
    crop:    "fill",
    quality: "auto",
    format:  "auto",
    gravity: "auto",
  });
}
