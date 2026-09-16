import * as Crypto from "expo-crypto";
import { desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { visits } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export const visitPurposes = [
  "full_assessment",
  "update",
  "verification",
  "cycle_follow_up",
  "harvest_sale",
  "outcome",
  "correction",
] as const;

export type VisitPurpose = (typeof visitPurposes)[number];

export const visitOutcomes = ["completed", "partial", "rescheduled", "refused", "not_found", "ineligible"] as const;
export type VisitOutcome = (typeof visitOutcomes)[number];

export type StartVisitInput = {
  farmerId?: string;
  agentId: string;
  purpose: VisitPurpose;
  respondentRole?: string;
  interviewLanguage?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracyM?: number;
  notes?: string;
  dependsOn?: string[];
};

export async function startVisit(db: AppDatabase, input: StartVisitInput): Promise<{ visitId: string; operationUuid: string }> {
  const visitId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(visits).values({
      id: visitId,
      farmerId: input.farmerId ?? null,
      agentId: input.agentId,
      purpose: input.purpose,
      respondentRole: input.respondentRole ?? null,
      interviewLanguage: input.interviewLanguage ?? "en",
      outcome: "partial",
      startedAt: now,
      endedAt: null,
      nextVisitAt: null,
      gpsLatitude: input.gpsLatitude ?? null,
      gpsLongitude: input.gpsLongitude ?? null,
      gpsAccuracyM: input.gpsAccuracyM ?? null,
      notes: input.notes ?? null,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "visit",
      entityId: visitId,
      mutationType: "CREATE",
      payload: {
        visitLocalUuid: visitId,
        farmerLocalUuid: input.farmerId ?? null,
        purpose: input.purpose,
        respondentRole: input.respondentRole ?? null,
        startedAt: now,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { visitId, operationUuid };
}

export async function completeVisit(
  db: AppDatabase,
  visitId: string,
  outcome: VisitOutcome,
  nextVisitAt?: string,
): Promise<void> {
  await db
    .update(visits)
    .set({
      outcome,
      endedAt: new Date().toISOString(),
      nextVisitAt: nextVisitAt ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(visits.id, visitId));
}

export async function getVisitsForAgent(db: AppDatabase, agentId: string) {
  return db.select().from(visits).where(eq(visits.agentId, agentId)).orderBy(desc(visits.startedAt));
}
