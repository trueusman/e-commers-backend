const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  if (
    err.message?.includes("buffering timed out") ||
    err.name === "MongooseServerSelectionError"
  ) {
    message =
      "Database is not connected. Check MONGO_URI, internet, and MongoDB Atlas IP whitelist, then restart the backend.";
    statusCode = 503;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }

  // Multer upload errors
  if (err.name === "MulterError") {
    message = err.code === "LIMIT_FILE_SIZE"
      ? "Image must be 5MB or smaller"
      : err.message;
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
