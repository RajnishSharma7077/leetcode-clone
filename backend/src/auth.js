import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import store from './store.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXP = process.env.JWT_EXP || '15m';
const REFRESH_EXP_DAYS = process.env.REFRESH_EXP_DAYS || 30;

function signAccess(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXP });
}

function signRefresh(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: `${REFRESH_EXP_DAYS}d` });
}

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await store.createUser({ username, email: email || null, password_hash: hash });
    const access = signAccess(user);
    const refresh = signRefresh(user);

    await store.insertRefreshToken(user.id, refresh);

    res.json({ user: { id: user.id, username: user.username, rating: user.rating }, access, refresh });
  } catch (err) {
    console.error('register err', err);
    return res.status(400).json({ error: 'registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const user = await store.findUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash || '');
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const access = signAccess(user);
  const refresh = signRefresh(user);
  await store.insertRefreshToken(user.id, refresh);

  res.json({ user: { id: user.id, username: user.username, rating: user.rating }, access, refresh });
});

router.post('/refresh', async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: 'refresh token required' });

  try {
    const payload = jwt.verify(refresh, JWT_SECRET);
    const tokenRow = await store.findRefreshToken(refresh);
    if (!tokenRow) return res.status(401).json({ error: 'invalid refresh token' });

    const user = await store.findUserById(payload.id);
    if (!user) return res.status(401).json({ error: 'user not found' });

    const access = signAccess(user);
    res.json({ access });
  } catch (err) {
    return res.status(401).json({ error: 'invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: 'refresh token required' });

  await store.deleteRefreshToken(refresh);
  res.json({ ok: true });
});

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export default router;
