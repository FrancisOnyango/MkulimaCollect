export type FarmerStatus = "verified" | "incomplete" | "draft" | "correction" | "inprogress"

export type Farmer = {
  id: string
  name: string
  location: string
  enterprises: string[]
  status: FarmerStatus
  completeness: number
  updated: string
  unsynced: boolean
}

export const agent = {
  name: "Francis O.",
  role: "Field agent",
  cluster: "Kiambu Cluster 04",
  agentId: "AGT-00284",
  org: "Kiambu SACCO Network",
}

export const farmers: Farmer[] = [
  {
    id: "MS-KE-004829",
    name: "Mary Wanjiku",
    location: "Githunguri, Kiambu",
    enterprises: ["Dairy", "Maize"],
    status: "verified",
    completeness: 82,
    updated: "14 Aug",
    unsynced: false,
  },
  {
    id: "MS-KE-004831",
    name: "James Kamau",
    location: "Lari, Kiambu",
    enterprises: ["Coffee", "Avocado"],
    status: "incomplete",
    completeness: 56,
    updated: "12 Aug",
    unsynced: true,
  },
  {
    id: "MS-KE-004803",
    name: "Grace Njeri",
    location: "Kikuyu, Kiambu",
    enterprises: ["Tea"],
    status: "correction",
    completeness: 71,
    updated: "10 Aug",
    unsynced: false,
  },
  {
    id: "MS-KE-004822",
    name: "Peter Mwangi",
    location: "Githunguri, Kiambu",
    enterprises: ["Dairy", "Irish Potato"],
    status: "inprogress",
    completeness: 43,
    updated: "18 Aug",
    unsynced: true,
  },
  {
    id: "MS-KE-004810",
    name: "Alice Waweru",
    location: "Gatundu, Kiambu",
    enterprises: ["Maize", "Beans"],
    status: "draft",
    completeness: 18,
    updated: "08 Aug",
    unsynced: true,
  },
  {
    id: "MS-KE-004841",
    name: "Samuel Njoroge",
    location: "Lari, Kiambu",
    enterprises: ["Dairy"],
    status: "verified",
    completeness: 94,
    updated: "15 Aug",
    unsynced: false,
  },
]

export const tasks = [
  { id: "1", type: "Evidence", farmer: "Mary Wanjiku", village: "Githunguri", priority: "High" as const, due: "Today", detail: "Attach latest milk delivery statement" },
  { id: "2", type: "GPS", farmer: "Mary Wanjiku", village: "Githunguri", priority: "High" as const, due: "Today", detail: "Map Farm 2 boundary" },
  { id: "3", type: "Correction", farmer: "Grace Njeri", village: "Kikuyu", priority: "High" as const, due: "Today", detail: "Replace unreadable ID photo" },
  { id: "4", type: "Profile", farmer: "Peter Mwangi", village: "Githunguri", priority: "Medium" as const, due: "21 Aug", detail: "Finish financial section" },
  { id: "5", type: "Visit", farmer: "Alice Waweru", village: "Gatundu", priority: "Medium" as const, due: "22 Aug", detail: "Start farmer profile" },
  { id: "6", type: "Verify", farmer: "James Kamau", village: "Lari", priority: "Low" as const, due: "25 Aug", detail: "Confirm coffee factory buyer" },
]

export function getFarmer(id: string): Farmer {
  return farmers.find(farmer => farmer.id === id) ?? farmers[0]
}

export const workSummary = {
  doneToday: 7,
  assignedToday: 12,
  queued: farmers.filter(farmer => farmer.unsynced).length,
  dueToday: tasks.filter(task => task.due === "Today").length,
}

export const attentionItems = [
  "Map Farm 2 boundary for Mary Wanjiku",
  "Replace Grace Njeri's ID photograph",
  "Finish Peter Mwangi's financial section",
]
