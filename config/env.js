/**
 * URLs from environment only (Render). No localhost defaults.
 */

const isProduction = process.env.NODE_ENV === "production";

export const PORT = Number(process.env.PORT) || 5000;

function stripTrailingSlash(url) {
  return url ? url.replace(/\/$/, "") : "";
}

/** Public API URL — Render: BACKEND_URL or RENDER_EXTERNAL_URL */
export const BACKEND_URL = stripTrailingSlash(
  process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.RENDER_BACKEND_URL ||
    ""
);

/** Deployed frontend (Render) — CORS + OAuth redirects */
export const FRONTEND_URL = stripTrailingSlash(
  process.env.FRONTEND_URL || process.env.CLIENT_URL || ""
);

function resolveGoogleCallbackUrl() {
  const fromEnv = process.env.GOOGLE_CALLBACK_URL?.trim();
  const derived = BACKEND_URL ? `${BACKEND_URL}/api/auth/google/callback` : "";

  if (fromEnv && /localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return stripTrailingSlash(derived);
  }

  return stripTrailingSlash(fromEnv || derived);
}

export const GOOGLE_CALLBACK_URL = resolveGoogleCallbackUrl();

function addOriginVariant(set, url) {
  if (!url) return;
  set.add(stripTrailingSlash(url));
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host.startsWith("www.")) {
      set.add(stripTrailingSlash(`${u.protocol}//${host.slice(4)}`));
    } else {
      set.add(stripTrailingSlash(`${u.protocol}//www.${host}`));
    }
  } catch {
    /* ignore */
  }
}

function isRenderPreviewOrigin(origin) {
  return /^https:\/\/[\w.-]+\.onrender\.com$/i.test(origin);
}

function isVercelPreviewOrigin(origin) {
  return /^https:\/\/[\w.-]+\.vercel\.app$/i.test(origin);
}

export function getAllowedOrigins() {
  const origins = new Set();

  addOriginVariant(origins, FRONTEND_URL);

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .forEach((o) => addOriginVariant(origins, o));
  }

  return [...origins];
}

export function isOriginAllowed(origin) {
  if (!origin) return true;

  if (
    !isProduction &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  ) {
    return true;
  }

  const normalized = stripTrailingSlash(origin);
  if (getAllowedOrigins().includes(normalized)) return true;

  const allowRender =
    process.env.CORS_ALLOW_RENDER_PREVIEWS === "true" ||
    FRONTEND_URL?.includes("onrender.com");

  if (allowRender && isRenderPreviewOrigin(normalized)) return true;

  const allowVercel =
    process.env.CORS_ALLOW_VERCEL_PREVIEWS === "true" ||
    FRONTEND_URL?.includes("vercel.app");

  if (allowVercel && isVercelPreviewOrigin(normalized)) return true;

  return false;
}

export function assertProductionEnv() {
  if (!isProduction) return;

  const missing = [];
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) missing.push("MONGO_URI");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!FRONTEND_URL) missing.push("FRONTEND_URL");
  if (!BACKEND_URL) missing.push("BACKEND_URL or RENDER_EXTERNAL_URL");

  if (missing.length) {
    console.warn(`⚠️  Production: missing env: ${missing.join(", ")}`);
  }
}
