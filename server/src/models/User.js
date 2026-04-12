import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'buyer', 'supplier', 'seller'],
      required: true
    },
    organization: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true, index: true },
    state: { type: String, default: '', trim: true, index: true }
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
