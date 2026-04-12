import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Tender from '../models/Tender.js';
import Material from '../models/Material.js';
import Bid from '../models/Bid.js';

const router = Router();
const dbReady = () => mongoose.connection.readyState === 1;

router.use(requireAuth, requireRole('admin'));

router.get('/users', async (req, res) => {
  try {
    if (!dbReady()) return res.json([]);
    const rows = await User.find({}).sort({ createdAt: -1 }).lean();
    res.json(
      rows.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role === 'seller' ? 'supplier' : u.role,
        city: u.city || '',
        state: u.state || '',
        organization: u.organization || ''
      }))
    );
  } catch (err) {
    console.error('[admin/users]', err);
    res.status(500).json({ message: 'Could not load users.' });
  }
});

router.get('/tenders', async (req, res) => {
  try {
    if (!dbReady()) return res.json([]);
    const rows = await Tender.find({}).sort({ createdAt: -1 }).lean();
    res.json(rows);
  } catch (err) {
    console.error('[admin/tenders]', err);
    res.status(500).json({ message: 'Could not load tenders.' });
  }
});

router.get('/tenders/:tenderId/bids', async (req, res) => {
  try {
    if (!dbReady()) return res.json([]);
    const { tenderId } = req.params;
    const bids = await Bid.find({ tenderId }).sort({ createdAt: -1 }).lean();
    res.json(
      bids.map((b) => ({
        id: b.bidId,
        bidAmount: b.bidAmount || b.quotedAmount || '',
        note: b.note || '',
        document: b.document || '',
        email: b.email || '',
        status: b.status || 'pending',
        bidderName: b.bidderName || '',
        bidderOrganization: b.bidderOrganization || '',
        supplierId: b.supplierId || '',
        submittedAt: b.createdAt
      }))
    );
  } catch (err) {
    console.error('[admin/tender bids]', err);
    res.status(500).json({ message: 'Could not load bids.' });
  }
});

router.get('/materials', async (req, res) => {
  try {
    if (!dbReady()) return res.json([]);
    const rows = await Material.find({}).sort({ createdAt: -1 }).lean();
    res.json(
      rows.map((m) => ({
        id: m.materialId,
        name: m.name,
        supplier: m.supplier,
        category: m.category,
        approvalStatus: m.approvalStatus || 'pending',
        supplierUserId: m.supplierUserId || ''
      }))
    );
  } catch (err) {
    console.error('[admin/materials]', err);
    res.status(500).json({ message: 'Could not load products.' });
  }
});

router.get('/users/:userId', async (req, res) => {
  try {
    if (!dbReady()) return res.status(503).json({ message: 'Database not connected.' });
    const u = await User.findById(req.params.userId).lean();
    if (!u) return res.status(404).json({ message: 'User not found.' });
    const uid = u._id.toString();
    const tenders = await Tender.find({ createdBy: uid }).sort({ createdAt: -1 }).lean();
    const materials = await Material.find({ supplierUserId: uid }).sort({ createdAt: -1 }).lean();
    res.json({
      user: {
        id: uid,
        name: u.name,
        email: u.email,
        role: u.role === 'seller' ? 'supplier' : u.role,
        organization: u.organization || '',
        phone: u.phone || '',
        city: u.city || '',
        state: u.state || ''
      },
      tenders: tenders.map((t) => ({
        id: t.tenderId,
        title: t.title,
        status: t.status,
        category: t.category,
        bids: t.bids ?? 0,
        approvalStatus: t.approvalStatus || 'pending'
      })),
      materials: materials.map((m) => ({
        id: m.materialId,
        name: m.name,
        category: m.category,
        approvalStatus: m.approvalStatus || 'pending',
        indicativePrice: m.indicativePrice || ''
      }))
    });
  } catch (err) {
    console.error('[admin/user profile]', err);
    res.status(500).json({ message: 'Could not load user profile.' });
  }
});

router.patch('/tenders/:tenderId/approve', async (req, res) => {
  try {
    if (!dbReady()) return res.status(503).json({ message: 'Database not connected.' });
    const tender = await Tender.findOne({ tenderId: req.params.tenderId });
    if (!tender) return res.status(404).json({ message: 'Tender not found.' });
    tender.approvalStatus = 'approved';
    tender.rejectionReason = '';
    await tender.save();
    res.json({ message: 'Tender approved.' });
  } catch (err) {
    console.error('[admin/tenders approve]', err);
    res.status(500).json({ message: 'Could not approve tender.' });
  }
});

router.patch('/tenders/:tenderId/reject', async (req, res) => {
  try {
    if (!dbReady()) return res.status(503).json({ message: 'Database not connected.' });
    const tender = await Tender.findOne({ tenderId: req.params.tenderId });
    if (!tender) return res.status(404).json({ message: 'Tender not found.' });
    tender.approvalStatus = 'rejected';
    tender.rejectionReason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    await tender.save();
    res.json({ message: 'Tender rejected.' });
  } catch (err) {
    console.error('[admin/tenders reject]', err);
    res.status(500).json({ message: 'Could not reject tender.' });
  }
});

router.patch('/products/:materialId/approve', async (req, res) => {
  try {
    if (!dbReady()) return res.status(503).json({ message: 'Database not connected.' });
    const material = await Material.findOne({ materialId: req.params.materialId });
    if (!material) return res.status(404).json({ message: 'Product not found.' });
    material.approvalStatus = 'approved';
    await material.save();
    res.json({ message: 'Product approved.' });
  } catch (err) {
    console.error('[admin/products approve]', err);
    res.status(500).json({ message: 'Could not approve product.' });
  }
});

router.patch('/products/:materialId/reject', async (req, res) => {
  try {
    if (!dbReady()) return res.status(503).json({ message: 'Database not connected.' });
    const material = await Material.findOne({ materialId: req.params.materialId });
    if (!material) return res.status(404).json({ message: 'Product not found.' });
    material.approvalStatus = 'rejected';
    await material.save();
    res.json({ message: 'Product rejected.' });
  } catch (err) {
    console.error('[admin/products reject]', err);
    res.status(500).json({ message: 'Could not reject product.' });
  }
});

export default router;

