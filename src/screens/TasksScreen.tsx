import { useState } from "react"
import ScreenHeader from "../components/ScreenHeader"
import { farmers, tasks, workSummary } from "../data"

type FilterType = "All" | "Today" | "High"

interface TasksScreenProps {
  onSelectFarmer?: (id: string) => void
}

export default function TasksScreen({ onSelectFarmer }: TasksScreenProps) {
  const [filter, setFilter] = useState<FilterType>("All")
  const [doneIds, setDoneIds] = useState<string[]>([])
  const filters: FilterType[] = ["All", "Today", "High"]

  const filtered = tasks.filter(task => {
    if (doneIds.includes(task.id)) return false
    if (filter === "Today") return task.due === "Today"
    if (filter === "High") return task.priority === "High"
    return true
  })

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <ScreenHeader title="Work" subtitle={`${workSummary.dueToday} due today · assigned visits and follow-ups`} />

      <div className="px-5 pb-3 grid grid-cols-2 gap-2">
        {[
          ["New assessment", "Consent through holdings"],
          ["Revisit", "Change events only"],
          ["Cycle follow-up", "Stage, inputs, events"],
          ["Harvest / sale", "Lots, buyers, payment"],
        ].map(([label, detail]) => (
          <button key={label} type="button" className="text-left bg-card border border-charcoal-100 rounded-2xl px-3 py-3">
            <p className="text-xs font-semibold text-charcoal">{label}</p>
            <p className="text-[11px] text-charcoal-500 mt-0.5">{detail}</p>
          </button>
        ))}
      </div>

      <div className="px-5 pb-3 flex gap-2">
        {filters.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${
              filter === item ? "bg-brand text-brand-ink" : "bg-card border border-charcoal-100 text-charcoal-500"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-4 pb-4 flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-center py-16 text-sm text-charcoal-400">No open tasks in this filter.</p>
        )}
        {filtered.map(task => {
          const farmer = farmers.find(item => item.name === task.farmer)
          return (
            <div key={task.id} className="bg-card border border-charcoal-100 rounded-[22px] p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-xs font-medium text-charcoal-500">{task.type}</p>
                <p className={`text-xs ${task.due === "Today" ? "text-red-field font-semibold" : "text-charcoal-400"}`}>
                  {task.due}
                </p>
              </div>
              <p className="text-sm font-semibold text-charcoal">{task.farmer}</p>
              <p className="text-xs text-charcoal-500 mt-1">{task.detail}</p>
              <div className="flex gap-2 mt-3">
                {farmer && onSelectFarmer ? (
                  <button
                    type="button"
                    onClick={() => onSelectFarmer(farmer.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-light text-brand"
                  >
                    Open farmer
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDoneIds(ids => [...ids, task.id])}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand text-brand-ink"
                >
                  Done
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
