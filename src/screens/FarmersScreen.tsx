import { useState } from "react"
import Badge from "../components/Badge"
import ScreenHeader from "../components/ScreenHeader"
import { farmers } from "../data"

interface FarmersScreenProps {
  onSelectFarmer: (id: string) => void
}

const filters = ["All", "Needs work", "Unsynced"] as const

export default function FarmersScreen({ onSelectFarmer }: FarmersScreenProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<(typeof filters)[number]>("All")

  const filtered = farmers.filter(farmer => {
    const query = search.toLowerCase()
    const matchesSearch =
      farmer.name.toLowerCase().includes(query) ||
      farmer.id.toLowerCase().includes(query) ||
      farmer.location.toLowerCase().includes(query)

    const needsWork = farmer.status !== "verified"
    const matchesFilter =
      filter === "All" ||
      (filter === "Needs work" && needsWork) ||
      (filter === "Unsynced" && farmer.unsynced)

    return matchesSearch && matchesFilter
  })

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <ScreenHeader title="Farmers" subtitle={`${farmers.length} assigned`} />

      <div className="px-5 pb-3">
        <label htmlFor="farmer-search" className="sr-only">Search farmers</label>
        <input
          id="farmer-search"
          className="w-full bg-card border border-charcoal-100 rounded-full px-4 py-3 text-sm text-charcoal placeholder-charcoal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          placeholder="Search name, ID, or location"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 mt-3">
          {filters.map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => setFilter(chip)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${
                filter === chip ? "bg-brand text-brand-ink" : "bg-card border border-charcoal-100 text-charcoal-500"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-3 pb-28 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-center py-16 text-sm text-charcoal-400">No farmers match this search.</p>
        )}
        {filtered.map(farmer => (
          <button
            key={farmer.id}
            type="button"
            onClick={() => onSelectFarmer(farmer.id)}
            className="w-full bg-card rounded-[22px] border border-charcoal-100 p-4 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-charcoal">{farmer.name}</p>
                <p className="text-xs text-charcoal-500 mt-0.5">{farmer.location}</p>
                <p className="text-xs text-charcoal-400 mt-1">{farmer.enterprises.join(" · ")}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <Badge variant={farmer.status} />
                {farmer.unsynced && <span className="text-[11px] text-amber-field">Unsynced</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
