import { and, desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { auditEvents } from "@/lib/db/schema";

export async function getAuditEventsForEntity(db: AppDatabase, entityType: string, entityId: string): Promise<(typeof auditEvents.$inferSelect)[]> {
  return db
    .select()
    .from(auditEvents)
    .where(and(eq(auditEvents.entityType, entityType), eq(auditEvents.entityId, entityId)))
    .orderBy(desc(auditEvents.createdAt));
}
