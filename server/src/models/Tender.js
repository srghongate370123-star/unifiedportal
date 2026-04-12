import mongoose from 'mongoose';

const TenderSchema = new mongoose.Schema(
  {
    tenderId: { type: String, unique: true, required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    department: { type: String, default: '' },
    location: { type: String, default: '' },
    city: { type: String, default: '', trim: true, index: true },
    state: { type: String, default: '', trim: true, index: true },

    // Human-friendly deadline label used by the UI
    closesIn: { type: String, default: '' },

    status: { type: String, default: 'Draft' }, // Draft | Published | Evaluation
    bids: { type: Number, default: 0 },

    estimatedValue: { type: String, default: '' },
    summary: { type: String, default: '' },
    /** URL to tender PDF / BoQ / specification document (hosted elsewhere). */
    specificationDocumentUrl: { type: String, default: '', trim: true },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    closedAt: { type: Date, default: null },

    createdBy: { type: String, default: '' },
    buyerOrganization: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Tender', TenderSchema);

