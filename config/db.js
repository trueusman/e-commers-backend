import mongoose from "mongoose";

let connectPromise = null;

/** 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting */
export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export default async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MongoDB Error: set MONGO_URI (or MONGODB_URI) in .env");
    return false;
  }

  if (isDbConnected()) return true;
  if (connectPromise) return connectPromise;

  // Fail fast instead of buffering queries for 10s when DB is down
  mongoose.set("bufferCommands", false);

  const options = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  };

  const fallbackUri = process.env.MONGO_URI_DIRECT;

  connectPromise = (async () => {
    try {
      let conn;
      try {
        conn = await mongoose.connect(uri, options);
      } catch (firstError) {
        const srvDnsFailed =
          firstError.message?.includes("querySrv") ||
          firstError.message?.includes("ECONNREFUSED");

        if (fallbackUri && srvDnsFailed && uri.startsWith("mongodb+srv://")) {
          console.warn("⚠️  SRV DNS failed — retrying with MONGO_URI_DIRECT...");
          conn = await mongoose.connect(fallbackUri, options);
        } else {
          throw firstError;
        }
      }
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return true;
    } catch (error) {
      console.error(`❌ MongoDB Error: ${error.message}`);
      connectPromise = null;
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
      console.warn("⚠️  Database unavailable — auth and listings will return 503 until MongoDB connects.");
      return false;
    }
  })();

  return connectPromise;
}
