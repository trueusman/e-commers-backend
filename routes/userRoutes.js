import express from "express";
import {
  getUserProfile,
  getAllUsers,
  deleteUser,
} from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/:id", getUserProfile);
router.get("/", protect, adminOnly, getAllUsers);
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;
