import type { RootDb } from '@/lib/db/client';

export type DataMigration = {
  name: string;
  up: (db: RootDb) => Promise<void>;
};
