import express from "express";
import mongoose from "mongoose";
import { requireDb } from "../middleware/requireDb.js";

const router = express.Router();

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    socialMedia: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

const MongoUser =
  mongoose.models.MongoUser || mongoose.model("MongoUser", userSchema);

router.use(requireDb);

router.get("/", async (req, res) => {
  try {
    const users = await MongoUser.find().select("-passwordHash");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, firstName, lastName, email, passwordHash, socialMedia } = req.body;

    if (!userId || !firstName || !lastName || !email || !passwordHash) {
      return res.status(400).json({
        message: "userId, firstName, lastName, email, and passwordHash are required",
      });
    }

    const user = await MongoUser.create({
      userId,
      firstName,
      lastName,
      email,
      passwordHash,
      socialMedia: socialMedia || [],
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        socialMedia: user.socialMedia,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email or userId already exists" });
    }
    res.status(500).json({ message: error.message });
  }
});

export default router;
