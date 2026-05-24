import express from "express";
import passport from "passport";
import {
  register,
  login,
  getMe,
  updateProfile,
  updateAvatar,
  changePassword,
  googleCallback,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/change-password", protect, changePassword);

router.get(
  "/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ success: false, message: "Google OAuth is not configured on the backend." });
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login`,
  }),
  googleCallback
);

export default router;
