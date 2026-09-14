import { compareSemver, isVersionSupported } from "./semver";

describe("semver compare", () => {
  test("orders versions", () => {
    expect(compareSemver("0.1.0", "1.0.0")).toBeLessThan(0);
    expect(compareSemver("1.2.3", "1.2.3")).toBe(0);
    expect(isVersionSupported("0.1.0", "0.1.0")).toBe(true);
    expect(isVersionSupported("0.1.0", "0.2.0")).toBe(false);
  });
});
