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
import uploadMemory from "../middleware/uploadMemory.js";

const router = express.Router();

// Public routes
router.get("/", getListings);
router.get("/featured", getFeaturedListings);
router.get("/user/my-listings", protect, getMyListings);
router.get("/:id", getListing);
router.post("/", protect, uploadMemory.array("images", 5), createListing);
router.put("/:id", protect, uploadMemory.array("images", 5), updateListing);
router.delete("/:id", protect, deleteListing);

export default router;
