import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { verifyMailConfig } from './utils/mailer.js';

import authRouter from './routes/auth.js';
import tendersRouter from './routes/tenders.js';
import materialsRouter from './routes/materials.js';
import bidsRouter from './routes/bids.js';
import adminRouter from './routes/admin.js';
import notificationsRouter from './routes/notifications.js';
import messagesRouter from './routes/messages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Ensure DB is fully connected before hitting any route logic
app.use(async (req, res, next) => {
  await connectDB().catch(console.error);
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'unified-portal-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/tenders', tendersRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/products', materialsRouter);
app.use('/api', bidsRouter);
app.use('/api/admin', adminRouter);
app.use('/api', messagesRouter);
app.use('/api', notificationsRouter);

// Initialize DB and mail for serverless environment
connectDB().catch(console.error);
verifyMailConfig().catch(() => {});

// Only listen locally, Vercel will handle the exported app instance
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
  });
}

export default app;

