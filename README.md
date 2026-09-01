# LeetCode Clone

A full-stack practice platform inspired by LeetCode and Codeforces. This repository contains a development-ready clone that includes a light-mode web UI, a backend API, a multi-language sandbox judge (development harness), and an in-memory demo store so you can run the app locally without a database.

This README documents the project features, architecture, local development steps, API endpoints, sandbox notes, security considerations, and next steps for production hardening.

---

## Table of Contents

- Overview
- Features
- Architecture
- Local development
  - Requirements
  - Frontend
  - Backend
  - Running both
- API reference
  - Auth endpoints
  - Problem & submission endpoints
  - Leaderboard & WebSocket
- Sandbox / Judge
- Data & persistence
- Security & production notes
- Tests & smoke checks
- Contributing
- License

---

## Overview

LeetCode Clone is a developer-first project that provides a platform for practicing algorithmic problems and testing code submissions in multiple languages. It is intended for local development, learning, and experimentation. The runtime judge is a development harness and is not secure for untrusted code in production.

The application includes:
- A React + Vite frontend (light-mode UI) with problem browser, editor, language selector, and submission flow.
- A Node.js + Express backend that serves problem data, handles authentication (JWT access + refresh tokens), stores submissions (demo in-memory store fallback), and runs the judge harness.
- A multi-language sandbox runner (JavaScript, Python, Java, C++) that compiles/executes user code, captures verdicts, and returns structured results.
- A leaderboard with simple ELO adjustments on accepted submissions and a WebSocket server to broadcast leaderboard updates in real time.

---

## Features

- Problems
  - 500 curated problems (Easy / Medium / Hard) with metadata: title, description, tags, LeetCode/Codeforces difficulty, estimated time/space complexity, hints, and explanation.
  - Filter by difficulty and browse problem list.

- Multi-language judge
  - Supports submissions in: JavaScript (Node), Python (python3), Java (javac/java), and C++ (clang++).
  - Each submission is wrapped into a simple runner that executes provided test cases and returns JSON verdicts.
  - Execution metrics returned: verdict, passed/total counts, runtime_ms, compile_ms (where applicable), stderr, and details.

- Authentication & profiles
  - JWT-based authentication using short-lived access tokens + refresh tokens.
  - Endpoints: /auth/register, /auth/login, /auth/refresh, /auth/logout.
  - Frontend stores tokens in localStorage (dev-only approach). The client auto-refreshes tokens silently before expiry and retries failed requests once on 401.
  - Profile page shows user info and submission history.

- Leaderboard & ELO
  - Leaderboard ordered by rating.
  - On accepted submissions, backend applies a simple ELO delta to the user's rating (K=32, configurable in code) comparing user rating vs problem rating.
  - WebSocket server broadcasts leaderboard_init and leaderboard_update events to connected clients for real-time updates.

- Developer experience
  - Demo in-memory store automatically used when Postgres is unreachable so you can run the platform locally without Docker.
  - Extensive logging in the sandbox runner to help debug judge runs during development.

---

## Architecture

- Frontend: `frontend/`
  - React + Vite application: App.jsx is the main entry, simple textarea editor, language selector, and problem browser.
  - `frontend/src/api.js` contains the client API wrapper, token handling, scheduled silent refresh, and WebSocket connection helper.

- Backend: `backend/`
  - Express app: `backend/src/index.js` exposes REST endpoints for problems, submissions, profile, leaderboard, and attaches the auth router.
  - `backend/src/auth.js` implements register/login/refresh/logout using bcrypt and JWTs.
  - `backend/src/store.js` provides a persistence abstraction: attempts Postgres via `backend/src/db.js`, falls back to an in-memory demo seed when DB unreachable.
  - `backend/src/sandbox.js` contains the multi-language judge wrappers.

- Sandbox: `sandbox/` (supporting files)
  - Runner helpers and Dockerfile stubs for future containerized runners.

---

## Local development

### Requirements

- Node 18+ (or newer LTS)
- npm
- For Java support: a JDK available and JAVA_HOME set (the backend has code to use a portable JDK under `$HOME/.local` if present)
- clang++ for C++ compilation (on macOS the default Apple clang is used)
- python3

Note: Docker is not required to run the demo. If you want Postgres-backed persistence locally, run the included `docker-compose.yml`.

### Frontend

1. Install dependencies and start dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Open the local Vite URL (default port 5175-5176) in your browser.

### Backend

1. Install dependencies and start the server:

```bash
cd backend
npm install
npm start
```

2. The backend runs on http://localhost:4000 by default.

3. If Postgres is available, set DB environment variables in `backend/.env` or use docker-compose:

```bash
# from repo root
cd backend
# edit .env if needed, then
docker-compose up -d
```

If Postgres is not reachable, the backend automatically uses a seeded in-memory demo store.

### Running both
Start backend first, then start the frontend. The frontend expects the backend at http://localhost:4000 and will use WebSocket ws://localhost:4000 to receive leaderboard updates.

---

## API reference (selected)

Authentication
- POST /auth/register
  - Body: { username, password, email }
  - Response: { user: { id, username, rating }, access, refresh }

- POST /auth/login
  - Body: { username, password }
  - Response: { user, access, refresh }

- POST /auth/refresh
  - Body: { refresh }
  - Response: { access }

- POST /auth/logout
  - Body: { refresh }
  - Response: { ok: true }

Problems
- GET /api/problems
  - Query: ?difficulty=Easy|Medium|Hard
  - Returns: list of problem objects with metadata and testCases

Submissions
- POST /api/submit
  - Body: { problemId, language, code, userId? }
  - The judge executes the submitted code against problem.testCases and returns a structured result. If userId is provided the backend stores the submission and may update rating on accepted verdicts.
  - Response includes: accepted (boolean), verdict, message, runtime_ms, compile_ms (when applicable), casesExecuted, output, details

Profile & History
- GET /api/me
  - Header: Authorization: Bearer <access>
  - Returns current user info

- GET /api/submissions?userId=<id>
  - Returns list of submissions for the user (demo store or DB)

Leaderboard
- GET /api/leaderboard?limit=50
  - Returns top users by rating

WebSocket
- Connect to ws://<host>:4000
  - On connect, server sends { type: 'leaderboard_init', leaderboard }
  - On updates: { type: 'leaderboard_update', leaderboard }

---

## Sandbox / Judge notes

- The sandbox wraps user code into small harnesses that run the provided sample test cases and print a JSON verdict. The runner returns structured JSON with fields such as `verdict`, `passed`, `total` and the server augments that with `runtime_ms` and `compile_ms` where applicable.

- Current runners run code on the host process using child_process.execFile (dev only). This is unsafe for untrusted code and must be replaced by containerized isolated runners or an execution service for any public or multi-user deployment.

- Logs
  - The backend writes debug logs for each judge run including truncated stdout/stderr and timing metrics. Check server console for entries like `[sandbox][py]` or `[sandbox][js]`.

---

## Data & persistence

- `backend/src/store.js` abstracts persistence. It attempts to connect to Postgres via `backend/src/db.js`. If the DB is unreachable the code seeds an in-memory demo store with demo users, refresh tokens, and sample submissions to make local testing frictionless.

- Submissions schema (DB migration recommended):
  - The code tries to insert extended submission fields (runtime_ms, compile_ms, stderr, details JSON). If your `submissions` table does not contain those columns, the backend will gracefully fall back to inserting only the original columns.

If you plan to enable full persistence, add these columns to your Postgres schema (example SQL available on request).

---

## Security & production notes

- Do NOT run the provided sandbox judge in a multi-user or public production environment. It executes untrusted code on the host. Replace with one of the following approaches before exposing the service:
  - Container-per-submission with strict resource limits, disabled network, and user namespaces.
  - A dedicated sandboxing service (e.g., gVisor, Firecracker microVMs) with queueing and throttling.
  - Server-side static analysis + whitelist approach to mitigate obvious dangers.

- Tokens & storage
  - Currently the frontend stores access and refresh tokens in localStorage for simplicity. For production use consider using HTTP-only secure cookies for refresh tokens and keep access tokens short-lived.

- Rate limiting & abuse protection
  - Add server-side rate limiting on judge endpoints and auth to prevent resource exhaustion.

---

## Tests & smoke checks

- A Playwright-based smoke test snippet was used during development to automate register/login/submit flows. You can reproduce these checks manually:
  1. Start backend
  2. Start frontend
  3. Register a user, submit a known-good solution for a sample problem, verify judge returns `accepted`, and see submission appear in the Profile and rating update in Leaderboard.

---

## Contributing

Contributions are welcome. Typical workflows:
- Create a branch for your feature: `git checkout -b feature/my-feature`
- Open a Pull Request against `main` and describe the changes and rationale.

Notes for contributors:
- The sandbox is intentionally simple for local development. If adding languages or test harnesses, follow the patterns in `backend/src/sandbox.js` and add proper logging.
- If adding persistent fields, update DB migrations in `backend/db/init.sql` and `backend/README-DB.md`.

---

## License

This project is provided as-is for educational and development purposes.

---

If you'd like, I can also:
- Add an SQL migration for extended submission fields.
- Create a PR on your repository and open the PR page in the browser.
- Create a quick Docker Compose flow that includes Postgres and a sandbox runner container.

