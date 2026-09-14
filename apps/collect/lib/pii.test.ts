import { hashIdentifier, lastDigits } from "./pii";

describe("pii hashing", () => {
  test("does not store the raw identifier", () => {
    const hash = hashIdentifier("12345678", "national-id", "test-pepper");
    expect(hash).not.toContain("12345678");
    expect(hash).toHaveLength(64);
    expect(lastDigits("12345678", 3)).toBe("678");
  });

  test("is stable for the same input", () => {
    expect(hashIdentifier("07 12 345678", "phone", "pepper")).toBe(hashIdentifier("0712345678", "phone", "pepper"));
  });
});
