import * as Crypto from "expo-crypto";
import { and, desc, eq } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/database";
import { collectionSessions } from "@/lib/db/schema";

export type CollectionStep =
  | "consent"
  | "identity"
  | "household"
  | "membership"
  | "farm"
  | "plot"
  | "boundary"
  | "holdings"
  | "enterprise"
  | "cycle"
  | "sector"
  | "financial"
  | "evidence-review"
  | "review";

export type CollectionSessionState = {
  pendingEnterpriseIds?: string[];
  currentEnterpriseId?: string;
  currentSector?: string;
  currentPlotId?: string;
  currentCycleId?: string;
  visitId?: string;
  visitPurpose?: string;
  route?: string;
};

export async function upsertCollectionSession(
  db: AppDatabase,
  input: {
    farmerId: string;
    farmId?: string | null;
    plotId?: string | null;
    visitId?: string | null;
    currentStep: CollectionStep;
    stepStates?: CollectionSessionState;
  },
): Promise<string> {
  const now = new Date().toISOString();
  const existing = await getActiveSessionForFarmer(db, input.farmerId);
  const stepStates = JSON.stringify(input.stepStates ?? parseStates(existing?.stepStates));

  if (existing) {
    await db
      .update(collectionSessions)
      .set({
        farmId: input.farmId ?? existing.farmId,
        plotId: input.plotId ?? existing.plotId,
        visitId: input.visitId ?? existing.visitId,
        currentStep: input.currentStep,
        stepStates,
        status: "LOCAL_DRAFT",
        updatedAt: now,
      })
      .where(eq(collectionSessions.id, existing.id));
    return existing.id;
  }

  const id = Crypto.randomUUID();
  await db.insert(collectionSessions).values({
    id,
    farmerId: input.farmerId,
    farmId: input.farmId ?? null,
    plotId: input.plotId ?? null,
    visitId: input.visitId ?? null,
    currentStep: input.currentStep,
    stepStates,
    status: "LOCAL_DRAFT",
    updatedAt: now,
  });
  return id;
}

export async function getActiveSession(db: AppDatabase): Promise<typeof collectionSessions.$inferSelect | null> {
  const rows = await db
    .select()
    .from(collectionSessions)
    .where(eq(collectionSessions.status, "LOCAL_DRAFT"))
    .orderBy(desc(collectionSessions.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getActiveSessionForFarmer(db: AppDatabase, farmerId: string): Promise<typeof collectionSessions.$inferSelect | null> {
  const rows = await db
    .select()
    .from(collectionSessions)
    .where(and(eq(collectionSessions.farmerId, farmerId), eq(collectionSessions.status, "LOCAL_DRAFT")))
    .orderBy(desc(collectionSessions.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function completeCollectionSession(db: AppDatabase, farmerId: string): Promise<void> {
  await db
    .update(collectionSessions)
    .set({ status: "SUBMITTED", currentStep: "review", updatedAt: new Date().toISOString() })
    .where(and(eq(collectionSessions.farmerId, farmerId), eq(collectionSessions.status, "LOCAL_DRAFT")));
}

export function parseSessionStates(raw: string | null | undefined): CollectionSessionState {
  return parseStates(raw);
}

export function resumePathForSession(session: typeof collectionSessions.$inferSelect): { pathname: string; params: Record<string, string> } {
  const farmerId = session.farmerId ?? "";
  const farmId = session.farmId ?? "";
  const plotId = session.plotId ?? "";
  const states = parseStates(session.stepStates);
  const params: Record<string, string> = {};

  if (farmerId) {
    params.farmerId = farmerId;
  }
  if (farmId) {
    params.farmId = farmId;
  }
  if (plotId) {
    params.plotId = plotId;
  }
  if (states.currentEnterpriseId) {
    params.enterpriseId = states.currentEnterpriseId;
  }
  if (states.currentSector) {
    params.sector = states.currentSector;
  }

  switch (session.currentStep) {
    case "identity":
      return { pathname: "/collect/identity", params };
    case "household":
      return { pathname: "/collect/household", params };
    case "membership":
      return { pathname: "/collect/membership", params };
    case "farm":
      return { pathname: "/collect/farm", params };
    case "plot":
      return { pathname: "/collect/plot", params };
    case "cycle":
      return { pathname: "/collect/cycle", params };
    case "boundary":
      return farmId ? { pathname: "/farms/[farmId]/boundary", params: { ...params, farmId } } : { pathname: "/collect/holdings", params };
    case "enterprise":
      return { pathname: "/collect/enterprise", params };
    case "sector":
      return states.currentSector
        ? { pathname: "/collect/[sector]", params: { ...params, sector: states.currentSector } }
        : { pathname: "/collect/holdings", params };
    case "financial":
      return { pathname: "/collect/financial", params };
    case "evidence-review":
      return { pathname: "/collect/evidence-review", params };
    case "review":
      return { pathname: "/collect/review", params };
    case "holdings":
    default:
      return { pathname: farmerId ? "/collect/holdings" : "/collect/consent", params };
  }
}

function parseStates(raw: string | null | undefined): CollectionSessionState {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as CollectionSessionState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
