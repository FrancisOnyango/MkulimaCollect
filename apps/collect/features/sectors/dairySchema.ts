import type { SectorSchemaDefinition } from "./types";

export const dairySchema: SectorSchemaDefinition = {
  id: "dairy-vertical-slice",
  version: "1.0.0",
  sector: "dairy",
  title: "Dairy collection",
  sections: [
    {
      id: "herd",
      title: "Herd",
      fields: [
        { id: "totalCattle", label: "Total cattle", type: "integer", required: true },
        { id: "dairyCattle", label: "Dairy cattle", type: "integer", required: true },
        { id: "lactatingCows", label: "Lactating cows", type: "integer", required: true },
        { id: "dryCows", label: "Dry cows", type: "integer" },
        { id: "heifers", label: "Heifers", type: "integer" },
        { id: "calves", label: "Calves", type: "integer" },
        { id: "bulls", label: "Bulls", type: "integer" },
        { id: "breed", label: "Main breed", type: "single_choice", required: true, options: ["Friesian", "Ayrshire", "Guernsey", "Jersey", "Crossbreed", "Local"] },
      ],
    },
    {
      id: "production",
      title: "Production",
      fields: [
        { id: "dailyMilkLitres", label: "Daily milk", type: "quantity", unit: "litres", required: true },
        { id: "morningLitres", label: "Morning milk", type: "quantity", unit: "litres" },
        { id: "eveningLitres", label: "Evening milk", type: "quantity", unit: "litres" },
        { id: "averageLitresPerCow", label: "Average per lactating cow", type: "quantity", unit: "litres" },
        { id: "productionDays", label: "Production days per month", type: "integer" },
        { id: "seasonalHigh", label: "Seasonal high", type: "quantity", unit: "litres" },
        { id: "seasonalLow", label: "Seasonal low", type: "quantity", unit: "litres" },
        { id: "productionHistory", label: "Production history", type: "text" },
      ],
    },
    {
      id: "sales",
      title: "Sales",
      fields: [
        { id: "buyer", label: "Buyer", type: "text", required: true },
        { id: "cooperative", label: "Cooperative", type: "text" },
        { id: "collectionCentre", label: "Collection centre", type: "text" },
        { id: "litresDelivered", label: "Litres delivered", type: "quantity", unit: "litres" },
        { id: "frequency", label: "Frequency", type: "single_choice", options: ["Daily", "Weekly", "Monthly", "Irregular"] },
        { id: "rejectedMilk", label: "Rejected milk", type: "yes_no" },
        { id: "pricePerLitre", label: "Price per litre", type: "currency" },
        { id: "paymentCycle", label: "Payment cycle", type: "single_choice", options: ["Cash", "Weekly", "Fortnightly", "Monthly"] },
        { id: "paymentMethod", label: "Payment method", type: "single_choice", options: ["Cash", "M-PESA", "Bank", "Cooperative account"] },
      ],
    },
    {
      id: "costs",
      title: "Costs",
      fields: [
        { id: "feed", label: "Feed", type: "currency" },
        { id: "fodder", label: "Fodder", type: "currency" },
        { id: "concentrates", label: "Concentrates", type: "currency" },
        { id: "veterinary", label: "Veterinary", type: "currency" },
        { id: "breedingAi", label: "Breeding/AI", type: "currency" },
        { id: "labour", label: "Labour", type: "currency" },
        { id: "water", label: "Water", type: "currency" },
        { id: "transport", label: "Transport", type: "currency" },
      ],
    },
    {
      id: "health",
      title: "Health",
      fields: [
        { id: "vaccination", label: "Vaccination current", type: "yes_no" },
        { id: "veterinaryAccess", label: "Veterinary access", type: "single_choice", options: ["On call", "Monthly", "Emergency only", "No access"] },
        { id: "diseaseHistory", label: "Disease history", type: "text" },
        { id: "mortality", label: "Mortality last 12 months", type: "integer" },
      ],
    },
    {
      id: "assets",
      title: "Assets",
      fields: [
        { id: "cowshed", label: "Cowshed", type: "yes_no" },
        { id: "chaffCutter", label: "Chaff cutter", type: "yes_no" },
        { id: "milkingEquipment", label: "Milking equipment", type: "multiple_choice", options: ["Hand milking", "Milking can", "Milking machine", "Sanitiser"] },
        { id: "coolingAccess", label: "Cooling access", type: "yes_no" },
        { id: "feedStorage", label: "Feed storage", type: "yes_no" },
      ],
    },
    {
      id: "evidence",
      title: "Evidence prompts",
      fields: [
        { id: "milkDeliveryRecord", label: "Milk delivery record", type: "evidence" },
        { id: "cooperativeStatement", label: "Cooperative statement", type: "evidence" },
        { id: "paymentStatement", label: "Payment statement", type: "evidence" },
        { id: "veterinaryEvidence", label: "Veterinary evidence", type: "evidence" },
        { id: "livestockPhoto", label: "Livestock/farm photograph", type: "evidence" },
      ],
    },
  ],
};

export function getSectorSchema(sector: string) {
  return sectorSchemas[sector] ?? buildGenericSectorSchema(sector, toTitle(sector));
}

export const sectorSchemas: Record<string, SectorSchemaDefinition> = {
  dairy: dairySchema,
  maize: buildCropSchema("maize", "Maize", "bags"),
  tea: buildPerennialCropSchema("tea", "Tea", "kg green leaf"),
  coffee: buildPerennialCropSchema("coffee", "Coffee", "kg cherry"),
  avocado: buildPerennialCropSchema("avocado", "Avocado", "crates"),
  rice: buildCropSchema("rice", "Rice", "bags"),
  "irish-potato": buildCropSchema("irish-potato", "Irish potato", "bags"),
  tomato: buildCropSchema("tomato", "Tomato", "crates"),
  macadamia: buildPerennialCropSchema("macadamia", "Macadamia", "kg nuts"),
  beans: buildCropSchema("beans", "Beans", "bags"),
  horticulture: buildCropSchema("horticulture", "Horticulture", "crates"),
  poultry: buildLivestockSchema("poultry", "Poultry", "birds", "eggs/trays"),
  "livestock-meat": buildLivestockSchema("livestock-meat", "Livestock meat", "animals", "kg live weight"),
  aquaculture: buildLivestockSchema("aquaculture", "Aquaculture", "ponds/cages", "kg fish"),
};

function buildCropSchema(sector: string, title: string, harvestUnit: string): SectorSchemaDefinition {
  return {
    id: `${sector}-production-vitals`,
    version: "1.0.0",
    sector,
    title: `${title} collection`,
    sections: [
      {
        id: "plot",
        title: "Plot and crop",
        fields: [
          { id: "areaUnderCrop", label: "Area under crop", type: "quantity", unit: "acres", required: true },
          { id: "variety", label: "Variety", type: "text" },
          { id: "plantingDate", label: "Planting date", type: "date" },
          { id: "irrigated", label: "Irrigated", type: "yes_no" },
        ],
      },
      {
        id: "production",
        title: "Production",
        fields: [
          { id: "expectedHarvest", label: "Expected harvest", type: "quantity", unit: harvestUnit, required: true },
          { id: "lastHarvest", label: "Last harvest", type: "quantity", unit: harvestUnit },
          { id: "harvestFrequency", label: "Harvest frequency", type: "single_choice", options: ["One-off", "Weekly", "Monthly", "Seasonal"] },
          { id: "postHarvestLoss", label: "Post-harvest loss", type: "quantity", unit: harvestUnit },
        ],
      },
      {
        id: "market",
        title: "Market",
        fields: [
          { id: "buyer", label: "Buyer", type: "text", required: true },
          { id: "collectionPoint", label: "Collection point", type: "text" },
          { id: "price", label: "Price", type: "currency" },
          { id: "paymentMethod", label: "Payment method", type: "single_choice", options: ["Cash", "M-PESA", "Bank", "Cooperative account"] },
        ],
      },
      costsSection(["seed", "fertilizer", "chemicals", "labour", "irrigation", "transport"]),
      evidenceSection(title),
    ],
  };
}

function buildPerennialCropSchema(sector: string, title: string, harvestUnit: string): SectorSchemaDefinition {
  const schema = buildCropSchema(sector, title, harvestUnit);
  schema.sections[0] = {
    id: "orchard",
    title: "Farm block",
    fields: [
      { id: "treesOrBushes", label: "Trees/bushes", type: "integer", required: true },
      { id: "productiveTreesOrBushes", label: "Productive trees/bushes", type: "integer" },
      { id: "variety", label: "Variety", type: "text" },
      { id: "cropAgeYears", label: "Average age", type: "decimal", unit: "years" },
    ],
  };
  return schema;
}

function buildLivestockSchema(sector: string, title: string, stockUnit: string, productionUnit: string): SectorSchemaDefinition {
  return {
    id: `${sector}-production-vitals`,
    version: "1.0.0",
    sector,
    title: `${title} collection`,
    sections: [
      {
        id: "stock",
        title: "Stock",
        fields: [
          { id: "stockCount", label: "Stock count", type: "quantity", unit: stockUnit, required: true },
          { id: "breedOrType", label: "Breed/type", type: "text" },
          { id: "housing", label: "Housing available", type: "yes_no" },
          { id: "feedSource", label: "Feed source", type: "multiple_choice", options: ["Purchased", "Own farm", "Grazing", "By-products"] },
        ],
      },
      {
        id: "production",
        title: "Production",
        fields: [
          { id: "currentProduction", label: "Current production", type: "quantity", unit: productionUnit, required: true },
          { id: "productionFrequency", label: "Production frequency", type: "single_choice", options: ["Daily", "Weekly", "Monthly", "Cycle"] },
          { id: "mortality", label: "Mortality last cycle", type: "integer" },
          { id: "healthEvents", label: "Health events", type: "text" },
        ],
      },
      {
        id: "market",
        title: "Market",
        fields: [
          { id: "buyer", label: "Buyer", type: "text", required: true },
          { id: "price", label: "Price", type: "currency" },
          { id: "paymentCycle", label: "Payment cycle", type: "single_choice", options: ["Cash", "Weekly", "Monthly", "Per cycle"] },
          { id: "paymentMethod", label: "Payment method", type: "single_choice", options: ["Cash", "M-PESA", "Bank", "Cooperative account"] },
        ],
      },
      costsSection(["feed", "veterinary", "labour", "water", "housing", "transport"]),
      evidenceSection(title),
    ],
  };
}

function buildGenericSectorSchema(sector: string, title: string): SectorSchemaDefinition {
  return buildCropSchema(sector, title, "units");
}

function costsSection(categories: string[]) {
  return {
    id: "costs",
    title: "Costs",
    fields: categories.map((category) => ({
      id: category,
      label: toTitle(category),
      type: "currency" as const,
    })),
  };
}

function evidenceSection(title: string) {
  return {
    id: "evidence",
    title: "Evidence prompts",
    fields: [
      { id: "productionPhoto", label: `${title} production photograph`, type: "evidence" as const },
      { id: "salesRecord", label: "Sales/delivery record", type: "evidence" as const },
      { id: "paymentRecord", label: "Payment statement", type: "evidence" as const },
      { id: "inputReceipt", label: "Input receipt", type: "evidence" as const },
    ],
  };
}

function toTitle(value: string) {
  return value
    .split(/[-_]/)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
