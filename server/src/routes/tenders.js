import { Router } from 'express';
import mongoose from 'mongoose';

import Tender from '../models/Tender.js';
import Bid from '../models/Bid.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js';

const router = Router();

const seedTenders = [
  {
    tenderId: 'TND-2024-089',
    category: 'Infrastructure',
    title: 'Smart City Road Construction',
    status: 'Published',
    bids: 24,
    closesIn: '12 hours',
    estimatedValue: '₹4.2 Cr',
    summary:
      'Development and widening of main arterial roads in the South District. Includes smart street lighting, drainage, and high-durability paving.',
    createdBy: 'seed',
    department: 'Urban Development',
    location: 'Maharashtra'
  },
  {
    tenderId: 'TND-2024-015',
    category: 'Technology',
    title: 'IT Hardware Refresh',
    status: 'Evaluation',
    bids: 12,
    closesIn: 'Closed',
    estimatedValue: '₹85L – ₹1.2 Cr',
    summary: 'Refresh of IT hardware across departments.',
    createdBy: 'seed',
    department: 'IT',
    location: 'Delhi NCR'
  },
  {
    tenderId: 'TND-2024-032',
    category: 'Logistics',
    title: 'Annual Fleet Outsourcing',
    status: 'Draft',
    bids: 0,
    closesIn: 'Not published',
    estimatedValue: '₹50L – ₹75L',
    summary: 'Annual fleet management outsourcing.',
    createdBy: 'seed',
    department: 'Transport',
    location: 'Karnataka'
  },
  {
    tenderId: 'TND-2024-041',
    category: 'Civil & Construction',
    title: 'Drainage Network Improvement (Phase I)',
    status: 'Published',
    bids: 18,
    closesIn: '6 days',
    estimatedValue: '₹1.9 Cr',
    summary:
      'Upgradation of municipal drainage lines with RCC covers and manhole repairs.',
    createdBy: 'seed',
    department: 'PWD',
    location: 'Gujarat'
  },
  {
    tenderId: 'TND-2024-052',
    category: 'Electrical',
    title: 'Solar Street Light Installation (1000 Units)',
    status: 'Evaluation',
    bids: 9,
    closesIn: 'Closed',
    estimatedValue: '₹2.7 Cr',
    summary:
      'Procurement and installation of solar street lights including poles, panels, and warranty.',
    createdBy: 'seed',
    department: 'Energy',
    location: 'Rajasthan'
  },
  {
    tenderId: 'TND-2024-067',
    category: 'Technology',
    title: 'ERP Integration for Procurement Workflow',
    status: 'Published',
    bids: 7,
    closesIn: '3 days',
    estimatedValue: '₹62L – ₹98L',
    summary:
      'Integration of procurement workflow with ERP; APIs, dashboards, and training.',
    createdBy: 'seed',
    department: 'e-Procurement',
    location: 'Pan India'
  },
  {
    tenderId: 'TND-2024-070',
    category: 'Logistics',
    title: 'Public Transport Fleet Management System',
    status: 'Published',
    bids: 15,
    closesIn: '6 days',
    estimatedValue: '₹50L – ₹75L',
    summary: 'Telematics, route monitoring, and maintenance reporting.',
    createdBy: 'seed',
    department: 'Urban Mobility',
    location: 'Tamil Nadu'
  },
  {
    tenderId: 'TND-2024-083',
    category: 'Technology',
    title: 'Cybersecurity Education & Training Framework',
    status: 'Evaluation',
    bids: 10,
    closesIn: '8 days',
    estimatedValue: '₹85L – ₹1.2 Cr',
    summary: 'Training framework for government and partner institutes.',
    createdBy: 'seed',
    department: 'NIC',
    location: 'Pan India'
  },
  {
    tenderId: 'TND-2024-094',
    category: 'Infrastructure',
    title: 'Bridge Maintenance & Safety Audit Program',
    status: 'Published',
    bids: 8,
    closesIn: '4 days',
    estimatedValue: '₹2.1 Cr – ₹3.6 Cr',
    summary: 'Bridge maintenance, safety audits, repairs, and documentation.',
    createdBy: 'seed',
    department: 'NHAI',
    location: 'Multi-state'
  },
  {
    tenderId: 'TND-2024-105',
    category: 'Technology',
    title: 'Managed IT Services for Procurement Offices',
    status: 'Evaluation',
    bids: 6,
    closesIn: '10 days',
    estimatedValue: '₹42L – ₹65L',
    summary: 'Network, devices, and helpdesk for procurement users.',
    createdBy: 'seed',
    department: 'IT',
    location: 'Uttar Pradesh'
  },
  {
    tenderId: 'TND-2024-112',
    category: 'Infrastructure',
    title: 'Road Lighting Upgrade (Smart LED Project)',
    status: 'Draft',
    bids: 0,
    closesIn: 'Not published',
    estimatedValue: '₹1.4 Cr – ₹2.2 Cr',
    summary: 'Smart LED road lighting with remote monitoring.',
    createdBy: 'seed',
    department: 'Smart City',
    location: 'Telangana'
  }
];

const memoryTenders = [];
const memoryBids = [];

const dbReady = () => mongoose.connection.readyState === 1;

function listShape(t) {
  return {
    id: t.tenderId,
    title: t.title,
    category: t.category,
    status: t.status,
    bids: t.bids,
    closesIn: t.closesIn,
    organization: t.buyerOrganization || '',
    city: t.city || '',
    state: t.state || '',
    approvalStatus: t.approvalStatus || 'approved'
  };
}

function detailShape(doc) {
  return {
    id: doc.tenderId,
    title: doc.title,
    category: doc.category,
    department: doc.department || '',
    location: doc.location || '',
    city: doc.city || '',
    state: doc.state || '',
    closesIn: doc.closesIn || '',
    status: doc.status || '',
    bids: doc.bids ?? 0,
    estimatedValue: doc.estimatedValue || '',
    summary: doc.summary || '',
    specificationDocumentUrl: doc.specificationDocumentUrl || '',
    approvalStatus: doc.approvalStatus || 'approved',
    rejectionReason: doc.rejectionReason || '',
    createdBy: doc.createdBy || '',
    buyerOrganization: doc.buyerOrganization || ''
  };
}

function allMemoryTenders() {
  return [...seedTenders, ...memoryTenders];
}

async function ensureSeeded() {
  if (!dbReady()) return;
  // Seed tenders used createdBy: 'seed', which is not a valid User id — bid notifications never resolved a buyer email.
  const demoBuyer = await User.findOne({ email: 'buyer@demo.com' }).lean();
  const buyerId = demoBuyer?._id?.toString() || '';
  const buyerOrg = demoBuyer?.organization || '';

  const ops = seedTenders.map((t) => {
    const insertDoc = { ...t };
    if (buyerId) {
      // createdBy must not appear in both $setOnInsert and $set — MongoDB rejects that (breaks GET /my).
      delete insertDoc.createdBy;
      if (!insertDoc.buyerOrganization && buyerOrg) insertDoc.buyerOrganization = buyerOrg;
    }
    return {
      updateOne: {
        filter: { tenderId: t.tenderId },
        update: {
          $setOnInsert: insertDoc,
          ...(buyerId ? { $set: { createdBy: buyerId } } : {})
        },
        upsert: true
      }
    };
  });
  await Tender.bulkWrite(ops, { ordered: false });
}

function numericFromText(v) {
  if (!v) return null;
  const cleaned = String(v).replace(/[,₹\s]/g, '');
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function filterTenders(docs, q, category, city, state, minPrice, maxPrice) {
  let out = docs;
  const term = typeof q === 'string' ? q.trim().toLowerCase() : '';
  if (term) {
    out = out.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.tenderId.toLowerCase().includes(term) ||
        (t.summary && t.summary.toLowerCase().includes(term))
    );
  }
  if (category && category !== 'All') {
    out = out.filter((t) => t.category === category);
  }
  if (city) {
    out = out.filter((t) => (t.city || '').toLowerCase() === city.toLowerCase());
  }
  if (state) {
    out = out.filter((t) => (t.state || '').toLowerCase() === state.toLowerCase());
  }
  const parsedMin = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null;
  const parsedMax = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null;
  const hasMin = Number.isFinite(parsedMin);
  const hasMax = Number.isFinite(parsedMax);
  if (hasMin || hasMax) {
    out = out.filter((t) => {
      const val = numericFromText(t.estimatedValue);
      if (val == null) return true;
      if (hasMin && val < parsedMin) return false;
      if (hasMax && val > parsedMax) return false;
      return true;
    });
  }
  return out;
}

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || req.query.search || '';
    const category = req.query.category || '';
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    if (!dbReady()) {
      const docs = filterTenders(allMemoryTenders(), q, category, city, state, minPrice, maxPrice);
      return res.json(docs.map(listShape));
    }

    await ensureSeeded();
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (city) filter.city = city;
    if (state) filter.state = state;
    if (typeof q === 'string' && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: rx },
        { tenderId: rx },
        { summary: rx }
      ];
    }
    let docs = await Tender.find(filter).sort({ createdAt: -1 }).lean();
    docs = filterTenders(docs, '', '', '', '', minPrice, maxPrice);
    return res.json(docs.map(listShape));
  } catch {
    const docs = filterTenders(
      allMemoryTenders(),
      req.query.q || req.query.search,
      req.query.category,
      req.query.city,
      req.query.state,
      req.query.minPrice,
      req.query.maxPrice
    );
    res.json(docs.map(listShape));
  }
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    const uid = req.auth.userId;

    if (!dbReady()) {
      if (req.auth.role === 'buyer') {
        const docs = allMemoryTenders().filter((t) => t.createdBy === uid);
        return res.json(docs.map(listShape));
      }
      const tenderIds = new Set(memoryBids.filter((b) => b.supplierId === uid).map((b) => b.tenderId));
      const docs = allMemoryTenders().filter((t) => tenderIds.has(t.tenderId));
      return res.json(docs.map(listShape));
    }

    await ensureSeeded();
    if (req.auth.role === 'buyer') {
      const docs = await Tender.find({ createdBy: uid }).sort({ createdAt: -1 }).lean();
      return res.json(docs.map(listShape));
    }

    const tenderIds = await Bid.find({ supplierId: uid }).distinct('tenderId');
    const docs = await Tender.find({ tenderId: { $in: tenderIds } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(docs.map(listShape));
  } catch (err) {
    console.error('[tenders/my]', err);
    res.status(500).json({ message: 'Could not load your tenders.' });
  }
});

router.get('/:tenderId/bids', requireAuth, async (req, res) => {
  const { tenderId } = req.params;

  try {
    if (!dbReady()) {
      const doc = allMemoryTenders().find((t) => t.tenderId === tenderId);
      if (!doc) return res.status(404).json({ message: 'Tender not found.' });
      if (doc.createdBy !== req.auth.userId) {
        return res.status(403).json({ message: 'Only the tender owner can view bids.' });
      }
      const bids = memoryBids
        .filter((b) => b.tenderId === tenderId)
        .map((b) => ({
          id: b.bidId,
          supplierId: b.supplierId || b.bidderId || '',
          bidAmount: b.bidAmount || b.quotedAmount,
          note: b.note,
          supplierName: b.bidderName,
          bidderName: b.bidderName,
          bidderOrganization: b.bidderOrganization,
          document: b.document || '',
          email: b.email || '',
          status: b.status || 'pending',
          submittedAt: b.submittedAt || b.createdAt
        }));
      return res.json(bids);
    }

    await ensureSeeded();
    const doc = await Tender.findOne({ tenderId }).lean();
    if (!doc) return res.status(404).json({ message: 'Tender not found.' });
    if (doc.createdBy !== req.auth.userId) {
      return res.status(403).json({ message: 'Only the tender owner can view bids.' });
    }

    const bids = await Bid.find({ tenderId }).sort({ createdAt: -1 }).lean();
    res.json(
      bids.map((b) => ({
        id: b.bidId,
        supplierId: b.supplierId || b.bidderId || '',
        bidAmount: b.bidAmount || b.quotedAmount,
        note: b.note,
        supplierName: b.bidderName,
        bidderName: b.bidderName,
        bidderOrganization: b.bidderOrganization,
        document: b.document || '',
        email: b.email || '',
        status: b.status || 'pending',
        winnerReason: b.winnerReason || '',
        submittedAt: b.createdAt
      }))
    );
  } catch (err) {
    console.error('[tenders/bids get]', err);
    res.status(500).json({ message: 'Could not load bids.' });
  }
});

router.post('/:tenderId/bids', requireAuth, requireRole('supplier'), async (req, res) => {
  const { tenderId } = req.params;
  const { quotedAmount, bidAmount, note, document, email } = req.body;
  const amount = typeof (bidAmount || quotedAmount) === 'string' ? String(bidAmount || quotedAmount).trim() : '';
  const noteText = typeof note === 'string' ? note.trim() : '';

  if (!amount) {
    return res.status(400).json({ message: 'Quoted amount is required.' });
  }

  try {
    if (!dbReady()) {
      const doc = allMemoryTenders().find((t) => t.tenderId === tenderId);
      if (!doc) return res.status(404).json({ message: 'Tender not found.' });
      if (doc.status !== 'Published' || doc.closesIn === 'Closed') {
        return res.status(400).json({ message: 'This tender is not open for bids.' });
      }
      const dup = memoryBids.some(
        (b) => b.tenderId === tenderId && b.supplierId === req.auth.userId
      );
      if (dup) {
        return res.status(409).json({ message: 'You have already submitted a bid for this tender.' });
      }
      const bidId = `BID-${Date.now()}`;
      memoryBids.push({
        bidId,
        tenderId,
        supplierId: req.auth.userId,
        bidderId: req.auth.userId,
        bidderName: req.auth.name,
        bidderOrganization: req.auth.organization,
        email: typeof email === 'string' ? email.trim() : req.auth.email || '',
        bidAmount: amount,
        quotedAmount: amount,
        document: typeof document === 'string' ? document.trim() : '',
        note: noteText,
        status: 'pending',
        submittedAt: new Date().toISOString()
      });
      const t = memoryTenders.find((x) => x.tenderId === tenderId);
      if (t) t.bids = (t.bids || 0) + 1;
      const s = seedTenders.find((x) => x.tenderId === tenderId);
      if (s) s.bids = (s.bids || 0) + 1;
      return res.status(201).json({ id: bidId, message: 'Bid submitted successfully.' });
    }

    await ensureSeeded();
    const doc = await Tender.findOne({ tenderId });
    if (!doc) return res.status(404).json({ message: 'Tender not found.' });
    if (doc.status !== 'Published' || doc.closesIn === 'Closed') {
      return res.status(400).json({ message: 'This tender is not open for bids.' });
    }

    const bidId = `BID-${Date.now()}`;
    try {
      await Bid.create({
        bidId,
        tenderId,
        supplierId: req.auth.userId,
        bidderId: req.auth.userId,
        bidderName: req.auth.name,
        bidderOrganization: req.auth.organization,
        email: typeof email === 'string' ? email.trim() : req.auth.email || '',
        bidAmount: amount,
        quotedAmount: amount,
        document: typeof document === 'string' ? document.trim() : '',
        status: 'pending',
        note: noteText
      });
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ message: 'You have already submitted a bid for this tender.' });
      }
      throw e;
    }

    doc.bids = (doc.bids || 0) + 1;
    await doc.save();

    const submittedAt = new Date();
    try {
      const [supplier, buyer] = await Promise.all([
        User.findById(req.auth.userId).lean().catch(() => null),
        User.findById(doc.createdBy).lean().catch(() => null)
      ]);
      const supplierName = supplier?.name || req.auth.name || 'Supplier';
      const supplierEmail = supplier?.email || req.auth.email || '';
      let buyerDoc = buyer;
      if (!buyerDoc?.email && doc.createdBy && !mongoose.isValidObjectId(doc.createdBy)) {
        buyerDoc = await User.findOne({ email: 'buyer@demo.com' }).lean().catch(() => null);
      }
      const buyerName = buyerDoc?.name || buyer?.name || 'Buyer';

      if (buyerDoc?.email) {
        await sendEmail(
          buyerDoc.email,
          'New Bid Received for Your Tender',
          `
            <p>Hello ${buyerName},</p>
            <p>You have received a new bid for your tender.</p>
            <p>
              <b>Tender:</b> ${doc.title}<br/>
              <b>Supplier:</b> ${supplierName}<br/>
              <b>Email:</b> ${supplierEmail}<br/>
              <b>Bid Amount:</b> ${amount}<br/>
              <b>Submitted At:</b> ${submittedAt.toLocaleString('en-IN')}
            </p>
            <p>Please log in to your dashboard to review the bid.</p>
          `
        );
      }

      if (supplierEmail) {
        await sendEmail(
          supplierEmail,
          'Bid Submitted Successfully',
          `
            <p>Hello ${supplierName},</p>
            <p>Your bid has been submitted successfully.</p>
            <p>
              <b>Tender:</b> ${doc.title}<br/>
              <b>Bid Amount:</b> ${amount}
            </p>
          `
        );
      }
    } catch (mailErr) {
      console.error('[tenders/bids post email]', mailErr);
    }

    res.status(201).json({ id: bidId, message: 'Bid submitted successfully.' });
  } catch (err) {
    console.error('[tenders/bids post]', err);
    res.status(500).json({ message: 'Could not submit bid.' });
  }
});

router.patch('/:tenderId/publish', requireAuth, requireRole('buyer'), async (req, res) => {
  const { tenderId } = req.params;

  try {
    if (!dbReady()) {
      const doc = memoryTenders.find((t) => t.tenderId === tenderId);
      if (!doc) return res.status(404).json({ message: 'Tender not found.' });
      if (doc.createdBy !== req.auth.userId) {
        return res.status(403).json({ message: 'Only the owner can publish this tender.' });
      }
      doc.status = 'Published';
      doc.closesIn = doc.closesIn || 'Open';
      return res.json({ message: 'Tender published.', id: tenderId });
    }

    const doc = await Tender.findOne({ tenderId });
    if (!doc) return res.status(404).json({ message: 'Tender not found.' });
    if (doc.createdBy !== req.auth.userId) {
      return res.status(403).json({ message: 'Only the owner can publish this tender.' });
    }
    doc.status = 'Published';
    if (!doc.closesIn) doc.closesIn = 'Open';
    await doc.save();
    res.json({ message: 'Tender published.', id: tenderId });
  } catch (err) {
    console.error('[tenders/publish]', err);
    res.status(500).json({ message: 'Could not publish tender.' });
  }
});

router.get('/:tenderId', async (req, res) => {
  try {
    const { tenderId } = req.params;

    if (!dbReady()) {
      const doc = allMemoryTenders().find((t) => t.tenderId === tenderId);
      if (!doc) return res.status(404).json({ message: 'Tender not found.' });
      return res.json(detailShape(doc));
    }

    await ensureSeeded();
    const doc = await Tender.findOne({ tenderId }).lean();
    if (!doc) return res.status(404).json({ message: 'Tender not found.' });
    res.json(detailShape(doc));
  } catch {
    const doc = allMemoryTenders().find((t) => t.tenderId === req.params.tenderId);
    if (!doc) return res.status(404).json({ message: 'Tender not found.' });
    res.json(detailShape(doc));
  }
});

router.get('/:tenderId/analytics', requireAuth, async (req, res) => {
  try {
    const { tenderId } = req.params;
    if (!dbReady()) {
      const forTender = memoryBids.filter((b) => b.tenderId === tenderId);
      const nums = forTender.map((b) => numericFromText(b.bidAmount || b.quotedAmount)).filter((x) => x != null);
      const totalBids = forTender.length;
      const lowestBid = nums.length ? Math.min(...nums) : null;
      const averageBid = nums.length ? Number((nums.reduce((a, c) => a + c, 0) / nums.length).toFixed(2)) : null;
      return res.json({ totalBids, lowestBid, averageBid });
    }
    const rows = await Bid.find({ tenderId }).lean();
    const nums = rows.map((b) => numericFromText(b.bidAmount || b.quotedAmount)).filter((x) => x != null);
    const totalBids = rows.length;
    const lowestBid = nums.length ? Math.min(...nums) : null;
    const averageBid = nums.length ? Number((nums.reduce((a, c) => a + c, 0) / nums.length).toFixed(2)) : null;
    res.json({ totalBids, lowestBid, averageBid });
  } catch (err) {
    console.error('[tenders/analytics]', err);
    res.status(500).json({ message: 'Could not load analytics.' });
  }
});

router.post('/', requireAuth, requireRole('buyer'), async (req, res) => {
  try {
    const {
      title,
      category,
      department,
      location,
      city,
      state,
      deadline,
      estimatedValue,
      summary,
      specificationDocumentUrl
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required.' });
    }

    const createdById = req.auth.userId;
    const buyerOrganization = req.auth.organization || '';

    let closesIn = '';
    if (deadline) {
      try {
        const d = new Date(deadline);
        closesIn = Number.isNaN(d.getTime()) ? String(deadline) : d.toLocaleDateString('en-IN');
      } catch {
        closesIn = String(deadline);
      }
    }

    const tenderId = `TND-${Date.now()}`;

    if (!dbReady()) {
      const created = {
        tenderId,
        title,
        category,
        department: department || '',
        location: location || '',
        city: city || '',
        state: state || '',
        closesIn,
        estimatedValue: estimatedValue || '',
        summary: summary || '',
        specificationDocumentUrl:
          typeof specificationDocumentUrl === 'string' ? specificationDocumentUrl.trim() : '',
        createdBy: createdById,
        buyerOrganization,
        status: 'Draft',
        bids: 0,
        approvalStatus: 'pending'
      };
      memoryTenders.push(created);
      return res.status(201).json({
        id: created.tenderId,
        message: 'Tender saved as draft. Connect MongoDB to persist data across restarts.'
      });
    }

    const created = await Tender.create({
      tenderId,
      title,
      category,
      department: department || '',
      location: location || '',
      city: city || '',
      state: state || '',
      closesIn,
      estimatedValue: estimatedValue || '',
      summary: summary || '',
      specificationDocumentUrl:
        typeof specificationDocumentUrl === 'string' ? specificationDocumentUrl.trim() : '',
      createdBy: createdById,
      buyerOrganization,
      status: 'Draft',
      bids: 0,
      approvalStatus: 'pending'
    });

    res.status(201).json({
      id: created.tenderId,
      message: 'Tender created (draft).'
    });
  } catch (err) {
    console.error('[tenders create]', err);
    res.status(500).json({ message: 'Could not create tender.' });
  }
});

export function getAllMemoryTenders() {
  return [...seedTenders, ...memoryTenders];
}

export function getMemoryBids() {
  return memoryBids;
}

export default router;
