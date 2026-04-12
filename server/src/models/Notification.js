import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, unique: true, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, default: 'chat' },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    href: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', NotificationSchema);
