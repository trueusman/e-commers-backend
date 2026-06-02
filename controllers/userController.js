import User from "../models/User.js";
import Listing from "../models/Listing.js";

// @desc    Get user public profile + their listings
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const listings = await Listing.find({
      seller: user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({ success: true, user, listings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, total: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    await Listing.updateMany({ seller: req.params.id }, { isActive: false });

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    next(error);
  }
};
