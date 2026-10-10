#!/usr/bin/env node
import mongoose from 'mongoose';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MONGODB_URI } from '../config.js';
import { listMigrations, nextMigrationVersion, runMigrations } from './migrator.js';

const command = process.argv[2];

async function createMigration(slug: string | undefined): Promise<void> {
  if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
    throw new Error('Provide a migration slug using lowercase letters, numbers, and hyphens.');
  }

  const version = await nextMigrationVersion();
  const fileName = `v${version}_${slug.replaceAll('-', '_')}.ts`;
  const filePath = join(import.meta.dirname, 'versions', fileName);
  const migrationName = slug.replaceAll('-', '_');
  const contents = `import { MigrationDefinition } from '../types.js';

const migration: MigrationDefinition = {
  version: 'v${version}',
  name: '${migrationName}',
  async up() {
    // Add an idempotent schema or data change here.
  },
};

export default migration;
`;

  await mkdir(join(import.meta.dirname, 'versions'), { recursive: true });
  await writeFile(filePath, contents, { flag: 'wx' });
  console.log(`Created src/migrations/versions/${fileName}`);
}

async function main() {
  if (command === 'create') {
    await createMigration(process.argv[3]);
    return;
  }

  await mongoose.connect(MONGODB_URI);
  try {
    switch (command) {
      case 'migrate':
        console.log('Running migrations...');
        await runMigrations();
        break;
      case 'list':
      case 'status':
        await listMigrations();
        break;
      default:
        console.log('Available commands:');
        console.log('  migrate             Run pending migrations');
        console.log('  list | status       Show applied and pending versions');
        console.log('  create <slug>       Create the next versioned migration');
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});