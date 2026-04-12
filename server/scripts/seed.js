import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from '../src/models/User.js';
import Tender from '../src/models/Tender.js';
import Material from '../src/models/Material.js';
import Bid from '../src/models/Bid.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const adminPasswordHash = await bcrypt.hash('sahil1327!', 10);
  const demoPasswordHash = await bcrypt.hash('Password@123', 10);

  // Admin: always refresh password on seed so login stays sahil1327!
  await User.updateOne(
    { email: 'sahilghongate@gmail.com' },
    {
      $set: {
        name: 'Admin',
        role: 'admin',
        organization: 'Bharat Bazaar',
        phone: '+91-9000000001',
        city: 'Mumbai',
        state: 'Maharashtra',
        passwordHash: adminPasswordHash
      }
    },
    { upsert: true }
  );
  await User.updateOne(
    { email: 'buyer@demo.com' },
    {
      $set: {
        name: 'Demo Buyer',
        role: 'buyer',
        organization: 'City Procurement Dept',
        phone: '+91-9000000002',
        city: 'Pune',
        state: 'Maharashtra'
      },
      $setOnInsert: { passwordHash: demoPasswordHash }
    },
    { upsert: true }
  );
  await User.updateOne(
    { email: 'supplier@demo.com' },
    {
      $set: {
        name: 'Demo Supplier',
        role: 'supplier',
        organization: 'Acme Supplies Pvt Ltd',
        phone: '+91-9000000003',
        city: 'Nashik',
        state: 'Maharashtra'
      },
      $setOnInsert: { passwordHash: demoPasswordHash }
    },
    { upsert: true }
  );

  const buyer = await User.findOne({ email: 'buyer@demo.com' }).lean();
  const supplier = await User.findOne({ email: 'supplier@demo.com' }).lean();
  if (!buyer || !supplier) throw new Error('Seed users not found after upsert.');

  await Tender.updateOne(
    { tenderId: 'TND-DEMO-001' },
    {
      $set: {
        title: 'Road Repair and Drainage Upgrade',
        category: 'Infrastructure',
        department: 'Public Works',
        location: 'Pune',
        city: 'Pune',
        state: 'Maharashtra',
        closesIn: '7 days',
        status: 'Published',
        approvalStatus: 'approved',
        bids: 1,
        estimatedValue: '₹1200000',
        summary: 'Repair selected roads and improve drainage in ward zones.',
        createdBy: buyer._id.toString(),
        buyerOrganization: buyer.organization || ''
      }
    },
    { upsert: true }
  );
  await Tender.updateOne(
    { tenderId: 'TND-DEMO-002' },
    {
      $set: {
        title: 'IT Hardware Procurement',
        category: 'Technology',
        department: 'IT Cell',
        location: 'Pune',
        city: 'Pune',
        state: 'Maharashtra',
        closesIn: '10 days',
        status: 'Draft',
        approvalStatus: 'pending',
        bids: 0,
        estimatedValue: '₹800000',
        summary: 'Procurement of laptops and networking equipment.',
        createdBy: buyer._id.toString(),
        buyerOrganization: buyer.organization || ''
      }
    },
    { upsert: true }
  );

  await Material.updateOne(
    { materialId: 'MAT-DEMO-001' },
    {
      $set: {
        name: 'TMT Steel Bars Fe500',
        pack: 'Bundle',
        moq: '10',
        indicativePrice: '₹65000',
        supplier: supplier.organization || supplier.name,
        supplierUserId: supplier._id.toString(),
        category: 'Civil & Construction',
        description: 'High quality TMT steel bars.',
        city: supplier.city || '',
        state: supplier.state || '',
        approvalStatus: 'approved'
      }
    },
    { upsert: true }
  );
  await Material.updateOne(
    { materialId: 'MAT-DEMO-002' },
    {
      $set: {
        name: 'Industrial Paint Set',
        pack: 'Can',
        moq: '25',
        indicativePrice: '₹2200',
        supplier: supplier.organization || supplier.name,
        supplierUserId: supplier._id.toString(),
        category: 'Painting',
        description: 'Weather-resistant paint for municipal use.',
        city: supplier.city || '',
        state: supplier.state || '',
        approvalStatus: 'pending'
      }
    },
    { upsert: true }
  );

  await Bid.updateOne(
    { bidId: 'BID-DEMO-001' },
    {
      $set: {
        tenderId: 'TND-DEMO-001',
        supplierId: supplier._id.toString(),
        bidderId: supplier._id.toString(),
        bidderName: supplier.name,
        bidderOrganization: supplier.organization || '',
        email: supplier.email,
        bidAmount: '₹1150000',
        quotedAmount: '₹1150000',
        status: 'pending',
        note: 'Delivery within 21 days.'
      }
    },
    { upsert: true }
  );

  console.log('Dummy data seeded successfully.');
  console.log('Login users:');
  console.log('- Admin: sahilghongate@gmail.com / sahil1327!');
  console.log('- Buyer: buyer@demo.com / Password@123');
  console.log('- Supplier: supplier@demo.com / Password@123');
  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error('Seed failed:', err.message);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});

