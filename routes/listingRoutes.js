import express from "express";
import {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  getFeaturedListings,
} from "../controllers/listingController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getListings);
router.get("/featured", getFeaturedListings);
router.get("/user/my-listings", protect, getMyListings);
router.get("/:id", getListing);
router.post("/", protect, upload.array("images", 10), createListing);
router.put("/:id", protect, upload.array("images", 10), updateListing);
router.delete("/:id", protect, deleteListing);

export default router;
