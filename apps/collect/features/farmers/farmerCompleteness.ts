import { eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { affiliations, consents, enterprises, evidence, farmerIdentities, farmers, farms, productionObservations } from "@/lib/db/schema";

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
  const evidenceRows = await db.select().from(evidence).where(eq(evidence.farmerId, farmerId));
  const enterpriseIds = enterpriseRows.map((enterprise) => enterprise.id);
  const observations = enterpriseIds.length > 0
    ? await db.select().from(productionObservations).where(inArray(productionObservations.enterpriseId, enterpriseIds))
    : [];
  let score = 0;
  const missing: string[] = [];

  if (identity?.fullLegalName || identity?.firstName) {
    score += 15;
  } else {
    missing.push("Identity");
  }

  if (consent && !consent.declined) {
    score += 20;
  } else {
    missing.push("Consent");
  }

  if (affiliation) {
    score += 15;
  } else {
    missing.push("Membership");
  }

  if (farmRows.length > 0) {
    score += 20;
  } else {
    missing.push("Farm");
  }

  if (enterpriseRows.length > 0) {
    score += 10;
  } else {
    missing.push("Enterprise");
  }

  if (observations.length > 0) {
    score += 15;
  } else {
    missing.push("Production");
  }

  if (evidenceRows.length > 0) {
    score += 5;
  } else {
    missing.push("Evidence");
  }

  return { percent: Math.min(100, score), missing };
}
