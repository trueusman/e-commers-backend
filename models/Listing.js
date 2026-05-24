import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "electronics",
        "vehicles",
        "property",
        "fashion",
        "furniture",
        "books",
        "sports",
        "jobs",
        "other",
      ],
    },
    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: ["New", "Used", "Refurbished"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    images: [
      {
        type: String,
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Text index for search
listingSchema.index({ title: "text", description: "text" });

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;
