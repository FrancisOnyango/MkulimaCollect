interface StatusChipProps {
  isOffline: boolean
  onClick?: () => void
}

export default function StatusChip({ isOffline, onClick }: StatusChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-charcoal-100 text-[11px] font-medium text-charcoal-500"
    >
      <span className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-field" : "bg-brand"}`} />
      {isOffline ? "Offline" : "Online"}
    </button>
  )
}
