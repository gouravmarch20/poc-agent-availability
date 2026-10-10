# Quick Start Guide

## Running the Project

Both backend and frontend are already running:

```bash
# Backend (already running)
npm run dev --prefix server

# Frontend (already running)
npm run dev --prefix client
```

## Access the Application

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:5050
- **API Health**: http://localhost:5050/api/health

## Test Login Credentials

### Option 1: Super Admin (Full Access)
```
Email: admin@local.test
Password: Admin@123
```

### Option 2: Admin (Manage Users & Agents)
```
Email: admin.user@local.test
Password: Admin@123
```

### Option 3: Customer (Browse Agents)
```
Email: customer.alice@local.test
Password: Customer@123
```

### Option 4: Agent (View Schedule)
```
Email: agent.john@local.test
Password: Agent@123
```

## What's Been Seeded

### Test Users (8 total)
- 1 Super Admin
- 1 Admin
- 3 Agents (John, Sarah, Mike)
- 3 Customers (Alice, Bob, Demo)

### Service Providers (3 Agents)
- **Priya Sharma** - ₹500, Certified & Top Rated
- **Rajesh Kumar** - ₹750, Experienced & Expert
- **Sophia Patel** - ₹600, Certified & Recommended

### Availability
- 21 time slots (3 agents × 7 days)
- Hours: 9 AM - 6 PM
- Next 7 days

### Analytics
- 468 events over past 7 days
- Various page views and session starts
- Mix of authenticated and anonymous events

## Database Management

```bash
# Connect to MongoDB
mongosh agent_availability

# View users
db.users.find().count()  // Shows 8

# View agents
db.agents.find().count()  // Shows 3

# View availability
db.availabilities.find().count()  // Shows 21

# View analytics
db.analyticsevents.find().count()  // Shows 468
```

## Migrations

```bash
cd server

# Check migration status
npm run migrations:status

# View all migrations
npm run migrations:list

# Run pending migrations
npm run migrate
```

## Files You Should Know About

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `QUICK_START.md` | This file - quick reference |
| `TEST_DATA_GUIDE.md` | Detailed test data documentation |
| `MIGRATION_GUIDE.md` | How to create new migrations |
| `server/src/migrations/migrator.js` | Where migrations are defined |
| `server/src/seed.js` | Original seed logic (Super Admin & Demo Customer) |

## Common Tasks

### Login to Test Different Roles
1. Open http://localhost:5174
2. Enter any test credential from above
3. Click Login
4. Explore features based on role

### View Test Data in Database
```bash
mongosh agent_availability
db.users.find({ role: 'agent' }).pretty()
db.agents.find().pretty()
db.availabilities.find({ date: '2026-10-10' }).pretty()
```

### Reset Test Data
```bash
cd server
mongosh agent_availability

# Delete test data
db.users.deleteMany({ email: { $in: [
  'agent.john@local.test', 'agent.sarah@local.test', 'agent.mike@local.test',
  'customer.alice@local.test', 'customer.bob@local.test', 'admin.user@local.test'
]}})

db.agents.deleteMany()
db.availabilities.deleteMany()
db.analyticsevents.deleteMany()

# Delete migration record
db.migrations.deleteOne({ name: 'seed_test_data' })

# Restart server to re-seed
npm run dev
```

### Add More Test Data
1. Edit `server/src/migrations/migrator.js`
2. Add new migration to the `migrations` array
3. Restart server to apply

Example:
```javascript
{
  name: 'add_more_agents',
  up: async () => {
    await Agent.create([
      {
        name: 'New Agent',
        phone: '+91-9999999999',
        address: 'New Location',
        pricing: { amount: 500, currency: 'INR' }
      }
    ]);
  }
}
```

## Troubleshooting

### Server won't start
```bash
# Check MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Restart server
npm run dev --prefix server
```

### Can't login
- Verify correct email/password from credentials above
- Check backend is running: http://localhost:5050/api/health
- Check frontend can reach backend (CORS enabled)

### Missing test data
```bash
# Check migrations
npm run migrations:status

# List test data
mongosh agent_availability
db.users.countDocuments()  // Should be 8
db.agents.countDocuments()  // Should be 3
```

### Database issues
```bash
# Connect to MongoDB
mongosh agent_availability

# Check collections
show collections

# Check document count
db.users.countDocuments()
db.agents.countDocuments()
```

## Next Steps

1. **Explore the app**: Login and browse different sections
2. **Test agent search**: Look at the 3 seeded agents
3. **Check availability**: See 7 days of time slots
4. **View analytics**: Check the dashboard
5. **Review docs**: Read detailed guides for more info

## Performance Notes

- Database: MongoDB on `127.0.0.1:27017`
- Auto-migration on startup
- Idempotent seed data (won't duplicate)
- 468 analytics events for comprehensive testing
- Full week of availability data for testing date ranges

## Support

Refer to detailed documentation:
- **TEST_DATA_GUIDE.md** - All credentials and data details
- **MIGRATION_GUIDE.md** - Advanced migration topics
- **README.md** - Project overview

---

**Happy testing!** 🚀