import { useEffect, useRef, useState } from "react"
import {
  buildBoundary,
  haversineMeters,
  perimeterMeters,
  projectPoints,
  readFarmBoundary,
  writeFarmBoundary,
  type BoundaryPoint,
} from "../farmBoundary"
import { isGpsAccurate, MAX_GPS_ACCURACY_M } from "../gpsAccuracy"
import { farmsFromDraft, persistFarms } from "../farmerHoldings"

interface GpsMapScreenProps {
  farmId?: string
  onBack: () => void
  onSave: () => void
}

export default function GpsMapScreen({ farmId, onBack, onSave }: GpsMapScreenProps) {
  const existing = readFarmBoundary(farmId)
  const [mode, setMode] = useState<"idle" | "walking" | "done">(existing ? "done" : "idle")
  const [points, setPoints] = useState<BoundaryPoint[]>(existing?.points ?? [])
  const [current, setCurrent] = useState<BoundaryPoint | null>(existing?.points.at(-1) ?? null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const watchId = useRef<number | null>(null)

  const stopWatch = () => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }

  useEffect(() => () => stopWatch(), [])

  const toPoint = (coords: GeolocationCoordinates): BoundaryPoint => ({
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: coords.accuracy ?? null,
    at: new Date().toISOString(),
  })

  const addPoint = (next: BoundaryPoint, force = false) => {
    if (!isGpsAccurate(next.accuracy)) {
      setError(`GPS accuracy must be ${MAX_GPS_ACCURACY_M} m or better. Wait and recapture.`)
      return
    }
    setCurrent(next)
    setPoints(existingPoints => {
      const last = existingPoints[existingPoints.length - 1]
      if (!force && last && haversineMeters(last, next) < 4) {
        return existingPoints
      }
      return [...existingPoints, next]
    })
  }

  const captureOnce = (force = true) => {
    if (!navigator.geolocation) {
      setError("This browser cannot capture GPS.")
      return
    }

    setError(null)
    navigator.geolocation.getCurrentPosition(
      position => addPoint(toPoint(position.coords), force),
      () => setError("Allow location access to walk the farm boundary."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const startWalk = () => {
    if (!navigator.geolocation) {
      setError("This browser cannot capture GPS.")
      return
    }

    setError(null)
    setPoints([])
    setMode("walking")
    captureOnce(true)
    watchId.current = navigator.geolocation.watchPosition(
      position => addPoint(toPoint(position.coords), false),
      () => setError("Location updates were blocked. Add points manually while you walk."),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const finishWalk = () => {
    stopWatch()
    if (points.length < 3) {
      setError("Walk or add at least 3 GPS points before closing the boundary.")
      setMode("walking")
      return
    }
    setMode("done")
  }

  const handleSave = () => {
    if (points.length < 3) {
      setError("A saved boundary needs at least 3 GPS points.")
      return
    }

    const boundary = buildBoundary(points)
    writeFarmBoundary(boundary, farmId)
    if (farmId) {
      persistFarms(farmsFromDraft().map(farm => farm.id === farmId ? { ...farm, boundary } : farm), farmId)
    }
    setSaved(true)
    setTimeout(onSave, 900)
  }

  const boundary = points.length >= 3 ? buildBoundary(points) : null
  const projected = projectPoints(current ? [...points, current] : points)
  const path = projectPoints(points)

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface">
      <div className="absolute top-0 left-0 right-0 z-20 pt-6 px-4 pb-3 bg-surface/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-charcoal-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-charcoal font-semibold text-sm">Map farm</p>
            <p className="text-charcoal-500 text-xs">Walk the perimeter</p>
          </div>
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-card border border-charcoal-100">
            <span className={`w-2 h-2 rounded-full ${mode === "walking" ? "bg-brand" : "bg-charcoal-300"}`} />
          </div>
        </div>
      </div>

      <div className="flex-1 relative map-bg overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 500" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="100" cy="150" rx="80" ry="50" fill="rgba(132,215,119,0.28)" />
          <ellipse cx="300" cy="350" rx="60" ry="40" fill="rgba(84,197,41,0.16)" />

          {path.length >= 2 && (
            <polygon
              points={path.map(point => `${point.x},${point.y}`).join(" ")}
              fill="rgba(84,197,41,0.16)"
              stroke="#54C529"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeDasharray={mode === "walking" ? "6,4" : "none"}
            />
          )}

          {path.map((point, index) => (
            <g key={`${point.x}-${index}`}>
              <circle cx={point.x} cy={point.y} r="6" fill="white" stroke="#54C529" strokeWidth="2.5" />
              <circle cx={point.x} cy={point.y} r="2.5" fill="#54C529" />
            </g>
          ))}

          {projected[projected.length - 1] && (
            <g>
              <circle cx={projected[projected.length - 1].x} cy={projected[projected.length - 1].y} r="18" fill="rgba(84,197,41,0.18)" />
              <circle cx={projected[projected.length - 1].x} cy={projected[projected.length - 1].y} r="8" fill="#54C529" stroke="white" strokeWidth="3" />
              <circle cx={projected[projected.length - 1].x} cy={projected[projected.length - 1].y} r="4" fill="white" />
            </g>
          )}
        </svg>

        {mode === "walking" && (
          <div className="absolute top-24 left-4 right-4 bg-card/95 backdrop-blur rounded-[22px] p-3.5 border border-charcoal-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand pulse-dot" />
              <span className="text-xs font-semibold text-charcoal">Boundary recording</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Points" value={String(points.length)} />
              <Stat label="Distance" value={`${points.length >= 2 ? Math.round(perimeterMeters(points)) : 0} m`} />
              <Stat label="Accuracy" value={current?.accuracy ? `±${Math.round(current.accuracy)} m` : "—"} />
            </div>
            {current && (
              <p className="text-[11px] font-mono text-charcoal-400 mt-2">{current.lat.toFixed(6)}, {current.lng.toFixed(6)}</p>
            )}
          </div>
        )}

        {mode === "done" && !saved && boundary && (
          <div className="absolute top-24 left-4 right-4 bg-card/95 backdrop-blur rounded-[22px] p-3.5 border border-charcoal-100">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#54C529" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-xs font-semibold text-brand">Boundary captured</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <Stat label="Points" value={String(boundary.points.length)} />
              <Stat label="Distance" value={`${boundary.distanceM} m`} />
              <Stat label="Accuracy" value={current?.accuracy ? `±${Math.round(current.accuracy)} m` : "—"} />
            </div>
            <div className="bg-brand-muted border border-brand/10 rounded-xl px-3 py-2">
              <div className="flex justify-between">
                <span className="text-xs text-charcoal-500">GPS measured area</span>
                <span className="text-sm font-semibold font-mono text-brand">{boundary.acres} acres</span>
              </div>
            </div>
          </div>
        )}

        {saved && boundary && (
          <div className="absolute inset-0 bg-surface/90 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-charcoal">Farm mapped</p>
              <p className="text-charcoal-500 text-sm mt-1">{boundary.acres} acres · {boundary.points.length} boundary points</p>
            </div>
          </div>
        )}
      </div>

      {!saved && (
        <div className="bg-card px-4 py-5 border-t border-charcoal-100">
          {error && <p className="text-xs text-red-field mb-3">{error}</p>}

          {mode === "idle" && (
            <div className="flex gap-2">
              <button type="button" onClick={onBack} className="flex-1 py-3.5 border border-charcoal-200 rounded-full text-sm font-medium text-charcoal">
                Skip for now
              </button>
              <button type="button" onClick={startWalk} className="flex-[2] py-3.5 bg-brand text-brand-ink rounded-full font-semibold text-sm">
                Walk boundary
              </button>
            </div>
          )}

          {mode === "walking" && (
            <div className="flex gap-2">
              <button type="button" onClick={() => { stopWatch(); onBack() }} className="flex-1 py-3.5 border border-charcoal-200 rounded-full text-sm font-medium text-charcoal">
                Skip for now
              </button>
              <button type="button" onClick={() => captureOnce(true)} className="flex-1 py-3.5 border border-charcoal-200 rounded-full text-sm font-medium text-charcoal">
                Add point
              </button>
              <button type="button" onClick={finishWalk} className="flex-[2] py-4 bg-amber-field text-brand-ink rounded-full font-semibold text-sm">
                Stop recording
              </button>
            </div>
          )}

          {mode === "done" && (
            <div className="flex gap-2">
              <button type="button" onClick={onBack} className="flex-1 py-3.5 border border-charcoal-200 rounded-full text-sm font-medium text-charcoal">
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => { setMode("idle"); setPoints([]); setError(null) }}
                className="flex-1 py-3.5 border border-charcoal-200 rounded-full text-sm font-medium text-charcoal"
              >
                Redo
              </button>
              <button type="button" onClick={handleSave} className="flex-[2] py-3.5 bg-brand text-brand-ink rounded-full text-sm font-semibold">
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
