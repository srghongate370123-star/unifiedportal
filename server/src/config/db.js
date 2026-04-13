import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[DB] MONGODB_URI not set. API will run without database connection.');
    return;
  }

  // Prevent multiple connections in serverless environments
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 8000
    });
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
  }
}
