import * as Crypto from "expo-crypto";
import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { serverMappings } from "@/lib/db/schema";
import type { EntityType } from "./types";

export async function saveMapping(
  db: AppDatabase,
  input: {
    localUuid: string;
    entityType: EntityType;
    serverId: string;
    operationUuid?: string;
  },
): Promise<void> {
  await db.insert(serverMappings).values({
    id: Crypto.randomUUID(),
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
