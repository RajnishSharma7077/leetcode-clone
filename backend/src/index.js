import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import { problems } from './data/problems.js';
import { executeSubmission } from './sandbox.js';
import authRouter, { verifyAccessToken } from './auth.js';
import * as store from './store.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LeetCode clone backend is running.' });
});

app.get('/api/problems', (req, res) => {
  const difficulty = req.query.difficulty;
  const filtered = difficulty && difficulty !== 'All'
    ? problems.filter((problem) => problem.difficulty === difficulty)
    : problems;

  res.json(filtered);
});

app.get('/api/stats', (req, res) => {
  const counts = {
    total: problems.length,
    easy: problems.filter((problem) => problem.difficulty === 'Easy').length,
    medium: problems.filter((problem) => problem.difficulty === 'Medium').length,
    hard: problems.filter((problem) => problem.difficulty === 'Hard').length
  };

  res.json(counts);
});

// Leaderboard - top users by rating
app.get('/api/leaderboard', async (req, res) => {
  const limit = Number(req.query.limit || 50);
  try {
    const rows = await store.getLeaderboard(limit);
    res.json(rows);
  } catch (err) {
    console.error('leaderboard err', err.message);
    res.status(500).json({ error: 'failed to load leaderboard' });
  }
});

// Current user info
app.get('/api/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing authorization' });
  const token = auth.replace(/^Bearer\s+/i, '');
  const payload = store.verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid token' });
  const user = await store.findUserById(payload.id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ id: user.id, username: user.username, rating: user.rating });
});

// Get submissions for a user
app.get('/api/submissions', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const rows = await store.getSubmissionsByUser(userId);
    res.json(rows);
  } catch (err) {
    console.error('submissions err', err.message);
    res.status(500).json({ error: 'failed to load submissions' });
  }
});

// Helper: compute Elo delta for user vs problem
function computeEloDelta(userRating, problemRating, accepted) {
  const K = 32; // adjustable
  const expected = 1 / (1 + Math.pow(10, (problemRating - userRating) / 400));
  const score = accepted ? 1 : 0;
  const delta = K * (score - expected);
  return Math.round(delta);
}

let wss;

app.post('/api/submit', async (req, res) => {
  const { problemId, language, code, userId } = req.body;

  if (!problemId || !language || !code) {
    return res.status(400).json({ error: 'problemId, language, and code are required.' });
  }

  const problem = problems.find((item) => item.id === Number(problemId));

  if (!problem) {
    return res.status(404).json({ error: 'Problem not found.' });
  }

  const judgeResult = await executeSubmission({ code, language, problem });

  // store submission if userId provided
  if (userId) {
    try {
      const runtime_ms = judgeResult.runtime_ms ?? null;
      const compile_ms = judgeResult.compile_ms ?? null;
      const stderr = judgeResult.stderr ?? '';
      const details = judgeResult;

      await store.insertSubmission({ user_id: userId, problem_id: problemId, language, code, verdict: judgeResult.verdict, runtime_ms, stderr, details, compile_ms });

      // If accepted, adjust rating
      if (judgeResult.verdict === 'accepted') {
        const user = await store.findUserById(userId);
        if (user) {
          const delta = computeEloDelta(user.rating || 1500, problem.rating || 1500, true);
          const updated = await store.adjustUserRating(userId, delta);

          // broadcast leaderboard update
          if (wss) {
            const lb = await store.getLeaderboard(50);
            const payload = JSON.stringify({ type: 'leaderboard_update', leaderboard: lb });
            console.log('[ws] broadcasting leaderboard_update, top=', (lb && lb.slice(0,5).map(u=>u.username).join(',')));
            wss.clients.forEach((client) => {
              if (client.readyState === 1) client.send(payload);
            });
          }
        }
      }
    } catch (err) {
      console.error('store submission err', err.message);
    }
  }

  return res.json({
    accepted: judgeResult.verdict === 'accepted',
    problemId,
    language,
    title: problem.title,
    verdict: judgeResult.verdict || 'accepted',
    message: judgeResult.verdict === 'accepted'
      ? `Submission for "${problem.title}" passed the judge.`
      : `Submission for "${problem.title}" failed the judge.`,
    timeComplexity: problem.timeComplexity,
    spaceComplexity: problem.spaceComplexity,
    casesExecuted: judgeResult.total || problem.casesExecuted,
    output: judgeResult.actual ?? `Generated output for ${problem.title}: ${problem.example.output}`,
    codePreview: code.slice(0, 160),
    stderr: judgeResult.stderr || '',
    details: judgeResult
  });
});

const server = http.createServer(app);

// WebSocket server for real-time leaderboard updates
wss = new WebSocketServer({ server });
wss.on('connection', async (socket) => {
  try {
    const lb = await store.getLeaderboard(50);
    socket.send(JSON.stringify({ type: 'leaderboard_init', leaderboard: lb }));
  } catch (e) {
    socket.send(JSON.stringify({ type: 'error', message: 'failed to load leaderboard' }));
  }
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
