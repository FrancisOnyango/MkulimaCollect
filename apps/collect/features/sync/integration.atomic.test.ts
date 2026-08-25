import Database from 'better-sqlite3';
import { describe, test, expect } from 'vitest';

function createSchema(db: Database) {
  // Minimal schema for atomicity test
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmers (id TEXT PRIMARY KEY NOT NULL, agent_id TEXT NOT NULL, org_id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sync_outbox (entry_uuid TEXT PRIMARY KEY NOT NULL, operation_uuid TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, payload TEXT NOT NULL);
  `);
}

describe('SQLite atomic outbox behavior', () => {
  test('transaction rollback prevents partial writes', () => {
    const db = new Database(':memory:');
    createSchema(db);

    // Begin transaction and then rollback
    db.exec('BEGIN TRANSACTION');
    db.prepare('INSERT INTO farmers (id, agent_id, org_id) VALUES (?, ?, ?)').run('f1', 'a1', 'o1');
    db.prepare('INSERT INTO sync_outbox (entry_uuid, operation_uuid, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)').run('e1', 'op1', 'farmer', 'f1', '{}');
    db.exec('ROLLBACK');

    const farmer = db.prepare('SELECT COUNT(*) as c FROM farmers').get();
    const outbox = db.prepare('SELECT COUNT(*) as c FROM sync_outbox').get();

    expect(farmer.c).toBe(0);
    expect(outbox.c).toBe(0);

    // Now commit transaction and verify both present
    db.exec('BEGIN TRANSACTION');
    db.prepare('INSERT INTO farmers (id, agent_id, org_id) VALUES (?, ?, ?)').run('f2', 'a1', 'o1');
    db.prepare('INSERT INTO sync_outbox (entry_uuid, operation_uuid, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?)').run('e2', 'op2', 'farmer', 'f2', '{}');
    db.exec('COMMIT');

    const farmer2 = db.prepare('SELECT COUNT(*) as c FROM farmers').get();
    const outbox2 = db.prepare('SELECT COUNT(*) as c FROM sync_outbox').get();

    expect(farmer2.c).toBe(1);
    expect(outbox2.c).toBe(1);

    db.close();
  });
});
