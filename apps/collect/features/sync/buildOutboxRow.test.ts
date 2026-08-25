import { buildOutboxRow } from './SyncOutbox';

describe('buildOutboxRow', () => {
  test('returns expected shape and defaults', () => {
    const input = {
      entityType: 'farmer',
      entityId: 'local-1',
      mutationType: 'CREATE',
      payload: { localUuid: 'local-1' },
    } as const;

    const row = buildOutboxRow(input);

    expect(row.entryUuid).toBeDefined();
    expect(row.operationUuid).toBeDefined();
    expect(row.entityType).toBe('farmer');
    expect(row.entityId).toBe('local-1');
    expect(row.mutationType).toBe('CREATE');
    expect(typeof row.payload).toBe('string');
    expect(row.dependsOn).toBe('[]');
    expect(row.retryCount).toBe(0);
    expect(row.state).toBe('PENDING_SYNC');
  });
});
