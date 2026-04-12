import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // If you haven't configured MongoDB yet, keep the server running.
  if (!uri) {
    console.warn(
      '[DB] MONGODB_URI not set. API will run without database connection.'
    );
    return;
  }

  try {
    await mongoose.connect(uri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 8000
    });
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error('[DB] MongoDB connection failed:', err.message);
    console.error(
      '[DB] Fix: start MongoDB locally (Windows: start "MongoDB" service), or set MONGODB_URI to your Atlas connection string in server/.env'
    );
    // Keep server running so you can still test the frontend.
  }
}

