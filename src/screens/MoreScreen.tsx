interface MoreScreenProps {
  onSync: () => void
  isOffline: boolean
  onToggleOffline: () => void
}

export default function MoreScreen({ onSync, isOffline, onToggleOffline }: MoreScreenProps) {
  return (
    <div className="flex-1 overflow-y-auto scroll-hidden bg-surface pb-24">
      {/* Agent profile */}
      <div className="bg-white pt-14 pb-6 px-5 border-b border-charcoal-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center">
            <span className="text-white text-xl font-bold">FO</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-charcoal">Francis O.</h1>
            <p className="text-sm text-charcoal-500">Field Agent</p>
            <p className="text-xs font-mono text-charcoal-300 mt-0.5">Kiambu Cluster 04 · AGT-00284</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <AgentStat label="Assigned" value="183" />
          <AgentStat label="Complete" value="121" accent />
          <AgentStat label="Unsynced" value="17" warn />
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-3">
        {/* Sync */}
        <MenuSection title="Synchronisation">
          <MenuItem
            icon="↑"
            label="Sync Centre"
            detail="17 records waiting"
            badge={isOffline ? "Offline" : "Ready"}
            badgeColor={isOffline ? "amber" : "green"}
            onPress={onSync}
          />
          <MenuItem icon="⏱" label="Last sync" detail="Today at 10:42 AM" />
        </MenuSection>

        {/* Device */}
        <MenuSection title="Device">
          <MenuItem icon="🔒" label="Session" detail="Active · Expires in 7h 22m" />
          <MenuItem icon="📱" label="Device ID" detail="DEV-KE-08842" mono />
          <MenuItem icon="📶" label="Connectivity" detail={isOffline ? "Offline — work saved locally" : "Online · 4G"} action={
            <button
              onClick={onToggleOffline}
              className={`text-xs px-3 py-1 rounded-full font-medium ${isOffline ? "bg-brand-light text-brand" : "bg-charcoal-50 text-charcoal-500"}`}
            >
              {isOffline ? "Go online" : "Simulate offline"}
            </button>
          } />
          <MenuItem icon="💾" label="Local storage" detail="284 MB used of 4 GB" />
        </MenuSection>

        {/* Account */}
        <MenuSection title="Account & settings">
          <MenuItem icon="👤" label="My profile" detail="View agent account" />
          <MenuItem icon="🌍" label="Language" detail="English" />
          <MenuItem icon="🔑" label="Change PIN" detail="Security settings" />
          <MenuItem icon="📖" label="Help & training" detail="Field agent guide" />
          <MenuItem icon="ℹ" label="App version" detail="MkulimaCollect 2.4.1" />
        </MenuSection>

        <button className="w-full py-3.5 border border-charcoal-200 rounded-xl text-sm font-medium text-charcoal-500">
          Sign out
        </button>
      </div>
    </div>
  )
}

function AgentStat({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 text-center ${accent ? "bg-brand-light" : warn ? "bg-amber-bg" : "bg-charcoal-50"}`}>
      <p className={`text-lg font-semibold font-mono ${accent ? "text-brand" : warn ? "text-amber-field" : "text-charcoal"}`}>{value}</p>
      <p className="text-[10px] text-charcoal-400">{label}</p>
    </div>
  )
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-2 px-1">{title}</p>
      <div className="bg-white border border-charcoal-100 rounded-2xl divide-y divide-charcoal-50">
        {children}
      </div>
    </div>
  )
}

function MenuItem({ icon, label, detail, badge, badgeColor, mono, onPress, action }: {
  icon: string; label: string; detail?: string; badge?: string; badgeColor?: "amber" | "green";
  mono?: boolean; onPress?: () => void; action?: React.ReactNode
}) {
  return (
    <button onClick={onPress} className="flex items-center gap-3 px-4 py-3.5 w-full text-left">
      <span className="w-7 h-7 flex items-center justify-center text-base flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        {detail && <p className={`text-xs mt-0.5 truncate ${mono ? "font-mono text-charcoal-400" : "text-charcoal-400"}`}>{detail}</p>}
      </div>
      {action || (badge && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badgeColor === "green" ? "bg-brand-light text-brand" : "bg-amber-bg text-amber-field"}`}>{badge}</span>
      ))}
      {!action && !badge && onPress && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </button>
  )
}
