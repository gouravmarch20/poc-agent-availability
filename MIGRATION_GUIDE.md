# Database Migration Guide

## Overview
This project includes a database migration system to track and manage database schema changes over time. The system ensures consistent database state across different environments.

## Migration System Architecture

### Key Components:
1. **Migration Model** (`src/migrations/migration.model.js`): Tracks which migrations have been applied
2. **Migrator** (`src/migrations/migrator.js`): Core migration logic
3. **CLI Tool** (`src/migrations/cli.js`): Command-line interface for migration management
4. **Migrations Directory**: Contains all migration definitions

### How It Works:
- Migrations run automatically when the server starts
- Each migration has a unique name and runs only once
- Migration state is stored in the `migrations` collection in MongoDB
- Migrations are applied in the order defined in the `migrations` array

## Available Commands
````
### From Server Directory:
```bash
# Run pending migrations
npm run migrate

# List all migrations (applied and pending)
npm run migrations:list

# Show migration status
npm run migrations:status
```

### Migrations run automatically:
- When the server starts (`npm run dev` or `npm start`)
- This ensures database is always up-to-date

## Creating New Migrations

### Step 1: Add a new migration to the `migrations` array in `migrator.js`:

```javascript
// Add to the migrations array in src/migrations/migrator.js
{
  name: 'add_new_field_to_users',
  up: async () => {
    // Your migration logic here
    await mongoose.connection.db.collection('users').updateMany(
      {},
      { $set: { newField: 'default value' } }
    );
    console.log('Applied migration: add_new_field_to_users');
  },
},
```

### Step 2: Run the migration:
```bash
npm run migrate
```

Or restart the server:
```bash
npm run dev
```

## Migration Best Practices

### 1. **Idempotent Migrations**
- Migrations should be safe to run multiple times
- Use `updateMany` with `$setOnInsert` or check if changes are needed

### 2. **Order Matters**
- Migrations run in the order they appear in the array
- New migrations should be added to the end

### 3. **Backward Compatibility**
- Consider how migrations affect existing data
- Provide default values for new required fields
- Test migrations in development before production

### 4. **Error Handling**
- Migrations should handle errors gracefully
- Failed migrations are logged and stop the process
- Fix errors and retry the migration

## Example Migration Patterns

### Adding a New Field:
```javascript
{
  name: 'add_phone_to_users',
  up: async () => {
    await mongoose.connection.db.collection('users').updateMany(
      { phone: { $exists: false } },
      { $set: { phone: '' } }
    );
  },
}
```

### Modifying Existing Data:
```javascript
{
  name: 'normalize_email_case',
  up: async () => {
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    for (const user of users) {
      await mongoose.connection.db.collection('users').updateOne(
        { _id: user._id },
        { $set: { email: user.email.toLowerCase() } }
      );
    }
  },
}
```

### Creating Indexes:
```javascript
{
  name: 'create_email_index',
  up: async () => {
    await mongoose.connection.db.collection('users').createIndex(
      { email: 1 },
      { unique: true }
    );
  },
}
```

## Troubleshooting

### Migration Failed:
1. Check MongoDB logs for errors
2. Verify migration logic is correct
3. Manually fix any data issues
4. Remove failed migration record from `migrations` collection if needed
5. Run migration again

### Migration Already Applied:
- The system prevents duplicate migrations
- If you need to re-run, remove the record from `migrations` collection:
```javascript
db.migrations.deleteOne({ name: 'migration_name' })
```

### Development vs Production:
- Same migration system works in both environments
- Test migrations thoroughly in development
- Consider data migration size and performance in production

## Current Migrations

| Migration Name | Description | Status |
|----------------|-------------|--------|
| `initial_schema_and_seed` | Creates initial database schema and seeds admin/customer users | Applied |

## Adding Seed Data
Seed data is now part of the migration system. To add more seed data, create a new migration:

```javascript
{
  name: 'seed_additional_data',
  up: async () => {
    // Add your seed logic here
    await User.create({ name: 'New User', email: 'user@example.com', ... });
  },
}
```