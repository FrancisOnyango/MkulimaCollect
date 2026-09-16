import { SectorId, type SectorIdValue } from "@/constants/sectorIds";
import { handmadeSectorSlugs, valueChains, type ValueChainGroup, type ValueChainStatus } from "./valueChainRegistry";

export type SectorGroupId = ValueChainGroup;

export type SectorMeta = {
  id: SectorIdValue;
  label: string;
  group: SectorGroupId;
  description: string;
  scorePath: string;
  evidenceCategories: string[];
  status: ValueChainStatus;
  code?: string;
};

const evidenceByGroup: Record<SectorGroupId, string[]> = {
  "Annual crops": ["farm-photo", "input-receipt", "harvest-record", "buyer-delivery-note"],
  Horticulture: ["farm-photo", "spray-record", "harvest-record", "buyer-delivery-note"],
  "Perennial crops": ["farm-photo", "factory-delivery-slip", "payment-statement", "input-receipt"],
  Livestock: ["animal-photo", "sales-record", "veterinary-record", "movement-permit"],
  Aquaculture: ["pond-photo", "feed-receipt", "harvest-record", "sales-record"],
};

const handmadeEvidence: Partial<Record<SectorIdValue, string[]>> = {
  [SectorId.DAIRY]: ["animal-photo", "milk-delivery-slip", "payment-statement", "veterinary-record"],
  [SectorId.POULTRY]: ["flock-photo", "feed-receipt", "sales-record", "veterinary-record"],
  [SectorId.TEA]: ["farm-photo", "factory-delivery-slip", "payment-statement", "input-receipt"],
  [SectorId.COFFEE]: ["farm-photo", "factory-delivery-slip", "payment-statement", "certification-record"],
  [SectorId.AVOCADO]: ["farm-photo", "exporter-delivery-note", "payment-statement", "certification-record"],
  [SectorId.MACADAMIA]: ["farm-photo", "processor-delivery-note", "payment-statement", "certification-record"],
  [SectorId.AQUACULTURE]: ["pond-photo", "feed-receipt", "harvest-record", "sales-record"],
  [SectorId.TOMATO]: ["farm-photo", "spray-record", "harvest-record", "buyer-delivery-note"],
  [SectorId.MAIZE]: ["farm-photo", "input-receipt", "harvest-record", "buyer-delivery-note"],
  [SectorId.RICE]: ["farm-photo", "irrigation-record", "harvest-record", "buyer-delivery-note"],
  [SectorId.IRISH_POTATO]: ["farm-photo", "seed-receipt", "harvest-record", "buyer-delivery-note"],
  [SectorId.BEANS]: ["farm-photo", "input-receipt", "harvest-record", "sales-record"],
};

function toCamel(value: string) {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()).replace(/-/g, "");
}

function uniqueEvidence(slug: string, categories: string[]) {
  const prefix = toCamel(slug);
  return categories.map((category) => {
    const rest = toCamel(category);
    return prefix + rest.charAt(0).toUpperCase() + rest.slice(1);
  });
}

function evidenceFor(slug: string, group: SectorGroupId): string[] {
  const handmade = handmadeEvidence[slug as SectorIdValue];
  if (handmade) {
    return handmade;
  }
  if (handmadeSectorSlugs.has(slug)) {
    return evidenceByGroup[group];
  }
  if (slug === "apiculture") {
    return uniqueEvidence(slug, ["hive-photo", "harvest-record", "sales-record", "inspection-record"]);
  }
  return uniqueEvidence(slug, evidenceByGroup[group]);
}

export const sectorGroups: readonly SectorGroupId[] = ["Annual crops", "Horticulture", "Perennial crops", "Livestock", "Aquaculture"];

const registryCatalog: SectorMeta[] = valueChains.map((chain) => ({
  id: chain.slug as SectorIdValue,
  label: chain.label,
  group: chain.group,
  description: `${chain.subtypes}. Field cadence: ${chain.cadence}.`,
  scorePath: chain.scorePath,
  evidenceCategories: evidenceFor(chain.slug, chain.group),
  status: chain.status,
  code: chain.code,
}));

const aliasCatalog: SectorMeta[] = [
  {
    id: SectorId.LIVESTOCK_MEAT,
    label: "Livestock meat",
    group: "Livestock",
    description: "Herd finishing, animal health, sales, and movement records. Use Beef cattle for the VC02 engine.",
    scorePath: "Livestock production score",
    evidenceCategories: ["animal-photo", "sales-record", "veterinary-record", "movement-permit"],
    status: "standard",
    code: "VC02",
  },
  {
    id: SectorId.HORTICULTURE,
    label: "Horticulture",
    group: "Horticulture",
    description: "Diversified vegetable and fruit enterprise when the crop is not one of the named horticulture chains.",
    scorePath: "Horticulture score",
    evidenceCategories: ["farm-photo", "input-receipt", "harvest-record", "sales-record"],
    status: "standard",
  },
];

export const sectorCatalog: readonly SectorMeta[] = [...registryCatalog, ...aliasCatalog];

export const defaultSectorGroup: SectorGroupId = "Annual crops";
export const defaultSectorId = SectorId.MAIZE;

export function getSectorsByGroup(group: SectorGroupId): SectorMeta[] {
  return sectorCatalog
    .filter((sector) => sector.group === group)
    .slice()
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === "priority" ? -1 : 1;
      }
      return left.label.localeCompare(right.label);
    });
}

export function getSectorMeta(id: string): SectorMeta {
  return sectorCatalog.find((sector) => sector.id === id) ?? {
    id: defaultSectorId,
    label: toTitle(id || defaultSectorId),
    group: defaultSectorGroup,
    description: "General agriculture enterprise record with production, market, cost, and evidence signals.",
    scorePath: "General agriculture score",
    evidenceCategories: ["farm-photo", "input-receipt", "harvest-record", "sales-record"],
    status: "standard",
  };
}

function toTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
