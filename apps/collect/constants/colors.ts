export const Colors = {
  brand: "#54C529",
  brandInk: "#FFFFFF",
  brandDark: "#3FA31C",
  brandMid: "#84D777",
  brandLight: "#E7F8E1",
  brandMuted: "#F3F9F1",
  surface: "#F4F7F3",
  card: "#FFFFFF",
  ink: "#0D1B10",
  charcoal: "#0D1B10",
  charcoal700: "#2A3B2E",
  charcoal500: "#5B6E5E",
  charcoal300: "#ABC1AB",
  charcoal100: "#E2E4E3",
  charcoal50: "#F0F3F0",
  amberField: "#B45309",
  amberBg: "#FEF3C7",
  redField: "#B91C1C",
  redBg: "#FEE2E2",
} as const;

export type ColorKey = keyof typeof Colors;
