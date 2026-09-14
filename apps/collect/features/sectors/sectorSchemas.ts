import type { SectorSchemaDefinition, SectorSection } from "./types";

export const dairySchema: SectorSchemaDefinition = {
  id: "dairy-field-v2",
  version: "2.1.0",
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
      id: "milk-production",
      title: "Milk production",
      fields: [
        { id: "morningLitres", label: "Morning milk", type: "quantity", unit: "litres", required: true },
        { id: "eveningLitres", label: "Evening milk", type: "quantity", unit: "litres", required: true },
        { id: "averageLitresPerCow", label: "Average per lactating cow", type: "quantity", unit: "litres" },
        { id: "productionDays", label: "Production days per month", type: "integer" },
        { id: "seasonalHighLitres", label: "Seasonal high", type: "quantity", unit: "litres" },
        { id: "seasonalLowLitres", label: "Seasonal low", type: "quantity", unit: "litres" },
        { id: "butterfatPct", label: "Butterfat", type: "decimal", unit: "%" },
        { id: "snfPct", label: "SNF", type: "decimal", unit: "%" },
      ],
    },
    {
      id: "milk-sales",
      title: "Milk sales",
      fields: [
        { id: "buyer", label: "Buyer or cooperative", type: "text", required: true },
        { id: "collectionCentre", label: "Collection centre", type: "text" },
        { id: "litresDelivered", label: "Litres delivered", type: "quantity", unit: "litres", required: true },
        { id: "rejectedMilk", label: "Rejected milk common", type: "yes_no" },
        { id: "pricePerLitre", label: "Price per litre", type: "currency" },
        { id: "paymentCycle", label: "Payment cycle", type: "single_choice", options: ["Cash", "Weekly", "Fortnightly", "Monthly"] },
        { id: "paymentMethod", label: "Payment method", type: "single_choice", options: ["Cash", "M-PESA", "Bank", "Cooperative account"] },
      ],
    },
    costsSection(["feed", "fodder", "concentrates", "veterinary", "breedingAi", "labour", "water", "transport"]),
    {
      id: "health",
      title: "Animal health",
      fields: [
        { id: "vaccination", label: "Vaccination current", type: "yes_no" },
        { id: "veterinaryAccess", label: "Veterinary access", type: "single_choice", options: ["On call", "Monthly", "Emergency only", "No access"] },
        { id: "diseaseHistory", label: "Disease history", type: "text" },
        { id: "mortalityLast12Months", label: "Mortality last 12 months", type: "integer" },
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
        { id: "coolingTempC", label: "Cooling temperature", type: "decimal", unit: "C" },
      ],
    },
    evidenceSection([
      { id: "animal-photo", label: "Animal photograph" },
      { id: "milk-delivery-slip", label: "Milk delivery slip" },
      { id: "payment-statement", label: "Payment statement" },
      { id: "veterinary-record", label: "Veterinary record" },
    ]),
  ],
};

const maizeSchema = buildSchema("maize", "Maize", [
  {
    id: "crop",
    title: "Crop",
    fields: [
      { id: "acresPlanted", label: "Acres planted", type: "quantity", unit: "acres", required: true },
      { id: "acresHarvested", label: "Acres harvested", type: "quantity", unit: "acres" },
      { id: "variety", label: "Variety", type: "text", required: true },
      { id: "seedSource", label: "Seed source", type: "single_choice", options: ["Certified hybrid", "OPV", "Recycled", "Local"] },
      { id: "irrigated", label: "Irrigated", type: "yes_no" },
      { id: "intercrop", label: "Intercrop", type: "yes_no" },
      { id: "intercropCrop", label: "Intercrop crop", type: "text", condition: { fieldId: "intercrop", equals: true } },
    ],
  },
  {
    id: "production",
    title: "Production",
    fields: [
      { id: "plantingDate", label: "Planting date", type: "date" },
      { id: "harvestDate", label: "Harvest date", type: "date" },
      { id: "bagsHarvested", label: "Bags harvested", type: "quantity", unit: "bags", required: true },
      { id: "yieldPerAcreBags", label: "Yield per acre", type: "quantity", unit: "bags/acre" },
      { id: "storageType", label: "Storage", type: "single_choice", options: ["On-farm crib", "Hermetic bags", "Warehouse", "Sold immediately"] },
      { id: "postHarvestLossBags", label: "Post-harvest loss", type: "quantity", unit: "bags" },
    ],
  },
  {
    id: "sales",
    title: "Sales",
    fields: [
      { id: "quantitySoldBags", label: "Bags sold", type: "quantity", unit: "bags", required: true },
      { id: "buyer", label: "Buyer", type: "text", required: true },
      { id: "salesChannel", label: "Channel", type: "single_choice", options: ["NCPB", "Trader", "Miller", "Household"] },
      { id: "pricePerBag", label: "Price per bag", type: "currency" },
      { id: "salesTiming", label: "When sold", type: "single_choice", options: ["At harvest", "After storage", "Staggered"] },
    ],
  },
  {
    id: "risk",
    title: "Risk",
    fields: [
      { id: "droughtHistory", label: "Drought in last 3 seasons", type: "yes_no" },
      { id: "pestDiseaseIncidence", label: "Pest or disease incidence", type: "text" },
    ],
  },
  costsSection(["seed", "fertilizer", "pesticides", "labour", "mechanization", "transport"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "input-receipt", label: "Input receipt" },
    { id: "harvest-record", label: "Harvest record" },
    { id: "buyer-delivery-note", label: "Buyer delivery note" },
  ]),
]);

const riceSchema = buildSchema("rice", "Rice", [
  {
    id: "paddy",
    title: "Paddy",
    fields: [
      { id: "paddyAcres", label: "Paddy acres", type: "quantity", unit: "acres", required: true },
      { id: "variety", label: "Variety", type: "text" },
      { id: "schemeName", label: "Irrigation scheme", type: "text" },
      { id: "waterSource", label: "Water source", type: "single_choice", required: true, options: ["Canal", "Pump", "Rain-fed", "Mixed"] },
    ],
  },
  {
    id: "production",
    title: "Production and milling",
    fields: [
      { id: "plantingMethod", label: "Planting method", type: "single_choice", options: ["Transplanted", "Direct seeded"] },
      { id: "plantingDate", label: "Planting date", type: "date" },
      { id: "harvestDate", label: "Harvest date", type: "date" },
      { id: "bagsHarvested", label: "Bags harvested", type: "quantity", unit: "bags", required: true },
      { id: "millingArrangement", label: "Milling arrangement", type: "single_choice", options: ["Own mill", "Custom mill", "Sold paddy"] },
      { id: "millName", label: "Mill name", type: "text" },
      { id: "millingRecoveryPct", label: "Milling recovery", type: "decimal", unit: "%" },
    ],
  },
  {
    id: "sales",
    title: "Sales",
    fields: [
      { id: "quantitySoldBags", label: "Bags sold", type: "quantity", unit: "bags", required: true },
      { id: "buyer", label: "Buyer", type: "text", required: true },
      { id: "pricePerBag", label: "Price per bag", type: "currency" },
      { id: "householdConsumptionBags", label: "Household consumption", type: "quantity", unit: "bags" },
    ],
  },
  {
    id: "risk",
    title: "Flood and drought risk",
    fields: [
      { id: "floodDroughtExposure", label: "Exposure", type: "single_choice", options: ["Flood", "Drought", "Both", "None"] },
    ],
  },
  costsSection(["seed", "fertilizer", "pesticides", "labour", "irrigationCharges", "machinery", "transport"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "irrigation-record", label: "Irrigation record" },
    { id: "harvest-record", label: "Harvest record" },
    { id: "buyer-delivery-note", label: "Buyer delivery note" },
  ]),
]);

const irishPotatoSchema = buildSchema("irish-potato", "Irish potato", [
  {
    id: "crop",
    title: "Seed and cycle",
    fields: [
      { id: "acresPlanted", label: "Acres planted", type: "quantity", unit: "acres", required: true },
      { id: "variety", label: "Variety", type: "text" },
      { id: "seedQuality", label: "Seed quality", type: "single_choice", required: true, options: ["Certified", "Cleaned farm-saved", "Uncertified", "Unknown"] },
      { id: "plantingDate", label: "Planting date", type: "date" },
      { id: "harvestDate", label: "Harvest date", type: "date" },
      { id: "cycleWeeks", label: "Cycle length", type: "integer", unit: "weeks" },
    ],
  },
  {
    id: "production",
    title: "Production",
    fields: [
      { id: "bagsHarvested", label: "Bags harvested", type: "quantity", unit: "bags", required: true },
      { id: "yieldPerAcreBags", label: "Yield per acre", type: "quantity", unit: "bags/acre" },
      { id: "historicalCycles", label: "Cycles completed last year", type: "integer" },
      { id: "postHarvestLossBags", label: "Post-harvest loss", type: "quantity", unit: "bags" },
      { id: "blightHistory", label: "Blight in last 2 cycles", type: "yes_no" },
      { id: "coldStoreAccess", label: "Cold-store access", type: "yes_no" },
    ],
  },
  {
    id: "sales",
    title: "Sales",
    fields: [
      { id: "buyer", label: "Buyer or broker", type: "text", required: true },
      { id: "salesMarket", label: "Market", type: "single_choice", options: ["Local market", "Broker", "Aggregator", "Institution"] },
      { id: "pricePerBag", label: "Price per bag", type: "currency" },
      { id: "daysToMarket", label: "Days to market after harvest", type: "integer" },
    ],
  },
  costsSection(["seed", "fertilizer", "fungicide", "labour", "transport", "coldStorage"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "seed-receipt", label: "Seed receipt" },
    { id: "harvest-record", label: "Harvest record" },
    { id: "buyer-delivery-note", label: "Buyer delivery note" },
  ]),
]);

const beansSchema = buildSchema("beans", "Beans", [
  {
    id: "crop",
    title: "Crop",
    fields: [
      { id: "acresPlanted", label: "Acres planted", type: "quantity", unit: "acres", required: true },
      { id: "variety", label: "Variety", type: "text", required: true },
      { id: "seedSource", label: "Seed source", type: "single_choice", options: ["Certified", "Farm-saved", "Relief / project"] },
      { id: "plantingDate", label: "Planting date", type: "date" },
      { id: "harvestDate", label: "Harvest date", type: "date" },
      { id: "rainfallDependence", label: "Rainfall dependent", type: "yes_no" },
    ],
  },
  {
    id: "production",
    title: "Production",
    fields: [
      { id: "bagsHarvested", label: "Bags harvested", type: "quantity", unit: "bags", required: true },
      { id: "yieldPerAcreBags", label: "Yield per acre", type: "quantity", unit: "bags/acre" },
      { id: "householdConsumptionBags", label: "Household consumption", type: "quantity", unit: "bags" },
      { id: "storageType", label: "Storage", type: "single_choice", options: ["Hermetic bags", "Ordinary bags", "Collective store", "Sold immediately"] },
      { id: "postHarvestLossBags", label: "Post-harvest loss", type: "quantity", unit: "bags" },
    ],
  },
  {
    id: "sales",
    title: "Sales",
    fields: [
      { id: "quantitySoldBags", label: "Bags sold", type: "quantity", unit: "bags", required: true },
      { id: "buyer", label: "Buyer", type: "text", required: true },
      { id: "salesChannel", label: "Market channel", type: "single_choice", options: ["Local market", "Trader", "Group / collective", "Institution"] },
      { id: "collectiveMarketing", label: "Sells through a group", type: "yes_no" },
      { id: "groupName", label: "Group or buyer club", type: "text" },
      { id: "pricePerBag", label: "Price per bag", type: "currency" },
    ],
  },
  costsSection(["seed", "fertilizer", "pesticides", "labour", "irrigation"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "input-receipt", label: "Input receipt" },
    { id: "harvest-record", label: "Harvest record" },
    { id: "sales-record", label: "Sales record" },
  ]),
]);

const tomatoSchema = buildSchema("tomato", "Tomato", [
  {
    id: "crop",
    title: "Crop setup",
    fields: [
      { id: "acresPlanted", label: "Acres planted", type: "quantity", unit: "acres", required: true },
      { id: "variety", label: "Variety", type: "text" },
      { id: "growingSystem", label: "Growing system", type: "single_choice", required: true, options: ["Open field", "Greenhouse"] },
      { id: "plantCount", label: "Plant count", type: "integer" },
      { id: "irrigationType", label: "Irrigation", type: "single_choice", options: ["Drip", "Furrow", "Sprinkler", "Can", "None"] },
    ],
  },
  {
    id: "production",
    title: "Harvest cycle",
    fields: [
      { id: "plantingDate", label: "Planting date", type: "date" },
      { id: "harvestPeriod", label: "Harvest period", type: "text" },
      { id: "cycleWeeks", label: "Cycle length", type: "integer", unit: "weeks" },
      { id: "cratesHarvested", label: "Crates harvested", type: "quantity", unit: "crates", required: true },
      { id: "harvestFrequency", label: "Pick frequency", type: "single_choice", options: ["Daily", "Every 2 days", "Weekly"] },
      { id: "rejectedCrates", label: "Rejected or spoiled crates", type: "quantity", unit: "crates" },
      { id: "sprayFrequency", label: "Spray frequency", type: "single_choice", options: ["Weekly", "Fortnightly", "As needed", "None"] },
    ],
  },
  {
    id: "market",
    title: "Buyer and perishability",
    fields: [
      { id: "buyer", label: "Buyer", type: "text", required: true },
      { id: "salesMarket", label: "Market", type: "text" },
      { id: "pricePerCrate", label: "Price per crate", type: "currency" },
      { id: "priceVariation", label: "Price variation", type: "single_choice", options: ["Stable", "Seasonal", "Daily swings"] },
      { id: "perishabilityLossPct", label: "Perishability loss", type: "decimal", unit: "%" },
    ],
  },
  {
    id: "access",
    title: "Access",
    fields: [
      { id: "coldChainAccess", label: "Cold-chain access", type: "yes_no" },
      { id: "certification", label: "Certification", type: "single_choice", options: ["KS 1758", "GlobalG.A.P.", "None"] },
    ],
  },
  costsSection(["seedlings", "fertilizer", "pesticideFungicide", "labour", "packaging", "transport"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "spray-record", label: "Spray record" },
    { id: "harvest-record", label: "Harvest record" },
    { id: "buyer-delivery-note", label: "Buyer delivery note" },
  ]),
]);

const horticultureSchema = buildSchema("horticulture", "Horticulture", [
  {
    id: "setup",
    title: "Crop setup",
    fields: [
      { id: "mainCrops", label: "Main crops", type: "text", required: true },
      { id: "variety", label: "Variety", type: "text" },
      { id: "acresPlanted", label: "Total horticulture acres", type: "quantity", unit: "acres", required: true },
      { id: "growingSystem", label: "Growing system", type: "single_choice", options: ["Open field", "Greenhouse", "Mixed"] },
      { id: "irrigationType", label: "Irrigation", type: "single_choice", options: ["Drip", "Furrow", "Sprinkler", "None"] },
    ],
  },
  {
    id: "production",
    title: "Production",
    fields: [
      { id: "plantingDate", label: "Planting date", type: "date" },
      { id: "cyclesPerYear", label: "Cycles per year", type: "integer" },
      { id: "harvestFrequency", label: "Harvest frequency", type: "single_choice", options: ["Daily", "Weekly", "Monthly", "Seasonal"] },
      { id: "cratesOrPiecesHarvested", label: "Crates or pieces harvested", type: "quantity", required: true },
      { id: "qualityGrade", label: "Typical grade", type: "text" },
      { id: "rejectedSharePct", label: "Rejected share", type: "decimal", unit: "%" },
    ],
  },
  {
    id: "offtake",
    title: "Offtake",
    fields: [
      { id: "buyer", label: "Buyer", type: "text", required: true },
      { id: "offtakeContract", label: "Has offtake contract", type: "yes_no" },
      { id: "salesMarket", label: "Market", type: "text" },
      { id: "pricePerUnit", label: "Price per crate or piece", type: "currency" },
      { id: "perishabilityLossPct", label: "Post-harvest loss", type: "decimal", unit: "%" },
    ],
  },
  {
    id: "access",
    title: "Access",
    fields: [
      { id: "coldChainAccess", label: "Cold-chain access", type: "yes_no" },
      { id: "certification", label: "Certification", type: "single_choice", options: ["KS 1758", "GlobalG.A.P.", "Organic", "None"] },
    ],
  },
  costsSection(["seedlings", "fertilizer", "cropProtection", "labour", "packaging", "transport", "certification", "irrigation"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "input-receipt", label: "Input receipt" },
    { id: "harvest-record", label: "Harvest record" },
    { id: "sales-record", label: "Sales record" },
  ]),
]);

const teaSchema = buildSchema("tea", "Tea", [
  {
    id: "plantation",
    title: "Plantation",
    fields: [
      { id: "productiveAcres", label: "Productive bush acres", type: "quantity", unit: "acres", required: true },
      { id: "estimatedBushes", label: "Estimated bushes", type: "integer" },
      { id: "factoryName", label: "Factory", type: "text", required: true },
      { id: "buyingCentre", label: "Buying centre", type: "text" },
      { id: "cooperativeName", label: "Cooperative", type: "text" },
      { id: "cloneVariety", label: "Clone or variety", type: "text" },
    ],
  },
  {
    id: "green-leaf",
    title: "Green leaf",
    fields: [
      { id: "pluckingCadence", label: "Plucking cadence", type: "single_choice", required: true, options: ["7 days", "10 days", "14 days", "Irregular"] },
      { id: "greenLeafKgMonth", label: "Green leaf per month", type: "quantity", unit: "kg", required: true },
      { id: "deliveryFrequency", label: "Delivery frequency", type: "single_choice", options: ["Every pluck", "Weekly", "Fortnightly"] },
      { id: "seasonalVariation", label: "Seasonal variation", type: "single_choice", options: ["Low", "Medium", "High"] },
      { id: "qualityDeductions", label: "Quality deductions common", type: "yes_no" },
      { id: "deductionReason", label: "Typical deduction reason", type: "text" },
    ],
  },
  {
    id: "factory-pay",
    title: "Factory pay",
    fields: [
      { id: "pricePerKgLeaf", label: "Price per kg green leaf", type: "currency" },
      { id: "monthlyPaymentKes", label: "Typical monthly payment", type: "currency" },
      { id: "bonusCycle", label: "Bonus cycle", type: "single_choice", options: ["Annual", "None", "Irregular"] },
      { id: "bonusHistoryKes", label: "Last bonus", type: "currency" },
    ],
  },
  costsSection(["fertilizer", "plucking", "labour", "transport", "factoryCharges"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "factory-delivery-slip", label: "Factory delivery slip" },
    { id: "payment-statement", label: "Payment statement" },
    { id: "input-receipt", label: "Input receipt" },
  ]),
]);

const coffeeSchema = buildSchema("coffee", "Coffee", [
  {
    id: "plantation",
    title: "Plantation",
    fields: [
      { id: "orchardAcres", label: "Coffee acres", type: "quantity", unit: "acres" },
      { id: "treeCount", label: "Tree count", type: "integer", required: true },
      { id: "productiveTrees", label: "Productive trees", type: "integer" },
      { id: "variety", label: "Variety", type: "text" },
      { id: "averageAgeYears", label: "Average age", type: "decimal", unit: "years" },
    ],
  },
  {
    id: "season",
    title: "Cherry season",
    fields: [
      { id: "floweringPeriod", label: "Flowering period", type: "text" },
      { id: "harvestCycle", label: "Harvest cycle", type: "text" },
      { id: "cherryKgExpected", label: "Expected cherry", type: "quantity", unit: "kg cherry", required: true },
      { id: "cherryKgLastSeason", label: "Last season cherry", type: "quantity", unit: "kg cherry" },
      { id: "mbuniSharePct", label: "Mbuni share", type: "decimal", unit: "%" },
      { id: "factoryGrade", label: "Typical factory grade", type: "text" },
    ],
  },
  {
    id: "cooperative",
    title: "Cooperative deliveries",
    fields: [
      { id: "factoryName", label: "Factory or cooperative", type: "text", required: true },
      { id: "processorName", label: "Processor", type: "text" },
      { id: "cherryKgDelivered", label: "Cherry delivered", type: "quantity", unit: "kg" },
      { id: "cherryPrice", label: "Cherry price", type: "currency" },
      { id: "paymentTiming", label: "Payment timing", type: "single_choice", options: ["On delivery", "Monthly", "After milling"] },
      { id: "advancesReceived", label: "Advances received", type: "yes_no" },
      { id: "bonusHistoryKes", label: "Last bonus", type: "currency" },
    ],
  },
  costsSection(["fertilizer", "pesticides", "pruning", "labour", "transport"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "factory-delivery-slip", label: "Factory delivery slip" },
    { id: "payment-statement", label: "Payment statement" },
    { id: "certification-record", label: "Certification record" },
  ]),
]);

const avocadoSchema = buildSchema("avocado", "Avocado", [
  {
    id: "orchard",
    title: "Orchard",
    fields: [
      { id: "orchardAcres", label: "Orchard acres", type: "quantity", unit: "acres" },
      { id: "treeCount", label: "Tree count", type: "integer", required: true },
      { id: "fruitingTrees", label: "Fruiting trees", type: "integer" },
      { id: "variety", label: "Variety", type: "single_choice", options: ["Hass", "Fuerte", "Pinkerton", "Mixed"] },
      { id: "plantingYear", label: "Planting year", type: "integer", required: true },
    ],
  },
  {
    id: "export-harvest",
    title: "Export harvest",
    fields: [
      { id: "harvestSeason", label: "Harvest season", type: "text" },
      { id: "cyclesPerYear", label: "Harvest cycles per year", type: "integer" },
      { id: "cratesPerCycle", label: "Crates per cycle", type: "quantity", unit: "crates", required: true },
      { id: "exportGradePct", label: "Export-grade share", type: "decimal", unit: "%" },
    ],
  },
  {
    id: "exporter",
    title: "Exporter",
    fields: [
      { id: "exporterName", label: "Exporter or aggregator", type: "text" },
      { id: "contracted", label: "Contracted supply", type: "yes_no" },
      { id: "pricePerCrate", label: "Price per crate", type: "currency" },
      { id: "paymentCycle", label: "Payment cycle", type: "single_choice", options: ["On delivery", "Weekly", "After export"] },
      { id: "certification", label: "Certification", type: "multiple_choice", options: ["GlobalG.A.P.", "KS 1758", "Organic", "None"] },
      { id: "aggregationPoint", label: "Aggregation point", type: "text" },
    ],
  },
  costsSection(["fertilizer", "pestManagement", "pruning", "labour", "transport", "certification"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "exporter-delivery-note", label: "Exporter delivery note" },
    { id: "payment-statement", label: "Payment statement" },
    { id: "certification-record", label: "Certification record" },
  ]),
]);

const macadamiaSchema = buildSchema("macadamia", "Macadamia", [
  {
    id: "orchard",
    title: "Orchard",
    fields: [
      { id: "orchardAcres", label: "Orchard acres", type: "quantity", unit: "acres" },
      { id: "treeCount", label: "Tree count", type: "integer", required: true },
      { id: "productiveTrees", label: "Productive trees", type: "integer" },
      { id: "variety", label: "Variety", type: "text" },
      { id: "averageAgeYears", label: "Average age", type: "decimal", unit: "years" },
    ],
  },
  {
    id: "nut-harvest",
    title: "Nut harvest",
    fields: [
      { id: "harvestSeason", label: "Harvest season", type: "text" },
      { id: "nutKgPerCycle", label: "Nuts per cycle", type: "quantity", unit: "kg", required: true },
      { id: "historicalKg", label: "Last cycle nuts", type: "quantity", unit: "kg" },
      { id: "nutGrade", label: "Typical nut grade", type: "text" },
      { id: "rejectedKg", label: "Rejected nuts", type: "quantity", unit: "kg" },
    ],
  },
  {
    id: "processor",
    title: "Processor",
    fields: [
      { id: "processorName", label: "Processor", type: "text", required: true },
      { id: "pricePerKgNuts", label: "Price per kg", type: "currency" },
      { id: "paymentCycle", label: "Payment cycle", type: "single_choice", options: ["Cash", "Weekly", "Monthly", "Seasonal"] },
      { id: "certification", label: "Certification", type: "single_choice", options: ["Organic", "Rainforest", "None"] },
    ],
  },
  costsSection(["fertilizer", "pruning", "pestManagement", "labour", "transport"]),
  evidenceSection([
    { id: "farm-photo", label: "Farm photograph" },
    { id: "processor-delivery-note", label: "Processor delivery note" },
    { id: "payment-statement", label: "Payment statement" },
    { id: "certification-record", label: "Certification record" },
  ]),
]);

const poultrySchema = buildSchema("poultry", "Poultry", [
  {
    id: "flock",
    title: "Flock",
    fields: [
      { id: "productionType", label: "Enterprise type", type: "single_choice", required: true, options: ["Layers", "Broilers", "Kienyeji", "Mixed"] },
      { id: "flockSize", label: "Current birds", type: "quantity", unit: "birds", required: true },
      { id: "batchSize", label: "Batch size", type: "integer" },
      { id: "flockAgeWeeks", label: "Average age", type: "integer", unit: "weeks" },
      { id: "breed", label: "Breed", type: "text" },
      { id: "mortalityLastCycle", label: "Mortality last cycle", type: "integer", required: true },
      { id: "housing", label: "Housing available", type: "yes_no" },
    ],
  },
  {
    id: "layers-output",
    title: "Layer output",
    fields: [
      { id: "eggsPerDay", label: "Eggs per day", type: "quantity", unit: "eggs", condition: { fieldId: "productionType", equals: "Layers" } },
      { id: "traysPerWeek", label: "Trays per week", type: "quantity", unit: "trays", condition: { fieldId: "productionType", equals: "Layers" } },
      { id: "layingRatePct", label: "Laying rate", type: "decimal", unit: "%", condition: { fieldId: "productionType", equals: "Layers" } },
      { id: "eggsSoldWeek", label: "Eggs sold per week", type: "quantity", unit: "eggs", condition: { fieldId: "productionType", equals: "Layers" } },
      { id: "pricePerTray", label: "Price per tray", type: "currency", condition: { fieldId: "productionType", equals: "Layers" } },
    ],
  },
  {
    id: "broiler-output",
    title: "Broiler output",
    fields: [
      { id: "birdsSoldCycle", label: "Birds sold last cycle", type: "integer", condition: { fieldId: "productionType", equals: "Broilers" } },
      { id: "liveWeightKg", label: "Average live weight", type: "quantity", unit: "kg", condition: { fieldId: "productionType", equals: "Broilers" } },
      { id: "cycleDays", label: "Cycle length", type: "integer", unit: "days", condition: { fieldId: "productionType", equals: "Broilers" } },
      { id: "pricePerBird", label: "Price per bird", type: "currency", condition: { fieldId: "productionType", equals: "Broilers" } },
    ],
  },
  {
    id: "health-sales",
    title: "Health and sales",
    fields: [
      { id: "vaccinationCurrent", label: "Vaccination current", type: "yes_no" },
      { id: "vaccinationSchedule", label: "Vaccination schedule", type: "text" },
      { id: "diseaseHistory", label: "Disease history", type: "text" },
      { id: "biosecurity", label: "Biosecurity practised", type: "yes_no" },
      { id: "buyer", label: "Buyer", type: "text", required: true },
      { id: "feedSource", label: "Feed source", type: "multiple_choice", options: ["Purchased", "Own mix", "Kitchen waste"] },
    ],
  },
  costsSection(["chicks", "feed", "vaccination", "veterinary", "labour", "electricity", "housing", "transport"]),
  evidenceSection([
    { id: "flock-photo", label: "Flock photograph" },
    { id: "feed-receipt", label: "Feed receipt" },
    { id: "sales-record", label: "Sales record" },
    { id: "veterinary-record", label: "Veterinary record" },
  ]),
]);

const livestockMeatSchema = buildSchema("livestock-meat", "Livestock meat", [
  {
    id: "herd",
    title: "Herd",
    fields: [
      { id: "species", label: "Species", type: "single_choice", required: true, options: ["Cattle", "Goats", "Sheep", "Pigs", "Mixed"] },
      { id: "animalCount", label: "Animals", type: "quantity", unit: "animals", required: true },
      { id: "breedingStock", label: "Breeding stock", type: "integer" },
      { id: "breed", label: "Breed", type: "text" },
      { id: "ageClasses", label: "Age classes", type: "text" },
    ],
  },
  {
    id: "turnover",
    title: "Turnover",
    fields: [
      { id: "animalsPurchased", label: "Animals purchased last year", type: "integer" },
      { id: "animalsSold", label: "Animals sold last year", type: "integer", required: true },
      { id: "mortality", label: "Mortality last year", type: "integer" },
      { id: "finishingMonths", label: "Finishing cycle", type: "decimal", unit: "months" },
    ],
  },
  {
    id: "sales",
    title: "Sales and movement",
    fields: [
      { id: "buyer", label: "Buyer or market", type: "text", required: true },
      { id: "salesMarket", label: "Market", type: "text" },
      { id: "averageSaleWeightKg", label: "Average sale weight", type: "quantity", unit: "kg" },
      { id: "saleFrequency", label: "Sale frequency", type: "single_choice", options: ["Weekly", "Monthly", "Seasonal"] },
      { id: "pricePerAnimal", label: "Typical price", type: "currency" },
      { id: "movementPermit", label: "Movement permit available", type: "yes_no", required: true },
    ],
  },
  {
    id: "health",
    title: "Health and pasture",
    fields: [
      { id: "vaccinationCurrent", label: "Vaccination current", type: "yes_no" },
      { id: "diseaseHistory", label: "Disease history", type: "text" },
      { id: "pastureAvailable", label: "Pasture available", type: "yes_no" },
      { id: "livestockInsurance", label: "Livestock insurance", type: "yes_no" },
    ],
  },
  costsSection(["feed", "grazing", "veterinary", "vaccination", "water", "transport"]),
  evidenceSection([
    { id: "animal-photo", label: "Animal photograph" },
    { id: "sales-record", label: "Sales record" },
    { id: "veterinary-record", label: "Veterinary record" },
    { id: "movement-permit", label: "Movement permit" },
  ]),
]);

const aquacultureSchema = buildSchema("aquaculture", "Aquaculture", [
  {
    id: "system",
    title: "System",
    fields: [
      { id: "systemType", label: "System", type: "single_choice", required: true, options: ["Pond", "Cage", "Tank"] },
      { id: "pondOrCageCount", label: "Ponds, cages or tanks", type: "integer", required: true },
      { id: "waterAreaM2", label: "Water area", type: "quantity", unit: "m2", required: true },
      { id: "species", label: "Species", type: "text", required: true },
      { id: "stockingCapacity", label: "Stocking capacity", type: "integer" },
    ],
  },
  {
    id: "cycle",
    title: "Stocking and harvest",
    fields: [
      { id: "fingerlingsStocked", label: "Fingerlings stocked", type: "integer" },
      { id: "stockingDate", label: "Stocking date", type: "date" },
      { id: "survivalPct", label: "Survival", type: "decimal", unit: "%" },
      { id: "cycleMonths", label: "Cycle length", type: "decimal", unit: "months" },
      { id: "harvestDate", label: "Harvest date", type: "date" },
      { id: "feedConversionRatio", label: "Feed conversion ratio", type: "decimal", required: true },
      { id: "harvestKg", label: "Harvest weight", type: "quantity", unit: "kg fish", required: true },
      { id: "averageFishWeightG", label: "Average fish weight", type: "quantity", unit: "g" },
    ],
  },
  {
    id: "environment-sales",
    title: "Water and sales",
    fields: [
      { id: "waterSource", label: "Water source", type: "single_choice", options: ["River", "Borehole", "Dam", "Municipal"] },
      { id: "waterReliability", label: "Water reliability", type: "single_choice", options: ["Reliable", "Seasonal", "Unreliable"] },
      { id: "lastWaterTest", label: "Last water test", type: "date" },
      { id: "diseaseHistory", label: "Disease history", type: "text" },
      { id: "coldChainAccess", label: "Cold-chain access", type: "yes_no" },
      { id: "buyer", label: "Buyer", type: "text", required: true },
      { id: "pricePerKgFish", label: "Price per kg", type: "currency" },
    ],
  },
  costsSection(["fingerlings", "feed", "waterElectricity", "veterinary", "labour", "transport"]),
  evidenceSection([
    { id: "pond-photo", label: "Pond photograph" },
    { id: "feed-receipt", label: "Feed receipt" },
    { id: "harvest-record", label: "Harvest record" },
    { id: "sales-record", label: "Sales record" },
  ]),
]);

export const sectorSchemas: Record<string, SectorSchemaDefinition> = {
  dairy: dairySchema,
  maize: maizeSchema,
  rice: riceSchema,
  "irish-potato": irishPotatoSchema,
  beans: beansSchema,
  tomato: tomatoSchema,
  horticulture: horticultureSchema,
  tea: teaSchema,
  coffee: coffeeSchema,
  avocado: avocadoSchema,
  macadamia: macadamiaSchema,
  poultry: poultrySchema,
  "livestock-meat": livestockMeatSchema,
  aquaculture: aquacultureSchema,
};

export function getSectorSchema(sector: string) {
  return sectorSchemas[sector] ?? maizeSchema;
}

function buildSchema(sector: string, title: string, sections: SectorSection[]): SectorSchemaDefinition {
  return {
    id: `${sector}-field-v2`,
    version: "2.1.0",
    sector,
    title: `${title} collection`,
    sections,
  };
}

function costsSection(categories: string[]): SectorSection {
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

function evidenceSection(items: { id: string; label: string }[]): SectorSection {
  return {
    id: "evidence",
    title: "Required evidence",
    fields: items.map((item) => ({
      id: item.id,
      label: item.label,
      type: "evidence" as const,
      required: true,
    })),
  };
}

function toTitle(value: string) {
  return value
    .split(/[-_]/)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
