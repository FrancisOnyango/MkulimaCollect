export type ValueChainStatus = "priority" | "standard";
export type ValueChainGroup = "Annual crops" | "Horticulture" | "Perennial crops" | "Livestock" | "Aquaculture";

export type ValueChain = {
  code: string;
  slug: string;
  label: string;
  group: ValueChainGroup;
  sector: string;
  subtypes: string;
  status: ValueChainStatus;
  cadence: string;
  scorePath: string;
};

export const valueChains: readonly ValueChain[] = [
  { code: "VC01", slug: "dairy", label: "Dairy cattle", group: "Livestock", sector: "Livestock", subtypes: "Cattle dairy", status: "priority", cadence: "daily/visit", scorePath: "Livestock production score" },
  { code: "VC02", slug: "beef-cattle", label: "Beef cattle", group: "Livestock", sector: "Livestock", subtypes: "Cattle meat", status: "standard", cadence: "event/monthly", scorePath: "Livestock production score" },
  { code: "VC03", slug: "sheep-goats", label: "Sheep and goats", group: "Livestock", sector: "Livestock", subtypes: "Small ruminants meat/dairy/mixed", status: "standard", cadence: "event/monthly", scorePath: "Livestock production score" },
  { code: "VC04", slug: "poultry", label: "Poultry", group: "Livestock", sector: "Livestock", subtypes: "Broiler/layer/indigenous/dual/quail", status: "priority", cadence: "batch/daily", scorePath: "Livestock production score" },
  { code: "VC05", slug: "pigs", label: "Pigs", group: "Livestock", sector: "Livestock", subtypes: "Breeder/weaner/finisher/farrow-to-finish", status: "standard", cadence: "batch/event", scorePath: "Livestock production score" },
  { code: "VC06", slug: "aquaculture", label: "Aquaculture", group: "Aquaculture", sector: "Aquaculture", subtypes: "Pond/cage/tank; tilapia/catfish/trout", status: "priority", cadence: "cycle/weekly", scorePath: "Aquaculture production score" },
  { code: "VC07", slug: "apiculture", label: "Apiculture", group: "Livestock", sector: "Apiculture", subtypes: "Apiary and hive production", status: "standard", cadence: "inspection/harvest", scorePath: "Livestock production score" },
  { code: "VC08", slug: "maize", label: "Maize", group: "Annual crops", sector: "Annual crop", subtypes: "Rainfed/irrigated; grain/green maize/seed", status: "priority", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC09", slug: "beans", label: "Beans", group: "Annual crops", sector: "Annual crop", subtypes: "Common bean; grain/green/seed", status: "priority", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC10", slug: "rice", label: "Rice", group: "Annual crops", sector: "Annual crop", subtypes: "Paddy/upland; irrigated/rainfed", status: "priority", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC11", slug: "irish-potato", label: "Irish potato", group: "Annual crops", sector: "Annual crop", subtypes: "Ware/seed/processing", status: "priority", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC12", slug: "sweet-potato", label: "Sweet potato", group: "Annual crops", sector: "Annual crop", subtypes: "Fresh/processing/vines", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC13", slug: "cassava", label: "Cassava", group: "Annual crops", sector: "Annual crop", subtypes: "Fresh/processing/cuttings", status: "standard", cadence: "cycle/event", scorePath: "Crop production score" },
  { code: "VC14", slug: "wheat", label: "Wheat", group: "Annual crops", sector: "Annual crop", subtypes: "Grain/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC15", slug: "sorghum", label: "Sorghum", group: "Annual crops", sector: "Annual crop", subtypes: "Food/feed/brewing/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC16", slug: "millet", label: "Millet", group: "Annual crops", sector: "Annual crop", subtypes: "Finger/pearl; grain/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC17", slug: "green-grams", label: "Green grams", group: "Annual crops", sector: "Annual crop", subtypes: "Grain/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC18", slug: "cowpeas", label: "Cowpeas", group: "Annual crops", sector: "Annual crop", subtypes: "Grain/leaf/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC19", slug: "pigeon-peas", label: "Pigeon peas", group: "Annual crops", sector: "Annual crop", subtypes: "Grain/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC20", slug: "groundnuts", label: "Groundnuts", group: "Annual crops", sector: "Annual crop", subtypes: "Food/oil/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC21", slug: "sunflower", label: "Sunflower", group: "Annual crops", sector: "Annual crop", subtypes: "Oil/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC22", slug: "sugarcane", label: "Sugarcane", group: "Perennial crops", sector: "Perennial crop", subtypes: "Plant/ratoon; mill/jaggery/seed cane", status: "standard", cadence: "cycle/event", scorePath: "Perennial crop score" },
  { code: "VC23", slug: "cotton", label: "Cotton", group: "Annual crops", sector: "Annual crop", subtypes: "Lint/seed", status: "standard", cadence: "season/event", scorePath: "Crop production score" },
  { code: "VC24", slug: "pyrethrum", label: "Pyrethrum", group: "Perennial crops", sector: "Perennial crop", subtypes: "Flowers/planting material", status: "standard", cadence: "cycle/harvest", scorePath: "Perennial crop score" },
  { code: "VC25", slug: "tea", label: "Tea", group: "Perennial crops", sector: "Perennial crop", subtypes: "Smallholder leaf production", status: "priority", cadence: "cycle/delivery", scorePath: "Perennial crop score" },
  { code: "VC26", slug: "coffee", label: "Coffee", group: "Perennial crops", sector: "Perennial crop", subtypes: "Arabica/Robusta; cherry/parchment", status: "priority", cadence: "cycle/delivery", scorePath: "Perennial crop score" },
  { code: "VC27", slug: "avocado", label: "Avocado", group: "Perennial crops", sector: "Perennial crop", subtypes: "Fresh/export/processing", status: "priority", cadence: "cycle/harvest", scorePath: "Perennial crop score" },
  { code: "VC28", slug: "macadamia", label: "Macadamia", group: "Perennial crops", sector: "Perennial crop", subtypes: "Nut-in-shell/kernel", status: "priority", cadence: "cycle/harvest", scorePath: "Perennial crop score" },
  { code: "VC29", slug: "banana", label: "Banana", group: "Perennial crops", sector: "Perennial crop", subtypes: "Dessert/cooking/plantain", status: "standard", cadence: "mat/harvest", scorePath: "Perennial crop score" },
  { code: "VC30", slug: "mango", label: "Mango", group: "Perennial crops", sector: "Perennial crop", subtypes: "Fresh/processing", status: "standard", cadence: "cycle/harvest", scorePath: "Perennial crop score" },
  { code: "VC31", slug: "citrus", label: "Citrus", group: "Perennial crops", sector: "Perennial crop", subtypes: "Orange/lemon/lime/mandarin", status: "standard", cadence: "cycle/harvest", scorePath: "Perennial crop score" },
  { code: "VC32", slug: "coconut", label: "Coconut", group: "Perennial crops", sector: "Perennial crop", subtypes: "Nut/copra/oil/toddy/seedling", status: "standard", cadence: "cycle/harvest", scorePath: "Perennial crop score" },
  { code: "VC33", slug: "cashew", label: "Cashew", group: "Perennial crops", sector: "Perennial crop", subtypes: "Nut/apple processing", status: "standard", cadence: "cycle/harvest", scorePath: "Perennial crop score" },
  { code: "VC34", slug: "tomato", label: "Tomato", group: "Horticulture", sector: "Horticulture", subtypes: "Open field/greenhouse; fresh/processing", status: "priority", cadence: "cycle/event", scorePath: "Horticulture score" },
  { code: "VC35", slug: "onion", label: "Onion", group: "Horticulture", sector: "Horticulture", subtypes: "Bulb/leaf/seed", status: "standard", cadence: "cycle/event", scorePath: "Horticulture score" },
  { code: "VC36", slug: "kale-collards", label: "Kale and collards", group: "Horticulture", sector: "Horticulture", subtypes: "Open field/irrigated", status: "standard", cadence: "cycle/harvest", scorePath: "Horticulture score" },
  { code: "VC37", slug: "cabbage", label: "Cabbage", group: "Horticulture", sector: "Horticulture", subtypes: "Fresh market", status: "standard", cadence: "cycle/event", scorePath: "Horticulture score" },
  { code: "VC38", slug: "capsicum", label: "Capsicum", group: "Horticulture", sector: "Horticulture", subtypes: "Open field/greenhouse", status: "standard", cadence: "cycle/harvest", scorePath: "Horticulture score" },
  { code: "VC39", slug: "watermelon", label: "Watermelon", group: "Horticulture", sector: "Horticulture", subtypes: "Open field/irrigated", status: "standard", cadence: "cycle/event", scorePath: "Horticulture score" },
  { code: "VC40", slug: "french-beans", label: "French beans", group: "Horticulture", sector: "Horticulture", subtypes: "Fresh/export/processing", status: "standard", cadence: "cycle/delivery", scorePath: "Horticulture score" },
];

export const handmadeSectorSlugs = new Set([
  "aquaculture",
  "avocado",
  "beans",
  "coffee",
  "dairy",
  "horticulture",
  "irish-potato",
  "livestock-meat",
  "macadamia",
  "maize",
  "poultry",
  "rice",
  "tea",
  "tomato",
]);

export const sectorAliases: Record<string, string> = {
  "livestock-meat": "beef-cattle",
  "horticulture": "horticulture",
};

export function getValueChainBySlug(slug: string): ValueChain | undefined {
  const resolved = sectorAliases[slug] ?? slug;
  return valueChains.find((chain) => chain.slug === resolved || chain.slug === slug);
}

