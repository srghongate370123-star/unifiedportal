import { Router } from 'express';
import mongoose from 'mongoose';
import Bid from '../models/Bid.js';
import Tender from '../models/Tender.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js';

const router = Router();
const dbReady = () => mongoose.connection.readyState === 1;

router.get('/my-bids', requireAuth, requireRole('supplier'), async (req, res) => {
  try {
    if (!dbReady()) return res.json([]);
    const rows = await Bid.find({ supplierId: req.auth.userId }).sort({ createdAt: -1 }).lean();
    const tenderIds = [...new Set(rows.map((r) => r.tenderId))];
    const tenders = await Tender.find({ tenderId: { $in: tenderIds } })
      .select('tenderId title status')
      .lean();
    const titleById = Object.fromEntries(tenders.map((t) => [t.tenderId, t.title]));
    res.json(
      rows.map((b) => ({
        id: b.bidId,
        tenderId: b.tenderId,
        tenderTitle: titleById[b.tenderId] || '',
        bidAmount: b.bidAmount || b.quotedAmount || '',
        note: b.note || '',
        status: b.status || 'pending',
        submittedAt: b.createdAt
      }))
    );
  } catch (err) {
    console.error('[my-bids]', err);
    res.status(500).json({ message: 'Could not load your bids.' });
  }
});

router.patch('/bids/:bidId/status', requireAuth, requireRole('buyer'), async (req, res) => {
  try {
    if (!dbReady()) {
      return res.status(503).json({ message: 'Status updates need database connection.' });
    }
    const { bidId } = req.params;
    const status = String(req.body?.status || '').toLowerCase();
    const winnerReason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or rejected.' });
    }

    const bid = await Bid.findOne({ bidId });
    if (!bid) return res.status(404).json({ message: 'Bid not found.' });
    const tender = await Tender.findOne({ tenderId: bid.tenderId });
    if (!tender) return res.status(404).json({ message: 'Tender not found.' });
    if (tender.createdBy !== req.auth.userId) {
      return res.status(403).json({ message: 'Only tender owner can select winner.' });
    }

    if (status === 'accepted') {
      await Bid.updateMany({ tenderId: bid.tenderId, bidId: { $ne: bid.bidId } }, { $set: { status: 'rejected' } });
      bid.status = 'accepted';
      bid.winnerReason = winnerReason;
      tender.status = 'Closed';
      tender.closesIn = 'Closed';
      tender.closedAt = new Date();
      await Promise.all([bid.save(), tender.save()]);

      try {
        const allBids = await Bid.find({ tenderId: bid.tenderId }).lean();
        await Promise.all(
          allBids.map((row) =>
            sendEmail({
              to: row.email,
              subject: row.bidId === bid.bidId ? 'Bid accepted' : 'Bid rejected',
              html:
                row.bidId === bid.bidId
                  ? `<p>Your bid for tender ${tender.title} (${tender.tenderId}) has been accepted.${winnerReason ? ` Reason: ${winnerReason}` : ''}</p>`
                  : `<p>Your bid for tender ${tender.title} (${tender.tenderId}) was not selected.</p>`
            })
          )
        );
        await sendEmail({
          to: (await User.findById(tender.createdBy).lean().catch(() => null))?.email,
          subject: 'Tender closed',
          html: `<p>Winner selected for tender ${tender.title} (${tender.tenderId}).</p>`
        });
      } catch (mailErr) {
        console.error('[bids/status email]', mailErr);
      }
    } else {
      bid.status = 'rejected';
      bid.winnerReason = winnerReason;
      await bid.save();
      try {
        await sendEmail({
          to: bid.email,
          subject: 'Bid rejected',
          html: `<p>Your bid for tender ${tender.title} (${tender.tenderId}) has been rejected.${winnerReason ? ` Reason: ${winnerReason}` : ''}</p>`
        });
      } catch (mailErr) {
        console.error('[bids/status email]', mailErr);
      }
    }

    res.json({ message: `Bid ${status}.` });
  } catch (err) {
    console.error('[bids/status]', err);
    res.status(500).json({ message: 'Could not update bid status.' });
  }
});

router.get('/bids/:bidId', requireAuth, async (req, res) => {
  try {
    if (!dbReady()) return res.status(503).json({ message: 'Database not connected.' });
    const { bidId } = req.params;
    const bid = await Bid.findOne({ bidId }).lean();
    if (!bid) return res.status(404).json({ message: 'Bid not found.' });
    const tender = await Tender.findOne({ tenderId: bid.tenderId }).lean();
    const isAdmin = req.auth.role === 'admin';
    const isOwner = tender && String(tender.createdBy) === String(req.auth.userId);
    const isBidder = String(bid.supplierId) === String(req.auth.userId);
    if (!isAdmin && !isOwner && !isBidder) {
      return res.status(403).json({ message: 'You cannot view this bid.' });
    }
    res.json({
      bid: {
        id: bid.bidId,
        tenderId: bid.tenderId,
        bidAmount: bid.bidAmount || bid.quotedAmount || '',
        note: bid.note || '',
        document: bid.document || '',
        email: bid.email || '',
        status: bid.status || 'pending',
        winnerReason: bid.winnerReason || '',
        bidderName: bid.bidderName || '',
        bidderOrganization: bid.bidderOrganization || '',
        submittedAt: bid.createdAt
      },
      tender: tender
        ? {
            id: tender.tenderId,
            title: tender.title,
            status: tender.status,
            createdBy: tender.createdBy || ''
          }
        : null
    });
  } catch (err) {
    console.error('[bids/get]', err);
    res.status(500).json({ message: 'Could not load bid.' });
  }
});

export default router;

