import { GOOGLE_CALLBACK_URL } from "./env.js";

/** Detect placeholder / unset Google OAuth credentials */
const PLACEHOLDER_MARKERS = [
  "PASTE",
  "YAHAN_APNA",
  "your_google_client",
  "PASTE_YOUR_GOOGLE",
  "example",
  "changeme",
];

export function isGoogleOAuthConfigured() {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) return false;

  const looksPlaceholder = (value) => {
    const upper = value.toUpperCase();
    return PLACEHOLDER_MARKERS.some((m) => upper.includes(m.toUpperCase()));
  };

  if (looksPlaceholder(id) || looksPlaceholder(secret)) return false;
  if (id.length < 20 || secret.length < 20) return false;

  return true;
}

export function googleOAuthConfigMessage() {
  if (isGoogleOAuthConfigured()) {
    return "Google Sign-In is configured.";
  }
  const redirectHint = GOOGLE_CALLBACK_URL || "Set BACKEND_URL or GOOGLE_CALLBACK_URL";
  return (
    "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. " +
    `Redirect URI: ${redirectHint}`
  );
}
