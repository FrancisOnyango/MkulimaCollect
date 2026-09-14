import * as Crypto from "expo-crypto";
import { eq } from "drizzle-orm";
import type { AgentProfile } from "@/lib/api/types";
import type { AppDatabase } from "@/lib/db/database";
import { localAgent } from "@/lib/db/schema";

export async function saveLocalAgent(db: AppDatabase, agent: AgentProfile): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.select().from(localAgent).limit(1);

  if (existing[0]) {
    await db
      .update(localAgent)
      .set({
        agentId: agent.id,
        orgId: agent.orgId,
        orgName: agent.orgName,
        clusterName: agent.clusterName,
        authMode: "password",
        updatedAt: now,
      })
      .where(eq(localAgent.id, existing[0].id));
    return;
  }

  await db.insert(localAgent).values({
    id: Crypto.randomUUID(),
    agentId: agent.id,
    orgId: agent.orgId,
    orgName: agent.orgName,
    clusterName: agent.clusterName,
    authMode: "password",
    updatedAt: now,
  });
}

export async function getLocalAgent(db: AppDatabase): Promise<typeof localAgent.$inferSelect | null> {
  const rows = await db.select().from(localAgent).limit(1);
  return rows[0] ?? null;
}
