import { useState } from "react"

interface HomeScreenProps {
  isOffline: boolean
  onNavigateSync: () => void
  onCollect: () => void
}

export default function HomeScreen({ isOffline, onNavigateSync, onCollect }: HomeScreenProps) {
  const [syncing, setSyncing] = useState(false)

  const handleSync = () => {
    if (isOffline) return
    setSyncing(true)
    setTimeout(() => setSyncing(false), 2800)
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-hidden bg-surface pb-24">
      {/* Header */}
      <div className="bg-white pt-14 pb-5 px-5 border-b border-charcoal-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-charcoal-500 mb-0.5 font-medium">Good morning,</p>
            <h1 className="text-2xl font-semibold text-charcoal">Francis O.</h1>
            <p className="text-sm text-charcoal-500 mt-1">Kiambu · Cluster 04 · Field Agent</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onNavigateSync}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-charcoal-50 hover:bg-charcoal-100 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-500 pulse-dot" : "bg-brand"}`} />
              <span className="text-[11px] font-mono text-charcoal-500">{isOffline ? "Offline" : "Online"}</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center">
              <span className="text-white text-sm font-semibold">FO</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-4">

        {/* Today's work */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Today</h2>
            <span className="text-xs font-mono text-charcoal-300">19 Aug 2026</span>
          </div>
          <div className="bg-white rounded-2xl border border-charcoal-100 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-y divide-charcoal-100">
              <StatCell label="Assigned" value="12" accent={false} />
              <StatCell label="Completed" value="7" accent={true} />
              <StatCell label="In progress" value="2" amber={true} />
              <StatCell label="Pending" value="3" accent={false} />
            </div>
          </div>
        </section>

        {/* Sync banner */}
        <div className={`rounded-2xl p-4 border ${isOffline ? "bg-amber-bg border-amber-200" : "bg-white border-charcoal-100"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOffline ? "bg-amber-500 pulse-dot" : "bg-brand"}`} />
                <p className="text-sm font-semibold text-charcoal">
                  {isOffline ? "Working offline" : "17 records waiting to sync"}
                </p>
              </div>
              {isOffline ? (
                <p className="text-xs text-charcoal-500 ml-4">Your work is saved on this device.</p>
              ) : (
                <div className="ml-4 space-y-0.5">
                  <p className="text-xs text-charcoal-500">4 photos pending · Last sync: 10:42 AM</p>
                  {syncing && (
                    <div className="mt-2 w-full h-1 bg-charcoal-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isOffline && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-3 py-2 bg-brand text-white text-xs font-semibold rounded-xl active:scale-95 transition-all disabled:opacity-60 flex-shrink-0"
              >
                {syncing ? "Syncing…" : "Sync now"}
              </button>
            )}
          </div>
        </div>

        {/* Farmer onboarding summary */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Farmer onboarding</h2>
          </div>
          <div className="bg-white rounded-2xl border border-charcoal-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-charcoal-50 flex items-center justify-between">
              <span className="text-sm font-medium text-charcoal">Assigned farmers</span>
              <span className="text-xl font-semibold font-mono text-charcoal">183</span>
            </div>
            <div className="grid grid-cols-2">
              <OnboardingRow label="Complete" value={121} color="text-brand" />
              <OnboardingRow label="Incomplete" value={42} color="text-amber-field" />
              <OnboardingRow label="Needs correction" value={6} color="text-red-field" />
              <OnboardingRow label="Not started" value={14} color="text-charcoal-500" />
            </div>
          </div>
        </section>

        {/* Data quality queue */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Quality queue</h2>
          </div>
          <div className="bg-white rounded-2xl border border-charcoal-100 divide-y divide-charcoal-50">
            <QualityIssue icon="📍" label="4 profiles missing GPS" />
            <QualityIssue icon="📄" label="3 records need evidence" />
            <QualityIssue icon="⚠" label="2 duplicate candidates" />
            <QualityIssue icon="↩" label="6 records returned by QA" />
            <div className="px-4 py-3">
              <button className="text-sm text-brand font-semibold">Review issues →</button>
            </div>
          </div>
        </section>

        {/* Quick collect */}
        <button
          onClick={onCollect}
          className="w-full bg-brand text-white rounded-2xl py-4 px-5 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div>
            <p className="font-semibold text-sm">Start new farmer</p>
            <p className="text-white/60 text-xs mt-0.5">Begin onboarding a farmer</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
        </button>

      </div>
    </div>
  )
}

function StatCell({ label, value, accent, amber }: { label: string; value: string; accent?: boolean; amber?: boolean }) {
  return (
    <div className="px-4 py-4 flex flex-col items-start">
      <span className={`text-2xl font-semibold font-mono ${accent ? "text-brand" : amber ? "text-amber-field" : "text-charcoal"}`}>{value}</span>
      <span className="text-xs text-charcoal-500 mt-1">{label}</span>
    </div>
  )
}

function OnboardingRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-charcoal-50">
      <span className="text-xs text-charcoal-500">{label}</span>
      <span className={`text-sm font-semibold font-mono ${color}`}>{value}</span>
    </div>
  )
}

function QualityIssue({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <span className="text-sm">{icon}</span>
      <span className="text-sm text-charcoal">{label}</span>
    </div>
  )
}
