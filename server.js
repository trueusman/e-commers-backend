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
import {
  PORT,
  BACKEND_URL,
  FRONTEND_URL,
  GOOGLE_CALLBACK_URL,
  getAllowedOrigins,
  isOriginAllowed,
  assertProductionEnv,
} from "./config/env.js";
import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

assertProductionEnv();

// Render / reverse proxy (correct req.protocol for HTTPS URLs)
app.set("trust proxy", 1);

const allowedOrigins = getAllowedOrigins();
if (process.env.NODE_ENV === "production" && allowedOrigins.length) {
  console.log("CORS allowed origins:", allowedOrigins.join(", "));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      if (origin) console.warn(`CORS blocked: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/users", userRoutes);

const productData = require("./products.json");
let products = productData.products;

app.get("/products", (req, res) => {
  const { q, category } = req.query;
  let result = [...products];

  if (q) {
    const query = q.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
    );
  }

  if (category) {
    result = result.filter(
      (p) => p.category && p.category.toLowerCase() === category.toLowerCase()
    );
  }

  res.json({ limit: result.length, page: 1, products: result });
});

app.get("/products/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const result = products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
  );
  res.json({ limit: result.length, page: 1, products: result });
});

app.get("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    database: isDbConnected() ? "connected" : "disconnected",
    backendUrl: BACKEND_URL || null,
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BazaarHub API is running",
    version: "1.0.0",
    database: isDbConnected() ? "connected" : "disconnected",
    endpoints: {
      auth: "/api/auth",
      listings: "/api/listings",
      users: "/api/users",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const startServer = async () => {
  configureCloudinary();
  if (isCloudinaryConfigured()) {
    const cloudOk = await verifyCloudinaryConnection();
    if (cloudOk) console.log("✅ Cloudinary: connected");
  }

  const dbOk = await connectDB();
  configureGooglePassport(app);

  const host = "0.0.0.0";

  app.listen(PORT, host, () => {
    const publicUrl = BACKEND_URL || `(listening on port ${PORT})`;
    console.log(`\n🚀 Server running on ${publicUrl} (port ${PORT})`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Frontend (CORS): ${FRONTEND_URL || "not set"}`);
    console.log(`🗄️  MongoDB: ${dbOk ? "connected" : "DISCONNECTED"}`);

    if (isGoogleOAuthConfigured()) {
      console.log(`✅ Google OAuth: ENABLED`);
      console.log(`   Redirect URI: ${GOOGLE_CALLBACK_URL || "(not set)"}`);
    } else {
      console.log(`⚠️  Google OAuth: DISABLED`);
    }

    if (isCloudinaryConfigured()) {
      console.log(`✅ Cloudinary folder: ${process.env.CLOUDINARY_AVATAR_FOLDER || "bazaarhub/avatars"}`);
    } else {
      console.log(`⚠️  Cloudinary: DISABLED`);
    }
    console.log("");
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
