import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema(
  {
    messageId: { type: String, unique: true, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    fromUserId: { type: String, required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 8000 }
  },
  { timestamps: true }
);

export default mongoose.model('ChatMessage', ChatMessageSchema);
