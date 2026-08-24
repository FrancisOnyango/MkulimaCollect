import { useState, useEffect } from "react"

interface SubmitSuccessScreenProps {
  onDone: () => void
}

export default function SubmitSuccessScreen({ onDone }: SubmitSuccessScreenProps) {
  const [phase, setPhase] = useState<"saved" | "syncing" | "synced">("saved")

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("syncing"), 1800)
    const t2 = setTimeout(() => setPhase("synced"), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface px-6 screen-enter">
      {phase === "saved" && (
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A5C35" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-2xl font-semibold text-charcoal mb-2">Saved</h2>
          <p className="text-charcoal-500 text-sm mb-1">Farmer profile saved to device</p>
          <p className="text-charcoal-400 text-xs font-mono">Waiting to sync…</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-charcoal-300">
            <div className="w-2 h-2 rounded-full bg-amber-400 pulse-dot" />
            <span>Offline — your work is saved on this device</span>
          </div>
        </div>
      )}

      {phase === "syncing" && (
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <svg className="animate-spin" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-charcoal mb-2">Syncing</h2>
          <p className="text-charcoal-500 text-sm mb-1">Connectivity restored</p>
          <p className="text-charcoal-400 text-xs font-mono">Uploading farmer record…</p>
          <div className="mt-6 w-full max-w-[240px] mx-auto">
            <div className="h-1.5 bg-charcoal-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "65%", transition: "width 2s linear" }} />
            </div>
          </div>
        </div>
      )}

      {phase === "synced" && (
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand/30">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-2xl font-semibold text-charcoal mb-2">Farmer profile submitted</h2>
          <div className="bg-charcoal-50 rounded-2xl px-6 py-4 mt-4 inline-block">
            <p className="font-mono text-sm text-charcoal font-semibold">MS-KE-004829</p>
            <p className="text-xs text-charcoal-400 mt-1 font-mono">19 Aug 2026 · 14:42</p>
          </div>
          <p className="text-brand text-sm font-medium mt-4">Synced successfully</p>
          <p className="text-charcoal-400 text-xs mt-1">Record uploaded to MkulimaScore platform</p>
          <button
            onClick={onDone}
            className="mt-8 px-10 py-3.5 bg-brand text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
