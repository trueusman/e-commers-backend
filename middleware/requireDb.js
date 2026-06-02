import { isDbConnected } from "../config/db.js";

/** Reject requests when MongoDB is not connected (avoids 10s buffer timeout) */
export const requireDb = (req, res, next) => {
  if (isDbConnected()) return next();

  return res.status(503).json({
    success: false,
    message:
      "Database is not connected. Check MONGO_URI, internet connection, and Atlas IP whitelist, then restart the backend.",
  });
};
