import { agent, attentionItems, workSummary } from "../data"
import StatusChip from "../components/StatusChip"

interface HomeScreenProps {
  isOffline: boolean
  onNavigateSync: () => void
  onCollect: () => void
}

export default function HomeScreen({ isOffline, onNavigateSync, onCollect }: HomeScreenProps) {
  const progress = Math.round((workSummary.doneToday / Math.max(workSummary.assignedToday, 1)) * 100)

  return (
    <div className="flex-1 overflow-y-auto scroll-hidden energea-glow pb-4">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand">Field desk</p>
          <h1 className="text-[28px] font-semibold text-charcoal tracking-tight mt-1 leading-tight">{agent.name}</h1>
          <p className="text-sm text-charcoal-500 mt-1">{agent.cluster}</p>
        </div>
        <StatusChip isOffline={isOffline} onClick={onNavigateSync} />
      </header>

      <div className="px-5 py-5 flex flex-col gap-4">
        <section className="relative overflow-hidden rounded-[28px] bg-ink p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-mid">Today</p>
          <p className="text-[56px] font-semibold text-white leading-none tracking-tight mt-3">
            {workSummary.doneToday}
            <span className="text-2xl text-white/40 font-medium">/{workSummary.assignedToday}</span>
          </p>
          <div className="mt-5 h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-white/65 mt-3">
            {attentionItems.length} records need attention before sync
          </p>
          <button
            type="button"
            onClick={onCollect}
            className="mt-5 w-full bg-brand text-brand-ink rounded-full py-3.5 px-4 text-sm font-semibold active:scale-[0.98]"
          >
            Start collection
          </button>
        </section>

        <section className={`rounded-[24px] p-4 border ${isOffline ? "bg-amber-bg border-amber-field/30" : "bg-card border-charcoal-100"}`}>
          <p className="text-sm font-semibold text-charcoal">
            {isOffline ? "Working offline" : `${workSummary.queued} records waiting to sync`}
          </p>
          <p className="text-sm text-charcoal-500 mt-1">
            {isOffline
              ? "Drafts stay on this device until you are back online."
              : "Open Sync when you have a connection."}
          </p>
          <button
            type="button"
            onClick={onNavigateSync}
            className="mt-3 text-sm font-semibold text-brand"
          >
            Open sync
          </button>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-[0.16em] mb-3">Needs attention</h2>
          <div className="bg-card border border-charcoal-100 rounded-[24px] divide-y divide-charcoal-100">
            {attentionItems.map(item => (
              <p key={item} className="px-4 py-3.5 text-sm text-charcoal">{item}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
