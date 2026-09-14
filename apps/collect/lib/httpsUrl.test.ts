import { assertHttpsUrl } from "./httpsUrl";

describe("assertHttpsUrl", () => {
  test("accepts https", () => {
    expect(assertHttpsUrl("https://staging-api.mkulimascore.com/")).toBe("https://staging-api.mkulimascore.com");
  });

  test("rejects cleartext remote hosts", () => {
    expect(() => assertHttpsUrl("http://mkulimascore-api.example.com")).toThrow(/HTTPS/);
  });

  test("allows localhost http in development", () => {
    expect(assertHttpsUrl("http://localhost:8000", true)).toBe("http://localhost:8000");
  });
});
