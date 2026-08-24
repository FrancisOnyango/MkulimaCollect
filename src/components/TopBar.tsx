interface TopBarProps {
  title?: string
  subtitle?: string
  onBack?: () => void
  onSync?: () => void
  isOffline?: boolean
  rightContent?: React.ReactNode
}

export default function TopBar({ title, subtitle, onBack, onSync, isOffline, rightContent }: TopBarProps) {
  return (
    <div className="bg-white border-b border-charcoal-100 px-4 pt-12 pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-charcoal-50 -ml-2 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
          <div>
            {title && <h1 className="text-lg font-semibold text-charcoal leading-tight">{title}</h1>}
            {subtitle && <p className="text-xs text-charcoal-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rightContent}
          <ConnectivityDot isOffline={isOffline} onSync={onSync} />
        </div>
      </div>
    </div>
  )
}

function ConnectivityDot({ isOffline, onSync }: { isOffline?: boolean; onSync?: () => void }) {
  return (
    <button onClick={onSync} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-charcoal-50 hover:bg-charcoal-100 transition-colors">
      <span className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-500 pulse-dot" : "bg-brand"}`} />
      <span className="text-[11px] font-mono text-charcoal-500">{isOffline ? "Offline" : "Online"}</span>
    </button>
  )
}
