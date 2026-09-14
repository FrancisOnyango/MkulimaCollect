import { useState } from "react"
import Badge from "../components/Badge"
import ScreenHeader from "../components/ScreenHeader"
import { getFarmer } from "../data"

interface FarmerProfileScreenProps {
  farmerId: string
  onBack: () => void
  onCollect: () => void
}

type ProfileTab = "Overview" | "Farm" | "Evidence"

const tabs: ProfileTab[] = ["Overview", "Farm", "Evidence"]

export default function FarmerProfileScreen({ farmerId, onBack, onCollect }: FarmerProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Overview")
  const farmer = getFarmer(farmerId)

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden min-h-0">
      <ScreenHeader
        title={farmer.name}
        subtitle={`${farmer.id} · ${farmer.location}`}
        onBack={onBack}
        trailing={<Badge variant={farmer.status} />}
      />

      <div className="px-5">
        <div className="flex bg-card border border-charcoal-100 rounded-full p-1">
          {tabs.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-full ${
                activeTab === tab ? "bg-brand text-brand-ink" : "text-charcoal-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-hidden pb-28">
        {activeTab === "Overview" && <OverviewTab completeness={farmer.completeness} unsynced={farmer.unsynced} onCollect={onCollect} />}
        {activeTab === "Farm" && <FarmTab onCollect={onCollect} />}
        {activeTab === "Evidence" && <EvidenceTab />}
      </div>
    </div>
  )
}

function OverviewTab({ completeness, unsynced, onCollect }: { completeness: number; unsynced: boolean; onCollect: () => void }) {
  return (
    <div className="px-5 py-5 flex flex-col gap-4">
      <section className="relative overflow-hidden bg-ink rounded-[24px] p-4">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand/25 blur-2xl" />
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-brand-mid">Completeness</p>
            <p className="text-[40px] font-semibold text-white mt-1 leading-none tracking-tight">{completeness}%</p>
          </div>
          <p className="text-sm text-white/60">{unsynced ? "Waiting to sync" : "Synced"}</p>
        </div>
      </section>

      <section className="bg-card border border-charcoal-100 rounded-[24px] p-4">
        <h2 className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-[0.16em] mb-3">Next actions</h2>
        <ul className="space-y-2.5 text-sm text-charcoal">
          <li>Save Farm 2 boundary</li>
          <li>Attach latest production evidence</li>
          <li>Confirm SACCO loan record</li>
        </ul>
        <button
          type="button"
          onClick={onCollect}
          className="mt-4 w-full text-sm font-semibold text-brand-ink py-3 bg-brand rounded-full"
        >
          Continue collecting
        </button>
      </section>
    </div>
  )
}

function FarmTab({ onCollect }: { onCollect: () => void }) {
  return (
    <div className="px-5 py-5 flex flex-col gap-3">
      <FarmBlock name="Main holding" detail="2.4 acres · Owned · Githunguri" status="Boundary saved" />
      <FarmBlock name="Leased plot" detail="0.8 acres · Leased · Lari" status="Boundary needed" warn />
      <div className="bg-card border border-charcoal-100 rounded-[22px] p-4">
        <p className="font-semibold text-sm text-charcoal">Dairy</p>
        <p className="text-xs text-charcoal-500 mt-1">4 lactating cows · milk delivery verified</p>
      </div>
      <div className="bg-card border border-charcoal-100 rounded-[22px] p-4">
        <p className="font-semibold text-sm text-charcoal">Maize</p>
        <p className="text-xs text-charcoal-500 mt-1">1.2 acres · receipt still needed</p>
      </div>
      <button
        type="button"
        onClick={onCollect}
        className="w-full border border-dashed border-charcoal-200 rounded-[22px] py-3.5 text-sm text-charcoal-500 font-medium"
      >
        Add another farm or enterprise
      </button>
    </div>
  )
}

function FarmBlock({ name, detail, status, warn }: { name: string; detail: string; status: string; warn?: boolean }) {
  return (
    <div className="bg-card border border-charcoal-100 rounded-[22px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm text-charcoal">{name}</p>
          <p className="text-xs text-charcoal-500 mt-1">{detail}</p>
        </div>
        <span className={`text-xs font-medium ${warn ? "text-amber-field" : "text-brand"}`}>{status}</span>
      </div>
    </div>
  )
}

function EvidenceTab() {
  const items = [
    { type: "National ID", status: "Verified" },
    { type: "Milk delivery statement", status: "Verified" },
    { type: "Farm photograph", status: "Saved" },
    { type: "Input receipt", status: "Needs review" },
  ]

  return (
    <div className="px-5 py-5">
      <div className="bg-card border border-charcoal-100 rounded-[22px] divide-y divide-charcoal-100">
        {items.map(item => (
          <div key={item.type} className="px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-charcoal">{item.type}</p>
            <span className={`text-xs font-medium ${item.status === "Needs review" ? "text-amber-field" : "text-brand"}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
