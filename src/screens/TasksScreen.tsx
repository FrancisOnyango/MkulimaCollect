import { useState } from "react"
import ScreenHeader from "../components/ScreenHeader"
import { tasks, workSummary } from "../data"

type FilterType = "All" | "Today" | "High"

export default function TasksScreen() {
  const [filter, setFilter] = useState<FilterType>("All")
  const filters: FilterType[] = ["All", "Today", "High"]

  const filtered = tasks.filter(task => {
    if (filter === "Today") return task.due === "Today"
    if (filter === "High") return task.priority === "High"
    return true
  })

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      <ScreenHeader title="Tasks" subtitle={`${workSummary.dueToday} due today`} />

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

      <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-4 pb-28 flex flex-col gap-2">
        {filtered.map(task => (
          <div key={task.id} className="bg-card border border-charcoal-100 rounded-[22px] p-4">
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-xs font-medium text-charcoal-500">{task.type}</p>
              <p className={`text-xs ${task.due === "Today" ? "text-red-field font-semibold" : "text-charcoal-400"}`}>
                {task.due}
              </p>
            </div>
            <p className="text-sm font-semibold text-charcoal">{task.farmer}</p>
            <p className="text-xs text-charcoal-500 mt-1">{task.detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
