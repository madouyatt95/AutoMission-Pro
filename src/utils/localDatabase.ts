import { openDB, type DBSchema } from 'idb';

export type CloudTable = 'clients' | 'vehicles' | 'missions' | 'rappels' | 'custom_mission_types'
  | 'documents' | 'app_settings' | 'custom_expense_types';

export interface CloudChange {
  key: string;
  table: CloudTable;
  id: string;
  operation: 'upsert' | 'delete';
  data?: Record<string, unknown>;
  ignoreDuplicates?: boolean;
  version: string;
  queuedAt: number;
}

interface LocalDatabase extends DBSchema {
  state: { key: string; value: string };
  outbox: { key: string; value: CloudChange };
}

let database: ReturnType<typeof openDB<LocalDatabase>> | undefined;

export function getLocalDatabase() {
  database ??= openDB<LocalDatabase>('automission-pro', 1, {
    upgrade(db) {
      db.createObjectStore('state');
      db.createObjectStore('outbox', { keyPath: 'key' });
    },
  }).catch((error: unknown) => {
    database = undefined;
    throw error;
  });
  return database;
}
