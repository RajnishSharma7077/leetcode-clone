import { query } from './db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

let useDemo = false;
let demo = {
  users: [],
  refreshTokens: [],
  submissions: []
};

async function testDb() {
  try {
    await query('SELECT 1');
    useDemo = false;
  } catch (err) {
    console.warn('DB unreachable, switching to demo in-memory store');
    useDemo = true;
    // seed demo users
    demo.users = [
      { id: 1, username: 'alice', email: 'alice@example.com', password_hash: '$2b$10$example', rating: 1800 },
      { id: 2, username: 'bob', email: 'bob@example.com', password_hash: '$2b$10$example', rating: 1600 }
    ];
    demo.refreshTokens = [];
    demo.submissions = [
      { id: 1, user_id: 1, problem_id: 1, language: 'javascript', verdict: 'accepted', created_at: new Date().toISOString() },
      { id: 2, user_id: 2, problem_id: 1, language: 'python', verdict: 'wrong-answer', created_at: new Date().toISOString() }
    ];
  }
}

await testDb();

export async function createUser({ username, email, password_hash }) {
  if (!useDemo) {
    const res = await query('INSERT INTO users(username, email, password_hash) VALUES($1,$2,$3) RETURNING id, username, rating', [username, email || null, password_hash]);
    return res.rows[0];
  }

  const id = demo.users.length ? Math.max(...demo.users.map(u => u.id)) + 1 : 1;
  const user = { id, username, email, password_hash, rating: 1500 };
  demo.users.push(user);
  return { id: user.id, username: user.username, rating: user.rating };
}

export async function findUserByUsername(username) {
  if (!useDemo) {
    const res = await query('SELECT id, username, password_hash, rating FROM users WHERE username = $1', [username]);
    return res.rows[0];
  }
  return demo.users.find(u => u.username === username) || null;
}

export async function findUserById(id) {
  if (!useDemo) {
    const res = await query('SELECT id, username, rating FROM users WHERE id = $1', [id]);
    return res.rows[0];
  }
  return demo.users.find(u => u.id === Number(id)) || null;
}

export async function insertRefreshToken(user_id, token) {
  if (!useDemo) {
    await query('INSERT INTO refresh_tokens(user_id, token) VALUES($1,$2)', [user_id, token]);
    return;
  }
  demo.refreshTokens.push({ id: demo.refreshTokens.length + 1, user_id, token, created_at: new Date().toISOString() });
}

export async function findRefreshToken(token) {
  if (!useDemo) {
    const res = await query('SELECT id, user_id FROM refresh_tokens WHERE token = $1', [token]);
    return res.rows[0];
  }
  return demo.refreshTokens.find(t => t.token === token) || null;
}

export async function deleteRefreshToken(token) {
  if (!useDemo) {
    await query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    return;
  }
  demo.refreshTokens = demo.refreshTokens.filter(t => t.token !== token);
}

export async function insertSubmission({ user_id, problem_id, language, code, verdict, runtime_ms = null, stderr = '', details = null, compile_ms = null }) {
  if (!useDemo) {
    // Try to store extended fields if the DB schema supports them; fall back to original insert if it fails
    try {
      await query('INSERT INTO submissions(user_id, problem_id, language, code, verdict, runtime_ms, stderr, details, compile_ms) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [user_id, problem_id, language, code, verdict, runtime_ms, stderr || null, details ? JSON.stringify(details) : null, compile_ms]);
      return;
    } catch (err) {
      // fallback to simpler insert if extended columns missing
      try {
        await query('INSERT INTO submissions(user_id, problem_id, language, code, verdict) VALUES($1,$2,$3,$4,$5)', [user_id, problem_id, language, code, verdict]);
        return;
      } catch (err2) {
        console.error('insertSubmission db fallback failed', err2.message);
        return;
      }
    }
  }
  const id = demo.submissions.length ? Math.max(...demo.submissions.map(s => s.id)) + 1 : 1;
  demo.submissions.push({ id, user_id, problem_id, language, code, verdict, runtime_ms, compile_ms, stderr, details, created_at: new Date().toISOString() });
}

export async function getSubmissionsByUser(userId) {
  if (!useDemo) {
    const res = await query('SELECT id, problem_id, language, verdict, runtime_ms, memory_kb, created_at FROM submissions WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  }
  return demo.submissions.filter(s => s.user_id === Number(userId)).sort((a,b)=> new Date(b.created_at)-new Date(a.created_at));
}

export async function getLeaderboard(limit = 50) {
  if (!useDemo) {
    const res = await query('SELECT id, username, rating, created_at FROM users ORDER BY rating DESC LIMIT $1', [limit]);
    return res.rows;
  }
  return demo.users.sort((a,b)=> b.rating - a.rating).slice(0, limit).map(u => ({ id: u.id, username: u.username, rating: u.rating }));
}

export async function adjustUserRating(userId, delta) {
  if (!useDemo) {
    const res = await query('UPDATE users SET rating = GREATEST(0, rating + $1) WHERE id = $2 RETURNING id, username, rating', [Math.round(delta), userId]);
    return res.rows[0];
  }
  const u = demo.users.find(x => x.id === Number(userId));
  if (u) {
    u.rating = Math.max(0, Math.round(u.rating + delta));
    return { id: u.id, username: u.username, rating: u.rating };
  }
  return null;
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export default {
  createUser,
  findUserByUsername,
  findUserById,
  insertRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  insertSubmission,
  getSubmissionsByUser,
  getLeaderboard,
  verifyAccessToken
};
