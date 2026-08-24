import * as Crypto from "expo-crypto";
import { and, desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { auditEvents, tasks } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type UpsertTaskInput = {
  id?: string;
  agentId: string;
  farmerId?: string;
  type: string;
  priority?: "LOW" | "NORMAL" | "HIGH";
  status?: "OPEN" | "COMPLETED";
  title: string;
  detail?: string;
  dueDate?: string;
};

export async function upsertTask(db: AppDatabase, input: UpsertTaskInput): Promise<string> {
  const id = input.id ?? Crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(tasks).values({
    id,
    agentId: input.agentId,
    farmerId: input.farmerId ?? null,
    type: input.type,
    priority: input.priority ?? "NORMAL",
    status: input.status ?? "OPEN",
    title: input.title,
    detail: input.detail ?? null,
    dueDate: input.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  }).onConflictDoUpdate({
    target: tasks.id,
    set: {
      farmerId: input.farmerId ?? null,
      type: input.type,
      priority: input.priority ?? "NORMAL",
      status: input.status ?? "OPEN",
      title: input.title,
      detail: input.detail ?? null,
      dueDate: input.dueDate ?? null,
      updatedAt: now,
    },
  });

  return id;
}

export async function completeTask(db: AppDatabase, taskId: string, actorId: string): Promise<string> {
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.update(tasks).set({ status: "COMPLETED", updatedAt: now }).where(eq(tasks.id, taskId));
    await tx.insert(auditEvents).values({
      id: Crypto.randomUUID(),
      entityType: "task",
      entityId: taskId,
      action: "TASK_COMPLETED",
      actorId,
      payload: "{}",
      createdAt: now,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "task",
      entityId: taskId,
      mutationType: "UPDATE",
      payload: {
        taskLocalUuid: taskId,
        status: "COMPLETED",
        updatedAt: now,
      },
    });
  });

  return operationUuid;
}

export async function getTasksForAgent(db: AppDatabase, agentId: string): Promise<(typeof tasks.$inferSelect)[]> {
  return db.select().from(tasks).where(eq(tasks.agentId, agentId)).orderBy(desc(tasks.dueDate), desc(tasks.updatedAt));
}

export async function getOpenTasksForAgent(db: AppDatabase, agentId: string): Promise<(typeof tasks.$inferSelect)[]> {
  return db.select().from(tasks).where(and(eq(tasks.agentId, agentId), eq(tasks.status, "OPEN"))).orderBy(desc(tasks.dueDate), desc(tasks.updatedAt));
}
