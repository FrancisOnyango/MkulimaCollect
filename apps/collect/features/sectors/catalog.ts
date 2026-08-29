import { SectorId, type SectorIdValue } from "@/constants/sectorIds";

export type SectorGroupId = "Annual crops" | "Horticulture" | "Perennial crops" | "Livestock";

export type SectorMeta = {
  id: SectorIdValue;
  label: string;
  group: SectorGroupId;
  description: string;
  scorePath: string;
  evidenceCategories: string[];
};

export const sectorGroups: readonly SectorGroupId[] = ["Annual crops", "Horticulture", "Perennial crops", "Livestock"];

export const sectorCatalog: readonly SectorMeta[] = [
  { id: SectorId.MAIZE, label: "Maize", group: "Annual crops", description: "Seasonal production, input use, storage, delivery, and buyer/payment signals.", scorePath: "Crop production score", evidenceCategories: ["farm-photo", "input-receipt", "harvest-record", "buyer-delivery-note"] },
  { id: SectorId.RICE, label: "Rice", group: "Annual crops", description: "Paddy acreage, irrigation, yields, milling, sales, and payment traceability.", scorePath: "Crop production score", evidenceCategories: ["farm-photo", "irrigation-record", "harvest-record", "buyer-delivery-note"] },
  { id: SectorId.IRISH_POTATO, label: "Irish potato", group: "Annual crops", description: "Planting, seed quality, yield, aggregation, cold-chain, and market access signals.", scorePath: "Crop production score", evidenceCategories: ["farm-photo", "seed-receipt", "harvest-record", "buyer-delivery-note"] },
  { id: SectorId.BEANS, label: "Beans", group: "Annual crops", description: "Seasonal yields, input discipline, storage, collective marketing, and buyer records.", scorePath: "Crop production score", evidenceCategories: ["farm-photo", "input-receipt", "harvest-record", "sales-record"] },
  { id: SectorId.TOMATO, label: "Tomato", group: "Horticulture", description: "Production cycles, irrigation, pest control, grading, perishability, and buyer terms.", scorePath: "Horticulture score", evidenceCategories: ["farm-photo", "spray-record", "harvest-record", "buyer-delivery-note"] },
  { id: SectorId.HORTICULTURE, label: "Horticulture", group: "Horticulture", description: "Vegetable and fruit enterprise records for diversified horticulture farms.", scorePath: "Horticulture score", evidenceCategories: ["farm-photo", "input-receipt", "harvest-record", "sales-record"] },
  { id: SectorId.TEA, label: "Tea", group: "Perennial crops", description: "Bush area, plucking cadence, factory deliveries, quality deductions, and payments.", scorePath: "Perennial crop score", evidenceCategories: ["farm-photo", "factory-delivery-slip", "payment-statement", "input-receipt"] },
  { id: SectorId.COFFEE, label: "Coffee", group: "Perennial crops", description: "Tree count, cherry volumes, cooperative deliveries, payments, and quality history.", scorePath: "Perennial crop score", evidenceCategories: ["farm-photo", "factory-delivery-slip", "payment-statement", "certification-record"] },
  { id: SectorId.AVOCADO, label: "Avocado", group: "Perennial crops", description: "Tree maturity, harvest volumes, exporter aggregation, certification, and payment records.", scorePath: "Perennial crop score", evidenceCategories: ["farm-photo", "exporter-delivery-note", "payment-statement", "certification-record"] },
  { id: SectorId.MACADAMIA, label: "Macadamia", group: "Perennial crops", description: "Tree stand, nut volumes, processor deliveries, payment cycles, and quality signals.", scorePath: "Perennial crop score", evidenceCategories: ["farm-photo", "processor-delivery-note", "payment-statement", "certification-record"] },
  { id: SectorId.DAIRY, label: "Dairy", group: "Livestock", description: "Herd, milk volumes, quality, animal health, feed, costs, deliveries, and payments.", scorePath: "Livestock production score", evidenceCategories: ["animal-photo", "milk-delivery-slip", "payment-statement", "veterinary-record"] },
  { id: SectorId.POULTRY, label: "Poultry", group: "Livestock", description: "Flock size, cycles, egg/meat output, mortality, feed costs, and buyer records.", scorePath: "Livestock production score", evidenceCategories: ["flock-photo", "feed-receipt", "sales-record", "veterinary-record"] },
  { id: SectorId.LIVESTOCK_MEAT, label: "Livestock meat", group: "Livestock", description: "Herd/flock holdings, finishing cycles, animal health, sales, and movement records.", scorePath: "Livestock production score", evidenceCategories: ["animal-photo", "sales-record", "veterinary-record", "movement-permit"] },
  { id: SectorId.AQUACULTURE, label: "Aquaculture", group: "Livestock", description: "Pond capacity, stocking, feed conversion, harvests, water quality, and buyer records.", scorePath: "Aquaculture production score", evidenceCategories: ["pond-photo", "feed-receipt", "harvest-record", "sales-record"] },
];

export const defaultSectorGroup: SectorGroupId = "Annual crops";
export const defaultSectorId = SectorId.MAIZE;

export function getSectorsByGroup(group: SectorGroupId): SectorMeta[] {
  return sectorCatalog.filter((sector) => sector.group === group);
}

export function getSectorMeta(id: string): SectorMeta {
  return sectorCatalog.find((sector) => sector.id === id) ?? {
    id: defaultSectorId,
    label: toTitle(id || defaultSectorId),
    group: defaultSectorGroup,
    description: "General agriculture enterprise record with production, market, cost, and evidence signals.",
    scorePath: "General agriculture score",
    evidenceCategories: ["farm-photo", "input-receipt", "harvest-record", "sales-record"],
  };
}

function toTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
