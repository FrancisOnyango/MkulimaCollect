import * as Crypto from "expo-crypto";
import { desc, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { expenses, productionCycles, productionObservations, sectorCollectionResponses } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type SaveProductionObservationInput = {
  enterpriseId: string;
  sector: string;
  schemaId: string;
  schemaVersion: string;
  section: string;
  payload: Record<string, unknown>;
  observedAt?: string;
  dependsOn?: string[];
};

export async function getOrCreateActiveProductionCycle(
  db: AppDatabase,
  enterpriseId: string,
  sector: string,
): Promise<{ cycleId: string; operationUuid?: string }> {
  const existing = await getActiveProductionCycle(db, enterpriseId);

  if (existing) {
    return { cycleId: existing.id };
  }

  const cycleId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(productionCycles).values({
      id: cycleId,
      enterpriseId,
      sector,
      name: `${sector} active cycle`,
      startedAt: now,
      endedAt: null,
      status: "ACTIVE",
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "production_cycle",
      entityId: cycleId,
      mutationType: "CREATE",
      payload: { productionCycleLocalUuid: cycleId, enterpriseLocalUuid: enterpriseId, sector, startedAt: now },
    });
  });

  return { cycleId, operationUuid };
}

export async function saveProductionObservation(
  db: AppDatabase,
  input: SaveProductionObservationInput,
): Promise<{ observationId: string; responseId: string; operationUuid: string }> {
  const { cycleId } = await getOrCreateActiveProductionCycle(db, input.enterpriseId, input.sector);
  const observationId = Crypto.randomUUID();
  const responseId = Crypto.randomUUID();
  const now = new Date().toISOString();
  const observedAt = input.observedAt ?? now;
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(productionObservations).values({
      id: observationId,
      productionCycleId: cycleId,
      enterpriseId: input.enterpriseId,
      schemaId: input.schemaId,
      schemaVersion: input.schemaVersion,
      section: input.section,
      payload: JSON.stringify(input.payload),
      observedAt,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    await tx.insert(sectorCollectionResponses).values({
      id: responseId,
      enterpriseId: input.enterpriseId,
      schemaId: input.schemaId,
      schemaVersion: input.schemaVersion,
      payload: JSON.stringify(input.payload),
      provenanceMap: JSON.stringify(Object.fromEntries(Object.keys(input.payload).map((key) => [key, "agent_entry"]))),
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "production_observation",
      entityId: observationId,
      mutationType: "CREATE",
      payload: {
        observationLocalUuid: observationId,
        responseLocalUuid: responseId,
        productionCycleLocalUuid: cycleId,
        ...input,
        observedAt,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { observationId, responseId, operationUuid };
}

export type SaveExpenseInput = {
  enterpriseId: string;
  sector: string;
  category: string;
  amount: number;
  currency?: string;
  occurredAt?: string;
  notes?: string;
  dependsOn?: string[];
};

export async function saveExpense(db: AppDatabase, input: SaveExpenseInput): Promise<{ expenseId: string; operationUuid: string }> {
  const { cycleId } = await getOrCreateActiveProductionCycle(db, input.enterpriseId, input.sector);
  const expenseId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(expenses).values({
      id: expenseId,
      productionCycleId: cycleId,
      enterpriseId: input.enterpriseId,
      category: input.category,
      amount: input.amount,
      currency: input.currency ?? "KES",
      occurredAt: input.occurredAt ?? now,
      notes: input.notes ?? null,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "expense",
      entityId: expenseId,
      mutationType: "CREATE",
      payload: { expenseLocalUuid: expenseId, productionCycleLocalUuid: cycleId, ...input },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { expenseId, operationUuid };
}

export async function getActiveProductionCycle(db: AppDatabase, enterpriseId: string): Promise<typeof productionCycles.$inferSelect | null> {
  const rows = await db
    .select()
    .from(productionCycles)
    .where(sql`${productionCycles.enterpriseId} = ${enterpriseId} AND ${productionCycles.status} = 'ACTIVE'`)
    .limit(1);
  return rows[0] ?? null;
}

export async function getProductionObservationsByEnterprise(db: AppDatabase, enterpriseId: string): Promise<(typeof productionObservations.$inferSelect)[]> {
  return db.select().from(productionObservations).where(eq(productionObservations.enterpriseId, enterpriseId)).orderBy(desc(productionObservations.createdAt));
}

export async function getExpensesByEnterprise(db: AppDatabase, enterpriseId: string): Promise<(typeof expenses.$inferSelect)[]> {
  return db.select().from(expenses).where(eq(expenses.enterpriseId, enterpriseId)).orderBy(desc(expenses.createdAt));
}
