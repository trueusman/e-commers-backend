import Listing from "../models/Listing.js";

// @desc    Get all listings with filters
// @route   GET /api/listings
// @access  Public
export const getListings = async (req, res, next) => {
  try {
    const {
      category,
      condition,
      location,
      minPrice,
      maxPrice,
      q,
      featured,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (location) filter.location = new RegExp(location, "i");
    if (featured === "true") filter.isFeatured = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (q) {
      filter.$text = { $search: q };
    }

    // Sort options
    let sortOption = {};
    if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };
    else if (sort === "price-asc") sortOption = { price: 1 };
    else if (sort === "price-desc") sortOption = { price: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Listing.countDocuments(filter);

    const listings = await Listing.find(filter)
      .populate("seller", "name phone city avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      listings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      "seller",
      "name phone city avatar createdAt"
    );

    if (!listing || !listing.isActive) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    // Increment views
    listing.views += 1;
    await listing.save();

    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

// @desc    Create listing
// @route   POST /api/listings
// @access  Private
export const createListing = async (req, res, next) => {
  try {
    const { title, description, price, condition, location, phone } = req.body;

    // Normalize category to valid enum — handles old slugs from any frontend version
    const CATEGORY_MAP = {
      electronics: "electronics", smartphones: "electronics", laptops: "electronics",
      tablets: "electronics", "mobile-accessories": "electronics", accessories: "electronics",
      vehicles: "vehicles", vehicle: "vehicles", motorcycle: "vehicles",
      motorcycles: "vehicles", cars: "vehicles", car: "vehicles",
      property: "property",
      fashion: "fashion", beauty: "fashion", "skin-care": "fashion",
      "womens-dresses": "fashion", "womens-bags": "fashion", bags: "fashion",
      watches: "fashion", jewellery: "fashion",
      furniture: "furniture", "home-decoration": "furniture", "home-decor": "furniture",
      "kitchen-accessories": "other",
      books: "books",
      sports: "sports", "sports-accessories": "sports",
      jobs: "jobs",
      other: "other",
    };
    const rawCategory = (req.body.category || "").toLowerCase().trim();
    const category = CATEGORY_MAP[rawCategory] ?? "other";

    // Handle uploaded images (multipart) or JSON image URLs
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((f) => `/uploads/${f.filename}`);
    } else if (Array.isArray(req.body.images)) {
      images = req.body.images;
    }

    const listing = await Listing.create({
      title,
      description,
      price,
      category,
      condition,
      location,
      phone: phone || req.user.phone,
      images,
      seller: req.user._id,
    });

    await listing.populate("seller", "name phone city avatar");

    res.status(201).json({
      success: true,
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private
export const updateListing = async (req, res, next) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    // Only seller or admin can update
    if (
      listing.seller.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updates = req.body;

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => `/uploads/${f.filename}`);
      updates.images = [...(listing.images || []), ...newImages];
    }

    listing = await Listing.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("seller", "name phone city avatar");

    res.json({ success: true, message: "Listing updated", listing });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    if (
      listing.seller.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Soft delete
    listing.isActive = false;
    await listing.save();

    res.json({ success: true, message: "Listing deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get listings by logged in user
// @route   GET /api/listings/my-listings
// @access  Private
export const getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, listings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured listings
// @route   GET /api/listings/featured
// @access  Public
export const getFeaturedListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ isFeatured: true, isActive: true })
      .populate("seller", "name phone city")
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({ success: true, listings });
  } catch (error) {
    next(error);
  }
};
