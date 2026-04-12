import mongoose from 'mongoose';

const EnquirySchema = new mongoose.Schema(
  {
    enquiryId: { type: String, unique: true, required: true, index: true },
    materialId: { type: String, default: '' },
    materialName: { type: String, default: '' },

    buyerId: { type: String, default: '' },
    buyerName: { type: String, default: '' },
    buyerEmail: { type: String, default: '', trim: true },
    supplierUserId: { type: String, default: '' },

    status: { type: String, default: 'Sent' }, // Sent | Under Review | Closed
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Enquiry', EnquirySchema);

