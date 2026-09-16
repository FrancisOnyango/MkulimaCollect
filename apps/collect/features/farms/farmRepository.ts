import * as Crypto from "expo-crypto";
import { desc, eq, inArray, sql } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { farmGeometries, farmGeometryPoints, farms } from "@/lib/db/schema";
import { enqueueOutboxEntry } from "@/features/sync/SyncOutbox";

export type CreateFarmInput = {
  farmerId: string;
  name?: string;
  tenure?: string;
  sizeReportedAcres?: number;
  sizeReportedSource?: string;
  irrigation?: boolean;
  county?: string;
  subCounty?: string;
  ward?: string;
  village?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracyM?: number;
  dependsOn?: string[];
};

export async function createFarm(db: AppDatabase, input: CreateFarmInput): Promise<{ farmId: string; operationUuid: string }> {
  const farmId = Crypto.randomUUID();
  const now = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(farms).values({
      id: farmId,
      farmerId: input.farmerId,
      name: input.name ?? null,
      tenure: input.tenure ?? null,
      sizeReportedAcres: input.sizeReportedAcres ?? null,
      sizeReportedSource: input.sizeReportedSource ?? null,
      sizeGpsAcres: null,
      irrigation: input.irrigation ?? null,
      county: input.county ?? null,
      subCounty: input.subCounty ?? null,
      ward: input.ward ?? null,
      village: input.village ?? null,
      gpsLatitude: input.gpsLatitude ?? null,
      gpsLongitude: input.gpsLongitude ?? null,
      gpsAccuracyM: input.gpsAccuracyM ?? null,
      localVersion: 1,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
    });

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "farm",
      entityId: farmId,
      mutationType: "CREATE",
      payload: {
        farmLocalUuid: farmId,
        farmerLocalUuid: input.farmerId,
        ...input,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { farmId, operationUuid };
}

export type SaveGeometryInput = {
  farmId: string;
  polygonGeojson: string;
  calculationMethod: string;
  pointCount: number;
  distanceM?: number;
  accuracyMeters?: number;
  areaCalculatedAcres: number;
  agentId: string;
  points?: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracyM?: number | null;
    capturedAt: string;
  }[];
  dependsOn?: string[];
};

export async function saveGeometry(db: AppDatabase, input: SaveGeometryInput): Promise<{ geometryId: string; operationUuid: string }> {
  const geometryId = Crypto.randomUUID();
  const capturedAt = new Date().toISOString();
  let operationUuid = "";

  await db.transaction(async (tx) => {
    await tx.insert(farmGeometries).values({
      id: geometryId,
      farmId: input.farmId,
      polygonGeojson: input.polygonGeojson,
      calculationMethod: input.calculationMethod,
      pointCount: input.pointCount,
      distanceM: input.distanceM ?? null,
      accuracyMeters: input.accuracyMeters ?? null,
      areaCalculatedAcres: input.areaCalculatedAcres,
      capturedAt,
      agentId: input.agentId,
      syncedAt: null,
    });

    if (input.points?.length) {
      await tx.insert(farmGeometryPoints).values(
        input.points.map((point, index) => ({
          id: Crypto.randomUUID(),
          geometryId,
          farmId: input.farmId,
          sequence: index + 1,
          latitude: point.latitude,
          longitude: point.longitude,
          altitude: point.altitude ?? null,
          accuracyM: point.accuracyM ?? null,
          capturedAt: point.capturedAt,
        })),
      );
    }

    await tx
      .update(farms)
      .set({
        sizeGpsAcres: input.areaCalculatedAcres,
        localVersion: sql`${farms.localVersion} + 1`,
        updatedAt: capturedAt,
      })
      .where(eq(farms.id, input.farmId));

    operationUuid = await enqueueOutboxEntry(tx, {
      entityType: "farm_geometry",
      entityId: geometryId,
      mutationType: "CREATE",
      payload: {
        geometryLocalUuid: geometryId,
        ...input,
        points: input.points ?? [],
        capturedAt,
      },
      dependsOn: input.dependsOn ?? [],
    });
  });

  return { geometryId, operationUuid };
}

export async function getGeometryPointsByGeometry(db: AppDatabase, geometryId: string): Promise<(typeof farmGeometryPoints.$inferSelect)[]> {
  return db.select().from(farmGeometryPoints).where(eq(farmGeometryPoints.geometryId, geometryId));
}

export async function getFarmsByFarmer(db: AppDatabase, farmerId: string): Promise<(typeof farms.$inferSelect)[]> {
  return db.select().from(farms).where(eq(farms.farmerId, farmerId));
}

export async function getFarmById(db: AppDatabase, farmId: string): Promise<typeof farms.$inferSelect | null> {
  const rows = await db.select().from(farms).where(eq(farms.id, farmId)).limit(1);
  return rows[0] ?? null;
}

export async function getGeometriesByFarm(db: AppDatabase, farmId: string): Promise<(typeof farmGeometries.$inferSelect)[]> {
  return db.select().from(farmGeometries).where(eq(farmGeometries.farmId, farmId)).orderBy(desc(farmGeometries.capturedAt));
}

export async function getGeometriesByFarmer(db: AppDatabase, farmerId: string): Promise<(typeof farmGeometries.$inferSelect)[]> {
  const farmRows = await getFarmsByFarmer(db, farmerId);
  const farmIds = farmRows.map((farm) => farm.id);
  if (!farmIds.length) {
    return [];
  }

  return db.select().from(farmGeometries).where(inArray(farmGeometries.farmId, farmIds)).orderBy(desc(farmGeometries.capturedAt));
}
