import { seedSuperAdmin } from '../../seed.js';
import { MigrationDefinition } from '../types.js';

const migration: MigrationDefinition = {
  version: 'v1',
  name: 'initial_schema_and_seed',
  async up() {
    await seedSuperAdmin();
  },
};

export default migration;