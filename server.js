import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import User from "./models/User.js";

import authRoutes from "./routes/authRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BACKEND_URL}/api/auth/google/callback`;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("Google account did not provide an email"));
          }

          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              name: profile.displayName || email.split("@")[0],
              email,
              phone: `google-${profile.id}`,
              password: Math.random().toString(36).slice(2),
              avatar: profile.photos?.[0]?.value || "",
              city: "",
              isVerified: true,
            });
          } else {
            const avatar = profile.photos?.[0]?.value;
            if (avatar && avatar !== user.avatar) {
              user.avatar = avatar;
              await user.save();
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  app.use(passport.initialize());
}

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://192.168.100.65:3000",
    "http://192.168.100.65:3001",
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ───────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 BazaarHub API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      listings: "/api/listings",
      users: "/api/users",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGO_URI}\n`);
});
