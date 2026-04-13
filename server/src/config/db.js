import mongoose from 'mongoose';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[DB] MONGODB_URI not set.');
    return;
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 8000
    }).then((m) => m).catch((err) => {
      cached.promise = null;
      console.error('[DB] MongoDB connection failed:', err.message);
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
