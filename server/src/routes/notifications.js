import { Router } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js';

const router = Router();
const dbReady = () => mongoose.connection.readyState === 1;

router.get('/notifications', requireAuth, async (req, res) => {
  try {
    if (!dbReady()) return res.json([]);
    const rows = await Notification.find({ userId: req.auth.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(
      rows.map((n) => ({
        id: n.notificationId,
        type: n.type,
        title: n.title,
        body: n.body,
        href: n.href || '',
        read: n.read,
        createdAt: n.createdAt
      }))
    );
  } catch (err) {
    console.error('[notifications list]', err);
    res.status(500).json({ message: 'Could not load notifications.' });
  }
});

router.patch('/notifications/:notificationId/read', requireAuth, async (req, res) => {
  try {
    if (!dbReady()) return res.json({ ok: true });
    await Notification.updateOne(
      { notificationId: req.params.notificationId, userId: req.auth.userId },
      { $set: { read: true } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[notifications read]', err);
    res.status(500).json({ message: 'Could not update notification.' });
  }
});

router.patch('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    if (!dbReady()) return res.json({ ok: true });
    await Notification.updateMany({ userId: req.auth.userId, read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[notifications read all]', err);
    res.status(500).json({ message: 'Could not update notifications.' });
  }
});

router.post('/test-email', requireAuth, async (req, res) => {
  try {
    const to =
      typeof req.body?.to === 'string' && req.body.to.trim()
        ? req.body.to.trim()
        : req.auth.email;

    if (!to) {
      return res.status(400).json({ message: 'Recipient email is required.' });
    }

    await sendEmail({
      to,
      subject: 'Test notification from Bharat Bazaar',
      text: `Hello ${req.auth.name || 'User'}, this is a test email notification from Bharat Bazaar.`
    });

    res.json({ message: `Test email queued to ${to}.` });
  } catch (err) {
    console.error('[test-email]', err);
    res.status(500).json({ message: 'Could not send test email.' });
  }
});

export default router;
