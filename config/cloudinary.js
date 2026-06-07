import { v2 as cloudinary } from "cloudinary";

const PLACEHOLDER_CLOUD_NAMES = ["YOUR_CLOUD_NAME", "your_cloud_name", "PASTE", "EXAMPLE"];

function parseCloudinaryUrl(url) {
  if (!url?.startsWith("cloudinary://")) return null;
  try {
    const withoutScheme = url.replace("cloudinary://", "");
    const at = withoutScheme.lastIndexOf("@");
    if (at === -1) return null;
    const cloudName = withoutScheme.slice(at + 1).split("?")[0];
    const keySecret = withoutScheme.slice(0, at);
    const colon = keySecret.indexOf(":");
    if (colon === -1) return null;
    return {
      cloud_name: cloudName,
      api_key: keySecret.slice(0, colon),
      api_secret: keySecret.slice(colon + 1),
    };
  } catch {
    return null;
  }
}

export function getCloudinaryCredentials() {
  const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  if (fromUrl) return fromUrl;

  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  };
}

export function isCloudinaryConfigured() {
  const { cloud_name, api_key, api_secret } = getCloudinaryCredentials();

  if (!cloud_name || !api_key || !api_secret) return false;

  const nameUpper = cloud_name.toUpperCase();
  if (PLACEHOLDER_CLOUD_NAMES.some((p) => nameUpper.includes(p.toUpperCase()))) {
    return false;
  }

  return true;
}

export function configureCloudinary() {
  if (!isCloudinaryConfigured()) {
    console.warn(
      "⚠️  Cloudinary: not configured — set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET in .env"
    );
    console.warn(
      "    Dashboard: https://console.cloudinary.com → copy API environment variable (cloudinary://...)"
    );
    return false;
  }

  const creds = getCloudinaryCredentials();
  cloudinary.config({
    cloud_name: creds.cloud_name,
    api_key: creds.api_key,
    api_secret: creds.api_secret,
    secure: true,
  });

  return true;
}

/** Ping Cloudinary on startup (optional sanity check) */
export async function verifyCloudinaryConnection() {
  if (!isCloudinaryConfigured()) return false;
  try {
    await cloudinary.api.ping();
    return true;
  } catch (err) {
    console.error("❌ Cloudinary ping failed:", err.message);
    return false;
  }
}

const PRODUCT_FOLDER = process.env.CLOUDINARY_PRODUCT_FOLDER || "ecommerce-products";

export function uploadToCloudinary(buffer, folder = PRODUCT_FOLDER) {
  if (!isCloudinaryConfigured()) {
    return Promise.reject(new Error("Cloudinary is not configured on the server"));
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export { cloudinary };
