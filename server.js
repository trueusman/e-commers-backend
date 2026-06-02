import "./config/loadEnv.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import connectDB, { isDbConnected } from "./config/db.js";
import { configureCloudinary, isCloudinaryConfigured, verifyCloudinaryConnection } from "./config/cloudinary.js";
import { configureGooglePassport } from "./config/passportGoogle.js";
import { isGoogleOAuthConfigured } from "./config/googleOAuth.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// Allow multiple frontend origins (dev uses 3000 or 3001)
const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
];
// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
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

// ─── /products route (sir wala format) ───────────────────
const productData = require("./products.json");
let products = productData.products;

app.get("/products", (req, res) => {
  const { q, category } = req.query;
  let result = [...products];

  if (q) {
    const query = q.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query))
    );
  }

  if (category) {
    result = result.filter(p =>
      p.category && p.category.toLowerCase() === category.toLowerCase()
    );
  }

  res.json({ limit: result.length, page: 1, products: result });
});

app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const result = products.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.description && p.description.toLowerCase().includes(q))
  );
  res.json({ limit: result.length, page: 1, products: result });
});

app.get("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    database: isDbConnected() ? "connected" : "disconnected",
  });
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 BazaarHub API is running",
    version: "1.0.0",
    database: isDbConnected() ? "connected" : "disconnected",
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

// ─── Start Server (after MongoDB is ready) ─────────────────
const startServer = async () => {
  configureCloudinary();
  if (isCloudinaryConfigured()) {
    const cloudOk = await verifyCloudinaryConnection();
    if (cloudOk) console.log("✅ Cloudinary: connected");
  }

  const dbOk = await connectDB();
  configureGooglePassport(app);

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  MongoDB: ${dbOk ? "connected" : "DISCONNECTED — fix MONGO_URI / Atlas access"}`);

    if (isGoogleOAuthConfigured()) {
      const redirectUri =
        process.env.GOOGLE_CALLBACK_URL ||
        `http://localhost:${PORT}/api/auth/google/callback`;
      console.log(`✅ Google OAuth: ENABLED`);
      console.log(`   Redirect URI (add in Google Console): ${redirectUri}`);
    } else {
      console.log(`⚠️  Google OAuth: DISABLED — add real GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env`);
    }

    if (isCloudinaryConfigured()) {
      console.log(`   Cloudinary folder: ${process.env.CLOUDINARY_AVATAR_FOLDER || "bazaarhub/avatars"}`);
    } else {
      console.log(`⚠️  Cloudinary: DISABLED — set CLOUDINARY_URL in .env (from Cloudinary Dashboard)`);
    }
    console.log("");
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
