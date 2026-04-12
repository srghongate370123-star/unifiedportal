import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import User from '../models/User.js';
import { requireAuth, signUserToken } from '../middleware/auth.js';

const router = Router();

const dbReady = () => mongoose.connection.readyState === 1;

function userResponse(user) {
  const role = user.role === 'seller' ? 'supplier' : user.role;
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role,
    organization: user.organization || '',
    phone: user.phone || '',
    city: user.city || '',
    state: user.state || ''
  };
}

router.post('/register', async (req, res) => {
  if (!dbReady()) {
    return res.status(503).json({
      message:
        'Database is not connected. Install MongoDB locally or set MONGODB_URI in server/.env and restart the API.'
    });
  }

  try {
    const { email, password, name, role, organization, phone, city, state } = req.body;
    const em = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const pwd = typeof password === 'string' ? password : '';
    const nm = typeof name === 'string' ? name.trim() : '';
    const org = typeof organization === 'string' ? organization.trim() : '';
    const ph = typeof phone === 'string' ? phone.trim() : '';
    const roleRaw = typeof role === 'string' ? role.trim().toLowerCase() : '';
    const r = roleRaw === 'admin' ? 'admin' : roleRaw === 'supplier' || roleRaw === 'seller' ? 'supplier' : 'buyer';

    if (!em || !pwd || !nm) {
      return res.status(400).json({ message: 'Email, password, and name are required.' });
    }
    if (pwd.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: em });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(pwd, 10);
    const user = await User.create({
      email: em,
      passwordHash,
      name: nm,
      role: r,
      organization: org,
      phone: ph,
      city: typeof city === 'string' ? city.trim() : '',
      state: typeof state === 'string' ? state.trim() : ''
    });

    const token = signUserToken(user);
    res.status(201).json({ token, user: userResponse(user) });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ message: 'Could not create account. Try again later.' });
  }
});

router.post('/login', async (req, res) => {
  if (!dbReady()) {
    return res.status(503).json({
      message:
        'Database is not connected. Set MONGODB_URI in server/.env (see .env.example) and restart the API.'
    });
  }

  try {
    const { identifier, password } = req.body;
    const em =
      typeof identifier === 'string'
        ? identifier.trim().toLowerCase()
        : typeof req.body.email === 'string'
          ? req.body.email.trim().toLowerCase()
          : '';
    const pwd = typeof password === 'string' ? password : '';

    if (!em || !pwd) {
      return res.status(400).json({ message: 'Enter email and password.' });
    }

    const user = await User.findOne({ email: em });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const ok = await bcrypt.compare(pwd, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signUserToken(user);
    res.json({ token, user: userResponse(user) });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ message: 'Sign-in failed. Try again later.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  if (!dbReady()) {
    return res.json({ user: { ...req.auth, id: req.auth.userId } });
  }
  try {
    const user = await User.findById(req.auth.userId).lean();
    if (!user) {
      return res.status(401).json({ message: 'Account not found.' });
    }
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role === 'seller' ? 'supplier' : user.role,
        organization: user.organization || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || ''
      }
    });
  } catch {
    res.json({ user: { ...req.auth, id: req.auth.userId } });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  if (!dbReady()) {
    return res.status(503).json({ message: 'Database not connected.' });
  }
  try {
    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    const { name, organization, phone, city, state } = req.body;
    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof organization === 'string') user.organization = organization.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof city === 'string') user.city = city.trim();
    if (typeof state === 'string') user.state = state.trim();
    await user.save();
    res.json({ user: userResponse(user) });
  } catch (err) {
    console.error('[auth/patch me]', err);
    res.status(500).json({ message: 'Could not update profile.' });
  }
});

export default router;
