import * as Crypto from "expo-crypto";
import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { plots } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export const plotUnitTypes = [
  "open_field",
  "greenhouse",
  "orchard_block",
  "livestock_house",
  "pond",
  "cage",
  "tank",
  "apiary",
] as const;

export type PlotUnitType = (typeof plotUnitTypes)[number];

export type CreatePlotInput = {
  farmerId: string;
  farmId: string;
  name: string;
  unitType: PlotUnitType;
  areaHa?: number;
  notes?: string;
  dependsOn?: string[];
};

export async function createPlot(db: AppDatabase, input: CreatePlotInput): Promise<{ plotId: string; operationUuid: string }> {
  const plotId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(plots).values({
      id: plotId,
      farmerId: input.farmerId,
      farmId: input.farmId,
      name: input.name,
      unitType: input.unitType,
      areaHa: input.areaHa ?? null,
      notes: input.notes ?? null,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "plot",
      entityId: plotId,
      mutationType: "CREATE",
      payload: {
        plotLocalUuid: plotId,
        farmerLocalUuid: input.farmerId,
        farmLocalUuid: input.farmId,
        name: input.name,
        unitType: input.unitType,
        areaHa: input.areaHa ?? null,
        notes: input.notes ?? null,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { plotId, operationUuid };
}

export async function getPlotsByFarm(db: AppDatabase, farmId: string) {
  return db.select().from(plots).where(eq(plots.farmId, farmId));
}

export async function getPlotsByFarmer(db: AppDatabase, farmerId: string) {
  return db.select().from(plots).where(eq(plots.farmerId, farmerId));
}

export async function getPlotById(db: AppDatabase, plotId: string) {
  const rows = await db.select().from(plots).where(eq(plots.id, plotId)).limit(1);
  return rows[0] ?? null;
}
