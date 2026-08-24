import { useState } from "react"

interface NewFarmerScreenProps {
  onBack: () => void
  onGpsMap: () => void
  onComplete: () => void
}

const STEPS = [
  "Consent",
  "Identity",
  "Location",
  "Membership",
  "Farm",
  "Enterprise",
  "Dairy",
  "Financial",
  "Review",
]

export default function NewFarmerScreen({ onBack, onGpsMap, onComplete }: NewFarmerScreenProps) {
  const [step, setStep] = useState(0)

  const next = () => {
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
    <div className="flex-1 flex flex-col bg-surface overflow-hidden screen-enter">
      {/* Top bar */}
      <div className="bg-white pt-12 pb-0 border-b border-charcoal-100">
        <div className="flex items-center justify-between px-5 pb-3">
          <button onClick={prev} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-charcoal-50 -ml-2 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-xs text-charcoal-500 font-medium">New farmer</p>
            <p className="text-xs font-mono text-charcoal-300">Step {step + 1} of {STEPS.length}</p>
          </div>
          <button onClick={onBack} className="text-xs text-charcoal-500 hover:text-brand transition-colors">
            Save & exit
          </button>
        </div>

        {/* Step progress */}
        <div className="px-5 pb-4">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i < step ? "bg-brand" : i === step ? "bg-brand/50" : "bg-charcoal-100"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-semibold text-charcoal">{STEPS[step]}</p>
            <div className="flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="text-[11px] font-mono text-charcoal-300">Autosaving</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto scroll-hidden">
        {step === 0 && <ConsentStep />}
        {step === 1 && <IdentityStep />}
        {step === 2 && <LocationStep />}
        {step === 3 && <MembershipStep />}
        {step === 4 && <FarmStep onMapFarm={onGpsMap} />}
        {step === 5 && <EnterpriseStep />}
        {step === 6 && <DairyStep />}
        {step === 7 && <FinancialStep />}
        {step === 8 && <ReviewStep onEdit={(s) => setStep(s)} />}
      </div>

      {/* Bottom actions */}
      {step < STEPS.length - 1 ? (
        <div className="bg-white border-t border-charcoal-100 px-5 py-4 flex gap-3">
          <button
            onClick={prev}
            className="flex-1 py-3.5 border border-charcoal-200 rounded-xl text-sm font-semibold text-charcoal active:scale-[0.98] transition-transform"
          >
            Back
          </button>
          <button
            onClick={next}
            className="flex-[2] py-3.5 bg-brand text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            {step === 4 ? "Continue" : "Continue"}
          </button>
        </div>
      ) : (
        <div className="bg-white border-t border-charcoal-100 px-5 py-4">
          <button
            onClick={onComplete}
            className="w-full py-4 bg-brand text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
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

      <div className="border border-charcoal-100 rounded-2xl p-4 bg-white">
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
    <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
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

function IdentityStep() {
  const [idType, setIdType] = useState("National ID")
  const [gender, setGender] = useState("")

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <Field label="Full legal name" placeholder="As per official document" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" placeholder="First name" value="Mary" />
        <Field label="Surname" placeholder="Surname" value="Wanjiku" />
      </div>
      <Field label="Preferred name" placeholder="If different from above" />

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">ID type</label>
        <div className="flex gap-2">
          {["National ID", "Passport", "Alien ID"].map(t => (
            <button
              key={t}
              onClick={() => setIdType(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                idType === t ? "bg-brand text-white border-brand" : "bg-white text-charcoal-500 border-charcoal-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Field label="ID number" placeholder="Enter ID number" type="numeric" hint="Will be masked after capture" />

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Gender</label>
        <div className="flex gap-2">
          {["Female", "Male", "Other"].map(g => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                gender === g ? "bg-brand text-white border-brand" : "bg-white text-charcoal-500 border-charcoal-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of birth" placeholder="DD/MM/YYYY" type="numeric" />
        <Field label="Primary phone" placeholder="07XX XXX XXX" type="tel" />
      </div>

      <Field label="Alternative phone" placeholder="Optional" type="tel" />

      {/* ID scan */}
      <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
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
  const [captured, setCaptured] = useState(false)

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Country</label>
        <div className="bg-charcoal-50 rounded-xl px-4 py-3.5 text-sm text-charcoal">Kenya</div>
      </div>

      <SearchableSelect label="County" options={["Kiambu", "Nakuru", "Nyeri", "Meru", "Muranga"]} defaultValue="Kiambu" />
      <SearchableSelect label="Sub-county" options={["Githunguri", "Kiambu", "Limuru", "Kabete", "Ruiru"]} defaultValue="Githunguri" />
      <Field label="Ward" placeholder="Enter ward" value="Githunguri" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Village" placeholder="Village name" value="Kiariga" />
        <Field label="Nearest centre" placeholder="Town or centre" value="Githunguri Town" />
      </div>

      {/* GPS capture */}
      <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3">GPS location</p>
        {captured ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand" />
              <span className="text-xs text-brand font-medium">Location captured</span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-charcoal-50 rounded-xl p-3">
              <div>
                <p className="text-[10px] text-charcoal-400 mb-0.5">Latitude</p>
                <p className="text-xs font-mono text-charcoal">-0.9891</p>
              </div>
              <div>
                <p className="text-[10px] text-charcoal-400 mb-0.5">Longitude</p>
                <p className="text-xs font-mono text-charcoal">36.6872</p>
              </div>
              <div>
                <p className="text-[10px] text-charcoal-400 mb-0.5">Accuracy</p>
                <p className="text-xs font-mono text-brand font-medium">±6 m ✓</p>
              </div>
              <div>
                <p className="text-[10px] text-charcoal-400 mb-0.5">Altitude</p>
                <p className="text-xs font-mono text-charcoal">1,842 m</p>
              </div>
            </div>
            <button onClick={() => setCaptured(false)} className="text-xs text-charcoal-400 text-center w-full">Recapture location</button>
          </div>
        ) : (
          <button
            onClick={() => setCaptured(true)}
            className="w-full py-3.5 bg-brand-light text-brand rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Capture location
          </button>
        )}
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
              <button key={s} className={`flex-1 py-3 rounded-xl text-xs font-medium border ${s === "Active" ? "bg-brand text-white border-brand" : "bg-white text-charcoal-500 border-charcoal-200"}`}>{s}</button>
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
            <button onClick={() => setMatched(true)} className="flex-1 py-2.5 bg-brand text-white rounded-xl text-xs font-semibold">Confirm match</button>
            <button onClick={() => setMatched(false)} className="flex-1 py-2.5 border border-charcoal-200 bg-white text-charcoal text-xs font-semibold rounded-xl">Not this farmer</button>
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

function FarmStep({ onMapFarm }: { onMapFarm: () => void }) {
  const [tenure, setTenure] = useState("Owned")
  const [irrigation, setIrrigation] = useState<boolean | null>(null)

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <Field label="Farm name / local identifier" placeholder="e.g. Main farm, Kiariga plot" value="Kiariga Main Farm" />

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">How is this farm held?</label>
        <div className="grid grid-cols-2 gap-2">
          {["Owned", "Leased", "Family", "Communal"].map(t => (
            <button
              key={t}
              onClick={() => setTenure(t)}
              className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                tenure === t ? "bg-brand text-white border-brand" : "bg-white text-charcoal border-charcoal-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Farm size" placeholder="e.g. 2.4" type="numeric" value="2.4" />
        </div>
        <div className="w-24">
          <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Unit</label>
          <div className="bg-charcoal-50 rounded-xl px-3 py-3.5 text-sm text-charcoal">Acres</div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Size source</label>
        <div className="flex gap-2 flex-wrap">
          {["Farmer reported", "GPS measured", "Title deed", "Co-op record"].map(s => (
            <button key={s} className={`px-3 py-2 rounded-xl text-xs font-medium border ${s === "Farmer reported" ? "bg-brand-light text-brand border-brand/20" : "bg-white text-charcoal-500 border-charcoal-200"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Does this farm have irrigation?</label>
        <div className="flex gap-2">
          {[{ label: "Yes", val: true }, { label: "No", val: false }].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => setIrrigation(val)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                irrigation === val ? "bg-brand text-white border-brand" : "bg-white text-charcoal border-charcoal-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {irrigation === true && (
          <div className="mt-3 p-3 bg-brand-muted border border-brand/10 rounded-xl space-y-2">
            <Field label="Water source" placeholder="River, borehole, rain-fed…" />
            <Field label="Irrigation type" placeholder="Drip, furrow, sprinkler…" />
            <Field label="Irrigated acreage" placeholder="Acres" type="numeric" />
          </div>
        )}
      </div>

      {/* GPS Farm mapping */}
      <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-charcoal">Farm boundary</p>
          <span className="text-xs text-amber-field font-medium bg-amber-bg px-2 py-0.5 rounded-full">Not yet mapped</span>
        </div>
        <p className="text-xs text-charcoal-500 mb-3">Capture the farm boundary by walking the perimeter or drawing on the map.</p>
        <button
          onClick={onMapFarm}
          className="w-full py-3 bg-brand text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Map farm boundary
        </button>
      </div>
    </div>
  )
}

function EnterpriseStep() {
  const [selected, setSelected] = useState<string[]>([])
  const chains = ["Dairy", "Coffee", "Tea", "Maize", "Avocado", "Rice", "Irish Potato", "Poultry", "Tomato", "Macadamia", "Aquaculture", "Beans", "Horticulture"]

  const toggle = (c: string) => setSelected(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c])

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <p className="text-sm text-charcoal-500">Select the agricultural enterprises this farmer operates. Each enterprise will open its own data collection module.</p>

      <div className="grid grid-cols-2 gap-2">
        {chains.map(c => (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={`py-3 px-4 rounded-xl text-sm font-medium border text-left transition-colors ${
              selected.includes(c) ? "bg-brand text-white border-brand" : "bg-white text-charcoal border-charcoal-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="bg-brand-light border border-brand/20 rounded-xl px-4 py-3">
          <p className="text-xs text-brand font-medium">
            {selected.length} enterprise{selected.length > 1 ? "s" : ""} selected: {selected.join(", ")}
          </p>
          <p className="text-xs text-brand/70 mt-0.5">Each will have a dedicated data module in the next steps.</p>
        </div>
      )}
    </div>
  )
}

function DairyStep() {
  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-brand-light flex items-center justify-center">
          <span className="text-xs">🐄</span>
        </div>
        <p className="text-sm font-semibold text-charcoal">Dairy module</p>
      </div>

      <Section title="Herd">
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Total cattle" value={7} />
          <Stepper label="Dairy cattle" value={5} />
          <Stepper label="Lactating cows" value={4} />
          <Stepper label="Dry cows" value={1} />
          <Stepper label="Heifers" value={1} />
          <Stepper label="Calves" value={2} />
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Breed</label>
          <div className="flex gap-2 flex-wrap">
            {["Friesian", "Ayrshire", "Jersey", "Zebu", "Cross"].map(b => (
              <button key={b} className={`px-3 py-2 rounded-xl text-xs font-medium border ${["Friesian", "Ayrshire"].includes(b) ? "bg-brand text-white border-brand" : "bg-white text-charcoal-500 border-charcoal-200"}`}>{b}</button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Milk production">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Litres/day (morning)" placeholder="0" type="numeric" value="18" />
          <Field label="Litres/day (evening)" placeholder="0" type="numeric" value="14" />
        </div>
        <div className="bg-brand-muted border border-brand/10 rounded-xl px-3 py-2 mt-2">
          <div className="flex justify-between">
            <span className="text-xs text-charcoal-500">Total litres/day</span>
            <span className="text-sm font-semibold font-mono text-brand">32 L</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-charcoal-500">Per lactating cow</span>
            <span className="text-xs font-mono text-charcoal">8.0 L/cow</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Field label="Seasonal high (L/day)" type="numeric" value="38" />
          <Field label="Seasonal low (L/day)" type="numeric" value="22" />
        </div>
      </Section>

      <Section title="Milk sales">
        <Field label="Buyer / processor" placeholder="Cooperative or direct" value="Githunguri Dairy Co-op" />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Field label="Litres delivered/day" type="numeric" value="30" />
          <Field label="Price per litre (KES)" type="numeric" value="46" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Field label="Rejected milk (L/day)" type="numeric" value="0" />
          <div>
            <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Payment</label>
            <div className="bg-charcoal-50 rounded-xl px-3 py-3 text-sm text-charcoal">Monthly</div>
          </div>
        </div>
        <div className="bg-brand-muted border border-brand/10 rounded-xl px-3 py-2 mt-2">
          <div className="flex justify-between">
            <span className="text-xs text-charcoal-500">Est. monthly milk income</span>
            <span className="text-sm font-semibold font-mono text-brand">KES 41,400</span>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Evidence</label>
          <button className="w-full py-3 border-2 border-dashed border-charcoal-200 rounded-xl text-xs text-charcoal-400 flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
            Capture milk delivery statement
          </button>
        </div>
      </Section>
    </div>
  )
}

function FinancialStep() {
  const [mpesa, setMpesa] = useState<boolean | null>(null)

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <Section title="Income sources">
        <div>
          <label className="text-xs font-medium text-charcoal-500 mb-2 block uppercase tracking-wide">Income frequency</label>
          <div className="flex gap-2 flex-wrap">
            {["Daily", "Weekly", "Monthly", "Per season", "Annual"].map(f => (
              <button key={f} className={`px-3 py-2 rounded-xl text-xs font-medium border ${f === "Monthly" ? "bg-brand text-white border-brand" : "bg-white text-charcoal-500 border-charcoal-200"}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <IncomeRow label="Dairy enterprise" value="~KES 41,400/mo" source="Farmer reported" />
          <IncomeRow label="Maize enterprise" value="~KES 6,200/season" source="Farmer reported" />
          <IncomeRow label="Non-farm income" value="Not captured" source="" empty />
        </div>
      </Section>

      <Section title="Existing loans">
        <div className="bg-white border border-charcoal-100 rounded-xl p-3">
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
      <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
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
                  mpesa === val ? "bg-brand text-white border-brand" : "bg-white text-charcoal border-charcoal-200"
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
  const sections = [
    { name: "Consent", step: 0, status: "ok" },
    { name: "Identity", step: 1, status: "ok" },
    { name: "Location", step: 2, status: "ok" },
    { name: "Membership", step: 3, status: "ok" },
    { name: "Farm", step: 4, status: "warn" },
    { name: "Enterprise / Dairy", step: 6, status: "ok" },
    { name: "Financial", step: 7, status: "warn" },
  ]

  return (
    <div className="px-5 py-5 flex flex-col gap-4 pb-4">
      <div className="bg-amber-bg border border-amber-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-amber-field mb-2">2 items require attention</p>
        <ul className="space-y-1.5 text-sm text-charcoal">
          <li className="flex items-start gap-2"><span className="text-amber-field mt-0.5">·</span>Farm 2 boundary not captured</li>
          <li className="flex items-start gap-2"><span className="text-amber-field mt-0.5">·</span>Latest production evidence unavailable</li>
        </ul>
      </div>

      <div className="bg-white border border-charcoal-100 rounded-2xl divide-y divide-charcoal-50">
        {sections.map(s => (
          <div key={s.name} className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              {s.status === "ok"
                ? <div className="w-5 h-5 rounded-full bg-brand-light flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1A5C35" strokeWidth="2" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>
                  </div>
                : <div className="w-5 h-5 rounded-full bg-amber-bg flex items-center justify-center">
                    <span className="text-amber-field text-[10px] font-bold">!</span>
                  </div>
              }
              <span className="text-sm font-medium text-charcoal">{s.name}</span>
            </div>
            <button onClick={() => onEdit(s.step)} className="text-xs text-brand font-medium">Edit</button>
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

function Field({ label, placeholder, type, value, hint }: {
  label?: string; placeholder?: string; type?: string; value?: string; hint?: string
}) {
  const [val, setVal] = useState(value || "")
  return (
    <div className="w-full">
      {label && <label className="text-xs font-medium text-charcoal-500 mb-1.5 block uppercase tracking-wide">{label}</label>}
      <input
        type={type || "text"}
        placeholder={placeholder}
        value={val}
        onChange={e => setVal(e.target.value)}
        className="w-full border border-charcoal-100 rounded-xl px-4 py-3.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-charcoal-300"
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
          className="w-full border border-charcoal-100 rounded-xl px-4 py-3.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand appearance-none transition-all pr-10"
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-300 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
  )
}

function Stepper({ label, value: init }: { label: string; value: number }) {
  const [val, setVal] = useState(init)
  return (
    <div>
      <label className="text-xs text-charcoal-500 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 bg-white border border-charcoal-100 rounded-xl overflow-hidden">
        <button onClick={() => setVal(v => Math.max(0, v - 1))} className="w-10 h-10 flex items-center justify-center text-charcoal-500 hover:bg-charcoal-50 transition-colors text-lg font-light">−</button>
        <span className="flex-1 text-center text-sm font-semibold font-mono text-charcoal">{val}</span>
        <button onClick={() => setVal(v => v + 1)} className="w-10 h-10 flex items-center justify-center text-charcoal-500 hover:bg-charcoal-50 transition-colors text-lg font-light">+</button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={captured ? "#1A5C35" : "#AEAEB2"} strokeWidth="1.8" strokeLinecap="round">
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

function IncomeRow({ label, value, source, empty }: { label: string; value: string; source: string; empty?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${empty ? "bg-charcoal-50" : "bg-white border border-charcoal-100"}`}>
      <div>
        <p className="text-xs font-medium text-charcoal">{label}</p>
        {source && <p className="text-[11px] text-amber-field">{source}</p>}
      </div>
      <span className={`text-xs font-mono ${empty ? "text-charcoal-300" : "text-charcoal font-medium"}`}>{value}</span>
    </div>
  )
}
