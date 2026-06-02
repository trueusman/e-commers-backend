import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";

const AVATAR_FOLDER = process.env.CLOUDINARY_AVATAR_FOLDER || "bazaarhub/avatars";

const uploadOptions = {
  folder: AVATAR_FOLDER,
  resource_type: "image",
  transformation: [
    { width: 512, height: 512, crop: "fill", gravity: "auto" },
    { quality: "auto", fetch_format: "auto" },
  ],
};

/** DiceBear fallback when no image or Cloudinary unavailable */
export function defaultAvatarUrl(nameOrEmail) {
  const seed = encodeURIComponent(nameOrEmail || "user");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=0f172a&textColor=ffffff`;
}

export function isCloudinaryAvatarUrl(url) {
  return Boolean(url && url.includes("res.cloudinary.com"));
}

/** Extract public_id from a Cloudinary delivery URL for destroy() */
export function extractCloudinaryPublicId(url) {
  if (!isCloudinaryAvatarUrl(url)) return null;
  try {
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}

export async function deleteCloudinaryAvatar(url) {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.warn("Cloudinary delete skipped:", err.message);
  }
}

/**
 * Upload Google (or any remote) profile image URL → Cloudinary secure URL
 */
export async function uploadAvatarFromUrl(imageUrl, identifier = "user") {
  if (!imageUrl) {
    throw new Error("No image URL provided");
  }
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured on the server");
  }

  const result = await cloudinary.uploader.upload(imageUrl, {
    ...uploadOptions,
    public_id: `google_${identifier}_${Date.now()}`,
    overwrite: true,
  });

  return result.secure_url;
}

/**
 * Upload multer memory buffer → Cloudinary secure URL
 */
export async function uploadAvatarFromBuffer(file, identifier = "user") {
  if (!file?.buffer) {
    throw new Error("No image file provided");
  }
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured on the server");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        ...uploadOptions,
        public_id: `local_${identifier}_${Date.now()}`,
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary did not return an image URL"));
        }
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

/**
 * Resolve avatar for signup: file → Cloudinary, else DiceBear default
 */
export async function resolveSignupAvatar(file, name, email) {
  if (file) {
    const id = (email || name || "user").toLowerCase().replace(/[^a-z0-9]/g, "_");
    return uploadAvatarFromBuffer(file, id);
  }
  return defaultAvatarUrl(name || email);
}

/**
 * Resolve avatar for Google OAuth: Google photo → Cloudinary, else default
 */
export async function resolveGoogleAvatar(googlePhotoUrl, profileId, name, email) {
  if (googlePhotoUrl && isCloudinaryConfigured()) {
    try {
      return await uploadAvatarFromUrl(googlePhotoUrl, profileId || "google");
    } catch (err) {
      console.error("Google avatar Cloudinary upload failed:", err.message);
    }
  }

  // Cloudinary off or failed — use Google CDN URL so the photo still shows
  if (googlePhotoUrl) {
    return googlePhotoUrl.replace(/=s\d+(-c)?$/, "=s512$1");
  }

  return defaultAvatarUrl(name || email);
}
