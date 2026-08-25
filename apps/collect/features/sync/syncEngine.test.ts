import { vi, describe, test, expect } from 'vitest';

// Mock the sync lock to always succeed for the main test
vi.mock('./syncLockRepository', () => ({ acquireSyncLock: async () => true, releaseSyncLock: async () => {} }));

// Prepare a fake outbox entry
const fakeEntry = {
  entryUuid: 'entry-1',
  operationUuid: 'op-1',
  entityType: 'farmer',
  entityId: 'local-1',
  mutationType: 'CREATE',
  payload: { localUuid: 'local-1', agentId: 'agent-1', orgId: 'org-1' },
  dependsOn: [],
  retryCount: 0,
};

vi.mock('./SyncOutbox', () => ({
  getPendingEntries: async () => [fakeEntry],
  markSyncing: vi.fn(async () => {}),
  markSynced: vi.fn(async () => {}),
  markRetry: vi.fn(async () => {}),
}));

// Mock syncAttemptRepository so run doesn't fail
vi.mock('./syncAttemptRepository', () => ({ startSyncAttempt: async () => 'attempt-1', finishSyncAttempt: async () => {} }));

// Mock serverMapping so saveMapping is a noop
vi.mock('./serverMappingRepository', () => ({ saveMapping: async () => {} }));

import { runSyncEngine } from './SyncEngine';

describe('runSyncEngine', () => {
  test('retries when API createFarmer throws and marks retry', async () => {
    // Mock API that throws on createFarmer
    const api = {
      createFarmer: async () => {
        throw new Error('server error');
      },
      submitSyncBatch: async () => ({ rejected: [] }),
    } as any;

    const db = {} as any;

    const result = await runSyncEngine(db, api);

    // Because createFarmer throws, the run should attempt and count a failure
    expect(result.attempted).toBeGreaterThanOrEqual(1);
    expect(result.failed).toBeGreaterThanOrEqual(1);
  });

  test('succeeds when API responds', async () => {
    const api = {
      createFarmer: async () => ({ msid: 'MS-1', operationUuid: 'op-1' }),
      submitSyncBatch: async () => ({ rejected: [] }),
    } as any;

    const db = {} as any;

    const result = await runSyncEngine(db, api);

    expect(result.attempted).toBeGreaterThanOrEqual(1);
    expect(result.synced).toBeGreaterThanOrEqual(1);
  });
});
