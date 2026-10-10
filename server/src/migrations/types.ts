export interface MigrationDefinition {
  version: `v${number}`;
  name: string;
  up: () => Promise<void>;
}