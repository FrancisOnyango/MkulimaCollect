import { useState, useRef, useEffect } from "react"
import { clearAllFarmBoundaries } from "../farmBoundary"
import { emptyFarm, farmLinks, farmsFromDraft, persistFarms, readDraftValues, type DraftFarm } from "../farmerHoldings"
import { isGpsAccurate, MAX_GPS_ACCURACY_M } from "../gpsAccuracy"
import { hashIdentifier, lastDigits } from "../pii"
import { getWebSector, webSectors } from "../sectors"

interface NewFarmerScreenProps {
  onBack: () => void
  onGpsMap: (farmId: string) => void
  onComplete: () => void
}

const STEPS = [
  "Consent",
  "Identity",
  "Location",
  "Membership",
  "Farms",
  "Enterprises",
  "Sector details",
  "Financial",
  "Review",
]

export default function NewFarmerScreen({ onBack, onGpsMap, onComplete }: NewFarmerScreenProps) {
  const [step, setStep] = useState(0)

  // Autosave draft state stored in localStorage under this key
  const DRAFT_KEY = "mkulima:new-farmer:draft:v1"
  const mounted = useRef(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [showRestore, setShowRestore] = useState(false)

  const defaultDraft = useRef<any>({ step: 0, values: {} })

  // Load draft on mount
  useEffect(() => {
    mounted.current = true
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (data && typeof data === "object") {
          defaultDraft.current = data
          setStep(data.step || 0)
          setDraftSavedAt(data.updatedAt || null)
          setHasDraft(true)
          setShowRestore(true)
        }
      }
    } catch (e) {
      // ignore parse errors
    }

    return () => { mounted.current = false }
  }, [])

  // Helper to persist current draft object
  const saveDraft = (partial?: Record<string, unknown>) => {
    void persistDraft(partial)
  }

  const persistDraft = async (partial?: Record<string, unknown>) => {
    try {
      const cur = { ...defaultDraft.current }
      if (partial) {
        cur.values = { ...cur.values, ...partial }
      }
      if (typeof cur.values.idNumber === "string" && cur.values.idNumber.trim()) {
        cur.values.nationalIdHash = await hashIdentifier(cur.values.idNumber, "national-id")
        cur.values.nationalIdLast3 = lastDigits(cur.values.idNumber, 3)
        delete cur.values.idNumber
      }
      if (typeof cur.values.primaryPhone === "string" && cur.values.primaryPhone.trim()) {
        cur.values.primaryPhoneHash = await hashIdentifier(cur.values.primaryPhone, "phone")
        cur.values.primaryPhoneLast4 = lastDigits(cur.values.primaryPhone, 4)
      }
      cur.step = step
      cur.updatedAt = new Date().toISOString()
      defaultDraft.current = cur
      localStorage.setItem(DRAFT_KEY, JSON.stringify(cur))
      setDraftSavedAt(cur.updatedAt)
      setHasDraft(true)
    } catch {
      // ignore storage errors (private mode, quota)
    }
  }

  // Periodic autosave
  useEffect(() => {
    const id = setInterval(() => {
      if (!mounted.current) return
      saveDraft()
    }, 5000)
    return () => clearInterval(id)
  }, [step])

  // Expose a method to update draft values from child fields via Field onValueChange
  const updateDraftValue = (name: string, value: any) => {
    saveDraft({ [name]: value })
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch (e) {
      // ignore storage errors
    }
    defaultDraft.current = { step: 0, values: {} }
    setStep(0)
    setHasDraft(false)
    setShowRestore(false)
    setDraftSavedAt(null)
    try {
      clearAllFarmBoundaries()
    } catch {
      // ignore
    }
  }

  // Attach a global updater for the Field helper to call when present
  useEffect(() => {
    const w = window as Window & { __mk_updateDraft?: (key: string, value: any) => void }
    w.__mk_updateDraft = updateDraftValue
    return () => { w.__mk_updateDraft = undefined }
  }, [step])

  // Step validators can register here. If a validator for the current step exists and returns false,
  // navigation forward will be blocked and the step is expected to show inline validation messages.
  const validatorsRef = { current: {} as Record<number, () => boolean> }

  const registerValidator = (stepIndex: number, fn: () => boolean) => {
    validatorsRef.current[stepIndex] = fn
  }

  const next = () => {
    const validator = validatorsRef.current[step]
    if (validator && !validator()) {
      // validation failed; don't progress
      return
    }

    if (step === STEPS.length - 1) {
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const prev = () => {
    if (step === 0) onBack()
    else setStep(s => s - 1)
  }

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden min-h-0">
      <div className="bg-card border-b border-charcoal-100">
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <button type="button" onClick={prev} aria-label="Go back" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-charcoal-50 -ml-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-charcoal">{STEPS[step]}</p>
            <p className="text-xs text-charcoal-400">Step {step + 1} of {STEPS.length}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Save and exit? Your progress will be kept as a draft.")) onBack()
            }}
            aria-label="Save and exit"
            className="text-xs text-charcoal-500"
          >
            Exit
          </button>
        </div>
        <div className="px-5 pb-4">
          <div className="flex gap-1">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 h-1 rounded-full ${
                  i < step ? "bg-brand" : i === step ? "bg-brand/50" : "bg-charcoal-100"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {showRestore && hasDraft && (
        <div className="px-5 pt-4">
          <div className="rounded-xl border border-charcoal-100 bg-card p-3 flex items-center justify-between gap-3">
            <p className="text-xs text-charcoal-500">
              Draft restored{draftSavedAt ? ` · ${new Date(draftSavedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}
            </p>
            <button type="button" onClick={clearDraft} className="text-xs font-medium text-brand">
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto scroll-hidden">
        {step === 0 && <ConsentStep />}
        {step === 1 && <IdentityStep registerValidator={registerValidator} />}
        {step === 2 && <LocationStep />}
        {step === 3 && <MembershipStep />}
        {step === 4 && <FarmStep onMapFarm={farmId => { saveDraft(); onGpsMap(farmId) }} registerValidator={registerValidator} />}
        {step === 5 && <EnterpriseStep registerValidator={registerValidator} />}
        {step === 6 && <SectorDetailsStep registerValidator={registerValidator} />}
        {step === 7 && <FinancialStep />}
        {step === 8 && <ReviewStep onEdit={(s) => setStep(s)} />}
      </div>

      {/* Bottom actions */}
      {step < STEPS.length - 1 ? (
        <div className="bg-card border-t border-charcoal-100 px-5 py-4 flex gap-3">
          <button
            onClick={prev}
            className="flex-1 py-3.5 border border-charcoal-200 rounded-full text-sm font-semibold text-charcoal active:scale-[0.98] transition-transform"
          >
            Back
          </button>
          <button
            onClick={next}
            className="flex-[2] py-3.5 bg-brand text-brand-ink rounded-full text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="bg-card border-t border-charcoal-100 px-5 py-4">
          <button
            onClick={onComplete}
            className="w-full py-4 bg-brand text-brand-ink rounded-full text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            Submit farmer profile
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step components ────────────────────────────────────────────

function ConsentStep() {
  const [checks, setChecks] = useState([false, false, false, false, false])
  const toggle = (i: number) => setChecks(c => c.map((v, idx) => idx === i ? !v : v))

  const items = [
    "Farmer understands the purpose of data collection",
    "Farmer agrees to data collection",
    "Farmer agrees to GPS / farm boundary mapping",
    "Farmer agrees to relevant cooperative / SACCO records being used",
    "Farmer agrees to sharing permitted assessment information with approved financing partners",
  ]

  return (
    <div className="px-5 py-5 flex flex-col gap-5 pb-4">
      <div className="bg-brand-muted border border-brand/10 rounded-2xl p-4">
        <p className="text-sm text-charcoal leading-relaxed">
          MkulimaScore uses information about the farmer, farm, production and financial activity to create agricultural financial-readiness and risk intelligence for approved financial partners.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3">Consent items</p>
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="flex items-start gap-3 text-left"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                checks[i] ? "bg-brand border-brand" : "border-charcoal-300"
              }`}>
                {checks[i] && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 6 5 9 10 3"/>
                  </svg>
                )}
              </div>
              <span className="text-sm text-charcoal leading-snug">{item}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border border-charcoal-100 rounded-2xl p-4 bg-card">
        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3">Additional consent</p>
        <button
          onClick={() => {}}
          className="flex items-start gap-3 text-left w-full"
        >
          <div className="w-5 h-5 rounded-md border-2 border-charcoal-300 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-charcoal">Authorize M-PESA statement processing (optional)</span>
        </button>
      </div>

      <div className="bg-charcoal-50 rounded-xl px-4 py-3">
        <p className="text-xs text-charcoal-500 leading-relaxed">
          <strong className="text-charcoal">Important:</strong> A MkulimaScore assessment does not guarantee that a lender will approve a loan. Farmer may request correction or withdrawal of consent where applicable.
        </p>
      </div>

      <ConsentCapture />
    </div>
  )
}

function ConsentCapture() {
  return (
    <div className="bg-card border border-charcoal-100 rounded-2xl p-4">
      <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3">Consent record</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-charcoal-500 mb-1 block">Date</label>
          <div className="bg-charcoal-50 rounded-lg px-3 py-2 text-sm font-mono text-charcoal">19 Aug 2026</div>
        </div>
        <div>
          <label className="text-xs text-charcoal-500 mb-1 block">Time</label>
          <div className="bg-charcoal-50 rounded-lg px-3 py-2 text-sm font-mono text-charcoal">09:14 AM</div>
        </div>
        <div>
          <label className="text-xs text-charcoal-500 mb-1 block">Language</label>
          <div className="bg-charcoal-50 rounded-lg px-3 py-2 text-sm text-charcoal">Kikuyu</div>
        </div>
        <div>
          <label className="text-xs text-charcoal-500 mb-1 block">Agent GPS</label>
          <div className="bg-charcoal-50 rounded-lg px-3 py-2 text-xs font-mono text-charcoal">±6 m</div>
        </div>
      </div>
      <div className="mt-3">
        <label className="text-xs text-charcoal-500 mb-1.5 block">Farmer signature</label>
        <div className="h-20 bg-charcoal-50 rounded-xl border-2 border-dashed border-charcoal-200 flex items-center justify-center">
          <p className="text-xs text-charcoal-300">Tap to capture signature</p>
        </div>
      </div>
      <button className="mt-3 w-full py-2.5 border border-charcoal-200 rounded-xl text-xs text-charcoal-500 flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
        Photograph signed consent
      </button>
    </div>
  )
}

function IdentityStep({ registerValidator }: { registerValidator?: (stepIndex: number, fn: () => boolean) => void }) {
  const [idType, setIdType] = useState("National ID")
  const [gender, setGender] = useState("")

  // Controlled fields for validation
  const [fullName, setFullName] = useState("")
  const [firstName, setFirstName] = useState("Mary")
  const [surname, setSurname] = useState("Wanjiku")
  const [preferredName, setPreferredName] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [dob, setDob] = useState("")
  const [primaryPhone, setPrimaryPhone] = useState("")
  const [altPhone, setAltPhone] = useState("")

  const [errors, setErrors] = useState<Record<string,string>>({})

  // Register a validator for this step so parent can call it before advancing
  // Validator returns true when the step is valid
  if (registerValidator) {
    registerValidator(1, () => {
      const nextErrors: Record<string,string> = {}
      // Basic validations
      if (!fullName.trim() && (!firstName.trim() || !surname.trim())) {
        nextErrors.name = "Enter the farmer's name"
      }
      if (!idNumber.trim()) nextErrors.idNumber = "Enter ID number"
      if (!primaryPhone.trim()) nextErrors.primaryPhone = "Enter primary phone"

      setErrors(nextErrors)
      return Object.keys(nextErrors).length === 0
    })
  }

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <Field name="fullName" label="Full legal name" placeholder="As per official document" value={fullName} onValueChange={setFullName} required />
      {errors.name && <p className="text-xs text-red-field">{errors.name}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Field name="firstName" label="First name" placeholder="First name" value={firstName} onValueChange={setFirstName} required />
        <Field name="surname" label="Surname" placeholder="Surname" value={surname} onValueChange={setSurname} required />
      </div>

      <Field name="preferredName" label="Preferred name" placeholder="If different from above" value={preferredName} onValueChange={setPreferredName} />

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">ID type</label>
        <div className="flex gap-2">
          {['National ID', 'Passport', 'Alien ID'].map(t => (
            <button
              key={t}
              onClick={() => setIdType(t)}
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                idType === t ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal-500 border-charcoal-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Field name="idNumber" label="ID number" placeholder="Enter ID number" type="text" hint="Will be masked after capture" value={idNumber} onValueChange={setIdNumber} required />
      {errors.idNumber && <p className="text-xs text-red-field">{errors.idNumber}</p>}

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Gender</label>
        <div className="flex gap-2">
          {["Female", "Male", "Other"].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                gender === g ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal-500 border-charcoal-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field name="dob" label="Date of birth" placeholder="DD/MM/YYYY" type="text" value={dob} onValueChange={setDob} />
        <Field name="primaryPhone" label="Primary phone" placeholder="07XX XXX XXX" type="tel" value={primaryPhone} onValueChange={setPrimaryPhone} required />
      </div>
      {errors.primaryPhone && <p className="text-xs text-red-field">{errors.primaryPhone}</p>}

      <Field name="altPhone" label="Alternative phone" placeholder="Optional" type="tel" value={altPhone} onValueChange={setAltPhone} />

      {/* ID scan */}
      <div className="bg-card border border-charcoal-100 rounded-2xl p-4">
        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3">ID evidence</p>
        <div className="grid grid-cols-2 gap-2.5">
          <CameraAction label="Scan front" captured={true} />
          <CameraAction label="Scan back" captured={false} />
        </div>
        <div className="mt-3 px-3 py-2 bg-brand-light rounded-lg">
          <p className="text-xs text-brand">✓ Front captured — verify extracted values below</p>
        </div>
        <div className="mt-2 space-y-1.5">
          <ExtractedRow label="Name" value="WANJIKU MARY KAMAU" />
          <ExtractedRow label="ID no." value="•••••••482" />
          <ExtractedRow label="DOB" value="12/03/1981" />
        </div>
      </div>
    </div>
  )
}

function LocationStep() {
  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <p className="text-sm text-charcoal-500">This is the farmer's administrative location. Each farm gets its own GPS pin and boundary in the next step.</p>
      <SearchableSelect label="County" options={["Kiambu", "Nakuru", "Nyeri", "Meru", "Muranga"]} defaultValue="Kiambu" />
      <SearchableSelect label="Sub-county" options={["Githunguri", "Kiambu", "Limuru", "Kabete", "Ruiru"]} defaultValue="Githunguri" />
      <Field name="ward" label="Ward" placeholder="Enter ward" />
      <div className="grid grid-cols-2 gap-3">
        <Field name="village" label="Village" placeholder="Village name" />
        <Field name="nearestCentre" label="Nearest centre" placeholder="Town or centre" />
      </div>
    </div>
  )
}

function MembershipStep() {
  const [matched, setMatched] = useState<boolean | null>(null)

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <SearchableSelect label="Cooperative / SACCO / Group" options={["Githunguri Dairy Co-op", "Kiambu SACCO", "Kenya Tea SACCO", "KUSCCO"]} defaultValue="Githunguri Dairy Co-op" />
      <Field label="Member number" placeholder="Membership number" value="04287" type="numeric" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Member since" placeholder="Year" value="2018" type="numeric" />
        <div>
          <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Status</label>
          <div className="flex gap-2">
            {["Active", "Inactive"].map(s => (
              <button key={s} className={`flex-1 py-3 rounded-xl text-xs font-medium border ${s === "Active" ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal-500 border-charcoal-200"}`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <Field label="Branch / Collection centre" placeholder="Branch name" value="Githunguri Branch" />
      <Field label="Farmer group" placeholder="Group name (if applicable)" />

      {/* Possible member match */}
      {matched === null && (
        <div className="bg-amber-bg border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-field uppercase tracking-wider mb-2">Possible member match</p>
          <div className="mb-3">
            <p className="text-sm font-semibold text-charcoal">Mary Wanjiku</p>
            <p className="text-xs text-charcoal-500 font-mono">Member 04287 · Phone ending 284</p>
            <p className="text-xs text-charcoal-500">Githunguri Dairy Co-op</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMatched(true)} className="flex-1 py-2.5 bg-brand text-brand-ink rounded-xl text-xs font-semibold">Confirm match</button>
            <button onClick={() => setMatched(false)} className="flex-1 py-2.5 border border-charcoal-200 bg-card text-charcoal text-xs font-semibold rounded-xl">Not this farmer</button>
          </div>
        </div>
      )}
      {matched === true && (
        <div className="bg-brand-light border border-brand/20 rounded-2xl p-4">
          <p className="text-xs text-brand font-semibold">✓ Matched to co-op member record — data pre-filled from registry</p>
        </div>
      )}
    </div>
  )
}

function FarmStep({ onMapFarm, registerValidator }: { onMapFarm: (farmId: string) => void; registerValidator?: (stepIndex: number, fn: () => boolean) => void }) {
  const initial = farmsFromDraft()
  const [farms, setFarms] = useState<DraftFarm[]>(initial)
  const [activeFarmId, setActiveFarmId] = useState(String(readDraftValues().activeFarmId ?? initial[0]?.id ?? ""))
  const [error, setError] = useState<string | null>(null)
  const [pinBusy, setPinBusy] = useState(false)
  const active = farms.find(farm => farm.id === activeFarmId) ?? farms[0]

  const commit = (next: DraftFarm[]) => {
    setFarms(next)
    persistFarms(next, activeFarmId)
  }

  const updateActive = (patch: Partial<DraftFarm>) => {
    if (!active) return
    commit(farms.map(farm => farm.id === active.id ? { ...farm, ...patch } : farm))
  }

  const capturePin = () => {
    if (!navigator.geolocation) {
      setError("This browser cannot capture GPS.")
      return
    }
    setPinBusy(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      position => {
        const accuracy = position.coords.accuracy ?? null
        if (!isGpsAccurate(accuracy)) {
          setError(`GPS accuracy must be ${MAX_GPS_ACCURACY_M} m or better. Wait and recapture.`)
          setPinBusy(false)
          return
        }
        updateActive({
          pin: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy,
          },
        })
        setPinBusy(false)
      },
      () => {
        setError("Allow location access to capture this farm's GPS pin.")
        setPinBusy(false)
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  if (registerValidator) {
    registerValidator(4, () => {
      const latest = farmsFromDraft()
      if (!latest.length || latest.some(farm => !farm.name.trim() || !farm.pin || !farm.boundary)) {
        setError("Each farm needs a name, GPS pin, and walked boundary.")
        return false
      }
      setError(null)
      return true
    })
  }

  if (!active) {
    return null
  }

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <p className="text-sm text-charcoal-500">A farmer can have more than one farm. Capture each holding separately, then assign enterprises to it.</p>

      <div className="flex gap-2 flex-wrap">
        {farms.map((farm, index) => (
          <button
            key={farm.id}
            type="button"
            onClick={() => { setActiveFarmId(farm.id); persistFarms(farms, farm.id) }}
            className={`px-3 py-2 rounded-xl text-xs font-medium border ${
              farm.id === active.id ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal border-charcoal-200"
            }`}
          >
            {farm.name || `Farm ${index + 1}`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            const next = emptyFarm(farms.length)
            const updated = [...farms, next]
            setActiveFarmId(next.id)
            commit(updated)
            persistFarms(updated, next.id)
          }}
          className="px-3 py-2 rounded-xl text-xs font-medium border border-dashed border-charcoal-200 text-charcoal-500"
        >
          Add another farm
        </button>
      </div>

      <Field
        name={`farm.${active.id}.name`}
        label="Farm name / local identifier"
        placeholder="e.g. Main farm, leased plot"
        value={active.name}
        onValueChange={name => updateActive({ name })}
        required
      />

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">How is this farm held?</label>
        <div className="grid grid-cols-2 gap-2">
          {["Owned", "Leased", "Family", "Communal"].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => updateActive({ tenure: t })}
              className={`py-3 rounded-xl text-sm font-medium border ${
                active.tenure === t ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal border-charcoal-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Field
        name={`farm.${active.id}.size`}
        label="Farm size (acres)"
        placeholder="e.g. 2.4"
        type="numeric"
        value={active.size}
        onValueChange={size => updateActive({ size })}
      />

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Irrigation</label>
        <div className="flex gap-2">
          {[{ label: "Yes", val: true }, { label: "No", val: false }].map(({ label, val }) => (
            <button
              key={label}
              type="button"
              onClick={() => updateActive({ irrigation: val })}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border ${
                active.irrigation === val ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal border-charcoal-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-charcoal-100 rounded-2xl p-4">
        <p className="text-sm font-semibold text-charcoal mb-3">GPS pin for this farm</p>
        {active.pin ? (
          <p className="text-xs font-mono text-charcoal mb-3">{active.pin.lat.toFixed(6)}, {active.pin.lng.toFixed(6)}</p>
        ) : (
          <p className="text-xs text-charcoal-500 mb-3">Stand on this farm and capture the pin.</p>
        )}
        <button type="button" onClick={capturePin} className="w-full py-3 bg-brand-light text-brand rounded-xl text-sm font-semibold">
          {pinBusy ? "Capturing…" : active.pin ? "Recapture pin" : "Capture GPS pin"}
        </button>
      </div>

      <div className="bg-card border border-charcoal-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-charcoal">Boundary for this farm</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            active.boundary ? "text-brand bg-brand-light" : "text-amber-field bg-amber-bg"
          }`}>
            {active.boundary ? `${active.boundary.acres} acres mapped` : "Not yet mapped"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => { persistFarms(farms, active.id); onMapFarm(active.id) }}
          className="w-full py-3 bg-brand text-brand-ink rounded-xl text-sm font-semibold"
        >
          {active.boundary ? "Remap this farm" : "Map this farm boundary"}
        </button>
        {error && <p className="text-xs text-red-field mt-2">{error}</p>}
      </div>
    </div>
  )
}

function persistDraft(key: string, value: unknown) {
  const w = window as Window & { __mk_updateDraft?: (name: string, next: unknown) => void }
  w.__mk_updateDraft?.(key, value)
}

function EnterpriseStep({ registerValidator }: { registerValidator?: (stepIndex: number, fn: () => boolean) => void }) {
  const [farms, setFarms] = useState<DraftFarm[]>(() => farmsFromDraft())

  const toggle = (farmId: string, sectorId: string) => {
    const next = farms.map(farm => {
      if (farm.id !== farmId) return farm
      const enterprises = farm.enterprises.includes(sectorId)
        ? farm.enterprises.filter(id => id !== sectorId)
        : [...farm.enterprises, sectorId]
      return { ...farm, enterprises }
    })
    setFarms(next)
    persistFarms(next)
  }

  if (registerValidator) {
    registerValidator(5, () => farmLinks(farms).length > 0)
  }

  return (
    <div className="px-5 py-5 flex flex-col gap-5 pb-4">
      <p className="text-sm text-charcoal-500">Each farm can run more than one enterprise. Select the value chains that belong on that holding.</p>
      {farms.map((farm, index) => (
        <div key={farm.id} className="bg-card border border-charcoal-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-charcoal mb-1">{farm.name || `Farm ${index + 1}`}</p>
          <p className="text-xs text-charcoal-500 mb-3">{farm.enterprises.length === 1 ? "1 enterprise selected" : `${farm.enterprises.length} enterprises selected`}</p>
          <div className="grid grid-cols-2 gap-2">
            {webSectors.map(sector => (
              <button
                key={sector.id}
                type="button"
                onClick={() => toggle(farm.id, sector.id)}
                className={`py-3 px-3 rounded-xl text-xs font-medium border text-left ${
                  farm.enterprises.includes(sector.id) ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal border-charcoal-200"
                }`}
              >
                {sector.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SectorDetailsStep({ registerValidator }: { registerValidator?: (stepIndex: number, fn: () => boolean) => void }) {
  const farms = farmsFromDraft()
  const links = farmLinks(farms)
  const [choices, setChoices] = useState<Record<string, string>>(() => {
    const values = readDraftValues()
    return Object.fromEntries(
      Object.entries(values).filter(([, value]) => typeof value === "string"),
    ) as Record<string, string>
  })
  const [evidence, setEvidence] = useState<Record<string, string>>(() => {
    const stored = readDraftValues().evidenceAttached
    return stored && typeof stored === "object" ? stored as Record<string, string> : {}
  })
  const [error, setError] = useState<string | null>(null)

  if (registerValidator) {
    registerValidator(6, () => {
      const values = readDraftValues()
      const storedEvidence = values.evidenceAttached && typeof values.evidenceAttached === "object"
        ? values.evidenceAttached as Record<string, string>
        : {}
      const attached = { ...evidence, ...storedEvidence }
      const missing: string[] = []
      for (const { farm, sectorId } of links) {
        const sector = getWebSector(sectorId)
        for (const section of sector.sections) {
          for (const field of section.fields) {
            if (!field.required) continue
            const key = `${farm.id}.${sector.id}.${field.id}`
            if (!String(values[key] ?? choices[key] ?? "").trim()) {
              missing.push(`${farm.name} · ${sector.label}: ${field.label}`)
            }
          }
        }
        for (const item of sector.evidence) {
          if (!attached[`${farm.id}:${sector.id}:${item}`]) {
            missing.push(`${farm.name} · ${sector.label}: ${item}`)
          }
        }
      }
      if (missing.length) {
        setError(`Complete required items: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""}`)
        return false
      }
      setError(null)
      return true
    })
  }

  const attachEvidence = (farmId: string, sectorId: string, item: string, fileName: string) => {
    const next = { ...evidence, [`${farmId}:${sectorId}:${item}`]: fileName }
    setEvidence(next)
    persistDraft("evidenceAttached", next)
  }

  return (
    <div className="px-5 py-5 flex flex-col gap-5 pb-4">
      {links.length === 0 && (
        <p className="text-sm text-charcoal-500">No enterprises selected. Add at least one enterprise on a farm.</p>
      )}
      {links.map(({ farm, sectorId }) => {
        const sector = getWebSector(sectorId)
        return (
        <div key={`${farm.id}-${sector.id}`} className="space-y-3">
          <p className="text-sm font-semibold text-charcoal">{farm.name} · {sector.label}</p>
          {sector.sections.map(section => (
            <Section key={`${farm.id}-${sector.id}-${section.title}`} title={section.title}>
              <div className="space-y-3">
                {section.fields.map(field =>
                  field.type === "choice" ? (
                    <div key={field.id}>
                      <label className="text-xs font-medium text-charcoal-500 mb-2 block">{field.label}{field.required ? <span className="text-amber-field">*</span> : null}</label>
                      <div className="flex gap-2 flex-wrap">
                        {(field.options ?? []).map(option => {
                          const key = `${farm.id}.${sector.id}.${field.id}`
                          const active = choices[key] === option
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setChoices(current => ({ ...current, [key]: option }))
                                persistDraft(key, option)
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-medium border ${
                                active ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal border-charcoal-200"
                              }`}
                            >
                              {option}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <Field
                      key={field.id}
                      name={`${farm.id}.${sector.id}.${field.id}`}
                      label={field.label}
                      type={field.type === "number" ? "numeric" : "text"}
                      required={field.required}
                    />
                  ),
                )}
              </div>
            </Section>
          ))}
          <Section title="Required evidence">
            <div className="space-y-2">
              {sector.evidence.map(item => {
                const key = `${farm.id}:${sector.id}:${item}`
                const attached = evidence[key]
                return (
                  <label key={key} className="flex items-center justify-between gap-3 bg-card border border-charcoal-100 rounded-xl px-3 py-3">
                    <div>
                      <p className="text-sm text-charcoal">{item}</p>
                      <p className="text-xs text-charcoal-400">{attached ? attached : "Not attached"}</p>
                    </div>
                    <span className={`text-xs font-medium ${attached ? "text-brand" : "text-amber-field"}`}>
                      {attached ? "Attached" : "Attach"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={event => {
                        const file = event.target.files?.[0]
                        if (file) attachEvidence(farm.id, sector.id, item, file.name)
                      }}
                    />
                  </label>
                )
              })}
            </div>
          </Section>
        </div>
        )
      })}
      {error && <p className="text-xs text-red-field">{error}</p>}
    </div>
  )
}

function FinancialStep() {
  const [mpesa, setMpesa] = useState<boolean | null>(null)
  const [frequency, setFrequency] = useState("Monthly")
  const links = farmLinks(farmsFromDraft())

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <Section title="Income sources">
        <div>
          <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Income frequency</label>
          <div className="flex gap-2 flex-wrap">
            {["Daily", "Weekly", "Monthly", "Per season", "Annual"].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => { setFrequency(f); persistDraft("incomeFrequency", f) }}
                className={`px-3 py-2 rounded-xl text-xs font-medium border ${f === frequency ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal-500 border-charcoal-200"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {links.map(({ farm, sectorId }) => {
            const sector = getWebSector(sectorId)
            return (
              <Field
                key={`${farm.id}-${sector.id}`}
                name={`income.${farm.id}.${sector.id}`}
                label={`${farm.name} · ${sector.label} income (KES)`}
                type="numeric"
                placeholder="Farmer reported"
              />
            )
          })}
          <Field name="income.nonFarm" label="Non-farm income (KES)" type="numeric" placeholder="Optional" />
        </div>
      </Section>

      <Section title="Existing loans">
        <div className="bg-card border border-charcoal-100 rounded-xl p-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">Githunguri Dairy Co-op</p>
              <p className="text-xs text-charcoal-500">Feed purchase loan · KES 18,000</p>
            </div>
            <span className="text-xs text-amber-field font-medium bg-amber-bg px-2 py-0.5 rounded-full">Farmer reported</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
            <span className="text-charcoal-400">Monthly instalment</span>
            <span className="font-mono text-charcoal">KES 3,500</span>
            <span className="text-charcoal-400">Status</span>
            <span className="text-charcoal">Current</span>
          </div>
        </div>
        <button className="mt-2 w-full py-2.5 border border-charcoal-200 rounded-xl text-xs text-charcoal-500 flex items-center justify-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add another loan
        </button>
      </Section>

      {/* M-PESA consent */}
      <div className="bg-card border border-charcoal-100 rounded-2xl p-4">
        <p className="text-sm font-semibold text-charcoal mb-1">M-PESA statement</p>
        <p className="text-xs text-charcoal-500 mb-3">A separate consent is required to process M-PESA transaction records.</p>
        <div>
          <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Farmer authorizes M-PESA processing?</label>
          <div className="flex gap-2">
            {[{ label: "Yes", val: true }, { label: "No", val: false }].map(({ label, val }) => (
              <button
                key={label}
                onClick={() => setMpesa(val)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                  mpesa === val ? "bg-brand text-brand-ink border-brand" : "bg-card text-charcoal border-charcoal-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {mpesa === true && (
          <div className="mt-3 space-y-2">
            <button className="w-full py-3 bg-brand-light text-brand rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload M-PESA statement (PDF)
            </button>
            <p className="text-xs text-charcoal-400 text-center">Statement is encrypted and sent to MkulimaScore for processing. It is not read on this device.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewStep({ onEdit }: { onEdit: (step: number) => void }) {
  const values = readDraftValues()
  const farms = farmsFromDraft()
  const links = farmLinks(farms)
  const evidence = (values.evidenceAttached && typeof values.evidenceAttached === "object")
    ? values.evidenceAttached as Record<string, string>
    : {}
  const missingEvidence = links.flatMap(({ farm, sectorId }) => {
    const sector = getWebSector(sectorId)
    return sector.evidence.filter(item => !evidence[`${farm.id}:${sector.id}:${item}`]).map(item => `${farm.name} · ${sector.label}: ${item}`)
  })
  const incompleteFarms = farms.filter(farm => !farm.pin || !farm.boundary)
  const warnings = [
    ...incompleteFarms.map(farm => `${farm.name} still needs a pin or boundary`),
    links.length === 0 ? "No enterprises selected" : null,
    ...missingEvidence.map(item => `${item} not attached`),
  ].filter(Boolean) as string[]

  const sections = [
    { name: "Consent", step: 0, ok: true },
    { name: "Identity", step: 1, ok: Boolean(values.fullName || values.firstName) },
    { name: "Location", step: 2, ok: true },
    { name: "Membership", step: 3, ok: true },
    { name: `${farms.length} farm${farms.length === 1 ? "" : "s"}`, step: 4, ok: incompleteFarms.length === 0 },
    { name: `${links.length} enterprise${links.length === 1 ? "" : "s"}`, step: 5, ok: links.length > 0 },
    { name: links.map(({ farm, sectorId }) => `${farm.name} · ${getWebSector(sectorId).label}`).join(", ") || "Sector details", step: 6, ok: missingEvidence.length === 0 },
    { name: "Financial", step: 7, ok: Boolean(values.incomeFrequency || Object.keys(values).some(key => key.startsWith("income."))) },
  ]

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      {warnings.length > 0 ? (
        <div className="bg-amber-bg border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-field mb-2">{warnings.length} item{warnings.length === 1 ? "" : "s"} require attention</p>
          <ul className="space-y-1.5 text-sm text-charcoal">
            {warnings.slice(0, 6).map(item => (
              <li key={item} className="flex items-start gap-2"><span className="text-amber-field mt-0.5">·</span>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-brand-light border border-brand/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-brand">Ready to save on this device</p>
          <p className="text-xs text-brand/80 mt-1">
            {farms.length} farm{farms.length === 1 ? "" : "s"} · {links.length} enterprise{links.length === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {links.length > 0 && (
        <div className="bg-card border border-charcoal-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-2">Holdings</p>
          <ul className="space-y-2 text-sm text-charcoal mb-3">
            {farms.map(farm => (
              <li key={farm.id}>
                <span className="font-medium">{farm.name}</span>
                <span className="text-charcoal-500"> · {farm.enterprises.map(id => getWebSector(id).label).join(", ") || "no enterprises"}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-2">Required evidence</p>
          <ul className="space-y-1 text-sm text-charcoal">
            {links.flatMap(({ farm, sectorId }) => {
              const sector = getWebSector(sectorId)
              return sector.evidence.map(item => (
                <li key={`${farm.id}:${sector.id}:${item}`} className="flex justify-between gap-3">
                  <span>{farm.name} · {sector.label} · {item}</span>
                  <span className={evidence[`${farm.id}:${sector.id}:${item}`] ? "text-brand text-xs" : "text-amber-field text-xs"}>
                    {evidence[`${farm.id}:${sector.id}:${item}`] ? "Attached" : "Missing"}
                  </span>
                </li>
              ))
            })}
          </ul>
        </div>
      )}

      <div className="bg-card border border-charcoal-100 rounded-2xl divide-y divide-charcoal-50">
        {sections.map(s => (
          <div key={s.name} className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              {s.ok
                ? <div className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#54C529" strokeWidth="2" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>
                  </div>
                : <div className="w-5 h-5 rounded-full bg-amber-bg flex items-center justify-center">
                    <span className="text-amber-field text-[10px] font-bold">!</span>
                  </div>
              }
              <span className="text-sm font-medium text-charcoal">{s.name}</span>
            </div>
            <button type="button" onClick={() => onEdit(s.step)} className="text-xs text-brand font-medium">Edit</button>
          </div>
        ))}
      </div>

      <div className="bg-charcoal-50 rounded-xl px-4 py-3">
        <p className="text-xs text-charcoal-500">Submitting while offline: profile will be saved to your local sync queue and uploaded when connectivity is restored.</p>
      </div>
    </div>
  )
}

// ── Shared form primitives ─────────────────────────────────────

function Field({ label, placeholder, type, value, hint, name, onValueChange, required }: {
  label?: string; placeholder?: string; type?: string; value?: string; hint?: string; name?: string; onValueChange?: (v: string) => void; required?: boolean
}) {
  const [val, setVal] = useState(value ?? "")

  useEffect(() => {
    if (value !== undefined && value !== val) {
      setVal(value)
    }
  }, [value])

  const handleChange = (v: string) => {
    setVal(v)
    if (onValueChange) onValueChange(v)
    try {
      const w = window as Window & { __mk_updateDraft?: (key: string, value: any) => void }
      if (w.__mk_updateDraft && name) w.__mk_updateDraft(name, v)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="w-full">
      {label && <label htmlFor={name} className="text-xs font-medium text-charcoal-500 mb-1.5 block uppercase tracking-wide">{label}{required ? <span className="text-amber-field">*</span> : null}</label>}
      <input
        id={name}
        name={name}
        aria-label={label || name}
        aria-required={required ? "true" : "false"}
        type={type || "text"}
        placeholder={placeholder}
        value={val}
        onChange={e => handleChange(e.target.value)}
        className="w-full border border-charcoal-100 rounded-xl px-4 py-3.5 text-sm text-charcoal bg-card focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-charcoal-300"
      />
      {hint && <p className="text-xs text-charcoal-300 mt-1">{hint}</p>}
    </div>
  )
}

function SearchableSelect({ label, options, defaultValue }: { label: string; options: string[]; defaultValue?: string }) {
  const [val, setVal] = useState(defaultValue || "")
  return (
    <div>
      <label className="text-xs font-medium text-charcoal-500 mb-1.5 block uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full border border-charcoal-100 rounded-xl px-4 py-3.5 text-sm text-charcoal bg-card focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand appearance-none transition-all pr-10"
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-300 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-charcoal-100 rounded-2xl p-4">
      <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function CameraAction({ label, captured }: { label: string; captured: boolean }) {
  return (
    <button className={`py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
      captured ? "border-brand bg-brand-light" : "border-dashed border-charcoal-200 bg-charcoal-50"
    }`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={captured ? "#54C529" : "#ABC1AB"} strokeWidth="1.8" strokeLinecap="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
      </svg>
      <span className={`text-xs font-medium ${captured ? "text-brand" : "text-charcoal-400"}`}>
        {captured ? "✓ Captured" : label}
      </span>
    </button>
  )
}

function ExtractedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-charcoal-500">{label}</span>
      <span className="text-xs font-mono text-charcoal font-medium">{value}</span>
    </div>
  )
}

