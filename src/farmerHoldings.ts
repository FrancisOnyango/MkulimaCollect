import { type FarmBoundary, readFarmBoundary } from "./farmBoundary"

export const DRAFT_KEY = "mkulima:new-farmer:draft:v1"

export type FarmPin = {
  lat: number
  lng: number
  accuracy: number | null
}

export type DraftPlot = {
  id: string
  name: string
  unitType: string
  enterprises: string[]
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
  plots: DraftPlot[]
}

export function newFarmId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `farm-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function newPlotId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `plot-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function emptyPlot(index: number): DraftPlot {
  return {
    id: newPlotId(),
    name: index === 0 ? "Main plot" : `Plot ${index + 1}`,
    unitType: "open_field",
    enterprises: [],
  }
}

function normalizePlots(farm: Partial<DraftFarm>): DraftPlot[] {
  if (Array.isArray(farm.plots) && farm.plots.length) {
    return farm.plots.map((plot, index) => ({
      ...emptyPlot(index),
      ...plot,
      enterprises: Array.isArray(plot.enterprises) ? plot.enterprises : [],
    }))
  }
  const enterprises = Array.isArray(farm.enterprises) ? farm.enterprises : []
  return [{ ...emptyPlot(0), enterprises }]
}

function flattenEnterprises(plots: DraftPlot[]) {
  return [...new Set(plots.flatMap(plot => plot.enterprises))]
}

export function emptyFarm(index: number): DraftFarm {
  const plots = [emptyPlot(0)]
  return {
    id: newFarmId(),
    name: index === 0 ? "Main farm" : `Farm ${index + 1}`,
    tenure: "Owned",
    size: "",
    irrigation: null,
    pin: null,
    boundary: null,
    plots,
    enterprises: flattenEnterprises(plots),
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
    return (values.farms as DraftFarm[]).map((farm, index) => {
      const plots = normalizePlots(farm)
      return {
        ...emptyFarm(index),
        ...farm,
        plots,
        enterprises: flattenEnterprises(plots),
      }
    })
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
      plots: normalizePlots({ enterprises }),
      enterprises,
    }]
  }

  return [emptyFarm(0)]
}

export function farmLinks(farms: DraftFarm[]) {
  return farms.flatMap(farm => {
    const plots = normalizePlots(farm)
    return plots.flatMap(plot => plot.enterprises.map(sectorId => ({ farm, plot, sectorId })))
  })
}

export function mergeDraftFarms(primary: unknown, secondary: unknown): DraftFarm[] {
  const list = (value: unknown) => (Array.isArray(value) ? value as DraftFarm[] : [])
  const byId = new Map<string, DraftFarm>()
  for (const farm of [...list(secondary), ...list(primary)]) {
    if (!farm || typeof farm !== "object" || !farm.id) continue
    const prev = byId.get(farm.id)
    if (!prev) {
      byId.set(farm.id, farm)
      continue
    }
    byId.set(farm.id, {
      ...prev,
      ...farm,
      name: farm.name?.trim() ? farm.name : prev.name,
      tenure: farm.tenure || prev.tenure,
      size: farm.size || prev.size,
      irrigation: farm.irrigation ?? prev.irrigation,
      pin: farm.pin ?? prev.pin,
      boundary: farm.boundary ?? prev.boundary,
      plots: normalizePlots({ ...prev, ...farm }),
      enterprises: flattenEnterprises(normalizePlots({ ...prev, ...farm })),
    })
  }
  const merged = [...byId.values()]
  return merged.length ? merged : list(primary).length ? list(primary) : list(secondary)
}

export function persistFarms(farms: DraftFarm[], activeFarmId?: string) {
  const w = window as Window & { __mk_updateDraft?: (name: string, next: unknown) => void }
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    const data = raw ? JSON.parse(raw) : { step: 4, values: {} }
    const merged = mergeDraftFarms(farms, data.values?.farms)
    data.values = { ...data.values, farms: merged, ...(activeFarmId ? { activeFarmId } : {}) }
    data.updatedAt = new Date().toISOString()
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    w.__mk_updateDraft?.("farms", merged)
    if (activeFarmId) {
      w.__mk_updateDraft?.("activeFarmId", activeFarmId)
    }
  } catch {
    w.__mk_updateDraft?.("farms", farms)
    if (activeFarmId) {
      w.__mk_updateDraft?.("activeFarmId", activeFarmId)
    }
  }
}
