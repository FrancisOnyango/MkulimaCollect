import { useState } from "react"
import ScreenHeader from "../components/ScreenHeader"
import StatusChip from "../components/StatusChip"

interface SyncScreenProps {
  onBack: () => void
  isOffline: boolean
}

type SyncStatus = "queued" | "uploading" | "synced" | "retry"

interface SyncItem {
  id: string
  farmer: string
  type: string
  status: SyncStatus
}

const initialItems: SyncItem[] = [
  { id: "1", farmer: "Mary Wanjiku", type: "Farmer record", status: "synced" },
  { id: "2", farmer: "Peter Mwangi", type: "Farmer record", status: "queued" },
  { id: "3", farmer: "Peter Mwangi", type: "ID photograph", status: "queued" },
  { id: "4", farmer: "Alice Waweru", type: "Farmer record", status: "queued" },
  { id: "5", farmer: "James Kamau", type: "Farmer record", status: "retry" },
]

export default function SyncScreen({ onBack, isOffline }: SyncScreenProps) {
  const [items, setItems] = useState(initialItems)
  const [syncing, setSyncing] = useState(false)

  const pending = items.filter(item => item.status !== "synced").length

  const sync = () => {
    if (isOffline) return
    setSyncing(true)
    let delay = 0
    items.forEach(item => {
      if (item.status === "queued" || item.status === "retry") {
        delay += 500
        setTimeout(() => {
          setItems(prev => prev.map(row => row.id === item.id ? { ...row, status: "uploading" } : row))
          setTimeout(() => {
            setItems(prev => prev.map(row => row.id === item.id ? { ...row, status: "synced" } : row))
          }, 700)
        }, delay)
      }
    })
    setTimeout(() => setSyncing(false), delay + 900)
  }

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden min-h-0">
      <ScreenHeader
        title="Sync"
        subtitle={isOffline ? "Saved on this device" : `${pending} waiting`}
        onBack={onBack}
        trailing={<StatusChip isOffline={isOffline} />}
      />

      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={sync}
          disabled={isOffline || syncing || pending === 0}
          className="w-full py-3.5 bg-brand text-brand-ink rounded-full text-sm font-semibold disabled:opacity-50"
        >
          {isOffline ? "Connect to sync" : syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-4 pb-28 flex flex-col gap-2">
        {items.map(item => (
          <div key={item.id} className="bg-card border border-charcoal-100 rounded-[22px] px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">{item.farmer}</p>
              <p className="text-xs text-charcoal-400">{item.type}</p>
            </div>
            <span className={`text-xs font-medium ${
              item.status === "synced" ? "text-brand" :
              item.status === "retry" ? "text-red-field" :
              item.status === "uploading" ? "text-charcoal" : "text-charcoal-400"
            }`}>
              {item.status === "queued" ? "Queued" : item.status === "uploading" ? "Uploading" : item.status === "retry" ? "Retry" : "Synced"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
