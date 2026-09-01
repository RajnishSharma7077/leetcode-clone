Local PostgreSQL set up (dev)

This project includes a docker-compose.yml that provisions a local Postgres instance with an init SQL script.

To run locally (requires Docker):

1. From project root:
   docker compose up -d postgres

2. Verify Postgres is listening on localhost:5432 and the database `lcdb` exists (user lcuser / lcpass)

3. Start the backend:
   cd backend
   npm install
   npm start

If Docker is not available, run a PostgreSQL server and apply backend/db/init.sql manually to create the schema.

Connection details (defaults in backend/.env):
- host: localhost
- port: 5432
- user: lcuser
- password: lcpass
- database: lcdb

Notes:
- The init.sql file is mounted into Postgres' /docker-entrypoint-initdb.d so the schema is created automatically when the DB is first initialized.
- The leaderboard endpoint is available at GET /api/leaderboard
- Auth routes: /auth/register, /auth/login, /auth/refresh, /auth/logout
