import jwt from "jsonwebtoken";

import User from "../models/User.js";

import { isGoogleOAuthConfigured, googleOAuthConfigMessage } from "../config/googleOAuth.js";
import { isCloudinaryConfigured } from "../config/cloudinary.js";
import { FRONTEND_URL, GOOGLE_CALLBACK_URL } from "../config/env.js";

import {

  defaultAvatarUrl,

  resolveSignupAvatar,

  uploadAvatarFromBuffer,

  deleteCloudinaryAvatar,

} from "../utils/avatarUpload.js";



const generateToken = (id) =>

  jwt.sign({ id }, process.env.JWT_SECRET, {

    expiresIn: process.env.JWT_EXPIRE || "7d",

  });



// @route   POST /api/auth/register

export const register = async (req, res, next) => {

  try {

    const { name, email, phone = "", password, city = "" } = req.body;



    if (!name || !email || !password) {

      return res.status(400).json({

        success: false,

        message: "Name, email and password are required",

      });

    }



    if (req.file && !isCloudinaryConfigured()) {

      return res.status(503).json({

        success: false,

        message:
          "Image upload is unavailable. Set CLOUDINARY_URL in backend .env (from Cloudinary Dashboard → API environment variable) or set CLOUDINARY_CLOUD_NAME + API keys.",
        help: "https://console.cloudinary.com",

      });

    }



    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {

      return res.status(409).json({

        success: false,

        message: "An account with this email already exists",

      });

    }



    let avatar;

    try {

      avatar = await resolveSignupAvatar(req.file, name, email);

    } catch (uploadErr) {

      return res.status(400).json({

        success: false,

        message: uploadErr.message || "Failed to upload profile image",

      });

    }



    const user = await User.create({

      name,

      email,

      phone,

      password,

      city,

      avatar,

      authType: "local",

      isVerified: false,

    });



    const token = generateToken(user._id);



    return res.status(201).json({

      success: true,

      message: "Account created successfully",

      token,

      user: user.toSafeObject(),

    });

  } catch (error) {

    next(error);

  }

};



// @route   POST /api/auth/login

export const login = async (req, res, next) => {

  try {

    const { email, password } = req.body;



    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message: "Email and password are required",

      });

    }



    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");



    if (!user) {

      return res.status(401).json({ success: false, message: "Invalid email or password" });

    }



    if (user.authType === "google" && !user.password) {

      return res.status(401).json({

        success: false,

        message: "This account uses Google Sign-In. Please log in with Google.",

      });

    }



    const isMatch = await user.matchPassword(password);

    if (!isMatch) {

      return res.status(401).json({ success: false, message: "Invalid email or password" });

    }



    const token = generateToken(user._id);



    return res.json({

      success: true,

      message: "Login successful",

      token,

      user: user.toSafeObject(),

    });

  } catch (error) {

    next(error);

  }

};



export const googleAuthStatus = (req, res) => {
  const redirectUri = GOOGLE_CALLBACK_URL;

  res.json({
    success: true,
    configured: isGoogleOAuthConfigured(),
    cloudinaryConfigured: isCloudinaryConfigured(),
    message: googleOAuthConfigMessage(),
    redirectUri,
    googleConsoleHint:
      "In Google Cloud Console → Credentials → your OAuth client → Authorized redirect URIs, add this EXACT value (no trailing slash):",
    alsoAddInConsole: redirectUri ? [redirectUri] : [],
  });
};

export const googleCallback = (req, res) => {
  if (!FRONTEND_URL) {
    return res.status(500).json({
      success: false,
      message: "FRONTEND_URL is not configured on the server",
    });
  }

  if (!req.user) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }



  const token = generateToken(req.user._id);

  return res.redirect(`${FRONTEND_URL}/auth/google/callback?token=${token}`);

};



export const getMe = async (req, res) => {

  return res.json({ success: true, user: req.user.toSafeObject() });

};



export const updateProfile = async (req, res, next) => {

  try {

    const { name, phone, city } = req.body;



    const user = await User.findByIdAndUpdate(

      req.user._id,

      { name, phone, city },

      { new: true, runValidators: true }

    );



    return res.json({

      success: true,

      message: "Profile updated",

      user: user.toSafeObject(),

    });

  } catch (error) {

    next(error);

  }

};



export const updateAvatar = async (req, res, next) => {

  try {

    if (!req.file) {

      return res.status(400).json({ success: false, message: "Please upload an image file" });

    }



    if (!isCloudinaryConfigured()) {

      return res.status(503).json({

        success: false,

        message:
          "Image upload is unavailable. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME in backend .env — https://console.cloudinary.com",

      });

    }



    const currentUser = await User.findById(req.user._id);

    let avatarUrl;



    try {

      const id = String(req.user._id);

      avatarUrl = await uploadAvatarFromBuffer(req.file, id);

    } catch (uploadErr) {

      return res.status(400).json({

        success: false,

        message: uploadErr.message || "Failed to upload profile image",

      });

    }



    if (currentUser?.avatar) {

      await deleteCloudinaryAvatar(currentUser.avatar);

    }



    const user = await User.findByIdAndUpdate(

      req.user._id,

      { avatar: avatarUrl },

      { new: true }

    );



    return res.json({

      success: true,

      message: "Avatar updated",

      avatar: avatarUrl,

      user: user.toSafeObject(),

    });

  } catch (error) {

    next(error);

  }

};



export const removeAvatar = async (req, res, next) => {

  try {

    const currentUser = await User.findById(req.user._id);



    if (currentUser?.avatar) {

      await deleteCloudinaryAvatar(currentUser.avatar);

    }



    const fallback = defaultAvatarUrl(currentUser?.name || currentUser?.email);



    const user = await User.findByIdAndUpdate(

      req.user._id,

      { avatar: fallback },

      { new: true }

    );



    return res.json({

      success: true,

      message: "Avatar removed",

      user: user.toSafeObject(),

    });

  } catch (error) {

    next(error);

  }

};



export const changePassword = async (req, res, next) => {

  try {

    const { currentPassword, newPassword } = req.body;



    if (!currentPassword || !newPassword) {

      return res.status(400).json({

        success: false,

        message: "Current password and new password are required",

      });

    }



    const user = await User.findById(req.user._id).select("+password");



    if (!user.password) {

      return res.status(400).json({

        success: false,

        message: "Google accounts cannot use password change. Set a password first.",

      });

    }



    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {

      return res.status(400).json({ success: false, message: "Current password is incorrect" });

    }



    if (newPassword.length < 6) {

      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

    }



    user.password = newPassword;

    await user.save();



    return res.json({ success: true, message: "Password changed successfully" });

  } catch (error) {

    next(error);

  }

};


