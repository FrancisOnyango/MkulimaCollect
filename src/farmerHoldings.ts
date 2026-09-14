import { type FarmBoundary, readFarmBoundary } from "./farmBoundary"

export const DRAFT_KEY = "mkulima:new-farmer:draft:v1"

export type FarmPin = {
  lat: number
  lng: number
  accuracy: number | null
}

export type DraftFarm = {
  id: string
  name: string
  tenure: string
  size: string
  irrigation: boolean | null
  pin: FarmPin | null
  boundary: FarmBoundary | null
  enterprises: string[]
}

export function newFarmId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `farm-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function emptyFarm(index: number): DraftFarm {
  return {
    id: newFarmId(),
    name: index === 0 ? "Main farm" : `Farm ${index + 1}`,
    tenure: "Owned",
    size: "",
    irrigation: null,
    pin: null,
    boundary: null,
    enterprises: [],
  }
}

export function readDraftValues(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.values && typeof parsed.values === "object" ? parsed.values as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

export function farmsFromDraft(values: Record<string, unknown> = readDraftValues()): DraftFarm[] {
  if (Array.isArray(values.farms) && values.farms.length > 0) {
    return (values.farms as DraftFarm[]).map((farm, index) => ({
      ...emptyFarm(index),
      ...farm,
      enterprises: Array.isArray(farm.enterprises) ? farm.enterprises : [],
    }))
  }

  const enterprises = Array.isArray(values.enterprises) ? values.enterprises as string[] : []
  const pin = values.farmPin && typeof values.farmPin === "object" ? values.farmPin as FarmPin : null
  const boundary = (values.farmBoundary as FarmBoundary | null) ?? readFarmBoundary()
  if (values.farmName || pin || enterprises.length || boundary) {
    return [{
      ...emptyFarm(0),
      id: "farm-1",
      name: String(values.farmName ?? "Main farm"),
      size: String(values.farmSize ?? ""),
      pin,
      boundary,
      enterprises,
    }]
  }

  return [emptyFarm(0)]
}

export function farmLinks(farms: DraftFarm[]) {
  return farms.flatMap(farm => farm.enterprises.map(sectorId => ({ farm, sectorId })))
}

export function persistFarms(farms: DraftFarm[], activeFarmId?: string) {
  const w = window as Window & { __mk_updateDraft?: (name: string, next: unknown) => void }
  w.__mk_updateDraft?.("farms", farms)
  if (activeFarmId) {
    w.__mk_updateDraft?.("activeFarmId", activeFarmId)
  }

  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    const data = raw ? JSON.parse(raw) : { step: 4, values: {} }
    data.values = { ...data.values, farms, ...(activeFarmId ? { activeFarmId } : {}) }
    data.updatedAt = new Date().toISOString()
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {
    // ignore storage errors
  }
}
