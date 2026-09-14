import type { AppDatabase } from "@/lib/db/database";
import { getEvidenceByEnterprise } from "@/features/evidence/evidenceRepository";
import { getEnterprisesByFarmer } from "@/features/enterprises/enterpriseRepository";
import { getProductionObservationsByEnterprise } from "@/features/production/productionRepository";
import { getSectorMeta } from "@/features/sectors/catalog";
import type { enterprises } from "@/lib/db/schema";

export type IncompleteEnterprise = {
  enterprise: typeof enterprises.$inferSelect;
  missing: string[];
};

export async function getIncompleteEnterprises(db: AppDatabase, farmerId: string): Promise<IncompleteEnterprise[]> {
  const rows = await getEnterprisesByFarmer(db, farmerId);
  const incomplete: IncompleteEnterprise[] = [];

  for (const enterprise of rows) {
    const missing = await getEnterpriseGaps(db, enterprise);
    if (missing.length) {
      incomplete.push({ enterprise, missing });
    }
  }

  return incomplete;
}

export async function getNextIncompleteEnterprise(
  db: AppDatabase,
  farmerId: string,
  afterEnterpriseId?: string,
): Promise<IncompleteEnterprise | null> {
  const incomplete = await getIncompleteEnterprises(db, farmerId);
  if (!incomplete.length) {
    return null;
  }

  if (!afterEnterpriseId) {
    return incomplete[0] ?? null;
  }

  const index = incomplete.findIndex((item) => item.enterprise.id === afterEnterpriseId);
  if (index < 0) {
    return incomplete[0] ?? null;
  }

  return incomplete[index + 1] ?? null;
}

export async function getEnterpriseGaps(db: AppDatabase, enterprise: typeof enterprises.$inferSelect): Promise<string[]> {
  const [observations, evidenceRows] = await Promise.all([
    getProductionObservationsByEnterprise(db, enterprise.id),
    getEvidenceByEnterprise(db, enterprise.id),
  ]);
  const sections = new Set(observations.map((row) => row.section));
  const categories = new Set(evidenceRows.map((row) => row.category));
  const requiredEvidence = getSectorMeta(enterprise.sector).evidenceCategories;
  const missing: string[] = [];

  if (![...sections].some((section) => section !== "financial")) {
    missing.push("production");
  }
  if (!sections.has("financial")) {
    missing.push("financial");
  }
  for (const category of requiredEvidence) {
    if (!categories.has(category)) {
      missing.push(`evidence:${category}`);
    }
  }

  return missing;
}
