# Agent Assignment Portal

MERN portal so customers log in and see who is available on a date, instead of asking on WhatsApp/Telegram.

Timezone: **Asia/Kolkata**. Agent pricing is numeric `{ amount, currency }` (default `INR`). Images live in **MongoDB GridFS**; the Agent document stores only file IDs and metadata (max 10).

## Run locally

1. Start MongoDB on `127.0.0.1:27017`.
2. Install and start API + UI:

```bash
npm run install:all
cp server/.env.example server/.env   # already present for local defaults
npm run dev --prefix server
npm run dev --prefix client
```

- UI: http://localhost:5173
- API: http://localhost:5050 (default; macOS often occupies 5000)

Seeded accounts:

- Super admin: `admin@local.test` / `Admin@123`
- Customer: `customer@local.test` / `Customer@123`

Sessions: httpOnly cookie, 15-minute idle timeout, 1-hour absolute timeout, max 7 successful logins per user per calendar day.


## Database Migrations

This project includes a database migration system to track schema changes. Migrations run automatically when the server starts.

### Migration Commands:
```bash
# From server directory
cd server

# Run pending migrations
npm run migrate

# List migrations
npm run migrations:list

# Check status
npm run migrations:status
```

### Creating New Migrations:
1. Add migration to `server/src/migrations/migrator.js`
2. Run `npm run migrate` in server directory
3. See `MIGRATION_GUIDE.md` for detailed instructions

### Current Migrations:
- `initial_schema_and_seed`: Creates initial schema and seeds admin/customer users