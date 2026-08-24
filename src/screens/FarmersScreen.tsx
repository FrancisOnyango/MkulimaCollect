import { useState } from "react"
import Badge from "../components/Badge"
import CompletenessBar from "../components/CompletenessBar"

interface FarmersScreenProps {
  onSelectFarmer: (id: string) => void
}

const farmers = [
  {
    id: "MS-KE-004829",
    name: "Mary Wanjiku",
    location: "Githunguri · Kiambu",
    enterprises: ["Dairy", "Maize"],
    status: "verified" as const,
    completeness: 82,
    updated: "14 Aug 2026",
    unsynced: false,
  },
  {
    id: "MS-KE-004831",
    name: "James Kamau",
    location: "Lari · Kiambu",
    enterprises: ["Coffee", "Avocado"],
    status: "incomplete" as const,
    completeness: 56,
    updated: "12 Aug 2026",
    unsynced: true,
  },
  {
    id: "MS-KE-004803",
    name: "Grace Njeri",
    location: "Kikuyu · Kiambu",
    enterprises: ["Tea"],
    status: "correction" as const,
    completeness: 71,
    updated: "10 Aug 2026",
    unsynced: false,
  },
  {
    id: "MS-KE-004822",
    name: "Peter Mwangi",
    location: "Githunguri · Kiambu",
    enterprises: ["Dairy", "Irish Potato"],
    status: "inprogress" as const,
    completeness: 43,
    updated: "18 Aug 2026",
    unsynced: true,
  },
  {
    id: "MS-KE-004810",
    name: "Alice Waweru",
    location: "Gatundu · Kiambu",
    enterprises: ["Maize", "Beans"],
    status: "draft" as const,
    completeness: 18,
    updated: "08 Aug 2026",
    unsynced: true,
  },
  {
    id: "MS-KE-004841",
    name: "Samuel Njoroge",
    location: "Lari · Kiambu",
    enterprises: ["Dairy"],
    status: "verified" as const,
    completeness: 94,
    updated: "15 Aug 2026",
    unsynced: false,
  },
]

const filterChips = ["All", "In progress", "Complete", "Correction", "Unsynced", "Dairy", "Coffee", "Tea"]

export default function FarmersScreen({ onSelectFarmer }: FarmersScreenProps) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("All")

  const filtered = farmers.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase())

    const matchFilter = activeFilter === "All" ||
      (activeFilter === "In progress" && f.status === "inprogress") ||
      (activeFilter === "Complete" && f.status === "verified") ||
      (activeFilter === "Correction" && f.status === "correction") ||
      (activeFilter === "Unsynced" && f.unsynced) ||
      (activeFilter === "Dairy" && f.enterprises.includes("Dairy")) ||
      (activeFilter === "Coffee" && f.enterprises.includes("Coffee")) ||
      (activeFilter === "Tea" && f.enterprises.includes("Tea"))

    return matchSearch && matchFilter
  })

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-white pt-14 pb-0 px-5 border-b border-charcoal-100">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold text-charcoal">Farmers</h1>
          <span className="font-mono text-xs text-charcoal-500 bg-charcoal-50 px-2.5 py-1 rounded-full">183 assigned</span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="w-full bg-charcoal-50 rounded-xl pl-10 pr-4 py-3 text-sm text-charcoal placeholder-charcoal-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all border border-transparent focus:border-brand/20"
            placeholder="Search name, ID, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 pb-3 overflow-x-auto scroll-hidden">
          {filterChips.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === chip ? "bg-brand text-white" : "bg-charcoal-50 text-charcoal-500"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Farmer list */}
      <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-3 pb-24 flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-charcoal-300">
            <p className="text-sm">No farmers match your search.</p>
          </div>
        )}
        {filtered.map(farmer => (
          <FarmerCard key={farmer.id} farmer={farmer} onPress={() => onSelectFarmer(farmer.id)} />
        ))}
      </div>
    </div>
  )
}

function FarmerCard({ farmer, onPress }: { farmer: typeof farmers[0]; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="w-full bg-white rounded-2xl border border-charcoal-100 p-4 text-left active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
            <span className="text-brand text-sm font-semibold">
              {farmer.name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm text-charcoal leading-tight">{farmer.name}</p>
            <p className="font-mono text-[11px] text-charcoal-300 mt-0.5">{farmer.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {farmer.unsynced && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" title="Unsynced" />
          )}
          <Badge variant={farmer.status} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        {farmer.location}
      </div>
      <div className="flex gap-1.5 mb-3">
        {farmer.enterprises.map(e => (
          <span key={e} className="px-2 py-0.5 bg-charcoal-50 rounded-full text-[11px] text-charcoal-500 font-medium">{e}</span>
        ))}
      </div>

      <div className="space-y-1.5">
        <CompletenessBar percent={farmer.completeness} size="sm" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-charcoal-300">Profile completeness</span>
          <span className="text-[11px] text-charcoal-300">Updated {farmer.updated}</span>
        </div>
      </div>
    </button>
  )
}
