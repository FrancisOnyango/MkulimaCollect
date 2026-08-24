import { useState } from "react"

interface SyncScreenProps {
  onBack: () => void
  isOffline: boolean
}

type SyncStatus = "queued" | "uploading" | "synced" | "retry"

interface SyncItem {
  id: string
  farmer: string
  type: string
  size: string
  status: SyncStatus
}

const initialItems: SyncItem[] = [
  { id: "1", farmer: "Mary Wanjiku", type: "Farmer record", size: "4.2 KB", status: "synced" },
  { id: "2", farmer: "Mary Wanjiku", type: "Farm photograph", size: "2.1 MB", status: "synced" },
  { id: "3", farmer: "Peter Mwangi", type: "Farmer record", size: "6.8 KB", status: "uploading" },
  { id: "4", farmer: "Peter Mwangi", type: "ID photograph", size: "1.4 MB", status: "queued" },
  { id: "5", farmer: "Peter Mwangi", type: "Consent record", size: "0.8 KB", status: "queued" },
  { id: "6", farmer: "Alice Waweru", type: "Farmer record", size: "3.1 KB", status: "queued" },
  { id: "7", farmer: "Alice Waweru", type: "Farm photograph", size: "1.9 MB", status: "queued" },
  { id: "8", farmer: "James Kamau", type: "Farmer record", size: "5.4 KB", status: "retry" },
  { id: "9", farmer: "James Kamau", type: "Coffee delivery record", size: "0.6 KB", status: "queued" },
]

export default function SyncScreen({ onBack, isOffline }: SyncScreenProps) {
  const [items, setItems] = useState(initialItems)
  const [syncing, setSyncing] = useState(false)

  const sync = () => {
    if (isOffline) return
    setSyncing(true)
    let delay = 0
    items.forEach((item, i) => {
      if (item.status === "queued" || item.status === "retry") {
        delay += 600
        setTimeout(() => {
          setItems(prev => {
            const next = [...prev]
            const idx = next.findIndex(x => x.id === item.id)
            next[idx] = { ...next[idx], status: "uploading" }
            return next
          })
          setTimeout(() => {
            setItems(prev => {
              const next = [...prev]
              const idx = next.findIndex(x => x.id === item.id)
              next[idx] = { ...next[idx], status: "synced" }
              return next
            })
          }, 800)
        }, delay)
      }
    })
    setTimeout(() => setSyncing(false), delay + 1200)
  }

  const pending = items.filter(i => i.status === "queued" || i.status === "uploading" || i.status === "retry").length
  const synced = items.filter(i => i.status === "synced").length

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden screen-enter">
      {/* Header */}
      <div className="bg-white pt-12 pb-0 border-b border-charcoal-100">
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-charcoal-50 -ml-2 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h1 className="text-xl font-semibold text-charcoal">Sync Centre</h1>
          </div>

          {/* Connection status */}
          <div className={`rounded-2xl p-4 border ${isOffline ? "bg-amber-bg border-amber-200" : "bg-brand-muted border-brand/20"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOffline ? "bg-amber-500 pulse-dot" : "bg-brand"}`} />
                <div>
                  <p className={`text-sm font-semibold ${isOffline ? "text-amber-field" : "text-brand"}`}>
                    {isOffline ? "Offline" : "Online — 4G"}
                  </p>
                  <p className="text-xs text-charcoal-500">Last successful sync: 10:42 AM</p>
                </div>
              </div>
              {!isOffline && (
                <button
                  onClick={sync}
                  disabled={syncing || pending === 0}
                  className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-opacity flex items-center gap-1.5"
                >
                  {syncing && <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>}
                  {syncing ? "Syncing…" : "Sync now"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 pb-4 grid grid-cols-3 gap-3">
          <StatPill label="Waiting" value={pending} warn={pending > 0} />
          <StatPill label="Synced" value={synced} success />
          <StatPill label="Est. size" value="28 MB" raw />
        </div>
      </div>

      {/* Queue */}
      <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-4 pb-24 flex flex-col gap-2">
        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-1">Upload queue</p>
        {items.map(item => (
          <SyncItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function SyncItemRow({ item }: { item: SyncItem }) {
  const statusConfig = {
    queued: { label: "Queued", bg: "bg-charcoal-50", text: "text-charcoal-400" },
    uploading: { label: "Uploading…", bg: "bg-blue-50", text: "text-blue-600" },
    synced: { label: "Synced ✓", bg: "bg-brand-light", text: "text-brand" },
    retry: { label: "Retry required", bg: "bg-red-bg", text: "text-red-field" },
  }
  const cfg = statusConfig[item.status]

  return (
    <div className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${item.status === "uploading" ? "border-blue-200" : item.status === "synced" ? "border-brand/20" : item.status === "retry" ? "border-red-200" : "border-charcoal-100"}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal truncate">{item.farmer}</p>
        <p className="text-xs text-charcoal-400">{item.type} · {item.size}</p>
        {item.status === "uploading" && (
          <div className="mt-1.5 h-1 bg-charcoal-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: "55%" }} />
          </div>
        )}
      </div>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
    </div>
  )
}

function StatPill({ label, value, warn, success, raw }: { label: string; value: number | string; warn?: boolean; success?: boolean; raw?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 text-center ${warn && Number(value) > 0 ? "bg-amber-bg" : success ? "bg-brand-light" : "bg-charcoal-50"}`}>
      <p className={`text-lg font-semibold font-mono ${warn && Number(value) > 0 ? "text-amber-field" : success ? "text-brand" : "text-charcoal"}`}>{value}</p>
      <p className="text-[10px] text-charcoal-400">{label}</p>
    </div>
  )
}
