import * as Crypto from "expo-crypto";
import { eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { farmerIdentities } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type SaveIdentityInput = {
  farmerId: string;
  fullLegalName?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  preferredName?: string;
  nationalIdType?: string;
  nationalIdHash?: string;
  nationalIdLast3?: string;
  primaryPhoneHash?: string;
  primaryPhoneLast4?: string;
  preferredLanguage?: string;
  dependsOn?: string[];
};

export async function saveIdentity(db: AppDatabase, input: SaveIdentityInput): Promise<string> {
  const now = new Date().toISOString();
  const existing = await getIdentityByFarmer(db, input.farmerId);
  let operationUuid = "";

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(farmerIdentities)
        .set({
          fullLegalName: input.fullLegalName ?? existing.fullLegalName,
          firstName: input.firstName ?? existing.firstName,
          middleName: input.middleName ?? existing.middleName,
          surname: input.surname ?? existing.surname,
          preferredName: input.preferredName ?? existing.preferredName,
          nationalIdType: input.nationalIdType ?? existing.nationalIdType,
          nationalIdHash: input.nationalIdHash ?? existing.nationalIdHash,
          nationalIdLast3: input.nationalIdLast3 ?? existing.nationalIdLast3,
          primaryPhoneHash: input.primaryPhoneHash ?? existing.primaryPhoneHash,
          primaryPhoneLast4: input.primaryPhoneLast4 ?? existing.primaryPhoneLast4,
          preferredLanguage: input.preferredLanguage ?? existing.preferredLanguage,
          localVersion: sql`${farmerIdentities.localVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(farmerIdentities.id, existing.id));
    } else {
      await tx.insert(farmerIdentities).values({
        id: Crypto.randomUUID(),
        farmerId: input.farmerId,
        fullLegalName: input.fullLegalName ?? null,
        firstName: input.firstName ?? null,
        middleName: input.middleName ?? null,
        surname: input.surname ?? null,
        preferredName: input.preferredName ?? null,
        nationalIdType: input.nationalIdType ?? null,
        nationalIdHash: input.nationalIdHash ?? null,
        nationalIdLast3: input.nationalIdLast3 ?? null,
        primaryPhoneHash: input.primaryPhoneHash ?? null,
        primaryPhoneLast4: input.primaryPhoneLast4 ?? null,
        preferredLanguage: input.preferredLanguage ?? null,
        localVersion: 1,
        updatedAt: now,
        syncedAt: null,
      });
    }

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "farmer_identity",
      entityId: input.farmerId,
      mutationType: existing ? "UPDATE" : "CREATE",
      payload: {
        farmerLocalUuid: input.farmerId,
        ...input,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return operationUuid;
}

export async function getIdentityByFarmer(db: AppDatabase, farmerId: string): Promise<typeof farmerIdentities.$inferSelect | null> {
  const rows = await db.select().from(farmerIdentities).where(eq(farmerIdentities.farmerId, farmerId)).limit(1);
  return rows[0] ?? null;
}
