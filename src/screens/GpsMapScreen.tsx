import { useState } from "react"

interface GpsMapScreenProps {
  onBack: () => void
  onSave: () => void
}

const POLYGON_POINTS = [
  { x: 140, y: 220 },
  { x: 200, y: 180 },
  { x: 255, y: 195 },
  { x: 280, y: 240 },
  { x: 268, y: 295 },
  { x: 230, y: 330 },
  { x: 175, y: 320 },
  { x: 138, y: 285 },
  { x: 130, y: 250 },
]

export default function GpsMapScreen({ onBack, onSave }: GpsMapScreenProps) {
  const [mode, setMode] = useState<"idle" | "walking" | "done">("idle")
  const [points, setPoints] = useState(0)
  const [saved, setSaved] = useState(false)

  const startWalk = () => {
    setMode("walking")
    let count = 0
    const interval = setInterval(() => {
      count++
      setPoints(count)
      if (count >= POLYGON_POINTS.length) {
        clearInterval(interval)
        setMode("done")
      }
    }, 600)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(onSave, 1200)
  }

  const polyStr = POLYGON_POINTS.slice(0, Math.max(2, points))
    .map(p => `${p.x},${p.y}`)
    .join(" ")

  return (
    <div className="flex-1 flex flex-col overflow-hidden screen-enter bg-charcoal">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-12 px-4 pb-3 bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Map farm</p>
            <p className="text-white/60 text-xs">Kiariga Main Farm</p>
          </div>
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-brand" />
          </div>
        </div>
      </div>

      {/* Map view */}
      <div className="flex-1 relative map-bg overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice">
          {/* Terrain features */}
          <ellipse cx="100" cy="150" rx="80" ry="50" fill="rgba(139,167,109,0.3)" />
          <ellipse cx="300" cy="350" rx="60" ry="40" fill="rgba(101,135,79,0.2)" />
          <path d="M0,300 Q50,280 100,300 Q150,320 200,300 Q250,280 300,295 Q350,310 390,300" stroke="rgba(70,130,180,0.4)" strokeWidth="3" fill="none" />
          <text x="60" y="155" fontSize="9" fill="rgba(30,60,20,0.5)" fontFamily="monospace">Pasture</text>
          <text x="255" y="355" fontSize="9" fill="rgba(30,60,20,0.5)" fontFamily="monospace">Brush</text>
          <text x="120" y="295" fontSize="9" fill="rgba(70,130,180,0.6)" fontFamily="monospace">Stream</text>

          {/* Farm polygon */}
          {points >= 2 && (
            <>
              <polygon
                points={POLYGON_POINTS.slice(0, points).map(p => `${p.x},${p.y}`).join(" ")}
                fill="rgba(26,92,53,0.18)"
                stroke="#1A5C35"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeDasharray={mode === "walking" ? "6,4" : "none"}
              />
              {mode === "done" && (
                <polygon
                  points={POLYGON_POINTS.map(p => `${p.x},${p.y}`).join(" ")}
                  fill="rgba(26,92,53,0.12)"
                  stroke="#1A5C35"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* Boundary points */}
          {POLYGON_POINTS.slice(0, points).map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="6" fill="white" stroke="#1A5C35" strokeWidth="2.5" />
              <circle cx={p.x} cy={p.y} r="2.5" fill="#1A5C35" />
            </g>
          ))}

          {/* Current position marker */}
          <g>
            <circle cx="205" cy="255" r="18" fill="rgba(26,92,53,0.15)" />
            <circle cx="205" cy="255" r="8" fill="#1A5C35" stroke="white" strokeWidth="3" />
            <circle cx="205" cy="255" r="4" fill="white" />
          </g>
        </svg>

        {/* Walking status overlay */}
        {mode === "walking" && (
          <div className="absolute top-24 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-3.5 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand pulse-dot" />
              <span className="text-xs font-semibold text-charcoal">Boundary recording</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Points" value={String(points)} />
              <Stat label="Distance" value={`${points * 51} m`} />
              <Stat label="Accuracy" value="±4 m" />
            </div>
          </div>
        )}

        {/* Done overlay */}
        {mode === "done" && !saved && (
          <div className="absolute top-24 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-3.5 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A5C35" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-xs font-semibold text-brand">Boundary captured</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <Stat label="Points" value="9" />
              <Stat label="Distance" value="463 m" />
              <Stat label="Accuracy" value="±4 m" />
            </div>
            <div className="bg-brand-muted border border-brand/10 rounded-xl px-3 py-2">
              <div className="flex justify-between">
                <span className="text-xs text-charcoal-500">GPS measured area</span>
                <span className="text-sm font-semibold font-mono text-brand">2.38 acres</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-charcoal-500">Farmer reported</span>
                <span className="text-xs font-mono text-charcoal">2.5 acres</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-charcoal-400">Variance</span>
                <span className="text-xs font-mono text-amber-field">−4.8% — confirm with farmer</span>
              </div>
            </div>
          </div>
        )}

        {saved && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A5C35" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-charcoal">Farm mapped</p>
              <p className="text-charcoal-500 text-sm mt-1">2.38 acres · 9 boundary points</p>
              <p className="text-brand text-xs font-medium mt-1">GPS accuracy: Good</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      {!saved && (
        <div className="bg-white px-4 py-5">
          {mode === "idle" && (
            <div className="flex flex-col gap-2.5">
              <button
                onClick={startWalk}
                className="w-full py-4 bg-brand text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="5" r="1"/><path d="M9 20l-1-4 3-3 1-5M15.5 20l-1.5-5-2-2"/><path d="M7 10l-2 1-1 4"/>
                </svg>
                Walk boundary
              </button>
              <div className="flex gap-2">
                <button className="flex-1 py-3 border border-charcoal-200 rounded-xl text-sm font-medium text-charcoal">Draw boundary</button>
                <button className="flex-1 py-3 border border-charcoal-200 rounded-xl text-sm font-medium text-charcoal">Capture point</button>
              </div>
            </div>
          )}

          {mode === "walking" && (
            <button
              onClick={() => { setPoints(POLYGON_POINTS.length); setMode("done") }}
              className="w-full py-4 bg-amber-500 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              Stop recording
            </button>
          )}

          {mode === "done" && (
            <div className="flex gap-2">
              <button
                onClick={() => { setMode("idle"); setPoints(0) }}
                className="flex-1 py-3.5 border border-charcoal-200 rounded-xl text-sm font-medium text-charcoal"
              >
                Redo
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] py-3.5 bg-brand text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                Save polygon
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold font-mono text-charcoal">{value}</p>
      <p className="text-[10px] text-charcoal-400">{label}</p>
    </div>
  )
}
