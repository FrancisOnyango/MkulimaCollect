import { eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { affiliations, consents, enterprises, evidence, farmerIdentities, farmers, farmGeometries, farms, productionObservations } from "@/lib/db/schema";
import { getSectorMeta } from "@/features/sectors/catalog";

export type CompletenessResult = {
  percent: number;
  missing: string[];
};

export async function calculateCompleteness(db: AppDatabase, farmerId: string): Promise<number> {
  const result = await calculateCompletenessDetails(db, farmerId);
  return result.percent;
}

export async function calculateCompletenessDetails(db: AppDatabase, farmerId: string): Promise<CompletenessResult> {
  const [farmer] = await db.select().from(farmers).where(eq(farmers.id, farmerId)).limit(1);

  if (!farmer) {
    return { percent: 0, missing: ["Farmer draft not found"] };
  }

  const [identity] = await db.select().from(farmerIdentities).where(eq(farmerIdentities.farmerId, farmerId)).limit(1);
  const [consent] = await db.select().from(consents).where(eq(consents.farmerId, farmerId)).limit(1);
  const [affiliation] = await db.select().from(affiliations).where(eq(affiliations.farmerId, farmerId)).limit(1);
  const farmRows = await db.select().from(farms).where(eq(farms.farmerId, farmerId));
  const enterpriseRows = await db.select().from(enterprises).where(eq(enterprises.farmerId, farmerId));
  const farmIds = farmRows.map((farm) => farm.id);
  const enterpriseIds = enterpriseRows.map((enterprise) => enterprise.id);
  const geometries = farmIds.length > 0 ? await db.select().from(farmGeometries).where(inArray(farmGeometries.farmId, farmIds)) : [];
  const evidenceRows = enterpriseIds.length > 0 ? await db.select().from(evidence).where(inArray(evidence.enterpriseId, enterpriseIds)) : [];
  const observations = enterpriseIds.length > 0
    ? await db.select().from(productionObservations).where(inArray(productionObservations.enterpriseId, enterpriseIds))
    : [];

  let score = 0;
  const missing: string[] = [];

  if (identity?.fullLegalName || identity?.firstName) {
    score += 10;
  } else {
    missing.push("Identity");
  }

  if (consent && !consent.declined) {
    score += 10;
  } else {
    missing.push("Consent");
  }

  if (affiliation) {
    score += 10;
  } else {
    missing.push("Membership");
  }

  if (!farmRows.length) {
    missing.push("Farm");
  } else {
    const completeFarms = farmRows.filter((farm) => {
      const geometry = geometries.find((row) => row.farmId === farm.id && row.pointCount >= 3);
      const hasPin = typeof farm.gpsLatitude === "number" && typeof farm.gpsLongitude === "number";
      if (!hasPin) {
        missing.push(`Farm "${farm.name ?? farm.id}" GPS pin`);
      }
      if (!geometry) {
        missing.push(`Farm "${farm.name ?? farm.id}" boundary`);
      }
      return Boolean(hasPin && geometry);
    }).length;
    score += Math.round((30 * completeFarms) / farmRows.length);
  }

  if (!enterpriseRows.length) {
    missing.push("Enterprise");
  } else {
    const completeEnterprises = enterpriseRows.filter((enterprise) => {
      const farm = farmRows.find((row) => row.id === enterprise.farmId);
      const label = `${getSectorMeta(enterprise.sector).label} on ${farm?.name ?? "farm"}`;
      const enterpriseObservations = observations.filter((row) => row.enterpriseId === enterprise.id);
      const sections = new Set(enterpriseObservations.map((row) => row.section));
      const categories = new Set(evidenceRows.filter((row) => row.enterpriseId === enterprise.id).map((row) => row.category));
      const required = getSectorMeta(enterprise.sector).evidenceCategories;
      let complete = true;

      if (![...sections].some((section) => section !== "financial")) {
        missing.push(`${label} production`);
        complete = false;
      }
      if (!sections.has("financial")) {
        missing.push(`${label} financial`);
        complete = false;
      }
      for (const category of required) {
        if (!categories.has(category)) {
          missing.push(`${label} evidence: ${category}`);
          complete = false;
        }
      }

      return complete;
    }).length;
    score += Math.round((40 * completeEnterprises) / enterpriseRows.length);
  }

  return { percent: Math.min(100, score), missing };
}
