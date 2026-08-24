import { useState } from "react"

const tasks = [
  {
    id: "1",
    type: "Collect evidence",
    farmer: "Mary Wanjiku",
    village: "Githunguri",
    priority: "High",
    due: "Today",
    detail: "Latest milk delivery statement required",
    offline: true,
  },
  {
    id: "2",
    type: "Capture GPS",
    farmer: "Mary Wanjiku",
    village: "Githunguri",
    priority: "High",
    due: "Today",
    detail: "Farm 2 boundary not yet mapped",
    offline: true,
  },
  {
    id: "3",
    type: "Correct record",
    farmer: "Grace Njeri",
    village: "Kikuyu",
    priority: "High",
    due: "Today",
    detail: "QA returned: ID photograph unreadable",
    offline: false,
  },
  {
    id: "4",
    type: "Complete profile",
    farmer: "Peter Mwangi",
    village: "Githunguri",
    priority: "Medium",
    due: "21 Aug",
    detail: "Financial module 38% complete",
    offline: true,
  },
  {
    id: "5",
    type: "Visit farmer",
    farmer: "Alice Waweru",
    village: "Gatundu",
    priority: "Medium",
    due: "22 Aug",
    detail: "Begin profile — not yet started",
    offline: true,
  },
  {
    id: "6",
    type: "Verify buyer",
    farmer: "James Kamau",
    village: "Lari",
    priority: "Low",
    due: "25 Aug",
    detail: "Coffee factory relationship to be confirmed",
    offline: false,
  },
]

type FilterType = "All" | "Today" | "High" | "GPS" | "Evidence" | "Correction"

export default function TasksScreen() {
  const [filter, setFilter] = useState<FilterType>("All")
  const filters: FilterType[] = ["All", "Today", "High", "GPS", "Evidence", "Correction"]

  const filtered = tasks.filter(t => {
    if (filter === "All") return true
    if (filter === "Today") return t.due === "Today"
    if (filter === "High") return t.priority === "High"
    if (filter === "GPS") return t.type === "Capture GPS"
    if (filter === "Evidence") return t.type === "Collect evidence"
    if (filter === "Correction") return t.type === "Correct record"
    return true
  })

  const todayCount = tasks.filter(t => t.due === "Today").length

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-white pt-14 pb-0 border-b border-charcoal-100">
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-xl font-semibold text-charcoal">Tasks</h1>
          <div className="flex items-center gap-2">
            <span className="bg-red-bg text-red-field text-xs font-mono font-medium px-2.5 py-1 rounded-full">{todayCount} due today</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto scroll-hidden">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f ? "bg-charcoal text-white" : "bg-charcoal-50 text-charcoal-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-4 pb-24 flex flex-col gap-2.5">
        {filtered.map(task => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: typeof tasks[0] }) {
  const [done, setDone] = useState(false)

  const priorityConfig = {
    High: { dot: "bg-red-500", label: "text-red-field bg-red-bg" },
    Medium: { dot: "bg-amber-500", label: "text-amber-field bg-amber-bg" },
    Low: { dot: "bg-charcoal-300", label: "text-charcoal-500 bg-charcoal-50" },
  }
  const pc = priorityConfig[task.priority as keyof typeof priorityConfig]

  return (
    <div className={`bg-white border border-charcoal-100 rounded-2xl p-4 transition-opacity ${done ? "opacity-40" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-charcoal bg-charcoal-50 px-2.5 py-1 rounded-full">{task.type}</span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pc.label}`}>{task.priority}</span>
          {task.offline && (
            <span className="text-xs text-charcoal-400 bg-charcoal-50 px-2 py-1 rounded-full">Offline ✓</span>
          )}
        </div>
        <span className={`text-xs font-mono flex-shrink-0 ${task.due === "Today" ? "text-red-field font-semibold" : "text-charcoal-400"}`}>{task.due}</span>
      </div>

      <p className="text-sm font-semibold text-charcoal mb-0.5">{task.farmer}</p>
      <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-2">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        {task.village}
      </div>
      <p className="text-xs text-charcoal-500 mb-3">{task.detail}</p>

      <div className="flex gap-2">
        <button className="flex-[2] py-2.5 bg-brand text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform">
          Start task
        </button>
        <button
          onClick={() => setDone(d => !d)}
          className="flex-1 py-2.5 border border-charcoal-200 rounded-xl text-xs font-medium text-charcoal"
        >
          {done ? "Undo" : "Done"}
        </button>
      </div>
    </div>
  )
}
