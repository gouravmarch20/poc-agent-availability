import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { Migration } from './migration.model.js';
import { MigrationDefinition } from './types.js';

const versionsDirectory = fileURLToPath(new URL('./versions/', import.meta.url));
const sourceExtension = import.meta.url.endsWith('.ts') ? '.ts' : '.js';

async function loadMigrations(): Promise<MigrationDefinition[]> {
  const files = await readdir(versionsDirectory);
  const migrationFiles = files
    .filter((file) => file.endsWith(sourceExtension) && /^v[1-9]\d*_[a-z0-9_-]+\.(?:ts|js)$/.test(file))
    .sort((left, right) => Number(left.split('_')[0].slice(1)) - Number(right.split('_')[0].slice(1)));

  const loaded = await Promise.all(migrationFiles.map(async (file) => {
    const fileUrl = pathToFileURL(join(versionsDirectory, file)).href;
    const module = await import(fileUrl) as { default: MigrationDefinition };
    return module.default;
  }));
  return loaded.sort((left, right) => versionNumber(left) - versionNumber(right));
}

function versionNumber(migration: MigrationDefinition): number {
  const match = /^v([1-9]\d*)$/.exec(migration.version);
  if (!match) throw new Error(`Invalid migration version "${migration.version}" for ${migration.name}`);
  return Number(match[1]);
}

function validateMigrationRegistry(migrations: MigrationDefinition[]): void {
  const versions = new Set<number>();
  const names = new Set<string>();

  migrations.forEach((migration, index) => {
    const version = versionNumber(migration);
    if (versions.has(version)) throw new Error(`Duplicate migration version v${version}`);
    if (names.has(migration.name)) throw new Error(`Duplicate migration name ${migration.name}`);
    if (version !== index + 1) {
      throw new Error(`Migration sequence must be continuous: expected v${index + 1}, found v${version}`);
    }
    versions.add(version);
    names.add(migration.name);
  });
}

function describe(migration: MigrationDefinition): string {
  return `${migration.version} (${migration.name})`;
}

export async function nextMigrationVersion(): Promise<number> {
  const migrations = await loadMigrations();
  return migrations.reduce((highest, migration) => Math.max(highest, versionNumber(migration)), 0) + 1;
}

export async function runMigrations(): Promise<void> {
  const migrations = await loadMigrations();
  validateMigrationRegistry(migrations);
  await Migration.init();

  const records = await Migration.find().sort({ batch: 1, appliedAt: 1 });
  const latestCodeVersion = migrations.length ? versionNumber(migrations[migrations.length - 1]) : 0;
  const newerApplied = records.find((record) => {
    const match = record.version ? /^v([1-9]\d*)$/.exec(record.version) : null;
    return match !== null && Number(match[1]) > latestCodeVersion;
  });
  if (newerApplied) {
    throw new Error(`Database has migration ${newerApplied.version}; this application only knows through v${latestCodeVersion}`);
  }
  let batch = records.length ? Math.max(...records.map((record) => record.batch)) + 1 : 1;

  for (const migration of migrations) {
    const applied = records.find(
      (record) => record.version === migration.version || record.name === migration.name
    );

    if (applied) {
      if (!applied.version) {
        await Migration.updateOne({ _id: applied._id }, { $set: { version: migration.version } });
        console.log(`Backfilled ${migration.version} for existing migration ${migration.name}`);
      }
      continue;
    }

    console.log(`Running migration ${describe(migration)}`);
    await migration.up();
    await Migration.create({
      version: migration.version,
      name: migration.name,
      batch,
      appliedAt: new Date(),
    });
    console.log(`Applied migration ${describe(migration)}`);
  }

  console.log('All migrations applied successfully');
}

export async function listMigrations(): Promise<void> {
  const migrations = await loadMigrations();
  validateMigrationRegistry(migrations);
  const applied = await Migration.find().sort({ batch: 1, appliedAt: 1 });
  const appliedByVersion = new Map(applied.map((record) => [record.version ?? record.name, record]));

  console.log('Migration status:');
  for (const migration of migrations) {
    const record = appliedByVersion.get(migration.version) ?? appliedByVersion.get(migration.name);
    if (record) {
      console.log(`  [applied] ${describe(migration)} | batch ${record.batch} | ${record.appliedAt.toISOString()}`);
    } else {
      console.log(`  [pending] ${describe(migration)}`);
    }
  }

  const known = new Set(migrations.flatMap((migration) => [migration.version, migration.name]));
  const unrecognized = applied.filter((record) => !known.has(record.version ?? record.name));
  for (const record of unrecognized) {
    console.warn(`  [unknown] ${record.version ?? record.name} is recorded in the database but absent from this checkout`);
  }
}