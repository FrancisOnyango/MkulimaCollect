import { describe, test, expect, vi } from 'vitest';
import { createFarmer } from '../farmerRepository';

// Mock crypto for deterministic uuids in test environment
vi.mock('expo-crypto', () => ({ randomUUID: () => 'uuid-1' }));

describe('createFarmer transaction behavior', () => {
  test('uses the provided transaction writer for DB inserts and enqueues outbox on same tx', async () => {
    const calls: string[] = [];

    // mock tx insert that records table names and returns object with values().
    const tx = {
      insert: (table: any) => {
        return {
          values: async (payload: any) => {
            calls.push(JSON.stringify({ table: (table && (table as any).name) || 'unknown', payload }));
            return Promise.resolve();
          },
        };
      },
    };

    // mock db that wraps callback with tx
    const db = {
      transaction: async (cb: any) => {
        await cb(tx);
      },
    } as any;

    const input = { agentId: 'agent-1', orgId: 'org-1', fullLegalName: 'John Doe' };

    const result = await createFarmer(db, input as any);

    // Expect at least two insert calls: one for farmers (entity) and one for sync_outbox
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(result.farmerId).toBeDefined();
    expect(result.operationUuid).toBeDefined();
  });
});
