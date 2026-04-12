import { Router } from 'express';
import mongoose from 'mongoose';

import Material from '../models/Material.js';
import Enquiry from '../models/Enquiry.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js';

const router = Router();

const seedMaterials = [
  {
    materialId: 'MAT-001',
    name: 'Grade A Cement (53 Grade)',
    pack: 'Bag',
    moq: '200 bags',
    indicativePrice: '₹295 / bag',
    supplier: 'MetroCem Industries',
    supplierUserId: '',
    category: 'Civil & Construction',
    description: 'OPC 53 grade cement suitable for infrastructure.'
  },
  {
    materialId: 'MAT-002',
    name: 'TMT Steel Bars (Fe500, 12mm)',
    pack: 'Bundle',
    moq: '5 MT',
    indicativePrice: '₹68,500 / MT',
    supplier: 'Tata Steel Channel Partner',
    supplierUserId: '',
    category: 'Civil & Construction',
    description: 'IS 1786 Fe500 TMT bars.'
  },
  {
    materialId: 'MAT-003',
    name: 'Copper Wiring (1.5 sq.mm)',
    pack: 'Roll',
    moq: '50 rolls',
    indicativePrice: '₹1,240 / roll',
    supplier: 'Finolex Authorised Distributor',
    supplierUserId: '',
    category: 'Electrical',
    description: 'FR PVC insulated copper wire.'
  },
  {
    materialId: 'MAT-004',
    name: 'Heavy Duty PVC Pipes (200mm)',
    pack: 'Length',
    moq: '10 lengths',
    indicativePrice: '₹785 / length',
    supplier: 'Apex Plastics & Pipes',
    supplierUserId: '',
    category: 'Plumbing',
    description: 'SWR / plumbing grade PVC.'
  },
  {
    materialId: 'MAT-005',
    name: 'TMT Steel (Fe500, 16mm)',
    pack: 'Bundle',
    moq: '2 MT',
    indicativePrice: '₹71,200 / MT',
    supplier: 'Tata Steel Channel Partner',
    supplierUserId: '',
    category: 'Civil & Construction',
    description: ''
  },
  {
    materialId: 'MAT-006',
    name: 'Asian Paints Apex Emulsion (20L)',
    pack: 'Bucket',
    moq: '12 buckets',
    indicativePrice: '₹7,900 / bucket',
    supplier: 'Asian Paints Dealer Network',
    supplierUserId: '',
    category: 'Painting',
    description: ''
  },
  {
    materialId: 'MAT-007',
    name: 'Makita 2100W Power Drill Kit',
    pack: 'Unit',
    moq: '6 units',
    indicativePrice: '₹4,200 / unit',
    supplier: 'Rex Tools & Equipment',
    supplierUserId: '',
    category: 'Electrical',
    description: ''
  },
  {
    materialId: 'MAT-008',
    name: 'HDPE Corrugated Duct (75mm)',
    pack: 'Coil',
    moq: '20 coils',
    indicativePrice: '₹1,950 / coil',
    supplier: 'CableSafe Solutions',
    supplierUserId: '',
    category: 'Electrical',
    description: ''
  },
  {
    materialId: 'MAT-009',
    name: 'Heavy Duty PVC Pipes (160mm)',
    pack: 'Length',
    moq: '12 lengths',
    indicativePrice: '₹590 / length',
    supplier: 'Vinod Pipes & Fittings',
    supplierUserId: '',
    category: 'Plumbing',
    description: ''
  },
  {
    materialId: 'MAT-010',
    name: 'Finolex Copper Wiring (2.5 sq.mm)',
    pack: 'Roll',
    moq: '30 rolls',
    indicativePrice: '₹1,980 / roll',
    supplier: 'Finolex Authorised Distributor',
    supplierUserId: '',
    category: 'Electrical',
    description: ''
  },
  {
    materialId: 'MAT-011',
    name: 'Asian Paints Apex Primer (20L)',
    pack: 'Bucket',
    moq: '10 buckets',
    indicativePrice: '₹6,250 / bucket',
    supplier: 'Asian Paints Dealer Network',
    supplierUserId: '',
    category: 'Painting',
    description: ''
  },
  {
    materialId: 'MAT-012',
    name: 'Makita 18V Impact Driver Kit',
    pack: 'Unit',
    moq: '5 units',
    indicativePrice: '₹6,900 / unit',
    supplier: 'Rex Tools & Equipment',
    supplierUserId: '',
    category: 'Electrical',
    description: ''
  }
];

const memoryEnquiries = [];
const memoryMaterials = [];

const dbReady = () => mongoose.connection.readyState === 1;

function materialShape(m) {
  return {
    id: m.materialId,
    name: m.name,
    pack: m.pack,
    moq: m.moq,
    indicativePrice: m.indicativePrice,
    supplier: m.supplier,
    category: m.category,
    description: m.description || '',
    supplierUserId: m.supplierUserId || '',
    city: m.city || '',
    state: m.state || '',
    address: m.address || '',
    imageUrl: m.imageUrl || '',
    approvalStatus: m.approvalStatus || 'approved'
  };
}

function allMemoryMaterials() {
  return [...seedMaterials, ...memoryMaterials];
}

async function ensureSeeded() {
  if (!dbReady()) return;
  const ops = seedMaterials.map((m) => ({
    updateOne: {
      filter: { materialId: m.materialId },
      update: { $setOnInsert: m },
      upsert: true
    }
  }));
  await Material.bulkWrite(ops, { ordered: false });
}

function numericFromText(v) {
  if (!v) return null;
  const cleaned = String(v).replace(/[,₹\s]/g, '');
  const match = cleaned.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function filterMaterials(docs, q, category, city, state, minPrice, maxPrice) {
  let out = docs;
  const term = typeof q === 'string' ? q.trim().toLowerCase() : '';
  if (term) {
    out = out.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.supplier.toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term) ||
        (m.description && m.description.toLowerCase().includes(term))
    );
  }
  if (category && category !== 'All') {
    out = out.filter((m) => m.category === category);
  }
  if (city) {
    out = out.filter((m) => (m.city || '').toLowerCase() === city.toLowerCase());
  }
  if (state) {
    out = out.filter((m) => (m.state || '').toLowerCase() === state.toLowerCase());
  }
  const parsedMin = minPrice !== undefined && minPrice !== '' ? Number(minPrice) : null;
  const parsedMax = maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : null;
  const hasMin = Number.isFinite(parsedMin);
  const hasMax = Number.isFinite(parsedMax);
  if (hasMin || hasMax) {
    out = out.filter((m) => {
      const val = numericFromText(m.indicativePrice);
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
      let docs = filterMaterials(allMemoryMaterials(), q, category, city, state, minPrice, maxPrice);
      docs = docs.filter((m) => !['pending', 'rejected'].includes(m.approvalStatus));
      return res.json(docs.map(materialShape));
    }

    await ensureSeeded();
    const filter = {
      $nor: [{ approvalStatus: 'pending' }, { approvalStatus: 'rejected' }]
    };
    if (category && category !== 'All') filter.category = category;
    if (city) filter.city = city;
    if (state) filter.state = state;
    if (typeof q === 'string' && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: rx },
        { supplier: rx },
        { category: rx },
        { description: rx }
      ];
    }
    let docs = await Material.find(filter).sort({ createdAt: -1 }).lean();
    docs = filterMaterials(docs, '', '', '', '', minPrice, maxPrice);
    return res.json(docs.map(materialShape));
  } catch {
    const docs = filterMaterials(
      allMemoryMaterials(),
      req.query.q || req.query.search,
      req.query.category,
      req.query.city,
      req.query.state,
      req.query.minPrice,
      req.query.maxPrice
    );
    res.json(docs.map(materialShape));
  }
});

router.get('/product/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params;
    if (!dbReady()) {
      const m = allMemoryMaterials().find((x) => x.materialId === materialId);
      if (!m || ['pending', 'rejected'].includes(m.approvalStatus)) {
        return res.status(404).json({ message: 'Product not found.' });
      }
      return res.json(materialShape(m));
    }
    await ensureSeeded();
    const m = await Material.findOne({ materialId }).lean();
    if (!m || ['pending', 'rejected'].includes(m.approvalStatus || '')) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(materialShape(m));
  } catch (err) {
    console.error('[materials/product]', err);
    res.status(500).json({ message: 'Could not load product.' });
  }
});

router.get('/my', requireAuth, requireRole('supplier'), async (req, res) => {
  try {
    const uid = req.auth.userId;
    if (!dbReady()) {
      const docs = memoryMaterials.filter((m) => m.supplierUserId === uid);
      return res.json(docs.map(materialShape));
    }
    await ensureSeeded();
    const docs = await Material.find({ supplierUserId: uid }).sort({ createdAt: -1 }).lean();
    res.json(docs.map(materialShape));
  } catch (err) {
    console.error('[materials/my]', err);
    res.status(500).json({ message: 'Could not load your listings.' });
  }
});

router.get('/enquiries/mine', requireAuth, requireRole('buyer'), async (req, res) => {
  try {
    const uid = req.auth.userId;
    if (!dbReady()) {
      const rows = memoryEnquiries
        .filter((e) => e.buyerId === uid)
        .map((e) => ({
          id: e.enquiryId,
          materialName: e.materialName,
          materialId: e.materialId,
          status: e.status,
          note: e.note,
          createdAt: e.createdAt
        }));
      return res.json(rows);
    }
    const docs = await Enquiry.find({ buyerId: uid }).sort({ createdAt: -1 }).lean();
    res.json(
      docs.map((e) => ({
        id: e.enquiryId,
        materialName: e.materialName,
        materialId: e.materialId,
        status: e.status,
        note: e.note,
        createdAt: e.createdAt
      }))
    );
  } catch (err) {
    console.error('[enquiries mine]', err);
    res.status(500).json({ message: 'Could not load enquiries.' });
  }
});

router.get('/enquiries/incoming', requireAuth, requireRole('supplier'), async (req, res) => {
  try {
    const uid = req.auth.userId;
    if (!dbReady()) {
      const rows = memoryEnquiries
        .filter((e) => e.supplierUserId === uid)
        .map((e) => ({
          id: e.enquiryId,
          materialName: e.materialName,
          materialId: e.materialId,
          buyerName: e.buyerName,
          buyerId: e.buyerId,
          buyerEmail: e.buyerEmail || '',
          status: e.status,
          note: e.note,
          createdAt: e.createdAt
        }));
      return res.json(rows);
    }
    const docs = await Enquiry.find({ supplierUserId: uid }).sort({ createdAt: -1 }).lean();
    res.json(
      docs.map((e) => ({
        id: e.enquiryId,
        materialName: e.materialName,
        materialId: e.materialId,
        buyerName: e.buyerName,
        buyerId: e.buyerId,
        buyerEmail: e.buyerEmail || '',
        status: e.status,
        note: e.note,
        createdAt: e.createdAt
      }))
    );
  } catch (err) {
    console.error('[enquiries incoming]', err);
    res.status(500).json({ message: 'Could not load enquiries.' });
  }
});

router.post('/enquiry', requireAuth, requireRole('buyer'), async (req, res) => {
  try {
    const { materialId, note } = req.body;
    const mid = typeof materialId === 'string' ? materialId.trim() : '';
    const noteText = typeof note === 'string' ? note.trim() : '';
    const buyerId = req.auth.userId;
    const buyerName = req.auth.name;

    if (!mid) {
      return res.status(400).json({ message: 'materialId is required.' });
    }

    if (!dbReady()) {
      const material = allMemoryMaterials().find((m) => m.materialId === mid);
      if (!material) return res.status(404).json({ message: 'Product not found.' });

      const enquiryId = `ENQ-${Date.now()}`;
      const created = {
        enquiryId,
        materialId: material.materialId,
        materialName: material.name,
        buyerId,
        buyerName,
        buyerEmail: req.auth.email || '',
        note: noteText,
        status: 'Sent',
        supplierUserId: material.supplierUserId || '',
        createdAt: new Date().toISOString()
      };
      memoryEnquiries.push(created);
      return res.status(201).json({
        id: created.enquiryId,
        message: 'Enquiry sent to the supplier.'
      });
    }

    await ensureSeeded();
    const material = await Material.findOne({ materialId: mid }).lean();
    if (!material) return res.status(404).json({ message: 'Product not found.' });

    const enquiryId = `ENQ-${Date.now()}`;
    const buyerEmail = (req.auth.email || '').trim();
    const created = await Enquiry.create({
      enquiryId,
      materialId: material.materialId,
      materialName: material.name,
      buyerId,
      buyerName,
      buyerEmail,
      note: noteText,
      status: 'Sent',
      supplierUserId: material.supplierUserId || ''
    });

    // Send RFQ notification to supplier's registered email.
    let supplierEmail = '';
    if (material.supplierUserId) {
      const supplierUser = await User.findById(material.supplierUserId).lean().catch(() => null);
      supplierEmail = supplierUser?.email || '';
    }
    try {
      await sendEmail({
        to: supplierEmail,
        subject: 'New RFQ received',
        html: `<p>You have received a new RFQ for <strong>${material.name}</strong> (${material.materialId}) from <strong>${buyerName}</strong>.</p>
          <p><strong>Buyer email:</strong> ${buyerEmail || 'Not on file'}</p>
          ${noteText ? `<p><strong>Note:</strong> ${noteText.replace(/</g, '&lt;')}</p>` : ''}`
      });
    } catch (mailErr) {
      console.error('[enquiry email]', mailErr);
    }

    res.status(201).json({
      id: created.enquiryId,
      message: 'Enquiry sent to the supplier.'
    });
  } catch (err) {
    console.error('[enquiry]', err);
    res.status(500).json({ message: 'Could not send enquiry.' });
  }
});

router.post('/', requireAuth, requireRole('supplier'), async (req, res) => {
  try {
    const { name, pack, moq, indicativePrice, category, description, city, state, address, imageUrl } = req.body;
    const nm = typeof name === 'string' ? name.trim() : '';
    if (!nm) {
      return res.status(400).json({ message: 'Product name is required.' });
    }

    const supplierLabel = req.auth.organization || req.auth.name || 'Supplier';
    const materialId = `MAT-${Date.now()}`;
    const uid = req.auth.userId;

    const doc = {
      materialId,
      name: nm,
      pack: typeof pack === 'string' ? pack.trim() : 'Unit',
      moq: typeof moq === 'string' ? moq.trim() : '1',
      indicativePrice: typeof indicativePrice === 'string' ? indicativePrice.trim() : 'On request',
      supplier: supplierLabel,
      supplierUserId: uid,
      city: typeof city === 'string' ? city.trim() : req.auth.city || '',
      state: typeof state === 'string' ? state.trim() : req.auth.state || '',
      address: typeof address === 'string' ? address.trim() : '',
      imageUrl: typeof imageUrl === 'string' ? imageUrl.trim() : '',
      approvalStatus: 'pending',
      category: typeof category === 'string' && category.trim() ? category.trim() : 'General',
      description: typeof description === 'string' ? description.trim() : ''
    };

    if (!dbReady()) {
      memoryMaterials.push(doc);
      return res.status(201).json({
        id: doc.materialId,
        message: 'Listing created. Connect MongoDB to persist across restarts.'
      });
    }

    const created = await Material.create(doc);
    res.status(201).json({ id: created.materialId, message: 'Product listed successfully.' });
  } catch (err) {
    console.error('[materials create]', err);
    res.status(500).json({ message: 'Could not create listing.' });
  }
});

export default router;
