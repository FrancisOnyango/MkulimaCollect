import { acresDiverge, assertGpsAccuracy, isGpsAccurate, MAX_GPS_ACCURACY_M } from "./gpsAccuracy";

describe("gps accuracy gate", () => {
  test("accepts 15 m or better", () => {
    expect(isGpsAccurate(8)).toBe(true);
    expect(isGpsAccurate(MAX_GPS_ACCURACY_M)).toBe(true);
    expect(isGpsAccurate(16)).toBe(false);
    expect(isGpsAccurate(null)).toBe(false);
  });

  test("throws when accuracy is too weak", () => {
    expect(() => assertGpsAccuracy(40)).toThrow(/15 m or better/);
  });

  test("detects acre divergence", () => {
    expect(acresDiverge(2, 8)).toBe(true);
    expect(acresDiverge(2, 2.1)).toBe(false);
    expect(acresDiverge(null, 2)).toBe(false);
  });
});
