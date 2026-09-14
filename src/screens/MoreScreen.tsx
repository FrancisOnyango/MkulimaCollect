import { agent, workSummary } from "../data"
import ScreenHeader from "../components/ScreenHeader"
import StatusChip from "../components/StatusChip"

interface MoreScreenProps {
  onSync: () => void
  isOffline: boolean
  onToggleOffline: () => void
  onSignOut: () => void
}

export default function MoreScreen({ onSync, isOffline, onToggleOffline, onSignOut }: MoreScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto scroll-hidden bg-surface pb-28">
      <ScreenHeader
        title={agent.name}
        subtitle={`${agent.role} · ${agent.cluster}`}
        trailing={<StatusChip isOffline={isOffline} onClick={onSync} />}
      />

      <div className="px-5 py-5 flex flex-col gap-3">
        <div className="bg-card border border-charcoal-100 rounded-[24px] divide-y divide-charcoal-100">
          <button type="button" onClick={onSync} className="w-full px-4 py-3.5 text-left">
            <p className="text-sm font-medium text-charcoal">Sync</p>
            <p className="text-xs text-charcoal-400 mt-0.5">{workSummary.queued} records waiting</p>
          </button>
          <div className="px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-charcoal">Connection</p>
              <p className="text-xs text-charcoal-400 mt-0.5">
                {isOffline ? "Work is saved on this device" : "Online"}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleOffline}
              className="text-xs px-3 py-1.5 rounded-full font-medium bg-brand-light text-brand"
            >
              {isOffline ? "Go online" : "Go offline"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full py-3.5 border border-charcoal-100 rounded-full text-sm font-medium text-charcoal-500"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
