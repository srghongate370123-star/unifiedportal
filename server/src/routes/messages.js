import { Router } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import ChatMessage from '../models/ChatMessage.js';
import Notification from '../models/Notification.js';
import Tender from '../models/Tender.js';
import Bid from '../models/Bid.js';
import Material from '../models/Material.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { getAllMemoryTenders, getMemoryBids } from './tenders.js';

const router = Router();
const dbReady = () => mongoose.connection.readyState === 1;

const memoryConversations = [];
const memoryChatMessages = [];

function cidTender(tenderId, supplierUserId) {
  return `t:${tenderId}:${supplierUserId}`;
}
function cidMarketplace(materialId, buyerUserId) {
  return `m:${materialId}:${buyerUserId}`;
}

async function notifyUser(userId, title, body, href) {
  const notificationId = `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  if (!dbReady()) return;
  try {
    await Notification.create({ notificationId, userId, type: 'chat', title, body, href, read: false });
  } catch (e) {
    console.error('[notifyUser]', e);
  }
}

router.post('/messages/open/tender', requireAuth, async (req, res) => {
  try {
    const tenderId = typeof req.body?.tenderId === 'string' ? req.body.tenderId.trim() : '';
    const withUserId = typeof req.body?.withUserId === 'string' ? req.body.withUserId.trim() : '';
    if (!tenderId || !withUserId) {
      return res.status(400).json({ message: 'tenderId and withUserId are required.' });
    }
    const me = req.auth.userId;

    if (!dbReady()) {
      const tender = getAllMemoryTenders().find((t) => t.tenderId === tenderId);
      if (!tender) return res.status(404).json({ message: 'Tender not found.' });
      const bidForSupplier = getMemoryBids().find((b) => b.tenderId === tenderId && b.supplierId === withUserId);
      const myBid = getMemoryBids().find((b) => b.tenderId === tenderId && b.supplierId === me);
      const isOwner = tender.createdBy === me;
      const isSupplierToBuyer = withUserId === tender.createdBy && myBid;
      const isBuyerToSupplier = isOwner && bidForSupplier;
      if (!isBuyerToSupplier && !isSupplierToBuyer) {
        return res.status(403).json({ message: 'Chat is only available after the supplier has submitted a bid.' });
      }
      const buyerUserId = tender.createdBy;
      const supplierUserId = isOwner ? withUserId : me;
      const convId = cidTender(tenderId, supplierUserId);
      let c = memoryConversations.find((x) => x.conversationId === convId);
      if (!c) {
        c = {
          conversationId: convId,
          kind: 'tender',
          tenderId,
          materialId: '',
          buyerUserId,
          supplierUserId,
          title: tender.title,
          lastMessageAt: new Date()
        };
        memoryConversations.push(c);
      }
      return res.json({ conversationId: convId });
    }

    const tender = await Tender.findOne({ tenderId }).lean();
    if (!tender) return res.status(404).json({ message: 'Tender not found.' });
    const hasBid = await Bid.findOne({ tenderId, supplierId: withUserId }).lean();
    const myBid = await Bid.findOne({ tenderId, supplierId: me }).lean();
    const isOwner = String(tender.createdBy) === String(me);
    const isSupplierToBuyer = String(withUserId) === String(tender.createdBy) && myBid;
    const isBuyerToSupplier = isOwner && hasBid;
    if (!isBuyerToSupplier && !isSupplierToBuyer) {
      return res.status(403).json({ message: 'Chat is only available after the supplier has submitted a bid.' });
    }
    const buyerUserId = String(tender.createdBy);
    const supplierUserId = isOwner ? withUserId : me;
    const convId = cidTender(tenderId, supplierUserId);
    let conv = await Conversation.findOne({ conversationId: convId });
    if (!conv) {
      conv = await Conversation.create({
        conversationId: convId,
        kind: 'tender',
        tenderId,
        materialId: '',
        buyerUserId,
        supplierUserId,
        title: tender.title || tenderId,
        lastMessageAt: new Date()
      });
    }
    res.json({ conversationId: conv.conversationId });
  } catch (err) {
    console.error('[messages/open/tender]', err);
    res.status(500).json({ message: 'Could not open conversation.' });
  }
});

router.post('/messages/open/marketplace', requireAuth, async (req, res) => {
  try {
    if (req.auth.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can start a product chat.' });
    }
    const materialId = typeof req.body?.materialId === 'string' ? req.body.materialId.trim() : '';
    if (!materialId) return res.status(400).json({ message: 'materialId is required.' });
    const me = req.auth.userId;

    if (!dbReady()) {
      return res.status(503).json({ message: 'Marketplace chat requires database connection.' });
    }

    const material = await Material.findOne({ materialId }).lean();
    if (!material) return res.status(404).json({ message: 'Product not found.' });
    const supplierUserId = material.supplierUserId || '';
    if (!supplierUserId) return res.status(400).json({ message: 'Product has no linked supplier account.' });
    if (String(supplierUserId) === String(me)) {
      return res.status(400).json({ message: 'Cannot chat with yourself.' });
    }
    const convId = cidMarketplace(materialId, me);
    let conv = await Conversation.findOne({ conversationId: convId });
    if (!conv) {
      conv = await Conversation.create({
        conversationId: convId,
        kind: 'marketplace',
        tenderId: '',
        materialId,
        buyerUserId: me,
        supplierUserId,
        title: material.name || materialId,
        lastMessageAt: new Date()
      });
    }
    res.json({ conversationId: conv.conversationId });
  } catch (err) {
    console.error('[messages/open/marketplace]', err);
    res.status(500).json({ message: 'Could not open conversation.' });
  }
});

async function otherParticipant(conv, me) {
  const oid = String(conv.buyerUserId) === String(me) ? conv.supplierUserId : conv.buyerUserId;
  if (!dbReady()) return { id: oid, name: 'User', email: '' };
  const u = await User.findById(oid).select('name email').lean();
  return u ? { id: u._id.toString(), name: u.name, email: u.email } : { id: oid, name: 'User', email: '' };
}

router.get('/messages/conversations', requireAuth, async (req, res) => {
  try {
    const me = req.auth.userId;
    if (!dbReady()) {
      const mine = memoryConversations.filter(
        (c) => String(c.buyerUserId) === String(me) || String(c.supplierUserId) === String(me)
      );
      mine.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      const out = await Promise.all(
        mine.map(async (c) => ({
          id: c.conversationId,
          kind: c.kind,
          title: c.title,
          tenderId: c.tenderId,
          materialId: c.materialId,
          otherUser: await otherParticipant(c, me),
          lastMessageAt: c.lastMessageAt
        }))
      );
      return res.json(out);
    }
    const rows = await Conversation.find({
      $or: [{ buyerUserId: me }, { supplierUserId: me }]
    })
      .sort({ lastMessageAt: -1 })
      .lean();
    const out = await Promise.all(
      rows.map(async (c) => ({
        id: c.conversationId,
        kind: c.kind,
        title: c.title,
        tenderId: c.tenderId || '',
        materialId: c.materialId || '',
        otherUser: await otherParticipant(c, me),
        lastMessageAt: c.lastMessageAt
      }))
    );
    res.json(out);
  } catch (err) {
    console.error('[messages/conversations list]', err);
    res.status(500).json({ message: 'Could not load conversations.' });
  }
});

async function assertConvAccess(conversationId, me) {
  if (!dbReady()) {
    const c = memoryConversations.find((x) => x.conversationId === conversationId);
    if (!c) return null;
    if (String(c.buyerUserId) !== String(me) && String(c.supplierUserId) !== String(me)) return null;
    return c;
  }
  const c = await Conversation.findOne({ conversationId }).lean();
  if (!c) return null;
  if (String(c.buyerUserId) !== String(me) && String(c.supplierUserId) !== String(me)) return null;
  return c;
}

router.get('/messages/conversations/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const me = req.auth.userId;
    const { conversationId } = req.params;
    const c = await assertConvAccess(conversationId, me);
    if (!c) return res.status(404).json({ message: 'Conversation not found.' });

    if (!dbReady()) {
      const msgs = memoryChatMessages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return res.json(
        msgs.map((m) => ({
          id: m.messageId,
          fromUserId: m.fromUserId,
          body: m.body,
          createdAt: m.createdAt
        }))
      );
    }
    const msgs = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();
    res.json(
      msgs.map((m) => ({
        id: m.messageId,
        fromUserId: m.fromUserId,
        body: m.body,
        createdAt: m.createdAt
      }))
    );
  } catch (err) {
    console.error('[messages/list]', err);
    res.status(500).json({ message: 'Could not load messages.' });
  }
});

router.post('/messages/conversations/:conversationId/messages', requireAuth, async (req, res) => {
  try {
    const me = req.auth.userId;
    const { conversationId } = req.params;
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!body) return res.status(400).json({ message: 'Message body is required.' });
    if (body.length > 8000) return res.status(400).json({ message: 'Message too long.' });

    const c = await assertConvAccess(conversationId, me);
    if (!c) return res.status(404).json({ message: 'Conversation not found.' });

    const messageId = `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date();

    if (!dbReady()) {
      memoryChatMessages.push({
        messageId,
        conversationId,
        fromUserId: me,
        body,
        createdAt: now
      });
      const mc = memoryConversations.find((x) => x.conversationId === conversationId);
      if (mc) mc.lastMessageAt = now;
      return res.status(201).json({ id: messageId });
    }

    await ChatMessage.create({ messageId, conversationId, fromUserId: me, body });
    await Conversation.updateOne({ conversationId }, { $set: { lastMessageAt: now } });

    const recipient =
      String(c.buyerUserId) === String(me) ? String(c.supplierUserId) : String(c.buyerUserId);
    const preview = body.length > 80 ? `${body.slice(0, 80)}…` : body;
    await notifyUser(recipient, 'New message', preview, `/dashboard/messages?c=${encodeURIComponent(conversationId)}`);

    res.status(201).json({ id: messageId });
  } catch (err) {
    console.error('[messages/send]', err);
    res.status(500).json({ message: 'Could not send message.' });
  }
});

export default router;
