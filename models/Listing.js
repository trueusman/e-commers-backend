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
    // ── Sir wale fields ──────────────────────────────
    brand: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    stock: {
      type: Number,
      default: 1,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    tags: [{ type: String }],
    reviews: [
      {
        rating:        { type: Number, required: true },
        comment:       { type: String, default: "" },
        reviewerName:  { type: String, default: "Anonymous" },
        reviewerEmail: { type: String, default: "" },
        date:          { type: Date, default: Date.now },
      },
    ],
    warrantyInformation:  { type: String, default: "" },
    shippingInformation:  { type: String, default: "" },
    returnPolicy:         { type: String, default: "" },
    availabilityStatus:   { type: String, default: "In Stock" },
    minimumOrderQuantity: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Text index for search
listingSchema.index({ title: "text", description: "text" });

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;
