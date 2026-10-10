# Test Data Guide

## Overview
This guide documents all the seed test data that has been created for development and testing purposes. The data is seeded automatically when the server starts via the `seed_test_data` migration.

## Database Summary

| Collection | Count | Details |
|-----------|-------|---------|
| Users | 8 | 1 Super Admin, 1 Admin, 3 Agents, 3 Customers |
| Agents | 3 | Service providers with pricing and availability |
| Availability | 21 | 7 days × 3 agents (1 slot per day) |
| Analytics Events | 468 | Page views and session starts across 7 days |

## User Accounts

### Super Admin
- **Email**: `admin@local.test`
- **Password**: `Admin@123`
- **Role**: `superAdmin`
- **Name**: Super Admin
- **Use case**: Full system access, manage all admins and data

### Admin Account
- **Email**: `admin.user@local.test`
- **Password**: `Admin@123`
- **Role**: `admin`
- **Name**: Admin User
- **Phone**: +91-9876543213
- **Use case**: System administration, manage users and agents

### Agents

#### Agent 1: John
- **Email**: `agent.john@local.test`
- **Password**: `Agent@123`
- **Role**: `agent`
- **Phone**: +91-9876543210
- **DOB**: 1990-05-15

#### Agent 2: Sarah
- **Email**: `agent.sarah@local.test`
- **Password**: `Agent@123`
- **Role**: `agent`
- **Phone**: +91-9876543211
- **DOB**: 1992-08-22

#### Agent 3: Mike
- **Email**: `agent.mike@local.test`
- **Password**: `Agent@123`
- **Role**: `agent`
- **Phone**: +91-9876543212
- **DOB**: 1988-03-10

### Customers

#### Customer 1: Alice
- **Email**: `customer.alice@local.test`
- **Password**: `Customer@123`
- **Role**: `customer`
- **Phone**: +91-9123456780
- **DOB**: 1995-12-25

#### Customer 2: Bob
- **Email**: `customer.bob@local.test`
- **Password**: `Customer@123`
- **Role**: `customer`
- **Phone**: +91-9123456781
- **DOB**: 1993-07-18

#### Customer 3 (Default)
- **Email**: `customer@local.test`
- **Password**: `Customer@123`
- **Role**: `customer`
- **Name**: Demo Customer

## Agent Service Providers

### Agent 1: Priya Sharma
- **Phone**: +91-8800112233
- **Address**: 123 MG Road, Bangalore
- **Badges**: Certified, Top Rated
- **Pricing**: ₹500 INR
- **Availability**: 9 AM - 6 PM for next 7 days

### Agent 2: Rajesh Kumar
- **Phone**: +91-8800112234
- **Address**: 456 Indiranagar, Bangalore
- **Badges**: Experienced, Expert
- **Pricing**: ₹750 INR
- **Availability**: 9 AM - 6 PM for next 7 days

### Agent 3: Sophia Patel
- **Phone**: +91-8800112235
- **Address**: 789 Whitefield, Bangalore
- **Badges**: Certified, Recommended
- **Pricing**: ₹600 INR
- **Availability**: 9 AM - 6 PM for next 7 days

## Availability Data

### Coverage
- **Duration**: Next 7 days (from today)
- **Time Slots**: 9 AM - 6 PM
- **Agents**: 3 service providers
- **Total Slots**: 21 (3 agents × 7 days)

### Testing Availability API
```bash
# Get available agents for today
curl http://localhost:5050/api/availability/today

# Get agents for a specific date (ISO format: YYYY-MM-DD)
curl http://localhost:5050/api/availability/2026-10-10
```

## Analytics Events

### Event Types
- **page_view**: User viewed a page
- **session_start**: User started a session

### Tracked Paths
| Path | Users | Purpose |
|------|-------|---------|
| `/` | All | Home page |
| `/today` | Agents | Agent dashboard |
| `/account` | Agents | User account page |
| `/agents` | Customers | Browse agents |
| `/agents/1` | Customers | View agent details |
| `/admin` | Admin | Admin dashboard |
| `/admin/agents` | Admin | Manage agents |
| `/admin/availability` | Admin | Manage availability |
| `/admin/analytics` | Admin | View analytics |

### Event Generation
- **Duration**: Past 7 days
- **Total Events**: 468
- **Distribution**: Multiple events per user per day
- **Variety**: Mix of authenticated and anonymous events

### Testing Analytics API
```bash
# Get analytics summary
curl http://localhost:5050/api/analytics/summary

# Get events for a date range
curl 'http://localhost:5050/api/analytics/events?startDate=2026-10-03&endDate=2026-10-10'
```

## Testing Workflows

### 1. Customer Flow
1. Login as `customer.alice@local.test` / `Customer@123`
2. Browse available agents
3. Check availability for specific dates
4. View agent details and pricing

### 2. Agent Flow
1. Login as `agent.john@local.test` / `Agent@123`
2. View your availability
3. Update profile information
4. Check today's bookings

### 3. Admin Flow
1. Login as `admin.user@local.test` / `Admin@123`
2. Manage agents and users
3. View and manage availability
4. Monitor analytics and user behavior

### 4. Super Admin Flow
1. Login as `admin@local.test` / `Admin@123`
2. Full system access
3. Manage all users (admins, agents, customers)
4. System configuration and monitoring

## Database Maintenance

### View All Test Data
```bash
# Connect to MongoDB
mongosh agent_availability

# Check users
db.users.find().pretty()

# Check agents
db.agents.find().pretty()

# Check availability
db.availabilities.find().pretty()

# Check analytics events
db.analyticsevents.find().pretty()
```

### Reset Test Data
```bash
# Stop the server first
# Then delete collections
mongosh agent_availability

db.users.deleteMany({ email: { $in: [
  'agent.john@local.test',
  'agent.sarah@local.test', 
  'agent.mike@local.test',
  'customer.alice@local.test',
  'customer.bob@local.test',
  'admin.user@local.test'
] }})

db.agents.deleteMany({ phone: { $in: [
  '+91-8800112233',
  '+91-8800112234',
  '+91-8800112235'
] }})

db.availabilities.deleteMany({})
db.analyticsevents.deleteMany({})

# Delete the migration
db.migrations.deleteOne({ name: 'seed_test_data' })

# Restart the server to re-seed
```

### Add More Test Data
Create a new migration in `server/src/migrations/migrator.js`:

```javascript
{
  name: 'seed_additional_test_data',
  up: async () => {
    // Add your additional test data here
    const newAgent = await Agent.create({
      name: 'New Agent',
      phone: '+91-9999999999',
      address: 'New Address',
      pricing: { amount: 800, currency: 'INR' },
    });
    console.log('Created new agent:', newAgent.name);
  },
}
```

Then restart the server to apply the migration.

## Quick Reference

### All Test Account Passwords
All test accounts use one of these passwords:
- **Admins**: `Admin@123`
- **Agents**: `Agent@123`
- **Customers**: `Customer@123`

### Database Connection
```javascript
// MongoDB URI
mongodb://127.0.0.1:27017/agent_availability

// Database Name
agent_availability
```

### API Base URL
```
http://localhost:5050/api
```

### Frontend URL
```
http://localhost:5174
```

## Notes

- Availability slots are set for 7 days from today
- All dates use the Asia/Kolkata timezone
- Analytics events are distributed across the past 7 days
- Test data is idempotent - re-running the migration won't create duplicates
- Passwords are for testing only and should never be used in production

