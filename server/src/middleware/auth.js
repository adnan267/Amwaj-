import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const COOKIE = 'amwaj_token';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
    maxAge: 7 * 24 * 3600 * 1000,
    path: '/',
  });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = req.cookies?.[COOKIE] || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'This account no longer exists.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Only admins can do this.' });
  next();
}
