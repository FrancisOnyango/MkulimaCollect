import * as Crypto from "expo-crypto";
import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { consents } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type SaveConsentInput = {
  farmerId: string;
  version: string;
  declined?: boolean;
  method: string;
  language: string;
  agentId: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracyM?: number;
  itemsAgreed: string[];
  mpesaAuthorized?: boolean;
  dependsOn?: string[];
};

export async function saveConsent(db: AppDatabase, input: SaveConsentInput): Promise<{ consentId: string; operationUuid: string }> {
  const consentId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(consents).values({
      id: consentId,
      farmerId: input.farmerId,
      version: input.version,
      declined: input.declined ?? false,
      method: input.method,
      language: input.language,
      agentId: input.agentId,
      gpsLatitude: input.gpsLatitude ?? null,
      gpsLongitude: input.gpsLongitude ?? null,
      gpsAccuracyM: input.gpsAccuracyM ?? null,
      itemsAgreed: JSON.stringify(input.itemsAgreed),
      mpesaAuthorized: input.mpesaAuthorized ?? false,
      createdAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "consent",
      entityId: consentId,
      mutationType: "CREATE",
      payload: {
        consentLocalUuid: consentId,
        farmerLocalUuid: input.farmerId,
        ...input,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { consentId, operationUuid };
}

export async function getConsentByFarmer(db: AppDatabase, farmerId: string): Promise<typeof consents.$inferSelect | null> {
  const rows = await db.select().from(consents).where(eq(consents.farmerId, farmerId)).limit(1);
  return rows[0] ?? null;
}
