# LeetCode Clone

A full-stack interview prep and coding-practice app inspired by LeetCode and Codeforces. The project includes a light-mode interface, a 500-question archive, difficulty-based filters, and an analysis panel for time/space complexity, hints, and logic explanations.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Data layer: 500 curated problem entries with LeetCode and Codeforces-style difficulty ratings
- Sandbox: Execution harness for submission scoring (dev-only; replace with containerized runners for production)

## Project structure

- `frontend/` – light-mode problem browser and editor UI
- `backend/` – REST API, auth, and problem archive
- `sandbox/` – execution helper and runner wrappers for multiple languages

## Features

- 500 curated problems spanning Easy, Medium, and Hard
- Estimated LeetCode and Codeforces difficulty rankings
- Time and space complexity analysis per problem
- Number of simulated test cases executed
- Final hints and logic explanations
- Dynamic filtering by category and difficulty
- Multi-language editor support for JavaScript, Python, Java, and C++
- Real compile-and-run judge flow using a local sandbox harness for supported runtimes (development only)
- Authentication with JWT access/refresh tokens and demo in-memory store fallback
- Leaderboard with WebSocket updates and simple ELO adjustments on accepted submissions

## Quick start

Frontend:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5175
```

Backend:

```bash
cd backend
npm install
npm start
```

## Notes

- The sandbox runner executes code on the host for development and must be replaced with isolated containers (or a secure execution service) for production.
- The backend falls back to a seeded in-memory demo store when Postgres is unreachable — useful for local testing without Docker.
- If you want extended submission fields persisted (runtime_ms, compile_ms, stderr, details) add the corresponding columns to the `submissions` table in Postgres.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
