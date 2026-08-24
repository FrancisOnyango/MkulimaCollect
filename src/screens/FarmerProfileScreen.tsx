import { useState } from "react"
import Badge from "../components/Badge"
import CompletenessBar from "../components/CompletenessBar"

interface FarmerProfileScreenProps {
  farmerId: string
  onBack: () => void
  onCollect: () => void
}

const tabs = ["Overview", "Farms", "Enterprises", "Financial", "Evidence", "Activity"]

export default function FarmerProfileScreen({ farmerId, onBack, onCollect }: FarmerProfileScreenProps) {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden screen-enter">
      {/* Header */}
      <div className="bg-white pt-12 border-b border-charcoal-100">
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-charcoal-50 -ml-2 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="text-xs text-charcoal-500 font-mono">Farmer profile</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center flex-shrink-0">
              <span className="text-brand text-lg font-bold">MW</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-xl font-semibold text-charcoal leading-tight">Mary Wanjiku</h1>
                  <p className="font-mono text-xs text-charcoal-300 mt-0.5">{farmerId}</p>
                </div>
                <Badge variant="verified" />
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-charcoal-500">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Githunguri, Kiambu
                <span className="text-charcoal-200">·</span>
                <span>Dairy · Maize</span>
              </div>
            </div>
          </div>

          {/* Completeness */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-charcoal-500">Profile completeness</span>
              <span className="text-sm font-semibold font-mono text-brand">82%</span>
            </div>
            <div className="w-full h-2 bg-charcoal-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand rounded-full" style={{ width: "82%" }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto scroll-hidden">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-brand text-brand"
                  : "border-transparent text-charcoal-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scroll-hidden pb-24">
        {activeTab === "Overview" && <OverviewTab onCollect={onCollect} />}
        {activeTab === "Farms" && <FarmsTab />}
        {activeTab === "Enterprises" && <EnterprisesTab onCollect={onCollect} />}
        {activeTab === "Financial" && <FinancialTab />}
        {activeTab === "Evidence" && <EvidenceTab />}
        {activeTab === "Activity" && <ActivityTab />}
      </div>
    </div>
  )
}

function OverviewTab({ onCollect }: { onCollect: () => void }) {
  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      {/* Identity */}
      <InfoCard title="Identity" icon="🪪" status="Verified">
        <Row label="Full name" value="Mary Wanjiku Kamau" />
        <Row label="National ID" value="••••••• 482" mono />
        <Row label="Phone" value="07•• ••• 284" mono />
        <Row label="Date of birth" value="12 Mar 1981" />
        <Row label="Gender" value="Female" />
        <Row label="Language" value="Kikuyu / English" />
      </InfoCard>

      {/* Consent */}
      <InfoCard title="Consent" icon="✓" status="Recorded">
        <Row label="Consent date" value="06 Jul 2026" />
        <Row label="Method" value="Written + signature" />
        <Row label="Language" value="Kikuyu" />
        <Row label="GPS at consent" value="-0.9891, 36.6872" mono />
        <Row label="Version" value="v2.1" />
      </InfoCard>

      {/* Next best actions */}
      <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-3">Next best actions</p>
        <div className="space-y-2.5">
          <ActionRow text="Add latest milk delivery statement" />
          <ActionRow text="Map Farm 2 boundary" />
          <ActionRow text="Confirm existing SACCO loan" />
          <ActionRow text="Complete dairy input costs" />
        </div>
        <button
          onClick={onCollect}
          className="mt-4 w-full text-sm font-semibold text-brand py-2.5 border border-brand/20 bg-brand-light rounded-xl active:scale-[0.98] transition-transform"
        >
          Continue collecting
        </button>
      </div>
    </div>
  )
}

function FarmsTab() {
  return (
    <div className="px-4 py-5 flex flex-col gap-3">
      <FarmCard
        name="Farm 1 — Main holding"
        size="2.4 acres"
        enterprises={["Dairy", "Maize"]}
        mapped={true}
        tenure="Owned"
        location="Githunguri"
      />
      <FarmCard
        name="Farm 2 — Leased plot"
        size="0.8 acres"
        enterprises={["Avocado"]}
        mapped={false}
        tenure="Leased"
        location="Lari"
      />
      <button className="w-full border-2 border-dashed border-charcoal-200 rounded-2xl py-4 text-sm text-charcoal-400 font-medium flex items-center justify-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add farm
      </button>
    </div>
  )
}

function FarmCard({ name, size, enterprises, mapped, tenure, location }: {
  name: string; size: string; enterprises: string[]; mapped: boolean; tenure: string; location: string
}) {
  return (
    <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold text-sm text-charcoal">{name}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mapped ? "bg-brand-light text-brand" : "bg-amber-bg text-amber-field"}`}>
          {mapped ? "Mapped ✓" : "Mapping incomplete"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-y-1.5 text-xs mt-2">
        <span className="text-charcoal-500">Size</span>
        <span className="font-mono text-charcoal font-medium">{size}</span>
        <span className="text-charcoal-500">Tenure</span>
        <span className="text-charcoal">{tenure}</span>
        <span className="text-charcoal-500">Location</span>
        <span className="text-charcoal">{location}</span>
        <span className="text-charcoal-500">Enterprises</span>
        <span className="text-charcoal">{enterprises.join(", ")}</span>
      </div>
    </div>
  )
}

function EnterprisesTab({ onCollect }: { onCollect: () => void }) {
  return (
    <div className="px-4 py-5 flex flex-col gap-3">
      <EnterpriseCard
        name="Dairy"
        detail="Friesian × Ayrshire · 4 lactating cows"
        income="~KES 18,400/mo"
        status="Supported by evidence"
        completeness={88}
      />
      <EnterpriseCard
        name="Maize"
        detail="Hybrid H614D · 1.2 acres"
        income="~KES 6,200/season"
        status="Farmer reported"
        completeness={61}
      />
      <button
        onClick={onCollect}
        className="w-full border-2 border-dashed border-charcoal-200 rounded-2xl py-4 text-sm text-charcoal-400 font-medium flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add enterprise
      </button>
    </div>
  )
}

function EnterpriseCard({ name, detail, income, status, completeness }: {
  name: string; detail: string; income: string; status: string; completeness: number
}) {
  const evidenceColor = status === "Supported by evidence" ? "text-brand" : status === "Farmer reported" ? "text-amber-field" : "text-charcoal-300"
  return (
    <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
      <div className="flex items-start justify-between mb-1">
        <p className="font-semibold text-sm text-charcoal">{name}</p>
        <span className="font-mono text-xs text-brand font-medium">{income}</span>
      </div>
      <p className="text-xs text-charcoal-500 mb-1">{detail}</p>
      <p className={`text-xs font-medium mb-3 ${evidenceColor}`}>{status}</p>
      <CompletenessBar percent={completeness} size="sm" />
    </div>
  )
}

function FinancialTab() {
  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <InfoCard title="Income" icon="💰" status="Farmer reported">
        <Row label="Dairy income" value="~KES 18,400/mo" />
        <Row label="Maize income" value="~KES 6,200/season" />
        <Row label="SACCO dividend" value="KES 3,800/yr" />
        <Row label="Payment method" value="M-PESA / Cash" />
        <Row label="Seasonality" value="Dairy stable; Maize seasonal" />
      </InfoCard>
      <InfoCard title="SACCO savings" icon="🏦" status="Verified">
        <Row label="SACCO" value="Githunguri Dairy Co-op" />
        <Row label="Member no." value="04287" mono />
        <Row label="Savings balance" value="KES 42,000 (range)" />
        <Row label="Contributions" value="KES 1,500/mo" />
        <Row label="Consistency" value="Regular" />
      </InfoCard>
      <InfoCard title="Existing loans" icon="📋" status="Farmer reported">
        <Row label="Lender" value="Githunguri Dairy Co-op" />
        <Row label="Purpose" value="Feed purchase" />
        <Row label="Outstanding" value="KES 18,000" />
        <Row label="Repayment" value="Monthly via milk deduction" />
        <Row label="Status" value="Current" />
        <div className="mt-2 px-2 py-1.5 bg-amber-bg rounded-lg">
          <p className="text-xs text-amber-field">⚠ Needs verification — loan record not yet confirmed with SACCO</p>
        </div>
      </InfoCard>
    </div>
  )
}

function EvidenceTab() {
  const items = [
    { type: "National ID", status: "Verified", date: "06 Jul 2026", icon: "🪪" },
    { type: "Milk delivery statement", status: "Verified", date: "14 Aug 2026", icon: "📄" },
    { type: "Cooperative payment record", status: "Verified", date: "10 Aug 2026", icon: "📋" },
    { type: "Farm photograph", status: "Uploaded", date: "03 Aug 2026", icon: "📸" },
    { type: "Consent form", status: "Verified", date: "06 Jul 2026", icon: "✓" },
    { type: "Input receipt", status: "Needs review", date: "05 Aug 2026", icon: "🧾" },
  ]
  return (
    <div className="px-4 py-5 flex flex-col gap-2.5">
      {items.map(item => (
        <div key={item.type} className="bg-white border border-charcoal-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-lg">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-charcoal truncate">{item.type}</p>
            <p className="text-xs text-charcoal-400">{item.date}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
            item.status === "Verified" ? "bg-brand-light text-brand" :
            item.status === "Uploaded" ? "bg-blue-50 text-blue-700" :
            "bg-amber-bg text-amber-field"
          }`}>{item.status}</span>
        </div>
      ))}
      <button className="w-full border-2 border-dashed border-charcoal-200 rounded-2xl py-4 text-sm text-charcoal-400 font-medium flex items-center justify-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add evidence
      </button>
    </div>
  )
}

function ActivityTab() {
  const events = [
    { date: "14 Aug", icon: "📄", text: "Milk delivery statement added" },
    { date: "11 Aug", icon: "🌾", text: "Dairy production updated" },
    { date: "03 Aug", icon: "📍", text: "Farm 1 boundary verified" },
    { date: "21 Jul", icon: "✓", text: "Profile submitted to sync queue" },
    { date: "06 Jul", icon: "🤝", text: "Consent recorded · Kikuyu" },
    { date: "06 Jul", icon: "👤", text: "Farmer profile created" },
  ]
  return (
    <div className="px-4 py-5">
      <div className="relative pl-8">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-charcoal-100" />
        <div className="space-y-5">
          {events.map((e, i) => (
            <div key={i} className="relative flex items-start gap-3">
              <div className="absolute -left-5 w-4 h-4 rounded-full bg-white border-2 border-charcoal-200 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-brand" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-mono text-charcoal-300 mb-0.5">{e.date} 2026</p>
                <p className="text-sm text-charcoal">{e.icon} {e.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ title, icon, status, children }: { title: string; icon: string; status: string; children: React.ReactNode }) {
  const statusColor = status === "Verified" || status === "Supported by evidence"
    ? "text-brand" : status === "Farmer reported" ? "text-amber-field" : "text-charcoal-300"
  return (
    <div className="bg-white border border-charcoal-100 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <p className="text-sm font-semibold text-charcoal">{title}</p>
        </div>
        <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-charcoal-500 flex-shrink-0">{label}</span>
      <span className={`text-xs text-charcoal text-right ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  )
}

function ActionRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full border-2 border-charcoal-200 flex-shrink-0" />
      <span className="text-sm text-charcoal">{text}</span>
    </div>
  )
}
