type Tab = "home" | "farmers" | "tasks" | "more"

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onCollect: () => void
}

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const FarmersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const TasksIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
)

const MoreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
)

export default function BottomNav({ activeTab, onTabChange, onCollect }: BottomNavProps) {
  const tab = (id: Tab, Icon: React.FC, label: string) => {
    const active = activeTab === id
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={() => onTabChange(id)}
        className={`flex flex-col items-center gap-0.5 flex-1 min-h-12 py-1 transition-colors ${active ? "text-brand" : "text-charcoal-500"}`}
      >
        <Icon />
        <span className="text-[11px] font-semibold tracking-wide">{label}</span>
      </button>
    )
  }

  return (
    <div className="flex items-center bg-white border border-charcoal-100 rounded-full px-1.5 py-1.5 shadow-[0_12px_40px_rgba(13,27,16,0.08)]">
      {tab("home", HomeIcon, "Home")}
      {tab("farmers", FarmersIcon, "Farmers")}

      <div className="flex flex-col items-center px-1">
        <button
          type="button"
          aria-label="Collect"
          onClick={onCollect}
          className="w-12 h-12 rounded-full bg-brand flex items-center justify-center active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {tab("tasks", TasksIcon, "Work")}
      {tab("more", MoreIcon, "More")}
    </div>
  )
}
