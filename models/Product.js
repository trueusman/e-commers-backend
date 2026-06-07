import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

productSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const counter = await Counter.findOneAndUpdate(
    { name: "productId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.productId = counter.seq;
  next();
});

productSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return {
    id: obj.productId,
    title: obj.title,
    description: obj.description,
    price: obj.price,
    category: obj.category,
    thumbnail: obj.thumbnail,
    images: obj.images.length ? obj.images : [obj.thumbnail],
  };
};

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
