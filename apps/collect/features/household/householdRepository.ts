import * as Crypto from "expo-crypto";
import { desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { householdMembers } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export const householdRoles = ["farmer", "spouse", "dependant", "worker", "other"] as const;
export type HouseholdRole = (typeof householdRoles)[number];

export type CreateHouseholdMemberInput = {
  farmerId: string;
  fullName: string;
  role: HouseholdRole;
  labourContribution?: string;
  dependsOn?: string[];
};

export async function createHouseholdMember(db: AppDatabase, input: CreateHouseholdMemberInput): Promise<{ memberId: string; operationUuid: string }> {
  const memberId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(householdMembers).values({
      id: memberId,
      farmerId: input.farmerId,
      fullName: input.fullName,
      role: input.role,
      labourContribution: input.labourContribution ?? null,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "household_member",
      entityId: memberId,
      mutationType: "CREATE",
      payload: {
        memberLocalUuid: memberId,
        farmerLocalUuid: input.farmerId,
        fullName: input.fullName,
        role: input.role,
        labourContribution: input.labourContribution ?? null,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { memberId, operationUuid };
}

export async function getHouseholdMembersByFarmer(db: AppDatabase, farmerId: string) {
  return db.select().from(householdMembers).where(eq(householdMembers.farmerId, farmerId)).orderBy(desc(householdMembers.createdAt));
}
