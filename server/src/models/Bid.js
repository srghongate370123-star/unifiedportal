import mongoose from 'mongoose';

const BidSchema = new mongoose.Schema(
  {
    bidId: { type: String, unique: true, required: true, index: true },
    tenderId: { type: String, required: true, index: true },
    supplierId: { type: String, required: true, index: true },
    bidderId: { type: String, required: true, index: true },
    bidderName: { type: String, default: '' },
    bidderOrganization: { type: String, default: '' },
    email: { type: String, default: '', trim: true },
    bidAmount: { type: String, default: '' },
    quotedAmount: { type: String, default: '' },
    document: { type: String, default: '' },
    note: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'Submitted'],
      default: 'pending',
      index: true
    },
    winnerReason: { type: String, default: '' }
  },
  { timestamps: true }
);

BidSchema.index({ tenderId: 1, supplierId: 1 }, { unique: true });

export default mongoose.model('Bid', BidSchema);
