import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    // Only local (email/password) users have a password.
    // Google users never have this field set.
    password: {
      type: String,
      minlength: 6,
      select: false,   // never returned in queries unless explicitly requested
    },
    googleId: {
      type: String,
      default: "",
    },
    // "local"  = registered with email + password
    // "google" = registered via Google OAuth
    authType: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatar: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// email is already unique via the schema definition.
// Sparse index on googleId so multiple docs can have googleId = "" without conflict.
userSchema.index({ googleId: 1 }, { sparse: true });

// ── Pre-save hook: hash password ──────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  // Skip if password wasn't changed, or if this is a Google user (no password)
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ── Instance method: compare password ────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google-only users have no password
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Helper: safe user object (no password) ───────────────────────────────────
userSchema.methods.toSafeObject = function () {
  return {
    _id:        this._id,
    name:       this.name,
    email:      this.email,
    phone:      this.phone,
    city:       this.city,
    avatar:     this.avatar,
    role:       this.role,
    authType:   this.authType,
    isVerified: this.isVerified,
    createdAt:  this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);
export default User;
