const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const DEFAULT_FOLDER = (import.meta.env.VITE_CLOUDINARY_FOLDER as string | undefined) || "users";

if (!CLOUD_NAME || !UPLOAD_PRESET) {
  // Don't throw here to avoid breaking the app at import time; we'll validate when used.
  console.warn("Cloudinary env missing: VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET");
}

export type CloudinaryUploadResult = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename: string;
};

export async function uploadImageToCloudinary(file: File, options?: { folder?: string }) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env.local");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file");
  }
  if (file.size > 1024 * 1024) {
    throw new Error("Image must be <= 1MB");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", options?.folder || DEFAULT_FOLDER);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as CloudinaryUploadResult;
  return data;
}
