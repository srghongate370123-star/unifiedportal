import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, unique: true, required: true, index: true },
    kind: { type: String, enum: ['tender', 'marketplace'], required: true },
    tenderId: { type: String, default: '', index: true },
    materialId: { type: String, default: '', index: true },
    buyerUserId: { type: String, required: true, index: true },
    supplierUserId: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Conversation', ConversationSchema);
