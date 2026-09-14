import * as Crypto from "expo-crypto";
import { desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { conflicts } from "@/lib/db/schema";

export type ConflictRecord = typeof conflicts.$inferSelect;

export async function saveConflict(
  db: AppDatabase,
  input: {
    entityType: string;
    entityId: string;
    localPayload: Record<string, unknown> | string;
    remotePayload: Record<string, unknown> | string;
    operationUuid?: string;
    code?: string;
  },
): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(conflicts).values({
    id,
    entityType: input.entityType,
    entityId: input.entityId,
    localPayload: typeof input.localPayload === "string" ? input.localPayload : JSON.stringify(input.localPayload),
    remotePayload: typeof input.remotePayload === "string" ? input.remotePayload : JSON.stringify(input.remotePayload),
    operationUuid: input.operationUuid ?? null,
    code: input.code ?? null,
    status: "OPEN",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  });
  return id;
}

export async function getOpenConflicts(db: AppDatabase): Promise<ConflictRecord[]> {
  return db.select().from(conflicts).where(eq(conflicts.status, "OPEN")).orderBy(desc(conflicts.createdAt));
}

export async function resolveConflict(db: AppDatabase, conflictId: string, resolution: "KEEP_LOCAL" | "ACCEPT_REMOTE"): Promise<void> {
  await db
    .update(conflicts)
    .set({
      status: resolution,
      resolvedAt: new Date().toISOString(),
    })
    .where(eq(conflicts.id, conflictId));
}
