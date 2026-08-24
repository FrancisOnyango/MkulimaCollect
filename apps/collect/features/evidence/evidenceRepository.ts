import * as Crypto from "expo-crypto";
import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { evidence, localFiles } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type CreateEvidenceInput = {
  farmerId: string;
  farmId?: string;
  enterpriseId?: string;
  category: string;
  localUri: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256: string;
  filename?: string;
  source?: "CAMERA" | "PICKER" | "MANUAL";
  dependsOn?: string[];
};

export async function createEvidence(db: AppDatabase, input: CreateEvidenceInput): Promise<{ evidenceId: string; operationUuid: string }> {
  const evidenceId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(evidence).values({
      id: evidenceId,
      farmerId: input.farmerId,
      farmId: input.farmId ?? null,
      enterpriseId: input.enterpriseId ?? null,
      category: input.category,
      localUri: input.localUri,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      sha256: input.sha256,
      syncStatus: "LOCAL",
      verificationStatus: "UNVERIFIED",
      serverRef: null,
      createdAt: now,
      syncedAt: null,
    });

    await tx.insert(localFiles).values({
      id: Crypto.randomUUID(),
      evidenceId,
      localUri: input.localUri,
      filename: input.filename ?? null,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      sha256: input.sha256,
      source: input.source ?? "MANUAL",
      createdAt: now,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "evidence",
      entityId: evidenceId,
      mutationType: "CREATE",
      payload: {
        evidenceLocalUuid: evidenceId,
        ...input,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { evidenceId, operationUuid };
}

export async function getEvidenceByFarmer(db: AppDatabase, farmerId: string): Promise<(typeof evidence.$inferSelect)[]> {
  return db.select().from(evidence).where(eq(evidence.farmerId, farmerId));
}

export async function getEvidenceByEnterprise(db: AppDatabase, enterpriseId: string): Promise<(typeof evidence.$inferSelect)[]> {
  return db.select().from(evidence).where(eq(evidence.enterpriseId, enterpriseId));
}

export async function getEvidenceById(db: AppDatabase, evidenceId: string): Promise<typeof evidence.$inferSelect | null> {
  const rows = await db.select().from(evidence).where(eq(evidence.id, evidenceId)).limit(1);
  return rows[0] ?? null;
}

export async function getLocalFilesByEvidence(db: AppDatabase, evidenceId: string): Promise<(typeof localFiles.$inferSelect)[]> {
  return db.select().from(localFiles).where(eq(localFiles.evidenceId, evidenceId));
}
