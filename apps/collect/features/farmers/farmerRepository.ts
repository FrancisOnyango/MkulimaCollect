import * as Crypto from "expo-crypto";
import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { SyncState } from "@/constants/syncStates";
import type { AppDatabase } from "@/lib/db/database";
import { farmerIdentities, farmers } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type FarmerStatus = "DRAFT" | "IN_PROGRESS" | "SUBMITTED" | "VERIFIED" | "NEEDS_CORRECTION";

export type CreateFarmerInput = {
  agentId: string;
  orgId: string;
  status?: FarmerStatus;
  fullLegalName?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  preferredName?: string;
};

export type FarmerSummary = typeof farmers.$inferSelect & {
  identity: typeof farmerIdentities.$inferSelect | null;
};

export async function createFarmer(db: AppDatabase, input: CreateFarmerInput): Promise<{ farmerId: string; operationUuid: string }> {
  const farmerId = Crypto.randomUUID();
  const identityId = Crypto.randomUUID();
  const now = new Date().toISOString();
  const status = input.status ?? "IN_PROGRESS";
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(farmers).values({
      id: farmerId,
      agentId: input.agentId,
      orgId: input.orgId,
      status,
      completenessPct: 0,
      declinedConsent: false,
      localVersion: 1,
      serverVersion: null,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      deletedAt: null,
    });

    if (input.fullLegalName || input.firstName || input.surname || input.preferredName) {
      await tx.insert(farmerIdentities).values({
        id: identityId,
        farmerId,
        fullLegalName: input.fullLegalName ?? null,
        firstName: input.firstName ?? null,
        middleName: input.middleName ?? null,
        surname: input.surname ?? null,
        preferredName: input.preferredName ?? null,
        nationalIdType: null,
        nationalIdHash: null,
        nationalIdLast3: null,
        primaryPhoneHash: null,
        primaryPhoneLast4: null,
        preferredLanguage: null,
        localVersion: 1,
        updatedAt: now,
        syncedAt: null,
      });
    }

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "farmer",
      entityId: farmerId,
      mutationType: "CREATE",
      payload: {
        localUuid: farmerId,
        agentId: input.agentId,
        orgId: input.orgId,
        status,
      },
      state: SyncState.PENDING_SYNC,
    });
  });

  return { farmerId, operationUuid };
}

export async function updateFarmerStatus(db: AppDatabase, farmerId: string, status: FarmerStatus): Promise<string> {
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx
      .update(farmers)
      .set({
        status,
        localVersion: sql`${farmers.localVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(farmers.id, farmerId));

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "farmer",
      entityId: farmerId,
      mutationType: "UPDATE",
      payload: {
        localUuid: farmerId,
        status,
        updatedAt: now,
      },
    });
  });

  return operationUuid;
}

export async function updateCompleteness(db: AppDatabase, farmerId: string, completenessPct: number): Promise<void> {
  await db
    .update(farmers)
    .set({
      completenessPct: Math.max(0, Math.min(100, Math.round(completenessPct))),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(farmers.id, farmerId));
}

export async function getFarmerById(db: AppDatabase, farmerId: string): Promise<FarmerSummary | null> {
  const rows = await db
    .select({ farmer: farmers, identity: farmerIdentities })
    .from(farmers)
    .leftJoin(farmerIdentities, eq(farmerIdentities.farmerId, farmers.id))
    .where(eq(farmers.id, farmerId))
    .limit(1);

  const row = rows[0];
  return row ? { ...row.farmer, identity: row.identity } : null;
}

export async function getFarmersByAgent(db: AppDatabase, agentId: string): Promise<FarmerSummary[]> {
  const rows = await db
    .select({ farmer: farmers, identity: farmerIdentities })
    .from(farmers)
    .leftJoin(farmerIdentities, eq(farmerIdentities.farmerId, farmers.id))
    .where(and(eq(farmers.agentId, agentId), isNull(farmers.deletedAt)))
    .orderBy(desc(farmers.updatedAt));

  return rows.map((row) => ({ ...row.farmer, identity: row.identity }));
}

export async function searchFarmers(db: AppDatabase, agentId: string, query: string): Promise<FarmerSummary[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return getFarmersByAgent(db, agentId);
  }

  const pattern = `%${trimmed}%`;
  const rows = await db
    .select({ farmer: farmers, identity: farmerIdentities })
    .from(farmers)
    .leftJoin(farmerIdentities, eq(farmerIdentities.farmerId, farmers.id))
    .where(
      and(
        eq(farmers.agentId, agentId),
        isNull(farmers.deletedAt),
        or(
          like(farmers.id, pattern),
          like(farmerIdentities.fullLegalName, pattern),
          like(farmerIdentities.firstName, pattern),
          like(farmerIdentities.surname, pattern),
        ),
      ),
    )
    .orderBy(desc(farmers.updatedAt));

  return rows.map((row) => ({ ...row.farmer, identity: row.identity }));
}
