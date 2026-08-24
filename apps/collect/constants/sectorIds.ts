export const SectorId = {
  DAIRY: "dairy",
  MAIZE: "maize",
  TEA: "tea",
  COFFEE: "coffee",
  AVOCADO: "avocado",
  RICE: "rice",
  IRISH_POTATO: "irish-potato",
  POULTRY: "poultry",
  TOMATO: "tomato",
  MACADAMIA: "macadamia",
  AQUACULTURE: "aquaculture",
  LIVESTOCK_MEAT: "livestock-meat",
  BEANS: "beans",
  HORTICULTURE: "horticulture",
} as const;

export type SectorIdValue = (typeof SectorId)[keyof typeof SectorId];
