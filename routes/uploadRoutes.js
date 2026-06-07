import express from "express";
import uploadMemory from "../middleware/uploadMemory.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

router.post("/", uploadMemory.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/multiple", uploadMemory.array("images", 5), async (req, res) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const uploads = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.buffer))
    );

    res.status(201).json({
      images: uploads.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
