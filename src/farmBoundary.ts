export type BoundaryPoint = {
  lat: number
  lng: number
  accuracy: number | null
  at: string
}

export type FarmBoundary = {
  points: BoundaryPoint[]
  acres: number
  distanceM: number
}

export const FARM_BOUNDARY_KEY = "mkulima:farm-boundary"

export function boundaryStorageKey(farmId?: string) {
  return farmId ? `${FARM_BOUNDARY_KEY}:${farmId}` : FARM_BOUNDARY_KEY
}

export function readFarmBoundary(farmId?: string): FarmBoundary | null {
  try {
    const raw = localStorage.getItem(boundaryStorageKey(farmId)) ?? (farmId ? null : localStorage.getItem(FARM_BOUNDARY_KEY))
    if (!raw) return null
    const parsed = JSON.parse(raw) as FarmBoundary
    if (!Array.isArray(parsed.points) || parsed.points.length < 3) return null
    return parsed
  } catch {
    return null
  }
}

export function writeFarmBoundary(boundary: FarmBoundary, farmId?: string) {
  localStorage.setItem(boundaryStorageKey(farmId), JSON.stringify(boundary))
}

export function clearFarmBoundary(farmId?: string) {
  localStorage.removeItem(boundaryStorageKey(farmId))
}

export function clearAllFarmBoundaries() {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(FARM_BOUNDARY_KEY)) keys.push(key)
  }
  keys.forEach(key => localStorage.removeItem(key))
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function perimeterMeters(points: { lat: number; lng: number }[]) {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineMeters(points[i], points[i + 1])
  }
  if (points.length >= 3) {
    total += haversineMeters(points[points.length - 1], points[0])
  }
  return total
}

export function shoelaceAcres(points: { lat: number; lng: number }[]) {
  if (points.length < 3) return 0
  const origin = points[0]
  const latScale = 111320
  const lngScale = 111320 * Math.cos((origin.lat * Math.PI) / 180)
  const meters = points.map(point => ({
    x: (point.lng - origin.lng) * lngScale,
    y: (point.lat - origin.lat) * latScale,
  }))

  let area = 0
  for (let i = 0; i < meters.length; i++) {
    const next = meters[(i + 1) % meters.length]
    area += meters[i].x * next.y - next.x * meters[i].y
  }

  return Math.abs(area) / 2 / 4046.8564224
}

export function buildBoundary(points: BoundaryPoint[]): FarmBoundary {
  return {
    points,
    acres: Number(shoelaceAcres(points).toFixed(2)),
    distanceM: Math.round(perimeterMeters(points)),
  }
}

export function projectPoints(
  points: { lat: number; lng: number }[],
  width = 390,
  height = 500,
  padding = 48,
) {
  if (!points.length) return []

  const lats = points.map(point => point.lat)
  const lngs = points.map(point => point.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = Math.max(maxLat - minLat, 0.00008)
  const lngSpan = Math.max(maxLng - minLng, 0.00008)

  return points.map(point => ({
    x: padding + ((point.lng - minLng) / lngSpan) * (width - padding * 2),
    y: padding + ((maxLat - point.lat) / latSpan) * (height - padding * 2),
  }))
}
