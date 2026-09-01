# LeetCode Clone

A full-stack interview prep and coding-practice app inspired by LeetCode and Codeforces. The project now includes a light-mode interface, a 500-question archive, difficulty-based filters, and an analysis panel for time/space complexity, hints, and logic explanations.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Data layer: 500 curated problem entries with LeetCode and Codeforces-style difficulty ratings
- Sandbox: Dockerized execution scaffold for future submission scoring

## Project structure

- `frontend/` – light-mode problem browser and editor UI
- `backend/` – REST API and problem archive
- `sandbox/` – isolated execution environment stub for judge integration

## Features

- 500 curated problems spanning Easy, Medium, and Hard
- Estimated LeetCode and Codeforces difficulty rankings
- Time and space complexity analysis per problem
- Number of simulated test cases executed
- Final hints and logic explanations
- Dynamic filtering by category and difficulty
- Multi-language editor support for JavaScript, Python, Java, and C++
- Real compile-and-run judge flow using a local sandbox harness for supported runtimes
- Submission validation endpoint for practice and validation

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

The question archive is structured to be import-friendly for larger datasets and can be extended to connect to real public APIs or a database later.
