import type { DataMigration } from './types';

/**
 * Lane backfill is added in the SPEC-022 implementation PR, after
 * classifyJob writes the new roleFocus values.
 */
export const DATA_MIGRATIONS: readonly DataMigration[] = [];
