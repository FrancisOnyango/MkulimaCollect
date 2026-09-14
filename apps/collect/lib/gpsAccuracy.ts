export const MAX_GPS_ACCURACY_M = 15;
export const ACRE_DIVERGENCE_RATIO = 2;

export function isGpsAccurate(accuracyM: number | null | undefined): boolean {
  return typeof accuracyM === "number" && Number.isFinite(accuracyM) && accuracyM > 0 && accuracyM <= MAX_GPS_ACCURACY_M;
}

export function assertGpsAccuracy(accuracyM: number | null | undefined): void {
  if (!isGpsAccurate(accuracyM)) {
    throw new Error(`GPS accuracy must be ${MAX_GPS_ACCURACY_M} m or better. Wait and recapture.`);
  }
}

export function acresDiverge(reportedAcres: number | null | undefined, gpsAcres: number): boolean {
  if (typeof reportedAcres !== "number" || !Number.isFinite(reportedAcres) || reportedAcres <= 0 || gpsAcres <= 0) {
    return false;
  }

  const ratio = gpsAcres / reportedAcres;
  return ratio > ACRE_DIVERGENCE_RATIO || ratio < 1 / ACRE_DIVERGENCE_RATIO;
}

export function formatAccuracy(accuracyM: number | null | undefined): string {
  return typeof accuracyM === "number" && Number.isFinite(accuracyM) ? `${Math.round(accuracyM)} m` : "Unknown";
}
