import jwt from 'jsonwebtoken';

const secret = () => process.env.JWT_SECRET || 'dev-only-change-JWT_SECRET-in-production';

export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  const token = h?.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Sign in required.' });
  }
  try {
    const payload = jwt.verify(token, secret());
    const normalizedRole = payload.role === 'seller' ? 'supplier' : payload.role;
    req.auth = {
      userId: payload.sub,
      role: normalizedRole,
      email: payload.email || '',
      name: payload.name || '',
      organization: payload.organization || ''
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ message: 'Sign in required.' });
    }
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: 'You do not have access to this action.' });
    }
    next();
  };
}

export function signUserToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role === 'seller' ? 'supplier' : user.role,
      email: user.email,
      name: user.name,
      organization: user.organization || ''
    },
    secret(),
    { expiresIn: '7d' }
  );
}
