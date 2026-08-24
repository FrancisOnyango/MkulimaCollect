export const Colors = {
  brand: "#1A5C35",
  brandDark: "#0F3D22",
  brandMid: "#246B40",
  brandLight: "#E8F4EC",
  brandMuted: "#F4F8F5",
  surface: "#FAFAFA",
  charcoal: "#1C1C1E",
  charcoal700: "#3A3A3C",
  charcoal500: "#636366",
  charcoal300: "#AEAEB2",
  charcoal100: "#E5E5EA",
  charcoal50: "#F2F2F7",
  amberField: "#B45309",
  amberBg: "#FEF3C7",
  redField: "#B91C1C",
  redBg: "#FEE2E2",
} as const;

export type ColorKey = keyof typeof Colors;
