import * as Crypto from "expo-crypto";
import { desc, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { affiliations } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type SaveAffiliationInput = {
  farmerId: string;
  organizationName: string;
  institutionType: string;
  memberNumber?: string;
  branch?: string;
  membershipStart?: string;
  active?: boolean;
  collectionCentre?: string;
  dependsOn?: string[];
};

export async function saveAffiliation(db: AppDatabase, input: SaveAffiliationInput): Promise<{ affiliationId: string; operationUuid: string }> {
  const now = new Date().toISOString();
  const existing = await getPrimaryAffiliationByFarmer(db, input.farmerId);
  const affiliationId = existing?.id ?? Crypto.randomUUID();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(affiliations)
        .set({
          organizationName: input.organizationName,
          institutionType: input.institutionType,
          memberNumber: input.memberNumber ?? null,
          branch: input.branch ?? null,
          membershipStart: input.membershipStart ?? null,
          active: input.active ?? true,
          collectionCentre: input.collectionCentre ?? null,
          localVersion: sql`${affiliations.localVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(affiliations.id, affiliationId));
    } else {
      await tx.insert(affiliations).values({
        id: affiliationId,
        farmerId: input.farmerId,
        organizationName: input.organizationName,
        institutionType: input.institutionType,
        memberNumber: input.memberNumber ?? null,
        branch: input.branch ?? null,
        membershipStart: input.membershipStart ?? null,
        active: input.active ?? true,
        collectionCentre: input.collectionCentre ?? null,
        localVersion: 1,
        createdAt: now,
        updatedAt: now,
        syncedAt: null,
      });
    }

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "affiliation",
      entityId: affiliationId,
      mutationType: existing ? "UPDATE" : "CREATE",
      payload: {
        affiliationLocalUuid: affiliationId,
        ...input,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { affiliationId, operationUuid };
}

export async function getAffiliationsByFarmer(db: AppDatabase, farmerId: string): Promise<(typeof affiliations.$inferSelect)[]> {
  return db.select().from(affiliations).where(eq(affiliations.farmerId, farmerId)).orderBy(desc(affiliations.updatedAt));
}

export async function getPrimaryAffiliationByFarmer(db: AppDatabase, farmerId: string): Promise<typeof affiliations.$inferSelect | null> {
  const rows = await db.select().from(affiliations).where(eq(affiliations.farmerId, farmerId)).orderBy(desc(affiliations.updatedAt)).limit(1);
  return rows[0] ?? null;
}
