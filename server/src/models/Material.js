import mongoose from 'mongoose';

const MaterialSchema = new mongoose.Schema(
  {
    materialId: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    pack: { type: String, default: '' },
    moq: { type: String, default: '' },
    indicativePrice: { type: String, default: '' },
    supplier: { type: String, default: '' },
    supplierUserId: { type: String, default: '', index: true },
    city: { type: String, default: '', trim: true, index: true },
    state: { type: String, default: '', trim: true, index: true },
    address: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '', trim: true },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    category: { type: String, default: '' },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Material', MaterialSchema);

