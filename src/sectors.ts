export type WebField = {
  id: string
  label: string
  type?: "text" | "number" | "choice"
  options?: string[]
  required?: boolean
}

export type WebSector = {
  id: string
  label: string
  evidence: string[]
  sections: { title: string; fields: WebField[] }[]
}

export const webSectors: WebSector[] = [
  {
    id: "dairy",
    label: "Dairy",
    evidence: ["Animal photo", "Milk delivery slip", "Payment statement", "Veterinary record"],
    sections: [
      { title: "Herd", fields: [
        { id: "totalCattle", label: "Total cattle", type: "number", required: true },
        { id: "dairyCattle", label: "Dairy cattle", type: "number", required: true },
        { id: "lactatingCows", label: "Lactating cows", type: "number", required: true },
        { id: "dryCows", label: "Dry cows", type: "number" },
        { id: "breed", label: "Main breed", type: "choice", options: ["Friesian", "Ayrshire", "Jersey", "Guernsey", "Crossbreed", "Local"] },
      ]},
      { title: "Milk production", fields: [
        { id: "morningLitres", label: "Morning milk (L)", type: "number", required: true },
        { id: "eveningLitres", label: "Evening milk (L)", type: "number", required: true },
        { id: "butterfatPct", label: "Butterfat %", type: "number" },
        { id: "snfPct", label: "SNF %", type: "number" },
      ]},
      { title: "Milk sales", fields: [
        { id: "buyer", label: "Buyer or cooperative", required: true },
        { id: "litresDelivered", label: "Litres delivered / day", type: "number", required: true },
        { id: "pricePerLitre", label: "Price per litre (KES)", type: "number" },
        { id: "rejectedMilk", label: "Rejected milk common", type: "choice", options: ["Yes", "No"] },
        { id: "paymentCycle", label: "Payment cycle", type: "choice", options: ["Cash", "Weekly", "Fortnightly", "Monthly"] },
      ]},
    ],
  },
  {
    id: "maize",
    label: "Maize",
    evidence: ["Farm photo", "Input receipt", "Harvest record", "Buyer delivery note"],
    sections: [
      { title: "Crop", fields: [
        { id: "acresPlanted", label: "Acres planted", type: "number", required: true },
        { id: "acresHarvested", label: "Acres harvested", type: "number" },
        { id: "variety", label: "Variety", required: true },
        { id: "seedSource", label: "Seed source", type: "choice", options: ["Certified hybrid", "OPV", "Recycled", "Local"] },
        { id: "irrigated", label: "Irrigated", type: "choice", options: ["Yes", "No"] },
      ]},
      { title: "Production", fields: [
        { id: "bagsHarvested", label: "Bags harvested", type: "number", required: true },
        { id: "yieldPerAcre", label: "Yield (bags / acre)", type: "number" },
        { id: "storageType", label: "Storage", type: "choice", options: ["On-farm crib", "Hermetic bags", "Warehouse", "Sold immediately"] },
        { id: "postHarvestLossBags", label: "Post-harvest loss (bags)", type: "number" },
      ]},
      { title: "Sales and risk", fields: [
        { id: "quantitySoldBags", label: "Bags sold", type: "number", required: true },
        { id: "buyer", label: "Buyer", required: true },
        { id: "salesChannel", label: "Channel", type: "choice", options: ["NCPB", "Trader", "Miller", "Household"] },
        { id: "droughtHistory", label: "Drought in last 3 seasons", type: "choice", options: ["Yes", "No"] },
      ]},
    ],
  },
  {
    id: "rice",
    label: "Rice",
    evidence: ["Farm photo", "Irrigation record", "Harvest record", "Buyer delivery note"],
    sections: [
      { title: "Paddy", fields: [
        { id: "paddyAcres", label: "Paddy acres", type: "number", required: true },
        { id: "schemeName", label: "Irrigation scheme" },
        { id: "waterSource", label: "Water source", type: "choice", options: ["Canal", "Pump", "Rain-fed", "Mixed"], required: true },
        { id: "variety", label: "Variety" },
      ]},
      { title: "Production", fields: [
        { id: "plantingMethod", label: "Planting method", type: "choice", options: ["Transplanted", "Direct seeded"] },
        { id: "bagsHarvested", label: "Bags harvested", type: "number", required: true },
        { id: "millingArrangement", label: "Milling", type: "choice", options: ["Own mill", "Custom mill", "Sold paddy"] },
        { id: "millingRecoveryPct", label: "Milling recovery %", type: "number" },
      ]},
      { title: "Sales and flood risk", fields: [
        { id: "quantitySoldBags", label: "Bags sold", type: "number", required: true },
        { id: "buyer", label: "Buyer", required: true },
        { id: "householdConsumptionBags", label: "Kept for household (bags)", type: "number" },
        { id: "floodDroughtExposure", label: "Flood or drought exposure", type: "choice", options: ["Flood", "Drought", "Both", "None"] },
      ]},
    ],
  },
  {
    id: "irish-potato",
    label: "Irish potato",
    evidence: ["Farm photo", "Seed receipt", "Harvest record", "Buyer delivery note"],
    sections: [
      { title: "Seed and cycle", fields: [
        { id: "acresPlanted", label: "Acres planted", type: "number", required: true },
        { id: "seedQuality", label: "Seed quality", type: "choice", options: ["Certified", "Cleaned farm-saved", "Uncertified"], required: true },
        { id: "cycleWeeks", label: "Cycle length (weeks)", type: "number" },
        { id: "variety", label: "Variety" },
      ]},
      { title: "Production", fields: [
        { id: "bagsHarvested", label: "Bags harvested", type: "number", required: true },
        { id: "yieldPerAcre", label: "Yield (bags / acre)", type: "number" },
        { id: "blightHistory", label: "Blight in last 2 cycles", type: "choice", options: ["Yes", "No"] },
        { id: "coldStoreAccess", label: "Cold-store access", type: "choice", options: ["Yes", "No"] },
      ]},
      { title: "Sales", fields: [
        { id: "buyer", label: "Buyer or broker", required: true },
        { id: "salesMarket", label: "Market", type: "choice", options: ["Local market", "Broker", "Aggregator", "Institution"] },
        { id: "daysToMarket", label: "Days to market after harvest", type: "number" },
      ]},
    ],
  },
  {
    id: "beans",
    label: "Beans",
    evidence: ["Farm photo", "Input receipt", "Harvest record", "Sales record"],
    sections: [
      { title: "Crop", fields: [
        { id: "acresPlanted", label: "Acres planted", type: "number", required: true },
        { id: "variety", label: "Variety", required: true },
        { id: "seedSource", label: "Seed source", type: "choice", options: ["Certified", "Farm-saved", "Relief / project"] },
        { id: "rainfallDependence", label: "Rainfall dependent", type: "choice", options: ["Yes", "No"] },
      ]},
      { title: "Production", fields: [
        { id: "bagsHarvested", label: "Bags harvested", type: "number", required: true },
        { id: "householdConsumptionBags", label: "Household consumption (bags)", type: "number" },
        { id: "storageType", label: "Storage", type: "choice", options: ["Hermetic bags", "Ordinary bags", "Collective store"] },
        { id: "postHarvestLossBags", label: "Post-harvest loss (bags)", type: "number" },
      ]},
      { title: "Sales", fields: [
        { id: "quantitySoldBags", label: "Bags sold", type: "number", required: true },
        { id: "buyer", label: "Buyer", required: true },
        { id: "collectiveMarketing", label: "Sells through a group", type: "choice", options: ["Yes", "No"] },
        { id: "groupName", label: "Group or buyer club" },
      ]},
    ],
  },
  {
    id: "tomato",
    label: "Tomato",
    evidence: ["Farm photo", "Spray record", "Harvest record", "Buyer delivery note"],
    sections: [
      { title: "Crop setup", fields: [
        { id: "acresPlanted", label: "Acres planted", type: "number", required: true },
        { id: "growingSystem", label: "System", type: "choice", options: ["Open field", "Greenhouse"], required: true },
        { id: "plantCount", label: "Plant count", type: "number" },
        { id: "irrigationType", label: "Irrigation", type: "choice", options: ["Drip", "Furrow", "Sprinkler", "Can", "None"] },
      ]},
      { title: "Harvest cycle", fields: [
        { id: "cycleWeeks", label: "Cycle length (weeks)", type: "number" },
        { id: "cratesHarvested", label: "Crates harvested", type: "number", required: true },
        { id: "rejectedCrates", label: "Rejected or spoiled crates", type: "number" },
        { id: "sprayFrequency", label: "Spray frequency", type: "choice", options: ["Weekly", "Fortnightly", "As needed", "None"] },
      ]},
      { title: "Market access", fields: [
        { id: "buyer", label: "Buyer", required: true },
        { id: "priceVariation", label: "Price variation", type: "choice", options: ["Stable", "Seasonal", "Daily swings"] },
        { id: "coldChainAccess", label: "Cold-chain access", type: "choice", options: ["Yes", "No"] },
        { id: "perishabilityLossPct", label: "Perishability loss %", type: "number" },
      ]},
    ],
  },
  {
    id: "horticulture",
    label: "Horticulture",
    evidence: ["Farm photo", "Input receipt", "Harvest record", "Sales record"],
    sections: [
      { title: "Crop setup", fields: [
        { id: "mainCrops", label: "Main crops", required: true },
        { id: "acresPlanted", label: "Total horticulture acres", type: "number", required: true },
        { id: "growingSystem", label: "System", type: "choice", options: ["Open field", "Greenhouse", "Mixed"] },
        { id: "irrigationType", label: "Irrigation", type: "choice", options: ["Drip", "Furrow", "Sprinkler", "None"] },
      ]},
      { title: "Production", fields: [
        { id: "cyclesPerYear", label: "Cycles per year", type: "number" },
        { id: "cratesOrPiecesHarvested", label: "Crates or pieces harvested", type: "number", required: true },
        { id: "qualityGrade", label: "Typical grade" },
        { id: "rejectedSharePct", label: "Rejected share %", type: "number" },
      ]},
      { title: "Offtake", fields: [
        { id: "buyer", label: "Buyer", required: true },
        { id: "offtakeContract", label: "Has offtake contract", type: "choice", options: ["Yes", "No"] },
        { id: "coldChainAccess", label: "Cold-chain access", type: "choice", options: ["Yes", "No"] },
        { id: "certification", label: "Certification", type: "choice", options: ["KS 1758", "GlobalG.A.P.", "Organic", "None"] },
      ]},
    ],
  },
  {
    id: "tea",
    label: "Tea",
    evidence: ["Farm photo", "Factory delivery slip", "Payment statement", "Input receipt"],
    sections: [
      { title: "Plantation", fields: [
        { id: "productiveAcres", label: "Productive bush acres", type: "number", required: true },
        { id: "factoryName", label: "Factory", required: true },
        { id: "buyingCentre", label: "Buying centre" },
        { id: "cloneVariety", label: "Clone or variety" },
      ]},
      { title: "Green leaf", fields: [
        { id: "pluckingCadence", label: "Plucking cadence", type: "choice", options: ["7 days", "10 days", "14 days", "Irregular"], required: true },
        { id: "greenLeafKgMonth", label: "Green leaf kg / month", type: "number", required: true },
        { id: "seasonalVariation", label: "Seasonal variation", type: "choice", options: ["Low", "Medium", "High"] },
        { id: "qualityDeductions", label: "Quality deductions common", type: "choice", options: ["Yes", "No"] },
      ]},
      { title: "Factory pay", fields: [
        { id: "pricePerKgLeaf", label: "Price per kg green leaf (KES)", type: "number" },
        { id: "monthlyPayment", label: "Typical monthly payment (KES)", type: "number" },
        { id: "bonusCycle", label: "Bonus cycle", type: "choice", options: ["Annual", "None", "Irregular"] },
        { id: "bonusHistory", label: "Last bonus (KES)", type: "number" },
      ]},
    ],
  },
  {
    id: "coffee",
    label: "Coffee",
    evidence: ["Farm photo", "Factory delivery slip", "Payment statement", "Certification record"],
    sections: [
      { title: "Plantation", fields: [
        { id: "orchardAcres", label: "Coffee acres", type: "number" },
        { id: "treeCount", label: "Tree count", type: "number", required: true },
        { id: "productiveTrees", label: "Productive trees", type: "number" },
        { id: "variety", label: "Variety" },
        { id: "averageAgeYears", label: "Average age (years)", type: "number" },
      ]},
      { title: "Cherry season", fields: [
        { id: "floweringPeriod", label: "Flowering period" },
        { id: "cherryKgExpected", label: "Expected cherry (kg)", type: "number", required: true },
        { id: "mbuniSharePct", label: "Mbuni share %", type: "number" },
        { id: "factoryGrade", label: "Typical factory grade" },
      ]},
      { title: "Cooperative", fields: [
        { id: "factoryName", label: "Factory or cooperative", required: true },
        { id: "cherryKgDelivered", label: "Cherry delivered (kg)", type: "number" },
        { id: "cherryPrice", label: "Cherry price (KES / kg)", type: "number" },
        { id: "advancesReceived", label: "Advances received", type: "choice", options: ["Yes", "No"] },
      ]},
    ],
  },
  {
    id: "avocado",
    label: "Avocado",
    evidence: ["Farm photo", "Exporter delivery note", "Payment statement", "Certification record"],
    sections: [
      { title: "Orchard", fields: [
        { id: "orchardAcres", label: "Orchard acres", type: "number" },
        { id: "treeCount", label: "Tree count", type: "number", required: true },
        { id: "fruitingTrees", label: "Fruiting trees", type: "number" },
        { id: "variety", label: "Variety", type: "choice", options: ["Hass", "Fuerte", "Pinkerton", "Mixed"] },
        { id: "plantingYear", label: "Planting year", type: "number", required: true },
      ]},
      { title: "Export harvest", fields: [
        { id: "harvestSeason", label: "Harvest season" },
        { id: "cyclesPerYear", label: "Harvest cycles / year", type: "number" },
        { id: "cratesPerCycle", label: "Crates per cycle", type: "number", required: true },
        { id: "exportGradePct", label: "Export-grade %", type: "number" },
      ]},
      { title: "Exporter", fields: [
        { id: "exporterName", label: "Exporter or aggregator" },
        { id: "contracted", label: "Contracted supply", type: "choice", options: ["Yes", "No"] },
        { id: "certification", label: "Certification", type: "choice", options: ["GlobalG.A.P.", "KS 1758", "Organic", "None"] },
        { id: "paymentCycle", label: "Payment cycle", type: "choice", options: ["On delivery", "Weekly", "After export"] },
      ]},
    ],
  },
  {
    id: "macadamia",
    label: "Macadamia",
    evidence: ["Farm photo", "Processor delivery note", "Payment statement", "Certification record"],
    sections: [
      { title: "Orchard", fields: [
        { id: "orchardAcres", label: "Orchard acres", type: "number" },
        { id: "treeCount", label: "Tree count", type: "number", required: true },
        { id: "productiveTrees", label: "Productive trees", type: "number" },
        { id: "averageAgeYears", label: "Average age (years)", type: "number" },
      ]},
      { title: "Nut harvest", fields: [
        { id: "harvestSeason", label: "Harvest season" },
        { id: "nutKgPerCycle", label: "Nuts per cycle (kg)", type: "number", required: true },
        { id: "nutGrade", label: "Typical nut grade" },
        { id: "rejectedKg", label: "Rejected nuts (kg)", type: "number" },
      ]},
      { title: "Processor", fields: [
        { id: "processorName", label: "Processor", required: true },
        { id: "pricePerKgNuts", label: "Price per kg (KES)", type: "number" },
        { id: "paymentCycle", label: "Payment cycle", type: "choice", options: ["Cash", "Weekly", "Monthly", "Seasonal"] },
        { id: "certification", label: "Certification", type: "choice", options: ["Organic", "Rainforest", "None"] },
      ]},
    ],
  },
  {
    id: "poultry",
    label: "Poultry",
    evidence: ["Flock photo", "Feed receipt", "Sales record", "Veterinary record"],
    sections: [
      { title: "Flock", fields: [
        { id: "productionType", label: "Enterprise type", type: "choice", options: ["Layers", "Broilers", "Kienyeji", "Mixed"], required: true },
        { id: "flockSize", label: "Current birds", type: "number", required: true },
        { id: "batchSize", label: "Batch size", type: "number" },
        { id: "breed", label: "Breed" },
        { id: "mortalityLastCycle", label: "Mortality last cycle", type: "number", required: true },
      ]},
      { title: "Output", fields: [
        { id: "eggsPerDay", label: "Eggs / day (layers)", type: "number" },
        { id: "traysPerWeek", label: "Trays / week (layers)", type: "number" },
        { id: "birdsSoldCycle", label: "Birds sold last cycle (broilers)", type: "number" },
        { id: "liveWeightKg", label: "Average live weight (kg)", type: "number" },
        { id: "cycleDays", label: "Broiler cycle (days)", type: "number" },
      ]},
      { title: "Health and sales", fields: [
        { id: "vaccinationCurrent", label: "Vaccination current", type: "choice", options: ["Yes", "No"] },
        { id: "biosecurity", label: "Biosecurity practised", type: "choice", options: ["Yes", "No"] },
        { id: "buyer", label: "Buyer", required: true },
        { id: "feedSource", label: "Feed source", type: "choice", options: ["Purchased", "Own mix", "Kitchen waste"] },
      ]},
    ],
  },
  {
    id: "livestock-meat",
    label: "Livestock meat",
    evidence: ["Animal photo", "Sales record", "Veterinary record", "Movement permit"],
    sections: [
      { title: "Herd", fields: [
        { id: "species", label: "Species", type: "choice", options: ["Cattle", "Goats", "Sheep", "Pigs", "Mixed"], required: true },
        { id: "animalCount", label: "Animals", type: "number", required: true },
        { id: "breedingStock", label: "Breeding stock", type: "number" },
        { id: "breed", label: "Breed" },
        { id: "ageClasses", label: "Age classes (e.g. weaners, finishers)" },
      ]},
      { title: "Turnover", fields: [
        { id: "animalsPurchased", label: "Animals purchased last year", type: "number" },
        { id: "animalsSold", label: "Animals sold last year", type: "number", required: true },
        { id: "mortality", label: "Mortality last year", type: "number" },
        { id: "finishingMonths", label: "Finishing cycle (months)", type: "number" },
      ]},
      { title: "Market and movement", fields: [
        { id: "buyer", label: "Buyer or market", required: true },
        { id: "averageSaleWeightKg", label: "Average sale weight (kg)", type: "number" },
        { id: "saleFrequency", label: "Sale frequency", type: "choice", options: ["Weekly", "Monthly", "Seasonal"] },
        { id: "movementPermit", label: "Movement permit", type: "choice", options: ["Yes", "No"], required: true },
        { id: "pastureAvailable", label: "Pasture available", type: "choice", options: ["Yes", "No"] },
      ]},
    ],
  },
  {
    id: "aquaculture",
    label: "Aquaculture",
    evidence: ["Pond photo", "Feed receipt", "Harvest record", "Sales record"],
    sections: [
      { title: "System", fields: [
        { id: "systemType", label: "System", type: "choice", options: ["Pond", "Cage", "Tank"], required: true },
        { id: "pondOrCageCount", label: "Ponds, cages or tanks", type: "number", required: true },
        { id: "waterAreaM2", label: "Water area (m²)", type: "number", required: true },
        { id: "species", label: "Species", required: true },
        { id: "stockingCapacity", label: "Stocking capacity", type: "number" },
      ]},
      { title: "Cycle", fields: [
        { id: "fingerlingsStocked", label: "Fingerlings stocked", type: "number" },
        { id: "survivalPct", label: "Survival %", type: "number" },
        { id: "cycleMonths", label: "Cycle length (months)", type: "number" },
        { id: "feedConversionRatio", label: "Feed conversion ratio", type: "number", required: true },
        { id: "harvestKg", label: "Last harvest (kg fish)", type: "number", required: true },
        { id: "averageFishWeightG", label: "Average fish weight (g)", type: "number" },
      ]},
      { title: "Water and sales", fields: [
        { id: "waterSource", label: "Water source", type: "choice", options: ["River", "Borehole", "Dam", "Municipal"] },
        { id: "lastWaterTest", label: "Last water test date" },
        { id: "buyer", label: "Buyer", required: true },
        { id: "pricePerKgFish", label: "Price per kg (KES)", type: "number" },
      ]},
    ],
  },
]

export function getWebSector(idOrLabel: string) {
  const needle = idOrLabel.toLowerCase()
  return webSectors.find(sector => sector.id === needle || sector.label.toLowerCase() === needle) ?? webSectors[0]
}
