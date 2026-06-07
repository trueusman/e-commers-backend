import express from "express";
import passport from "passport";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updateAvatar,
  removeAvatar,
  changePassword,
  googleCallback,
  googleAuthStatus,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import uploadMemory from "../middleware/uploadMemory.js";
import { isGoogleOAuthConfigured, googleOAuthConfigMessage } from "../config/googleOAuth.js";
import { requireDb } from "../middleware/requireDb.js";
import { isDbConnected } from "../config/db.js";
import { FRONTEND_URL } from "../config/env.js";

const router = express.Router();

const oauthRedirect = (path) => {
  if (!FRONTEND_URL) {
    return null;
  }
  return `${FRONTEND_URL}${path}`;
};

const requireDbOAuth = (req, res, next) => {
  if (isDbConnected()) return next();
  const target = oauthRedirect("/auth/google/callback?error=google_failed&message=" +
    encodeURIComponent("Database is not connected. Check MongoDB Atlas."));
  if (!target) {
    return res.status(503).json({ success: false, message: "FRONTEND_URL is not configured" });
  }
  return res.redirect(target);
};

router.post("/register", requireDb, uploadMemory.single("avatar"), register);
router.post("/login", requireDb, login);
router.post("/logout", logout);
router.get("/me", requireDb, protect, getMe);
router.put("/update-profile", requireDb, protect, updateProfile);
router.put("/avatar", requireDb, protect, uploadMemory.single("avatar"), updateAvatar);
router.delete("/avatar", requireDb, protect, removeAvatar);
router.put("/change-password", requireDb, protect, changePassword);

router.get("/google/status", googleAuthStatus);

router.get(
  "/google",
  requireDbOAuth,
  (req, res, next) => {
    if (!isGoogleOAuthConfigured()) {
      return res.status(503).json({
        success: false,
        message: googleOAuthConfigMessage(),
        help: "https://console.cloud.google.com/apis/credentials",
      });
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback", requireDbOAuth, (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err) {
      console.error("Google OAuth error:", err.message);
      const message = encodeURIComponent(err.message || "Google sign-in failed");
      const errTarget = oauthRedirect(`/auth/google/callback?error=google_failed&message=${message}`);
      if (!errTarget) {
        return res.status(503).json({ success: false, message: "FRONTEND_URL is not configured" });
      }
      return res.redirect(errTarget);
    }
    if (!user) {
      const failTarget = oauthRedirect("/login?error=google_failed");
      if (!failTarget) {
        return res.status(503).json({ success: false, message: "FRONTEND_URL is not configured" });
      }
      return res.redirect(failTarget);
    }
    req.user = user;
    return googleCallback(req, res);
  })(req, res, next);
});

export default router;
