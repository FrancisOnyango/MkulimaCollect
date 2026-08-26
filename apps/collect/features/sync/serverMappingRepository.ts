import * as Crypto from "expo-crypto";
import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { serverMappings } from "@/lib/db/schema";
import type { EntityType } from "./types";
import * as Sentry from "@sentry/react";
import { recordMetric } from "@/lib/metrics";

export async function saveMapping(
  db: AppDatabase,
  input: {
    localUuid: string;
    entityType: EntityType;
    serverId: string;
    operationUuid?: string;
  },
): Promise<void> {
  const id = Crypto.randomUUID();
  Sentry.addBreadcrumb({ category: 'sync', message: `save-mapping ${id}`, data: { localUuid: input.localUuid, entityType: input.entityType, serverId: input.serverId } });
  recordMetric('mapping.save', 1, { entity: input.entityType });

  await db.insert(serverMappings).values({
    id,
    localUuid: input.localUuid,
    entityType: input.entityType,
    serverId: input.serverId,
    operationUuid: input.operationUuid ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function getServerId(db: AppDatabase, localUuid: string, entityType: EntityType): Promise<string | null> {
  const rows = await db
    .select({ serverId: serverMappings.serverId })
    .from(serverMappings)
    .where(and(eq(serverMappings.localUuid, localUuid), eq(serverMappings.entityType, entityType)))
    .limit(1);

  return rows[0]?.serverId ?? null;
}
