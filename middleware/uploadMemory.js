import multer from "multer";
import path from "path";

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const isValid =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, PNG, WEBP images are allowed"), false);
  }
};

/** In-memory upload for auth avatars → Cloudinary (no disk writes) */
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default uploadMemory;
