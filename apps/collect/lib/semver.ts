export function compareSemver(left: string, right: string): number {
  const a = parseSemver(left);
  const b = parseSemver(right);

  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) {
      return a[index]! - b[index]!;
    }
  }

  return 0;
}

export function isVersionSupported(current: string, minimum: string): boolean {
  return compareSemver(current, minimum) >= 0;
}

function parseSemver(value: string): [number, number, number] {
  const [major, minor, patch] = value.split(".").map((part) => Number.parseInt(part.replace(/\D/g, ""), 10) || 0);
  return [major ?? 0, minor ?? 0, patch ?? 0];
}
