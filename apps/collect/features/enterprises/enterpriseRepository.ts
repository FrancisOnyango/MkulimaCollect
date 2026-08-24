import * as Crypto from "expo-crypto";
import { eq } from "drizzle-orm";
import type { SectorIdValue } from "@/constants/sectorIds";
import type { AppDatabase } from "@/lib/db/database";
import { enterprises, sectorCollectionResponses } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type CreateEnterpriseInput = {
  farmerId: string;
  farmId: string;
  sector: SectorIdValue;
  dependsOn?: string[];
};

export async function createEnterprise(db: AppDatabase, input: CreateEnterpriseInput): Promise<{ enterpriseId: string; operationUuid: string }> {
  const enterpriseId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(enterprises).values({
      id: enterpriseId,
      farmerId: input.farmerId,
      farmId: input.farmId,
      sector: input.sector,
      status: "DRAFT",
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "enterprise",
      entityId: enterpriseId,
      mutationType: "CREATE",
      payload: {
        enterpriseLocalUuid: enterpriseId,
        farmerLocalUuid: input.farmerId,
        farmLocalUuid: input.farmId,
        sector: input.sector,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { enterpriseId, operationUuid };
}

export type SaveSectorResponseInput = {
  enterpriseId: string;
  schemaId: string;
  schemaVersion: string;
  payload: Record<string, unknown>;
  provenanceMap?: Record<string, unknown>;
  dependsOn?: string[];
};

export async function saveSectorResponse(db: AppDatabase, input: SaveSectorResponseInput): Promise<{ responseId: string; operationUuid: string }> {
  const responseId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(sectorCollectionResponses).values({
      id: responseId,
      enterpriseId: input.enterpriseId,
      schemaId: input.schemaId,
      schemaVersion: input.schemaVersion,
      payload: JSON.stringify(input.payload),
      provenanceMap: JSON.stringify(input.provenanceMap ?? {}),
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "sector_response",
      entityId: responseId,
      mutationType: "CREATE",
      payload: {
        responseLocalUuid: responseId,
        enterpriseLocalUuid: input.enterpriseId,
        schemaId: input.schemaId,
        schemaVersion: input.schemaVersion,
        payload: input.payload,
        provenanceMap: input.provenanceMap ?? {},
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { responseId, operationUuid };
}

export async function getEnterprisesByFarmer(db: AppDatabase, farmerId: string): Promise<(typeof enterprises.$inferSelect)[]> {
  return db.select().from(enterprises).where(eq(enterprises.farmerId, farmerId));
}

export async function getEnterprisesByFarm(db: AppDatabase, farmId: string): Promise<(typeof enterprises.$inferSelect)[]> {
  return db.select().from(enterprises).where(eq(enterprises.farmId, farmId));
}

export async function getEnterpriseById(db: AppDatabase, enterpriseId: string): Promise<typeof enterprises.$inferSelect | null> {
  const rows = await db.select().from(enterprises).where(eq(enterprises.id, enterpriseId)).limit(1);
  return rows[0] ?? null;
}

export async function getSectorResponsesByEnterprise(db: AppDatabase, enterpriseId: string): Promise<(typeof sectorCollectionResponses.$inferSelect)[]> {
  return db.select().from(sectorCollectionResponses).where(eq(sectorCollectionResponses.enterpriseId, enterpriseId));
}
